"use client";

import { clampScore } from "@/lib/calculations";
import {
  opportunityKeywords,
  type OpportunityType,
  type ParsedOpportunity,
  type RawItem,
  type SignalType,
  type SourceProfile,
} from "@/types/opportunity";

export function findMatchedKeywords(text: string, keywords = opportunityKeywords) {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

const strongKeywords = [
  "airdrop",
  "reward",
  "campaign",
  "task",
  "launchpool",
  "launchpad",
  "points",
  "bonus",
  "promotion",
  "deposit reward",
  "transfer bonus",
  "cash sweep",
  "apy",
  "earnings",
  "guidance",
  "fda approval",
  "merger",
  "unusual volume",
  "pre-market gainer",
  "credits",
  "grant",
  "bounty",
  "hackathon",
  "paid",
  "sponsor",
  "monetization",
];

const weakKeywords = [
  "ai",
  "agent",
  "automation",
  "trading",
  "finance",
  "scraper",
  "dashboard",
  "api",
  "alpha",
  "launch",
  "open source",
  "github",
];

const learningKeywords = ["system-design", "system design", "tutorial", "awesome", "roadmap", "interview", "course", "guide"];

function matchKeywords(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

function inferSignalType(text: string, sourceProfile: SourceProfile): SignalType {
  const normalized = text.toLowerCase();

  if (learningKeywords.some((keyword) => normalized.includes(keyword))) return "learning_resource";
  if (normalized.includes("airdrop")) return "airdrop_notice";
  if (normalized.includes("grant") || normalized.includes("bounty")) return "grant_bounty";
  if (normalized.includes("hackathon")) return "hackathon";
  if (normalized.includes("launchpool") || normalized.includes("launchpad") || normalized.includes("campaign")) return "campaign_notice";
  if (normalized.includes("reward") || normalized.includes("task") || normalized.includes("points") || normalized.includes("credits")) return "reward_task";
  if (normalized.includes("bonus") || normalized.includes("promotion") || normalized.includes("transfer bonus")) return "broker_promotion";
  if (normalized.includes("apy") || normalized.includes("cash sweep") || normalized.includes("earnings")) return "yield_product";
  if (normalized.includes("fda approval") || normalized.includes("merger") || normalized.includes("guidance") || normalized.includes("unusual volume")) {
    return "market_event";
  }
  if (normalized.includes("regulation") || normalized.includes("sec ") || normalized.includes("fda ")) return "regulatory_event";

  if (sourceProfile === "dev_tool_source") {
    if (normalized.includes("launch") || normalized.includes("release")) return "project_launch";
    if (matchKeywords(normalized, weakKeywords).length > 0) return "tooling_signal";
  }

  if (sourceProfile === "exchange_campaign_source") return "campaign_notice";
  if (sourceProfile === "broker_promo_source") return "broker_promotion";
  if (sourceProfile === "market_event_source") return "market_event";
  if (sourceProfile === "grant_bounty_source") return "grant_bounty";

  return "other";
}

function inferOpportunityType(rawItem: RawItem): OpportunityType {
  const normalized = `${rawItem.title}\n${rawItem.rawText}`.toLowerCase();

  if (rawItem.signalType === "airdrop_notice") return "crypto_airdrop";
  if (rawItem.signalType === "campaign_notice" || rawItem.signalType === "reward_task") return "exchange_task";
  if (rawItem.signalType === "broker_promotion") return "broker_bonus";
  if (rawItem.signalType === "yield_product") return "cash_yield";
  if (rawItem.signalType === "grant_bounty" && normalized.includes("grant")) return "grant";
  if (rawItem.signalType === "grant_bounty") return "bounty";
  if (rawItem.signalType === "hackathon") return "hackathon";
  if (rawItem.signalType === "tooling_signal" || rawItem.signalType === "project_launch") return "tool_for_automation";
  if (rawItem.signalType === "market_event" || rawItem.signalType === "regulatory_event") return "stock_event_watch";
  if (normalized.includes("research") || normalized.includes("market")) return "market_research";

  return "other";
}

export function classifyRawItem({
  title,
  rawText,
  sourceProfile,
  sourceKeywords,
}: {
  title: string;
  rawText: string;
  sourceProfile: SourceProfile;
  sourceKeywords: string[];
}) {
  const text = `${title}\n${rawText}`;
  const normalized = text.toLowerCase();
  const matchedStrongKeywords = matchKeywords(text, strongKeywords);
  const matchedWeakKeywords = [...new Set([...matchKeywords(text, weakKeywords), ...findMatchedKeywords(text, sourceKeywords)])];
  const matchedKeywords = [...new Set([...matchedStrongKeywords, ...matchedWeakKeywords])];
  const signalType = inferSignalType(text, sourceProfile);
  const isLearningResource = signalType === "learning_resource";
  const isDevToolSource = sourceProfile === "dev_tool_source";
  const hasMoneySignal = /reward|bonus|apy|earnings|grant|bounty|\$|usd|usdt|credits|paid|sponsor|monetization/.test(normalized);
  const hasTimeWindow = /deadline|until|before|ends|window|launch|start|202\d/.test(normalized);
  const hasRiskSignal = /risk|scam|not guaranteed|volatile|loss|fee|lockup/.test(normalized);
  const profileBoost =
    (sourceProfile === "exchange_campaign_source" && ["campaign_notice", "airdrop_notice", "reward_task"].includes(signalType)) ||
    (sourceProfile === "broker_promo_source" && ["broker_promotion", "yield_product"].includes(signalType)) ||
    (sourceProfile === "market_event_source" && ["market_event", "regulatory_event"].includes(signalType)) ||
    (sourceProfile === "grant_bounty_source" && ["grant_bounty", "hackathon"].includes(signalType)) ||
    (sourceProfile === "dev_tool_source" && ["tooling_signal", "project_launch", "learning_resource"].includes(signalType));
  const noiseScore = clampScore(
    (isLearningResource ? 55 : 0) +
      (matchedStrongKeywords.length === 0 ? 18 : 0) +
      (hasRiskSignal ? 12 : 0) +
      (signalType === "other" ? 20 : 0),
  );
  const devToolOpportunityCap = isDevToolSource && !/(bounty|grant|hackathon|credits|paid|sponsor|monetization)/.test(normalized);
  const signalScore = clampScore(
    matchedStrongKeywords.length * 18 +
      matchedWeakKeywords.length * 7 +
      (profileBoost ? 12 : 0) +
      (hasMoneySignal ? 12 : 0) +
      (hasTimeWindow ? 8 : 0) -
      noiseScore -
      (devToolOpportunityCap ? 8 : 0),
  );
  const confidenceScore = clampScore(35 + matchedStrongKeywords.length * 12 + (profileBoost ? 15 : 0) - (signalType === "other" ? 20 : 0));
  const classificationReason = [
    `来源画像：${sourceProfile}`,
    `分类：${signalType}`,
    matchedStrongKeywords.length ? `强关键词：${matchedStrongKeywords.join(", ")}` : "",
    matchedWeakKeywords.length ? `弱关键词：${matchedWeakKeywords.slice(0, 6).join(", ")}` : "",
    isLearningResource ? "学习资源降权" : "",
    devToolOpportunityCap ? "开发工具源未命中奖励/赏金/商业化信号，仅作为线索" : "",
  ]
    .filter(Boolean)
    .join("；");

  return {
    matchedKeywords,
    signalType,
    signalScore,
    confidenceScore,
    noiseScore,
    matchedWeakKeywords,
    matchedStrongKeywords,
    classificationReason,
  };
}

function inferPlatform(url?: string, sourceName?: string) {
  if (!url) {
    return sourceName;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return sourceName;
  }
}

function extractMoney(text: string) {
  const match = text.match(/(?:\$|usd\s*)\s?([\d,.]+)|([\d,.]+)\s?(?:usd|usdt|credits|points)/i);
  if (!match) {
    return undefined;
  }

  return Number((match[1] || match[2] || "").replaceAll(",", ""));
}

function extractDate(text: string) {
  const match = text.match(/\b(20\d{2}[-/.]\d{1,2}[-/.]\d{1,2})\b/);
  return match?.[1]?.replaceAll("/", "-").replaceAll(".", "-");
}

export function parseOpportunity(rawItem: RawItem): ParsedOpportunity | null {
  const text = `${rawItem.title}\n${rawItem.rawText}`;
  const matchedStrongKeywords = rawItem.matchedStrongKeywords ?? [];
  const matchedKeywords = rawItem.matchedKeywords.length > 0 ? rawItem.matchedKeywords : findMatchedKeywords(text);

  if (matchedKeywords.length === 0) {
    return null;
  }

  const normalized = text.toLowerCase();
  const hasMoneySignal = /reward|bonus|apy|earnings|grant|bounty|\$|usd|usdt|credits|points|paid|sponsor|monetization/.test(normalized);
  const hasTimeWindow = /deadline|until|before|ends|window|launch|start|202\d/.test(normalized);
  const hasRiskSignal = /risk|scam|not guaranteed|volatile|loss|fee|lockup/.test(normalized);
  const opportunityType = inferOpportunityType(rawItem);
  const isDevToolWithoutMoney = ["tooling_signal", "project_launch", "learning_resource"].includes(rawItem.signalType) && !hasMoneySignal;
  const riskScore = clampScore((hasRiskSignal ? 35 : 10) + (rawItem.noiseScore ?? 0) * 0.35);
  const experimentScore = clampScore(
    (hasMoneySignal ? 30 : 0) +
      (hasTimeWindow ? 15 : 0) +
      matchedStrongKeywords.length * 10 +
      (opportunityType === "tool_for_automation" ? 18 : 0) -
      riskScore * 0.4,
  );
  const opportunityScore = clampScore(
    (rawItem.signalScore ?? 0) * 0.35 +
      experimentScore * 0.45 +
      (rawItem.confidenceScore ?? 0) * 0.2 -
      (isDevToolWithoutMoney ? 35 : 0),
  );

  return {
    title: rawItem.title,
    sourceUrl: rawItem.url,
    platform: inferPlatform(rawItem.url, rawItem.sourceName),
    opportunityType,
    description: rawItem.rawText.slice(0, 700),
    windowStart: rawItem.publishedAt?.slice(0, 10),
    windowEnd: extractDate(rawItem.rawText),
    capitalRequired: normalized.includes("deposit") ? extractMoney(text) : undefined,
    expectedReward: extractMoney(text),
    estimatedFees: normalized.includes("gas") || normalized.includes("fee") ? 5 : undefined,
    risks: hasRiskSignal ? "文本中出现风险、费用、锁仓或不保证收益等信号，需要人工确认。" : "",
    confidenceScore: rawItem.confidenceScore,
    opportunityScore,
    riskScore,
    experimentScore,
    status: "candidate",
  };
}

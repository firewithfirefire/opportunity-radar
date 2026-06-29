"use client";

import { calculateOpportunityScore, clampScore } from "@/lib/calculations";
import {
  opportunityKeywords,
  type OpportunityType,
  type ParsedOpportunity,
  type RawItem,
} from "@/types/opportunity";

export function findMatchedKeywords(text: string, keywords = opportunityKeywords) {
  const normalized = text.toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
}

function inferType(text: string): OpportunityType {
  const normalized = text.toLowerCase();

  if (normalized.includes("airdrop") || normalized.includes("points")) return "airdrop";
  if (normalized.includes("launchpool") || normalized.includes("launchpad")) return "campaign";
  if (normalized.includes("apy") || normalized.includes("earnings") || normalized.includes("cash sweep")) return "yield";
  if (normalized.includes("grant")) return "grant";
  if (normalized.includes("bounty")) return "bounty";
  if (normalized.includes("hackathon")) return "hackathon";
  if (normalized.includes("merger") || normalized.includes("fda approval") || normalized.includes("unusual volume")) return "market_event";
  if (normalized.includes("bonus") || normalized.includes("promotion") || normalized.includes("credits")) return "promotion";
  if (normalized.includes("pre-market gainer")) return "trading";

  return "other";
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
  const matchedKeywords = rawItem.matchedKeywords.length > 0 ? rawItem.matchedKeywords : findMatchedKeywords(text);

  if (matchedKeywords.length === 0) {
    return null;
  }

  const normalized = text.toLowerCase();
  const hasMoneySignal = /reward|bonus|apy|earnings|grant|bounty|\$|usd|usdt|credits|points/.test(normalized);
  const hasTimeWindow = /deadline|until|before|ends|window|launch|start|202\d/.test(normalized);
  const hasRiskSignal = /risk|scam|not guaranteed|volatile|loss|fee|lockup/.test(normalized);
  const confidenceScore = clampScore(35 + matchedKeywords.length * 10 + (hasMoneySignal ? 15 : 0) + (hasTimeWindow ? 10 : 0));
  const opportunityScore = calculateOpportunityScore({
    matchedKeywordCount: matchedKeywords.length,
    hasMoneySignal,
    hasTimeWindow,
    hasRiskSignal,
    confidenceScore,
  });

  return {
    title: rawItem.title,
    sourceUrl: rawItem.url,
    platform: inferPlatform(rawItem.url, rawItem.sourceName),
    type: inferType(text),
    description: rawItem.rawText.slice(0, 700),
    windowStart: rawItem.publishedAt?.slice(0, 10),
    windowEnd: extractDate(rawItem.rawText),
    capitalRequired: normalized.includes("deposit") ? extractMoney(text) : undefined,
    expectedReward: extractMoney(text),
    estimatedFees: normalized.includes("gas") || normalized.includes("fee") ? 5 : undefined,
    risks: hasRiskSignal ? "文本中出现风险、费用、锁仓或不保证收益等信号，需要人工确认。" : "",
    confidenceScore,
    opportunityScore,
    status: "candidate",
  };
}

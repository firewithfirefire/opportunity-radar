"use client";

import { create } from "zustand";
import { db } from "@/lib/db";
import { calculateNetProfit, calculateRecommendation, calculateTotalScore } from "@/lib/calculations";
import { fetchSource } from "@/lib/fetch-source";
import { parseOpportunity } from "@/lib/parser";
import {
  emptyScore,
  type Experiment,
  type ExperimentInput,
  type Opportunity,
  type OpportunityAnalysis,
  type OpportunityInput,
  type OpportunityScore,
  type OpportunityType,
  type RawItem,
  type SignalType,
  type Source,
  type SourceInput,
  type SourceProfile,
} from "@/types/opportunity";

type OpportunityState = {
  sources: Source[];
  rawItems: RawItem[];
  opportunities: Opportunity[];
  experiments: Experiment[];
  isLoading: boolean;
  loadAll: () => Promise<void>;
  addSource: (input: SourceInput) => Promise<number>;
  updateSource: (id: number, updates: Partial<Source>) => Promise<void>;
  deleteSource: (id: number) => Promise<void>;
  collectSource: (id: number) => Promise<{ rawCount: number; newRawCount: number }>;
  collectEnabledSources: () => Promise<{ rawCount: number; newRawCount: number }>;
  collectDueSources: () => Promise<{ rawCount: number; newRawCount: number }>;
  createOpportunityFromRawItem: (rawItemId: number) => Promise<number>;
  addOpportunity: (input: OpportunityInput) => Promise<number>;
  updateOpportunity: (id: number, updates: Partial<Opportunity>) => Promise<void>;
  deleteOpportunity: (id: number) => Promise<void>;
  updateAnalysisAndScore: (
    id: number,
    analysis: OpportunityAnalysis,
    score: OpportunityScore,
  ) => Promise<void>;
  addExperiment: (opportunityId: number, input: ExperimentInput) => Promise<number>;
  getOpportunity: (id: number) => Opportunity | undefined;
  getExperimentsByOpportunity: (opportunityId: number) => Experiment[];
};

const now = () => new Date().toISOString();
const defaultSourceProfile: SourceProfile = "general_news_source";

const defaultSources: SourceInput[] = [
  {
    name: "Hacker News",
    type: "rss",
    sourceProfile: "dev_tool_source",
    url: "https://news.ycombinator.com/rss",
    enabled: true,
    keywords: ["ai", "startup", "open source", "funding", "launch", "product", "api", "tool"],
    refreshInterval: 360,
  },
  {
    name: "HN Jobs",
    type: "rss",
    sourceProfile: "general_news_source",
    url: "https://hnrss.org/jobs",
    enabled: true,
    keywords: ["hiring", "remote", "contract", "freelance", "frontend", "ai", "startup"],
    refreshInterval: 720,
  },
  {
    name: "Cointelegraph",
    type: "rss",
    sourceProfile: "crypto_news_source",
    url: "https://cointelegraph.com/rss",
    enabled: true,
    keywords: ["airdrop", "reward", "campaign", "token", "listing", "exchange", "launchpool", "ETF"],
    refreshInterval: 360,
  },
];

async function ensureDefaultSources() {
  const timestamp = now();

  for (const source of defaultSources) {
    const existing = await db.sources.where("name").equals(source.name).first();
    if (existing) {
      await db.sources.update(existing.id as number, {
        sourceProfile: existing.sourceProfile ?? source.sourceProfile,
        updatedAt: existing.updatedAt ?? timestamp,
      });
      continue;
    }

    await db.sources.add({
      ...source,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

function normalizeRawItem(item: RawItem): RawItem {
  return {
    ...item,
    signalType: item.signalType ?? "other",
    signalScore: item.signalScore ?? 0,
    confidenceScore: item.confidenceScore ?? 0,
    noiseScore: item.noiseScore ?? 0,
    matchedWeakKeywords: item.matchedWeakKeywords ?? [],
    matchedStrongKeywords: item.matchedStrongKeywords ?? item.matchedKeywords ?? [],
    classificationReason: item.classificationReason ?? "旧数据：暂无分类说明",
  };
}

function mapLegacyOpportunityType(value: unknown): OpportunityType {
  const legacy = String(value || "other");
  const map: Record<string, OpportunityType> = {
    airdrop: "crypto_airdrop",
    campaign: "exchange_task",
    trading: "stock_event_watch",
    yield: "cash_yield",
    grant: "grant",
    bounty: "bounty",
    hackathon: "hackathon",
    market_event: "stock_event_watch",
    promotion: "broker_bonus",
    other: "other",
  };

  return map[legacy] ?? (legacy as OpportunityType);
}

function normalizeOpportunity(opportunity: Opportunity & { type?: unknown }): Opportunity {
  return {
    ...opportunity,
    opportunityType: opportunity.opportunityType ?? mapLegacyOpportunityType(opportunity.type),
    riskScore: opportunity.riskScore ?? 0,
    experimentScore: opportunity.experimentScore ?? 0,
    confirmedByUser: opportunity.confirmedByUser ?? !opportunity.rawItemId,
  };
}

export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  sources: [],
  rawItems: [],
  opportunities: [],
  experiments: [],
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    await ensureDefaultSources();
    const [sources, rawItems, opportunities, experiments] = await Promise.all([
      db.sources.orderBy("updatedAt").reverse().toArray(),
      db.rawItems.orderBy("fetchedAt").reverse().toArray(),
      db.opportunities.orderBy("updatedAt").reverse().toArray(),
      db.experiments.orderBy("createdAt").reverse().toArray(),
    ]);
    set({
      sources: sources.map((source) => ({ ...source, sourceProfile: source.sourceProfile ?? defaultSourceProfile })),
      rawItems: rawItems.map(normalizeRawItem),
      opportunities: opportunities.map((opportunity) => normalizeOpportunity(opportunity as Opportunity & { type?: unknown })),
      experiments,
      isLoading: false,
    });
  },

  addSource: async (input) => {
    const timestamp = now();
    const id = await db.sources.add({
      ...input,
      sourceProfile: input.sourceProfile ?? defaultSourceProfile,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await get().loadAll();
    return id;
  },

  updateSource: async (id, updates) => {
    await db.sources.update(id, {
      ...updates,
      updatedAt: now(),
    });
    await get().loadAll();
  },

  deleteSource: async (id) => {
    await db.sources.delete(id);
    await get().loadAll();
  },

  collectSource: async (id) => {
    const source = await db.sources.get(id);
    if (!source) {
      throw new Error("没有找到这个来源");
    }

    const result = await fetchSource({ ...source, sourceProfile: source.sourceProfile ?? defaultSourceProfile });
    const timestamp = now();
    let newRawCount = 0;

    await db.transaction("rw", db.sources, db.rawItems, async () => {
      for (const rawItem of result.rawItems) {
        const existing = rawItem.url
          ? await db.rawItems.where("url").equals(rawItem.url).first()
          : await db.rawItems.where("title").equals(rawItem.title).first();

        if (existing) {
          continue;
        }

        await db.rawItems.add({ ...rawItem, status: "new" });
        newRawCount += 1;
      }

      await db.sources.update(id, {
        lastFetchedAt: timestamp,
        lastFetchStatus: `新增 ${newRawCount} 条原始信息`,
        updatedAt: timestamp,
      });
    });

    await get().loadAll();
    return { rawCount: result.rawItems.length, newRawCount };
  },

  collectEnabledSources: async () => {
    const enabled = get().sources.filter((source) => source.enabled && source.id);
    let rawCount = 0;
    let newRawCount = 0;

    for (const source of enabled) {
      const result = await get().collectSource(source.id as number);
      rawCount += result.rawCount;
      newRawCount += result.newRawCount;
    }

    return { rawCount, newRawCount };
  },

  collectDueSources: async () => {
    const nowMs = Date.now();
    const dueSources = get().sources.filter((source) => {
      if (!source.enabled || !source.id) {
        return false;
      }

      if (!source.lastFetchedAt) {
        return true;
      }

      const intervalMs = source.refreshInterval * 60 * 1000;
      return nowMs - new Date(source.lastFetchedAt).getTime() >= intervalMs;
    });
    let rawCount = 0;
    let newRawCount = 0;

    for (const source of dueSources) {
      const result = await get().collectSource(source.id as number);
      rawCount += result.rawCount;
      newRawCount += result.newRawCount;
    }

    return { rawCount, newRawCount };
  },

  createOpportunityFromRawItem: async (rawItemId) => {
    const rawItem = await db.rawItems.get(rawItemId);
    if (!rawItem) {
      throw new Error("没有找到这条原始信息");
    }

    const existing = await db.opportunities.where("rawItemId").equals(rawItemId).first();
    if (existing?.id) {
      await db.opportunities.update(existing.id, { confirmedByUser: true, updatedAt: now() });
      await db.rawItems.update(rawItemId, { status: "parsed" });
      await get().loadAll();
      return existing.id;
    }

    const parsed = parseOpportunity(normalizeRawItem(rawItem));
    if (!parsed) {
      throw new Error("这条原始信息没有匹配到关键词，暂时不能生成机会");
    }

    const timestamp = now();
    const totalScore = calculateTotalScore(emptyScore);
    const id = await db.transaction("rw", db.rawItems, db.opportunities, async () => {
      const opportunityId = await db.opportunities.add({
        ...parsed,
        rawItemId,
        status: "candidate",
        analysis: {},
        score: emptyScore,
        totalScore,
        recommendation: calculateRecommendation(totalScore),
        confirmedByUser: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await db.rawItems.update(rawItemId, { status: "parsed" });
      return opportunityId;
    });

    await get().loadAll();
    return id;
  },

  addOpportunity: async (input) => {
    const timestamp = now();
    const totalScore = calculateTotalScore(emptyScore);
    const id = await db.opportunities.add({
      ...input,
      rawItemId: undefined,
      confidenceScore: 0,
      opportunityScore: 0,
      riskScore: 0,
      experimentScore: 0,
      confirmedByUser: true,
      analysis: {},
      score: emptyScore,
      totalScore,
      recommendation: calculateRecommendation(totalScore),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await get().loadAll();
    return id;
  },

  updateOpportunity: async (id, updates) => {
    await db.opportunities.update(id, {
      ...updates,
      updatedAt: now(),
    });
    await get().loadAll();
  },

  deleteOpportunity: async (id) => {
    await db.transaction("rw", db.opportunities, db.experiments, async () => {
      await db.opportunities.delete(id);
      await db.experiments.where("opportunityId").equals(id).delete();
    });
    await get().loadAll();
  },

  updateAnalysisAndScore: async (id, analysis, score) => {
    const totalScore = calculateTotalScore(score);
    await db.opportunities.update(id, {
      analysis,
      score,
      totalScore,
      recommendation: calculateRecommendation(totalScore),
      updatedAt: now(),
    });
    await get().loadAll();
  },

  addExperiment: async (opportunityId, input) => {
    const timestamp = now();
    const netProfit = calculateNetProfit(input);
    const id = await db.experiments.add({
      ...input,
      opportunityId,
      netProfit,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await db.opportunities.update(opportunityId, { status: "testing", updatedAt: timestamp });
    await get().loadAll();
    return id;
  },

  getOpportunity: (id) => get().opportunities.find((opportunity) => opportunity.id === id),

  getExperimentsByOpportunity: (opportunityId) =>
    get().experiments.filter((experiment) => experiment.opportunityId === opportunityId),
}));

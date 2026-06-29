"use client";

import { create } from "zustand";
import { db } from "@/lib/db";
import { calculateNetProfit, calculateRecommendation, calculateTotalScore } from "@/lib/calculations";
import { fetchSource } from "@/lib/fetch-source";
import {
  emptyScore,
  type Experiment,
  type ExperimentInput,
  type Opportunity,
  type OpportunityAnalysis,
  type OpportunityInput,
  type OpportunityScore,
  type RawItem,
  type Source,
  type SourceInput,
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
  collectSource: (id: number) => Promise<{ rawCount: number; opportunityCount: number }>;
  collectEnabledSources: () => Promise<{ rawCount: number; opportunityCount: number }>;
  collectDueSources: () => Promise<{ rawCount: number; opportunityCount: number }>;
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

export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  sources: [],
  rawItems: [],
  opportunities: [],
  experiments: [],
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true });
    const [sources, rawItems, opportunities, experiments] = await Promise.all([
      db.sources.orderBy("updatedAt").reverse().toArray(),
      db.rawItems.orderBy("fetchedAt").reverse().toArray(),
      db.opportunities.orderBy("updatedAt").reverse().toArray(),
      db.experiments.orderBy("createdAt").reverse().toArray(),
    ]);
    set({ sources, rawItems, opportunities, experiments, isLoading: false });
  },

  addSource: async (input) => {
    const timestamp = now();
    const id = await db.sources.add({
      ...input,
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

    const result = await fetchSource(source);
    const timestamp = now();
    let opportunityCount = 0;

    await db.transaction("rw", db.sources, db.rawItems, db.opportunities, async () => {
      for (const rawItem of result.rawItems) {
        const existing = rawItem.url
          ? await db.rawItems.where("url").equals(rawItem.url).first()
          : await db.rawItems.where("title").equals(rawItem.title).first();

        if (existing) {
          continue;
        }

        const parsed = result.opportunities.find(
          (opportunity) => opportunity.title === rawItem.title && opportunity.sourceUrl === rawItem.url,
        );
        const rawItemId = await db.rawItems.add({ ...rawItem, status: parsed ? "parsed" : "new" });

        if (parsed) {
          await db.opportunities.add({
            ...parsed,
            rawItemId,
            analysis: {},
            score: emptyScore,
            totalScore: calculateTotalScore(emptyScore),
            recommendation: calculateRecommendation(calculateTotalScore(emptyScore)),
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          opportunityCount += 1;
        }
      }

      await db.sources.update(id, {
        lastFetchedAt: timestamp,
        lastFetchStatus: `新增 ${opportunityCount} 个候选机会`,
        updatedAt: timestamp,
      });
    });

    await get().loadAll();
    return { rawCount: result.rawItems.length, opportunityCount };
  },

  collectEnabledSources: async () => {
    const enabled = get().sources.filter((source) => source.enabled && source.id);
    let rawCount = 0;
    let opportunityCount = 0;

    for (const source of enabled) {
      const result = await get().collectSource(source.id as number);
      rawCount += result.rawCount;
      opportunityCount += result.opportunityCount;
    }

    return { rawCount, opportunityCount };
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
    let opportunityCount = 0;

    for (const source of dueSources) {
      const result = await get().collectSource(source.id as number);
      rawCount += result.rawCount;
      opportunityCount += result.opportunityCount;
    }

    return { rawCount, opportunityCount };
  },

  addOpportunity: async (input) => {
    const timestamp = now();
    const totalScore = calculateTotalScore(emptyScore);
    const id = await db.opportunities.add({
      ...input,
      rawItemId: undefined,
      confidenceScore: 0,
      opportunityScore: 0,
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

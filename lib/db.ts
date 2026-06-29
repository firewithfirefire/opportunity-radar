"use client";

import Dexie, { type Table } from "dexie";
import type { Experiment, Opportunity, RawItem, Source } from "@/types/opportunity";

class OpportunityRadarDB extends Dexie {
  sources!: Table<Source, number>;
  rawItems!: Table<RawItem, number>;
  opportunities!: Table<Opportunity, number>;
  experiments!: Table<Experiment, number>;

  constructor() {
    super("OpportunityRadarDB");

    this.version(5).stores({
      sources: "++id, name, type, sourceProfile, enabled, lastFetchedAt, updatedAt",
      rawItems: "++id, title, url, sourceName, sourceType, publishedAt, fetchedAt, signalType, signalScore, confidenceScore, noiseScore, status",
      opportunities: "++id, rawItemId, title, platform, opportunityType, status, opportunityScore, riskScore, experimentScore, createdAt, updatedAt",
      experiments: "++id, opportunityId, startedAt, endedAt, netProfit, createdAt, updatedAt",
    });

    this.version(6)
      .stores({
        sources: "++id, name, type, sourceProfile, enabled, lastFetchedAt, updatedAt",
        rawItems: "++id, title, url, sourceName, sourceType, publishedAt, fetchedAt, signalType, signalScore, confidenceScore, noiseScore, status",
        opportunities: "++id, rawItemId, title, platform, opportunityType, status, opportunityScore, riskScore, experimentScore, createdAt, updatedAt",
        experiments: "++id, opportunityId, startedAt, endedAt, netProfit, createdAt, updatedAt",
      })
      .upgrade(async (transaction) => {
        await transaction.table("rawItems").clear();
        await transaction.table("opportunities").clear();
        await transaction.table("experiments").clear();
        await transaction.table("sources").toCollection().modify((source) => {
          delete source.lastFetchedAt;
          source.lastFetchStatus = "旧数据已清空，等待重新抓取";
        });
      });
  }
}

export const db = new OpportunityRadarDB();

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

    this.version(3).stores({
      sources: "++id, name, type, enabled, lastFetchedAt, updatedAt",
      rawItems: "++id, title, url, sourceName, sourceType, publishedAt, fetchedAt, status",
      opportunities: "++id, rawItemId, title, platform, type, status, totalScore, recommendation, createdAt, updatedAt",
      experiments: "++id, opportunityId, startedAt, endedAt, netProfit, createdAt, updatedAt",
    });
  }
}

export const db = new OpportunityRadarDB();

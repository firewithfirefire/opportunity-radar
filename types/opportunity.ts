export type SourceType = "rss" | "website" | "api" | "manual_text";

export type RawItemStatus = "new" | "parsed" | "ignored";

export type OpportunityStatus = "candidate" | "researching" | "testing" | "ignored" | "completed";

export type OpportunityType =
  | "airdrop"
  | "campaign"
  | "trading"
  | "yield"
  | "grant"
  | "bounty"
  | "hackathon"
  | "market_event"
  | "promotion"
  | "other";

export type Recommendation = "strong_go" | "test_small" | "watch" | "skip";

export type Source = {
  id?: number;
  name: string;
  type: SourceType;
  url: string;
  enabled: boolean;
  keywords: string[];
  refreshInterval: number;
  lastFetchedAt?: string;
  lastFetchStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type SourceInput = Pick<Source, "name" | "type" | "url" | "enabled" | "keywords" | "refreshInterval">;

export type RawItem = {
  id?: number;
  title: string;
  url?: string;
  sourceName: string;
  sourceType: SourceType;
  publishedAt?: string;
  rawText: string;
  fetchedAt: string;
  matchedKeywords: string[];
  status: RawItemStatus;
};

export type OpportunityAnalysis = {
  targetUser?: string;
  painPoint?: string;
  whyNow?: string;
  acquisitionChannel?: string;
  monetizationPath?: string;
  riskNotes?: string;
  keyAssumption?: string;
};

export type OpportunityScore = {
  marketDemand: number;
  timing: number;
  executionEase: number;
  upside: number;
  moat: number;
  riskControl: number;
};

export type Opportunity = {
  id?: number;
  rawItemId?: number;
  title: string;
  sourceUrl?: string;
  platform?: string;
  type: OpportunityType;
  description?: string;
  windowStart?: string;
  windowEnd?: string;
  capitalRequired?: number;
  expectedReward?: number;
  estimatedFees?: number;
  risks?: string;
  confidenceScore: number;
  opportunityScore: number;
  status: OpportunityStatus;
  analysis: OpportunityAnalysis;
  score: OpportunityScore;
  totalScore: number;
  recommendation: Recommendation;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityInput = Pick<
  Opportunity,
  "title" | "sourceUrl" | "platform" | "type" | "description" | "windowStart" | "windowEnd" | "status"
>;

export type ParsedOpportunity = Omit<
  Opportunity,
  "id" | "rawItemId" | "createdAt" | "updatedAt" | "analysis" | "score" | "totalScore" | "recommendation"
>;

export type Experiment = {
  id?: number;
  opportunityId: number;
  capitalUsed: number;
  startedAt?: string;
  endedAt?: string;
  actualReward: number;
  actualFees: number;
  gasCost: number;
  slippageCost: number;
  timeSpentHours: number;
  timeCost: number;
  rewardReceived: boolean;
  issues?: string;
  review?: string;
  nextAction?: string;
  netProfit: number;
  createdAt: string;
  updatedAt: string;
};

export type ExperimentInput = Omit<Experiment, "id" | "opportunityId" | "netProfit" | "createdAt" | "updatedAt">;

export const emptyScore: OpportunityScore = {
  marketDemand: 0,
  timing: 0,
  executionEase: 0,
  upside: 0,
  moat: 0,
  riskControl: 0,
};

export const opportunityKeywords = [
  "airdrop",
  "reward",
  "campaign",
  "task",
  "launchpool",
  "launchpad",
  "alpha",
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
];

export const sourceTypeLabels: Record<SourceType, string> = {
  rss: "RSS",
  website: "网页",
  api: "公开 API",
  manual_text: "手动文本",
};

export const rawItemStatusLabels: Record<RawItemStatus, string> = {
  new: "新抓取",
  parsed: "已解析",
  ignored: "已忽略",
};

export const statusLabels: Record<OpportunityStatus, string> = {
  candidate: "候选",
  researching: "研究中",
  testing: "实验中",
  ignored: "已忽略",
  completed: "已完成",
};

export const opportunityStatusLabels = statusLabels;

export const recommendationLabels: Record<Recommendation, string> = {
  strong_go: "强烈推进",
  test_small: "小额测试",
  watch: "继续观察",
  skip: "跳过",
};

export const typeLabels: Record<OpportunityType, string> = {
  airdrop: "空投",
  campaign: "活动",
  trading: "交易机会",
  yield: "收益",
  grant: "Grant",
  bounty: "赏金",
  hackathon: "黑客松",
  market_event: "市场事件",
  promotion: "促销",
  other: "其他",
};

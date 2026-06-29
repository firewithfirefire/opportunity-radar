export type SourceType = "rss" | "website" | "api" | "manual_text";

export type SourceProfile =
  | "exchange_campaign_source"
  | "crypto_news_source"
  | "broker_promo_source"
  | "market_event_source"
  | "dev_tool_source"
  | "grant_bounty_source"
  | "general_news_source";

export type RawItemStatus = "new" | "parsed" | "ignored";

export type OpportunityStatus = "candidate" | "researching" | "testing" | "ignored" | "completed";

export type OpportunityType =
  | "crypto_airdrop"
  | "exchange_task"
  | "broker_bonus"
  | "cash_yield"
  | "grant"
  | "bounty"
  | "hackathon"
  | "tool_for_automation"
  | "market_research"
  | "stock_event_watch"
  | "other";

export type SignalType =
  | "campaign_notice"
  | "airdrop_notice"
  | "reward_task"
  | "grant_bounty"
  | "hackathon"
  | "broker_promotion"
  | "yield_product"
  | "market_event"
  | "tooling_signal"
  | "project_launch"
  | "regulatory_event"
  | "learning_resource"
  | "noise"
  | "other";

export type Recommendation = "strong_go" | "test_small" | "watch" | "skip";

export type Source = {
  id?: number;
  name: string;
  type: SourceType;
  sourceProfile: SourceProfile;
  url: string;
  enabled: boolean;
  keywords: string[];
  refreshInterval: number;
  lastFetchedAt?: string;
  lastFetchStatus?: string;
  createdAt: string;
  updatedAt: string;
};

export type SourceInput = Pick<Source, "name" | "type" | "sourceProfile" | "url" | "enabled" | "keywords" | "refreshInterval">;

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
  signalType: SignalType;
  signalScore: number;
  confidenceScore: number;
  noiseScore: number;
  matchedWeakKeywords: string[];
  matchedStrongKeywords: string[];
  classificationReason: string;
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
  opportunityType: OpportunityType;
  description?: string;
  windowStart?: string;
  windowEnd?: string;
  capitalRequired?: number;
  expectedReward?: number;
  estimatedFees?: number;
  risks?: string;
  confidenceScore: number;
  opportunityScore: number;
  riskScore: number;
  experimentScore: number;
  confirmedByUser: boolean;
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
  "title" | "sourceUrl" | "platform" | "opportunityType" | "description" | "windowStart" | "windowEnd" | "status"
>;

export type ParsedOpportunity = Omit<
  Opportunity,
  "id" | "rawItemId" | "createdAt" | "updatedAt" | "analysis" | "score" | "totalScore" | "recommendation" | "confirmedByUser"
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

export const sourceProfileLabels: Record<SourceProfile, string> = {
  exchange_campaign_source: "交易所活动源",
  crypto_news_source: "加密新闻源",
  broker_promo_source: "券商促销源",
  market_event_source: "市场事件源",
  dev_tool_source: "开发工具源",
  grant_bounty_source: "Grant/赏金源",
  general_news_source: "通用新闻源",
};

export const rawItemStatusLabels: Record<RawItemStatus, string> = {
  new: "新抓取",
  parsed: "已生成机会",
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
  crypto_airdrop: "币圈空投",
  exchange_task: "交易所任务",
  broker_bonus: "券商奖励",
  cash_yield: "现金收益",
  grant: "Grant",
  bounty: "赏金",
  hackathon: "黑客松",
  tool_for_automation: "自动化工具",
  market_research: "市场研究",
  stock_event_watch: "美股事件观察",
  other: "其他",
};

export const signalTypeLabels: Record<SignalType, string> = {
  campaign_notice: "活动公告",
  airdrop_notice: "空投公告",
  reward_task: "奖励任务",
  grant_bounty: "Grant/赏金",
  hackathon: "黑客松",
  broker_promotion: "券商促销",
  yield_product: "收益产品",
  market_event: "市场事件",
  tooling_signal: "工具线索",
  project_launch: "项目发布",
  regulatory_event: "监管事件",
  learning_resource: "学习资源",
  noise: "噪音",
  other: "其他",
};

import type { Recommendation } from "@/types/opportunity";

export function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeScore(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(10, Math.max(0, Number(value.toFixed(1))));
}

export function calculateTotalScore(score: {
  marketDemand: number;
  timing: number;
  executionEase: number;
  upside: number;
  moat: number;
  riskControl: number;
}) {
  const weighted =
    score.marketDemand * 0.24 +
    score.timing * 0.16 +
    score.executionEase * 0.16 +
    score.upside * 0.2 +
    score.moat * 0.12 +
    score.riskControl * 0.12;

  return Number(weighted.toFixed(1));
}

export function calculateRecommendation(totalScore: number): Recommendation {
  if (totalScore >= 8) return "strong_go";
  if (totalScore >= 6) return "test_small";
  if (totalScore >= 4) return "watch";
  return "skip";
}

export function calculateOpportunityScore({
  matchedKeywordCount,
  hasMoneySignal,
  hasTimeWindow,
  hasRiskSignal,
  confidenceScore,
}: {
  matchedKeywordCount: number;
  hasMoneySignal: boolean;
  hasTimeWindow: boolean;
  hasRiskSignal: boolean;
  confidenceScore: number;
}) {
  const keywordScore = Math.min(35, matchedKeywordCount * 8);
  const moneyScore = hasMoneySignal ? 20 : 0;
  const timeScore = hasTimeWindow ? 15 : 0;
  const confidence = confidenceScore * 0.25;
  const riskPenalty = hasRiskSignal ? 10 : 0;

  return clampScore(keywordScore + moneyScore + timeScore + confidence + 20 - riskPenalty);
}

export function calculateNetProfit({
  actualReward,
  actualFees,
  gasCost,
  slippageCost,
  timeCost,
}: {
  actualReward: number;
  actualFees: number;
  gasCost: number;
  slippageCost: number;
  timeCost: number;
}) {
  return Number((actualReward - actualFees - gasCost - slippageCost - timeCost).toFixed(2));
}

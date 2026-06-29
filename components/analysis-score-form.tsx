"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { calculateRecommendation, calculateTotalScore, normalizeScore } from "@/lib/calculations";
import { buttonClass, Field, inputClass, RecommendationBadge } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import {
  recommendationLabels,
  type Opportunity,
  type OpportunityAnalysis,
  type OpportunityScore,
} from "@/types/opportunity";

const analysisFields: Array<{ key: keyof OpportunityAnalysis; label: string }> = [
  { key: "targetUser", label: "目标用户" },
  { key: "painPoint", label: "痛点" },
  { key: "whyNow", label: "为什么现在" },
  { key: "acquisitionChannel", label: "获客渠道" },
  { key: "monetizationPath", label: "变现路径" },
  { key: "riskNotes", label: "风险备注" },
  { key: "keyAssumption", label: "关键假设" },
];

const scoreFields: Array<{ key: keyof OpportunityScore; label: string }> = [
  { key: "marketDemand", label: "市场需求" },
  { key: "timing", label: "时机" },
  { key: "executionEase", label: "执行容易度" },
  { key: "upside", label: "收益上限" },
  { key: "moat", label: "壁垒" },
  { key: "riskControl", label: "风险可控" },
];

export function AnalysisScoreForm({ opportunity }: { opportunity: Opportunity }) {
  const updateAnalysisAndScore = useOpportunityStore((state) => state.updateAnalysisAndScore);
  const [analysis, setAnalysis] = useState<OpportunityAnalysis>(opportunity.analysis);
  const [score, setScore] = useState<OpportunityScore>(opportunity.score);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setAnalysis(opportunity.analysis);
    setScore(opportunity.score);
  }, [opportunity]);

  const previewTotal = useMemo(() => calculateTotalScore(score), [score]);
  const previewRecommendation = useMemo(() => calculateRecommendation(previewTotal), [previewTotal]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!opportunity.id) {
      return;
    }

    setIsSaving(true);
    await updateAnalysisAndScore(opportunity.id, analysis, score);
    setIsSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <section className="rounded-md border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-950">结构化分析</h2>
          <button type="submit" className={buttonClass} disabled={isSaving}>
            <Save size={16} />
            保存分析
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {analysisFields.map((field) => (
            <Field key={field.key} label={field.label}>
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={analysis[field.key] ?? ""}
                onChange={(event) => setAnalysis((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            </Field>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-neutral-950">评分</h2>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold text-neutral-950">{previewTotal.toFixed(1)}</span>
            <RecommendationBadge recommendation={previewRecommendation} />
            <span className="sr-only">{recommendationLabels[previewRecommendation]}</span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {scoreFields.map((field) => (
            <Field key={field.key} label={`${field.label} 0-10`}>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={score[field.key]}
                onChange={(event) =>
                  setScore((current) => ({
                    ...current,
                    [field.key]: normalizeScore(Number(event.target.value)),
                  }))
                }
              />
            </Field>
          ))}
        </div>
      </section>
    </form>
  );
}

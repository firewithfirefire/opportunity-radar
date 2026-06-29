"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { calculateNetProfit } from "@/lib/calculations";
import { buttonClass, Field, inputClass, Metric, secondaryButtonClass } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import type { ExperimentInput } from "@/types/opportunity";

const initialForm: ExperimentInput = {
  capitalUsed: 0,
  startedAt: "",
  endedAt: "",
  actualReward: 0,
  actualFees: 0,
  gasCost: 0,
  slippageCost: 0,
  timeSpentHours: 0,
  timeCost: 0,
  rewardReceived: false,
  issues: "",
  review: "",
  nextAction: "",
};

export function ExperimentForm({ opportunityId }: { opportunityId: number }) {
  const router = useRouter();
  const addExperiment = useOpportunityStore((state) => state.addExperiment);
  const [form, setForm] = useState<ExperimentInput>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const netProfit = useMemo(() => calculateNetProfit(form), [form]);

  function update<K extends keyof ExperimentInput>(key: K, value: ExperimentInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function numberValue(value: string) {
    return value === "" ? 0 : Number(value);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await addExperiment(opportunityId, form);
    router.push(`/opportunities/${opportunityId}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="预估净收益" value={netProfit.toFixed(2)} tone={netProfit > 0 ? "good" : netProfit < 0 ? "bad" : "neutral"} />
        <Metric label="实际奖励" value={form.actualReward.toFixed(2)} />
        <Metric label="投入本金" value={form.capitalUsed.toFixed(2)} />
      </section>

      <section className="grid gap-5 rounded-md border border-neutral-200 bg-[#fbfbf8] p-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="投入本金">
            <input className={inputClass} type="number" step="0.01" value={form.capitalUsed} onChange={(event) => update("capitalUsed", numberValue(event.target.value))} />
          </Field>
          <Field label="实际奖励">
            <input className={inputClass} type="number" step="0.01" value={form.actualReward} onChange={(event) => update("actualReward", numberValue(event.target.value))} />
          </Field>
          <Field label="开始时间">
            <input className={inputClass} type="date" value={form.startedAt} onChange={(event) => update("startedAt", event.target.value)} />
          </Field>
          <Field label="结束时间">
            <input className={inputClass} type="date" value={form.endedAt} onChange={(event) => update("endedAt", event.target.value)} />
          </Field>
          <Field label="平台/交易费用">
            <input className={inputClass} type="number" step="0.01" value={form.actualFees} onChange={(event) => update("actualFees", numberValue(event.target.value))} />
          </Field>
          <Field label="Gas 成本">
            <input className={inputClass} type="number" step="0.01" value={form.gasCost} onChange={(event) => update("gasCost", numberValue(event.target.value))} />
          </Field>
          <Field label="滑点成本">
            <input className={inputClass} type="number" step="0.01" value={form.slippageCost} onChange={(event) => update("slippageCost", numberValue(event.target.value))} />
          </Field>
          <Field label="时间成本">
            <input className={inputClass} type="number" step="0.01" value={form.timeCost} onChange={(event) => update("timeCost", numberValue(event.target.value))} />
          </Field>
          <Field label="耗时小时">
            <input className={inputClass} type="number" step="0.25" value={form.timeSpentHours} onChange={(event) => update("timeSpentHours", numberValue(event.target.value))} />
          </Field>
          <label className="flex min-h-10 items-center gap-3 self-end rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={form.rewardReceived}
              onChange={(event) => update("rewardReceived", event.target.checked)}
              className="size-4 accent-neutral-950"
            />
            奖励已到账
          </label>
        </div>

        <Field label="问题记录">
          <textarea className={`${inputClass} min-h-24 resize-y`} value={form.issues} onChange={(event) => update("issues", event.target.value)} />
        </Field>
        <Field label="复盘">
          <textarea className={`${inputClass} min-h-28 resize-y`} value={form.review} onChange={(event) => update("review", event.target.value)} />
        </Field>
        <Field label="下一步动作">
          <textarea className={`${inputClass} min-h-20 resize-y`} value={form.nextAction} onChange={(event) => update("nextAction", event.target.value)} />
        </Field>

        <div className="flex justify-end gap-3">
          <button type="button" className={secondaryButtonClass} onClick={() => router.push(`/opportunities/${opportunityId}`)}>
            取消
          </button>
          <button type="submit" className={buttonClass} disabled={isSaving}>
            <Save size={16} />
            保存实验
          </button>
        </div>
      </section>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { buttonClass, Field, inputClass, secondaryButtonClass } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import {
  statusLabels,
  typeLabels,
  type OpportunityInput,
  type OpportunityStatus,
  type OpportunityType,
} from "@/types/opportunity";

const statuses = Object.keys(statusLabels) as OpportunityStatus[];
const types = Object.keys(typeLabels) as OpportunityType[];

export function OpportunityForm() {
  const router = useRouter();
  const addOpportunity = useOpportunityStore((state) => state.addOpportunity);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<OpportunityInput>({
    title: "",
    sourceUrl: "",
    platform: "",
    type: "other",
    description: "",
    windowStart: "",
    windowEnd: "",
    status: "candidate",
  });

  function update<K extends keyof OpportunityInput>(key: K, value: OpportunityInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    const id = await addOpportunity({
      ...form,
      title: form.title.trim(),
      sourceUrl: form.sourceUrl?.trim(),
      platform: form.platform?.trim(),
      description: form.description?.trim(),
    });
    router.push(`/opportunities/${id}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-md border border-neutral-200 bg-[#fbfbf8] p-5">
      <Field label="标题">
        <input
          className={inputClass}
          value={form.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="例如：某链积分任务套利"
          required
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="来源链接">
          <input className={inputClass} value={form.sourceUrl} onChange={(event) => update("sourceUrl", event.target.value)} />
        </Field>
        <Field label="平台">
          <input className={inputClass} value={form.platform} onChange={(event) => update("platform", event.target.value)} />
        </Field>
        <Field label="类型">
          <select className={inputClass} value={form.type} onChange={(event) => update("type", event.target.value as OpportunityType)}>
            {types.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="状态">
          <select className={inputClass} value={form.status} onChange={(event) => update("status", event.target.value as OpportunityStatus)}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="窗口开始">
          <input className={inputClass} type="date" value={form.windowStart} onChange={(event) => update("windowStart", event.target.value)} />
        </Field>
        <Field label="窗口结束">
          <input className={inputClass} type="date" value={form.windowEnd} onChange={(event) => update("windowEnd", event.target.value)} />
        </Field>
      </div>

      <Field label="描述">
        <textarea
          className={`${inputClass} min-h-32 resize-y`}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="机会是什么、为什么可能赚钱、你看到的关键证据。"
        />
      </Field>

      <div className="flex justify-end gap-3">
        <button type="button" className={secondaryButtonClass} onClick={() => router.push("/opportunities")}>
          取消
        </button>
        <button type="submit" className={buttonClass} disabled={isSaving || !form.title.trim()}>
          <Save size={16} />
          保存机会
        </button>
      </div>
    </form>
  );
}

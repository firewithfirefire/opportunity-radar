"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Database, Play, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { buttonClass, Field, inputClass, PageTitle, secondaryButtonClass } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import {
  opportunityKeywords,
  sourceProfileLabels,
  sourceTypeLabels,
  type SourceInput,
  type SourceProfile,
  type SourceType,
} from "@/types/opportunity";

const sourceTypes = Object.keys(sourceTypeLabels) as SourceType[];
const sourceProfiles = Object.keys(sourceProfileLabels) as SourceProfile[];

const emptyForm: SourceInput = {
  name: "",
  type: "rss",
  sourceProfile: "general_news_source",
  url: "",
  enabled: true,
  keywords: opportunityKeywords.slice(0, 8),
  refreshInterval: 360,
};

export default function SourcesPage() {
  const {
    sources,
    rawItems,
    isLoading,
    loadAll,
    seedDefaultSources,
    addSource,
    updateSource,
    deleteSource,
    collectSource,
    collectEnabledSources,
    collectDueSources,
  } = useOpportunityStore();
  const [form, setForm] = useState(emptyForm);
  const [keywordText, setKeywordText] = useState(emptyForm.keywords.join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const [collectingId, setCollectingId] = useState<number | "all" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      await loadAll();
      await collectDueSources();
    })();
  }, [loadAll, collectDueSources]);

  const recentRawItems = useMemo(() => rawItems.slice(0, 8), [rawItems]);

  function update<K extends keyof SourceInput>(key: K, value: SourceInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function parseKeywords() {
    return keywordText
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    await addSource({
      ...form,
      name: form.name.trim(),
      url: form.url.trim(),
      keywords: parseKeywords(),
    });
    setForm(emptyForm);
    setKeywordText(emptyForm.keywords.join(", "));
    setIsSaving(false);
    setMessage("来源已保存");
  }

  async function runOne(id: number) {
    setCollectingId(id);
    setMessage("");
    try {
      const result = await collectSource(id);
      setMessage(`收集完成：扫描 ${result.rawCount} 条，新增 ${result.newRawCount} 条原始信息`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "收集失败");
    } finally {
      setCollectingId(null);
    }
  }

  async function runAll() {
    setCollectingId("all");
    setMessage("");
    try {
      const result = await collectEnabledSources();
      setMessage(`收集完成：扫描 ${result.rawCount} 条，新增 ${result.newRawCount} 条原始信息`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "收集失败");
    } finally {
      setCollectingId(null);
    }
  }

  async function addDefaultSources() {
    setMessage("");
    await seedDefaultSources();
    setMessage("默认来源已补齐");
  }

  return (
    <>
      <PageTitle
        title="收集中心"
        description="维护信息来源；抓取结果先进入原始信息雷达，确认后再生成机会。"
        action={
          <Link href="/opportunities" className={secondaryButtonClass}>
            <Database size={16} />
            查看机会池
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <form onSubmit={onSubmit} className="grid content-start gap-5 rounded-md border border-neutral-200 bg-[#fbfbf8] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-950">新增来源</h2>
            <button type="submit" className={buttonClass} disabled={isSaving || !form.name.trim() || !form.url.trim()}>
              <Plus size={16} />
              保存
            </button>
          </div>

          <Field label="名称">
            <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="类型">
              <select className={inputClass} value={form.type} onChange={(event) => update("type", event.target.value as SourceType)}>
                {sourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {sourceTypeLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="来源画像">
              <select
                className={inputClass}
                value={form.sourceProfile}
                onChange={(event) => update("sourceProfile", event.target.value as SourceProfile)}
              >
                {sourceProfiles.map((profile) => (
                  <option key={profile} value={profile}>
                    {sourceProfileLabels[profile]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="刷新间隔分钟">
              <input
                className={inputClass}
                type="number"
                min="1"
                value={form.refreshInterval}
                onChange={(event) => update("refreshInterval", Number(event.target.value))}
              />
            </Field>
          </div>

          <Field label={form.type === "manual_text" ? "文本" : "地址"}>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.url}
              onChange={(event) => update("url", event.target.value)}
              required
            />
          </Field>

          <Field label="关键词">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={keywordText}
              onChange={(event) => setKeywordText(event.target.value)}
            />
          </Field>

          <label className="flex min-h-10 items-center gap-3 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => update("enabled", event.target.checked)}
              className="size-4 accent-neutral-950"
            />
            启用
          </label>
        </form>

        <div className="grid content-start gap-5">
          <section className="rounded-md border border-neutral-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <h2 className="text-base font-semibold text-neutral-950">来源列表</h2>
              <div className="flex flex-wrap gap-2">
                <button className={secondaryButtonClass} onClick={addDefaultSources} disabled={collectingId !== null}>
                  <Plus size={16} />
                  添加默认来源
                </button>
                <button className={secondaryButtonClass} onClick={runAll} disabled={collectingId !== null || sources.length === 0}>
                  <RefreshCcw size={16} />
                  收集全部
                </button>
              </div>
            </div>

            {message ? <div className="border-b border-neutral-100 px-4 py-3 text-sm text-neutral-600">{message}</div> : null}

            {isLoading ? (
              <div className="p-8 text-center text-sm text-neutral-500">读取来源中...</div>
            ) : sources.length === 0 ? (
              <div className="grid gap-3 p-8 text-center text-sm text-neutral-500">
                <span>还没有来源。</span>
                <button className={`${secondaryButtonClass} mx-auto`} onClick={addDefaultSources}>
                  <Plus size={16} />
                  添加默认来源
                </button>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {sources.map((source) => (
                  <article key={source.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_110px_92px_42px] md:items-center">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-neutral-950">{source.name}</div>
                      <div className="mt-1 truncate text-xs text-neutral-500">{source.lastFetchStatus || source.url}</div>
                    </div>
                    <div className="text-sm text-neutral-600">{sourceProfileLabels[source.sourceProfile]}</div>
                    <button
                      className={secondaryButtonClass}
                      onClick={() => source.id && runOne(source.id)}
                      disabled={!source.id || collectingId !== null}
                    >
                      <Play size={15} />
                      收集
                    </button>
                    <button
                      className="grid size-9 place-items-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      title="删除"
                      onClick={() => source.id && deleteSource(source.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <label className="flex items-center gap-2 text-xs text-neutral-500 md:col-span-4">
                      <input
                        type="checkbox"
                        checked={source.enabled}
                        onChange={(event) => source.id && updateSource(source.id, { enabled: event.target.checked })}
                        className="size-4 accent-neutral-950"
                      />
                      启用自动批量收集
                    </label>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-md border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <h2 className="text-base font-semibold text-neutral-950">最近原始线索</h2>
            </div>
            {recentRawItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-neutral-500">暂无原始线索。</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentRawItems.map((item) => (
                  <article key={item.id} className="px-4 py-3">
                    <div className="text-sm font-medium text-neutral-950">{item.title}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {item.sourceName} · {item.matchedKeywords.join(", ") || "无关键词"}
                      · 相关性 {item.signalScore ?? 0}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

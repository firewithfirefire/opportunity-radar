"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { PageTitle, secondaryButtonClass } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import { rawItemStatusLabels, sourceTypeLabels, type RawItemStatus, type SourceType } from "@/types/opportunity";

const statuses = Object.keys(rawItemStatusLabels) as RawItemStatus[];
const sourceTypes = Object.keys(sourceTypeLabels) as SourceType[];

export default function RadarPage() {
  const { rawItems, sources, isLoading, loadAll, collectEnabledSources, collectDueSources } = useOpportunityStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RawItemStatus | "all">("all");
  const [sourceType, setSourceType] = useState<SourceType | "all">("all");
  const [isCollecting, setIsCollecting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      await loadAll();
      await collectDueSources();
    })();
  }, [loadAll, collectDueSources]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rawItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.sourceName, item.rawText, item.matchedKeywords.join(" ")]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = status === "all" || item.status === status;
      const matchesType = sourceType === "all" || item.sourceType === sourceType;
      return matchesQuery && matchesStatus && matchesType;
    });
  }, [rawItems, query, status, sourceType]);

  async function runCollection() {
    setIsCollecting(true);
    setMessage("");
    try {
      const result = await collectEnabledSources();
      setMessage(`收集完成：扫描 ${result.rawCount} 条，新增 ${result.opportunityCount} 个候选机会`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "收集失败");
    } finally {
      setIsCollecting(false);
    }
  }

  return (
    <>
      <PageTitle
        title="原始信息雷达"
        description="查看从信息源抓到的 RawItem，再进入候选机会池筛选。"
        action={
          <button className={secondaryButtonClass} onClick={runCollection} disabled={isCollecting || sources.length === 0}>
            <RefreshCcw size={16} />
            收集启用来源
          </button>
        }
      />

      <section className="mb-5 grid gap-3 rounded-md border border-neutral-200 bg-[#fbfbf8] p-4 md:grid-cols-[1fr_150px_150px]">
        <input
          className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          placeholder="搜索标题、来源、关键词、正文"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          value={status}
          onChange={(event) => setStatus(event.target.value as RawItemStatus | "all")}
        >
          <option value="all">全部状态</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {rawItemStatusLabels[item]}
            </option>
          ))}
        </select>
        <select
          className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value as SourceType | "all")}
        >
          <option value="all">全部来源类型</option>
          {sourceTypes.map((item) => (
            <option key={item} value={item}>
              {sourceTypeLabels[item]}
            </option>
          ))}
        </select>
      </section>

      {message ? <div className="mb-5 rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-600">{message}</div> : null}

      <section className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <div className="grid grid-cols-[1fr_140px_120px_150px] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase text-neutral-500 max-lg:hidden">
          <span>原始信息</span>
          <span>来源</span>
          <span>关键词</span>
          <span>时间</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-neutral-500">读取原始信息中...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">
            暂无原始信息。先到 <Link href="/sources" className="underline">收集中心</Link> 添加来源。
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((item) => (
              <article key={item.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_140px_120px_150px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-neutral-950">{item.title}</h2>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-950" title="打开来源">
                        <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">{item.rawText}</p>
                </div>
                <div className="text-sm text-neutral-600">{item.sourceName}</div>
                <div className="flex flex-wrap gap-1">
                  {item.matchedKeywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded bg-neutral-100 px-1.5 py-1 text-xs text-neutral-600">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-neutral-500">{item.publishedAt || item.fetchedAt}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

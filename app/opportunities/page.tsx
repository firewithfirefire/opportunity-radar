"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { PageTitle, secondaryButtonClass, StatusBadge } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import {
  statusLabels,
  typeLabels,
  type OpportunityStatus,
  type OpportunityType,
} from "@/types/opportunity";

const statuses = Object.keys(statusLabels) as OpportunityStatus[];
const types = Object.keys(typeLabels) as OpportunityType[];

export default function OpportunitiesPage() {
  const { opportunities, isLoading, loadAll, deleteOpportunity } = useOpportunityStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OpportunityStatus | "all">("all");
  const [type, setType] = useState<OpportunityType | "all">("all");
  const [minScore, setMinScore] = useState("0");

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesQuery =
        !normalizedQuery ||
        [opportunity.title, opportunity.platform, opportunity.description]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      const matchesStatus = status === "all" || opportunity.status === status;
      const matchesType = type === "all" || opportunity.type === type;
      const matchesScore = opportunity.opportunityScore >= Number(minScore || 0);
      return matchesQuery && matchesStatus && matchesType && matchesScore;
    });
  }, [opportunities, query, status, type, minScore]);

  return (
    <>
      <PageTitle
        title="机会池"
        description="收集线索，筛掉噪音，把小额实验留给真正值得验证的机会。"
        action={
          <Link href="/opportunities/new" className={secondaryButtonClass}>
            <Plus size={16} />
            新增机会
          </Link>
        }
      />

      <section className="mb-5 grid gap-3 rounded-md border border-neutral-200 bg-[#fbfbf8] p-4 md:grid-cols-[1fr_150px_150px_120px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            className="min-h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
            placeholder="搜索标题、平台、描述"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          value={status}
          onChange={(event) => setStatus(event.target.value as OpportunityStatus | "all")}
        >
          <option value="all">全部状态</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {statusLabels[item]}
            </option>
          ))}
        </select>
        <select
          className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          value={type}
          onChange={(event) => setType(event.target.value as OpportunityType | "all")}
        >
          <option value="all">全部类型</option>
          {types.map((item) => (
            <option key={item} value={item}>
              {typeLabels[item]}
            </option>
          ))}
        </select>
        <input
          className="min-h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
          type="number"
          min="0"
          max="100"
          placeholder="最低分"
          value={minScore}
          onChange={(event) => setMinScore(event.target.value)}
        />
      </section>

      <section className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <div className="grid grid-cols-[1fr_110px_110px_100px_110px_42px] gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase text-neutral-500 max-lg:hidden">
          <span>机会</span>
          <span>类型</span>
          <span>状态</span>
          <span>机会分</span>
          <span>置信分</span>
          <span />
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-neutral-500">读取本地数据中...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-neutral-500">还没有匹配的机会。</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((opportunity) => (
              <article
                key={opportunity.id}
                className="grid gap-3 px-4 py-4 transition hover:bg-neutral-50 lg:grid-cols-[1fr_110px_110px_100px_110px_42px] lg:items-center"
              >
                <Link href={`/opportunities/${opportunity.id}`} className="min-w-0">
                  <div className="truncate text-sm font-semibold text-neutral-950">{opportunity.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    {opportunity.platform ? <span>{opportunity.platform}</span> : null}
                    {opportunity.sourceUrl ? (
                      <span className="inline-flex items-center gap-1">
                        <ExternalLink size={12} />
                        来源
                      </span>
                    ) : null}
                  </div>
                </Link>
                <div className="text-sm text-neutral-600">{typeLabels[opportunity.type]}</div>
                <StatusBadge status={opportunity.status} />
                <div className="text-lg font-semibold text-neutral-950">{opportunity.opportunityScore}</div>
                <div className="text-sm font-medium text-neutral-600">{opportunity.confidenceScore}</div>
                <button
                  className="grid size-9 place-items-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  title="删除"
                  onClick={() => opportunity.id && deleteOpportunity(opportunity.id)}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

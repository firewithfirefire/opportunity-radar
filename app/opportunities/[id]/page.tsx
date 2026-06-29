"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Plus } from "lucide-react";
import { Metric, PageTitle, secondaryButtonClass, StatusBadge } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";
import { typeLabels } from "@/types/opportunity";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opportunityId = Number(id);
  const { loadAll, getOpportunity, getExperimentsByOpportunity, rawItems, isLoading } = useOpportunityStore();
  const opportunity = getOpportunity(opportunityId);
  const rawItem = rawItems.find((item) => item.id === opportunity?.rawItemId);
  const experiments = getExperimentsByOpportunity(opportunityId);
  const totalNetProfit = experiments.reduce((sum, experiment) => sum + experiment.netProfit, 0);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (isLoading || !opportunity) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        {isLoading ? "读取机会详情中..." : "没有找到这个机会。"}
      </div>
    );
  }

  return (
    <>
      <Link href="/opportunities" className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950">
        <ArrowLeft size={16} />
        返回机会池
      </Link>

      <PageTitle
        title={opportunity.title}
        description={opportunity.description || "暂无描述"}
        action={
          <Link href={`/experiments/${opportunity.id}/new`} className={secondaryButtonClass}>
            <Plus size={16} />
            新增实验
          </Link>
        }
      />

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Metric label="机会分" value={String(opportunity.opportunityScore)} />
        <Metric label="置信分" value={String(opportunity.confidenceScore)} />
        <Metric
          label="累计净收益"
          value={totalNetProfit.toFixed(2)}
          tone={totalNetProfit > 0 ? "good" : totalNetProfit < 0 ? "bad" : "neutral"}
        />
        <Metric label="实验次数" value={String(experiments.length)} />
      </section>

      <section className="mb-5 rounded-md border border-neutral-200 bg-[#fbfbf8] p-5">
        <div className="grid gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-xs text-neutral-400">平台</div>
            <div className="mt-1 font-medium text-neutral-900">{opportunity.platform || "-"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">类型</div>
            <div className="mt-1 font-medium text-neutral-900">{typeLabels[opportunity.type]}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">状态</div>
            <div className="mt-1">
              <StatusBadge status={opportunity.status} />
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">窗口</div>
            <div className="mt-1 font-medium text-neutral-900">
              {opportunity.windowStart || "-"} / {opportunity.windowEnd || "-"}
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <div className="text-xs text-neutral-400">所需本金</div>
            <div className="mt-1 font-medium text-neutral-900">{opportunity.capitalRequired ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">预期奖励</div>
            <div className="mt-1 font-medium text-neutral-900">{opportunity.expectedReward ?? "-"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-400">预估费用</div>
            <div className="mt-1 font-medium text-neutral-900">{opportunity.estimatedFees ?? "-"}</div>
          </div>
        </div>
        {opportunity.sourceUrl ? (
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-950"
          >
            <ExternalLink size={15} />
            打开来源链接
          </a>
        ) : null}
      </section>

      <div className="grid gap-5">
        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-neutral-950">结构化分析</h2>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs text-neutral-400">描述</div>
              <p className="mt-1 text-neutral-700">{opportunity.description || "-"}</p>
            </div>
            <div>
              <div className="text-xs text-neutral-400">风险</div>
              <p className="mt-1 text-neutral-700">{opportunity.risks || "-"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-base font-semibold text-neutral-950">原始信息</h2>
          {rawItem ? (
            <div className="grid gap-3">
              <div className="text-sm font-semibold text-neutral-950">{rawItem.title}</div>
              <div className="text-xs text-neutral-500">
                {rawItem.sourceName} · {rawItem.publishedAt || rawItem.fetchedAt} · {rawItem.matchedKeywords.join(", ")}
              </div>
              <p className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-neutral-50 p-3 text-sm leading-6 text-neutral-700">
                {rawItem.rawText}
              </p>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">这是手动新增机会，没有关联原始信息。</div>
          )}
        </section>

        <section className="rounded-md border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-neutral-950">实验记录</h2>
          {experiments.length === 0 ? (
            <div className="rounded-md border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500">
              还没有实验记录。
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {experiments.map((experiment) => (
                <article key={experiment.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-neutral-950">
                      {experiment.startedAt || "未填开始时间"} - {experiment.endedAt || "进行中"}
                    </div>
                    <div className={experiment.netProfit >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>
                      {experiment.netProfit.toFixed(2)}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-neutral-500 md:grid-cols-4">
                    <span>本金 {experiment.capitalUsed}</span>
                    <span>奖励 {experiment.actualReward}</span>
                    <span>费用 {experiment.actualFees + experiment.gasCost + experiment.slippageCost}</span>
                    <span>耗时 {experiment.timeSpentHours}h</span>
                  </div>
                  {experiment.review ? <p className="mt-3 text-sm text-neutral-700">{experiment.review}</p> : null}
                  {experiment.nextAction ? <p className="mt-2 text-sm text-neutral-500">下一步：{experiment.nextAction}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ExperimentForm } from "@/components/experiment-form";
import { PageTitle } from "@/components/ui";
import { useOpportunityStore } from "@/store/opportunity-store";

export default function NewExperimentPage({ params }: { params: Promise<{ opportunityId: string }> }) {
  const { opportunityId: opportunityIdParam } = use(params);
  const opportunityId = Number(opportunityIdParam);
  const { loadAll, getOpportunity } = useOpportunityStore();
  const opportunity = getOpportunity(opportunityId);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <>
      <Link href={`/opportunities/${opportunityId}`} className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-950">
        <ArrowLeft size={16} />
        返回机会详情
      </Link>
      <PageTitle
        title="新增实验记录"
        description={opportunity ? `记录「${opportunity.title}」的小额验证结果。` : "记录一次小额验证结果。"}
      />
      <ExperimentForm opportunityId={opportunityId} />
    </>
  );
}

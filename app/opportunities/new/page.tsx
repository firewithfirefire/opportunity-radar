import { OpportunityForm } from "@/components/opportunity-form";
import { PageTitle } from "@/components/ui";

export default function NewOpportunityPage() {
  return (
    <>
      <PageTitle title="新增机会" description="把模糊线索先放进池子，再用评分和实验逐步验证。" />
      <OpportunityForm />
    </>
  );
}

import { recommendationLabels, statusLabels, type OpportunityStatus, type Recommendation } from "@/types/opportunity";

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-neutral-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: OpportunityStatus }) {
  const classes: Record<OpportunityStatus, string> = {
    candidate: "bg-neutral-100 text-neutral-700 ring-neutral-200",
    researching: "bg-blue-50 text-blue-700 ring-blue-100",
    testing: "bg-amber-50 text-amber-700 ring-amber-100",
    ignored: "bg-red-50 text-red-700 ring-red-100",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1 ${classes[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export function RecommendationBadge({ recommendation }: { recommendation: Recommendation }) {
  const classes: Record<Recommendation, string> = {
    strong_go: "bg-emerald-950 text-white",
    test_small: "bg-amber-500 text-white",
    watch: "bg-neutral-800 text-white",
    skip: "bg-red-700 text-white",
  };

  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold ${classes[recommendation]}`}>
      {recommendationLabels[recommendation]}
    </span>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-neutral-800">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-10 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50";

export function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-red-700" : "text-neutral-950";

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase text-neutral-400">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

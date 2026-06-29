import type { TriageStatus } from "@/types";

const triageStyles: Record<TriageStatus, string> = {
  proceed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  reject: "bg-red-50 text-red-700 border-red-200",
};

const triageLabels: Record<TriageStatus, string> = {
  proceed: "Proceed",
  warning: "Risk",
  reject: "Skip",
};

interface TriageBadgeProps {
  status: TriageStatus | null;
}

export function TriageBadge({ status }: TriageBadgeProps) {
  if (!status) {
    return null;
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${triageStyles[status]}`}
    >
      {triageLabels[status]}
    </span>
  );
}

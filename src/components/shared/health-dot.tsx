import type { DealHealth } from "@/types";

const healthStyles: Record<DealHealth, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

interface HealthDotProps {
  health: DealHealth;
}

export function HealthDot({ health }: HealthDotProps) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${healthStyles[health]}`}
      aria-hidden
    />
  );
}

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogOutButton } from "@/components/auth/log-out-button";
import { ManagerAnalytics } from "@/components/manager/manager-analytics";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";
import { DateRangeFilter } from "@/components/manager/date-range-filter";
import { getManagerDashboard } from "@/lib/data/queries";
import { getSessionProfile } from "@/lib/auth/session";
import type { DateRangeKey } from "@/lib/date-ranges";

export const revalidate = 60;

interface ManagerPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function ManagerPage({ searchParams }: ManagerPageProps) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/");
  }

  const params = await searchParams;
  const rangeKey = (params.range as DateRangeKey) ?? "current_quarter";
  const data = await getManagerDashboard(rangeKey);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <ManagerAnalytics />

      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Manager workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Pipeline intelligence
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {profile.full_name} · {data.prospects.length} prospects
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={null}>
            <DateRangeFilter />
          </Suspense>
          <LogOutButton />
        </div>
      </header>

      <ManagerDashboard data={data} />
    </main>
  );
}

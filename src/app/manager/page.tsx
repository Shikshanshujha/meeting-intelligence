import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogOutButton } from "@/components/auth/log-out-button";
import { ManagerAnalytics } from "@/components/manager/manager-analytics";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";
import { DateRangeFilter } from "@/components/manager/date-range-filter";
import { AppShell } from "@/components/shared/app-shell";
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
    <>
      <ManagerAnalytics />
      <AppShell
        role="manager"
        title="Pipeline intelligence"
        subtitle={`${profile.full_name} · ${data.prospects.length} active prospects`}
        actions={
          <>
            <Suspense fallback={null}>
              <DateRangeFilter />
            </Suspense>
            <LogOutButton />
          </>
        }
      >
        <ManagerDashboard data={data} />
      </AppShell>
    </>
  );
}

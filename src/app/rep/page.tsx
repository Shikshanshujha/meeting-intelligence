import { Suspense } from "react";
import { LogOutButton } from "@/components/auth/log-out-button";
import { AddProspectForm } from "@/components/rep/add-prospect-form";
import { RepMeetingBoard } from "@/components/rep/meeting-board";
import { NextUpCard } from "@/components/rep/next-up-card";
import { RepWorkspaceFilters } from "@/components/rep/rep-workspace-filters";
import {
  filterRepMeetings,
  getNextUpcomingMeeting,
  getRepMeetings,
} from "@/lib/data/queries";
import { getSessionProfile } from "@/lib/auth/session";
import type { DateRangeKey } from "@/lib/date-ranges";
import type { WorkflowStageFilter } from "@/lib/infer-pipeline-stage";
import { redirect } from "next/navigation";

interface RepPageProps {
  searchParams: Promise<{ range?: string; stage?: string }>;
}

export default async function RepPage({ searchParams }: RepPageProps) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/");
  }

  const params = await searchParams;
  const rangeKey = (params.range as DateRangeKey) ?? "current_quarter";
  const stageFilter = (params.stage as WorkflowStageFilter) ?? "all";

  const allMeetings = await getRepMeetings(profile.id);
  const meetings = filterRepMeetings(allMeetings, rangeKey, stageFilter);
  const nextUp = getNextUpcomingMeeting(allMeetings);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">Rep workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Your meetings
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{profile.full_name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AddProspectForm />
          <Suspense fallback={null}>
            <RepWorkspaceFilters />
          </Suspense>
          <LogOutButton />
        </div>
      </header>

      <div className="space-y-8">
        {nextUp && <NextUpCard meeting={nextUp} />}
        <RepMeetingBoard meetings={meetings} />
      </div>
    </main>
  );
}

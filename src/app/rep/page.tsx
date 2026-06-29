import { Suspense } from "react";
import { LogOutButton } from "@/components/auth/log-out-button";
import { AddProspectForm } from "@/components/rep/add-prospect-form";
import { RepMeetingBoard } from "@/components/rep/meeting-board";
import { NextUpCard } from "@/components/rep/next-up-card";
import { RepWorkspaceFilters } from "@/components/rep/rep-workspace-filters";
import { AppShell } from "@/components/shared/app-shell";
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
    <AppShell
      role="rep"
      title="Your meetings"
      subtitle={profile.full_name}
      actions={
        <>
          <AddProspectForm />
          <Suspense fallback={null}>
            <RepWorkspaceFilters />
          </Suspense>
          <LogOutButton />
        </>
      }
    >
      <div className="space-y-8">
        {nextUp && <NextUpCard meeting={nextUp} />}
        <RepMeetingBoard meetings={meetings} />
      </div>
    </AppShell>
  );
}

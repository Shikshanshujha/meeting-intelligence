import Link from "next/link";
import { formatDate } from "@/lib/data/formatters";
import type { FollowUpPrompt } from "@/lib/data/rep-follow-up-prompts";
import { ScheduleMeetingForm } from "@/components/rep/schedule-meeting-form";

interface FollowUpPromptBannerProps {
  prompt: FollowUpPrompt;
}

export function FollowUpPromptBanner({ prompt }: FollowUpPromptBannerProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-950">Follow-up overdue</p>
          <p className="mt-1 text-sm text-amber-900/80">
            No upcoming meeting for {prompt.company}. Last call was{" "}
            {formatDate(prompt.last_meeting_at)} ({prompt.working_days_since} working
            days ago).
          </p>
          <Link
            href={`/rep/meetings/${prompt.last_meeting_id}`}
            className="mt-1 inline-block text-sm font-medium text-brand-600 hover:underline"
          >
            Review last meeting
          </Link>
        </div>
        <ScheduleMeetingForm
          prospectId={prompt.prospect_id}
          prospectCompany={prompt.company}
          buttonLabel="Schedule follow-up"
          buttonClassName="btn-primary w-full shrink-0 sm:w-auto"
        />
      </div>
    </section>
  );
}

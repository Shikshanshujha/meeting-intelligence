import Link from "next/link";
import { formatDate } from "@/lib/data/formatters";
import type { FollowUpPrompt } from "@/lib/data/rep-follow-up-prompts";
import { ScheduleMeetingForm } from "@/components/rep/schedule-meeting-form";

interface FollowUpPromptsSectionProps {
  prompts: FollowUpPrompt[];
}

export function FollowUpPromptsSection({ prompts }: FollowUpPromptsSectionProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-amber-950">Follow-up needed</h2>
        <p className="mt-1 text-sm text-amber-900/80">
          These active deals have no upcoming meeting and it has been more than 2
          working days since your last call.
        </p>
      </div>

      <ul className="space-y-3">
        {prompts.map((prompt) => (
          <li
            key={prompt.prospect_id}
            className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-zinc-900">{prompt.company}</p>
              <p className="mt-1 text-sm text-zinc-600">
                Last meeting {formatDate(prompt.last_meeting_at)} ·{" "}
                {prompt.working_days_since} working days ago
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
          </li>
        ))}
      </ul>
    </section>
  );
}

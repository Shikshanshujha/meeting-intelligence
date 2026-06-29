import { HealthDot } from "@/components/shared/health-dot";
import { Panel } from "@/components/shared/panel";
import { TriageBadge } from "@/components/shared/triage-badge";
import { formatDate, formatMeetingType, formatStage } from "@/lib/data/formatters";
import type { ManagerProspectDetail } from "@/lib/data/manager-prospect";

interface ProspectDetailProps {
  prospect: ManagerProspectDetail;
}

function MemoryList({
  label,
  items,
}: {
  label: string;
  items: string[] | undefined;
}) {
  if (!items?.length) return null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm text-zinc-700">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProspectDetail({ prospect }: ProspectDetailProps) {
  const { insight, memory_json: memory } = prospect;

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {insight?.health && <HealthDot health={insight.health} />}
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                {formatStage(prospect.stage)}
              </span>
              <span className="text-xs text-zinc-500">
                Score {prospect.qualification_score}
              </span>
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Owner: <span className="font-medium text-zinc-900">{prospect.owner_name}</span>
              {prospect.industry && <> · {prospect.industry}</>}
            </p>
            <a
              href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-brand-600 hover:underline"
            >
              {prospect.website}
            </a>
          </div>
          <p className="text-xs text-zinc-500">
            Updated {formatDate(prospect.updated_at)}
          </p>
        </div>
      </Panel>

      {insight && (
        <Panel title="Manager insight">
          <div className="grid gap-4 sm:grid-cols-2">
            {insight.risk && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                  Risk
                </p>
                <p className="mt-2 text-sm text-amber-950">{insight.risk}</p>
              </div>
            )}
            {insight.coaching && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-800">
                  Coaching
                </p>
                <p className="mt-2 text-sm text-blue-950">{insight.coaching}</p>
              </div>
            )}
            {insight.pipeline_signal && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  Pipeline signal
                </p>
                <p className="mt-2 text-sm text-emerald-950">
                  {insight.pipeline_signal}
                </p>
              </div>
            )}
            {insight.patterns.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Patterns
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {insight.patterns.map((pattern) => (
                    <span
                      key={pattern}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      <Panel title="Prospect memory" description="Accumulated context across all meetings">
        <div className="grid gap-5 sm:grid-cols-2">
          <MemoryList label="Pain points" items={memory.pain_points} />
          <MemoryList label="Buying signals" items={memory.buying_signals} />
          <MemoryList label="Objections" items={memory.objections} />
          <MemoryList label="Next actions" items={memory.next_actions} />
          <MemoryList label="Stakeholders" items={memory.stakeholders} />
          {memory.timeline && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Timeline
              </p>
              <p className="mt-2 text-sm text-zinc-700">{memory.timeline}</p>
            </div>
          )}
        </div>
      </Panel>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Meeting history ({prospect.meetings.length})
        </h2>

        {prospect.meetings.length === 0 ? (
          <Panel>
            <p className="text-sm text-zinc-500">
              No meetings logged for this account yet. They appear here when the
              rep completes a call and submits notes.
            </p>
          </Panel>
        ) : (
          <div className="space-y-4">
            {prospect.meetings.map((meeting) => (
              <Panel
                key={meeting.id}
                title={formatMeetingType(meeting.type)}
                badge={
                  meeting.completed_at ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Completed
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      Scheduled
                    </span>
                  )
                }
              >
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span>{formatDate(meeting.scheduled_at)}</span>
                  <span>·</span>
                  <span>{meeting.rep_name}</span>
                  {meeting.triage_status && (
                    <>
                      <span>·</span>
                      <TriageBadge status={meeting.triage_status} />
                    </>
                  )}
                </div>

                {meeting.triage_explanation && (
                  <p className="mb-4 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                    {meeting.triage_explanation}
                  </p>
                )}

                {meeting.notes ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-600">Rep notes</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800">
                        {meeting.notes.raw_notes}
                      </p>
                    </div>

                    {meeting.notes.transcript && (
                      <div>
                        <p className="text-xs font-medium text-zinc-600">Transcript</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                          {meeting.notes.transcript}
                        </p>
                      </div>
                    )}

                    {meeting.notes.structured_summary && (
                      <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          AI summary
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {meeting.notes.structured_summary.pain_points.length > 0 && (
                            <div>
                              <p className="text-xs text-zinc-500">Pain</p>
                              <p className="text-sm text-zinc-800">
                                {meeting.notes.structured_summary.pain_points.join(", ")}
                              </p>
                            </div>
                          )}
                          {meeting.notes.structured_summary.next_actions.length > 0 && (
                            <div>
                              <p className="text-xs text-zinc-500">Next steps</p>
                              <p className="text-sm text-zinc-800">
                                {meeting.notes.structured_summary.next_actions.join(", ")}
                              </p>
                            </div>
                          )}
                          {meeting.notes.structured_summary.objections.length > 0 && (
                            <div>
                              <p className="text-xs text-zinc-500">Objections</p>
                              <p className="text-sm text-zinc-800">
                                {meeting.notes.structured_summary.objections.join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">
                    No notes yet — meeting not completed.
                  </p>
                )}
              </Panel>
            ))}
          </div>
        )}
      </section>

      {prospect.milestones.length > 0 && (
        <Panel title="Pipeline milestones">
          <ol className="space-y-2">
            {prospect.milestones.map((milestone) => (
              <li
                key={milestone.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2.5"
              >
                <span className="text-sm font-medium text-zinc-900">
                  {milestone.label}
                </span>
                <span className="text-xs text-zinc-500">
                  {formatDate(milestone.occurred_at)}
                </span>
                {milestone.next_step && (
                  <p className="w-full text-xs text-zinc-600">
                    Next: {milestone.next_step}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}

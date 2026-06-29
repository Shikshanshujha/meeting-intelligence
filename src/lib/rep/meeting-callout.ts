import { isUpcoming } from "@/lib/data/formatters";
import type { RepMeetingRow } from "@/lib/data/queries";

const FOLLOW_UP_THEMES: { pattern: RegExp; label: string }[] = [
  { pattern: /security|infosec|questionnaire|soc\s?2|sign-off/i, label: "security concerns" },
  { pattern: /quality|editorial|ai content|content quality|qa workflow/i, label: "content quality" },
  { pattern: /pric|pricing|vendor|shopping|budget|roi|cost|differentiation|competitive/i, label: "pricing & vendors" },
  { pattern: /demo|walkthrough|product tour|workflow demo/i, label: "demo experience" },
  { pattern: /migration|vertical|launch|integration|use case/i, label: "use case fit" },
  { pattern: /cmo|economic buyer|stakeholder|champion/i, label: "stakeholder alignment" },
];

const REJECTION_REASONS: { pattern: RegExp; label: string }[] = [
  {
    pattern: /competitor research|competitor intel|implementation detail|build-level|tooling stack|prompt architecture|benchmarking/i,
    label: "competitor research",
  },
  { pattern: /no budget|budget cut|no funding|can't afford/i, label: "no budget" },
  { pattern: /not a fit|bad fit|wrong fit|disqualified|not pursuing/i, label: "not a fit" },
  { pattern: /no validated pain|no clear pain|no buyer pain|benchmarking tone/i, label: "no validated pain" },
  { pattern: /passed on|walked away|do not pursue|deprioritize/i, label: "prospect passed" },
  { pattern: /agency|services shop|reseller/i, label: "agency — not a buyer" },
];

function gatherMeetingContext(meeting: RepMeetingRow): string {
  const meetingSpecific = [
    meeting.triage_explanation ?? "",
    ...(meeting.open_points ?? []),
  ]
    .join(" ")
    .trim();

  if (meetingSpecific) {
    return meetingSpecific;
  }

  const memory = meeting.prospect.memory;
  return [
    ...(memory?.objections ?? []),
    ...(memory?.concerns ?? []),
    ...(memory?.pain_points ?? []),
    ...(memory?.next_actions ?? []),
    ...(memory?.buying_signals ?? []),
    memory?.timeline ?? "",
  ].join(" ");
}

function inferFollowUpTheme(context: string): string {
  for (const theme of FOLLOW_UP_THEMES) {
    if (theme.pattern.test(context)) {
      return theme.label;
    }
  }
  return "next steps";
}

function inferRejectionReason(meeting: RepMeetingRow): string {
  const context = gatherMeetingContext(meeting);

  for (const reason of REJECTION_REASONS) {
    if (reason.pattern.test(context)) {
      return reason.label;
    }
  }

  const explanation = meeting.triage_explanation?.trim();
  if (explanation) {
    const snippet = explanation
      .replace(/\s*[—–-]\s*/g, " — ")
      .split(/[.;]/)[0]
      .trim()
      .toLowerCase();
    if (snippet.length <= 52) {
      return snippet;
    }
    return `${snippet.slice(0, 49).trim()}…`;
  }

  return "not pursuing";
}

/** Single informative label shown under the meeting timestamp on rep board cards. */
export function getMeetingCallout(meeting: RepMeetingRow): string {
  const context = gatherMeetingContext(meeting);
  const upcoming = isUpcoming(meeting.scheduled_at, meeting.completed_at);

  if (meeting.prospect.stage === "rejected" || meeting.triage_status === "reject") {
    return `Rejected · ${inferRejectionReason(meeting)}`;
  }

  if (meeting.type === "discovery") {
    return "Discovery · first call";
  }

  if (upcoming && meeting.type === "demo" && meeting.prospect.stage === "demo_scheduled") {
    const theme = inferFollowUpTheme(context);
    return theme === "next steps"
      ? "Demo scheduled · product walkthrough"
      : `Demo scheduled · ${theme}`;
  }

  if (meeting.prospect.stage === "closing") {
    if (meeting.type === "closing") {
      return upcoming
        ? "Ongoing pilot · check-in scheduled"
        : "Ongoing pilot · progress review";
    }
    return `Follow-up · ${inferFollowUpTheme(context)}`;
  }

  if (meeting.type === "demo") {
    return `Follow-up · ${inferFollowUpTheme(context)}`;
  }

  if (meeting.type === "closing") {
    return `Follow-up · ${inferFollowUpTheme(context)}`;
  }

  return `Follow-up · ${inferFollowUpTheme(context)}`;
}

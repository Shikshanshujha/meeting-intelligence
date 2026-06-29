import type { MeetingBrief } from "@/types";

interface BriefCardProps {
  brief: MeetingBrief;
  source?: string;
  geminiConfigured?: boolean;
  aiError?: string;
}

function briefSourceLabel(
  source?: string,
  geminiConfigured?: boolean,
  aiError?: string
): string {
  if (source === "ai") return "AI generated";
  if (geminiConfigured === false) return "Template (no API key)";
  if (source === "template" && aiError) return "Template fallback";
  if (source === "template") return "Template fallback";
  return "";
}

export function BriefCard({
  brief,
  source,
  geminiConfigured,
  aiError,
}: BriefCardProps) {
  const sourceLabel = briefSourceLabel(source, geminiConfigured, aiError);

  const sections: { label: string; items: string[] | string; mono?: boolean }[] = [
    { label: "Prospect", items: brief.prospect_summary, mono: true },
    { label: "Previous concerns", items: brief.previous_concerns },
    { label: "Buying signals", items: brief.buying_signals },
    { label: "Deal risks", items: brief.deal_risks },
    { label: "Questions to ask", items: brief.questions_to_ask },
    { label: "Recommended outcome", items: brief.recommended_outcome, mono: true },
  ];

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-zinc-900">Meeting brief</h2>
        {sourceLabel && (
          <span
            className={`text-xs ${
              source === "ai" ? "text-emerald-600" : "text-zinc-400"
            }`}
          >
            {sourceLabel}
          </span>
        )}
      </div>

      {source === "template" && aiError && geminiConfigured !== false && (
        <p className="border-b border-zinc-100 px-4 py-2 text-xs text-amber-700 sm:px-5">
          AI unavailable: {aiError}. Showing template brief from memory.
        </p>
      )}

      <div className="divide-y divide-zinc-100">
        {sections.map((section) => (
          <div key={section.label} className="px-4 py-3 sm:px-5">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {section.label}
            </p>
            {Array.isArray(section.items) ? (
              <ul className="mt-2 space-y-1.5">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-snug text-zinc-800"
                  >
                    <span className="text-zinc-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-snug text-zinc-800">
                {section.items}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

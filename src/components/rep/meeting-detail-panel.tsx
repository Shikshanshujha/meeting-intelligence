"use client";

import { useState } from "react";
import type { MeetingBrief, ProspectMemory } from "@/types";
import { GenerateBriefSection } from "./generate-brief-section";
import { MeetingNotesForm } from "./meeting-notes-form";
import type { ProspectStage } from "@/types";

interface MeetingDetailPanelProps {
  meetingId: string;
  memoryStamp: string;
  prospectStage?: ProspectStage;
  initialBrief?: MeetingBrief | null;
  initialSource?: string;
  initialGeminiConfigured?: boolean;
  submittedNotes?: string | null;
  submittedTranscript?: string | null;
  submittedStage?: ProspectStage;
  isCompleted: boolean;
}

export function MeetingDetailPanel({
  meetingId,
  memoryStamp: initialMemoryStamp,
  prospectStage = "discovery",
  initialBrief,
  initialSource,
  initialGeminiConfigured,
  submittedNotes,
  submittedTranscript,
  submittedStage,
  isCompleted,
}: MeetingDetailPanelProps) {
  const [memoryStamp, setMemoryStamp] = useState(initialMemoryStamp);
  const [staleBrief, setStaleBrief] = useState(false);

  function handleNotesSaved(payload: {
    memory_stamp: string;
    memory: ProspectMemory;
    completed: boolean;
  }) {
    setMemoryStamp(payload.memory_stamp);
    setStaleBrief(true);
  }

  return (
    <div className="space-y-6">
      <GenerateBriefSection
        meetingId={meetingId}
        memoryStamp={memoryStamp}
        initialBrief={initialBrief}
        initialSource={initialSource}
        initialGeminiConfigured={initialGeminiConfigured}
        staleAfterNotes={staleBrief}
      />

      <MeetingNotesForm
        meetingId={meetingId}
        prospectStage={prospectStage}
        submittedNotes={submittedNotes}
        submittedTranscript={submittedTranscript}
        submittedStage={submittedStage}
        isCompleted={isCompleted}
        onNotesSaved={handleNotesSaved}
      />
    </div>
  );
}

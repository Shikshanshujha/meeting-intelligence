"use client";

import { ScheduleMeetingForm } from "@/components/rep/schedule-meeting-form";
import { UpcomingMeetingActions } from "@/components/rep/upcoming-meeting-actions";
import type { RepMeetingRow } from "@/lib/data/queries";
import type { MeetingType } from "@/types";

interface ProspectFollowUpOrRescheduleProps {
  prospectId: string;
  prospectCompany: string;
  upcomingMeeting?: RepMeetingRow | null;
  defaultMeetingType?: MeetingType;
  scheduleButtonLabel?: string;
  scheduleButtonClassName?: string;
  variant?: "default" | "dark";
}

export function ProspectFollowUpOrReschedule({
  prospectId,
  prospectCompany,
  upcomingMeeting,
  defaultMeetingType,
  scheduleButtonLabel = "Schedule follow-up",
  scheduleButtonClassName = "btn-primary w-full shrink-0 sm:w-auto",
  variant = "default",
}: ProspectFollowUpOrRescheduleProps) {
  if (upcomingMeeting) {
    return (
      <UpcomingMeetingActions
        meetingId={upcomingMeeting.id}
        prospectCompany={prospectCompany}
        meetingType={upcomingMeeting.type}
        scheduledAt={upcomingMeeting.scheduled_at}
        meetingLink={upcomingMeeting.meeting_link}
        variant={variant}
      />
    );
  }

  return (
    <ScheduleMeetingForm
      prospectId={prospectId}
      prospectCompany={prospectCompany}
      defaultMeetingType={defaultMeetingType}
      buttonLabel={scheduleButtonLabel}
      buttonClassName={scheduleButtonClassName}
    />
  );
}

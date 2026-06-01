export type MeetingStatus = "Live" | "Upcoming" | "Completed";

export type MeetingPlatform = "Zoom" | "Meet" | "Teams";

export type Meeting = {
  id: string;
  title: string;
  team: string;
  time: string;
  duration: string;
  platform: MeetingPlatform;
  status: MeetingStatus;
  participants: string[];
  agenda: string;
  actionItems: number;
  minutesReady: boolean;
};

export type MeetingFormValue = Omit<Meeting, "id">;

export type MeetingStatus = "upcoming" | "live" | "completed" | "cancelled";

export type MeetingPlatform = "zoom" | "meet" | "teams" | "other";

export type MeetingApi = {
  id: string;
  tenant_id: string;
  title: string;
  description?: string;
  agenda?: string;
  scheduled_at: string;
  duration_minutes: number;
  platform: MeetingPlatform;
  meeting_url?: string;
  status: MeetingStatus;
  owner_user_id: string;
  minutes_ready: boolean;
  minutes_content?: string;
  action_item_count?: number;
  participant_user_ids?: string[];
  created_at: string;
  updated_at: string;
};

export type ActionItemApi = {
  id: string;
  meeting_id: string;
  title: string;
  assignee_user_id?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
};

export type ParticipantApi = {
  id: string;
  meeting_id: string;
  user_id: string;
  rsvp_status: "pending" | "accepted" | "declined";
  attended: boolean;
  created_at: string;
};

export type CreateMeetingRequest = {
  tenant_id: string;
  title: string;
  description?: string;
  agenda?: string;
  scheduled_at: string;
  duration_minutes?: number;
  platform: MeetingPlatform;
  meeting_url?: string;
  participant_user_ids?: string[];
};

export type UpdateMeetingRequest = {
  title?: string;
  description?: string;
  agenda?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  platform?: MeetingPlatform;
  meeting_url?: string;
  status?: MeetingStatus;
};

export type CreateActionItemRequest = {
  title: string;
  assignee_user_id?: string;
};

export type UpdateActionItemRequest = {
  title?: string;
  assignee_user_id?: string;
  is_completed?: boolean;
};

export type SaveMinutesRequest = {
  content: string;
  minutes_ready: boolean;
};

// Display helpers for UI compatibility
export type MeetingDisplayStatus = "Live" | "Upcoming" | "Completed" | "Cancelled";

export function displayStatus(status: MeetingStatus): MeetingDisplayStatus {
  const map: Record<MeetingStatus, MeetingDisplayStatus> = {
    upcoming: "Upcoming",
    live: "Live",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return map[status] || "Upcoming";
}

export function displayPlatform(platform: MeetingPlatform): string {
  const map: Record<MeetingPlatform, string> = {
    zoom: "Zoom",
    meet: "Meet",
    teams: "Teams",
    other: "Other",
  };
  return map[platform] || platform;
}

import { apiClient } from "$lib/api/client.js";
import type {
  MeetingApi,
  ActionItemApi,
  ParticipantApi,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  SaveMinutesRequest,
} from "../types/meeting.js";

// ─── Meetings CRUD ───

export async function getMeetingsApi(
  tenantId: string,
  params: { status?: string; search?: string; page?: number; limit?: number } = {},
): Promise<{ data: MeetingApi[]; page: number; limit: number; total_pages: number; total_results: number }> {
  const response = await apiClient.get<any>("/meetings", {
    params: { tenant_id: tenantId, ...params },
  });
  return {
    data: response.data.data || [],
    page: response.data.page || 1,
    limit: response.data.limit || 10,
    total_pages: response.data.total_pages || 0,
    total_results: response.data.total_results || 0,
  };
}

export async function getMeetingApi(id: string): Promise<MeetingApi> {
  const response = await apiClient.get<{ data: MeetingApi }>(`/meetings/${id}`);
  return response.data.data;
}

export async function createMeetingApi(data: CreateMeetingRequest): Promise<MeetingApi> {
  const response = await apiClient.post<{ data: MeetingApi }>("/meetings", data);
  return response.data.data;
}

export async function updateMeetingApi(id: string, data: UpdateMeetingRequest): Promise<void> {
  await apiClient.put(`/meetings/${id}`, data);
}

export async function deleteMeetingApi(id: string): Promise<void> {
  await apiClient.delete(`/meetings/${id}`);
}

export async function updateMeetingStatusApi(id: string, status: string): Promise<void> {
  await apiClient.patch(`/meetings/${id}/status`, { status });
}

// ─── Participants ───

export async function getParticipantsApi(meetingId: string): Promise<ParticipantApi[]> {
  const response = await apiClient.get<any>(`/meetings/${meetingId}/participants`);
  return response.data.data || [];
}

export async function addParticipantsApi(meetingId: string, userIds: string[]): Promise<void> {
  await apiClient.post(`/meetings/${meetingId}/participants`, { user_ids: userIds });
}

export async function removeParticipantApi(meetingId: string, userId: string): Promise<void> {
  await apiClient.delete(`/meetings/${meetingId}/participants/${userId}`);
}

// ─── Action Items ───

export async function getActionItemsApi(meetingId: string): Promise<ActionItemApi[]> {
  const response = await apiClient.get<any>(`/meetings/${meetingId}/action-items`);
  return response.data.data || [];
}

export async function createActionItemApi(meetingId: string, data: CreateActionItemRequest): Promise<ActionItemApi> {
  const response = await apiClient.post<{ data: ActionItemApi }>(`/meetings/${meetingId}/action-items`, data);
  return response.data.data;
}

export async function updateActionItemApi(meetingId: string, itemId: string, data: UpdateActionItemRequest): Promise<void> {
  await apiClient.put(`/meetings/${meetingId}/action-items/${itemId}`, data);
}

export async function deleteActionItemApi(meetingId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/meetings/${meetingId}/action-items/${itemId}`);
}

// ─── Minutes ───

export async function saveMinutesApi(meetingId: string, data: SaveMinutesRequest): Promise<void> {
  await apiClient.put(`/meetings/${meetingId}/minutes`, data);
}

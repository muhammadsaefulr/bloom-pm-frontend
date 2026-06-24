import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
import {
  getMeetingsApi,
  getMeetingApi,
  createMeetingApi,
  updateMeetingApi,
  deleteMeetingApi,
  updateMeetingStatusApi,
  getActionItemsApi,
  createActionItemApi,
  updateActionItemApi,
  deleteActionItemApi,
  saveMinutesApi,
  addParticipantsApi,
  removeParticipantApi,
} from "../api/meetingsApi.js";
import type {
  CreateMeetingRequest,
  UpdateMeetingRequest,
  CreateActionItemRequest,
  UpdateActionItemRequest,
  SaveMinutesRequest,
} from "../types/meeting.js";

// ─── Meetings Queries ───

export function useMeetings(
  getTenantId: () => string | undefined,
  getParams?: () => { status?: string; search?: string; page?: number; limit?: number },
) {
  return createQuery(() => ({
    queryKey: ["meetings", getTenantId(), getParams?.()],
    queryFn: () => getMeetingsApi(getTenantId()!, getParams?.()),
    enabled: !!getTenantId(),
  }));
}

export function useMeeting(getMeetingId: () => string | undefined) {
  return createQuery(() => ({
    queryKey: ["meeting", getMeetingId()],
    queryFn: () => getMeetingApi(getMeetingId()!),
    enabled: !!getMeetingId(),
  }));
}

// ─── Meetings Mutations ───

export function useCreateMeetingMutation(getTenantId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (data: CreateMeetingRequest) => createMeetingApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", getTenantId()] });
    },
  }));
}

export function useUpdateMeetingMutation(getTenantId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: string; data: UpdateMeetingRequest }) => updateMeetingApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", getTenantId()] });
    },
  }));
}

export function useDeleteMeetingMutation(getTenantId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (id: string) => deleteMeetingApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", getTenantId()] });
    },
  }));
}

export function useUpdateMeetingStatusMutation(getTenantId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateMeetingStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", getTenantId()] });
    },
  }));
}

// ─── Action Items ───

export function useActionItems(getMeetingId: () => string | undefined) {
  return createQuery(() => ({
    queryKey: ["actionItems", getMeetingId()],
    queryFn: () => getActionItemsApi(getMeetingId()!),
    enabled: !!getMeetingId(),
  }));
}

export function useCreateActionItemMutation(getMeetingId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (data: CreateActionItemRequest) => createActionItemApi(getMeetingId()!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", getMeetingId()] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  }));
}

export function useUpdateActionItemMutation(getMeetingId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateActionItemRequest }) =>
      updateActionItemApi(getMeetingId()!, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", getMeetingId()] });
    },
  }));
}

export function useDeleteActionItemMutation(getMeetingId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (itemId: string) => deleteActionItemApi(getMeetingId()!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionItems", getMeetingId()] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  }));
}

// ─── Participants ───

export function useAddParticipantsMutation(getMeetingId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (userIds: string[]) => addParticipantsApi(getMeetingId()!, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", getMeetingId()] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  }));
}

export function useRemoveParticipantMutation(getMeetingId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (userId: string) => removeParticipantApi(getMeetingId()!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", getMeetingId()] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  }));
}

// ─── Minutes ───

export function useSaveMinutesMutation(getTenantId: () => string | undefined) {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ meetingId, data }: { meetingId: string; data: SaveMinutesRequest }) =>
      saveMinutesApi(meetingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", getTenantId()] });
    },
  }));
}

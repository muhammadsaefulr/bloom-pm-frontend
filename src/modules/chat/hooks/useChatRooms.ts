import { apiClient } from "$lib/api/client";

export type ChatRoomApi = {
  id: string;
  tenant_id: string;
  room_type: "private" | "group";
  name?: string;
  owner_user_id?: string;
  participant_count: number;
  participant_user_ids?: string[];
  last_message?: ChatMessageApi;
  created_at: string;
  deleted_at?: string | null;
};

export type ChatMessageApi = {
  id: string;
  tenant_id: string;
  room_id: string;
  sender_user_id: string;
  content: string;
  message_type: "text" | "file" | "system";
  read_by_others?: boolean;
  created_at: string;
};

export async function startPrivateChatApi(tenantID: string, targetUserID: string): Promise<ChatRoomApi> {
  const response = await apiClient.post<{ data: ChatRoomApi }>("/chat/private/start", {
    tenant_id: tenantID,
    target_user_id: targetUserID,
  });
  return response.data.data;
}

export async function createGroupChatApi(
  tenantID: string,
  name: string,
  memberUserIDs: string[],
): Promise<ChatRoomApi> {
  const response = await apiClient.post<{ data: ChatRoomApi }>("/chat/groups", {
    tenant_id: tenantID,
    name,
    member_user_ids: memberUserIDs,
  });
  return response.data.data;
}

export async function getChatRoomsApi(tenantID: string): Promise<ChatRoomApi[]> {
  const response = await apiClient.get<{ data: ChatRoomApi[] }>("/chat/rooms", {
    params: { tenant_id: tenantID },
  });
  return response.data.data || [];
}

export async function getChatMessagesApi(
  tenantID: string,
  roomID: string,
  limit = 30,
  beforeMessageID?: string,
): Promise<ChatMessageApi[]> {
  const response = await apiClient.get<{ data: ChatMessageApi[] }>(`/chat/rooms/${roomID}/messages`, {
    params: {
      tenant_id: tenantID,
      limit,
      before_message_id: beforeMessageID || undefined,
    },
  });
  return response.data.data || [];
}

export async function removeGroupParticipantApi(
  tenantID: string,
  roomID: string,
  userID: string,
): Promise<void> {
  await apiClient.delete(`/chat/groups/${roomID}/participants/${userID}`, {
    params: { tenant_id: tenantID },
  });
}

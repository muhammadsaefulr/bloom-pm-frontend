import { apiClient } from "$lib/api/client.js";

export type ChatRoomApi = {
  id: string;
  tenant_id: string;
  room_type: "private" | "group";
  name?: string;
  description?: string;
  owner_user_id?: string;
  participant_count: number;
  participant_user_ids?: string[];
  contact_user_id?: string;
  presence_status?: "online" | "offline" | "last_seen_recently";
  last_seen_at?: string | null;
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
  description: string,
  memberUserIDs: string[],
): Promise<ChatRoomApi> {
  const response = await apiClient.post<{ data: ChatRoomApi }>("/chat/groups", {
    tenant_id: tenantID,
    name,
    description,
    member_user_ids: memberUserIDs,
  });
  return response.data.data;
}

export async function updateGroupChatApi(
  tenantID: string,
  roomID: string,
  name: string,
  description: string,
): Promise<ChatRoomApi> {
  const response = await apiClient.patch<{ data: ChatRoomApi }>(`/chat/groups/${roomID}`, {
    tenant_id: tenantID,
    name,
    description,
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

export async function searchChatMessagesApi(
  tenantID: string,
  roomID: string,
  query: string,
  limit = 30,
): Promise<ChatMessageApi[]> {
  const response = await apiClient.get<{ data: ChatMessageApi[] }>(`/chat/rooms/${roomID}/messages/search`, {
    params: {
      tenant_id: tenantID,
      q: query,
      limit,
    },
  });
  return response.data.data || [];
}

export async function deleteChatMessageApi(
  tenantID: string,
  roomID: string,
  messageID: string,
): Promise<void> {
  await apiClient.delete(`/chat/rooms/${roomID}/messages/${messageID}`, {
    params: { tenant_id: tenantID },
  });
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

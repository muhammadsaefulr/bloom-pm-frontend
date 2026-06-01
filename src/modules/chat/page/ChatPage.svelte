<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Unsubscriber } from "svelte/store";
  import ChatLayout from "../components/ChatLayout.svelte";
  import ChatSidebar from "../components/ChatSidebar.svelte";
  import ChatArea from "../components/ChatArea.svelte";
  import { authStore } from "../../auth/stores/authStore.js";
  import type { AuthSession } from "../../auth/types/index.js";
  import { getTeamMembersApi } from "../../teams/api/teamsApi.js";
  import type { TeamMember } from "../../teams/types/index.js";
  import { useChatWebSocket, type ChatWsMessage, type WsStatus } from "../hooks/useChatWebSocket.js";
  import {
    createGroupChatApi,
    deleteChatMessageApi,
    getChatMessagesApi,
    getChatRoomsApi,
    removeGroupParticipantApi,
    searchChatMessagesApi,
    startPrivateChatApi,
    updateGroupChatApi,
    type ChatMessageApi,
    type ChatRoomApi,
  } from "../hooks/useChatRooms.js";

  type WsEventType = "message" | "read_receipt" | "typing" | "join" | "leave" | "history" | "presence" | "presence_state" | "remove_participant" | "participant_removed" | "delete_message" | "message_deleted" | "error";
  type WsMessage = ChatWsMessage & { type: WsEventType };
  type PresenceStatus = "online" | "offline" | "last_seen_recently";
  type ChatRoom = { id: string; name: string; description?: string; avatar: string; lastMessage: string; time: string; unread: number; roomType: "private" | "group"; isGroup: boolean; status?: PresenceStatus; participantUserIds?: string[]; ownerUserId?: string; participantCount?: number; contactUserId?: string; contactEmail?: string; };
  type ChatMessage = { id: string; sender: "me" | "other"; senderUserId: string; senderName?: string; text: string; time: string; createdAt: string; isConsecutive: boolean; readByOthers?: boolean; };
  type ContactItem = { id: string; user_id: string; name: string; email: string; avatar: string; };
  type GroupMemberItem = { user_id: string; name: string; email: string; avatar: string; isCurrentUser: boolean; isOwner: boolean; };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  const roomMessagesMap: Record<string, ChatMessage[]> = {};
  const roomTypingMap: Record<string, Set<string>> = {};
  const roomOnlineMap: Record<string, Set<string>> = {};

  let wsStatus: "connecting" | "connected" | "disconnected" = "disconnected";
  let currentUserID = "";
  let tenantID = "";
  let wsError = "";
  let wsDebugLogs: string[] = [];
  let chats: ChatRoom[] = [];
  let contacts: ContactItem[] = [];
  let activeChatId = "";
  let activeChat: ChatRoom | null = null;
  let messages: ChatMessage[] = [];
  let typingUsers: string[] = [];
  let loadedSessionKey = "";
  let presenceVersion = 0;
  let canManageActiveGroup = false;
  let currentUserName = "";
  let currentUserEmail = "";
  let currentUserAvatar = "";
  let activeGroupMembers: GroupMemberItem[] = [];
  let searchResults: ChatMessage[] = [];
  let isSearchingMessages = false;
  $: {
    presenceVersion;
    const selected = chats.find((chat) => chat.id === activeChatId) || null;
    if (!selected) {
      activeChat = null;
    } else if (isGroupChat(selected)) {
      activeChat = { ...selected, status: undefined };
    } else {
      const otherUserID = getOtherParticipantID(selected);
      const isOnline = !!otherUserID && !!roomOnlineMap[selected.id]?.has(otherUserID);
      activeChat = { ...selected, roomType: "private", isGroup: false, status: isOnline ? "online" : selected.status || "offline" };
    }
    canManageActiveGroup = !!activeChat && isGroupChat(activeChat) && !!currentUserID && activeChat.ownerUserId === currentUserID;
  }

  function buildRoomsFromURL(): ChatRoom[] {
    if (typeof window === "undefined") return [];
    const params = new URLSearchParams(window.location.search);
    const roomID = params.get("room_id");
    if (!roomID) return [];
    const roomName = params.get("room_name") || "Chat Room";
    const roomType = params.get("room_type") === "group" ? "group" : "private";
    return [{ id: roomID, name: roomName, avatar: avatarForName(roomName, "0EA5E9"), lastMessage: "Connecting to room...", time: "Now", unread: 0, roomType, isGroup: roomType === "group", status: roomType === "private" ? "offline" : undefined }];
  }

  function getAccessTokenForWs(): string {
    const storeToken = authStore.getAccessToken();
    if (storeToken) return storeToken;
    if (typeof document === "undefined") return "";
    const cookieToken = document.cookie.split("; ").find((row) => row.startsWith("access_token="))?.split("=")[1];
    return cookieToken ? decodeURIComponent(cookieToken) : "";
  }

  function formatTime(dateLike: string): string { const d = new Date(dateLike); return Number.isNaN(d.getTime()) ? "Now" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  function computeConsecutive(msgs: ChatMessage[]): ChatMessage[] { return msgs.map((m, idx) => ({ ...m, isConsecutive: idx > 0 && msgs[idx - 1].sender === m.sender })); }
  function displayNameByUserID(userID: string) {
    if (userID === currentUserID) return "You";
    return contacts.find((contact) => contact.user_id === userID)?.name || "User";
  }
  function initialsForName(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "C";
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
  }
  function avatarForName(name: string, background = "64748B") {
    const initials = initialsForName(name);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#${background}"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial, sans-serif" font-size="32" font-weight="700">${initials}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  function getGroupMember(userID: string): GroupMemberItem {
    const contact = contacts.find((item) => item.user_id === userID);
    const isCurrentUser = userID === currentUserID;
    const name = isCurrentUser ? currentUserName || "You" : contact?.name || "User";
    return {
      user_id: userID,
      name,
      email: isCurrentUser ? currentUserEmail || "-" : contact?.email || "-",
      avatar: isCurrentUser ? currentUserAvatar || avatarForName(name, "EC4899") : contact?.avatar || avatarForName(name),
      isCurrentUser,
      isOwner: userID === activeChat?.ownerUserId,
    };
  }
  $: {
    contacts;
    currentUserID;
    currentUserName;
    currentUserEmail;
    currentUserAvatar;
    activeGroupMembers = activeChat && isGroupChat(activeChat)
      ? (activeChat.participantUserIds || []).map(getGroupMember)
      : [];
  }
  function syncActiveRoomState() {
    messages = computeConsecutive(roomMessagesMap[activeChatId] || []);
    typingUsers = Array.from(roomTypingMap[activeChatId] || []).map(displayNameByUserID);
  }
  function pushDebug(line: string) { wsDebugLogs = [...wsDebugLogs.slice(-119), line]; }
  function mapApiMessage(message: ChatMessageApi): ChatMessage {
    const sender = message.sender_user_id === currentUserID ? "me" : "other";
    return {
      id: message.id,
      sender,
      senderUserId: message.sender_user_id,
      senderName: displayNameByUserID(message.sender_user_id),
      text: message.content,
      time: formatTime(message.created_at),
      createdAt: message.created_at,
      isConsecutive: false,
      readByOthers: !!message.read_by_others,
    };
  }
  function contactByUserID(userID: string) { return contacts.find((contact) => contact.user_id === userID); }
  function chatDataSessionKey() {
    return tenantID && currentUserID ? `${tenantID}:${currentUserID}` : "";
  }
  function getOtherParticipantID(room: Pick<ChatRoom, "roomType" | "contactUserId" | "participantUserIds">) {
    if (room.roomType === "group") return "";
    return room.contactUserId || room.participantUserIds?.find((id) => id !== currentUserID) || "";
  }
  function isDirectChat(room: Pick<ChatRoom, "roomType" | "contactUserId" | "participantUserIds" | "participantCount">) {
    return room.roomType === "private";
  }
  function isGroupChat(room: Pick<ChatRoom, "roomType">) {
    return room.roomType === "group";
  }
  function roomIDFromPayload(payload: WsMessage, eventName: string) {
    if (payload.room_id) return payload.room_id;
    pushDebug(`[${new Date().toLocaleTimeString()}] dropped ${eventName}: missing room_id`);
    return "";
  }
  function shouldKeepLocalRoom(room: ChatRoom, serverRoomIDs: Set<string>) {
    return room.id.startsWith("pending:") || (room.id === activeChatId && !serverRoomIDs.has(room.id));
  }
  function isRecentLastSeen(lastSeenAt?: string) {
    if (!lastSeenAt) return false;
    const lastSeen = new Date(lastSeenAt).getTime();
    return !Number.isNaN(lastSeen) && Date.now() - lastSeen <= 15 * 60 * 1000;
  }
  function normalizedRoomType(room: ChatRoomApi): "private" | "group" {
    const otherUserID = room.contact_user_id || room.participant_user_ids?.find((id) => id !== currentUserID) || "";
    const contact = otherUserID ? contactByUserID(otherUserID) : null;
    const participantTotal = room.participant_user_ids?.length || room.participant_count || 0;
    const roomName = (room.name || "").trim().toLowerCase();
    const contactName = (contact?.name || "").trim().toLowerCase();
    const hasGroupIdentity = !!room.owner_user_id || !!room.description?.trim() || (!!roomName && roomName !== contactName);
    const looksLikeLegacyDirectRoom = participantTotal === 2 && !!contact && !hasGroupIdentity && (!roomName || roomName === contactName);

    if (room.room_type === "private" || room.contact_user_id) return "private";
    if (room.room_type === "group" && hasGroupIdentity) return "group";
    if (looksLikeLegacyDirectRoom) return "private";
    return "group";
  }
  function mapApiRoom(room: ChatRoomApi): ChatRoom {
    const roomType = normalizedRoomType(room);
    const otherUserID = room.contact_user_id || room.participant_user_ids?.find((id) => id !== currentUserID) || "";
    const contact = otherUserID ? contactByUserID(otherUserID) : null;
    const privateContact = roomType === "private" ? contact : null;
    const roomName = roomType === "private" ? contact?.name || room.name || "Private Chat" : room.name || "Group Chat";
    const presenceStatus = room.presence_status || "offline";
    return {
      id: room.id,
      name: roomName,
      description: room.description || "",
      avatar: privateContact?.avatar || avatarForName(roomName, roomType === "group" ? "EC4899" : "0EA5E9"),
      lastMessage: room.last_message?.content || (roomType === "private" ? "Private chat" : "Group chat"),
      time: room.last_message?.created_at ? formatTime(room.last_message.created_at) : room.created_at ? formatTime(room.created_at) : "Now",
      unread: 0,
      roomType,
      isGroup: roomType === "group",
      status: roomType === "private" ? presenceStatus : undefined,
      participantUserIds: room.participant_user_ids || [],
      ownerUserId: room.owner_user_id,
      participantCount: room.participant_count,
      contactUserId: roomType === "private" ? room.contact_user_id || otherUserID : undefined,
      contactEmail: roomType === "private" ? contact?.email : undefined,
    };
  }
  function setRoomPresence(roomID: string, userID: string, status: "online" | "offline", lastSeenAt?: string) {
    if (!roomOnlineMap[roomID]) roomOnlineMap[roomID] = new Set<string>();
    if (status === "online") roomOnlineMap[roomID].add(userID);
    if (status === "offline") roomOnlineMap[roomID].delete(userID);
    presenceVersion += 1;
    pushDebug(`[${new Date().toLocaleTimeString()}] presence room=${roomID} user=${userID} status=${status}`);

    chats = chats.map((chat) => {
      if (chat.id !== roomID || !isDirectChat(chat)) return chat;
      const otherUserID = getOtherParticipantID(chat);
      if (!otherUserID) {
        pushDebug(`[${new Date().toLocaleTimeString()}] presence ignored room=${roomID} no_other_participant`);
        return chat;
      }
      const nextStatus: PresenceStatus = roomOnlineMap[roomID]?.has(otherUserID)
        ? "online"
        : isRecentLastSeen(lastSeenAt)
          ? "last_seen_recently"
          : "offline";
      pushDebug(`[${new Date().toLocaleTimeString()}] room status room=${roomID} other=${otherUserID} next=${nextStatus}`);
      return { ...chat, status: nextStatus };
    });
  }
  async function loadChatRooms() {
    if (!tenantID) return;
    try {
      const rooms = await getChatRoomsApi(tenantID);
      const mappedRooms = rooms.map(mapApiRoom);
      const serverRoomIDs = new Set(mappedRooms.map((room) => room.id));
      const localRooms = chats.filter((room) => shouldKeepLocalRoom(room, serverRoomIDs));
      const seenPrivateParticipants = new Set<string>();
      const visibleRooms = mappedRooms.filter((room) => {
        if (isGroupChat(room)) return true;
        const otherUserID = getOtherParticipantID(room) || room.id;
        if (seenPrivateParticipants.has(otherUserID)) return false;
        seenPrivateParticipants.add(otherUserID);
        return true;
      });
      chats = [
        ...localRooms,
        ...visibleRooms.filter((room) => !localRooms.some((localRoom) => localRoom.id === room.id)),
      ];
      pushDebug(`[${new Date().toLocaleTimeString()}] loaded rooms=${rooms.length} visible=${chats.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat room chat";
      pushDebug(`[${new Date().toLocaleTimeString()}] load rooms failed: ${message}`);
    }
  }
  async function loadRoomHistory(roomID: string) {
    if (!tenantID || !roomID) return;
    try {
      const history = await getChatMessagesApi(tenantID, roomID, 50);
      roomMessagesMap[roomID] = history.map(mapApiMessage).reverse();
      syncActiveRoomState();
      pushDebug(`[${new Date().toLocaleTimeString()}] loaded history room=${roomID} messages=${history.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat history chat";
      pushDebug(`[${new Date().toLocaleTimeString()}] load history failed: ${message}`);
    }
  }

  async function loadChatDataForCurrentSession() {
    const sessionKey = chatDataSessionKey();
    if (!tenantID || !currentUserID || loadedSessionKey === sessionKey) return;
    loadedSessionKey = sessionKey;
    pushDebug(`[${new Date().toLocaleTimeString()}] loading chat data tenant=${tenantID} user=${currentUserID}`);

    try {
      const members: TeamMember[] = await getTeamMembersApi(tenantID);
      contacts = members
        .filter((m: TeamMember) => m.user_id && m.user_id !== currentUserID)
        .map((m: TeamMember) => ({
          id: m.id,
          user_id: m.user_id,
          name: m.user?.name || "Unknown User",
          email: m.user?.email || "-",
          avatar:
            m.user?.avatar_url ||
            avatarForName(m.user?.name || "User", "14B8A6"),
        }));
      await loadChatRooms();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data chat";
      contacts = [];
      loadedSessionKey = "";
      pushDebug(`[${new Date().toLocaleTimeString()}] load chat data failed: ${message}`);
    }
  }

  const ws = useChatWebSocket({
    getToken: getAccessTokenForWs,
    getTenantID: () => tenantID,
    getRoomID: () => activeChatId,
    apiBaseUrl: API_BASE_URL,
    onMessage: (payload: ChatWsMessage) => handleWsMessage(payload as WsMessage),
    onStatus: (status: WsStatus) => {
      wsStatus = status;
      if (status === "connected") markAsReadLatest();
    },
    onError: (message: string) => { wsError = message; },
    onDebug: pushDebug,
  });

  function sendWs(payload: WsMessage) { ws.send(payload); }
  function markAsReadLatest() {
    const roomMsgs = roomMessagesMap[activeChatId] || [];
    const latest = roomMsgs[roomMsgs.length - 1];
    if (!latest?.id) return;
    sendWs({ type: "read_receipt", room_id: activeChatId, message_id: latest.id });
  }

  function updateSidebarLastMessage(roomID: string, text: string, createdAt: string) {
    chats = chats.map((chat) => chat.id === roomID ? { ...chat, lastMessage: text, time: formatTime(createdAt) } : chat);
  }
  function upsertPendingPrivateChat(contact: ContactItem, pendingID: string) {
    const pendingChat: ChatRoom = {
      id: pendingID,
      name: contact.name || "Private Chat",
      avatar: contact.avatar || avatarForName(contact.name || "User", "0EA5E9"),
      lastMessage: "Menyiapkan private chat...",
      time: "Now",
      unread: 0,
      roomType: "private",
      isGroup: false,
      status: "offline",
      participantUserIds: [currentUserID, contact.user_id].filter(Boolean),
      participantCount: 2,
      contactUserId: contact.user_id,
      contactEmail: contact.email,
    };
    chats = [pendingChat, ...chats.filter((chat) => chat.id !== pendingID)];
    activeChatId = pendingID;
    roomMessagesMap[pendingID] = [];
    messages = [];
    typingUsers = [];
    syncActiveRoomState();
  }

  function handleWsMessage(payload: WsMessage) {
    if (payload.type === "error") { wsError = payload.content || "Unknown chat error"; return; }
    if (payload.type === "presence_state") {
      const roomID = roomIDFromPayload(payload, "presence_state");
      if (!roomID) return;
      const userIDs = (payload.metadata?.online_user_ids || []) as string[];
      pushDebug(`[${new Date().toLocaleTimeString()}] presence_state room=${roomID} online=${userIDs.join(",") || "-"}`);
      roomOnlineMap[roomID] = new Set(userIDs.filter((id) => id !== currentUserID));
      presenceVersion += 1;
      for (const userID of userIDs) setRoomPresence(roomID, userID, "online");
      chats = chats.map((chat) => {
        if (chat.id !== roomID || !isDirectChat(chat)) return chat;
        const otherUserID = getOtherParticipantID(chat);
        return {
          ...chat,
          status: otherUserID && roomOnlineMap[roomID]?.has(otherUserID)
            ? "online"
            : chat.status === "last_seen_recently"
              ? "last_seen_recently"
              : "offline",
        };
      });
      return;
    }
    if (payload.type === "presence") {
      const roomID = roomIDFromPayload(payload, "presence");
      if (!roomID) return;
      const sender = payload.sender_user_id || "";
      const status = payload.metadata?.status === "online" ? "online" : "offline";
      const lastSeenAt = typeof payload.metadata?.last_seen_at === "string" ? payload.metadata.last_seen_at : undefined;
      pushDebug(`[${new Date().toLocaleTimeString()}] presence event room=${roomID} sender=${sender || "-"} status=${status}`);
      if (sender && sender !== currentUserID) setRoomPresence(roomID, sender, status, lastSeenAt);
      return;
    }
    if (payload.type === "history" && payload.metadata?.messages) {
      const roomID = roomIDFromPayload(payload, "history");
      if (!roomID) return;
      const raw = payload.metadata.messages as Array<Record<string, unknown>>;
      const parsed = raw.map((item) => {
        const senderID = String(item.sender_user_id || "");
        const createdAt = String(item.created_at || new Date().toISOString());
        return { id: String(item.message_id || ""), sender: senderID === currentUserID ? "me" : "other", senderUserId: senderID, senderName: displayNameByUserID(senderID), text: String(item.content || ""), time: formatTime(createdAt), createdAt, isConsecutive: false, readByOthers: false } as ChatMessage;
      }).reverse();
      roomMessagesMap[roomID] = parsed; syncActiveRoomState(); markAsReadLatest(); return;
    }
    if (payload.type === "typing") {
      const roomID = roomIDFromPayload(payload, "typing"); const sender = payload.sender_user_id || "";
      if (!roomID) return;
      if (sender && sender !== currentUserID) { if (!roomTypingMap[roomID]) roomTypingMap[roomID] = new Set<string>(); roomTypingMap[roomID].add(sender); syncActiveRoomState(); setTimeout(() => { roomTypingMap[roomID]?.delete(sender); syncActiveRoomState(); }, 1800); }
      return;
    }
    if (payload.type === "read_receipt") {
      const roomID = roomIDFromPayload(payload, "read_receipt"); const sender = payload.sender_user_id || "";
      if (!roomID) return;
      const messageID = payload.message_id || "";
      if (sender !== currentUserID && roomMessagesMap[roomID]?.length) {
        const receiptIdx = roomMessagesMap[roomID].findIndex((message) => message.id === messageID);
        roomMessagesMap[roomID] = roomMessagesMap[roomID].map((message, idx) => ({
          ...message,
          readByOthers: message.sender === "me" && (receiptIdx === -1 || idx <= receiptIdx) ? true : message.readByOthers,
        }));
        syncActiveRoomState();
      }
      return;
    }
    if (payload.type === "message_deleted") {
      const roomID = roomIDFromPayload(payload, "message_deleted");
      const messageID = payload.message_id || "";
      if (!roomID || !messageID) return;
      roomMessagesMap[roomID] = (roomMessagesMap[roomID] || []).filter((message) => message.id !== messageID);
      syncActiveRoomState();
      const latest = roomMessagesMap[roomID]?.[roomMessagesMap[roomID].length - 1];
      chats = chats.map((chat) =>
        chat.id === roomID
          ? {
              ...chat,
              lastMessage: latest?.text || "Message deleted",
              time: latest?.createdAt ? formatTime(latest.createdAt) : "Now",
            }
          : chat,
      );
      return;
    }
    if (payload.type === "participant_removed") {
      const roomID = roomIDFromPayload(payload, "participant_removed");
      const removedUserID = String(payload.metadata?.removed_user_id || payload.sender_user_id || "");
      if (!roomID || !removedUserID) return;

      chats = chats.map((chat) =>
        chat.id === roomID
          ? {
              ...chat,
              participantUserIds: (chat.participantUserIds || []).filter((userID) => userID !== removedUserID),
            }
          : chat,
      );

      if (removedUserID === currentUserID) {
        chats = chats.filter((chat) => chat.id !== roomID);
        delete roomMessagesMap[roomID];
        delete roomTypingMap[roomID];
        delete roomOnlineMap[roomID];
        if (activeChatId === roomID) {
          activeChatId = "";
          messages = [];
          typingUsers = [];
          ws.close();
          wsError = "Anda telah dikeluarkan dari grup.";
        }
      }
      pushDebug(`[${new Date().toLocaleTimeString()}] participant removed room=${roomID} user=${removedUserID}`);
      return;
    }
    if (payload.type === "leave") {
      const roomID = roomIDFromPayload(payload, "leave");
      const sender = payload.sender_user_id || "";
      if (!roomID || !sender) return;
      if (sender === currentUserID) {
        chats = chats.filter((chat) => chat.id !== roomID);
        delete roomMessagesMap[roomID];
        delete roomTypingMap[roomID];
        delete roomOnlineMap[roomID];
        if (activeChatId === roomID) {
          activeChatId = "";
          messages = [];
          typingUsers = [];
          ws.close();
        }
      } else {
        chats = chats.map((chat) =>
          chat.id === roomID
            ? {
                ...chat,
                participantUserIds: (chat.participantUserIds || []).filter((userID) => userID !== sender),
              }
            : chat,
        );
      }
      pushDebug(`[${new Date().toLocaleTimeString()}] leave event room=${roomID} user=${sender}`);
      return;
    }
    if (payload.type === "message") {
      const roomID = roomIDFromPayload(payload, "message"); const createdAt = payload.created_at || new Date().toISOString(); const sender = payload.sender_user_id || "";
      if (!roomID) return;
      const newMsg: ChatMessage = { id: payload.message_id || crypto.randomUUID(), sender: sender === currentUserID ? "me" : "other", senderUserId: sender, senderName: displayNameByUserID(sender), text: payload.content || "", time: formatTime(createdAt), createdAt, isConsecutive: false, readByOthers: false };
      if (!roomMessagesMap[roomID]) roomMessagesMap[roomID] = [];
      roomMessagesMap[roomID] = [...roomMessagesMap[roomID], newMsg];
      updateSidebarLastMessage(roomID, newMsg.text, createdAt); syncActiveRoomState();
      if (roomID === activeChatId && sender !== currentUserID) markAsReadLatest();
    }
  }

  async function onSelectChat(event: CustomEvent<{ id: string }>) {
    activeChatId = event.detail.id;
    searchResults = [];
    syncActiveRoomState();
    wsError = "";
    pushDebug(`[${new Date().toLocaleTimeString()}] selected room=${activeChatId}`);
    if (activeChatId.startsWith("pending:")) {
      pushDebug(`[${new Date().toLocaleTimeString()}] websocket skipped because selected room is pending`);
      return;
    }
    const selected = chats.find((chat) => chat.id === activeChatId);
    if (selected && isDirectChat(selected)) {
      const otherUserID = getOtherParticipantID(selected);
      if (otherUserID && roomOnlineMap[activeChatId]?.has(otherUserID)) {
        chats = chats.map((chat) => chat.id === activeChatId ? { ...chat, status: "online" } : chat);
      }
    }
    await loadRoomHistory(activeChatId);
    ws.connect(activeChatId);
  }
  function onSendMessage(event: CustomEvent<{ text: string }>) {
    const text = event.detail.text.trim();
    if (!text || !activeChatId || activeChatId.startsWith("pending:")) return;
    if (wsStatus !== "connected") {
      wsError = "Chat sedang offline. Buka ulang room atau reconnect sebelum mengirim pesan.";
      pushDebug(`[${new Date().toLocaleTimeString()}] send blocked because websocket is ${wsStatus}`);
      return;
    }
    sendWs({ type: "message", room_id: activeChatId, content: text, metadata: { message_type: "text" } });
  }
  function onTyping() {
    if (!activeChatId || activeChatId.startsWith("pending:") || wsStatus !== "connected") return;
    sendWs({ type: "typing", room_id: activeChatId, metadata: { typing: true } });
  }

  async function onCreateFromContact(event: CustomEvent<{ contactUserId: string }>) {
    const { contactUserId } = event.detail;
    const contact = contacts.find((c) => c.user_id === contactUserId);
    if (!contact) {
      wsError = "Kontak tidak ditemukan atau belum tersinkron.";
      pushDebug(`[${new Date().toLocaleTimeString()}] start private chat failed: contact not found user=${contactUserId}`);
      return;
    }
    const existing: ChatRoom | undefined = chats.find((chat: ChatRoom) => isDirectChat(chat) && chat.participantUserIds?.includes(contactUserId));
    if (existing) {
      activeChatId = existing.id;
      searchResults = [];
      syncActiveRoomState();
      wsError = "";
      await loadRoomHistory(existing.id);
      ws.connect(existing.id);
      return;
    }

    if (!tenantID) {
      wsError = "Tenant belum dipilih.";
      pushDebug(`[${new Date().toLocaleTimeString()}] start private chat blocked because tenant is empty`);
      return;
    }

    const pendingID = `pending:${contactUserId}`;
    upsertPendingPrivateChat(contact, pendingID);

    try {
      pushDebug(`[${new Date().toLocaleTimeString()}] start private chat target_user=${contactUserId}`);
      const room = await startPrivateChatApi(tenantID, contactUserId);
      const roomName = contact?.name || "Private Chat";
      const newChat: ChatRoom = {
        id: room.id,
        name: roomName,
        avatar: contact?.avatar || avatarForName(roomName, "F59E0B"),
        lastMessage: "Private chat siap digunakan",
        time: "Now",
        unread: 0,
        roomType: "private",
        isGroup: false,
        status: room.presence_status || "offline",
        participantUserIds: room.participant_user_ids || [currentUserID, contactUserId],
        ownerUserId: room.owner_user_id,
        participantCount: room.participant_count,
        contactUserId: room.contact_user_id || contactUserId,
        contactEmail: contact?.email,
      };

      delete roomMessagesMap[pendingID];
      chats = [newChat, ...chats.filter((chat) => chat.id !== room.id && chat.id !== pendingID)];
      roomMessagesMap[room.id] = roomMessagesMap[room.id] || [];
      activeChatId = room.id;
      syncActiveRoomState();
      wsError = "";
      pushDebug(`[${new Date().toLocaleTimeString()}] private room ready room=${room.id}`);
      await loadRoomHistory(room.id);
      ws.connect(room.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memulai private chat";
      chats = chats.map((chat) =>
        chat.id === pendingID
          ? {
              ...chat,
              lastMessage: "Private chat belum bisa dibuka",
              time: "Now",
            }
          : chat,
      );
      activeChatId = pendingID;
      messages = [];
      typingUsers = [];
      syncActiveRoomState();
      wsError = message;
      pushDebug(`[${new Date().toLocaleTimeString()}] start private chat failed: ${message}`);
    }
  }

  function onReconnect() {
    if (!activeChatId) {
      pushDebug(`[${new Date().toLocaleTimeString()}] reconnect skipped because no active room`);
      return;
    }
    ws.connect(activeChatId);
  }
  function onClearCurrent() { if (!activeChatId) return; roomMessagesMap[activeChatId] = []; syncActiveRoomState(); }
  function onClearChat() {
    if (!activeChatId) return;
    roomMessagesMap[activeChatId] = [];
    messages = [];
    chats = chats.map((chat) =>
      chat.id === activeChatId ? { ...chat, lastMessage: "Chat dikosongkan", time: "Now", unread: 0 } : chat,
    );
    pushDebug(`[${new Date().toLocaleTimeString()}] clear chat room=${activeChatId}`);
  }

  function onLeaveGroup() {
    if (!activeChatId || !activeChat || !isGroupChat(activeChat)) return;
    ws.send({ type: "leave", room_id: activeChatId });
    const leftRoomID = activeChatId;
    chats = chats.filter((chat) => chat.id !== leftRoomID);
    delete roomMessagesMap[leftRoomID];
    delete roomTypingMap[leftRoomID];
    delete roomOnlineMap[leftRoomID];
    activeChatId = "";
    messages = [];
    typingUsers = [];
    pushDebug(`[${new Date().toLocaleTimeString()}] leave group requested room=${leftRoomID}`);
  }

  function onGroupSettings() {
    if (!activeChat || !isGroupChat(activeChat)) return;
    pushDebug(`[${new Date().toLocaleTimeString()}] group settings requested room=${activeChat.id}`);
  }
  async function onRemoveGroupParticipant(event: CustomEvent<{ userId: string }>) {
    const targetUserID = event.detail.userId;
    if (!tenantID || !activeChatId || !activeChat || !isGroupChat(activeChat) || !targetUserID) return;
    if (!canManageActiveGroup) {
      wsError = "Hanya pemilik grup yang bisa mengeluarkan peserta.";
      return;
    }

    try {
      pushDebug(`[${new Date().toLocaleTimeString()}] remove group participant room=${activeChatId} user=${targetUserID}`);
      if (wsStatus === "connected") {
        sendWs({
          type: "remove_participant",
          room_id: activeChatId,
          metadata: { target_user_id: targetUserID },
        });
      } else {
        await removeGroupParticipantApi(tenantID, activeChatId, targetUserID);
      }
      chats = chats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              participantUserIds: (chat.participantUserIds || []).filter((userID) => userID !== targetUserID),
            }
          : chat,
      );
      wsError = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengeluarkan peserta";
      wsError = message;
      pushDebug(`[${new Date().toLocaleTimeString()}] remove participant failed: ${message}`);
    }
  }
  async function onCreateGroup(event: CustomEvent<{ name: string; description: string; memberUserIds: string[] }>) {
    if (!tenantID) {
      wsError = "Tenant belum dipilih.";
      return;
    }
    try {
      pushDebug(`[${new Date().toLocaleTimeString()}] create group requested name=${event.detail.name} members=${event.detail.memberUserIds.length}`);
      const room = await createGroupChatApi(tenantID, event.detail.name, event.detail.description, event.detail.memberUserIds);
      const newChat = mapApiRoom(room);
      chats = [newChat, ...chats.filter((chat) => chat.id !== newChat.id)];
      roomMessagesMap[newChat.id] = roomMessagesMap[newChat.id] || [];
      activeChatId = newChat.id;
      syncActiveRoomState();
      wsError = "";
      await loadRoomHistory(newChat.id);
      ws.connect(newChat.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat grup chat";
      wsError = message;
      pushDebug(`[${new Date().toLocaleTimeString()}] create group failed: ${message}`);
    }
  }

  async function onSearchMessages(event: CustomEvent<{ query: string }>) {
    const query = event.detail.query.trim();
    if (!tenantID || !activeChatId || !query) {
      searchResults = [];
      return;
    }

    try {
      isSearchingMessages = true;
      const results = await searchChatMessagesApi(tenantID, activeChatId, query, 50);
      searchResults = results.map(mapApiMessage);
      pushDebug(`[${new Date().toLocaleTimeString()}] searched messages room=${activeChatId} results=${results.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mencari pesan";
      wsError = message;
      pushDebug(`[${new Date().toLocaleTimeString()}] search messages failed: ${message}`);
    } finally {
      isSearchingMessages = false;
    }
  }

  async function onDeleteMessage(event: CustomEvent<{ messageId: string }>) {
    const messageID = event.detail.messageId;
    if (!tenantID || !activeChatId || !messageID) return;
    const message = (roomMessagesMap[activeChatId] || []).find((item) => item.id === messageID);
    if (!message || message.sender !== "me") {
      wsError = "Anda hanya bisa menghapus pesan yang Anda kirim.";
      return;
    }

    try {
      if (wsStatus === "connected") {
        sendWs({ type: "delete_message", room_id: activeChatId, message_id: messageID });
      } else {
        await deleteChatMessageApi(tenantID, activeChatId, messageID);
        roomMessagesMap[activeChatId] = (roomMessagesMap[activeChatId] || []).filter((item) => item.id !== messageID);
        syncActiveRoomState();
      }
      wsError = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus pesan";
      wsError = message;
      pushDebug(`[${new Date().toLocaleTimeString()}] delete message failed: ${message}`);
    }
  }

  async function onUpdateGroup(event: CustomEvent<{ name: string; description: string }>) {
    if (!tenantID || !activeChatId || !activeChat || !isGroupChat(activeChat)) return;
    if (!canManageActiveGroup) {
      wsError = "Hanya pemilik grup yang bisa mengubah info grup.";
      return;
    }

    try {
      const room = await updateGroupChatApi(tenantID, activeChatId, event.detail.name, event.detail.description);
      const updated = mapApiRoom(room);
      chats = chats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              name: updated.name,
              description: updated.description,
              avatar: avatarForName(updated.name, "EC4899"),
            }
          : chat,
      );
      wsError = "";
      pushDebug(`[${new Date().toLocaleTimeString()}] updated group room=${activeChatId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengubah info grup";
      wsError = message;
      pushDebug(`[${new Date().toLocaleTimeString()}] update group failed: ${message}`);
    }
  }

  let unsubscribeAuth: Unsubscriber | null = null;

  onMount(() => {
    let didMountInitialURLRoom = false;
    unsubscribeAuth = authStore.subscribe((session: AuthSession | null) => {
      const nextTenantID = session?.selectedTeam?.tenant_id || "";
      const nextUserID = session?.user?.id || "";
      const nextSessionKey = nextTenantID && nextUserID ? `${nextTenantID}:${nextUserID}` : "";
      currentUserName = session?.user?.name || "";
      currentUserEmail = session?.user?.email || "";
      currentUserAvatar = session?.user?.avatar_url || "";
      pushDebug(`[${new Date().toLocaleTimeString()}] auth sync tenant=${nextTenantID || "-"} user=${nextUserID || "-"} token=${!!getAccessTokenForWs()}`);

      if (!nextSessionKey) {
        currentUserID = nextUserID;
        tenantID = nextTenantID;
        return;
      }

      if (nextSessionKey && nextSessionKey !== loadedSessionKey) {
        chats = [];
        contacts = [];
        activeChatId = "";
        messages = [];
        typingUsers = [];
        searchResults = [];
        ws.close();
        currentUserID = nextUserID;
        tenantID = nextTenantID;
        if (!didMountInitialURLRoom) {
          didMountInitialURLRoom = true;
          const urlRooms = buildRoomsFromURL();
          const urlRoomID = urlRooms.length === 1 ? urlRooms[0].id : "";
          if (urlRoomID) {
            chats = urlRooms;
            activeChatId = urlRoomID;
            roomMessagesMap[activeChatId] = roomMessagesMap[activeChatId] || [];
            syncActiveRoomState();
            ws.connect(activeChatId);
          }
        }
        loadChatDataForCurrentSession();
        return;
      }
      currentUserID = nextUserID;
      tenantID = nextTenantID;
    });
  });

  onDestroy(() => { unsubscribeAuth?.(); ws.close(); });
</script>

<ChatLayout>
  <div class="flex h-full w-full bg-[#f0f2f5] overflow-hidden rounded-2xl shadow-sm border border-gray-200">
    <ChatSidebar chats={chats} contacts={contacts} {activeChatId} on:select={onSelectChat} on:create-from-contact={onCreateFromContact} on:create-group={onCreateGroup} on:reconnect={onReconnect} on:clear={onClearCurrent} />
    <ChatArea
      {activeChat}
      {messages}
      {contacts}
      currentUser={{ id: currentUserID, name: currentUserName, email: currentUserEmail, avatar: currentUserAvatar }}
      {wsStatus}
      {wsError}
      {typingUsers}
      {wsDebugLogs}
      {searchResults}
      {isSearchingMessages}
      groupMembers={activeGroupMembers}
      canManageGroup={canManageActiveGroup}
      on:send={onSendMessage}
      on:typing={onTyping}
      on:clearChat={onClearChat}
      on:leaveGroup={onLeaveGroup}
      on:groupSettings={onGroupSettings}
      on:removeGroupParticipant={onRemoveGroupParticipant}
      on:searchMessages={onSearchMessages}
      on:updateGroup={onUpdateGroup}
      on:deleteMessage={onDeleteMessage}
    />
  </div>
</ChatLayout>

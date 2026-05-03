<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Unsubscriber } from "svelte/store";
  import ChatLayout from "../components/ChatLayout.svelte";
  import ChatSidebar from "../components/ChatSidebar.svelte";
  import ChatArea from "../components/ChatArea.svelte";
  import { authStore } from "$modules/auth/stores/authStore";
  import { getTeamMembersApi } from "$modules/teams/api/teamsApi";
  import { useChatWebSocket, type ChatWsMessage } from "../hooks/useChatWebSocket";
  import { createGroupChatApi, getChatMessagesApi, getChatRoomsApi, removeGroupParticipantApi, startPrivateChatApi, type ChatMessageApi, type ChatRoomApi } from "../hooks/useChatRooms";

  type WsEventType = "message" | "read_receipt" | "typing" | "join" | "leave" | "history" | "presence" | "presence_state" | "remove_participant" | "participant_removed" | "error";
  type WsMessage = ChatWsMessage & { type: WsEventType };
  type ChatRoom = { id: string; name: string; avatar: string; lastMessage: string; time: string; unread: number; isGroup: boolean; status?: string; participantUserIds?: string[]; ownerUserId?: string; };
  type ChatMessage = { id: string; sender: "me" | "other"; senderName?: string; text: string; time: string; createdAt: string; isConsecutive: boolean; readByOthers?: boolean; };
  type ContactItem = { id: string; user_id: string; name: string; email: string; avatar: string; };
  type GroupMemberItem = { user_id: string; name: string; email: string; avatar: string; isCurrentUser: boolean; isOwner: boolean; };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
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
  let loadedTenantID = "";
  let presenceVersion = 0;
  let canManageActiveGroup = false;
  let currentUserName = "";
  let currentUserEmail = "";
  let currentUserAvatar = "";
  let activeGroupMembers: GroupMemberItem[] = [];
  $: {
    presenceVersion;
    const selected = chats.find((chat) => chat.id === activeChatId) || null;
    if (!selected) {
      activeChat = null;
    } else if (selected.isGroup) {
      activeChat = selected;
    } else {
      const otherUserID = selected.participantUserIds?.find((id) => id !== currentUserID) || "";
      const isOnline = !!otherUserID && !!roomOnlineMap[selected.id]?.has(otherUserID);
      activeChat = { ...selected, status: isOnline ? "online" : "offline" };
    }
    canManageActiveGroup = !!activeChat?.isGroup && !!currentUserID && activeChat.ownerUserId === currentUserID;
  }

  function buildRoomsFromURL(): ChatRoom[] {
    if (typeof window === "undefined") return [];
    const params = new URLSearchParams(window.location.search);
    const roomID = params.get("room_id");
    if (!roomID) return [];
    const roomName = params.get("room_name") || "Chat Room";
    const isGroup = params.get("room_type") !== "private";
    return [{ id: roomID, name: roomName, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=0EA5E9&color=fff`, lastMessage: "Connecting to room...", time: "Now", unread: 0, isGroup, status: isGroup ? "group room" : "private room" }];
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
  function avatarForName(name: string, background = "64748B") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${background}&color=fff`;
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
    activeGroupMembers = activeChat?.isGroup
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
      senderName: displayNameByUserID(message.sender_user_id),
      text: message.content,
      time: formatTime(message.created_at),
      createdAt: message.created_at,
      isConsecutive: false,
      readByOthers: !!message.read_by_others,
    };
  }
  function contactByUserID(userID: string) { return contacts.find((contact) => contact.user_id === userID); }
  function mapApiRoom(room: ChatRoomApi): ChatRoom {
    const otherUserID = room.participant_user_ids?.find((id) => id !== currentUserID) || "";
    const contact = otherUserID ? contactByUserID(otherUserID) : null;
    const roomName = room.room_type === "private" ? contact?.name || "Private Chat" : room.name || "Group Chat";
    return {
      id: room.id,
      name: roomName,
      avatar: contact?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=0EA5E9&color=fff`,
      lastMessage: room.last_message?.content || (room.room_type === "private" ? "Private chat" : "Group chat"),
      time: room.last_message?.created_at ? formatTime(room.last_message.created_at) : room.created_at ? formatTime(room.created_at) : "Now",
      unread: 0,
      isGroup: room.room_type === "group",
      status: room.room_type === "group" ? "group room" : "offline",
      participantUserIds: room.participant_user_ids || [],
      ownerUserId: room.owner_user_id,
    };
  }
  function setRoomPresence(roomID: string, userID: string, status: "online" | "offline") {
    if (!roomOnlineMap[roomID]) roomOnlineMap[roomID] = new Set<string>();
    if (status === "online") roomOnlineMap[roomID].add(userID);
    if (status === "offline") roomOnlineMap[roomID].delete(userID);
    presenceVersion += 1;
    pushDebug(`[${new Date().toLocaleTimeString()}] presence room=${roomID} user=${userID} status=${status}`);

    chats = chats.map((chat) => {
      if (chat.id !== roomID || chat.isGroup) return chat;
      const otherUserID = chat.participantUserIds?.find((id) => id !== currentUserID) || "";
      if (!otherUserID) {
        pushDebug(`[${new Date().toLocaleTimeString()}] presence ignored room=${roomID} no_other_participant`);
        return chat;
      }
      const nextStatus = roomOnlineMap[roomID]?.has(otherUserID) ? "online" : "offline";
      pushDebug(`[${new Date().toLocaleTimeString()}] room status room=${roomID} other=${otherUserID} next=${nextStatus}`);
      return { ...chat, status: nextStatus };
    });
  }
  async function loadChatRooms() {
    if (!tenantID) return;
    try {
      const rooms = await getChatRoomsApi(tenantID);
      const mappedRooms = rooms.map(mapApiRoom);
      const seenPrivateParticipants = new Set<string>();
      chats = mappedRooms.filter((room) => {
        if (room.isGroup) return true;
        const otherUserID = room.participantUserIds?.find((id) => id !== currentUserID) || room.id;
        if (seenPrivateParticipants.has(otherUserID)) return false;
        seenPrivateParticipants.add(otherUserID);
        return true;
      });
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
    if (!tenantID || !currentUserID || loadedTenantID === tenantID) return;
    loadedTenantID = tenantID;
    pushDebug(`[${new Date().toLocaleTimeString()}] loading chat data tenant=${tenantID} user=${currentUserID}`);

    try {
      const members = await getTeamMembersApi(tenantID);
      contacts = members
        .filter((m) => m.user_id && m.user_id !== currentUserID)
        .map((m) => ({
          id: m.id,
          user_id: m.user_id,
          name: m.user?.name || "Unknown User",
          email: m.user?.email || "-",
          avatar:
            m.user?.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              m.user?.name || "User",
            )}&background=14B8A6&color=fff`,
        }));
      await loadChatRooms();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data chat";
      contacts = [];
      pushDebug(`[${new Date().toLocaleTimeString()}] load chat data failed: ${message}`);
    }
  }

  const ws = useChatWebSocket({
    getToken: getAccessTokenForWs,
    getTenantID: () => tenantID,
    getRoomID: () => activeChatId,
    apiBaseUrl: API_BASE_URL,
    onMessage: (payload) => handleWsMessage(payload as WsMessage),
    onStatus: (status) => {
      wsStatus = status;
      if (status === "connected") markAsReadLatest();
    },
    onError: (message) => { wsError = message; },
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

  function handleWsMessage(payload: WsMessage) {
    if (payload.type === "error") { wsError = payload.content || "Unknown chat error"; return; }
    if (payload.type === "presence_state") {
      const roomID = payload.room_id || activeChatId;
      const userIDs = (payload.metadata?.online_user_ids || []) as string[];
      pushDebug(`[${new Date().toLocaleTimeString()}] presence_state room=${roomID} online=${userIDs.join(",") || "-"}`);
      roomOnlineMap[roomID] = new Set(userIDs.filter((id) => id !== currentUserID));
      presenceVersion += 1;
      for (const userID of userIDs) setRoomPresence(roomID, userID, "online");
      chats = chats.map((chat) => {
        if (chat.id !== roomID || chat.isGroup) return chat;
        const otherUserID = chat.participantUserIds?.find((id) => id !== currentUserID) || "";
        return { ...chat, status: otherUserID && roomOnlineMap[roomID]?.has(otherUserID) ? "online" : "offline" };
      });
      return;
    }
    if (payload.type === "presence") {
      const roomID = payload.room_id || activeChatId;
      const sender = payload.sender_user_id || "";
      const status = payload.metadata?.status === "online" ? "online" : "offline";
      pushDebug(`[${new Date().toLocaleTimeString()}] presence event room=${roomID} sender=${sender || "-"} status=${status}`);
      if (sender && sender !== currentUserID) setRoomPresence(roomID, sender, status);
      return;
    }
    if (payload.type === "history" && payload.metadata?.messages) {
      const raw = payload.metadata.messages as Array<Record<string, unknown>>;
      const parsed = raw.map((item) => {
        const senderID = String(item.sender_user_id || "");
        const createdAt = String(item.created_at || new Date().toISOString());
        return { id: String(item.message_id || ""), sender: senderID === currentUserID ? "me" : "other", senderName: displayNameByUserID(senderID), text: String(item.content || ""), time: formatTime(createdAt), createdAt, isConsecutive: false, readByOthers: false } as ChatMessage;
      }).reverse();
      roomMessagesMap[activeChatId] = parsed; syncActiveRoomState(); markAsReadLatest(); return;
    }
    if (payload.type === "typing") {
      const roomID = payload.room_id || activeChatId; const sender = payload.sender_user_id || "";
      if (sender && sender !== currentUserID) { if (!roomTypingMap[roomID]) roomTypingMap[roomID] = new Set<string>(); roomTypingMap[roomID].add(sender); syncActiveRoomState(); setTimeout(() => { roomTypingMap[roomID]?.delete(sender); syncActiveRoomState(); }, 1800); }
      return;
    }
    if (payload.type === "read_receipt") {
      const roomID = payload.room_id || activeChatId; const sender = payload.sender_user_id || "";
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
    if (payload.type === "participant_removed") {
      const roomID = payload.room_id || activeChatId;
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
      const roomID = payload.room_id || activeChatId;
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
      const roomID = payload.room_id || activeChatId; const createdAt = payload.created_at || new Date().toISOString(); const sender = payload.sender_user_id || "";
      const newMsg: ChatMessage = { id: payload.message_id || crypto.randomUUID(), sender: sender === currentUserID ? "me" : "other", senderName: displayNameByUserID(sender), text: payload.content || "", time: formatTime(createdAt), createdAt, isConsecutive: false, readByOthers: false };
      if (!roomMessagesMap[roomID]) roomMessagesMap[roomID] = [];
      roomMessagesMap[roomID] = [...roomMessagesMap[roomID], newMsg];
      updateSidebarLastMessage(roomID, newMsg.text, createdAt); syncActiveRoomState();
      if (roomID === activeChatId && sender !== currentUserID) markAsReadLatest();
    }
  }

  async function onSelectChat(event: CustomEvent<{ id: string }>) {
    activeChatId = event.detail.id;
    syncActiveRoomState();
    wsError = "";
    pushDebug(`[${new Date().toLocaleTimeString()}] selected room=${activeChatId}`);
    if (activeChatId.startsWith("pending:")) {
      pushDebug(`[${new Date().toLocaleTimeString()}] websocket skipped because selected room is pending`);
      return;
    }
    const selected = chats.find((chat) => chat.id === activeChatId);
    if (selected && !selected.isGroup) {
      const otherUserID = selected.participantUserIds?.find((id) => id !== currentUserID) || "";
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
    const existing = chats.find((chat) => !chat.isGroup && chat.participantUserIds?.includes(contactUserId));
    if (existing) { activeChatId = existing.id; syncActiveRoomState(); wsError = ""; ws.connect(existing.id); return; }

    if (!tenantID) {
      wsError = "Tenant belum dipilih.";
      pushDebug(`[${new Date().toLocaleTimeString()}] start private chat blocked because tenant is empty`);
      return;
    }

    try {
      pushDebug(`[${new Date().toLocaleTimeString()}] start private chat target_user=${contactUserId}`);
      const room = await startPrivateChatApi(tenantID, contactUserId);
      const roomName = contact?.name || "Private Chat";
      const newChat: ChatRoom = {
        id: room.id,
        name: roomName,
        avatar: contact?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(roomName)}&background=F59E0B&color=fff`,
        lastMessage: existing ? existing.lastMessage : "Private chat siap digunakan",
        time: "Now",
        unread: 0,
        isGroup: false,
        status: "private room",
        participantUserIds: room.participant_user_ids || [currentUserID, contactUserId],
        ownerUserId: room.owner_user_id,
      };

      chats = [newChat, ...chats.filter((chat) => chat.id !== room.id)];
      roomMessagesMap[room.id] = roomMessagesMap[room.id] || [];
      activeChatId = room.id;
      syncActiveRoomState();
      wsError = "";
      pushDebug(`[${new Date().toLocaleTimeString()}] private room ready room=${room.id}`);
      await loadRoomHistory(room.id);
      ws.connect(room.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memulai private chat";
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
    if (!activeChatId || !activeChat?.isGroup) return;
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
    if (!activeChat?.isGroup) return;
    pushDebug(`[${new Date().toLocaleTimeString()}] group settings requested room=${activeChat.id}`);
  }
  async function onRemoveGroupParticipant(event: CustomEvent<{ userId: string }>) {
    const targetUserID = event.detail.userId;
    if (!tenantID || !activeChatId || !activeChat?.isGroup || !targetUserID) return;
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
  async function onCreateGroup(event: CustomEvent<{ name: string; memberUserIds: string[] }>) {
    if (!tenantID) {
      wsError = "Tenant belum dipilih.";
      return;
    }
    try {
      pushDebug(`[${new Date().toLocaleTimeString()}] create group requested name=${event.detail.name} members=${event.detail.memberUserIds.length}`);
      const room = await createGroupChatApi(tenantID, event.detail.name, event.detail.memberUserIds);
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

  onMount(() => {
    const session = authStore.getSession();
    currentUserID = session?.user?.id || "";
    currentUserName = session?.user?.name || "";
    currentUserEmail = session?.user?.email || "";
    currentUserAvatar = session?.user?.avatar_url || "";
    tenantID = session?.selectedTeam?.tenant_id || "";
    pushDebug(`[${new Date().toLocaleTimeString()}] chat mounted tenant=${tenantID || "-"} user=${currentUserID || "-"} token=${!!getAccessTokenForWs()}`);
    chats = buildRoomsFromURL(); activeChatId = ""; messages = []; typingUsers = [];
    const urlRoomID = chats.length === 1 ? chats[0].id : "";
    if (urlRoomID) { activeChatId = urlRoomID; roomMessagesMap[activeChatId] = roomMessagesMap[activeChatId] || []; syncActiveRoomState(); ws.connect(activeChatId); }
    loadChatDataForCurrentSession();
  });

  let unsubscribeAuth: Unsubscriber | null = null;

  onMount(() => {
    unsubscribeAuth = authStore.subscribe((session) => {
      const nextTenantID = session?.selectedTeam?.tenant_id || "";
      const nextUserID = session?.user?.id || "";
      currentUserName = session?.user?.name || "";
      currentUserEmail = session?.user?.email || "";
      currentUserAvatar = session?.user?.avatar_url || "";
      if (nextTenantID && nextUserID && (nextTenantID !== loadedTenantID || nextUserID !== currentUserID)) {
        currentUserID = nextUserID;
        tenantID = nextTenantID;
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
    <ChatSidebar chats={chats} contacts={contacts} {activeChatId} on:select={onSelectChat} on:createFromContact={onCreateFromContact} on:createGroup={onCreateGroup} on:reconnect={onReconnect} on:clear={onClearCurrent} />
    <ChatArea
      {activeChat}
      {messages}
      {wsStatus}
      {wsError}
      {typingUsers}
      {wsDebugLogs}
      groupMembers={activeGroupMembers}
      canManageGroup={canManageActiveGroup}
      on:send={onSendMessage}
      on:typing={onTyping}
      on:clearChat={onClearChat}
      on:leaveGroup={onLeaveGroup}
      on:groupSettings={onGroupSettings}
      on:removeGroupParticipant={onRemoveGroupParticipant}
    />
  </div>
</ChatLayout>

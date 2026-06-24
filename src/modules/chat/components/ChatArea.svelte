<script lang="ts">
  import { Search, MoreVertical, Paperclip, Smile, Send, Trash2, X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  type ActiveChat = {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    roomType: "private" | "group";
    status?: "online" | "offline" | "last_seen_recently";
    isGroup: boolean;
    participantUserIds?: string[];
    contactUserId?: string;
    contactEmail?: string;
    participantCount?: number;
  };

  type ChatMessage = {
    id: string;
    sender: "me" | "other";
    senderUserId: string;
    senderName?: string;
    text: string;
    time: string;
    isConsecutive: boolean;
    readByOthers?: boolean;
  };

  type GroupMember = {
    user_id: string;
    name: string;
    email: string;
    avatar: string;
    isCurrentUser: boolean;
    isOwner: boolean;
  };
  type ContactItem = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    avatar: string;
  };
  type CurrentUser = {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  type ProfilePanel = {
    user_id: string;
    name: string;
    email: string;
    avatar: string;
    isCurrentUser?: boolean;
    roleLabel?: string;
  };

  export let activeChat: ActiveChat | null = null;
  export let messages: ChatMessage[] = [];
  export let contacts: ContactItem[] = [];
  export let currentUser: CurrentUser = { id: "", name: "", email: "", avatar: "" };
  export let wsStatus: "connecting" | "connected" | "disconnected" = "disconnected";
  export let wsError = "";
  export let typingUsers: string[] = [];
  export let wsDebugLogs: string[] = [];
  export let searchResults: ChatMessage[] = [];
  export let isSearchingMessages = false;
  export let groupMembers: GroupMember[] = [];
  export let canManageGroup = false;

  let newMessage = "";
  let showOptionsMenu = false;
  let showSearchPanel = false;
  let showGroupSettingsPanel = false;
  let searchQuery = "";
  let groupNameDraft = "";
  let groupDescriptionDraft = "";
  let draftRoomID = "";
  let profilePanel: ProfilePanel | null = null;
  const dispatch = createEventDispatcher<{
    send: { text: string };
    typing: null;
    clearChat: null;
    leaveGroup: null;
    groupSettings: null;
    removeGroupParticipant: { userId: string };
    searchMessages: { query: string };
    updateGroup: { name: string; description: string };
    deleteMessage: { messageId: string };
  }>();

  function sendMessage() {
    const text = newMessage.trim();
    if (!text) return;
    dispatch("send", { text });
    newMessage = "";
  }

  function handleKeydown(event: KeyboardEvent) {
    dispatch("typing", null);
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  $: computedStatusLabel = (() => {
    if (typingUsers.length === 1) return `${typingUsers[0]} sedang mengetik...`;
    if (typingUsers.length > 1) return "Beberapa user sedang mengetik...";
    if (!activeChat) return "offline";
    if (activeChat.roomType === "group" && activeChat.isGroup !== false) {
      return `${activeChat.participantCount || groupMembers.length || 0} members`;
    }
    if (activeChat.status === "online") return "online";
    if (activeChat.status === "last_seen_recently") return "last seen recently";
    return "offline";
  })();

  function profileForUser(userID: string): ProfilePanel | null {
    if (!userID) return null;
    if (userID === currentUser.id) {
      const name = currentUser.name || "You";
      return {
        user_id: userID,
        name,
        email: currentUser.email || "-",
        avatar: currentUser.avatar || activeChat?.avatar || "",
        isCurrentUser: true,
        roleLabel: "You",
      };
    }

    const member = groupMembers.find((item) => item.user_id === userID);
    if (member) {
      return {
        user_id: member.user_id,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
        roleLabel: member.isOwner ? "Group owner" : "Team member",
      };
    }

    const contact = contacts.find((item) => item.user_id === userID);
    if (contact) {
      return {
        user_id: contact.user_id,
        name: contact.name,
        email: contact.email,
        avatar: contact.avatar,
        roleLabel: activeChat?.roomType === "private" && activeChat.status === "online" ? "Online" : "Team member",
      };
    }

    return null;
  }

  function openHeaderProfile() {
    if (!activeChat) return;
    if (activeChat.roomType === "group") {
      openGroupSettings();
      return;
    }

    const otherUserID = activeChat.contactUserId || activeChat.participantUserIds?.find((id) => id !== currentUser.id) || "";
    profilePanel = profileForUser(otherUserID) || {
      user_id: otherUserID,
      name: activeChat.name,
      email: activeChat.contactEmail || "-",
      avatar: activeChat.avatar,
      roleLabel: computedStatusLabel,
    };
  }

  function openMessageProfile(message: ChatMessage) {
    if (message.sender === "me") return;
    profilePanel = profileForUser(message.senderUserId) || {
      user_id: message.senderUserId,
      name: message.senderName || "User",
      email: "-",
      avatar: activeChat?.avatar || "",
      roleLabel: "Team member",
    };
  }

  function deleteMessage(message: ChatMessage) {
    if (message.sender !== "me") return;
    dispatch("deleteMessage", { messageId: message.id });
  }

  function closeOptionsMenu() {
    showOptionsMenu = false;
  }

  function openGroupSettings() {
    showOptionsMenu = false;
    showGroupSettingsPanel = true;
    groupNameDraft = activeChat?.name || "";
    groupDescriptionDraft = activeChat?.description || "";
    draftRoomID = activeChat?.id || "";
    dispatch("groupSettings", null);
  }

  function removeGroupParticipant(member: GroupMember) {
    if (!canManageGroup || member.isCurrentUser) return;
    dispatch("removeGroupParticipant", { userId: member.user_id });
  }

  function submitSearch() {
    const query = searchQuery.trim();
    if (!query) return;
    dispatch("searchMessages", { query });
  }

  function saveGroupInfo() {
    if (activeChat?.roomType !== "group" || !canManageGroup || !groupNameDraft.trim()) return;
    dispatch("updateGroup", {
      name: groupNameDraft.trim(),
      description: groupDescriptionDraft.trim(),
    });
  }

  $: if (activeChat?.id && activeChat.id !== draftRoomID && !showGroupSettingsPanel) {
    groupNameDraft = activeChat.name;
    groupDescriptionDraft = activeChat.description || "";
    draftRoomID = activeChat.id;
    searchQuery = "";
    showSearchPanel = false;
    profilePanel = null;
  }
</script>

{#if !activeChat}
  <div class="flex-1 h-full bg-white flex flex-col">
    <div class="flex-1 flex items-center justify-center px-6 text-center">
      <div class="space-y-2">
        <p class="text-gray-500 text-base md:text-lg font-medium">
          Mulai Chat Baru Atau Buka Chat Yang Sudah ada
        </p>
        {#if wsError}
          <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{wsError}</p>
        {/if}
      </div>
    </div>
    <div class="border-t border-gray-200 bg-white/80 px-3 py-2 z-10">
      <details>
        <summary class="text-[11px] text-gray-600 cursor-pointer">
          WebSocket Debug ({wsStatus}) - {wsDebugLogs.length} logs
        </summary>
        {#if wsDebugLogs.length > 0}
          <p class="mt-1 text-[11px] text-gray-500 font-mono break-all">
            {wsDebugLogs[wsDebugLogs.length - 1]}
          </p>
        {/if}
        <div class="mt-2 max-h-28 overflow-y-auto space-y-1">
          {#if wsDebugLogs.length === 0}
            <p class="text-[11px] text-gray-400">Belum ada log websocket</p>
          {:else}
            {#each wsDebugLogs as line}
              <p class="text-[11px] text-gray-600 font-mono break-all">{line}</p>
            {/each}
          {/if}
        </div>
      </details>
    </div>
  </div>
{:else}
<div class="flex-1 flex flex-col h-full bg-[#EFEAE2] relative">
  <!-- WhatsApp Web Background Pattern Overlay (Optional, using a light solid color is fine too) -->
  <div
    class="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
    style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
  ></div>

  <!-- Chat Header -->
  <div
    class="h-16 px-4 flex items-center justify-between bg-gray-50 border-b border-gray-200 shrink-0 z-40"
  >
    <button class="flex min-w-0 items-center gap-3 text-left" on:click={openHeaderProfile}>
      <img
        src={activeChat?.avatar ||
          "https://ui-avatars.com/api/?name=Chat&background=64748B&color=fff"}
        alt={activeChat?.name || "Chat"}
        class="w-10 h-10 rounded-full object-cover"
      />
      <div class="flex flex-col">
        <span class="font-medium text-gray-900 leading-tight truncate"
          >{activeChat?.name || "Select room"}</span
        >
        <span class="flex items-center gap-1.5 text-xs text-gray-500 leading-tight mt-0.5">
          {#if activeChat?.roomType === "private" || activeChat?.isGroup === false}
            <span class={cn("h-1.5 w-1.5 rounded-full", activeChat?.status === "online" ? "bg-emerald-500" : "bg-gray-300")}></span>
          {/if}
          {computedStatusLabel}
        </span>
      </div>
    </button>
    <div class="relative flex items-center gap-4 text-gray-500">
      <div class="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>
      <button
        class={cn(
          "p-1.5 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors",
          showSearchPanel ? "bg-gray-200 text-gray-800" : "",
        )}
        on:click={() => (showSearchPanel = !showSearchPanel)}
      >
        <Search size={20} />
      </button>
      <button
        class={cn(
          "p-1.5 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors",
          showOptionsMenu ? "bg-gray-200 text-gray-800" : "",
        )}
        on:click|stopPropagation={() => (showOptionsMenu = !showOptionsMenu)}
      >
        <MoreVertical size={20} />
      </button>

      {#if showOptionsMenu}
        <div class="absolute right-0 top-10 z-50 w-52 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
          {#if activeChat?.roomType === "group"}
            <button
              class="w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors"
              on:click={openGroupSettings}
            >
              Pengaturan Grup
            </button>
            <button
              class="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              on:click|stopPropagation={() => {
                closeOptionsMenu();
                dispatch("leaveGroup", null);
              }}
            >
              Keluar Grup
            </button>
          {/if}
          <button
            class="w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            on:click|stopPropagation={() => {
              closeOptionsMenu();
              dispatch("clearChat", null);
            }}
          >
            Clear Chat
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if showSearchPanel}
    <div class="z-30 border-b border-gray-200 bg-white px-4 py-3">
      <div class="flex gap-2">
        <input
          bind:value={searchQuery}
          type="text"
          placeholder="Cari pesan di room ini"
          class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-600 focus:outline-none"
          on:keydown={(event) => {
            if (event.key === "Enter") submitSearch();
          }}
        />
        <button
          class="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={!searchQuery.trim() || isSearchingMessages}
          on:click={submitSearch}
        >
          {isSearchingMessages ? "Mencari..." : "Cari"}
        </button>
      </div>
      {#if searchQuery.trim() && searchResults.length > 0}
        <div class="mt-3 max-h-44 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50">
          {#each searchResults as result}
            <div class="border-b border-gray-100 px-3 py-2 last:border-b-0">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-semibold text-gray-700 truncate">
                  {result.sender === "me" ? "Anda" : result.senderName || "User"}
                </p>
                <span class="text-[11px] text-gray-500 shrink-0">{result.time}</span>
              </div>
              <p class="mt-0.5 text-sm text-gray-700 line-clamp-2">{result.text}</p>
            </div>
          {/each}
        </div>
      {:else if searchQuery.trim() && !isSearchingMessages}
        <p class="mt-2 text-xs text-gray-500">Tidak ada hasil untuk kata kunci ini.</p>
      {/if}
    </div>
  {/if}

  {#if showGroupSettingsPanel && activeChat?.roomType === "group"}
    <div class="absolute right-0 top-0 z-50 h-full w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">
      <div class="h-16 px-4 flex items-center justify-between bg-gray-50 border-b border-gray-200">
        <div class="min-w-0">
          <h2 class="text-base font-semibold text-gray-900 truncate">Pengaturan Grup</h2>
          <p class="text-xs text-gray-500 truncate">{activeChat.name}</p>
        </div>
        <button
          class="text-sm text-gray-600 hover:text-gray-900"
          on:click={() => (showGroupSettingsPanel = false)}
        >
          Tutup
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="flex flex-col items-center text-center">
          <img src={activeChat.avatar} alt={activeChat.name} class="w-20 h-20 rounded-full object-cover mb-3" />
          <h3 class="text-base font-semibold text-gray-900">{activeChat.name}</h3>
          <p class="text-xs text-gray-500 mt-1">{activeChat.description || `${groupMembers.length} peserta`}</p>
        </div>
        <div class="border-t border-gray-100 pt-4 space-y-3">
          <h4 class="text-sm font-semibold text-gray-900">Info Grup</h4>
          <input
            bind:value={groupNameDraft}
            disabled={!canManageGroup}
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:border-pink-600 focus:outline-none"
            placeholder="Nama grup"
          />
          <textarea
            bind:value={groupDescriptionDraft}
            disabled={!canManageGroup}
            class="w-full min-h-24 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:border-pink-600 focus:outline-none"
            placeholder="Deskripsi grup"
          ></textarea>
          {#if canManageGroup}
            <button
              class="w-full rounded-lg bg-pink-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              disabled={!groupNameDraft.trim()}
              on:click={saveGroupInfo}
            >
              Simpan Info Grup
            </button>
          {/if}
        </div>
        <div class="border-t border-gray-100 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-900">Anggota Grup</h4>
            {#if canManageGroup}
              <span class="text-[11px] font-medium text-pink-600">Pemilik</span>
            {/if}
          </div>
          <div class="space-y-1">
            {#if groupMembers.length === 0}
              <p class="text-sm text-gray-500 px-1 py-2">Belum ada data anggota grup.</p>
            {:else}
              {#each groupMembers as member}
                <div class="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50">
                  <img src={member.avatar} alt={member.name} class="w-10 h-10 rounded-full object-cover shrink-0" />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {member.name}{member.isCurrentUser ? " (Anda)" : ""}
                      </p>
                      {#if member.isOwner}
                        <span class="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-semibold text-pink-600">
                          Owner
                        </span>
                      {/if}
                    </div>
                    <p class="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                  {#if canManageGroup && !member.isCurrentUser}
                    <button
                      class="shrink-0 rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-red-50 transition"
                      on:click={() => removeGroupParticipant(member)}
                    >
                      Keluarkan
                    </button>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
        <div class="border-t border-gray-100 pt-3 space-y-1">
          <button
            class="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-800 hover:bg-gray-100"
            on:click={() => {
              showGroupSettingsPanel = false;
              dispatch("clearChat", null);
            }}
          >
            Clear Chat
          </button>
          <button
            class="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
            on:click={() => {
              showGroupSettingsPanel = false;
              dispatch("leaveGroup", null);
            }}
          >
            Keluar Grup
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if profilePanel}
    <div class="absolute right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl">
      <div class="flex h-16 items-center justify-between border-b border-gray-200 bg-gray-50 px-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900">Profile</h2>
          <p class="text-xs text-gray-500">{profilePanel.roleLabel || computedStatusLabel}</p>
        </div>
        <button
          class="rounded-full p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-800"
          aria-label="Close profile"
          on:click={() => (profilePanel = null)}
        >
          <X size={18} />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-5">
        <div class="flex flex-col items-center text-center">
          <img src={profilePanel.avatar} alt={profilePanel.name} class="h-24 w-24 rounded-full object-cover" />
          <h3 class="mt-4 text-lg font-semibold text-gray-900">{profilePanel.name}</h3>
          <p class="mt-1 text-sm text-gray-500">{profilePanel.email}</p>
          {#if !profilePanel.isCurrentUser && (activeChat?.roomType === "private" || activeChat?.isGroup === false)}
            <div class="mt-3 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <span class={cn("h-2 w-2 rounded-full", activeChat?.status === "online" ? "bg-emerald-500" : "bg-gray-300")}></span>
              {computedStatusLabel}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <!-- Chat Messages Area -->
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 z-10 flex flex-col">
    <!-- Date divider -->
    <div class="flex justify-center my-4">
      <span
        class="bg-white/80 backdrop-blur text-gray-500 text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium"
        >TODAY</span
      >
    </div>

    {#each messages as msg}
      <div
        class={cn(
          "flex",
          msg.sender === "me" ? "justify-end" : "justify-start",
          msg.isConsecutive ? "mt-1" : "mt-3",
        )}
      >
        <div
          class={cn(
            "group max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 text-sm relative shadow-sm",
            msg.sender === "me"
              ? "bg-[#D9FDD3] text-gray-900 rounded-tr-none"
              : "bg-white text-gray-900 rounded-tl-none",
          )}
        >
          <!-- Tail styling (simplified) -->
          {#if !msg.isConsecutive}
            <div
              class={cn(
                "absolute top-0 w-3 h-3",
                msg.sender === "me"
                  ? "-right-1.5 overflow-hidden"
                  : "-left-1.5 overflow-hidden",
              )}
            >
              <div
                class={cn(
                  "w-4 h-4 rounded-full absolute -top-2",
                  msg.sender === "me"
                    ? "bg-[#D9FDD3] -left-2"
                    : "bg-white left-0",
                )}
              ></div>
            </div>
          {/if}

          {#if msg.sender === "other" && activeChat?.roomType === "group" && !msg.isConsecutive}
            <button class="mb-0.5 text-left text-[11px] font-bold text-pink-600 hover:underline" on:click={() => openMessageProfile(msg)}>
              {msg.senderName}
            </button>
          {/if}

          <div class="flex items-end gap-2 flex-wrap">
            <span class="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
            <span
              class="text-[10px] text-gray-500 font-medium ml-auto self-end pt-1 whitespace-nowrap"
            >
              {msg.time}
              {#if msg.sender === "me"}
                <!-- Checkmarks -->
                <svg
                  viewBox="0 0 16 15"
                  width="16"
                  height="15"
                  class={cn(
                    "inline-block ml-0.5 fill-current",
                    msg.readByOthers ? "text-pink-600" : "text-gray-400",
                  )}
                >
                  <path
                    d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                  ></path>
                </svg>
              {/if}
            </span>
            {#if msg.sender === "me"}
              <button
                class="ml-1 rounded p-0.5 text-gray-400 opacity-70 transition hover:bg-black/5 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                title="Delete message"
                aria-label="Delete message"
                on:click={() => deleteMessage(msg)}
              >
                <Trash2 size={12} />
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Input Area -->
  <div
    class="min-h-[60px] bg-gray-50 px-4 py-3 flex items-end gap-3 z-10 border-t border-gray-200"
  >
    <button
      class="p-2 text-gray-500 hover:text-gray-700 transition-colors shrink-0 mb-1"
    >
      <Smile size={24} strokeWidth={1.5} />
    </button>
    <button
      class="p-2 text-gray-500 hover:text-gray-700 transition-colors shrink-0 mb-1"
    >
      <Paperclip size={22} strokeWidth={1.5} />
    </button>

    <div
      class="flex-1 bg-white rounded-xl border border-gray-300 focus-within:border-pink-600 focus-within:ring-1 focus-within:ring-pink-600 overflow-hidden flex items-center min-h-[44px]"
    >
      <textarea
        bind:value={newMessage}
        on:input={() => dispatch("typing", null)}
        on:keydown={handleKeydown}
        placeholder="Type a message"
        class="w-full bg-transparent border-none focus:outline-none resize-none px-4 py-2.5 max-h-[120px] text-[15px] scrollbar-hide text-gray-800"
        rows="1"
        style="height: auto;"
      ></textarea>
    </div>

    <button
      class="p-2.5 bg-pink-600 hover:bg-pink-600 rounded-full text-white transition-colors shrink-0 mb-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      on:click={sendMessage}
      disabled={!newMessage.trim()}
    >
      <Send size={18} class="ml-0.5" />
    </button>
  </div>
  {#if wsError}
    <div class="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 z-10">
      {wsError}
    </div>
  {/if}
  <div class="border-t border-gray-200 bg-white/80 px-3 py-2 z-10">
    <details>
      <summary class="text-[11px] text-gray-600 cursor-pointer">
        WebSocket Debug ({wsStatus}) - {wsDebugLogs.length} logs
      </summary>
      {#if wsDebugLogs.length > 0}
        <p class="mt-1 text-[11px] text-gray-500 font-mono break-all">
          {wsDebugLogs[wsDebugLogs.length - 1]}
        </p>
      {/if}
      <div class="mt-2 max-h-28 overflow-y-auto space-y-1">
        {#if wsDebugLogs.length === 0}
          <p class="text-[11px] text-gray-400">Belum ada log websocket</p>
        {:else}
          {#each wsDebugLogs as line}
            <p class="text-[11px] text-gray-600 font-mono break-all">{line}</p>
          {/each}
        {/if}
      </div>
    </details>
  </div>
</div>
{/if}

<script lang="ts">
  import { Search, MoreVertical, MessageSquarePlus } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";
  import { createEventDispatcher } from "svelte";

  type SidebarChat = {
    id: string;
    name: string;
    description?: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    roomType: "private" | "group";
    isGroup: boolean;
    status?: "online" | "offline" | "last_seen_recently";
    participantCount?: number;
  };
  type ContactItem = {
    id: string;
    user_id: string;
    name: string;
    email: string;
    avatar: string;
  };

  export let chats: SidebarChat[] = [];
  export let contacts: ContactItem[] = [];
  export let activeChatId = "";
  let searchQuery = "";
  let showMoreMenu = false;
  let showContactPanel = false;
  let showGroupPanel = false;
  let groupStep: "members" | "details" = "members";
  let contactSearchQuery = "";
  let groupSearchQuery = "";
  let groupName = "";
  let groupDescription = "";
  let selectedGroupMembers: ContactItem[] = [];

  const dispatch = createEventDispatcher<{
    select: { id: string };
    "create-from-contact": { contactUserId: string };
    "create-group": { name: string; description: string; memberUserIds: string[] };
    reconnect: null;
    clear: null;
  }>();

  function selectChat(id: string) {
    activeChatId = id;
    dispatch("select", { id });
  }

  function openContactPanel() {
    showContactPanel = true;
    showGroupPanel = false;
    showMoreMenu = false;
  }

  function openGroupPanel() {
    showGroupPanel = true;
    showContactPanel = false;
    showMoreMenu = false;
    groupStep = "members";
    groupSearchQuery = "";
    groupName = "";
    groupDescription = "";
    selectedGroupMembers = [];
  }

  function startChatFromContact(contact: ContactItem) {
    dispatch("create-from-contact", { contactUserId: contact.user_id });
    showContactPanel = false;
    contactSearchQuery = "";
  }

  function toggleGroupMember(contact: ContactItem) {
    const exists = selectedGroupMembers.some((member) => member.user_id === contact.user_id);
    selectedGroupMembers = exists
      ? selectedGroupMembers.filter((member) => member.user_id !== contact.user_id)
      : [...selectedGroupMembers, contact];
  }

  function submitCreateGroup() {
    const name = groupName.trim();
    if (!name || selectedGroupMembers.length === 0) return;
    dispatch("create-group", {
      name,
      description: groupDescription.trim(),
      memberUserIds: selectedGroupMembers.map((member) => member.user_id),
    });
    showGroupPanel = false;
    groupStep = "members";
    groupName = "";
    groupDescription = "";
    selectedGroupMembers = [];
  }

  function initialsForName(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "G";
    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
  }

  $: filteredChats = chats.filter((chat) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      chat.name.toLowerCase().includes(q) ||
      chat.lastMessage.toLowerCase().includes(q)
    );
  });
  $: filteredContacts = contacts.filter((contact) => {
    const q = contactSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      contact.name.toLowerCase().includes(q) ||
      contact.email.toLowerCase().includes(q)
    );
  });
  $: filteredGroupContacts = contacts.filter((contact) => {
    const q = groupSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      contact.name.toLowerCase().includes(q) ||
      contact.email.toLowerCase().includes(q)
    );
  });
</script>

<div
  class="w-full md:w-[320px] lg:w-[380px] h-full flex flex-col border-r border-gray-200 bg-white shrink-0"
>
  <!-- Header -->
  <div
    class="h-16 px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200 shrink-0"
  >
    <h1 class="text-xl font-semibold text-gray-800">Chats</h1>
    <div class="relative flex items-center gap-2 text-gray-500">
      <button
        class="p-2 hover:bg-gray-200 rounded-full transition-colors"
        title="New Chat"
        on:click={openContactPanel}
      >
        <MessageSquarePlus size={20} />
      </button>
      <button
        class={cn(
          "p-2 hover:bg-gray-200 rounded-full transition-colors",
          showMoreMenu ? "bg-gray-200 text-gray-800" : "",
        )}
        title="More Options"
        on:click={() => {
          showMoreMenu = !showMoreMenu;
        }}
      >
        <MoreVertical size={20} />
      </button>

      {#if showMoreMenu}
        <div
          class="absolute right-0 top-11 z-30 w-52 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
        >
          <button
            class="w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 transition-colors"
            on:click={() => {
              showMoreMenu = false;
              openGroupPanel();
            }}
          >
            Tambah Grup Baru
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if showGroupPanel}
    <div class="flex-1 flex flex-col bg-white border-b border-gray-100">
      <div class="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-800">
          {groupStep === "members" ? "Tambah Grup Baru" : "Detail Grup"}
        </h2>
        <button
          class="text-sm text-gray-600 hover:text-gray-900"
          on:click={() => (showGroupPanel = false)}
        >
          Kembali
        </button>
      </div>

      {#if groupStep === "members"}
        <div class="p-3 border-b border-gray-100 space-y-3">
          {#if selectedGroupMembers.length > 0}
            <div class="flex gap-2 overflow-x-auto pb-1">
              {#each selectedGroupMembers as member}
                <button
                  class="flex items-center gap-1.5 rounded-full bg-pink-50 px-2 py-1 text-xs text-pink-700 whitespace-nowrap"
                  on:click={() => toggleGroupMember(member)}
                >
                  <img src={member.avatar} alt={member.name} class="w-5 h-5 rounded-full object-cover" />
                  {member.name}
                  <span class="text-pink-500">x</span>
                </button>
              {/each}
            </div>
          {/if}
          <div class="relative flex items-center bg-gray-100 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-pink-600">
            <Search class="text-gray-400 w-4 h-4 mr-2 shrink-0" />
            <input
              type="text"
              bind:value={groupSearchQuery}
              placeholder="Cari anggota team"
              class="w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-500 py-1"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          {#if filteredGroupContacts.length === 0}
            <div class="px-4 py-6 text-sm text-gray-500 text-center">Anggota team tidak ditemukan</div>
          {:else}
            {#each filteredGroupContacts as contact}
              <button
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50"
                on:click={() => toggleGroupMember(contact)}
              >
                <img src={contact.avatar} alt={contact.name} class="w-10 h-10 rounded-full object-cover" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                  <p class="text-xs text-gray-500 truncate">{contact.email}</p>
                </div>
                <span
                  class={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center text-[10px]",
                    selectedGroupMembers.some((member) => member.user_id === contact.user_id)
                      ? "bg-pink-600 border-pink-600 text-white"
                      : "border-gray-300 text-transparent",
                  )}
                >
                  ✓
                </span>
              </button>
            {/each}
          {/if}
        </div>

        <div class="p-3 border-t border-gray-100 bg-gray-50">
          <button
            class="w-full bg-pink-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            on:click={() => (groupStep = "details")}
            disabled={selectedGroupMembers.length === 0}
          >
            Lanjut
          </button>
        </div>
      {:else}
        <div class="flex-1 p-4 space-y-4 bg-white">
          <div class="flex justify-center">
            <div class="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 text-xl font-semibold">
              {initialsForName(groupName)}
            </div>
          </div>
          <input
            type="text"
            bind:value={groupName}
            placeholder="Nama grup"
            class="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-pink-600"
          />
          <textarea
            bind:value={groupDescription}
            placeholder="Deskripsi grup"
            class="w-full min-h-20 text-sm bg-white border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-pink-600 resize-none"
          ></textarea>
          <div>
            <p class="text-xs font-medium text-gray-500 mb-2">{selectedGroupMembers.length} anggota dipilih</p>
            <div class="space-y-2 max-h-52 overflow-y-auto">
              {#each selectedGroupMembers as member}
                <div class="flex items-center gap-3">
                  <img src={member.avatar} alt={member.name} class="w-8 h-8 rounded-full object-cover" />
                  <div class="min-w-0">
                    <p class="text-sm text-gray-900 truncate">{member.name}</p>
                    <p class="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
        <div class="p-3 border-t border-gray-100 bg-gray-50 flex gap-2">
          <button
            class="flex-1 bg-white border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors"
            on:click={() => (groupStep = "members")}
          >
            Kembali
          </button>
          <button
            class="flex-1 bg-pink-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            on:click={submitCreateGroup}
            disabled={!groupName.trim()}
          >
            Buat Grup
          </button>
        </div>
      {/if}
    </div>
  {:else if showContactPanel}
    <div class="flex-1 flex flex-col bg-white border-b border-gray-100">
      <div class="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-800">New Chat</h2>
        <button
          class="text-sm text-gray-600 hover:text-gray-900"
          on:click={() => (showContactPanel = false)}
        >
          Kembali
        </button>
      </div>
      <div class="p-3 border-b border-gray-100">
        <div class="relative flex items-center bg-gray-100 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-pink-600">
          <Search class="text-gray-400 w-4 h-4 mr-2 shrink-0" />
          <input
            type="text"
            bind:value={contactSearchQuery}
            placeholder="Cari kontak team"
            class="w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-500 py-1"
          />
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        {#if filteredContacts.length === 0}
          <div class="px-4 py-6 text-sm text-gray-500 text-center">Kontak team tidak ditemukan</div>
        {:else}
          {#each filteredContacts as contact}
            <button
              class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50"
              on:click={() => startChatFromContact(contact)}
            >
              <img src={contact.avatar} alt={contact.name} class="w-10 h-10 rounded-full object-cover" />
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{contact.name}</p>
                <p class="text-xs text-gray-500 truncate">{contact.email}</p>
              </div>
            </button>
          {/each}
        {/if}
      </div>
      <div class="p-3 border-t border-gray-100 bg-gray-50 space-y-2">
        <p class="text-[11px] text-gray-500">
          Klik kontak untuk langsung membuka private chat.
        </p>
      </div>
    </div>
  {:else}

  <!-- Search -->
  <div class="p-2 border-b border-gray-100 bg-white shrink-0">
    <div
      class="relative flex items-center bg-gray-100 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-pink-600"
    >
      <Search class="text-gray-400 w-4 h-4 mr-2 shrink-0" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search or start a new chat"
        class="w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-500 py-1"
      />
    </div>
  </div>

  <!-- Chat List -->
  <div class="flex-1 overflow-y-auto scrollbar-hide bg-white">
    {#if filteredChats.length === 0}
      <div class="px-4 py-6 text-sm text-gray-500 text-center">
        Chat tidak ditemukan
      </div>
    {:else}
    {#each filteredChats as chat}
      <button
        class={cn(
          "w-full flex items-center px-3 py-3 gap-3 transition-colors hover:bg-gray-50 cursor-pointer text-left border-b border-gray-50",
          activeChatId === chat.id ? "bg-gray-100" : "",
        )}
        on:click={() => selectChat(chat.id)}
      >
        <img
          src={chat.avatar}
          alt={chat.name}
          class="w-12 h-12 rounded-full object-cover shrink-0"
        />
        <div class="flex-1 min-w-0 border-gray-100">
          <div class="flex justify-between items-baseline mb-0.5">
            <h3 class="font-medium text-gray-900 truncate pr-2">{chat.name}</h3>
            <span
              class={cn(
                "text-xs shrink-0",
                chat.unread > 0 ? "text-pink-600 font-medium" : "text-gray-500",
              )}
            >
              {chat.time}
            </span>
          </div>
          <div class="flex justify-between items-center gap-2">
            <p class="flex min-w-0 items-center gap-1.5 truncate text-sm text-gray-500">
              {#if chat.roomType === "private"}
                <span class={cn("h-1.5 w-1.5 shrink-0 rounded-full", chat.status === "online" ? "bg-emerald-500" : "bg-gray-300")}></span>
              {/if}
              <span class="truncate">{chat.lastMessage}</span>
            </p>
            {#if chat.unread > 0}
              <span
                class="bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[1.25rem] text-center rounded-full shrink-0"
              >
                {chat.unread}
              </span>
            {/if}
          </div>
        </div>
      </button>
    {/each}
    {/if}
  </div>
  {/if}
</div>

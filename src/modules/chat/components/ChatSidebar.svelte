<script lang="ts">
  import { Search, MoreVertical, MessageSquarePlus } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  // Dummy data for chat list
  export let chats = [
    {
      id: 1,
      name: "Team Alpha",
      avatar:
        "https://ui-avatars.com/api/?name=Team+Alpha&background=0D8ABC&color=fff",
      lastMessage: "Are we still on for the 3pm meeting?",
      time: "10:42 AM",
      unread: 2,
      isGroup: true,
    },
    {
      id: 2,
      name: "Sarah Jenkins",
      avatar:
        "https://ui-avatars.com/api/?name=Sarah+Jenkins&background=F59E0B&color=fff",
      lastMessage: "I just sent over the design files.",
      time: "Yesterday",
      unread: 0,
      isGroup: false,
    },
    {
      id: 3,
      name: "Project Phoenix",
      avatar:
        "https://ui-avatars.com/api/?name=Project+Phoenix&background=10B981&color=fff",
      lastMessage: "Mark: I have updated the repository.",
      time: "Yesterday",
      unread: 0,
      isGroup: true,
    },
    {
      id: 4,
      name: "David Chen",
      avatar:
        "https://ui-avatars.com/api/?name=David+Chen&background=8B5CF6&color=fff",
      lastMessage: "Thanks for your help!",
      time: "Tuesday",
      unread: 0,
      isGroup: false,
    },
    {
      id: 5,
      name: "Design System Sync",
      avatar:
        "https://ui-avatars.com/api/?name=Design+System&background=EC4899&color=fff",
      lastMessage: "Let's review the new components.",
      time: "Monday",
      unread: 5,
      isGroup: true,
    },
    // Adding more items for scrolling effect
    {
      id: 6,
      name: "General Sync",
      avatar:
        "https://ui-avatars.com/api/?name=General+Sync&background=6366F1&color=fff",
      lastMessage: "Release is scheduled for next week.",
      time: "Monday",
      unread: 0,
      isGroup: true,
    },
    {
      id: 7,
      name: "Rachel Moore",
      avatar:
        "https://ui-avatars.com/api/?name=Rachel+Moore&background=14B8A6&color=fff",
      lastMessage: "Sure, I can help with that.",
      time: "Sunday",
      unread: 0,
      isGroup: false,
    },
  ];

  export let activeChatId = 1;
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function selectChat(id: number) {
    activeChatId = id;
    dispatch("select", { id });
  }
</script>

<div
  class="w-full md:w-[320px] lg:w-[380px] h-full flex flex-col border-r border-gray-200 bg-white shrink-0"
>
  <!-- Header -->
  <div
    class="h-16 px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200 shrink-0"
  >
    <h1 class="text-xl font-semibold text-gray-800">Chats</h1>
    <div class="flex items-center gap-2 text-gray-500">
      <button
        class="p-2 hover:bg-gray-200 rounded-full transition-colors"
        title="New Chat"
      >
        <MessageSquarePlus size={20} />
      </button>
      <button
        class="p-2 hover:bg-gray-200 rounded-full transition-colors"
        title="More Options"
      >
        <MoreVertical size={20} />
      </button>
    </div>
  </div>

  <!-- Search -->
  <div class="p-2 border-b border-gray-100 bg-white shrink-0">
    <div
      class="relative flex items-center bg-gray-100 rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-transparent focus-within:border-pink-600"
    >
      <Search class="text-gray-400 w-4 h-4 mr-2 shrink-0" />
      <input
        type="text"
        placeholder="Search or start a new chat"
        class="w-full bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-500 py-1"
      />
    </div>
  </div>

  <!-- Chat List -->
  <div class="flex-1 overflow-y-auto scrollbar-hide bg-white">
    {#each chats as chat, i}
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
            <p class="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
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
  </div>
</div>

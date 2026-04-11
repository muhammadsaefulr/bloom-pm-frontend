<script lang="ts">
  import {
    Search,
    MoreVertical,
    Paperclip,
    Smile,
    Send,
    Phone,
    Video,
  } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  // Mock active chat user info
  export let activeChat = {
    id: 1,
    name: "Team Alpha",
    avatar:
      "https://ui-avatars.com/api/?name=Team+Alpha&background=0D8ABC&color=fff",
    status: "3 members online",
    isGroup: true,
  };

  // Mock messages
  export let messages = [
    {
      id: 1,
      sender: "other",
      senderName: "Sarah Jenkins",
      text: "Hey team, how's the progress on the new feature?",
      time: "10:30 AM",
      isConsecutive: false,
    },
    {
      id: 2,
      sender: "me",
      text: "It's going well! I just finished the UI layout.",
      time: "10:35 AM",
      isConsecutive: false,
    },
    {
      id: 3,
      sender: "me",
      text: "I'll push the code in a few minutes.",
      time: "10:36 AM",
      isConsecutive: true,
    },
    {
      id: 4,
      sender: "other",
      senderName: "David Chen",
      text: "Awesome. I'll review it once it's up.",
      time: "10:40 AM",
      isConsecutive: false,
    },
    {
      id: 5,
      sender: "other",
      senderName: "Sarah Jenkins",
      text: "Are we still on for the 3pm meeting?",
      time: "10:42 AM",
      isConsecutive: false,
    },
  ];

  let newMessage = "";

  function sendMessage() {
    if (!newMessage.trim()) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messages = [
      ...messages,
      {
        id: messages.length + 1,
        sender: "me",
        text: newMessage,
        time: timeString,
        isConsecutive:
          messages.length > 0 && messages[messages.length - 1].sender === "me",
      },
    ];

    newMessage = "";
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex-1 flex flex-col h-full bg-[#EFEAE2] relative">
  <!-- WhatsApp Web Background Pattern Overlay (Optional, using a light solid color is fine too) -->
  <div
    class="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
    style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
  ></div>

  <!-- Chat Header -->
  <div
    class="h-16 px-4 flex items-center justify-between bg-gray-50 border-b border-gray-200 shrink-0 z-10"
  >
    <div class="flex items-center gap-3 cursor-pointer">
      <img
        src={activeChat.avatar}
        alt={activeChat.name}
        class="w-10 h-10 rounded-full object-cover"
      />
      <div class="flex flex-col">
        <span class="font-medium text-gray-900 leading-tight"
          >{activeChat.name}</span
        >
        <span class="text-xs text-gray-500 leading-tight mt-0.5"
          >{activeChat.status}</span
        >
      </div>
    </div>
    <div class="flex items-center gap-4 text-gray-500">
      <!-- Added Phone & Video icons since it's common in modern chats -->
      <div class="w-px h-6 bg-gray-200 hidden sm:block mx-1"></div>
      <button class="hover:text-gray-700 transition-colors">
        <Search size={20} />
      </button>
      <button class="hover:text-gray-700 transition-colors">
        <MoreVertical size={20} />
      </button>
    </div>
  </div>

  <!-- Chat Messages Area -->
  <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 z-10 flex flex-col">
    <!-- Date divider -->
    <div class="flex justify-center my-4">
      <span
        class="bg-white/80 backdrop-blur text-gray-500 text-xs px-3 py-1.5 rounded-lg shadow-sm font-medium"
        >TODAY</span
      >
    </div>

    {#each messages as msg, i}
      <div
        class={cn(
          "flex",
          msg.sender === "me" ? "justify-end" : "justify-start",
          msg.isConsecutive ? "mt-1" : "mt-3",
        )}
      >
        <div
          class={cn(
            "max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 text-sm relative shadow-sm",
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

          {#if msg.sender === "other" && activeChat.isGroup && !msg.isConsecutive}
            <div class="text-[11px] font-bold text-pink-600 mb-0.5">
              {msg.senderName}
            </div>
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
                  class="inline-block ml-0.5 text-pink-600 fill-current"
                >
                  <path
                    d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                  ></path>
                </svg>
              {/if}
            </span>
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
</div>

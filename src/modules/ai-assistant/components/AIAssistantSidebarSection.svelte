<script lang="ts">
  import { Bot, Plus, MessageSquare } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";
  import { aiAssistantStore } from "../stores/aiAssistantStore.js";
  import type { AIConversation } from "../types/index.js";

  export let conversations: AIConversation[] = [];
  export let isCollapsed = false;

  $: activeChat =
    $page.url.searchParams.get("chat") ||
    ($page.url.pathname === "/ai-assistant" ? conversations[0]?.id || "" : "");

  function createChat() {
    const id = aiAssistantStore.createConversation();
    goto(`/ai-assistant?chat=${id}`);
  }
</script>

<section class={cn("px-1", isCollapsed && "flex justify-center px-0")}>
  {#if isCollapsed}
    <a
      href="/ai-assistant"
      class={cn(
        "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
        $page.url.pathname === "/ai-assistant"
          ? "bg-gray-100 text-gray-900"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
      )}
      aria-label="AI Assistant"
      title="AI Assistant"
    >
      <Bot class="h-5 w-5" />
    </a>
  {:else}
    <div class="mb-2 flex items-center justify-between px-2">
      <a
        href="/ai-assistant"
        class="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-700"
      >
        <Bot class="h-4 w-4 shrink-0" />
        <span class="truncate">AI Assistant</span>
      </a>
      <button
        type="button"
        class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="New AI chat"
        title="New AI chat"
        on:click={createChat}
      >
        <Plus class="h-4 w-4" />
      </button>
    </div>

    <div class="space-y-0.5">
      {#if conversations.length === 0}
        <a
          href="/ai-assistant"
          class="group flex min-h-9 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100/80 hover:text-gray-900"
        >
          <MessageSquare class="h-4 w-4 shrink-0 text-gray-400 group-hover:text-gray-600" />
          <span class="min-w-0 flex-1 truncate">New AI Chat</span>
        </a>
      {/if}
      {#each conversations as conversation}
        <a
          href={conversation.href}
          class={cn(
            "group flex min-h-9 items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors",
            activeChat === conversation.id
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900",
          )}
          title={conversation.title}
        >
          <MessageSquare
            class={cn(
              "h-4 w-4 shrink-0",
              activeChat === conversation.id
                ? "text-gray-700"
                : "text-gray-400 group-hover:text-gray-600",
            )}
          />
          <span class="min-w-0 flex-1 truncate">{conversation.title}</span>
        </a>
      {/each}
    </div>
  {/if}
</section>

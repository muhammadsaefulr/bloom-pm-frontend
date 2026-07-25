<script lang="ts">
  import { Bot, Plus, MessageSquare, MoreHorizontal, Edit2, Trash2 } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";
  import { aiAssistantStore } from "../stores/aiAssistantStore.js";
  import { deleteAiChat } from "../api/aiAssistantApi.js";
  import type { AIConversation } from "../types/index.js";

  export let conversations: AIConversation[] = [];
  export let isCollapsed = false;

  let dropdownOpenId: string | null = null;
  let editingId: string | null = null;
  let editTitleValue = "";
  let dropdownNode: HTMLElement | null = null;
  let inputNode: HTMLInputElement | null = null;

  $: activeChat =
    $page.url.searchParams.get("chat") ||
    ($page.url.pathname === "/ai-assistant" ? conversations[0]?.id || "" : "");

  function createChat() {
    const id = aiAssistantStore.createConversation();
    goto(`/ai-assistant?chat=${id}`);
  }
  
  function toggleDropdown(e: MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    dropdownOpenId = dropdownOpenId === id ? null : id;
  }
  
  function startEditing(e: MouseEvent, id: string, title: string) {
    e.preventDefault();
    e.stopPropagation();
    editingId = id;
    editTitleValue = title;
    dropdownOpenId = null;
    setTimeout(() => {
      if (inputNode) inputNode.focus();
    }, 10);
  }
  
  function saveEdit() {
    if (editingId && editTitleValue.trim()) {
      aiAssistantStore.renameConversation(editingId, editTitleValue.trim());
    }
    editingId = null;
  }
  
  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") editingId = null;
  }
  
  async function handleDelete(e: MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    dropdownOpenId = null;
    
    // Call backend
    try {
      await deleteAiChat(id);
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
    
    // Update store
    aiAssistantStore.deleteConversation(id);
    
    // Handle routing if active chat was deleted
    if (activeChat === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) {
        goto(`/ai-assistant?chat=${remaining[0].id}`, { replaceState: true, noScroll: true });
      } else {
        goto(`/ai-assistant`, { replaceState: true, noScroll: true });
      }
    }
  }

  function handleDocumentClick(e: MouseEvent) {
    if (dropdownNode && !dropdownNode.contains(e.target as Node)) {
      dropdownOpenId = null;
    }
    if (editingId && inputNode && !inputNode.contains(e.target as Node)) {
      saveEdit();
    }
  }
</script>

<svelte:window on:click={handleDocumentClick} />

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
        <div class="relative group">
          <a
            href={conversation.href}
            class={cn(
              "group flex min-h-9 items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors pr-8",
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
            {#if editingId === conversation.id}
              <input
                bind:this={inputNode}
                bind:value={editTitleValue}
                on:keydown={handleEditKeydown}
                class="min-w-0 flex-1 bg-white border border-gray-300 rounded px-1 -mx-1 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                on:click|stopPropagation
              />
            {:else}
              <span class="min-w-0 flex-1 truncate">{conversation.title}</span>
            {/if}
          </a>
          
          {#if editingId !== conversation.id}
            <button
              class={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100",
                dropdownOpenId === conversation.id && "opacity-100 bg-gray-200 text-gray-700"
              )}
              on:click={(e) => toggleDropdown(e, conversation.id)}
            >
              <MoreHorizontal class="w-4 h-4" />
            </button>
          {/if}
          
          {#if dropdownOpenId === conversation.id}
            <div
              bind:this={dropdownNode}
              class="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
            >
              <button
                class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 text-left"
                on:click={(e) => startEditing(e, conversation.id, conversation.title)}
              >
                <Edit2 class="w-3.5 h-3.5" />
                Rename
              </button>
              <button
                class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 text-left"
                on:click={(e) => handleDelete(e, conversation.id)}
              >
                <Trash2 class="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>

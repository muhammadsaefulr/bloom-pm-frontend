<script lang="ts">
  import {
    Bot,
    CheckCircle2,
    ClipboardList,
    Send,
    Sparkles,
  } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { selectedTeam } from "$modules/auth/stores/authStore.js";
  import AIAssistantLayout from "../components/AIAssistantLayout.svelte";
  import { queryTaskAI } from "../api/aiAssistantApi.js";
  import { aiAssistantStore, nowTime } from "../stores/aiAssistantStore.js";
  import type { AIConversation, AIMessage } from "../types/index.js";

  let message = "";
  let isSending = false;
  let activeConversation: AIConversation | null = null;
  let messages: AIMessage[] = [];

  $: activeConversation =
    $aiAssistantStore.find(
      (conversation) => conversation.id === $page.url.searchParams.get("chat"),
    ) || $aiAssistantStore[0] || null;

  $: messages = activeConversation?.messages || [];

  const quickPrompts = [
    "Task mana yang paling urgent?",
    "Cari task yang masih blocked",
    "Ringkas progres sprint ini",
    "Apa follow-up berikutnya?",
  ];

  $: if (typeof window !== "undefined" && !activeConversation) {
    const id = aiAssistantStore.ensureConversation();
    goto(`/ai-assistant?chat=${id}`);
  }

  async function sendMessage() {
    const text = message.trim();
    if (!text || isSending) return;

    const conversationID =
      activeConversation?.id || aiAssistantStore.ensureConversation();

    aiAssistantStore.addMessage(conversationID, {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: nowTime(),
    });
    message = "";
    isSending = true;

    try {
      const result = await queryTaskAI({
        question: text,
        tenant_id: $selectedTeam?.tenant_id,
        top_k: 8,
      });

      aiAssistantStore.addMessage(conversationID, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        createdAt: nowTime(),
        sources: result.sources,
      });
    } catch (error) {
      const content =
        error instanceof Error
          ? error.message
          : "AI Assistant belum bisa menjawab sekarang.";
      aiAssistantStore.setConversationError(conversationID, content);
    } finally {
      isSending = false;
    }
  }

  function usePrompt(prompt: string) {
    message = prompt;
  }
</script>

<AIAssistantLayout>
  <section
    class="flex h-full min-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
  >
    <header class="border-b border-gray-100 bg-white px-5 py-4">
      <div class="flex items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-600 text-white shadow-sm"
          >
            <Sparkles class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">
              AI Assistant
            </p>
            <h1 class="truncate text-lg font-semibold text-gray-950">
              {activeConversation?.title || "New AI Chat"}
            </h1>
          </div>
        </div>

        <div class="hidden items-center gap-2 md:flex">
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
          >
            <CheckCircle2 class="h-3.5 w-3.5" />
            {isSending ? "Thinking" : "Ready"}
          </span>
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
          >
            <ClipboardList class="h-3.5 w-3.5" />
            Task context
          </span>
        </div>
      </div>
    </header>

    <div class="flex-1 overflow-y-auto bg-gray-50/60 px-4 py-6 sm:px-6">
      <div class="flex w-full flex-col gap-6">
        <div class="flex flex-wrap gap-2">
          {#each quickPrompts as prompt}
            <button
              type="button"
              class="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-100 hover:text-gray-950"
              on:click={() => usePrompt(prompt)}
            >
              {prompt}
            </button>
          {/each}
        </div>

        <div class="flex flex-col gap-5">
          {#each messages as item}
            <div
              class={item.role === "user"
                ? "flex items-end justify-end gap-3"
                : "flex items-start justify-start gap-3"}
            >
              {#if item.role === "assistant"}
                <div
                  class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200"
                >
                  <Bot class="h-4 w-4" />
                </div>
              {/if}

              <div class="max-w-[min(980px,84%)]">
                <div
                  class={item.role === "user"
                    ? "rounded-2xl rounded-br-md bg-gray-950 px-4 py-3 text-sm leading-6 text-white shadow-sm"
                    : "rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-800 shadow-sm"}
                >
                  {item.content}
                </div>
                {#if item.sources?.length}
                  <div class="mt-2 flex flex-wrap gap-2">
                    {#each item.sources as source}
                      <a
                        href={source.url || `/tasks?task_id=${source.task_id}`}
                        class="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100"
                        title={source.snippet}
                      >
                        <span class="truncate">{source.title}</span>
                        <span class="text-gray-300">/</span>
                        <span>{Math.round(source.score * 100)}%</span>
                        <span class="text-blue-500">klik detail</span>
                      </a>
                    {/each}
                  </div>
                {/if}
                <p
                  class={item.role === "user"
                    ? "mt-1 text-right text-[11px] text-gray-400"
                    : "mt-1 text-[11px] text-gray-400"}
                >
                  {item.createdAt}
                </p>
              </div>
            </div>
          {/each}

          {#if isSending}
            <div class="flex items-start justify-start gap-3">
              <div
                class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-gray-700 shadow-sm ring-1 ring-gray-200"
              >
                <Bot class="h-4 w-4" />
              </div>
              <div
                class="rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm"
              >
                Reading task context...
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <footer class="border-t border-gray-100 bg-white px-4 py-4 sm:px-6">
      <form
        class="flex w-full items-end gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
        on:submit|preventDefault={sendMessage}
      >
        <textarea
          bind:value={message}
          class="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400"
          placeholder="Ask about tasks, priorities, meetings, or project context..."
          rows="1"
          disabled={isSending}
        ></textarea>
        <button
          type="submit"
          class="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-950 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200"
          disabled={!message.trim() || isSending}
          aria-label="Send message"
        >
          <Send class="h-4 w-4" />
        </button>
      </form>
    </footer>
  </section>
</AIAssistantLayout>

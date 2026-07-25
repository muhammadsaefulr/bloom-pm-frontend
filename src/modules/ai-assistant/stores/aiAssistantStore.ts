import { writable } from "svelte/store";
import type { AIConversation, AIMessage } from "../types/index.js";

const STORAGE_KEY = "bloom_pm_ai_assistant_conversations";

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function loadConversations(): AIConversation[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Partial<AIConversation> => !!item?.id)
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        title: item.title || "New AI Chat",
        href: item.href || `/ai-assistant?chat=${item.id}`,
        preview: item.preview || "Ask about tasks, priorities, or project context.",
        lastMessageAt: item.lastMessageAt || "Now",
        status: item.status || "active",
        messages: Array.isArray(item.messages) ? item.messages : [],
      }));
  } catch {
    return [];
  }
}

function saveConversations(conversations: AIConversation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function createAssistantStore() {
  const { subscribe, set, update } = writable<AIConversation[]>(loadConversations());

  subscribe(saveConversations);

  return {
    subscribe,
    ensureConversation: () => {
      let selectedID = "";
      update((conversations) => {
        if (conversations.length > 0) {
          selectedID = conversations[0].id;
          return conversations;
        }

        const conversation: AIConversation = {
          id: crypto.randomUUID(),
          title: "New AI Chat",
          href: "",
          preview: "Ask about tasks, priorities, or project context.",
          lastMessageAt: "Now",
          status: "active",
          messages: [
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                "Hi, I can help answer questions using task context that has been indexed for this workspace.",
              createdAt: nowTime(),
            },
          ],
        };
        conversation.href = `/ai-assistant?chat=${conversation.id}`;
        selectedID = conversation.id;
        return [conversation];
      });
      return selectedID;
    },
    createConversation: () => {
      const conversation: AIConversation = {
        id: crypto.randomUUID(),
        title: "New AI Chat",
        href: "",
        preview: "Ask about tasks, priorities, or project context.",
        lastMessageAt: "Now",
        status: "active",
        messages: [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Hi, I can help answer questions using task context that has been indexed for this workspace.",
            createdAt: nowTime(),
          },
        ],
      };
      conversation.href = `/ai-assistant?chat=${conversation.id}`;
      update((conversations) => [conversation, ...conversations]);
      return conversation.id;
    },
    addMessage: (conversationID: string, message: AIMessage) => {
      update((conversations) =>
        conversations.map((conversation) => {
          if (conversation.id !== conversationID) return conversation;

          const messages = [...(conversation.messages || []), message];
          const firstUserMessage = messages.find((item) => item.role === "user");
          return {
            ...conversation,
            messages,
            title:
              firstUserMessage?.content.slice(0, 42) ||
              conversation.title ||
              "New AI Chat",
            preview: message.content,
            lastMessageAt: "Now",
          };
        }),
      );
    },
    setConversationError: (conversationID: string, content: string) => {
      update((conversations) =>
        conversations.map((conversation) =>
          conversation.id === conversationID
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content,
                    createdAt: nowTime(),
                  },
                ],
                preview: content,
                lastMessageAt: "Now",
              }
            : conversation,
        ),
      );
    },
    deleteConversation: (conversationID: string) => {
      update((conversations) =>
        conversations.filter((conversation) => conversation.id !== conversationID)
      );
    },
    renameConversation: (conversationID: string, newTitle: string) => {
      update((conversations) =>
        conversations.map((conversation) =>
          conversation.id === conversationID
            ? { ...conversation, title: newTitle }
            : conversation
        )
      );
    },
    reset: () => set([]),
  };
}

export const aiAssistantStore = createAssistantStore();
export { nowTime };

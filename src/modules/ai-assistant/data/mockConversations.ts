import type { AIConversation, AIMessage } from "../types/index.js";

export const starterMessages: AIMessage[] = [
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "Hi, I can help summarize project context, inspect task priorities, and turn scattered notes into next actions.",
    createdAt: "09:12",
  },
  {
    id: "user-1",
    role: "user",
    content: "Show me the highest risk task items for this week.",
    createdAt: "09:13",
  },
  {
    id: "assistant-2",
    role: "assistant",
    content:
      "I would start by checking overdue tasks, high priority items, blocked statuses, and tasks with recent comments but no progress changes.",
    createdAt: "09:13",
  },
];

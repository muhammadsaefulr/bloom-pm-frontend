export type AIConversationStatus = "active" | "draft" | "archived";

export type AIConversation = {
  id: string;
  title: string;
  href: string;
  preview: string;
  lastMessageAt: string;
  status: AIConversationStatus;
  messages: AIMessage[];
};

export type AIMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: string;
  sources?: Array<{
    task_id: string;
    title: string;
    status: string;
    priority: string;
    score: number;
    snippet: string;
    url?: string;
  }>;
};

import { apiClient } from "$lib/api/client.js";

export type QueryTaskAIRequest = {
  tenant_id?: string;
  project_id?: string;
  question: string;
  status?: string[];
  priority?: string[];
  assigned_user_id?: string;
  top_k?: number;
};

export type TaskAISource = {
  task_id: string;
  title: string;
  status: string;
  priority: string;
  score: number;
  snippet: string;
  url?: string;
};

export type QueryTaskAIResponse = {
  answer: string;
  sources: TaskAISource[];
};

export async function queryTaskAI(
  payload: QueryTaskAIRequest,
): Promise<QueryTaskAIResponse> {
  const response = await apiClient.post<{ data: QueryTaskAIResponse }>(
    "/ai/tasks/query",
    payload,
    { skipGlobalLoading: true },
  );

  return response.data.data;
}

export async function deleteAiChat(conversationId: string): Promise<void> {
  await apiClient.delete(`/ai/chat/${conversationId}`);
}

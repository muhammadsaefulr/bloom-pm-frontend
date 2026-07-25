import { apiClient } from "$lib/api/client.js";
import { safeAvatarUrl } from "$lib/utils/avatar.js";
import type { Task, TaskCategory, TaskPriority, TaskStatus } from "../stores/taskStore.js";

export type TaskAssigneeApi = {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
};

// Shape returned by GET /tasks (list — overview only, no content fields)
export type TaskSummaryApi = {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_user_id?: string;
  owner?: string;
  project_name?: string;
  due_date?: string | null;
  progress?: number;
  tags?: { name: string; color: string }[] | null;
  users?: (string | TaskAssigneeApi)[] | null;
  attachments_count?: number;
  comments_count?: number;
  checklist?: string | null;
  metadata?: unknown;
};

// Shape returned by GET /tasks/:id (detail — includes rich content)
export type TaskApi = TaskSummaryApi & {
  content?: string;
  content_json?: unknown;
  content_text?: string;
};

// Query params for list endpoint — filters by string value, not UUID
export type TaskListParams = {
  page?: number;
  limit?: number;
  project_id?: string;
  status?: string;
  priority?: string;
  assigned_user_id?: string;
  search?: string;
};

function apiDateToInputDate(value?: string | null) {
  if (!value) return "No date";
  return value.slice(0, 10);
}

function normalizeAssignees(users?: (string | TaskAssigneeApi)[] | null) {
  if (!users?.length) {
    return { avatars: [], assignees: [] };
  }

  const assignees = users
    .filter((user): user is TaskAssigneeApi => typeof user !== "string")
    .map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: safeAvatarUrl(user.name, user.avatar_url),
    }));

  const avatars = users.map((user) => {
    if (typeof user === "string") return safeAvatarUrl("User", user);
    return safeAvatarUrl(user.name, user.avatar_url);
  });

  return { avatars, assignees };
}

// Maps summary API shape (list response) → Task view model (no content fields)
export function taskSummaryApiToView(task: TaskSummaryApi): Task {
  const { avatars, assignees } = normalizeAssignees(task.users);

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    category: (task.category ?? "General") as TaskCategory,
    status: task.status ?? "To do",
    priority: task.priority ?? "Normal",
    dueDate: apiDateToInputDate(task.due_date),
    tags: task.tags ?? [],
    attachments: task.attachments_count ?? 0,
    comments: task.comments_count ?? 0,
    checklist: task.checklist ?? null,
    users: avatars,
    assignees,
    owner: task.owner ?? "Unassigned",
    project: task.project_name ?? "",
    progress: task.progress ?? 0,
    // Content fields empty — populated only when detail is fetched
    content: "",
    contentJson: undefined,
    contentText: undefined,
    projectId: task.project_id,
    assignedUserId: task.assigned_user_id,
    ownerId: task.owner,
  };
}

// Maps full API shape (detail response) → Task view model (including content)
export function taskApiToView(task: TaskApi): Task {
  const base = taskSummaryApiToView(task);
  return {
    ...base,
    content: task.content ?? "",
    contentJson: task.content_json,
    contentText: task.content_text,
  };
}

export function taskViewToApi(task: Task) {
  const assignees = (task.assignees ?? []).map((assignee) => ({
    id: assignee.id,
    name: assignee.name,
    email: assignee.email,
    avatar_url: assignee.avatarUrl,
  }));

  return {
    project_id: task.projectId,
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    priority: task.priority,
    assigned_user_id: task.assignedUserId || assignees[0]?.id,
    project_name: task.project || undefined,
    due_date: task.dueDate === "No date" ? "" : task.dueDate,
    progress: task.progress,
    tags: task.tags,
    users: assignees.length > 0 ? assignees : task.users,
    attachments_count: task.attachments,
    comments_count: task.comments,
    checklist: task.checklist,
    content: task.content,
    content_json: task.contentJson,
    content_text: task.contentText,
  };
}

export async function getTasksApi(params: TaskListParams = {}): Promise<Task[]> {
  const response = await apiClient.get<{ data: TaskSummaryApi[] }>("/tasks", {
    params: { limit: 100, ...params },
    skipGlobalLoading: true,
  });

  return (response.data.data || []).map(taskSummaryApiToView);
}

export async function getTaskByIdApi(id: string): Promise<Task> {
  const response = await apiClient.get<{ data: TaskApi }>(`/tasks/${id}`, {
    skipGlobalLoading: true,
  });
  return taskApiToView(response.data.data);
}

export async function createTaskApi(task: Task): Promise<Task> {
  const response = await apiClient.post<{ data: TaskApi }>("/tasks", taskViewToApi(task), {
    skipGlobalLoading: true,
  });
  return taskApiToView(response.data.data);
}

export async function updateTaskApi(task: Task): Promise<void> {
  if (typeof task.id !== "string") return;
  await apiClient.put(`/tasks/${task.id}`, taskViewToApi(task), {
    skipGlobalLoading: true,
  });
}

export async function deleteTaskApi(taskId: string): Promise<void> {
  await apiClient.delete(`/tasks/${taskId}`, {
    skipGlobalLoading: true,
  });
}

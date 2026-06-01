import { writable, derived } from "svelte/store";
import { fallbackAvatarUrl } from "$lib/utils/avatar.js";
import {
  createTaskApi,
  deleteTaskApi,
  getTasksApi,
  updateTaskApi,
} from "../api/tasksApi.js";
import { showTaskToast } from "./taskToastStore.js";

export type TaskStatus = "To do" | "Doing" | "Done";
export type TaskPriority = "Urgent" | "Normal" | "Low";
export type TaskID = string | number;
export type TaskAssignee = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
};

export const taskCategories = [
  { name: "Event", color: "text-violet-700 bg-violet-50" },
  { name: "Campaign", color: "text-rose-700 bg-rose-50" },
  { name: "Operations", color: "text-blue-700 bg-blue-50" },
  { name: "Product", color: "text-emerald-700 bg-emerald-50" },
  { name: "Reporting", color: "text-amber-700 bg-amber-50" },
  { name: "General", color: "text-gray-700 bg-gray-100" },
] as const;
export type TaskCategory = (typeof taskCategories)[number]["name"];

export interface Task {
  id: TaskID;
  title: string;
  description: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tags: { name: string; color: string }[];
  attachments: number;
  comments: number;
  checklist: string | null;
  users: string[];
  assignees?: TaskAssignee[];
  owner: string;
  project: string;
  progress: number;
  content: string;
  contentJson?: unknown;
  contentText?: string;
  projectId?: string;
  statusId?: string;
  priorityId?: string;
  assignedUserId?: string;
}

export type TaskDraft = Pick<
  Task,
  "title" | "description" | "category" | "status" | "priority" | "dueDate" | "owner" | "project"
>;

export const labels = writable([
  { id: "todo", name: "To do", color: "bg-orange-500 text-white" },
  { id: "doing", name: "Doing", color: "bg-blue-500 text-white" },
  { id: "done", name: "Done", color: "bg-pink-500 text-white" },
]);

const initialTasks: Task[] = [];

export const tasksData = writable<Task[]>(initialTasks);
export const selectedTaskId = writable<TaskID | null>(initialTasks[0]?.id ?? null);
const updateTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const filterQuery = writable("");
export const activeLabelFilter = writable("All Tasks"); // "All Tasks", "To do", "Doing", "Done"
export const activeSort = writable("none"); // "none", "title", "dueDate", "priority"

export const filteredTasks = derived(
  [tasksData, filterQuery, activeLabelFilter, activeSort],
  ([$tasksData, $filterQuery, $activeLabelFilter, $activeSort]) => {
    let result = [...$tasksData];

    if ($filterQuery.trim() !== "") {
      const q = $filterQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    if ($activeLabelFilter !== "All Tasks") {
      result = result.filter((t) => t.status === $activeLabelFilter);
    }

    if ($activeSort === "title") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if ($activeSort === "dueDate") {
      result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    } else if ($activeSort === "priority") {
      const priorityMap: Record<string, number> = {
        Urgent: 1,
        Normal: 2,
        Low: 3,
      };
      result.sort(
        (a, b) => (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4)
      );
    }

    return result;
  }
);

export const selectedTask = derived(
  [tasksData, selectedTaskId],
  ([$tasksData, $selectedTaskId]) =>
    $tasksData.find((task) => task.id === $selectedTaskId) ?? null
);

function syncSelectedTask(tasks: Task[]) {
  selectedTaskId.update((selectedId) => {
    if (selectedId && tasks.some((task) => task.id === selectedId)) {
      return selectedId;
    }

    return tasks[0]?.id ?? null;
  });
}

export async function loadTasks() {
  let loadedTasks: Task[];

  try {
    loadedTasks = await getTasksApi({ limit: 100 });
  } catch (error) {
    console.error("Failed to load tasks from API", error);
    tasksData.set([]);
    syncSelectedTask([]);
    showTaskToast("Failed to load tasks.", "error");
    return [];
  }

  tasksData.set(loadedTasks);
  syncSelectedTask(loadedTasks);
  return loadedTasks;
}

export function selectTask(taskId: TaskID) {
  selectedTaskId.set(taskId);
}

export function updateTask(taskId: TaskID, patch: Partial<Task>) {
  let updatedTask: Task | null = null;
  tasksData.update((tasks) =>
    tasks.map((task) => {
      if (task.id !== taskId) return task;
      updatedTask = { ...task, ...patch };
      return updatedTask;
    })
  );

  const taskForRequest = updatedTask as Task | null;
  if (taskForRequest && typeof taskForRequest.id === "string") {
    const taskId = taskForRequest.id;
    const existingTimer = updateTimers.get(taskId);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    updateTimers.set(
      taskId,
      setTimeout(() => {
        updateTimers.delete(taskId);
        void updateTaskApi(taskForRequest).catch((error) => {
          console.error("Failed to update task", error);
          showTaskToast("Failed to update task.", "error");
        });
      }, 500),
    );
  }
}

export function createTask(status: TaskStatus = "To do") {
  const newTask: Task = {
    id: Date.now(),
    title: "Untitled task",
    description: "Add a short task description",
    category: "General",
    status,
    priority: "Normal",
    dueDate: "No date",
    tags: [{ name: "Internal", color: "text-emerald-700 bg-emerald-50" }],
    attachments: 0,
    comments: 0,
    checklist: null,
    users: [fallbackAvatarUrl("New")],
    assignees: [],
    owner: "Unassigned",
    project: "",
    progress: 0,
    content:
      "<h2>Task notes</h2><p>Start writing context, requirements, decisions, and checklist items here.</p>",
  };

  tasksData.update((tasks) => [newTask, ...tasks]);
  selectedTaskId.set(newTask.id);

  void createTaskApi(newTask).then((persistedTask) => {
    tasksData.update((tasks) => tasks.map((task) => (task.id === newTask.id ? persistedTask : task)));
    selectedTaskId.update((selectedId) => (selectedId === newTask.id ? persistedTask.id : selectedId));
    showTaskToast("Task created.", "success");
  }).catch((error) => {
    console.error("Failed to create task", error);
    tasksData.update((tasks) => tasks.filter((task) => task.id !== newTask.id));
    selectedTaskId.update((selectedId) => (selectedId === newTask.id ? null : selectedId));
    showTaskToast("Failed to create task.", "error");
  });

  return newTask;
}

export function deleteTask(taskId: TaskID) {
  tasksData.update((tasks) => tasks.filter((task) => task.id !== taskId));
  selectedTaskId.update((selectedId) => (selectedId === taskId ? null : selectedId));

  if (typeof taskId === "string") {
    const existingTimer = updateTimers.get(taskId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      updateTimers.delete(taskId);
    }

    void deleteTaskApi(taskId).then(() => {
      showTaskToast("Task deleted.", "success");
    }).catch((error) => {
      console.error("Failed to delete task", error);
      showTaskToast("Failed to delete task.", "error");
    });
  }
}


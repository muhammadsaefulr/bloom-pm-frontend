import { writable } from "svelte/store";

export type TaskToastType = "success" | "error";

export type TaskToast = {
  id: number;
  type: TaskToastType;
  message: string;
};

export const taskToasts = writable<TaskToast[]>([]);

export function showTaskToast(message: string, type: TaskToastType = "success") {
  const id = Date.now();

  taskToasts.update((toasts) => [...toasts, { id, type, message }]);

  setTimeout(() => {
    taskToasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }, 3200);
}


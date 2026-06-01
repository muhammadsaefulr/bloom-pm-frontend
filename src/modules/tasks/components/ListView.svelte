<script lang="ts">
  import { Calendar, MoreHorizontal, CheckCircle2 } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  import { filteredTasks, selectTask, taskCategories, type TaskID } from "../stores/taskStore.js";

  const dispatch = createEventDispatcher<{ selectTask: TaskID }>();

  function getStatusColor(status: string) {
    switch (status) {
      case "To do":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Doing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Done":
        return "bg-pink-100 text-pink-700 border-pink-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  function getCategoryColor(category: string) {
    return (
      taskCategories.find((taskCategory) => taskCategory.name === category)?.color ??
      "text-gray-700 bg-gray-100"
    );
  }

  function openTask(taskId: TaskID) {
    selectTask(taskId);
    dispatch("selectTask", taskId);
  }
</script>

<div class="h-full w-full overflow-y-auto overflow-x-hidden bg-gray-50/50 p-5">
  <div
    class="w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
  >
    <div class="divide-y divide-gray-100">
      {#if $filteredTasks.length === 0}
        <div class="p-8 text-center text-gray-500">
          No tasks found matching your filters.
        </div>
      {/if}
      {#each $filteredTasks as task}
        <div
          class="group flex cursor-pointer items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50"
          role="button"
          tabindex="0"
          on:click={() => openTask(task.id)}
          on:keydown={(event) => event.key === "Enter" && openTask(task.id)}
        >
          <div class="flex min-w-0 items-center gap-4">
            <button
              class="text-gray-300 hover:text-pink-600 transition-colors"
            >
              <CheckCircle2 size={24} />
            </button>
            <div class="flex min-w-0 flex-col">
              <span class="font-medium text-gray-900">{task.title}</span>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <span
                  class={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md border",
                    getStatusColor(task.status),
                  )}
                >
                  {task.status}
                </span>
                <span
                  class={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    getCategoryColor(task.category),
                  )}
                >
                  {task.category}
                </span>
                <span class="text-xs text-gray-400">{task.owner}</span>
              </div>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-6">
            <div class="hidden items-center gap-1.5 text-sm text-gray-500 sm:flex">
              <Calendar size={14} class="text-gray-400" />
              {task.dueDate}
            </div>
            <button
              class="text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

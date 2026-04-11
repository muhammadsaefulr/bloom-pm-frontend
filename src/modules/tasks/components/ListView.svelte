<script lang="ts">
  import { Calendar, MoreHorizontal, CheckCircle2 } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  import { filteredTasks } from "../stores/taskStore.js";

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
</script>

<div class="h-full w-full p-6 bg-white overflow-y-auto overflow-x-hidden">
  <div
    class="w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
  >
    <div class="divide-y divide-gray-100">
      {#if $filteredTasks.length === 0}
        <div class="p-8 text-center text-gray-500">
          No tasks found matching your filters.
        </div>
      {/if}
      {#each $filteredTasks as task}
        <div
          class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group"
        >
          <div class="flex items-center gap-4">
            <button
              class="text-gray-300 hover:text-pink-600 transition-colors"
            >
              <CheckCircle2 size={24} />
            </button>
            <div class="flex flex-col">
              <span class="font-medium text-gray-900">{task.title}</span>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md border",
                    getStatusColor(task.status),
                  )}
                >
                  {task.status}
                </span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-1.5 text-sm text-gray-500">
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

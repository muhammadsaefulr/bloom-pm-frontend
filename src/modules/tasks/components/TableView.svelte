<script lang="ts">
  import { MoreHorizontal } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  import { filteredTasks } from "../stores/taskStore.js";

  function getStatusStyle(status: string) {
    if (status === "To do") return "text-orange-600 bg-orange-50";
    if (status === "Doing") return "text-blue-600 bg-blue-50";
    if (status === "Done") return "text-pink-600 bg-pink-50";
    return "text-gray-600 bg-gray-50";
  }
</script>

<div class="h-full w-full p-6 bg-white overflow-y-auto overflow-x-auto">
  <div
    class="min-w-[800px] w-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
  >
    <table class="w-full text-left text-sm text-gray-700">
      <thead
        class="bg-gray-50/50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold"
      >
        <tr>
          <th scope="col" class="px-6 py-4">Task Name</th>
          <th scope="col" class="px-6 py-4 w-32">Status</th>
          <th scope="col" class="px-6 py-4 w-32">Due Date</th>
          <th scope="col" class="px-6 py-4 w-32">Priority</th>
          <th scope="col" class="px-6 py-4 w-12 text-center">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#if $filteredTasks.length === 0}
          <tr>
            <td colspan="5" class="px-6 py-8 text-center text-gray-500">
              No tasks found matching your filters.
            </td>
          </tr>
        {/if}
        {#each $filteredTasks as task}
          <tr class="hover:bg-gray-50/50 transition-colors">
            <td class="px-6 py-4 font-medium text-gray-900">{task.title}</td>
            <td class="px-6 py-4">
              <span
                class={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold",
                  getStatusStyle(task.status),
                )}
              >
                {task.status}
              </span>
            </td>
            <td class="px-6 py-4 text-gray-500">{task.dueDate}</td>
            <td class="px-6 py-4 text-gray-500">{task.priority}</td>
            <td class="px-6 py-4 text-center">
              <button
                class="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

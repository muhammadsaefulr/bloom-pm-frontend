<script lang="ts">
  import { MoreHorizontal } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  import { filteredTasks, selectTask, taskCategories, type TaskID } from "../stores/taskStore.js";

  const dispatch = createEventDispatcher<{ selectTask: TaskID }>();

  function getStatusStyle(status: string) {
    if (status === "To do") return "text-orange-600 bg-orange-50";
    if (status === "Doing") return "text-blue-600 bg-blue-50";
    if (status === "Done") return "text-pink-600 bg-pink-50";
    return "text-gray-600 bg-gray-50";
  }

  function getCategoryStyle(category: string) {
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

<div class="h-full w-full overflow-x-auto overflow-y-auto bg-gray-50/50 p-5">
  <div
    class="min-w-[900px] w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
  >
    <table class="w-full text-left text-sm text-gray-700">
      <thead
        class="bg-gray-50/50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold"
      >
        <tr>
          <th scope="col" class="px-6 py-4">Task Name</th>
          <th scope="col" class="px-6 py-4 w-36">Category</th>
          <th scope="col" class="px-6 py-4 w-32">Status</th>
          <th scope="col" class="px-6 py-4 w-32">Due Date</th>
          <th scope="col" class="px-6 py-4 w-32">Priority</th>
          <th scope="col" class="px-6 py-4 w-40">Owner</th>
          <th scope="col" class="px-6 py-4 w-12 text-center">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        {#if $filteredTasks.length === 0}
          <tr>
            <td colspan="7" class="px-6 py-8 text-center text-gray-500">
              No tasks found matching your filters.
            </td>
          </tr>
        {/if}
        {#each $filteredTasks as task}
          <tr
            class="cursor-pointer transition-colors hover:bg-gray-50/50"
            role="button"
            tabindex="0"
            on:click={() => openTask(task.id)}
            on:keydown={(event) => event.key === "Enter" && openTask(task.id)}
          >
            <td class="px-6 py-4 font-medium text-gray-900">{task.title}</td>
            <td class="px-6 py-4">
              <span
                class={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold",
                  getCategoryStyle(task.category),
                )}
              >
                {task.category}
              </span>
            </td>
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
            <td class="px-6 py-4 text-gray-500">{task.owner}</td>
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

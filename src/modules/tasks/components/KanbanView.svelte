<script lang="ts">
  import {
    MoreHorizontal,
    Plus,
    Calendar,
    Paperclip,
    MessageSquare,
    List,
  } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  import {
    createTask,
    labels,
    filteredTasks,
    selectTask,
    taskCategories,
    type TaskID,
    type TaskStatus,
  } from "../stores/taskStore.js";

  const dispatch = createEventDispatcher<{
    addLabel: void;
    selectTask: TaskID;
  }>();

  $: groupedTasks = {
    todo: $filteredTasks.filter((task) => task.status === "To do"),
    doing: $filteredTasks.filter((task) => task.status === "Doing"),
    done: $filteredTasks.filter((task) => task.status === "Done"),
  };

  function openTask(taskId: TaskID) {
    selectTask(taskId);
    dispatch("selectTask", taskId);
  }

  function getCategoryColor(category: string) {
    return (
      taskCategories.find((taskCategory) => taskCategory.name === category)?.color ??
      "text-gray-700 bg-gray-100"
    );
  }
</script>

<div class="flex h-full w-full gap-5 overflow-x-auto overflow-y-hidden bg-gray-50/50 p-5">
  {#each $labels as column}
    <section class="flex h-full w-[330px] shrink-0 flex-col rounded-xl border border-gray-100 bg-white">
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div class="flex items-center gap-2">
          <div
            class={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
              column.color,
            )}
          >
            <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
          </div>
          <h2 class="text-base font-bold text-gray-900">{column.name}</h2>
          <span class="ml-1 text-xs font-medium text-gray-400">
            {groupedTasks[column.id as keyof typeof groupedTasks]?.length || 0}
          </span>
        </div>
        <button
          class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          title="Add task in {column.name}"
          on:click={() => createTask(column.name as TaskStatus)}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div class="flex-1 space-y-3 overflow-y-auto p-3 pb-6">
        {#each groupedTasks[column.id as keyof typeof groupedTasks] ?? [] as task}
          <button
            type="button"
            class="group flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-pink-100 hover:shadow-md"
            on:click={() => openTask(task.id)}
          >
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-[15px] font-bold leading-tight text-gray-900 transition group-hover:text-pink-600">
                {task.title}
              </h3>
              <span class="-mr-1 -mt-1 rounded-md p-0.5 text-gray-300 group-hover:text-gray-500">
                <MoreHorizontal size={18} />
              </span>
            </div>

            <p class="line-clamp-2 pr-2 text-[13px] leading-snug text-gray-500">
              {task.description}
            </p>

            <div class="mt-1 flex flex-wrap gap-2">
              <span class={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", getCategoryColor(task.category))}>
                {task.category}
              </span>
            </div>

            {#if task.tags && task.tags.length > 0}
              <div class="mt-1 flex flex-wrap gap-2">
                {#each task.tags as tag}
                  <span class={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", tag.color)}>
                    {tag.name}
                  </span>
                {/each}
              </div>
            {/if}

            <div>
              <div class="mb-1 flex items-center justify-between text-[11px] font-medium text-gray-400">
                <span>{task.owner}</span>
                <span>{task.progress}%</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div class="h-full rounded-full bg-pink-500" style={`width: ${task.progress}%`}></div>
              </div>
            </div>

            <div class="h-px w-full bg-gray-50"></div>

            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                  <Calendar size={12} class="text-gray-400" />
                  {task.dueDate}
                </div>

                {#if task.users && task.users.length > 0}
                  <div class="flex -space-x-1.5 overflow-hidden pt-1">
                    {#each task.users.slice(0, 3) as user}
                      <img
                        class="inline-block h-6 w-6 rounded-full object-cover ring-2 ring-white"
                        src={user}
                        alt="Task assignee"
                      />
                    {/each}
                    {#if task.users.length > 3}
                      <div class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600 ring-2 ring-white">
                        +{task.users.length - 3}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>

              <div class="flex flex-col items-end gap-2 text-gray-400">
                {#if task.checklist}
                  <div class="flex items-center gap-1 text-[11px] font-medium">
                    <List size={12} />
                    {task.checklist}
                  </div>
                {/if}
                <div class="flex items-center gap-2.5">
                  {#if task.attachments > 0}
                    <div class="flex items-center gap-0.5 text-[11px] font-medium">
                      <Paperclip size={13} />
                      {task.attachments}
                    </div>
                  {/if}
                  {#if task.comments > 0}
                    <div class="flex items-center gap-0.5 text-[11px] font-medium">
                      <MessageSquare size={13} />
                      {task.comments}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/each}

  <div class="w-[330px] shrink-0 pr-6">
    <button
      class="group flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 font-semibold text-gray-500 transition-all hover:border-pink-400 hover:bg-pink-50/50 hover:text-pink-600"
      on:click={() => dispatch("addLabel")}
    >
      <Plus size={20} class="transition-transform group-hover:scale-110" />
      Add Task Label
    </button>
  </div>
</div>

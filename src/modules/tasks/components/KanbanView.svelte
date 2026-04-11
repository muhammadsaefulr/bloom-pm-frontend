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

  const dispatch = createEventDispatcher();

  import { labels, filteredTasks } from "../stores/taskStore.js";

  $: groupedTasks = {
    todo: $filteredTasks.filter((t) => t.status === "To do"),
    doing: $filteredTasks.filter((t) => t.status === "Doing"),
    done: $filteredTasks.filter((t) => t.status === "Done"),
  };
</script>

<div
  class="h-full w-full overflow-x-auto overflow-y-hidden p-6 bg-white flex gap-6"
>
  {#each $labels as column}
    <div class="w-[340px] shrink-0 flex flex-col h-full pl-1">
      <!-- Column Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <!-- Small colored dot corresponding to the label color -->
          <div
            class={cn(
              "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
              column.color,
            )}
          >
            <!-- Icon/dot if needed -->
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <h2 class="text-base font-bold text-gray-900">{column.name}</h2>
          <span class="text-xs font-medium text-gray-400 ml-1"
            >{groupedTasks[column.id as keyof typeof groupedTasks]?.length || 0} Tasks</span
          >
        </div>
        <button
          class="text-gray-400 hover:text-gray-700 transition-colors p-1"
          title="Add Task in {column.name}"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      <!-- Task Cards List (Vertical Scroll inside column) -->
      <div class="flex-1 overflow-y-auto pb-6 scrollbar-hide space-y-4">
        {#if groupedTasks[column.id as keyof typeof groupedTasks]}
          {#each groupedTasks[column.id as keyof typeof groupedTasks] as task}
            <div
              class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3 group"
            >
              <!-- Card Header -->
              <div class="flex items-start justify-between">
                <h3
                  class="font-bold text-gray-900 text-[15px] leading-tight group-hover:text-pink-600 transition-colors"
                >
                  {task.title}
                </h3>
                <button
                  class="text-gray-300 hover:text-gray-500 p-0.5 -mt-1 -mr-1"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <!-- Description -->
              <p
                class="text-gray-500 text-[13px] leading-snug line-clamp-2 pr-2"
              >
                {task.description}
              </p>

              <!-- Tags -->
              {#if task.tags && task.tags.length > 0}
                <div class="flex flex-wrap gap-2 mt-1">
                  {#each task.tags as tag}
                    <span
                      class={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-md",
                        tag.color,
                      )}>• {tag.name}</span
                    >
                  {/each}
                </div>
              {/if}

              <div class="h-px bg-gray-50 w-full my-1"></div>

              <!-- Footer (Date, Users, Icons) -->
              <div class="flex items-center justify-between mt-1">
                <!-- Due Date & Users -->
                <div class="flex flex-col gap-2">
                  <div
                    class="flex items-center gap-1.5 text-gray-500 text-[11px] font-medium"
                  >
                    <Calendar size={12} class="text-gray-400" />
                    Due Date {task.dueDate}
                  </div>

                  <!-- Assignees -->
                  {#if task.users && task.users.length > 0}
                    <div class="flex -space-x-1.5 overflow-hidden pt-1">
                      {#each task.users.slice(0, 3) as user}
                        <img
                          class="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                          src={user}
                          alt="User Avatar"
                        />
                      {/each}
                      {#if task.users.length > 3}
                        <div
                          class="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600 ring-2 ring-white"
                        >
                          +{task.users.length - 3}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>

                <!-- Icons right bottom -->
                <div
                  class="flex flex-col items-end justify-between h-full gap-2"
                >
                  <div class="text-[11px] font-medium text-gray-400 mt-1">
                    {#if task.checklist}
                      <div class="flex items-center gap-1 justify-end">
                        <List size={12} />
                        {task.checklist}
                      </div>
                    {/if}
                  </div>
                  <div
                    class="flex items-center gap-2.5 text-gray-400 mt-auto pt-1"
                  >
                    {#if task.attachments > 0}
                      <div
                        class="flex items-center gap-0.5 text-[11px] font-medium hover:text-gray-700"
                      >
                        <Paperclip size={13} />
                        {task.attachments}
                      </div>
                    {/if}
                    {#if task.comments > 0}
                      <div
                        class="flex items-center gap-0.5 text-[11px] font-medium hover:text-gray-700"
                      >
                        <MessageSquare size={13} />
                        {task.comments}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/each}

  <!-- Add New Label Column Button -->
  <div class="w-[340px] shrink-0 pr-6">
    <button
      class="w-full h-14 rounded-2xl border-2 border-dashed border-gray-300 hover:border-pink-400 hover:bg-pink-50/50 flex items-center justify-center gap-2 text-gray-500 hover:text-pink-600 font-semibold transition-all group"
      on:click={() => dispatch("addLabel")}
    >
      <Plus size={20} class="group-hover:scale-110 transition-transform" /> Add Task
      Label
    </button>
  </div>
</div>

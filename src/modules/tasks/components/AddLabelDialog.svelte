<script lang="ts">
  import { X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";
  import { fade, scale } from "svelte/transition";

  const dispatch = createEventDispatcher();

  let labelName = "";
  let selectedColor = "bg-orange-500";

  const colors = [
    "bg-orange-500",
    "bg-red-500",
    "bg-amber-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-gray-500",
  ];

  function close() {
    dispatch("close");
  }

  function save() {
    // Dispatch save event with label data
    // In real app, this would mutate state/call API
    close();
  }
</script>

<!-- Backdrop -->
<div
  class="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center cursor-default border-none pointer-events-auto"
  role="button"
  tabindex="0"
  transition:fade={{ duration: 150 }}
  on:click={close}
  on:keydown={(e) => e.key === 'Escape' && close()}
>
  <!-- Dialog content -->
  <div
    class="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden cursor-auto"
    role="presentation"
    transition:scale={{ duration: 150, start: 0.95 }}
    on:click|stopPropagation
  >
    <div
      class="px-5 py-4 border-b border-gray-100 flex items-center justify-between"
    >
      <h2 class="text-lg font-bold text-gray-900 tracking-tight">
        Add Task Label
      </h2>
      <button
        class="text-gray-400 hover:text-gray-700 transition-colors p-1"
        on:click={close}
      >
        <X size={20} />
      </button>
    </div>

    <div class="px-5 py-5 space-y-5">
      <!-- Label Name -->
      <div class="space-y-1.5">
        <label for="labelName" class="block text-sm font-semibold text-gray-700"
          >Label Name</label
        >
        <input
          id="labelName"
          type="text"
          bind:value={labelName}
          placeholder="e.g. Needs Review"
          class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all text-sm"
          autofocus
        />
      </div>

      <!-- Color Selection -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700"
          >Label Color</label
        >
        <div class="flex flex-wrap gap-3">
          {#each colors as color}
            <button
              class={cn(
                "w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 flex items-center justify-center ring-offset-2",
                color,
                selectedColor === color
                  ? "ring-2 ring-pink-500 scale-110"
                  : "",
              )}
              on:click={() => (selectedColor = color)}
            >
              {#if selectedColor === color}
                <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div
      class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3"
    >
      <button
        class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        on:click={close}
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-xl hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        on:click={save}
        disabled={!labelName.trim()}
      >
        Save Label
      </button>
    </div>
  </div>
</div>

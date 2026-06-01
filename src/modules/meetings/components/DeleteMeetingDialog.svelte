<script lang="ts">
  import { AlertTriangle, X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";
  import type { Meeting } from "../types/meeting.js";

  export let meeting: Meeting;

  const dispatch = createEventDispatcher<{
    close: void;
    confirm: string;
  }>();

  function close() {
    dispatch("close");
  }

  function confirmDelete() {
    dispatch("confirm", meeting.id);
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
  role="button"
  tabindex="0"
  transition:fade={{ duration: 150 }}
  on:click={close}
  on:keydown={(event) => event.key === "Escape" && close()}
>
  <div
    class="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
    role="presentation"
    transition:scale={{ duration: 150, start: 0.96 }}
    on:click|stopPropagation
  >
    <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <h2 class="text-lg font-bold text-gray-900">Delete Meeting</h2>
      <button class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700" on:click={close}>
        <X class="h-5 w-5" />
      </button>
    </div>

    <div class="px-5 py-5">
      <div class="flex gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm leading-6 text-gray-600">
            Are you sure you want to delete <span class="font-semibold text-gray-900">{meeting.title}</span>? This meeting will be removed from the list.
          </p>
          <div class="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {meeting.time} - {meeting.team}
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
      <button
        class="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        on:click={close}
      >
        Cancel
      </button>
      <button
        class="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
        on:click={confirmDelete}
      >
        Delete Meeting
      </button>
    </div>
  </div>
</div>

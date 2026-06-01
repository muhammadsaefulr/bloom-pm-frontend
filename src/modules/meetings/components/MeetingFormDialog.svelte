<script lang="ts">
  import { X } from "@lucide/svelte";
  import { createEventDispatcher } from "svelte";
  import { fade, scale } from "svelte/transition";
  import type {
    Meeting,
    MeetingFormValue,
    MeetingPlatform,
    MeetingStatus,
  } from "../types/meeting.js";

  export let mode: "create" | "edit" = "create";
  export let meeting: Meeting | null = null;

  const dispatch = createEventDispatcher<{
    close: void;
    save: MeetingFormValue;
  }>();

  const platforms: MeetingPlatform[] = ["Zoom", "Meet", "Teams"];
  const statuses: MeetingStatus[] = ["Live", "Upcoming", "Completed"];

  let title = meeting?.title ?? "";
  let team = meeting?.team ?? "";
  let time = meeting?.time ?? "";
  let duration = meeting?.duration ?? "";
  let platform: MeetingPlatform = meeting?.platform ?? "Zoom";
  let status: MeetingStatus = meeting?.status ?? "Upcoming";
  let participants = meeting?.participants.join(", ") ?? "";
  let agenda = meeting?.agenda ?? "";
  let actionItems = meeting?.actionItems ?? 0;
  let minutesReady = meeting?.minutesReady ?? false;

  $: canSave = title.trim() && team.trim() && time.trim() && duration.trim();

  function close() {
    dispatch("close");
  }

  function save() {
    if (!canSave) return;

    dispatch("save", {
      title: title.trim(),
      team: team.trim(),
      time: time.trim(),
      duration: duration.trim(),
      platform,
      status,
      participants: participants
        .split(",")
        .map((participant: string) => participant.trim().toUpperCase())
        .filter(Boolean),
      agenda: agenda.trim(),
      actionItems: Number(actionItems) || 0,
      minutesReady,
    });
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
    class="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
    role="presentation"
    transition:scale={{ duration: 150, start: 0.96 }}
    on:click|stopPropagation
  >
    <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <div>
        <h2 class="text-lg font-bold text-gray-900">
          {mode === "create" ? "Add Meeting" : "Edit Meeting"}
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          {mode === "create" ? "Create a new agenda and schedule." : "Update meeting details and follow-up status."}
        </p>
      </div>
      <button class="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700" on:click={close}>
        <X class="h-5 w-5" />
      </button>
    </div>

    <div class="max-h-[calc(90vh-140px)] overflow-y-auto px-5 py-5">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5 sm:col-span-2">
          <label for="meeting-title" class="block text-sm font-semibold text-gray-700">Meeting Title</label>
          <input
            id="meeting-title"
            type="text"
            bind:value={title}
            placeholder="e.g. Product Sprint Planning"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div class="space-y-1.5">
          <label for="meeting-team" class="block text-sm font-semibold text-gray-700">Team</label>
          <input
            id="meeting-team"
            type="text"
            bind:value={team}
            placeholder="Product"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div class="space-y-1.5">
          <label for="meeting-time" class="block text-sm font-semibold text-gray-700">Schedule</label>
          <input
            id="meeting-time"
            type="text"
            bind:value={time}
            placeholder="Today, 10:00 AM"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div class="space-y-1.5">
          <label for="meeting-duration" class="block text-sm font-semibold text-gray-700">Duration</label>
          <input
            id="meeting-duration"
            type="text"
            bind:value={duration}
            placeholder="45 min"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div class="space-y-1.5">
          <label for="meeting-platform" class="block text-sm font-semibold text-gray-700">Platform</label>
          <select
            id="meeting-platform"
            bind:value={platform}
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          >
            {#each platforms as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <label for="meeting-status" class="block text-sm font-semibold text-gray-700">Status</label>
          <select
            id="meeting-status"
            bind:value={status}
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          >
            {#each statuses as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-1.5">
          <label for="meeting-action-items" class="block text-sm font-semibold text-gray-700">Action Items</label>
          <input
            id="meeting-action-items"
            type="number"
            min="0"
            bind:value={actionItems}
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div class="space-y-1.5 sm:col-span-2">
          <label for="meeting-participants" class="block text-sm font-semibold text-gray-700">Participants</label>
          <input
            id="meeting-participants"
            type="text"
            bind:value={participants}
            placeholder="AN, RW, MK"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div class="space-y-1.5 sm:col-span-2">
          <label for="meeting-agenda" class="block text-sm font-semibold text-gray-700">Agenda</label>
          <textarea
            id="meeting-agenda"
            rows="4"
            bind:value={agenda}
            placeholder="Write the agenda or meeting objective..."
            class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-200"
          ></textarea>
        </div>

        <label class="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 sm:col-span-2">
          <input type="checkbox" bind:checked={minutesReady} class="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
          Minutes are ready to share
        </label>
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
        class="rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canSave}
        on:click={save}
      >
        {mode === "create" ? "Save Meeting" : "Save Changes"}
      </button>
    </div>
  </div>
</div>

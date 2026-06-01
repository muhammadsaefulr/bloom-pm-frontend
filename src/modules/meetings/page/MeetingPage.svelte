<script lang="ts">
  import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    ClipboardList,
    Edit2,
    FileText,
    ListChecks,
    Mic2,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    Users,
    Video,
  } from "@lucide/svelte";
  import DashboardPageShell from "$lib/components/layout/DashboardPageShell.svelte";
  import DeleteMeetingDialog from "../components/DeleteMeetingDialog.svelte";
  import MeetingFormDialog from "../components/MeetingFormDialog.svelte";
  import MeetingLayout from "../components/MeetingLayout.svelte";
  import type { Meeting, MeetingFormValue, MeetingStatus } from "../types/meeting.js";

  let meetings: Meeting[] = [
    {
      id: "mtg-1",
      title: "Product Sprint Planning",
      team: "Product",
      time: "Today, 10:00 AM",
      duration: "45 min",
      platform: "Zoom",
      status: "Live",
      participants: ["AN", "RW", "MK", "JS"],
      agenda: "Finalize sprint scope, assign owners for onboarding analytics, and confirm release risks.",
      actionItems: 6,
      minutesReady: false,
    },
    {
      id: "mtg-2",
      title: "Design Review",
      team: "Design",
      time: "Today, 02:30 PM",
      duration: "30 min",
      platform: "Meet",
      status: "Upcoming",
      participants: ["LS", "HN", "AD"],
      agenda: "Review dashboard empty states and polish handoff notes for engineering.",
      actionItems: 3,
      minutesReady: false,
    },
    {
      id: "mtg-3",
      title: "Customer Feedback Sync",
      team: "Growth",
      time: "Yesterday, 04:00 PM",
      duration: "55 min",
      platform: "Teams",
      status: "Completed",
      participants: ["CP", "DV", "ER", "FT", "GM"],
      agenda: "Capture customer requests for timeline exports, faster task filtering, and clearer follow-up ownership.",
      actionItems: 8,
      minutesReady: true,
    },
  ];

  const timeline = [
    { time: "09:30", title: "Daily Standup", type: "Quick sync" },
    { time: "10:00", title: "Product Sprint Planning", type: "In progress" },
    { time: "14:30", title: "Design Review", type: "Upcoming" },
    { time: "16:00", title: "Engineering Triage", type: "Upcoming" },
  ];

  const prepChecklist = [
    "Confirm agenda and owners",
    "Attach related project docs",
    "Review open action items",
  ];

  const statusClass: Record<MeetingStatus, string> = {
    Live: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Upcoming: "border-blue-200 bg-blue-50 text-blue-700",
    Completed: "border-gray-200 bg-gray-50 text-gray-600",
  };

  const participantColors = [
    "bg-pink-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-amber-500",
    "bg-indigo-600",
  ];

  let showMeetingFormDialog = false;
  let showDeleteMeetingDialog = false;
  let selectedMeeting: Meeting | null = null;
  let formMode: "create" | "edit" = "create";
  let activeStatus: "All" | MeetingStatus = "All";
  let searchQuery = "";

  $: todayMeetingCount = meetings.filter((meeting) => meeting.time.toLowerCase().includes("today")).length;
  $: openActionItemCount = meetings.reduce((total, meeting) => total + meeting.actionItems, 0);
  $: readyMinutesCount = meetings.filter((meeting) => meeting.minutesReady).length;
  $: nextMeeting = meetings.find((meeting) => meeting.status === "Live") ?? meetings.find((meeting) => meeting.status === "Upcoming") ?? meetings[0];
  $: filteredMeetings = meetings.filter((meeting) => {
    const matchesStatus = activeStatus === "All" || meeting.status === activeStatus;
    const keyword = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      `${meeting.title} ${meeting.team} ${meeting.agenda} ${meeting.platform}`.toLowerCase().includes(keyword);

    return matchesStatus && matchesSearch;
  });

  function openCreateDialog() {
    selectedMeeting = null;
    formMode = "create";
    showMeetingFormDialog = true;
  }

  function openEditDialog(meeting: Meeting) {
    selectedMeeting = meeting;
    formMode = "edit";
    showMeetingFormDialog = true;
  }

  function openDeleteDialog(meeting: Meeting) {
    selectedMeeting = meeting;
    showDeleteMeetingDialog = true;
  }

  function closeMeetingFormDialog() {
    showMeetingFormDialog = false;
    selectedMeeting = null;
  }

  function closeDeleteMeetingDialog() {
    showDeleteMeetingDialog = false;
    selectedMeeting = null;
  }

  function saveMeeting(event: CustomEvent<MeetingFormValue>) {
    if (formMode === "edit" && selectedMeeting) {
      meetings = meetings.map((meeting) =>
        meeting.id === selectedMeeting?.id ? { ...meeting, ...event.detail } : meeting,
      );
    } else {
      meetings = [
        {
          id: `mtg-${Date.now()}`,
          ...event.detail,
        },
        ...meetings,
      ];
    }

    closeMeetingFormDialog();
  }

  function deleteMeeting(event: CustomEvent<string>) {
    meetings = meetings.filter((meeting) => meeting.id !== event.detail);
    closeDeleteMeetingDialog();
  }
</script>

<svelte:head>
  <title>My Meetings | Bloom PM</title>
</svelte:head>

<MeetingLayout>
  <DashboardPageShell bodyClass="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fb] px-5 py-5 pb-10 lg:px-7">
    <div slot="header" class="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900">My Meetings</h1>
          <p class="mt-1 text-sm text-gray-500">Agenda, minutes, and follow-ups in one calm workspace.</p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search meetings"
              bind:value={searchQuery}
              class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-100 sm:w-72"
            />
          </div>
          <button
            class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 text-sm font-semibold text-white shadow-sm shadow-pink-200 transition hover:bg-pink-700"
            on:click={openCreateDialog}
          >
            <Plus class="h-4 w-4" />
            New Meeting
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section class="min-w-0 space-y-5">
        {#if nextMeeting}
          <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div class="p-5 md:p-6">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold {statusClass[nextMeeting.status]}">
                    <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {nextMeeting.status}
                  </span>
                  <span class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    <Video class="h-3.5 w-3.5" />
                    {nextMeeting.platform}
                  </span>
                  <span class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                    <Clock3 class="h-3.5 w-3.5" />
                    {nextMeeting.duration}
                  </span>
                </div>

                <h2 class="mt-5 max-w-2xl text-3xl font-bold leading-tight text-gray-900">{nextMeeting.title}</h2>
                <p class="mt-2 text-sm font-medium text-gray-500">{nextMeeting.time} - {nextMeeting.team}</p>
                <p class="mt-4 max-w-3xl text-sm leading-6 text-gray-600">{nextMeeting.agenda}</p>

                <div class="mt-5 flex flex-wrap items-center gap-4">
                  <div class="flex -space-x-2">
                    {#each nextMeeting.participants as participant, index}
                      <div class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white {participantColors[index % participantColors.length]}">
                        {participant}
                      </div>
                    {/each}
                  </div>
                  <span class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                    <Users class="h-4 w-4" />
                    {nextMeeting.participants.length} people
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                    <ListChecks class="h-4 w-4" />
                    {nextMeeting.actionItems} follow-ups
                  </span>
                </div>
              </div>

              <div class="border-t border-pink-100 bg-pink-50 p-5 text-gray-900 lg:border-l lg:border-t-0">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-pink-500">Focus</p>
                    <p class="mt-1 text-lg font-bold">Meeting flow</p>
                  </div>
                  <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-pink-600 shadow-sm">
                    <Video class="h-5 w-5" />
                  </div>
                </div>

                <div class="mt-6 grid grid-cols-3 gap-2">
                  <div class="rounded-lg border border-pink-100 bg-white p-3">
                    <p class="text-xl font-bold">{todayMeetingCount}</p>
                    <p class="mt-1 text-xs text-gray-500">Today</p>
                  </div>
                  <div class="rounded-lg border border-pink-100 bg-white p-3">
                    <p class="text-xl font-bold">{openActionItemCount}</p>
                    <p class="mt-1 text-xs text-gray-500">Actions</p>
                  </div>
                  <div class="rounded-lg border border-pink-100 bg-white p-3">
                    <p class="text-xl font-bold">{readyMinutesCount}</p>
                    <p class="mt-1 text-xs text-gray-500">Minutes</p>
                  </div>
                </div>

                <div class="mt-6 flex gap-2">
                  <button
                    class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-pink-600 text-sm font-semibold text-white shadow-sm shadow-pink-200 transition hover:bg-pink-700"
                    on:click={() => openEditDialog(nextMeeting)}
                  >
                    <Edit2 class="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-pink-100 bg-white text-pink-600 transition hover:bg-pink-100"
                    aria-label="Meeting options"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-500">Today</span>
              <CalendarDays class="h-5 w-5 text-teal-600" />
            </div>
            <div class="mt-3 text-2xl font-bold text-gray-900">{todayMeetingCount}</div>
          </div>
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-500">Follow-ups</span>
              <CheckCircle2 class="h-5 w-5 text-pink-600" />
            </div>
            <div class="mt-3 text-2xl font-bold text-gray-900">{openActionItemCount}</div>
          </div>
          <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-500">Minutes</span>
              <ClipboardList class="h-5 w-5 text-amber-500" />
            </div>
            <div class="mt-3 text-2xl font-bold text-gray-900">{readyMinutesCount}</div>
          </div>
        </div>

        <section class="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div class="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-base font-bold text-gray-900">Meeting Desk</h2>
              <p class="mt-1 text-sm text-gray-500">{filteredMeetings.length} sessions</p>
            </div>

            <div class="flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1">
              {#each ["All", "Live", "Upcoming", "Completed"] as status}
                <button
                  class={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${activeStatus === status ? "bg-white text-pink-700 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                  on:click={() => (activeStatus = status as typeof activeStatus)}
                >
                  {status}
                </button>
              {/each}
            </div>
          </div>

          <div class="divide-y divide-gray-100">
            {#each filteredMeetings as meeting, meetingIndex}
              <article class="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_132px]">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                    <span class="inline-flex items-center rounded-md border px-2 py-1 font-bold {statusClass[meeting.status]}">
                      {meeting.status}
                    </span>
                    <span class="inline-flex items-center gap-1 rounded-md bg-pink-50 px-2 py-1 font-semibold text-pink-700">
                      <CalendarDays class="h-3.5 w-3.5" />
                      {meeting.time}
                    </span>
                    <span class="rounded-md bg-gray-100 px-2 py-1 font-semibold uppercase tracking-wide text-gray-500">
                      {meeting.team}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Video class="h-3.5 w-3.5" />
                      {meeting.platform}
                    </span>
                    <span class="inline-flex items-center gap-1">
                      <Clock3 class="h-3.5 w-3.5" />
                      {meeting.duration}
                    </span>
                    {#if meeting.minutesReady}
                      <span class="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-amber-700">
                        <FileText class="h-3.5 w-3.5" />
                        Minutes ready
                      </span>
                    {/if}
                  </div>

                  <h3 class="mt-2 truncate text-lg font-bold text-gray-900">{meeting.title}</h3>
                  <p class="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{meeting.agenda}</p>

                  <div class="mt-4 flex flex-wrap items-center gap-3">
                    <div class="flex -space-x-2">
                      {#each meeting.participants as participant, index}
                        <div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white {participantColors[(index + meetingIndex) % participantColors.length]}">
                          {participant}
                        </div>
                      {/each}
                    </div>
                    <span class="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <Users class="h-4 w-4" />
                      {meeting.participants.length}
                    </span>
                    <span class="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <ListChecks class="h-4 w-4" />
                      {meeting.actionItems}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2 lg:justify-end">
                  <button
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-pink-50 hover:text-pink-700"
                    aria-label={`Edit ${meeting.title}`}
                    on:click={() => openEditDialog(meeting)}
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                  <button
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Open minutes for ${meeting.title}`}
                    disabled={!meeting.minutesReady}
                  >
                    <FileText class="h-4 w-4" />
                  </button>
                  <button
                    class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50"
                    aria-label={`Delete ${meeting.title}`}
                    on:click={() => openDeleteDialog(meeting)}
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </article>
            {/each}

            {#if filteredMeetings.length === 0}
              <div class="px-5 py-12 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <CalendarDays class="h-5 w-5" />
                </div>
                <h3 class="mt-4 text-base font-bold text-gray-900">No meetings found</h3>
                <p class="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
              </div>
            {/if}
          </div>
        </section>
      </section>

      <aside class="space-y-5">
        <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900">Today Timeline</h2>
            <CalendarDays class="h-5 w-5 text-gray-400" />
          </div>
          <div class="mt-5 space-y-1">
            {#each timeline as item}
              <div class="grid grid-cols-[54px_minmax(0,1fr)] gap-3 py-2">
                <div class="text-xs font-bold text-gray-400">{item.time}</div>
                <div class="relative border-l border-gray-200 pl-4">
                  <span class="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-pink-500"></span>
                  <div class="text-sm font-bold text-gray-900">{item.title}</div>
                  <div class="mt-1 text-xs text-gray-500">{item.type}</div>
                </div>
              </div>
            {/each}
          </div>
        </section>

        <section class="rounded-lg border border-teal-100 bg-teal-50 p-5 shadow-sm">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm">
            <ListChecks class="h-5 w-5" />
          </div>
          <h2 class="mt-4 text-base font-bold text-gray-900">Prep Stack</h2>
          <div class="mt-4 space-y-3">
            {#each prepChecklist as item}
              <label class="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <span>{item}</span>
              </label>
            {/each}
          </div>
          <button class="mt-5 h-10 w-full rounded-lg bg-teal-600 text-sm font-semibold text-white shadow-sm shadow-teal-100 transition hover:bg-teal-700">
            Prepare Meeting
          </button>
        </section>
      </aside>
    </div>
  </DashboardPageShell>
</MeetingLayout>

{#if showMeetingFormDialog}
  <MeetingFormDialog
    mode={formMode}
    meeting={selectedMeeting}
    on:close={closeMeetingFormDialog}
    on:save={saveMeeting}
  />
{/if}

{#if showDeleteMeetingDialog && selectedMeeting}
  <DeleteMeetingDialog
    meeting={selectedMeeting}
    on:close={closeDeleteMeetingDialog}
    on:confirm={deleteMeeting}
  />
{/if}

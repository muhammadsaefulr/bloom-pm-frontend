<script lang="ts">
  import KanbanView from "./KanbanView.svelte";
  import ListView from "./ListView.svelte";
  import TableView from "./TableView.svelte";
  import AddLabelDialog from "./AddLabelDialog.svelte";
  import TaskDetailEditor from "./TaskDetailEditor.svelte";
  import TaskToast from "./TaskToast.svelte";
  import DashboardPageShell from "$lib/components/layout/DashboardPageShell.svelte";
  import * as Resizable from "$lib/components/ui/resizable/index.js";
  import { onMount } from "svelte";
  import { selectedTeam } from "$modules/auth/stores/authStore.js";
  import { getTeamMembersApi } from "$modules/teams/api/teamsApi.js";
  import type { TeamMember } from "$modules/teams/types/index.js";
  import {
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    Plus,
    Trello,
    List,
    TableProperties,
    PanelRightOpen,
  } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";
  import {
    filterQuery,
    activeLabelFilter,
    activeSort,
    createTask,
    loadTasks,
    selectedTaskDetail,
    selectedTaskDetailLoading,
    selectTask,
  } from "../stores/taskStore.js";
  import { showTaskToast } from "../stores/taskToastStore.js";

  let activeTab = "kanban";
  let showAddLabelDialog = false;
  let showDetailPanel = true;
  let teamMembers: TeamMember[] = [];

  const detailPanelSize = 34;
  $: taskListSize = 100 - detailPanelSize;

  const tabs = [
    { id: "kanban", label: "Board", icon: Trello },
    { id: "list", label: "List", icon: List },
    { id: "table", label: "Grid", icon: TableProperties },
  ];

  const quickFilters = [
    "All Tasks",
    "To do",
    "Doing",
    "Done",
  ];

  function toggleSort() {
    $activeSort = $activeSort === "title" ? "dueDate" : "title";
  }

  function handleCreateTask() {
    createTask();
    showDetailPanel = true;
  }

  function openTaskDetail(event?: CustomEvent<string | number>) {
    if (event?.detail && typeof event.detail === "string") {
      selectTask(event.detail);
    }
    showDetailPanel = true;
  }

  function closeTaskDetail() {
    showDetailPanel = false;
  }

  async function loadTenantMembers() {
    const tenantId = $selectedTeam?.tenant_id || $selectedTeam?.id;
    if (!tenantId) {
      teamMembers = [];
      return;
    }

    try {
      teamMembers = await getTeamMembersApi(tenantId, { skipGlobalLoading: true });
    } catch (error) {
      console.error("Failed to load team members", error);
      showTaskToast("Failed to load team members.", "error");
      teamMembers = [];
    }
  }

  $: if ($selectedTeam) {
    loadTenantMembers();
  }

  onMount(() => {
    loadTasks().catch((error) => {
      console.error("Failed to load tasks", error);
    });
    loadTenantMembers();
  });
</script>

<DashboardPageShell bodyClass="relative min-h-0 flex-1 bg-white">
    <div slot="header" class="shrink-0 border-b border-gray-100 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-gray-900">Tasks</h1>
          <p class="mt-1 text-sm text-gray-500">Plan work, track ownership, and keep task notes in one place.</p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            on:click={() => (showDetailPanel ? closeTaskDetail() : (showDetailPanel = true))}
          >
            <PanelRightOpen size={16} class="text-gray-400" />
            Details
          </button>
          <button
            class="flex h-10 items-center gap-1.5 rounded-lg bg-pink-600 px-4 text-sm font-medium text-white shadow-sm shadow-pink-200 transition hover:bg-pink-700"
            on:click={handleCreateTask}
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-3 px-6 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex min-w-0 flex-wrap items-center gap-3">
          <div class="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50/70 p-1">
            {#each tabs as tab}
              <button
                class={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "border border-gray-200/60 bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:bg-gray-100/50 hover:text-gray-700",
                )}
                on:click={() => (activeTab = tab.id)}
              >
                <svelte:component
                  this={tab.icon}
                  size={16}
                  class={activeTab === tab.id ? "text-pink-600" : "text-gray-400"}
                />
                {tab.label}
              </button>
            {/each}
          </div>

          <div class="relative w-full max-w-full sm:w-72">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              bind:value={$filterQuery}
              placeholder="Search tasks"
              class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm transition-all focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1 overflow-x-auto">
            {#each quickFilters as filter}
              <button
                class={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  $activeLabelFilter === filter
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                )}
                on:click={() => ($activeLabelFilter = filter)}
              >
                {filter}
              </button>
            {/each}
          </div>

          <button
            class="flex items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            on:click={toggleSort}
          >
            <ArrowUpDown
              size={14}
              class={$activeSort !== "none" ? "text-pink-600" : "text-gray-400"}
            /> Sort
          </button>
          <button
            class="flex items-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <SlidersHorizontal size={14} class="text-gray-400" /> Filter
          </button>
        </div>
      </div>
    </div>

      {#if showDetailPanel}
        <Resizable.PaneGroup direction="horizontal" class="hidden min-h-0 xl:flex">
          <Resizable.Pane defaultSize={taskListSize} minSize={38}>
            <div class="h-full min-w-0 overflow-hidden">
              {#if activeTab === "kanban"}
                <KanbanView
                  on:addLabel={() => (showAddLabelDialog = true)}
                  on:selectTask={openTaskDetail}
                />
              {:else if activeTab === "list"}
                <ListView on:selectTask={openTaskDetail} />
              {:else if activeTab === "table"}
                <TableView on:selectTask={openTaskDetail} />
              {/if}
            </div>
          </Resizable.Pane>
          <Resizable.Handle withHandle />
          <Resizable.Pane defaultSize={detailPanelSize} minSize={28} maxSize={58}>
            {#if $selectedTaskDetailLoading}
              <div class="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
            {:else}
              <TaskDetailEditor
                task={$selectedTaskDetail}
                teamMembers={teamMembers}
                on:close={closeTaskDetail}
              />
            {/if}
          </Resizable.Pane>
        </Resizable.PaneGroup>
      {/if}

      <div class={cn("h-full min-w-0 overflow-hidden", showDetailPanel ? "xl:hidden" : "")}>
        {#if activeTab === "kanban"}
          <KanbanView
            on:addLabel={() => (showAddLabelDialog = true)}
            on:selectTask={openTaskDetail}
          />
        {:else if activeTab === "list"}
          <ListView on:selectTask={openTaskDetail} />
        {:else if activeTab === "table"}
          <TableView on:selectTask={openTaskDetail} />
        {/if}
      </div>

      {#if showDetailPanel}
        <div class="fixed inset-0 z-40 bg-gray-900/30 xl:hidden" role="presentation">
        <div
          class={cn(
            "absolute inset-y-0 right-0 bg-white shadow-xl",
            "w-full max-w-md",
          )}
        >
          {#if $selectedTaskDetailLoading}
            <div class="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
          {:else}
            <TaskDetailEditor
              task={$selectedTaskDetail}
              teamMembers={teamMembers}
              on:close={closeTaskDetail}
            />
          {/if}
        </div>
        </div>
      {/if}
</DashboardPageShell>

<TaskToast />

{#if showAddLabelDialog}
  <AddLabelDialog on:close={() => (showAddLabelDialog = false)} />
{/if}

<script lang="ts">
  import DashboardLayout from "$lib/components/layout/DashboardLayout.svelte";
  import KanbanView from "../components/KanbanView.svelte";
  import ListView from "../components/ListView.svelte";
  import TableView from "../components/TableView.svelte";
  import AddLabelDialog from "../components/AddLabelDialog.svelte";
  import {
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    Plus,
    Download,
    Trello,
    List,
    TableProperties,
  } from "@lucide/svelte";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  import {
    filterQuery,
    activeLabelFilter,
    activeSort,
  } from "../stores/taskStore.js";

  let activeTab = "kanban";
  let showAddLabelDialog = false;

  const tabs = [
    { id: "kanban", label: "Kanban", icon: Trello },
    { id: "list", label: "List", icon: List },
    { id: "table", label: "Table", icon: TableProperties },
  ];

  function toggleSort() {
    $activeSort = $activeSort === "title" ? "dueDate" : "title";
  }
</script>

<DashboardLayout>
  <div
    class="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100/50"
  >
    <!-- Top Header & Tabs -->
    <div
      class="px-6 py-5 bg-white border-b border-gray-100 flex flex-col gap-4 shrink-0 z-10"
    >
      <!-- Top Row -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-6">
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Tasks</h1>

          <!-- Tabs -->
          <div
            class="flex items-center gap-1 bg-gray-50/70 p-1 rounded-lg border border-gray-100/50"
          >
            {#each tabs as tab}
              <button
                class={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200/60"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50",
                )}
                on:click={() => (activeTab = tab.id)}
              >
                <svelte:component
                  this={tab.icon}
                  size={16}
                  class={activeTab === tab.id
                    ? "text-pink-600"
                    : "text-gray-400"}
                />
                {tab.label}
              </button>
            {/each}
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={14} /> Import/Export
          </button>
          <button
            class="flex items-center gap-1.5 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-sm shadow-pink-200"
          >
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      <!-- Bottom Row: Filters & Search -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4 flex-1">
          <!-- Search Input -->
          <div class="relative w-full sm:w-64 max-w-full">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              bind:value={$filterQuery}
              placeholder="Search task..."
              class="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm"
            />
          </div>

          <!-- Label Filters -->
          <div
            class="flex items-center gap-1 overflow-x-auto scrollbar-hide mask-edges"
          >
            <button
              class={cn(
                "px-3 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors",
                $activeLabelFilter === "All Tasks"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              )}
              on:click={() => ($activeLabelFilter = "All Tasks")}
              >All Tasks</button
            >
            <button
              class={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                $activeLabelFilter === "To do"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              )}
              on:click={() => ($activeLabelFilter = "To do")}>To do</button
            >
            <button
              class={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                $activeLabelFilter === "Doing"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              )}
              on:click={() => ($activeLabelFilter = "Doing")}>Doing</button
            >
            <button
              class={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                $activeLabelFilter === "Done"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
              )}
              on:click={() => ($activeLabelFilter = "Done")}>Done</button
            >
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
            on:click={toggleSort}
          >
            <ArrowUpDown
              size={14}
              class={$activeSort !== "none" ? "text-pink-600" : "text-gray-400"}
            /> Sort by
          </button>
          <button
            class="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
          >
            <SlidersHorizontal size={14} class="text-gray-400" /> Filter
          </button>
        </div>
      </div>
    </div>
    <!-- End Header -->

    <!-- Main Content Area -->
    <div class="flex-1 overflow-hidden relative bg-white">
      {#if activeTab === "kanban"}
        <KanbanView on:addLabel={() => (showAddLabelDialog = true)} />
      {:else if activeTab === "list"}
        <ListView />
      {:else if activeTab === "table"}
        <TableView />
      {/if}
    </div>
  </div>
</DashboardLayout>

<!-- Add Label Dialog -->
{#if showAddLabelDialog}
  <AddLabelDialog on:close={() => (showAddLabelDialog = false)} />
{/if}

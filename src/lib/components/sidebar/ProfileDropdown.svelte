<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import {
    Settings,
    LogOut,
    Check,
    Pencil,
    Plus,
    Building,
  } from "@lucide/svelte";
  import { authStore, selectedTeam } from "$modules/auth/stores/authStore.js";
  import { goto } from "$app/navigation";
  import { logoutApi } from "$modules/auth/api/authApi.js";

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  // Derived values from store
  $: user = $authStore?.user;
  $: currentTeam = $selectedTeam;
  $: teams = user?.teams || [];
  $: userRoleName = user?.user_role?.RoleName || user?.role || "User";

  // Fallback avatar if none provided (using initials)
  $: initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  function handleClose() {
    dispatch("close");
  }

  async function handleLogout() {
    try {
      const session = authStore.getSession();
      const refreshToken = session?.tokens?.refresh?.token || "";

      await logoutApi(refreshToken);
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      authStore.logout();

      localStorage.removeItem("bloom_pm_ui_settings");
      localStorage.removeItem("bloom_join_token");

      goto("/auth/login");
      dispatch("close");
    }
  }

  function handleCreateTeam() {
    goto("/onboarding");
    dispatch("close");
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div class="fixed inset-0 z-40" on:click={handleClose}></div>

  <!-- Dropdown Menu -->
  <div
    class="absolute left-2 top-14 z-50 w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 py-4 animate-in fade-in slide-in-from-top-2 duration-200"
  >
    <!-- User Info -->
    <div class="flex flex-col items-center px-4 pb-4 border-b border-gray-100">
      <div class="relative mb-3">
        {#if user?.avatar_url}
          <img
            src={user.avatar_url}
            alt={user.name}
            class="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
          />
        {:else}
          <div
            class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border-2 border-gray-100"
          >
            {initials}
          </div>
        {/if}

        <!-- Team indicator badge (only if team exists) -->
        {#if currentTeam}
          <div
            class="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
            title={currentTeam.teams_detail.name}
          >
            <Building class="w-3 h-3" />
          </div>
        {/if}
      </div>
      <h3 class="font-semibold text-gray-900 text-base">
        {user?.name || "Guest"}
      </h3>
      <p class="text-sm text-gray-500 capitalize">{userRoleName}</p>
    </div>

    <!-- Teams List -->
    <div class="py-2 px-2 border-b border-gray-100 max-h-48 overflow-y-auto">
      {#each teams as team}
        <button
          class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg {currentTeam
            ?.teams_detail.id === team.teams_detail.id
            ? 'bg-gray-50'
            : 'hover:bg-gray-50'} transition-colors group cursor-pointer"
          on:click={() => {
            authStore.setSelectedTeam(team);
            dispatch("close");
          }}
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium bg-orange-100 text-orange-600 shrink-0"
            >
              {team.teams_detail.name.substring(0, 1).toUpperCase()}
            </div>
            <span
              class="text-sm font-medium text-gray-700 truncate max-w-[140px]"
              >{team.teams_detail.name}</span
            >
          </div>
          {#if currentTeam?.teams_detail.id === team.teams_detail.id}
            <div class="flex items-center gap-2">
              <Check class="w-4 h-4 text-green-500" />
            </div>
          {/if}
        </button>
      {/each}

      {#if teams.length === 0}
        <div class="px-3 py-2 text-sm text-gray-500 text-center">
          No active team
        </div>
      {/if}

      <!-- Create Team Button -->
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-1 border border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50 transition-all"
        on:click={handleCreateTeam}
      >
        <Plus class="w-4 h-4" />
        <span class="text-sm font-medium">Create a team</span>
      </button>
    </div>

    <!-- Menu Items -->
    <div class="py-2 px-2">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
        on:click={() => {
          goto("/settings/team");
          dispatch("close");
        }}
      >
        <Settings class="w-4 h-4 text-gray-400" />
        <span class="text-sm font-medium">Manage Team</span>
      </button>
    </div>

    <!-- Logout -->
    <div class="pt-2 px-2 border-t border-gray-100">
      <button
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-gray-700 hover:text-red-600"
        on:click={handleLogout}
      >
        <LogOut class="w-4 h-4" />
        <span class="text-sm font-medium">Log Out</span>
      </button>
    </div>
  </div>
{/if}

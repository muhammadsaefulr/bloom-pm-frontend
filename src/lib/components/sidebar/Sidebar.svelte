<script lang="ts">
  import {
    Home,
    MessageSquarePlus,
    CheckSquare,
    Video,
    FileText,
    Share2,
    Settings,
    MoreHorizontal,
    ChevronsLeft,
    Users,
    MessageCircleIcon,
  } from "@lucide/svelte";
  import SidebarItem from "./SidebarItem.svelte";
  import ProfileDropdown from "./ProfileDropdown.svelte";
  import {
    currentUser,
    userSettings,
    authStore,
  } from "$modules/auth/stores/authStore.js";
  import { useLogout } from "$modules/auth/hooks/useAuth.js";
  import { slide, fade } from "svelte/transition";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  $: isCollapsed = !($userSettings?.sidebarOpen ?? true);
  let isProfileOpen = false;

  const logout = useLogout();

  // Mock data based on the image
  const mainNav = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Chat", href: "/chat", icon: MessageCircleIcon },
    { label: "My Tasks", href: "/tasks", icon: CheckSquare },
    { label: "My Meetings", href: "#", icon: Video },
    { label: "Saved Files", href: "#", icon: FileText },
  ];

  const todayNav = [
    { label: "Research Assistance Request", href: "#" },
    { label: "Summarizing Last Meeting", href: "#" },
    { label: "Prioritizing Tasks Request", href: "#" },
  ];

  const yesterdayNav = [{ label: "Document Summary Request", href: "#" }];

  function toggleProfile() {
    if (isCollapsed) {
      authStore.updateSettings({ sidebarOpen: true });
    } else {
      isProfileOpen = !isProfileOpen;
    }
  }

  function expandSidebar() {
    if (isCollapsed) {
      authStore.updateSettings({ sidebarOpen: true });
    }
  }
</script>

<aside
  class={cn(
    "flex flex-col h-screen border-r border-gray-100 bg-white py-4 px-3 sticky top-0 shrink-0 transition-all duration-300 relative",
    isCollapsed ? "w-[72px]" : "w-[260px] md:w-[280px]",
  )}
>
  <!-- Profile Header -->
  <div on:click={toggleProfile} class="flex items-center justify-between px-2 mb-6 hover:bg-gray-50 rounded-lg p-1.5 -ml-1.5 transition-colors">
    <button
      class="flex items-center gap-3"
    >
      <img
        src={$currentUser?.avatar_url ||
          "https://ui-avatars.com/api/?name=" + ($currentUser?.name || "User")}
        alt="Profile"
        class="w-9 h-9 rounded-full object-cover border border-gray-200"
      />
      {#if !isCollapsed}
        <div
          class="flex flex-col items-start"
          transition:slide={{ axis: "x", duration: 300 }}
        >
          <span
            class="text-sm font-semibold text-gray-900 leading-tight whitespace-nowrap"
            >{$currentUser?.name || "User"}</span
          >
        </div>
      {/if}
    </button>
    {#if !isCollapsed}
      <button
        transition:fade={{ duration: 200 }}
        class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors p-1.5 rounded-lg shrink-0"
        on:click={() => authStore.updateSettings({ sidebarOpen: false })}
      >
        <ChevronsLeft class="w-4 h-4" />
      </button>
    {/if}
  </div>

  <!-- Profile Dropdown -->
  <ProfileDropdown
    isOpen={isProfileOpen}
    on:close={() => (isProfileOpen = false)}
  />

  <!-- Main Navigation -->
  <nav class="flex-1 overflow-visible space-y-6 scrollbar-hide">
    <!-- Primary Links -->
    <div class="space-y-0.5">
      {#each mainNav as item}
        <SidebarItem
          label={item.label}
          icon={item.icon}
          href={item.href}
          {isCollapsed}
        />
      {/each}
    </div>

    <!-- {#if !isCollapsed} -->
    <!-- Today Section -->
    <!-- <div class="px-1">
        <h3
          class="text-xs font-medium text-gray-400 mb-2 ml-2 uppercase tracking-wider"
        >
          Today
        </h3>
        <div class="space-y-0.5">
          {#each todayNav as item}
            <SidebarItem label={item.label} href={item.href} />
          {/each}
        </div>
      </div> -->

    <!-- Yesterday Section -->
    <!-- <div class="px-1">
        <h3
          class="text-xs font-medium text-gray-400 mb-2 ml-2 uppercase tracking-wider"
        >
          Yesterday
        </h3>
        <div class="space-y-0.5">
          {#each yesterdayNav as item}
            <SidebarItem label={item.label} href={item.href} />
          {/each}
        </div>
      </div>
    {/if} -->

    <!-- AI Reports Warning Card -->
    <!-- {#if !isCollapsed}
      <div
        class="mx-1 mt-4 p-4 bg-gray-50/80 rounded-2xl relative overflow-hidden"
      >
        <div class="flex items-start gap-3 mb-3">
          <div class="relative w-5 h-5 shrink-0 mt-0.5">
            <svg class="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#E5E7EB"
                stroke-width="2"
              />
              <circle
                cx="10"
                cy="10"
                r="8"
                fill="none"
                stroke="#9CA3AF"
                stroke-width="2"
                stroke-dasharray="50.26"
                stroke-dashoffset="40.21"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div>
            <p class="text-[13px] font-semibold text-gray-800 leading-tight">
              Only 5 AI reports left
            </p>
            <p class="text-[11px] text-gray-500 leading-relaxed mt-0.5">
              Get deeper insights with Pro
            </p>
          </div>
        </div>
        <button
          class="w-full mt-1 bg-gradient-to-r from-[#3474eb] to-[#4083ff] hover:opacity-90 text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm"
        >
          Upgrade Now
        </button>
      </div>
    {/if} -->
  </nav>

  <!-- Footer -->
  <div class="w-full mt-auto pt-3 border-t border-gray-100">
      <SidebarItem
        label="Settings"
        href="/settings"
        icon={Settings}
        {isCollapsed}
      />
  </div>
</aside>

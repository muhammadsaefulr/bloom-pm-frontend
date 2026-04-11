<script lang="ts">
  import DashboardLayout from "$lib/components/layout/DashboardLayout.svelte";
  import { User, Bell, Palette, Users } from "@lucide/svelte";
  import { page } from "$app/stores";
</script>

<DashboardLayout>
  <div class="h-full flex flex-col max-w-5xl mx-auto pb-10">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
        <p class="text-sm text-gray-500 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Settings Sidebar -->
      <div class="col-span-1 border-r border-gray-100 pr-6 space-y-1">
        <a
          href="/settings"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors {$page.url.pathname === '/settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
        >
          <User class="w-4 h-4" />
          Profile
        </a>
        <a
          href="/settings/team"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors {$page.url.pathname === '/settings/team' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
        >
          <Users class="w-4 h-4" />
          Team
        </a>
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          <Bell class="w-4 h-4" />
          Notifications
        </button>
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium text-sm transition-colors"
        >
          <Palette class="w-4 h-4" />
          Appearance
        </button>
      </div>

      <!-- Settings Content -->
      <div class="col-span-1 md:col-span-3">
        <slot />
      </div>
    </div>
  </div>
</DashboardLayout>

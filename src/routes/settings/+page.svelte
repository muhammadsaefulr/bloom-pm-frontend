<script lang="ts">
  import { currentUser } from "$modules/auth/stores/authStore.js";
</script>

<svelte:head>
  <title>Profile Settings | Bloom PM</title>
</svelte:head>

<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
  <h2 class="text-lg font-semibold text-gray-900 mb-6">Profile Settings</h2>

  <div class="space-y-6">
    <!-- Avatar Section -->
    <div class="flex items-center gap-6">
      <img
        src={$currentUser?.avatar_url ||
          "https://ui-avatars.com/api/?name=" + ($currentUser?.name || "User")}
        alt="Profile"
        class="w-20 h-20 rounded-full object-cover border border-gray-200"
      />
      <div>
        <div class="flex gap-3">
          <button
            class="px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
          >
            Change Avatar
          </button>
          <button
            class="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Remove
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
      </div>
    </div>

    <!-- Form Fields -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100"
    >
      <div class="space-y-2">
        <label for="name" class="block text-sm font-medium text-gray-700"
          >Full Name</label
        >
        <input
          type="text"
          id="name"
          value={$currentUser?.name || ""}
          class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-pink-600 focus:ring-2 focus:ring-pink-600 transition-all text-sm outline-none"
        />
      </div>

      <div class="space-y-2">
        <label for="email" class="block text-sm font-medium text-gray-700"
          >Email Address</label
        >
        <input
          type="email"
          id="email"
          value={$currentUser?.email || ""}
          class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-pink-600 focus:ring-2 focus:ring-pink-600 transition-all text-sm outline-none"
        />
      </div>

      <div class="space-y-2 md:col-span-2">
        <label for="bio" class="block text-sm font-medium text-gray-700"
          >Bio</label
        >
        <textarea
          id="bio"
          rows="4"
          class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-pink-600 focus:ring-2 focus:ring-pink-600 transition-all text-sm outline-none resize-none"
          placeholder="Write a short bio about yourself..."
        ></textarea>
      </div>
    </div>

    <div class="pt-6 flex justify-end gap-3 border-t border-gray-100">
      <button
        class="px-5 py-2.5 text-gray-600 font-medium text-sm hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
      >
        Cancel
      </button>
      <button
        class="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 shadow-sm text-white font-medium text-sm rounded-xl transition-colors"
      >
        Save Changes
      </button>
    </div>
  </div>
</div>

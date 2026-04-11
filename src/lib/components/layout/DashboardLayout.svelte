<script lang="ts">
  import Sidebar from "../sidebar/Sidebar.svelte";
</script>

<div
  class="h-screen bg-[#F8FAFB] flex font-sans text-gray-900 selection:bg-blue-100"
>
  <Sidebar />

  <main class="flex-1 min-w-0">
    <div class="h-full px-8 py-6 overflow-y-auto w-full mx-auto">
      <slot />
    </div>
  </main>
</div>

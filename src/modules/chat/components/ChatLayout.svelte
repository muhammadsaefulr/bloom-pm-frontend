<script lang="ts">
  import Sidebar from "$lib/components/sidebar/Sidebar.svelte";
</script>

<div
  class="h-screen bg-[#F8FAFB] flex font-sans text-gray-900 selection:bg-blue-100 overflow-hidden"
>
  <Sidebar />

  <main class="flex-1 min-w-0 flex flex-col h-full">
    <!-- Remove padding to allow chat interface to take full space with its own padding/margins -->
    <div
      class="h-full w-full md:p-4 lg:p-6 overflow-hidden flex flex-col mx-auto"
    >
      <slot />
    </div>
  </main>
</div>

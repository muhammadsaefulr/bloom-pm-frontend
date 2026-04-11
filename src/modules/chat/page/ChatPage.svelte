<script lang="ts">
  import ChatLayout from "../components/ChatLayout.svelte";
  import ChatSidebar from "../components/ChatSidebar.svelte";
  import ChatArea from "../components/ChatArea.svelte";

  // Mock data will be added here
</script>

<ChatLayout>
  <div class="flex h-full w-full bg-[#f0f2f5] overflow-hidden rounded-2xl shadow-sm border border-gray-200">
    <!-- Sidebar for Chat List -->
    <ChatSidebar />

    <!-- Main Chat Area -->
    <ChatArea />
  </div>
</ChatLayout>

<script lang="ts">
    import { Plus, MessageSquare, Calendar, FileText } from "@lucide/svelte";

    const quickActions = [
        { label: "New Task", icon: Plus, color: "bg-blue-500" },
        { label: "Start Chat", icon: MessageSquare, color: "bg-green-500" },
        { label: "Schedule Meeting", icon: Calendar, color: "bg-purple-500" },
        { label: "Create Document", icon: FileText, color: "bg-orange-500" },
    ];
</script>

<div class="grid grid-cols-4 gap-4 mb-8">
    {#each quickActions as action}
        <button
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
        >
            <div
                class={`${action.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}
            >
                <svelte:component this={action.icon} class="w-5 h-5" />
            </div>
            <span class="text-sm font-medium text-gray-700">{action.label}</span
            >
        </button>
    {/each}
</div>

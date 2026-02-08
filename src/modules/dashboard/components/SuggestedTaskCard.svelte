<script lang="ts">
    import { Sparkles } from "@lucide/svelte";
    export let taskTitle: string;
</script>

<div
    class="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 h-full hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
>
    <div class="flex items-center gap-2 mb-3">
        <Sparkles
            class="w-4 h-4 text-gray-400 group-hover:text-gray-500 transition-colors"
        />
        <span class="text-xs font-medium text-gray-500">Suggested Task</span>
    </div>
    <p
        class="font-semibold text-gray-900 text-lg leading-snug group-hover:text-gray-950 transition-colors"
    >
        {taskTitle}
    </p>
</div>

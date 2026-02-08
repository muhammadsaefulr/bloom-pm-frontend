<script>
    import { Loader2 } from "@lucide/svelte";
</script>

<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
>
    <div class="flex flex-col items-center gap-3">
        <Loader2 class="h-10 w-10 animate-spin text-blue-600" />
        <span class="text-sm font-medium text-gray-500 animate-pulse"
            >Loading...</span
        >
    </div>
</div>

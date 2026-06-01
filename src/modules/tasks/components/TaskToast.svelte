<script lang="ts">
  import { CheckCircle2, XCircle } from "@lucide/svelte";
  import { taskToasts } from "../stores/taskToastStore.js";
</script>

<div class="pointer-events-none fixed right-5 top-5 z-50 flex w-full max-w-sm flex-col gap-2">
  {#each $taskToasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg"
      class:border-emerald-200={toast.type === "success"}
      class:border-red-200={toast.type === "error"}
    >
      {#if toast.type === "success"}
        <CheckCircle2 size={18} class="mt-0.5 shrink-0 text-emerald-600" />
      {:else}
        <XCircle size={18} class="mt-0.5 shrink-0 text-red-600" />
      {/if}

      <p class="min-w-0 flex-1 leading-5 text-gray-700">{toast.message}</p>
    </div>
  {/each}
</div>

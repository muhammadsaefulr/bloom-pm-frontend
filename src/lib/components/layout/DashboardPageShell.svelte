<script lang="ts">
  export let className = "";
  export let bodyClass = "min-h-0 flex-1 overflow-y-auto px-6 py-6";
</script>

<div
  class={`flex h-full min-h-0 overflow-hidden rounded-xl border border-gray-100/50 bg-white shadow-sm ${className}`}
>
  <div class="flex min-w-0 flex-1 flex-col">
    <slot name="header" />

    <div class={bodyClass}>
      <slot />
    </div>
  </div>
</div>

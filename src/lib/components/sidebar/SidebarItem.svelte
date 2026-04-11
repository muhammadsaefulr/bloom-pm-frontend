<script lang="ts">
  import { page } from "$app/stores";
  import { cn } from "$lib/utils/cn";
  import { slide } from "svelte/transition";

  export let href: string = "";
  export let label: string;
  export let icon: any = undefined;
  export let active: boolean = false;
  export let onClick: (() => void) | undefined = undefined;
  export let isCollapsed: boolean = false;

  $: isActive =
    active || (href !== "#" && ($page.url.pathname as string) === href);
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="relative group/tooltip">
  <a
    {href}
    class={cn(
      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-normal transition-all duration-150 group w-full",
      "hover:bg-gray-100/80",
      isActive
        ? "bg-gray-100 text-gray-900"
        : "text-gray-600 hover:text-gray-900",
      isCollapsed && "justify-center px-2",
    )}
    on:click={onClick}
  >
    {#if label && !isCollapsed}
      <span
        transition:slide={{ axis: "x", duration: 300 }}
        class="truncate whitespace-nowrap">{label}</span
      >
    {/if}
    {#if icon}
      <svelte:component
        this={icon}
        class={cn(
          "w-5 h-5 transition-colors shrink-0",
          isActive
            ? "text-gray-800"
            : "text-gray-400 group-hover:text-gray-600",
        )}
      />
    {/if}
  </a>

  <!-- Tooltip for collapsed state -->
  {#if isCollapsed && label}
    <div
      class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-gray-100 text-black text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none shadow-lg"
    >
      {label}
      <!-- Tooltip arrow -->
      <div
        class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"
      ></div>
    </div>
  {/if}
</div>

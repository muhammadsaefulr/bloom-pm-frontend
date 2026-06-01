<script lang="ts">
  import { GripVertical } from "@lucide/svelte";
  import { PaneResizer } from "paneforge";
  import type { PaneResizerProps } from "paneforge";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  type Props = PaneResizerProps & {
    withHandle?: boolean;
  };

  let {
    class: className,
    withHandle = false,
    children,
    ...restProps
  }: Props = $props();
</script>

<PaneResizer
  class={cn(
    "relative flex w-px items-center justify-center bg-gray-100 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500 data-[direction=vertical]:h-px data-[direction=vertical]:w-full data-[direction=vertical]:after:left-0 data-[direction=vertical]:after:h-1 data-[direction=vertical]:after:w-full data-[direction=vertical]:after:-translate-y-1/2 data-[direction=vertical]:after:translate-x-0 [&[data-direction=vertical]>div]:rotate-90",
    className,
  )}
  {...restProps}
>
  {#if withHandle}
    <div class="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-gray-200 bg-white shadow-sm">
      <GripVertical class="h-3 w-3 text-gray-400" />
    </div>
  {/if}
  {@render children?.()}
</PaneResizer>

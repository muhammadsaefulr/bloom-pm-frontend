<script lang="ts">
  import { PaneGroup } from "paneforge";
  import type { PaneGroupProps } from "paneforge";
  // @ts-expect-error module resolution
  import { cn } from "$lib/utils/cn.ts";

  let { class: className, children, ...restProps }: PaneGroupProps = $props();
</script>

<PaneGroup class={cn("flex h-full w-full data-[direction=vertical]:flex-col", className)} {...restProps}>
  {@render children?.()}
</PaneGroup>

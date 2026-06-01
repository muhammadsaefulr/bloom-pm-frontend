import { writable } from "svelte/store";

const MIN_LOADING_TIME = 1000;

let activeLoads = 0;
export const isGlobalLoading = writable(false);

export function startGlobalLoading() {
  activeLoads += 1;
  isGlobalLoading.set(true);

  const startedAt = Date.now();
  let isEnded = false;

  return async () => {
    if (isEnded) return;

    isEnded = true;
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(MIN_LOADING_TIME - elapsed, 0);

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    activeLoads = Math.max(activeLoads - 1, 0);

    if (activeLoads === 0) {
      isGlobalLoading.set(false);
    }
  };
}

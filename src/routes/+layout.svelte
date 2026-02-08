<script>
  import "../app.css";
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  import {
    authStore,
    isAuthenticated,
  } from "$modules/auth/stores/authStore.js";
  import { getCurrentUserApi } from "$modules/auth/api/authApi.js";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import Preloader from "$lib/components/ui/Preloader.svelte";

  // Create QueryClient instance
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  });

  // Initialize auth store on mount
  let isInitialized = false;
  let showContent = false;

  // Initialize auth store on mount
  onMount(async () => {
    try {
      const user = await getCurrentUserApi();
      authStore.login(user);
    } catch {
      authStore.logout();
    } finally {
      isInitialized = true;
    }
  });

  $: if (isInitialized) {
    const path = $page.url.pathname;
    const isPublicRoute = path === "/" || path.startsWith("/auth");
    const isOnboardingRoute = path.startsWith("/onboarding");

    if ($isAuthenticated) {
      const user = $authStore?.user;
      // Check if user has a team (teams property exists and is not empty/null)
      // Based on the type definition, teams is optional.
      const hasTeam = !!(user?.teams && user.teams.teams_detail);

      if (isPublicRoute) {
        if (hasTeam) {
          goto("/dashboard");
        } else {
          goto("/onboarding");
        }
      } else if (isOnboardingRoute) {
        if (hasTeam) {
          goto("/dashboard");
          showContent = false;
        } else {
          showContent = true;
        }
      } else {
        // Protected route
        if (!hasTeam) {
          goto("/onboarding");
          showContent = false;
        } else {
          showContent = true;
        }
      }
    } else if (!isPublicRoute) {
      showContent = false;
      goto("/auth/login");
    } else {
      showContent = true;
    }
  }
</script>

<!-- @ts-expect-error - Svelte 5 / TanStack Query v6 snippet mismatch workaround -->
<QueryClientProvider client={queryClient}>
  {#if showContent}
    <slot />
  {:else}
    <Preloader />
  {/if}
</QueryClientProvider>

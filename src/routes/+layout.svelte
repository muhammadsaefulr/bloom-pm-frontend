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
    const isJoinRoute = path.startsWith("/join");

    if ($isAuthenticated) {
      const user = $authStore?.user;
      const hasTeam = !!(user?.teams && user.teams.length > 0);

      if (isPublicRoute) {
        if (hasTeam) {
          goto("/dashboard");
        } else {
          goto("/onboarding");
        }
      } else if (isOnboardingRoute || isJoinRoute) {
        // If they are on onboarding and already have a team, 
        // we check if they are currently trying to join a new one via link.
        const isProcessingJoin = typeof window !== 'undefined' && !!localStorage.getItem("bloom_join_token");

        if (hasTeam && isOnboardingRoute && !isProcessingJoin) {
          goto("/dashboard");
          showContent = false;
        } else {
          showContent = true;
        }
      } else {
        if (!hasTeam) {
          goto("/onboarding");
          showContent = false;
        } else {
          showContent = true;
        }
      }
    } else if (!isPublicRoute && !isJoinRoute) {
      showContent = false;
      goto("/auth/login");
    } else {
      showContent = true;
    }
  }
</script>

<svelte:head>
  <title>Bloom PM</title>
  <meta name="description" content="Bloom - Project Management" />
</svelte:head>

<QueryClientProvider client={queryClient}>
  {#if showContent}
    <slot />
  {:else}
    <Preloader />
  {/if}
</QueryClientProvider>

<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { joinViaLinkApi } from "$modules/teams/api/teamsApi.js";
  import { getCurrentUserApi } from "$modules/auth/api/authApi.js";
  import {
    authStore,
    isAuthenticated,
  } from "$modules/auth/stores/authStore.js";
  import { Loader2, CheckCircle2, AlertCircle } from "@lucide/svelte";
  import * as Alert from "$lib/components/ui/alert/index.js";

  let status: "loading" | "success" | "error" = "loading";
  let errorMessage = "";

  onMount(async () => {
    const token = $page.params.token;
    if (!token) {
      status = "error";
      errorMessage = "Invalid join link.";
      return;
    }

    localStorage.setItem("bloom_join_token", token);

    if (!$isAuthenticated) {
      goto(`/auth/login?returnTo=/onboarding`);
      return;
    }

    goto("/onboarding");
  });
</script>

<div
  class="min-h-screen bg-background flex flex-col items-center justify-center p-4"
>
  <div
    class="w-full max-w-md p-8 bg-card rounded-2xl border border-border shadow-sm text-center"
  >
    {#if status === "loading"}
      <div class="flex justify-center mb-6">
        <Loader2 class="w-12 h-12 text-primary animate-spin" />
      </div>
      <h1 class="text-2xl font-semibold mb-2">Joining Team...</h1>
      <p class="text-muted-foreground">
        Please wait while we add you to the workspace.
      </p>
    {:else if status === "success"}
      <div class="flex justify-center mb-6">
        <CheckCircle2 class="w-12 h-12 text-green-500" />
      </div>
      <h1 class="text-2xl font-semibold mb-6">Welcome to the Team!</h1>
      <Alert.Root variant="default" class="bg-green-50 border-green-200 mb-6">
        <Alert.Title class="text-green-800">Success</Alert.Title>
        <Alert.Description class="text-green-700"
          >You have successfully joined the workspace. Redirecting...</Alert.Description
        >
      </Alert.Root>
    {:else if status === "error"}
      <div class="flex justify-center mb-6">
        <AlertCircle class="w-12 h-12 text-destructive" />
      </div>
      <h1 class="text-2xl font-semibold mb-6">Join Failed</h1>
      <Alert.Root variant="destructive" class="text-left mb-8">
        <AlertCircle class="h-4 w-4" />
        <Alert.Title>Error</Alert.Title>
        <Alert.Description>{errorMessage}</Alert.Description>
      </Alert.Root>

      <button
        on:click={() => goto("/dashboard")}
        class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Go to Dashboard
      </button>
    {/if}
  </div>
</div>

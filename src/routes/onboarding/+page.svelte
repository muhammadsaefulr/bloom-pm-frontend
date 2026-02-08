<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        authStore,
        isAuthenticated,
    } from "$modules/auth/stores/authStore.js";
    import {
        Plus,
        Users,
        ArrowRight,
        Loader2,
        CheckCircle2,
        Building,
        Command,
        ArrowLeft,
    } from "@lucide/svelte";
    import { apiClient } from "$lib/api/client.js";
    import { getCurrentUserApi } from "$modules/auth/api/authApi.js";
    import { fade, fly, slide } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { onMount } from "svelte";
    import type { User } from "$modules/auth/types/index.js";

    let view: "welcome" | "create-team" = "welcome";
    let teamName = "";
    let inviteCode = "";
    let isLoading = false;
    let error = "";
    let successMessage = "";

    // Redirect if already has team (validating on mount and reactive)
    $: if ($isAuthenticated && $authStore?.user?.teams?.teams_detail) {
        goto("/dashboard");
    }

    async function handleCreateTeam() {
        if (!teamName.trim()) {
            error = "Please enter a workspace name";
            return;
        }

        isLoading = true;
        error = "";

        try {
            // 1. Create the team
            await apiClient.post("/teams", { name: teamName });
            successMessage = "Workspace created successfully!";

            // 2. Refresh user data to get the new team info
            const user = await getCurrentUserApi();

            // 3. Update store (this will trigger the layout redirect)
            authStore.login(user); // Re-login updates the user in store

            // Fallback redirect if store doesn't trigger immediately
            setTimeout(() => {
                goto("/dashboard");
            }, 500);
        } catch (e: any) {
            console.error(e);
            error =
                e.response?.data?.message ||
                "Failed to create workspace. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    async function handleJoinTeam() {
        if (!inviteCode.trim()) {
            error = "Please enter an invitation code";
            return;
        }

        isLoading = true;
        error = "";

        try {
            // Swagger: POST /teams/member/accept-invitation { token: string }
            await apiClient.post("/teams/member/accept-invitation", {
                token: inviteCode,
            });
            successMessage = "Joined workspace successfully!";

            const user = await getCurrentUserApi();
            authStore.login(user);

            setTimeout(() => {
                goto("/dashboard");
            }, 500);
        } catch (e: any) {
            console.error(e);
            error =
                e.response?.data?.message ||
                "Invalid or expired invitation code.";
        } finally {
            isLoading = false;
        }
    }

    function goBack() {
        view = "welcome";
        error = "";
        teamName = "";
    }
</script>

<div
    class="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-primary/20"
>
    <div class="w-full max-w-md relative">
        <!-- Error/Success Messages -->
        {#if error}
            <div
                transition:slide
                class="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2"
            >
                <div
                    class="w-1.5 h-1.5 rounded-full bg-destructive shrink-0"
                ></div>
                {error}
            </div>
        {/if}

        {#if successMessage}
            <div
                transition:slide
                class="mb-6 p-4 rounded-lg bg-green-500/10 text-green-600 text-sm font-medium border border-green-500/20 flex items-center gap-2"
            >
                <CheckCircle2 class="w-4 h-4 shrink-0" />
                {successMessage}
            </div>
        {/if}

        {#if view === "welcome"}
            <div
                in:fly={{ x: -20, duration: 500, delay: 200, easing: cubicOut }}
                out:fly={{ x: -20, duration: 300, easing: cubicOut }}
                class="space-y-10"
            >
                <div class="space-y-4 text-center">
                    <div
                        class="mx-auto w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center mb-8"
                    >
                        <img
                            width="220"
                            src="/BloomLogo.png"
                            alt="Bloom Logo"
                        />
                    </div>
                    <h1 class="text-3xl font-semibold tracking-tight">
                        Welcome
                    </h1>
                    <p class="text-muted-foreground text-lg mb-8">
                        Choose how you'd like to get started.
                    </p>
                </div>

                <div class="space-y-6">
                    <!-- Create Option -->
                    <button
                        class="w-full group relative flex items-center p-6 rounded-xl border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        on:click={() => (view = "create-team")}
                        disabled={isLoading}
                    >
                        <div
                            class="p-4 rounded-lg bg-primary/10 text-primary mr-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
                        >
                            <Plus class="w-8 h-8" />
                        </div>
                        <div class="flex-1">
                            <h3 class="text-xl font-medium mb-1">
                                Create a new workspace
                            </h3>
                            <p
                                class="text-base text-muted-foreground group-hover:text-muted-foreground/80"
                            >
                                Start fresh with a new team.
                            </p>
                        </div>
                        <div
                            class="text-muted-foreground group-hover:translate-x-1 transition-transform duration-300"
                        >
                            <ArrowRight class="w-6 h-6" />
                        </div>
                    </button>

                    <!-- Divider -->
                    <div class="relative py-8">
                        <div class="absolute inset-0 flex items-center">
                            <span class="w-full border-t" />
                        </div>
                        <div
                            class="relative flex justify-center text-xs uppercase"
                        >
                            <span
                                class="bg-background px-4 text-muted-foreground"
                                >Or join existing</span
                            >
                        </div>
                    </div>

                    <!-- Join Option (Direct Input) -->
                    <div class="p-8 rounded-xl border bg-card/50 space-y-6">
                        <div
                            class="flex items-center gap-4 text-muted-foreground mb-4"
                        >
                            <Users class="w-6 h-6" />
                            <span class="font-medium text-lg text-foreground"
                                >Have an invitation code?</span
                            >
                        </div>
                        <div class="flex gap-3">
                            <input
                                type="text"
                                bind:value={inviteCode}
                                placeholder="e.g. invite-xc92-..."
                                class="flex-1 h-12 rounded-md border border-input bg-transparent px-4 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                on:keydown={(e) =>
                                    e.key === "Enter" && handleJoinTeam()}
                            />
                            <button
                                class="h-12 px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-base transition-colors disabled:opacity-50 flex items-center items-center justify-center min-w-[120px]"
                                on:click={handleJoinTeam}
                                disabled={!inviteCode.trim() || isLoading}
                            >
                                {#if isLoading && inviteCode.trim()}
                                    <Loader2 class="w-5 h-5 animate-spin" />
                                {:else}
                                    Join
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {:else if view === "create-team"}
            <div
                in:fly={{ x: 20, duration: 500, delay: 200, easing: cubicOut }}
                out:fly={{ x: 20, duration: 300, easing: cubicOut }}
                class="space-y-12"
            >
                <div>
                    <button
                        on:click={goBack}
                        class="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                    >
                        <ArrowLeft class="w-4 h-4 mr-1" /> Back
                    </button>

                    <div>
                        <div
                            class="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-6"
                        >
                            <Building class="w-7 h-7 text-primary" />
                        </div>
                        <h1 class="text-3xl font-semibold tracking-tight">
                            Name your workspace
                        </h1>
                        <p class="text-lg text-muted-foreground">
                            This will be the name of your team's shared space.
                        </p>
                    </div>
                </div>

                <div class="space-y-8 mt-4">
                    <div class="space-y-4">
                        <label
                            for="teamName"
                            class="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Workspace Name
                        </label>
                        <input
                            id="teamName"
                            type="text"
                            bind:value={teamName}
                            placeholder="Acme Corp."
                            class="flex h-14 w-full rounded-lg border border-input bg-transparent px-4 py-2 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                            autoFocus
                            on:keydown={(e) =>
                                e.key === "Enter" && handleCreateTeam()}
                        />
                        <p class="text-xs text-muted-foreground mt-2">
                            You can always change this later in settings.
                        </p>
                    </div>

                    <div class="mt-4">
                        <button
                            class="w-full h-14 px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                            on:click={handleCreateTeam}
                            disabled={!teamName.trim() || isLoading}
                        >
                            {#if isLoading}
                                <Loader2 class="w-5 h-5 animate-spin" />
                                Creating...
                            {:else}
                                Create Workspace <ArrowRight class="w-5 h-5" />
                            {/if}
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</div>

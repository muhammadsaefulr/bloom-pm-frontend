<script lang="ts">
  import { Building, Users, Mail, Trash2, Link as LinkIcon } from "@lucide/svelte";
  import { selectedTeam } from "$modules/auth/stores/authStore.js";
  import {
    useTeamMembers,
    useUpdateTeamMutation,
    useInviteMemberMutation,
    useRemoveMemberMutation,
    useGenerateInviteLinkMutation,
  } from "$modules/teams/actions/teamsAction.js";

  import * as Alert from "$lib/components/ui/alert/index.js";
  import { AlertCircle, CheckCircle2 } from "@lucide/svelte";

  let activeTab = "general";
  let teamNameInput = "";
  let inviteEmail = "";

  let alertMessage = "";
  let alertType: "success" | "error" = "success";

  function showAlert(msg: string, type: "success" | "error") {
    alertMessage = msg;
    alertType = type;
    setTimeout(() => { alertMessage = ""; }, 5000);
  }

  // Subscribe to currently selected team in the auth store
  $: currentTeam = $selectedTeam?.teams_detail;
  $: isOwner = $selectedTeam?.role_id === 1;

  $: {
    if (currentTeam && !teamNameInput) {
      teamNameInput = currentTeam.name;
    }
  }

  // Hook usages must be called at initialization
  const query = useTeamMembers(() => currentTeam?.id);

  const updateTeamMutation = useUpdateTeamMutation(() => currentTeam?.id);
  const inviteMemberMutation = useInviteMemberMutation(
    () => currentTeam?.id,
    () => {
      inviteEmail = "";
      showAlert("Invitation sent!", "success");
    },
  );
  const removeMemberMutation = useRemoveMemberMutation(() => currentTeam?.id);

  const generateLinkMutation = useGenerateInviteLinkMutation(
    () => currentTeam?.id,
    (token) => {
      const inviteUrl = `${window.location.origin}/join/${token}`;
      navigator.clipboard.writeText(inviteUrl).then(() => {
        showAlert("Invite link copied to clipboard!\n" + inviteUrl, "success");
      }).catch(err => {
        showAlert("Generated link: " + inviteUrl, "success");
      });
    }
  );

  function handleUpdateTeam() {
    if (!currentTeam || !teamNameInput) return;
    updateTeamMutation.mutate(teamNameInput, {
      onSuccess: () => showAlert("Team Updated!", "success"),
      onError: (e: any) => showAlert("Error: " + e.message, "error")
    });
  }

  function handleInvite() {
    if (!currentTeam || !inviteEmail) return;
    inviteMemberMutation.mutate(inviteEmail, {
      onError: (e: any) => showAlert("Error: " + e.message, "error")
    });
  }

  function handleRemoveMember(memberId: string) {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMemberMutation.mutate(memberId);
    }
  }

  function handleLeaveTeam() {
    if (confirm("Are you sure you want to leave this team? You will lose access immediately.")) {
      if (!currentTeam || !$selectedTeam?.id) return;
      // Pass the current user's RefTenantUser ID to delete it
      removeMemberMutation.mutate($selectedTeam.id, {
        onSuccess: () => {
          window.location.href = "/dashboard"; // Forces full reload to re-evaluate user teams
        }
      });
    }
  }

  function handleGenerateLink() {
    if (!currentTeam) return;
    generateLinkMutation.mutate();
  }
</script>

<svelte:head>
  <title>Team Settings | Bloom PM</title>
</svelte:head>

<div
  class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
>
  <div class="px-6 py-4 border-b border-gray-100 flex gap-6">
    <button
      class="text-sm font-medium pb-2 -mb-[17px] {activeTab === 'general'
        ? 'text-gray-900 border-b-2 border-pink-600'
        : 'text-gray-500 hover:text-gray-700'}"
      on:click={() => (activeTab = "general")}
    >
      General
    </button>
    <button
      class="text-sm font-medium pb-2 -mb-[17px] {activeTab === 'members'
        ? 'text-gray-900 border-b-2 border-pink-600'
        : 'text-gray-500 hover:text-gray-700'}"
      on:click={() => (activeTab = "members")}
    >
      Members
    </button>
  </div>

  <div class="p-6">
    {#if alertMessage}
      <Alert.Root variant={alertType === "error" ? "destructive" : "default"} class="mb-6 {alertType === 'success' ? 'bg-green-50 border-green-200' : ''}">
        <div class="flex items-center gap-2 mb-1">
          {#if alertType === "success"}
             <CheckCircle2 class="h-4 w-4 text-green-600" />
          {:else}
             <AlertCircle class="h-4 w-4" />
          {/if}
          <Alert.Title class={alertType === "success" ? "text-green-800" : ""}>{alertType === 'success' ? 'Success' : 'Error'}</Alert.Title>
        </div>
        <Alert.Description class={alertType === "success" ? "text-green-700 pl-6" : "pl-6 whitespace-pre-wrap"}>{alertMessage}</Alert.Description>
      </Alert.Root>
    {/if}

    {#if activeTab === "general"}
      <!-- General Tab -->
      <h2
        class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2"
      >
        <Building class="w-5 h-5 text-gray-400" />
        Team Information
      </h2>
      <div class="space-y-6 max-w-xl">
        <div class="space-y-2">
          <label for="team_name" class="block text-sm font-medium text-gray-700"
            >Team Name</label
          >
          <input
            type="text"
            id="team_name"
            bind:value={teamNameInput}
            disabled={!isOwner}
            class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-pink-600 focus:ring-2 focus:ring-pink-600 transition-all text-sm outline-none disabled:opacity-75 disabled:cursor-not-allowed"
          />
        </div>
        {#if isOwner}
          <div class="pt-4 flex justify-end">
            <button
              on:click={handleUpdateTeam}
              disabled={updateTeamMutation.isPending}
              class="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-90 shadow-sm text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {updateTeamMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        {:else}
          <div class="pt-8 mt-6 border-t border-gray-100 flex flex-col items-start gap-3">
             <h3 class="text-sm font-semibold text-red-600">Danger Zone</h3>
             <p class="text-xs text-gray-500 max-w-sm">
                Leaving this team will instantly revoke your access to all projects, tasks, and members inside it.
             </p>
             <button
              on:click={handleLeaveTeam}
              disabled={removeMemberMutation.isPending}
              class="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-sm font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {removeMemberMutation.isPending ? "Leaving..." : "Leave Team"}
            </button>
          </div>
        {/if}
      </div>
    {:else if activeTab === "members"}
      <!-- Members Tab -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users class="w-5 h-5 text-gray-400" />
          Team Members
        </h2>
      </div>

      <!-- Invitations Section -->
      {#if isOwner}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl">
          <!-- Invite via Email -->
          <div class="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Mail class="w-4 h-4 text-gray-500" />
                Invite via Email
              </h3>
              <p class="text-xs text-gray-500 mb-4 leading-relaxed">
                Send a one-time invitation directly to an email address.
              </p>
            </div>
            <div class="flex gap-3 mt-auto">
              <input
                type="email"
                bind:value={inviteEmail}
                placeholder="member@example.com"
                class="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:border-pink-600 focus:ring-2 focus:ring-pink-600/20 transition-all text-sm outline-none"
              />
              <button
                on:click={handleInvite}
                disabled={inviteMemberMutation.isPending || !inviteEmail}
                class="shrink-0 px-4 py-2 bg-gray-900 text-white font-medium text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {inviteMemberMutation.isPending ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>

          <!-- Invite via Link -->
          <div class="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <LinkIcon class="w-4 h-4 text-gray-500" />
                Invite via Link
              </h3>
              <p class="text-xs text-gray-500 mb-4 leading-relaxed">
                Generate a reusable link that anyone can use to join your team directly. You can share this via chat.
              </p>
            </div>
            <button
              class="w-full mt-auto px-4 py-2.5 bg-pink-50 text-pink-700 font-medium text-sm rounded-lg hover:bg-pink-100 border border-pink-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              on:click={handleGenerateLink}
              disabled={generateLinkMutation.isPending}
            >
              <LinkIcon class="w-4 h-4" />
              {generateLinkMutation.isPending ? "Generating..." : "Generate & Copy Link"}
            </button>
          </div>
        </div>
      {/if}

      <!-- Members List -->
      <div class="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >User</th
              >
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >Role</th
              >
              <th
                class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right"
                >Actions</th
              >
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            {#if query.isPending && (query.data || []).length === 0}
              <tr>
                <td
                  colspan="3"
                  class="px-4 py-8 text-center text-gray-500 text-sm"
                  >Loading members...</td
                >
              </tr>
            {:else if (query.data || []).length === 0}
              <tr>
                <td
                  colspan="3"
                  class="px-4 py-8 text-center text-gray-500 text-sm"
                  >No members found</td
                >
              </tr>
            {:else}
              {#each query.data || [] as member (member.id)}
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold shrink-0"
                      >
                        {member.user?.name
                          ? member.user.name.substring(0, 2).toUpperCase()
                          : "U"}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-gray-900">
                          {member.user?.name || "Unknown User"}
                        </div>
                        <div class="text-xs text-gray-500">
                          {member.user?.email || ""}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      {member.role?.name || "Member"}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    {#if isOwner && member.user_id !== currentTeam?.owner_user_id}
                      <button
                        class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove Member"
                        disabled={removeMemberMutation.isPending}
                        on:click={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    {/if}
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
import { getTeamMembersApi, updateTeamApi, inviteTeamMemberApi, deleteTeamMemberApi, generateInviteLinkApi } from "../api/teamsApi.js";
import { authStore, selectedTeam } from "../../auth/stores/authStore.js";
import { get } from "svelte/store";

export function useTeamMembers(getTeamId: () => string | undefined) {
    return createQuery(() => ({
        queryKey: ['teamMembers', getTeamId()],
        queryFn: () => getTeamMembersApi(getTeamId()!),
        enabled: !!getTeamId()
    }));
}

export function useUpdateTeamMutation(getTeamId: () => string | undefined) {
    return createMutation(() => ({
        mutationFn: (name: string) => updateTeamApi(getTeamId()!, { name }),
        onSuccess: (_, variables: string) => {
            const current: any = get(selectedTeam);
            if (current?.teams_detail) {
                authStore.setSelectedTeam({
                    ...current,
                    teams_detail: { ...current.teams_detail, name: variables },
                });
            }
        },
        onError: (e: any) => {
            console.error("useUpdateTeamMutation error", e);
        }
    }));
}

export function useInviteMemberMutation(getTeamId: () => string | undefined, onSuccessCb: () => void) {
    return createMutation(() => ({
        mutationFn: (email: string) => inviteTeamMemberApi({ tenant_id: getTeamId()!, email }),
        onSuccess: () => {
            onSuccessCb();
        },
        onError: (e: any) => {
            console.error("useInviteMemberMutation error", e);
        }
    }));
}

export function useRemoveMemberMutation(getTeamId: () => string | undefined) {
    const queryClient = useQueryClient();
    return createMutation(() => ({
        mutationFn: (memberId: string) => deleteTeamMemberApi(memberId),
        onSuccess: async (_, memberId) => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers', getTeamId()] });

            const current = get(selectedTeam);
            // If we are leaving the team, update local store with fresh user data
            if (current?.id === memberId) {
                try {
                    const { getCurrentUserApi } = await import("../../auth/api/authApi.js");
                    const user = await getCurrentUserApi();
                    authStore.login(user);
                } catch (e) {
                    console.error("Failed to refresh user:", e);
                }
            }
        },
        onError: (e: any) => {
            console.error("useRemoveMemberMutation error", e);
        }
    }));
}

export function useGenerateInviteLinkMutation(getTeamId: () => string | undefined, onSuccessCb: (token: string) => void) {
    return createMutation(() => ({
        mutationFn: () => generateInviteLinkApi(getTeamId()!),
        onSuccess: (token: string) => {
            onSuccessCb(token);
        },
        onError: (e: any) => {
            console.error("useGenerateInviteLinkMutation error", e);
        }
    }));
}

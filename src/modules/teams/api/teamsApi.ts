import { apiClient } from '$lib/api/client.js';
import type { AxiosRequestConfig } from 'axios';
import type { Team, TeamMember, UpdateTeamRequest, InviteMemberRequest } from '../types/index.js';

export async function updateTeamApi(id: string, data: UpdateTeamRequest): Promise<{ message: string; data: Team }> {
    const response = await apiClient.put<{ message: string; data: Team }>(`/teams/${id}`, data);
    return response.data;
}

export async function getTeamMembersApi(tenantId: string, config: AxiosRequestConfig = {}): Promise<TeamMember[]> {
    const response = await apiClient.get<any>('/teams/member', {
        ...config,
        params: { tenant_id: tenantId, ...config.params }
    });
    return response.data.data || [];
}

export async function deleteTeamMemberApi(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/teams/member/${id}`);
    return response.data;
}

export async function inviteTeamMemberApi(data: InviteMemberRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/teams/member/invite', data);
    return response.data;
}

export async function acceptTeamInvitationApi(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/teams/member/accept-invitation', { token });
    return response.data;
}

export async function generateInviteLinkApi(tenantId: string): Promise<string> {
    const response = await apiClient.post<any>('/teams/member/invite-link', { tenant_id: tenantId });
    return response.data.data;
}

export async function joinViaLinkApi(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<any>('/teams/member/join-link', { token });
    return response.data;
}

export interface Team {
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface TeamMember {
    id: string;
    tenant_id: string;
    user_id: string;
    role_id: number;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar_url?: string;
    };
    role?: {
        id: number;
        name: string;
    };
    created_at?: string;
}

export interface UpdateTeamRequest {
    name: string;
}

export interface InviteMemberRequest {
    tenant_id: string;
    email: string;
}

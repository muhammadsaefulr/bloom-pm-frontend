import type { BaseApiResponse, ApiErrorResponse, Tokens } from '../../../global.types.js';

export type { Tokens };

export interface Permission {
    ID: number;
    PermissionName: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface UserRole {
    ID: number;
    RoleName: string;
    Permissions: Permission[];
    CreatedAt: string;
    UpdatedAt: string;
}

export interface SubscriptionPlan {
    id: number;
    plan_name: string;
    limit_requests: number;
    duration: number;
    price: number;
    benefit: string[];
    CreatedAt: string;
    UpdatedAt: string;
}

export interface UserSubscription {
    ID: number;
    UserID: string;
    SubscriptionPlanID: number;
    StartDate: string;
    EndDate: string;
    LimitRequest: number;
    IsActive: boolean;
    UpdatedBy: string;
    subscription_plan: SubscriptionPlan;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface TeamDetail {
    id: string;
    name: string;
    owner_user_id: string;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Team {
    tenant_id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    teams_detail: TeamDetail;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string; // Keeping this for backward compatibility if used elsewhere, though JSON has role_id
    role_id: number;
    avatar_url?: string;
    verified_email: boolean;
    firebase_uid?: string;
    user_subscription?: UserSubscription;
    user_role?: UserRole;
    teams?: Team;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    email: string;
    name: string;
    password: string;
}

export interface AuthResponse extends BaseApiResponse {
    tokens: Tokens;
    user: User;
}

export type LogoutResponse = BaseApiResponse;

export interface RefreshTokenRequest {
    refresh_token: string;
}

export interface RefreshTokenResponse extends BaseApiResponse {
    tokens: Tokens;
}

export interface AuthSession {
    user: User;
    tokens?: Tokens;
    isAuthenticated: boolean;
}

export type AuthError = ApiErrorResponse;

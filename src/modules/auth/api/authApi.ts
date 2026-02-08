import { apiClient } from '$lib/api/client.js';
import type {
    LoginCredentials,
    RegisterCredentials,
    AuthResponse,
    LogoutResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    User,
} from '../types/index.js';

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
}

export async function registerApi(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    return response.data;
}

export async function logoutApi(refreshToken: string): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/auth/logout', {
        refresh_token: refreshToken,
    });
    return response.data;
}

export async function refreshTokensApi(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh-tokens', request);
    return response.data;
}

export async function getCurrentUserApi(): Promise<User> {
    const response = await apiClient.get<{ data: User }>('/auth/me');
    return response.data.data;
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
}

export async function resetPasswordApi(token: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/auth/reset-password?token=${token}`, { password });
    return response.data;
}

export async function verifyEmailApi(token: string): Promise<{ message: string }> {
    const response = await apiClient.post(`/auth/verify-email?token=${token}`);
    return response.data;
}

export async function sendVerificationEmailApi(): Promise<{ message: string }> {
    const response = await apiClient.post('/auth/send-verification-email');
    return response.data;
}

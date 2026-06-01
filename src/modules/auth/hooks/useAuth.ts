import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
import {
    loginApi,
    registerApi,
    logoutApi,
    refreshTokensApi,
    getCurrentUserApi,
} from '../api/authApi.js';
import { authStore } from '../stores/authStore.js';
import { goto } from '$app/navigation';
import type {
    LoginCredentials,
    RegisterCredentials,
    RefreshTokenRequest,
    AuthResponse,
    RefreshTokenResponse,
} from '../types/index.js';

export function useLogin() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
            return await loginApi(credentials);
        },
        onSuccess: async (data: AuthResponse) => {
            authStore.updateTokens(data.tokens);
            try {
                const user = await getCurrentUserApi();
                authStore.login(user, data.tokens);
            } catch (err) {
                // fallback
                authStore.login(data.user, data.tokens);
            }
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            
            const { get } = await import('svelte/store');
            const { page } = await import('$app/stores');
            const params = get(page).url.searchParams;
            const returnTo = params.get("redirect") || params.get("returnTo");
            goto(returnTo || '/dashboard');
        },
        onError: (error: any) => {
            console.error('Login failed:', error.message);
        },
    }));
}

export function useRegister() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
            return await registerApi(credentials);
        },
        onSuccess: async (data: AuthResponse) => {
            authStore.updateTokens(data.tokens);
            try {
                const user = await getCurrentUserApi();
                authStore.login(user, data.tokens);
            } catch (err) {
                // fallback
                authStore.login(data.user, data.tokens);
            }
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            
            const { get } = await import('svelte/store');
            const { page } = await import('$app/stores');
            const params = get(page).url.searchParams;
            const returnTo = params.get("redirect") || params.get("returnTo");
            goto(returnTo || '/auth/login');
        },
        onError: (error: any) => {
            console.error('Registration failed:', error.message);
        },
    }));
}

export function useLogout() {
    const queryClient = useQueryClient();

    return createMutation(() => ({
        mutationFn: async (): Promise<void> => {
            const session = authStore.getSession();
            const refreshToken = session?.tokens?.refresh?.token || '';
            await logoutApi(refreshToken);
        },
        onSuccess: () => {
            authStore.logout();
            queryClient.clear();
            goto('/auth/login');
        },
        onError: (error: any) => {
            authStore.logout();
            authStore.logout();
            queryClient.clear();
            goto('/auth/login');
            console.error('Logout error:', error.message);
        },
    }));
}

export function useRefreshTokens() {
    return createMutation(() => ({
        mutationFn: async (request: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
            return await refreshTokensApi(request);
        },
        onSuccess: (data: RefreshTokenResponse) => {
            authStore.updateTokens(data.tokens);
        },
        onError: (error: any) => {
            console.error('Token refresh failed:', error.message);
            authStore.logout();
            goto('/auth/login');
        },
    }));
}

export function useCurrentUser() {
    return createQuery(() => ({
        queryKey: ['currentUser'],
        queryFn: getCurrentUserApi,
        enabled: authStore.isAuthenticated(),
        staleTime: 5 * 60 * 1000,
        retry: false,
    }));
}

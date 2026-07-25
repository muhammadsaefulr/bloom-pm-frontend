import axios from 'axios';
import { startGlobalLoading } from '$lib/stores/loadingStore.js';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

declare module 'axios' {
    export interface AxiosRequestConfig {
        skipGlobalLoading?: boolean;
    }

    export interface InternalAxiosRequestConfig {
        skipGlobalLoading?: boolean;
    }
}

/**
 * Axios instance configured with credentials support for cookie-based authentication
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor for adding auth tokens
 */
apiClient.interceptors.request.use(
    (config) => {
        if (!config.skipGlobalLoading) {
            (config as typeof config & { finishGlobalLoading?: () => Promise<void> }).finishGlobalLoading = startGlobalLoading();
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for handling errors globally
 */
apiClient.interceptors.response.use(
    async (response) => {
        await (response.config as typeof response.config & { finishGlobalLoading?: () => Promise<void> }).finishGlobalLoading?.();
        return response;
    },
    async (error: AxiosError<any>) => {
        await (error.config as (typeof error.config & { finishGlobalLoading?: () => Promise<void> }) | undefined)?.finishGlobalLoading?.();

        if (error.response) {
            const { status, data } = error.response;
            const originalRequest = error.config as
                | (InternalAxiosRequestConfig & { _retry?: boolean })
                | undefined;

            if (status === 401) {
                const requestUrl = originalRequest?.url ?? '';
                const canRefresh =
                    typeof window !== 'undefined' &&
                    !!originalRequest &&
                    !originalRequest._retry &&
                    !requestUrl.includes('/auth/login') &&
                    !requestUrl.includes('/auth/register') &&
                    !requestUrl.includes('/auth/refresh-tokens');

                if (canRefresh) {
                    originalRequest._retry = true;

                    try {
                        const { authStore } = await import('$modules/auth/stores/authStore.js');
                        const refreshToken = authStore.getRefreshToken();
                        
                        if (!refreshToken) {
                            throw new Error("No refresh token available");
                        }

                        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-tokens`, {
                            refresh_token: refreshToken,
                        }, { withCredentials: true });

                        if (refreshResponse.data?.tokens) {
                            authStore.updateTokens(refreshResponse.data.tokens);
                        }

                        return apiClient(originalRequest);
                    } catch {
                        // Fall through to the normal logout redirect below.
                    }
                }

                console.error('Unauthorized request');
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
                    const { authStore } = await import('$modules/auth/stores/authStore.js');
                    authStore.logout();
                    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.assign(`/auth/login?returnTo=${returnTo}`);
                }
            } else if (status === 403) {
                console.error('Forbidden');
            } else if (status === 404) {
                console.error('Resource not found');
            }

            error.message = data?.message || error.message;
        } else if (error.request) {
            error.message = 'No response from server';
        }

        return Promise.reject(error);
    }
);

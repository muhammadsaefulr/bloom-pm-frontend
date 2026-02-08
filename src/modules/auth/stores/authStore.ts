import { writable, derived, type Readable } from 'svelte/store';
import type { AuthSession, User, Tokens } from '../types/index.js';

const initialSession: AuthSession | null = null;

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthSession | null>(initialSession);

    return {
        subscribe,

        init: () => {
            set(null);
        },

        login: (user: User, tokens?: Tokens) => {
            const session: AuthSession = {
                user,
                tokens,
                isAuthenticated: true,
            };
            set(session);
        },

        logout: () => {
            set(null);
        },

        updateUser: (userData: Partial<User>) => {
            update((session) => {
                if (session) {
                    return {
                        ...session,
                        user: { ...session.user, ...userData },
                    };
                }
                return session;
            });
        },

        updateTokens: (tokens: Tokens) => {
            update((session) => {
                if (session) {
                    return {
                        ...session,
                        tokens,
                    };
                }
                return session;
            });
        },

        getSession: (): AuthSession | null => {
            let currentSession: AuthSession | null = null;
            subscribe((session) => {
                currentSession = session;
            })();
            return currentSession;
        },

        isAuthenticated: (): boolean => {
            let authenticated = false;
            subscribe((session) => {
                authenticated = session?.isAuthenticated ?? false;
            })();
            return authenticated;
        },

        getAccessToken: (): string | null => {
            let token: string | null = null;
            subscribe((session) => {
                token = session?.tokens?.access?.token ?? null;
            })();
            return token;
        },

        getRefreshToken: (): string | null => {
            let token: string | null = null;
            subscribe((session) => {
                token = session?.tokens?.refresh?.token ?? null;
            })();
            return token;
        },

        isTokenExpired: (): boolean => {
            let expired = true;
            subscribe((session) => {
                if (!session?.tokens?.access?.expires) {
                    expired = true;
                } else {
                    const expiresAt = new Date(session.tokens.access.expires).getTime();
                    const now = Date.now();
                    expired = expiresAt - now < 60 * 1000;
                }
            })();
            return expired;
        },
    };
}

export const authStore = createAuthStore();

export const currentUser: Readable<User | null> = derived(
    authStore,
    ($auth) => $auth?.user ?? null
);

export const isAuthenticated: Readable<boolean> = derived(
    authStore,
    ($auth) => $auth?.isAuthenticated ?? false
);

export const accessToken: Readable<string | null> = derived(
    authStore,
    ($auth) => $auth?.tokens?.access?.token ?? null
);

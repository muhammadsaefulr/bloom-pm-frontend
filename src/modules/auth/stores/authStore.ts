import { writable, derived, type Readable } from 'svelte/store';
import type { AuthSession, User, Tokens, Team, UserSettings } from '../types/index.js';

const STORAGE_KEY = 'bloom_pm_ui_settings';
const DEFAULT_SETTINGS: UserSettings = { theme: 'light', language: 'en', sidebarOpen: true };

// Load initial state from localStorage if in browser
function loadStoredState(): Partial<AuthSession> | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
}

function saveStoredState(session: AuthSession | null) {
    if (typeof window === 'undefined') return;
    if (!session || !session.user) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }
    // Only save non-sensitive UI settings/appearance, skip tokens completely
    const dataToSave = {
        user: session.user, // Persist user appearance (name, email, avatar, etc)
        selectedTeam: session.selectedTeam || null,
        settings: session.settings || { theme: 'light', language: 'en' },
        isAuthenticated: session.isAuthenticated
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function resolveSelectedTeam(user: User, current?: Team | null): Team | null {
    if (!user?.teams || user.teams.length === 0) return null;
    if (!current) return user.teams[0];
    return user.teams.find((team) => team.tenant_id === current.tenant_id || team.id === current.id) ?? user.teams[0];
}

const storedState = loadStoredState();
const initialSession: AuthSession | null = storedState
    ? {
        ...storedState,
        tokens: undefined, // ensure no sensitive access tokens are loaded from local storage
        isAuthenticated: !!storedState.user
    } as AuthSession
    : null;

function createAuthStore() {
    const { subscribe, set, update } = writable<AuthSession | null>(initialSession);

    // Save to local storage on every change to the store
    subscribe(saveStoredState);

    return {
        subscribe,

        init: () => {
            set(null);
        },

        login: (user: User, tokens?: Tokens) => {
            update(session => {
                const selectedTeam = resolveSelectedTeam(user, session?.selectedTeam ?? null);
                const settings = { ...DEFAULT_SETTINGS, ...session?.settings };
                return {
                    ...session,
                    user,
                    tokens: tokens ?? session?.tokens,
                    isAuthenticated: true,
                    selectedTeam,
                    settings
                };
            });
        },

        setSessionFromMe: (user: User) => {
            update(session => {
                const selectedTeam = resolveSelectedTeam(user, session?.selectedTeam ?? null);
                const settings = { ...DEFAULT_SETTINGS, ...session?.settings };
                return {
                    ...session,
                    user,
                    isAuthenticated: true,
                    selectedTeam,
                    settings,
                };
            });
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

        setSelectedTeam: (team: Team | null) => {
            update((session) => {
                if (session) {
                    return { ...session, selectedTeam: team };
                }
                return session;
            });
        },

        updateSettings: (settings: Partial<UserSettings>) => {
            update((session) => {
                if (session) {
                    return { ...session, settings: { ...DEFAULT_SETTINGS, ...(session.settings || {}), ...settings } as UserSettings };
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

export const selectedTeam: Readable<Team | null> = derived(
    authStore,
    ($auth) => $auth?.selectedTeam ?? null
);

export const userSettings: Readable<UserSettings | null> = derived(
    authStore,
    ($auth) => $auth?.settings ?? null
);

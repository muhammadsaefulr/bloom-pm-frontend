import type { Handle, HandleFetch } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { AuthSession, Tokens, User } from './modules/auth/types/index.js';

const API_BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/tasks', '/meetings', '/files'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/login', '/auth/register'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/forgot-password', '/auth/reset-password'];

type AuthMeResponse = {
    data: User;
};

type RefreshTokensResponse = {
    tokens: Tokens;
};

function readLegacySessionCookie(event: Parameters<Handle>[0]['event']): AuthSession | null {
    const sessionCookie = event.cookies.get('auth_session');
    if (!sessionCookie) return null;

    try {
        return JSON.parse(sessionCookie) as AuthSession;
    } catch {
        event.cookies.delete('auth_session', { path: '/' });
        return null;
    }
}

function buildAuthCookieHeader(event: Parameters<Handle>[0]['event']) {
    const cookies = ['access_token', 'refresh_token']
        .map((name) => {
            const value = event.cookies.get(name);
            return value ? `${name}=${encodeURIComponent(value)}` : null;
        })
        .filter(Boolean);

    return cookies.join('; ');
}

function setTokenCookies(event: Parameters<Handle>[0]['event'], tokens: Tokens) {
    const secure = event.url.protocol === 'https:';

    event.cookies.set('access_token', tokens.access.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        expires: new Date(tokens.access.expires),
    });

    event.cookies.set('refresh_token', tokens.refresh.token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure,
        expires: new Date(tokens.refresh.expires),
    });
}

function clearTokenCookies(event: Parameters<Handle>[0]['event']) {
    event.cookies.delete('access_token', { path: '/' });
    event.cookies.delete('refresh_token', { path: '/' });
}

function createSession(user: User, tokens?: Tokens): AuthSession {
    return {
        user,
        tokens,
        isAuthenticated: true,
        selectedTeam: user.teams?.[0] ?? null,
        settings: { theme: 'light', language: 'en', sidebarOpen: true },
    };
}

async function fetchCurrentUser(event: Parameters<Handle>[0]['event']): Promise<User | null> {
    const cookieHeader = buildAuthCookieHeader(event);
    const accessToken = event.cookies.get('access_token');

    if (!cookieHeader && !accessToken) return null;

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                ...(cookieHeader ? { cookie: cookieHeader } : {}),
                ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
            },
        });
    } catch (error) {
        console.warn('Unable to fetch current user session:', error);
        return null;
    }

    if (!response.ok) return null;

    const body = (await response.json()) as AuthMeResponse;
    return body.data ?? null;
}

async function refreshTokens(event: Parameters<Handle>[0]['event']): Promise<Tokens | null> {
    const refreshToken = event.cookies.get('refresh_token');
    if (!refreshToken) return null;

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/auth/refresh-tokens`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                cookie: `refresh_token=${encodeURIComponent(refreshToken)}`,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    } catch (error) {
        console.warn('Unable to refresh auth session:', error);
        return null;
    }

    if (!response.ok) return null;

    const body = (await response.json()) as RefreshTokensResponse;
    if (!body.tokens) return null;

    setTokenCookies(event, body.tokens);
    return body.tokens;
}

async function resolveSession(event: Parameters<Handle>[0]['event']): Promise<AuthSession | null> {
    const legacySession = readLegacySessionCookie(event);
    if (legacySession?.isAuthenticated) return legacySession;

    let user = await fetchCurrentUser(event);
    if (user) return createSession(user);

    const tokens = await refreshTokens(event);
    if (!tokens) {
        clearTokenCookies(event);
        return null;
    }

    user = await fetchCurrentUser(event);
    return user ? createSession(user, tokens) : null;
}

export const handle: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;
    const isPublicRoute = publicRoutes.some((route) =>
        path === route || path.startsWith(route + '/')
    );
    const shouldCheckSession =
        !isPublicRoute || event.cookies.get('access_token') || event.cookies.get('refresh_token');

    const session = shouldCheckSession ? await resolveSession(event) : null;

    // Attach session to locals for access in load functions
    event.locals.session = session;
    event.locals.user = session?.user ?? null;
    event.locals.isAuthenticated = !!session?.isAuthenticated;

    // Check if route requires authentication
    const isProtectedRoute = protectedRoutes.some((route) =>
        path === route || path.startsWith(route + '/')
    );

    const isAuthRoute = authRoutes.some((route) =>
        path === route || path.startsWith(route + '/')
    );

    // Redirect unauthenticated users trying to access protected routes
    if (isProtectedRoute && !event.locals.isAuthenticated) {
        const redirectUrl = encodeURIComponent(path);
        throw redirect(303, `/auth/login?redirect=${redirectUrl}`);
    }

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && event.locals.isAuthenticated) {
        throw redirect(303, '/dashboard');
    }

    const response = await resolve(event);
    return response;
};

// HandleFetch for adding auth headers to API requests
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    // Add authorization header to API requests
    if (request.url.includes('/api/')) {
        const accessToken = event.locals.session?.tokens?.access?.token ?? event.cookies.get('access_token');
        if (accessToken) {
            request.headers.set('Authorization', `Bearer ${accessToken}`);
        }
    }

    return fetch(request);
};

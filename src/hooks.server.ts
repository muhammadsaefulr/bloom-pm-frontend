import type { Handle, HandleFetch } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/tasks', '/meetings', '/files'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/auth/login', '/auth/register'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/forgot-password', '/auth/reset-password'];

export const handle: Handle = async ({ event, resolve }) => {
    // Get the session token from cookies
    const sessionCookie = event.cookies.get('auth_session');
    let session = null;

    if (sessionCookie) {
        try {
            session = JSON.parse(sessionCookie);
        } catch {
            // Invalid session cookie
            event.cookies.delete('auth_session', { path: '/' });
        }
    }

    // Attach session to locals for access in load functions
    event.locals.session = session;
    event.locals.user = session?.user ?? null;
    event.locals.isAuthenticated = !!session?.isAuthenticated;

    const path = event.url.pathname;

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
        const session = event.locals.session;
        if (session?.accessToken) {
            request.headers.set('Authorization', `Bearer ${session.accessToken}`);
        }
    }

    return fetch(request);
};

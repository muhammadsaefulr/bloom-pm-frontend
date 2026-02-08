// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AuthSession, User } from '$modules/auth/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: AuthSession | null;
			user: User | null;
			isAuthenticated: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };

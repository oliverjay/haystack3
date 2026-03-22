import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	// Cached results so multiple calls in one request don't repeat work
	let sessionCache:
		| {
				session: import('@supabase/supabase-js').Session | null;
				user: import('@supabase/supabase-js').User | null;
		  }
		| undefined;

	// Fast path: reads JWT from cookies only, no network call.
	// Use this for the layout and public pages that just need to know if someone is logged in.
	event.locals.getSessionFast = async () => {
		if (sessionCache !== undefined) return sessionCache.session;

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		return session;
	};

	// Full auth verification: calls getUser() which makes a network round-trip.
	// Only use on protected routes that need verified identity.
	event.locals.safeGetSession = async () => {
		if (sessionCache !== undefined) return sessionCache;

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			sessionCache = { session: null, user: null };
			return sessionCache;
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			sessionCache = { session: null, user: null };
			return sessionCache;
		}

		sessionCache = { session, user };
		return sessionCache;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

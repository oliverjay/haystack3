import { createBrowserClient, parse } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/**
 * Get the browser-side Supabase client. Only call from browser context
 * ($effect, event handlers, onMount, etc.)
 */
export function getSupabase(): SupabaseClient {
	if (!_client) {
		_client = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { fetch },
			cookies: {
				getAll() {
					const parsed = parse(document.cookie);
					return Object.entries(parsed).map(([name, value]) => ({ name, value }));
				},
				setAll(cookiesToSet) {
					for (const { name, value, options } of cookiesToSet) {
						let cookie = `${name}=${value}`;
						if (options?.path) cookie += `; path=${options.path}`;
						if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
						if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
						if (options?.secure) cookie += '; secure';
						document.cookie = cookie;
					}
				}
			}
		});
	}
	return _client;
}

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const redirectTo = url.searchParams.get('redirect') ?? '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.error('[auth/callback] Code exchange failed:', error.message);
			throw redirect(303, `/auth?error=callback_failed&redirect=${encodeURIComponent(redirectTo)}`);
		}
	}

	throw redirect(303, redirectTo);
};

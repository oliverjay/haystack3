import { redirect, error } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId) throw error(400, 'Missing session_id');

	const session = await stripe.checkout.sessions.retrieve(sessionId);

	if (session.payment_status !== 'paid') {
		throw redirect(303, '/');
	}

	const userId = session.metadata?.user_id;
	if (userId) {
		await supabaseAdmin
			.from('devices')
			.upsert(
				{
					id: userId,
					user_id: userId,
					unlocked_at: new Date().toISOString(),
					paid_at: new Date().toISOString(),
					stripe_session_id: sessionId
				},
				{ onConflict: 'id' }
			);
	}

	throw redirect(303, '/');
};

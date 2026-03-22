import { error, json } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const sig = request.headers.get('stripe-signature');

	if (!sig) throw error(400, 'Missing stripe-signature header');

	let event;
	try {
		event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('[stripe webhook] Signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		if (session.payment_status === 'paid') {
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
							stripe_session_id: session.id
						},
						{ onConflict: 'id' }
					);
			}
		}
	}

	return json({ received: true });
};

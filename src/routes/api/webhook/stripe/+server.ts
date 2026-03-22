import { error, json } from '@sveltejs/kit';
import { getStripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const sig = request.headers.get('stripe-signature');

	if (!sig) throw error(400, 'Missing stripe-signature header');

	const stripe = getStripe();
	const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
	if (!webhookSecret) throw error(500, 'Stripe webhook not configured');

	let event;
	try {
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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

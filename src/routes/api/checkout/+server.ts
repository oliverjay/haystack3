import { json, error } from '@sveltejs/kit';
import { getStripe } from '$lib/server/stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { safeGetSession }, url }) => {
	const { session: authSession } = await safeGetSession();
	if (!authSession) {
		throw error(401, 'Not authenticated');
	}

	const userId = authSession.user.id;
	const stripe = getStripe();
	const priceId = env.STRIPE_PRICE_ID;
	if (!priceId) throw error(500, 'Stripe not configured');

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		line_items: [{ price: priceId, quantity: 1 }],
		metadata: { user_id: userId },
		success_url: `${url.origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${url.origin}/`
	});

	return json({ url: session.url });
};

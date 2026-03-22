import { json, error } from '@sveltejs/kit';
import { stripe } from '$lib/server/stripe';
import { STRIPE_PRICE_ID } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals: { safeGetSession }, url }) => {
	const { session: authSession } = await safeGetSession();
	if (!authSession) {
		throw error(401, 'Not authenticated');
	}

	const userId = authSession.user.id;

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
		metadata: { user_id: userId },
		success_url: `${url.origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${url.origin}/`
	});

	return json({ url: session.url });
};

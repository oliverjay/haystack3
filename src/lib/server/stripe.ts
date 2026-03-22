import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

export function getStripe(): Stripe {
	const key = env.STRIPE_SECRET_KEY;
	if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
	return new Stripe(key);
}

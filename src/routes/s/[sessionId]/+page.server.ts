import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const { data: session, error: err } = await supabase
		.from('sessions')
		.select('id, creator_name, creator_emoji, creator_avatar_url')
		.eq('id', params.sessionId)
		.single();

	if (err || !session) {
		throw error(404, "This test doesn't exist.");
	}

	return {
		session: {
			id: session.id,
			creatorName: session.creator_name,
			creatorEmoji: session.creator_emoji,
			creatorAvatarUrl: session.creator_avatar_url ?? null
		}
	};
};

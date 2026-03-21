import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const { data: session, error: sessionErr } = await supabase
		.from('sessions')
		.select('id, creator_name, creator_emoji, creator_avatar_url, creator_device_id')
		.eq('id', params.sessionId)
		.single();

	if (sessionErr || !session) {
		console.error('[share] Session load failed:', sessionErr?.message, sessionErr?.code, 'sessionId:', params.sessionId);
		throw error(404, "This session doesn't exist.");
	}

	const { data: creatorResponse } = await supabase
		.from('responses')
		.select('archetype')
		.eq('session_id', params.sessionId)
		.eq('is_creator', true)
		.single();

	return {
		session: {
			id: session.id,
			creatorName: session.creator_name,
			creatorEmoji: session.creator_emoji,
			creatorAvatarUrl: session.creator_avatar_url ?? null,
			creatorDeviceId: session.creator_device_id
		},
		archetype: creatorResponse?.archetype ?? 'drifter'
	};
};

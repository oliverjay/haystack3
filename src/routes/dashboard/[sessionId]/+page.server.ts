import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const { data: session, error: sessionErr } = await supabase
		.from('sessions')
		.select('id, creator_name, creator_emoji, creator_device_id, creator_phone, creator_avatar_url')
		.eq('id', params.sessionId)
		.single();

	if (sessionErr || !session) {
		console.error('[dashboard] Session load failed:', sessionErr?.message, sessionErr?.code, 'sessionId:', params.sessionId);
		throw error(404, "This test doesn't exist.");
	}

	const { data: matches } = await supabase
		.from('matches')
		.select(`
			id,
			score,
			biggest_tension,
			pair_dynamic,
			creator_response_id,
			responder_response_id,
			created_at
		`)
		.eq('session_id', params.sessionId)
		.order('created_at', { ascending: false });

	const responseIds = new Set<string>();
	for (const m of matches ?? []) {
		responseIds.add(m.creator_response_id);
		responseIds.add(m.responder_response_id);
	}

	const { data: responses } = await supabase
		.from('responses')
		.select('id, responder_name, responder_emoji, archetype, is_creator, avatar_url')
		.in('id', Array.from(responseIds));

	const responseMap = new Map<string, typeof responses extends (infer T)[] | null ? T : never>();
	for (const r of responses ?? []) {
		responseMap.set(r.id, r);
	}

	const matchList = (matches ?? []).map((m) => {
		const creator = responseMap.get(m.creator_response_id);
		const responder = responseMap.get(m.responder_response_id);
		return {
			id: m.id,
			score: m.score,
			pairDynamic: m.pair_dynamic,
			otherName: responder?.responder_name ?? 'Unknown',
			otherEmoji: responder?.responder_emoji ?? '❓',
			otherArchetype: responder?.archetype ?? 'drifter',
			otherAvatarUrl: responder?.avatar_url ?? null
		};
	});

	return {
		session: {
			id: session.id,
			creatorName: session.creator_name,
			creatorEmoji: session.creator_emoji,
			creatorAvatarUrl: session.creator_avatar_url ?? null,
			creatorDeviceId: session.creator_device_id,
			hasPhone: !!session.creator_phone
		},
		matches: matchList
	};
};

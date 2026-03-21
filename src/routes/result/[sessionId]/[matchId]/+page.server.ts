import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const { data: match, error: matchErr } = await supabase
		.from('matches')
		.select(`
			id,
			score,
			question_scores,
			biggest_tension,
			strongest_alignment,
			pair_dynamic,
			creator_agree,
			responder_agree,
			creator_response_id,
			responder_response_id
		`)
		.eq('id', params.matchId)
		.single();

	if (matchErr || !match) {
		throw error(404, "This result doesn't exist.");
	}

	const { data: creatorResp } = await supabase
		.from('responses')
		.select('responder_name, responder_emoji, archetype, completion_seconds, avatar_url')
		.eq('id', match.creator_response_id)
		.single();

	const { data: responderResp } = await supabase
		.from('responses')
		.select('responder_name, responder_emoji, archetype, completion_seconds, avatar_url')
		.eq('id', match.responder_response_id)
		.single();

	if (!creatorResp || !responderResp) {
		throw error(404, 'Could not load match participants.');
	}

	return {
		match: {
			id: match.id,
			score: match.score,
			biggestTension: match.biggest_tension,
			strongestAlignment: match.strongest_alignment,
			pairDynamic: match.pair_dynamic,
			creatorAgree: match.creator_agree,
			responderAgree: match.responder_agree
		},
		creator: {
			name: creatorResp.responder_name,
			emoji: creatorResp.responder_emoji,
			avatarUrl: creatorResp.avatar_url ?? null,
			archetype: creatorResp.archetype,
			seconds: creatorResp.completion_seconds
		},
		responder: {
			name: responderResp.responder_name,
			emoji: responderResp.responder_emoji,
			avatarUrl: responderResp.avatar_url ?? null,
			archetype: responderResp.archetype,
			seconds: responderResp.completion_seconds
		},
		sessionId: params.sessionId
	};
};

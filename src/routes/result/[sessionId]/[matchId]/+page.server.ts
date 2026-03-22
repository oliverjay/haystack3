import { error, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession } }) => {
	const { session: authSession } = await safeGetSession();
	if (!authSession) {
		throw redirect(303, `/auth?redirect=${encodeURIComponent(`/result/${params.sessionId}/${params.matchId}`)}`);
	}

	// Fetch match and session ownership in parallel
	const [matchResult, sessionDataResult, viewerSessionResult] = await Promise.all([
		supabaseAdmin
			.from('matches')
			.select(
				'id, score, question_scores, biggest_tension, strongest_alignment, pair_dynamic, creator_agree, responder_agree, creator_response_id, responder_response_id'
			)
			.eq('id', params.matchId)
			.maybeSingle(),
		supabaseAdmin
			.from('sessions')
			.select('user_id')
			.eq('id', params.sessionId)
			.maybeSingle(),
		supabaseAdmin
			.from('sessions')
			.select('invite_code')
			.eq('user_id', authSession.user.id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle(),
	]);

	const match = matchResult.data;
	if (matchResult.error || !match) {
		throw error(404, "This result doesn't exist.");
	}

	// Fetch both participants in parallel (include answers for trait profile computation)
	const [creatorRespResult, responderRespResult] = await Promise.all([
		supabaseAdmin
			.from('responses')
			.select('responder_name, responder_emoji, archetype, completion_seconds, avatar_url, answers')
			.eq('id', match.creator_response_id)
			.maybeSingle(),
		supabaseAdmin
			.from('responses')
			.select('responder_name, responder_emoji, archetype, completion_seconds, avatar_url, answers')
			.eq('id', match.responder_response_id)
			.maybeSingle(),
	]);

	const creatorResp = creatorRespResult.data;
	const responderResp = responderRespResult.data;

	if (!creatorResp || !responderResp) {
		throw error(404, 'Could not load match participants.');
	}

	const isSessionOwner = sessionDataResult.data?.user_id === authSession.user.id;
	const viewerSession = viewerSessionResult.data;

	// Fetch viewer's archetype from their creator response
	let viewerArchetype: string | null = null;
	if (!isSessionOwner && viewerSession) {
		const { data: viewerResp } = await supabaseAdmin
			.from('responses')
			.select('archetype')
			.eq('user_id', authSession.user.id)
			.eq('is_creator', true)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();
		viewerArchetype = viewerResp?.archetype ?? null;
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
			seconds: creatorResp.completion_seconds,
			answers: (creatorResp.answers ?? []) as number[]
		},
		responder: {
			name: responderResp.responder_name,
			emoji: responderResp.responder_emoji,
			avatarUrl: responderResp.avatar_url ?? null,
			archetype: responderResp.archetype,
			seconds: responderResp.completion_seconds,
			answers: (responderResp.answers ?? []) as number[]
		},
		sessionId: params.sessionId,
		isSessionOwner,
		viewerInviteCode: viewerSession?.invite_code ?? null,
		viewerArchetype
	};
};

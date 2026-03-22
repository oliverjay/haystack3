import { error, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { safeGetSession } }) => {
	const { session: authSession } = await safeGetSession();
	if (!authSession) {
		throw redirect(303, `/auth?redirect=${encodeURIComponent(`/dashboard/${params.sessionId}`)}`);
	}

	const userId = authSession.user.id;

	// Run session fetch, creator response, creator matches, and user's responder responses in parallel
	const [sessionResult, creatorResponseResult, creatorMatchesResult, userResponsesResult] =
		await Promise.all([
			supabaseAdmin
				.from('sessions')
				.select('id, creator_name, creator_emoji, creator_avatar_url, user_id, invite_code')
				.eq('id', params.sessionId)
				.maybeSingle(),
			supabaseAdmin
				.from('responses')
				.select('archetype')
				.eq('session_id', params.sessionId)
				.eq('is_creator', true)
				.maybeSingle(),
			supabaseAdmin
				.from('matches')
				.select(
					'id, session_id, score, biggest_tension, pair_dynamic, creator_response_id, responder_response_id, created_at'
				)
				.eq('session_id', params.sessionId)
				.order('created_at', { ascending: false }),
			supabaseAdmin
				.from('responses')
				.select('id')
				.eq('user_id', userId)
				.eq('is_creator', false),
		]);

	const session = sessionResult.data;
	if (sessionResult.error || !session) {
		throw error(404, "This test doesn't exist.");
	}

	if (session.user_id !== userId) {
		throw error(403, "You don't have access to this session.");
	}

	const creatorResponse = creatorResponseResult.data;
	const creatorMatches = creatorMatchesResult.data;

	const responderResponseIds = (userResponsesResult.data ?? []).map((r) => r.id);

	const { data: responderMatches } =
		responderResponseIds.length > 0
			? await supabaseAdmin
					.from('matches')
					.select(
						'id, session_id, score, biggest_tension, pair_dynamic, creator_response_id, responder_response_id, created_at'
					)
					.in('responder_response_id', responderResponseIds)
					.order('created_at', { ascending: false })
			: { data: [] };

	// Combine and deduplicate
	const seenMatchIds = new Set<string>();
	const allMatches = [];
	for (const m of [...(creatorMatches ?? []), ...(responderMatches ?? [])]) {
		if (!seenMatchIds.has(m.id)) {
			seenMatchIds.add(m.id);
			allMatches.push(m);
		}
	}
	allMatches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

	// Load response details for all matches
	const responseIds = new Set<string>();
	for (const m of allMatches) {
		responseIds.add(m.creator_response_id);
		responseIds.add(m.responder_response_id);
	}

	const { data: responses } =
		responseIds.size > 0
			? await supabaseAdmin
					.from('responses')
					.select(
						'id, responder_name, responder_emoji, archetype, is_creator, avatar_url, user_id'
					)
					.in('id', Array.from(responseIds))
			: { data: [] };

	const responseMap = new Map<string, typeof responses extends (infer T)[] | null ? T : never>();
	for (const r of responses ?? []) {
		responseMap.set(r.id, r);
	}

	const matchList = allMatches.map((m) => {
		const creatorResp = responseMap.get(m.creator_response_id);
		const responderResp = responseMap.get(m.responder_response_id);

		// Show the "other" person — if this user is the creator, show responder and vice versa
		const isUserCreator = creatorResp?.user_id === userId;
		const other = isUserCreator ? responderResp : creatorResp;

		return {
			id: m.id,
			sessionId: m.session_id,
			score: m.score,
			pairDynamic: m.pair_dynamic,
			biggestTension: m.biggest_tension,
			otherName: other?.responder_name ?? 'Unknown',
			otherEmoji: other?.responder_emoji ?? '❓',
			otherArchetype: other?.archetype ?? 'guardian',
			otherAvatarUrl: other?.avatar_url ?? null
		};
	});

	return {
		session: {
			id: session.id,
			creatorName: session.creator_name,
			creatorEmoji: session.creator_emoji,
			creatorAvatarUrl: session.creator_avatar_url ?? null,
			inviteCode: session.invite_code,
			userId: session.user_id
		},
		archetype: (creatorResponse?.archetype as string) ?? 'guardian',
		matches: matchList
	};
};

import { supabaseAdmin } from '$lib/server/supabase';
import { error, redirect, fail } from '@sveltejs/kit';
import { computeScore } from '$lib/scoring';
import { generateInviteCode } from '$lib/invite-code';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals: { getSessionFast } }) => {
	const { data: session, error: err } = await supabaseAdmin
		.from('sessions')
		.select('id, creator_name, creator_emoji, creator_avatar_url, invite_code, user_id')
		.eq('invite_code', params.inviteCode)
		.single();

	if (err || !session) {
		throw error(404, "This invite link doesn't exist.");
	}

	const authSession = await getSessionFast();

	let returningUser: {
		name: string;
		emoji: string;
		avatarUrl: string | null;
		archetype: string;
		alreadyMatchedId: string | null;
		alreadyMatchedSessionId: string | null;
		isOwnLink: boolean;
	} | null = null;

	if (authSession) {
		const userId = authSession.user.id;
		const isOwnLink = session.user_id === userId;

		if (isOwnLink) {
			// Find their own dashboard session
			const { data: ownSession } = await supabaseAdmin
				.from('sessions')
				.select('id')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			if (ownSession) {
				throw redirect(303, `/dashboard/${ownSession.id}`);
			}
		}

		// Check if this user already has a response (from their own session)
		const { data: existingResponse } = await supabaseAdmin
			.from('responses')
			.select('id, responder_name, responder_emoji, avatar_url, archetype, answers')
			.eq('user_id', userId)
			.eq('is_creator', true)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (existingResponse) {
			// Check if they already have a match with this session
			const { data: existingMatch } = await supabaseAdmin
				.from('matches')
				.select('id')
				.eq('session_id', session.id)
				.or(`creator_response_id.eq.${existingResponse.id},responder_response_id.eq.${existingResponse.id}`)
				.maybeSingle();

			// Also check via user_id on the responder side
			let alreadyMatchedId: string | null = existingMatch?.id ?? null;
			let alreadyMatchedSessionId: string | null = existingMatch ? session.id : null;

			if (!alreadyMatchedId) {
				const { data: responderResponse } = await supabaseAdmin
					.from('responses')
					.select('id')
					.eq('session_id', session.id)
					.eq('user_id', userId)
					.eq('is_creator', false)
					.maybeSingle();

				if (responderResponse) {
					const { data: matchViaResp } = await supabaseAdmin
						.from('matches')
						.select('id')
						.eq('responder_response_id', responderResponse.id)
						.maybeSingle();

					if (matchViaResp) {
						alreadyMatchedId = matchViaResp.id;
						alreadyMatchedSessionId = session.id;
					}
				}
			}

			returningUser = {
				name: existingResponse.responder_name,
				emoji: existingResponse.responder_emoji,
				avatarUrl: existingResponse.avatar_url ?? null,
				archetype: existingResponse.archetype,
				alreadyMatchedId,
				alreadyMatchedSessionId,
				isOwnLink: false
			};
		}
	}

	return {
		session: {
			id: session.id,
			inviteCode: session.invite_code,
			creatorName: session.creator_name,
			creatorEmoji: session.creator_emoji,
			creatorAvatarUrl: session.creator_avatar_url ?? null
		},
		returningUser
	};
};

export const actions: Actions = {
	instantMatch: async ({ params, locals: { safeGetSession } }) => {
		const { session: authSession } = await safeGetSession();
		if (!authSession) return fail(401, { message: 'Not logged in' });

		const userId = authSession.user.id;

		const { data: session } = await supabaseAdmin
			.from('sessions')
			.select('id, user_id')
			.eq('invite_code', params.inviteCode)
			.single();

		if (!session) return fail(404, { message: 'Session not found' });
		if (session.user_id === userId) return fail(400, { message: "Can't match with yourself" });

		// Get the logged-in user's existing creator response (their answers)
		const { data: myResponse } = await supabaseAdmin
			.from('responses')
			.select('id, responder_name, responder_emoji, avatar_url, archetype, answers, completion_seconds')
			.eq('user_id', userId)
			.eq('is_creator', true)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle();

		if (!myResponse) return fail(400, { message: 'No existing quiz data found' });

		// Check for duplicate match
		const { data: existingResp } = await supabaseAdmin
			.from('responses')
			.select('id')
			.eq('session_id', session.id)
			.eq('user_id', userId)
			.eq('is_creator', false)
			.maybeSingle();

		if (existingResp) {
			const { data: existingMatch } = await supabaseAdmin
				.from('matches')
				.select('id')
				.eq('responder_response_id', existingResp.id)
				.maybeSingle();

			if (existingMatch) {
				throw redirect(303, `/result/${session.id}/${existingMatch.id}`);
			}
		}

		// Get the creator's response for this session
		const { data: creatorResponse } = await supabaseAdmin
			.from('responses')
			.select('id, answers, archetype')
			.eq('session_id', session.id)
			.eq('is_creator', true)
			.single();

		if (!creatorResponse) return fail(400, { message: 'Creator response not found' });

		// Insert responder response into the creator's session
		const respInsert: Record<string, unknown> = {
			session_id: session.id,
			responder_name: myResponse.responder_name,
			responder_emoji: myResponse.responder_emoji,
			device_id: userId,
			user_id: userId,
			answers: myResponse.answers,
			archetype: myResponse.archetype,
			completion_seconds: myResponse.completion_seconds,
			is_creator: false
		};
		if (myResponse.avatar_url) respInsert.avatar_url = myResponse.avatar_url;

		const { data: newResp, error: respErr } = await supabaseAdmin
			.from('responses')
			.insert(respInsert)
			.select('id')
			.single();

		if (respErr || !newResp) return fail(500, { message: 'Failed to create response' });

		// Compute and insert match
		const result = computeScore(
			creatorResponse.answers as number[],
			myResponse.answers as number[]
		);

		const { data: match, error: matchErr } = await supabaseAdmin
			.from('matches')
			.insert({
				session_id: session.id,
				creator_response_id: creatorResponse.id,
				responder_response_id: newResp.id,
				score: result.score,
				question_scores: result.questionScores,
				biggest_tension: result.biggestTension,
				strongest_alignment: result.strongestAlignment,
				pair_dynamic: result.pairDynamic
			})
			.select('id')
			.single();

		if (matchErr || !match) return fail(500, { message: 'Failed to create match' });

		throw redirect(303, `/result/${session.id}/${match.id}`);
	}
};

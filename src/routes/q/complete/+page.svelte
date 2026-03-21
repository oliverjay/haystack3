<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { supabase } from '$lib/supabase';
	import { getDeviceId, setMySessionId } from '$lib/device';
	import { computeScore } from '$lib/scoring';

	let status = $state<'saving' | 'done' | 'error'>('saving');
	let errorMsg = $state('');
	let ran = false;

	$effect(() => {
		if (!browser || ran) return;
		ran = true;
		runSave();
	});

	async function runSave() {
		const params = $page.url.searchParams;
		const name = params.get('name') ?? '';
		const emoji = params.get('emoji') ?? '';
		const avatarUrl = params.get('avatarUrl') || null;
		const answersRaw = params.get('answers') ?? '[]';
		const seconds = Number(params.get('seconds') ?? '0');
		const isCreator = params.get('creator') === '1';
		const sessionId = params.get('s');

		if (!name || !emoji) {
			status = 'error';
			errorMsg = 'Missing quiz data. Please start over.';
			return;
		}

		let answers: number[];
		try {
			answers = JSON.parse(answersRaw);
			if (!Array.isArray(answers) || answers.length !== 10) throw new Error();
		} catch {
			status = 'error';
			errorMsg = 'Invalid quiz data.';
			return;
		}

		const deviceId = getDeviceId();
		const archetype = computeArchetype(answers);

		const timeout = setTimeout(() => {
			if (status === 'saving') {
				status = 'error';
				errorMsg = 'Could not reach the server. Check your connection and try again.';
			}
		}, 8000);

		try {
			if (isCreator) {
				await handleCreator(name, emoji, avatarUrl, deviceId, answers, archetype, seconds);
			} else if (sessionId) {
				await handleResponder(sessionId, name, emoji, avatarUrl, deviceId, answers, archetype, seconds);
			} else {
				status = 'error';
				errorMsg = 'Missing session. Please try again.';
			}
		} catch (err) {
			console.error('[complete] Save error:', err);
			status = 'error';
			errorMsg = 'Something went wrong. Your answers are saved locally — try again in a moment.';
		} finally {
			clearTimeout(timeout);
		}
	}

	function computeArchetype(answers: number[]): string {
		const socialEnergy = (answers[0] + answers[8]) / 2;
		const emotionalStyle = (answers[2] + answers[3] + answers[7]) / 3;
		const structure = (answers[4] + answers[5] + answers[9]) / 3;

		const sparkScore = socialEnergy * 0.6 + (100 - structure) * 0.2 + emotionalStyle * 0.2;
		const mirrorScore = (100 - socialEnergy) * 0.3 + emotionalStyle * 0.5 + (100 - structure) * 0.2;
		const anchorScore = (100 - socialEnergy) * 0.3 + (100 - emotionalStyle) * 0.3 + structure * 0.4;
		const compassScore = (100 - emotionalStyle) * 0.3 + structure * 0.5 + socialEnergy * 0.2;

		const midRange =
			Math.abs(50 - socialEnergy) < 10 &&
			Math.abs(50 - emotionalStyle) < 10 &&
			Math.abs(50 - structure) < 10;
		const drifterScore = midRange ? 55 : 20;

		const scores: [string, number][] = [
			['spark', sparkScore],
			['mirror', mirrorScore],
			['anchor', anchorScore],
			['compass', compassScore],
			['drifter', drifterScore]
		];

		scores.sort((a, b) => b[1] - a[1]);
		return scores[0][0];
	}

	async function handleCreator(
		name: string,
		emoji: string,
		avatarUrl: string | null,
		deviceId: string,
		answers: number[],
		archetype: string,
		seconds: number
	) {
		await supabase.from('devices').upsert({ id: deviceId, completed_matches: 0 }, { onConflict: 'id' });

		const sessionInsert: Record<string, unknown> = { creator_name: name, creator_emoji: emoji, creator_device_id: deviceId };
		if (avatarUrl) sessionInsert.creator_avatar_url = avatarUrl;

		const { data: session, error: sessionErr } = await supabase
			.from('sessions')
			.insert(sessionInsert)
			.select('id')
			.single();

		if (sessionErr || !session) throw sessionErr;

		const responseInsert: Record<string, unknown> = {
			session_id: session.id,
			responder_name: name,
			responder_emoji: emoji,
			device_id: deviceId,
			answers,
			archetype,
			completion_seconds: seconds,
			is_creator: true
		};
		if (avatarUrl) responseInsert.avatar_url = avatarUrl;

		const { error: responseErr } = await supabase.from('responses').insert(responseInsert);

		if (responseErr) throw responseErr;

		setMySessionId(session.id);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(`haystack_auto_session_${deviceId}`, session.id);
		}

		status = 'done';
		goto(`/share/${session.id}`);
	}

	async function handleResponder(
		sessionId: string,
		name: string,
		emoji: string,
		avatarUrl: string | null,
		deviceId: string,
		answers: number[],
		archetype: string,
		seconds: number
	) {
		const responseInsert: Record<string, unknown> = {
			session_id: sessionId,
			responder_name: name,
			responder_emoji: emoji,
			device_id: deviceId,
			answers,
			archetype,
			completion_seconds: seconds,
			is_creator: false
		};
		if (avatarUrl) responseInsert.avatar_url = avatarUrl;

		const { data: response, error: responseErr } = await supabase
			.from('responses')
			.insert(responseInsert)
			.select('id')
			.single();

		if (responseErr || !response) throw responseErr;

		const { data: creatorResponse, error: creatorErr } = await supabase
			.from('responses')
			.select('id, answers, archetype, responder_name, responder_emoji')
			.eq('session_id', sessionId)
			.eq('is_creator', true)
			.single();

		if (creatorErr || !creatorResponse) throw creatorErr;

		const result = computeScore(creatorResponse.answers as number[], answers);

		const { data: match, error: matchErr } = await supabase
			.from('matches')
			.insert({
				session_id: sessionId,
				creator_response_id: creatorResponse.id,
				responder_response_id: response.id,
				score: result.score,
				question_scores: result.questionScores,
				biggest_tension: result.biggestTension,
				strongest_alignment: result.strongestAlignment,
				pair_dynamic: result.pairDynamic
			})
			.select('id')
			.single();

		if (matchErr || !match) throw matchErr;

		const { data: session } = await supabase
			.from('sessions')
			.select('creator_device_id')
			.eq('id', sessionId)
			.single();

		if (session?.creator_device_id) {
			try {
				const { data: device } = await supabase
					.from('devices')
					.select('completed_matches')
					.eq('id', session.creator_device_id)
					.single();
				if (device) {
					await supabase
						.from('devices')
						.update({ completed_matches: (device.completed_matches ?? 0) + 1 })
						.eq('id', session.creator_device_id);
				}
			} catch {
				// Non-critical
			}
		}

		await supabase.from('devices').upsert({ id: deviceId, completed_matches: 0 }, { onConflict: 'id' });

		const autoSessionInsert: Record<string, unknown> = { creator_name: name, creator_emoji: emoji, creator_device_id: deviceId };
		if (avatarUrl) autoSessionInsert.creator_avatar_url = avatarUrl;

		const { data: autoSession } = await supabase
			.from('sessions')
			.insert(autoSessionInsert)
			.select('id')
			.single();

		if (autoSession) {
			const autoRespInsert: Record<string, unknown> = {
				session_id: autoSession.id,
				responder_name: name,
				responder_emoji: emoji,
				device_id: deviceId,
				answers,
				archetype,
				completion_seconds: seconds,
				is_creator: true
			};
			if (avatarUrl) autoRespInsert.avatar_url = avatarUrl;

			await supabase.from('responses').insert(autoRespInsert);

			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(`haystack_auto_session_${deviceId}`, autoSession.id);
			}
		}

		status = 'done';
		goto(`/result/${sessionId}/${match.id}`);
	}
</script>

<main style="
	display: flex;
	min-height: 100dvh;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 20px;
	background: var(--color-cream);
">
	{#if status === 'saving'}
		<div style="text-align: center; animation: fadeIn 300ms ease;">
			<!-- Pulsing dots loader -->
			<div style="
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 6px;
				margin-bottom: 20px;
			">
				{#each [0, 1, 2] as i}
					<div style="
						width: 8px;
						height: 8px;
						border-radius: 50%;
						background: var(--color-secondary);
						opacity: 0.3;
						animation: pulse 1.2s ease-in-out infinite;
						animation-delay: {i * 200}ms;
					"></div>
				{/each}
			</div>
			<p style="font-size: 0.9375rem; color: var(--color-secondary); margin: 0;">Crunching your answers...</p>
		</div>
	{:else if status === 'error'}
		<div style="text-align: center; max-width: 300px;">
			<div style="
				width: 56px;
				height: 56px;
				border-radius: 50%;
				background: var(--color-surface);
				border: 1.5px solid var(--color-border);
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 1.5rem;
				margin: 0 auto 16px;
			">😬</div>
			<p style="font-size: 0.9375rem; color: var(--color-secondary); margin: 0 0 24px; line-height: 1.5;">{errorMsg}</p>
			<a
				href="/"
				style="
					display: inline-block;
					border-radius: 100px;
					background: var(--color-accent);
					padding: 14px 28px;
					font-weight: 700;
					font-size: 0.9375rem;
					color: white;
					text-decoration: none;
				"
			>Start over</a>
		</div>
	{/if}
</main>

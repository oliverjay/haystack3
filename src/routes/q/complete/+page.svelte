<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { getSupabase } from '$lib/supabase';
	import { computeScore, assignArchetype } from '$lib/scoring';
	import { TOTAL_QUESTIONS } from '$lib/questions';
	import { generateInviteCode } from '$lib/invite-code';
	import { markMatchRevealed } from '$lib/device';
	import Logo from '$lib/components/Logo.svelte';

	type Status = 'loading' | 'email' | 'saving' | 'error';
	let status = $state<Status>('loading');
	let errorMsg = $state('');
	let email = $state('');
	let emailSending = $state(false);
	let ran = false;

	let quizData: Record<string, string> | null = null;

	$effect(() => {
		if (!browser || ran) return;
		ran = true;
		init();
	});

	async function init() {
		quizData = extractQuizData();
		if (!quizData || !quizData.name) {
			status = 'error';
			errorMsg = 'Missing quiz data. Please start over.';
			return;
		}

		const supabase = getSupabase();
		const { data: { user }, error: userErr } = await supabase.auth.getUser();
		if (user && !userErr) {
			status = 'saving';
			await runSave(quizData, user.id);
		} else {
			// Clear stale session if the server rejected it
			if (userErr) {
				console.log('[complete] Stale session detected, clearing');
				await supabase.auth.signOut();
			}
			status = 'email';
		}
	}

	function extractQuizData(): Record<string, string> | null {
		const params = $page.url.searchParams;
		const name = params.get('name');
		if (!name) return null;
		const obj: Record<string, string> = {};
		for (const [k, v] of params.entries()) {
			obj[k] = v;
		}
		return obj;
	}

	async function submitEmail() {
		const trimmed = email.trim().toLowerCase();
		if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
			errorMsg = 'Please enter a valid email.';
			return;
		}
		if (!quizData) return;

		errorMsg = '';
		emailSending = true;

		const supabase = getSupabase();
		const password = crypto.randomUUID();

		// Try sign up first
		const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
			email: trimmed,
			password
		});

		if (signUpErr) {
			console.error('[complete] Sign up error:', signUpErr);
			// User already exists — fall through to existing account flow
			await handleExistingAccount(supabase, trimmed);
			return;
		}

		// Supabase returns a user with no identities when the email already exists
		// (instead of an error, for security reasons)
		const isRealNewUser = signUpData.user?.identities && signUpData.user.identities.length > 0;

		if (!isRealNewUser) {
			await handleExistingAccount(supabase, trimmed);
			return;
		}

		if (signUpData.session) {
			// Auto-confirm is ON — we have a session immediately
			status = 'saving';
			await runSave(quizData, signUpData.session.user.id);
		} else if (signUpData.user) {
			// Auto-confirm is OFF — try signing in with the password we just set
			const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
				email: trimmed,
				password
			});

			if (signInErr || !signInData.session) {
				// Email confirmation is required and blocking — tell user to check email
				errorMsg = 'Please check your email to confirm your account, then come back to this page.';
				emailSending = false;
				return;
			}

			status = 'saving';
			await runSave(quizData, signInData.session.user.id);
		} else {
			errorMsg = 'Something went wrong. Please try again.';
			emailSending = false;
		}
	}

	async function handleExistingAccount(supabase: ReturnType<typeof getSupabase>, trimmedEmail: string) {
		errorMsg = 'This email already has an account. We sent a login link — check your inbox, then come back.';
		await supabase.auth.signInWithOtp({
			email: trimmedEmail,
			options: {
				emailRedirectTo: browser
					? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(window.location.href)}`
					: '/'
			}
		});
		emailSending = false;
	}

	async function runSave(data: Record<string, string>, userId: string) {
		const name = data.name ?? '';
		const emoji = data.emoji ?? '';
		const avatarUrl = data.avatarUrl || null;
		const answersRaw = data.answers ?? '[]';
		const seconds = Number(data.seconds ?? '0');
		const isCreator = data.creator === '1';
		const sessionId = data.s || null;

		if (!name || !emoji) {
			status = 'error';
			errorMsg = 'Missing quiz data. Please start over.';
			return;
		}

		let answers: number[];
		try {
			answers = JSON.parse(answersRaw);
			if (!Array.isArray(answers) || answers.length !== TOTAL_QUESTIONS) throw new Error();
		} catch {
			status = 'error';
			errorMsg = 'Invalid quiz data.';
			return;
		}

		const archetype = assignArchetype(answers);

		const timeout = setTimeout(() => {
			if (status === 'saving') {
				status = 'error';
				errorMsg = 'Could not reach the server. Check your connection and try again.';
			}
		}, 15000);

		try {
			if (isCreator) {
				await handleCreator(name, emoji, avatarUrl, userId, answers, archetype, seconds);
			} else if (sessionId) {
				await handleResponder(sessionId, name, emoji, avatarUrl, userId, answers, archetype, seconds);
			} else {
				status = 'error';
				errorMsg = 'Missing session. Please try again.';
			}
		} catch (err) {
			console.error('[complete] Save error:', err);
			status = 'error';
			errorMsg = 'Something went wrong saving your results. Please try again.';
		} finally {
			clearTimeout(timeout);
		}
	}

	async function handleCreator(
		name: string,
		emoji: string,
		avatarUrl: string | null,
		userId: string,
		answers: number[],
		archetype: string,
		seconds: number
	) {
		const supabase = getSupabase();
		const inviteCode = generateInviteCode();

		const sessionInsert: Record<string, unknown> = {
			creator_name: name,
			creator_emoji: emoji,
			creator_device_id: userId,
			user_id: userId,
			invite_code: inviteCode,
			creator_email: (await supabase.auth.getUser()).data.user?.email ?? null
		};
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
			device_id: userId,
			user_id: userId,
			answers,
			archetype,
			completion_seconds: seconds,
			is_creator: true
		};
		if (avatarUrl) responseInsert.avatar_url = avatarUrl;

		const { error: responseErr } = await supabase.from('responses').insert(responseInsert);
		if (responseErr) throw responseErr;

		goto(`/dashboard/${session.id}`, { replaceState: true });
	}

	async function handleResponder(
		sessionId: string,
		name: string,
		emoji: string,
		avatarUrl: string | null,
		userId: string,
		answers: number[],
		archetype: string,
		seconds: number
	) {
		const supabase = getSupabase();
		const responseInsert: Record<string, unknown> = {
			session_id: sessionId,
			responder_name: name,
			responder_emoji: emoji,
			device_id: userId,
			user_id: userId,
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

		// Create auto-session for the responder so they can share their own link
		const inviteCode = generateInviteCode();
		const autoSessionInsert: Record<string, unknown> = {
			creator_name: name,
			creator_emoji: emoji,
			creator_device_id: userId,
			user_id: userId,
			invite_code: inviteCode,
			creator_email: (await supabase.auth.getUser()).data.user?.email ?? null
		};
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
				device_id: userId,
				user_id: userId,
				answers,
				archetype,
				completion_seconds: seconds,
				is_creator: true
			};
			if (avatarUrl) autoRespInsert.avatar_url = avatarUrl;
			await supabase.from('responses').insert(autoRespInsert);
		}

		markMatchRevealed(match.id);
		goto(`/result/${sessionId}/${match.id}`, { replaceState: true });
	}
</script>

<main style="
	display: flex;
	min-height: 100dvh;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24px 20px;
	background: var(--color-cream);
">
	{#if status === 'loading' || status === 'saving'}
		<div style="text-align: center; animation: fadeIn 300ms ease;">
			<div style="
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				margin-bottom: 20px;
			">
				{#each [0, 1, 2] as i}
					<div style="
						width: 10px;
						height: 10px;
						border-radius: 50%;
						background: var(--color-accent);
						opacity: 0.3;
						animation: pulse 1.2s ease-in-out infinite;
						animation-delay: {i * 200}ms;
					"></div>
				{/each}
			</div>
			<p style="font-family: var(--font-display); font-size: 1.0625rem; font-style: italic; color: var(--color-secondary); margin: 0;">
				{status === 'loading' ? 'Loading...' : 'Saving your results...'}
			</p>
		</div>

	{:else if status === 'email'}
		<div style="width: 100%; max-width: 340px; text-align: center;">
			<div style="margin-bottom: 24px;">
				<Logo size="sm" />
			</div>
			<div style="
				font-size: 2.5rem;
				margin-bottom: 16px;
			">🎉</div>
			<h2 style="
				font-family: var(--font-display);
				font-size: 1.5rem;
				font-weight: 400;
				margin: 0 0 8px;
				letter-spacing: -0.02em;
			">Quiz complete!</h2>
			<p style="
				font-size: 0.9375rem;
				color: var(--color-secondary);
				margin: 0 0 28px;
				line-height: 1.5;
			">Enter your email to save your results and get your link.</p>

			<form
				onsubmit={(e) => { e.preventDefault(); submitEmail(); }}
				style="display: flex; flex-direction: column; gap: 14px;"
			>
				<input
					bind:value={email}
					type="email"
					placeholder="you@email.com"
					autocomplete="email"
					autofocus
					disabled={emailSending}
					style="
						width: 100%;
						border-radius: 16px;
						background: var(--color-input-bg);
						padding: 16px;
						font-size: 1.125rem;
						outline: none;
						border: 1.5px solid var(--color-border);
						color: var(--color-primary);
						font-family: inherit;
						transition: border-color 200ms ease;
						box-sizing: border-box;
						opacity: {emailSending ? 0.6 : 1};
					"
				/>

				{#if errorMsg}
					<p style="font-size: 0.8125rem; color: var(--color-accent); margin: 0;">{errorMsg}</p>
				{/if}

				<button
					type="submit"
					disabled={emailSending || !email.trim()}
					style="
						width: 100%;
						border-radius: 100px;
						background: var(--color-accent);
						padding: 16px 24px;
						font-size: 1.0625rem;
						font-weight: 700;
						color: white;
						border: none;
						cursor: pointer;
						opacity: {emailSending || !email.trim() ? 0.5 : 1};
						transition: opacity 200ms ease;
						box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
					"
				>
					{emailSending ? 'Creating account...' : 'Save my results'}
				</button>
			</form>

			<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 20px 0 0; line-height: 1.5;">
				We'll create an account so you can access your results anytime.
			</p>
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

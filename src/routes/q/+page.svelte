<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { questions, EMOJI_OPTIONS } from '$lib/questions';
	import { loadQuizState, saveQuizState, clearQuizState } from '$lib/quiz-state';
	import { supabase } from '$lib/supabase';
	import BinaryInput from '$lib/components/BinaryInput.svelte';
	import SliderInput from '$lib/components/SliderInput.svelte';
	import SpectrumInput from '$lib/components/SpectrumInput.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarPicker from '$lib/components/AvatarPicker.svelte';
	import { browser } from '$app/environment';

	let sessionId = $derived($page.url.searchParams.get('s') ?? undefined);
	let isCreator = $derived(!sessionId);
	let creatorName = $state<string | null>(null);

	type Phase = 'name' | 'questions' | 'halfway';
	let phase = $state<Phase>('name');
	let name = $state('');
	let emoji = $state('');
	let avatarUrl = $state<string | null>(null);
	let showPicker = $state(false);
	let answers = $state<(number | null)[]>(Array(10).fill(null));
	let currentQ = $state(0);
	let startedAt = $state<number | undefined>(undefined);
	let questionVisible = $state(false);
	let tensionLine = $state<string | null>(null);
	let halfwayVisible = $state(false);
	let direction = $state<'forward' | 'back'>('forward');
	let transitioning = $state(false);
	let quizLoaded = false;

	$effect(() => {
		if (!browser || quizLoaded) return;
		quizLoaded = true;
		const saved = loadQuizState(sessionId, isCreator);
		name = saved.name;
		emoji = saved.emoji || EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)];
		avatarUrl = saved.avatarUrl ?? null;
		answers = saved.answers;
		currentQ = saved.currentQuestion;
		startedAt = saved.startedAt;

		if (saved.name && saved.currentQuestion > 0) {
			phase = 'questions';
			questionVisible = true;
		}

		if (sessionId) {
			supabase
				.from('sessions')
				.select('creator_name')
				.eq('id', sessionId)
				.single()
				.then(({ data }) => {
					if (data?.creator_name) creatorName = data.creator_name;
				});
		}
	});

	function handleAvatarSelect(newEmoji: string, newAvatarUrl: string | null) {
		emoji = newEmoji;
		avatarUrl = newAvatarUrl;
		showPicker = false;
		save();
	}

	function save() {
		saveQuizState(
			{ sessionId, name, emoji, avatarUrl, answers, currentQuestion: currentQ, startedAt, isCreator },
			sessionId
		);
	}

	function submitName() {
		if (!name.trim()) return;
		phase = 'questions';
		startedAt = Date.now();
		save();
		setTimeout(() => (questionVisible = true), 50);
	}


	function answer(value: number) {
		answers[currentQ] = value;
		if (browser) navigator.vibrate?.(10);
		save();

		const q = questions[currentQ];
		if (q.tensionLine) {
			tensionLine = q.tensionLine;
			setTimeout(() => {
				tensionLine = null;
				advanceQuestion();
			}, 900);
		} else if (q.type === 'binary' || q.type === 'spectrum') {
			setTimeout(() => advanceQuestion(), 400);
		}
	}

	function confirmSlider() {
		const q = questions[currentQ];
		if (q.tensionLine) {
			tensionLine = q.tensionLine;
			setTimeout(() => {
				tensionLine = null;
				advanceQuestion();
			}, 900);
		} else {
			advanceQuestion();
		}
	}

	let halfwayTimer: ReturnType<typeof setTimeout> | undefined;

	function advanceQuestion() {
		if (currentQ === 4) {
			phase = 'halfway';
			halfwayVisible = true;
			halfwayTimer = setTimeout(dismissHalfway, 800);
			return;
		}

		moveToNext();
	}

	function dismissHalfway() {
		if (phase !== 'halfway') return;
		if (halfwayTimer) clearTimeout(halfwayTimer);
		halfwayVisible = false;
		setTimeout(() => {
			phase = 'questions';
			moveToNext();
		}, 200);
	}

	function moveToNext() {
		if (currentQ >= 9) {
			finishQuiz();
			return;
		}
		direction = 'forward';
		transitioning = true;
		questionVisible = false;
		setTimeout(() => {
			currentQ++;
			save();
			questionVisible = true;
			transitioning = false;
		}, 300);
	}

	function goBack() {
		if (currentQ <= 0 || transitioning || tensionLine) return;
		direction = 'back';
		transitioning = true;
		questionVisible = false;
		setTimeout(() => {
			currentQ--;
			save();
			questionVisible = true;
			transitioning = false;
		}, 300);
	}

	function finishQuiz() {
		const completionSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
		const params = new URLSearchParams({
			name,
			emoji,
			answers: JSON.stringify(answers),
			seconds: String(completionSeconds),
			creator: isCreator ? '1' : '0'
		});
		if (sessionId) params.set('s', sessionId);
		if (avatarUrl) params.set('avatarUrl', avatarUrl);
		clearQuizState(sessionId);
		goto(`/q/complete?${params.toString()}`);
	}

	let progress = $derived(((currentQ + (answers[currentQ] !== null ? 1 : 0)) / 10) * 100);
</script>

{#if phase === 'name'}
	<main class="flex min-h-dvh min-h-[100vh] flex-col items-center justify-center px-5">
		<div style="width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 24px;">
			<!-- Wordmark -->
			<p style="text-align: center; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; color: var(--color-secondary); opacity: 0.5; text-transform: uppercase; margin: 0;">Haystack</p>

			<h2 style="text-align: center; font-size: 1.375rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;">What should we call you?</h2>

			<input
				bind:value={name}
				maxlength={20}
				placeholder="Your name"
				autofocus
				onkeydown={(e) => e.key === 'Enter' && submitName()}
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
				"
			/>

			<!-- Avatar preview — tap to change -->
			<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
				<Avatar
					{emoji}
					{avatarUrl}
					size={72}
					onClick={() => (showPicker = true)}
				/>
				<button
					onclick={() => (showPicker = true)}
					style="
						background: none;
						border: none;
						cursor: pointer;
						font-size: 0.8125rem;
						color: var(--color-secondary);
						padding: 2px 8px;
					"
				>
					{avatarUrl ? 'Change photo' : 'Tap to change'}
				</button>
			</div>

			<button
				onclick={submitName}
				disabled={!name.trim()}
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
					opacity: {name.trim() ? 1 : 0.4};
					transition: opacity 200ms ease;
				"
			>
				Next
			</button>
		</div>
	</main>
{:else if phase === 'halfway'}
	<main
		style="
			display: flex;
			min-height: 100dvh;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 0 20px;
			cursor: pointer;
		"
		onclick={dismissHalfway}
		onkeydown={(e) => e.key === 'Enter' && dismissHalfway()}
		role="button"
		tabindex="0"
	>
		<div
			style="
				text-align: center;
				opacity: {halfwayVisible ? 1 : 0};
				transition: opacity 300ms ease;
			"
		>
			<p style="font-size: 1.125rem; font-weight: 600; color: var(--color-secondary); margin: 0;">Halfway there.</p>
			<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 8px 0 0;">5 more questions to go</p>
		</div>
	</main>
{:else}
	<main class="flex min-h-dvh min-h-[100vh] flex-col px-5 pt-[env(safe-area-inset-top)]">
		<!-- Top bar -->
		<div style="margin-top: 16px; display: flex; align-items: center; gap: 12px;">
			{#if currentQ > 0}
				<button
					onclick={goBack}
					disabled={transitioning || !!tensionLine}
					style="
						background: none;
						border: none;
						cursor: pointer;
						padding: 4px;
						color: var(--color-secondary);
						opacity: {transitioning || tensionLine ? 0.2 : 0.5};
						transition: opacity 200ms ease;
						font-size: 1.125rem;
						line-height: 1;
						flex-shrink: 0;
					"
					aria-label="Previous question"
				>&#8592;</button>
			{/if}
			<div style="flex: 1;">
				{#if creatorName}
					<p style="text-align: center; font-size: 0.6875rem; color: var(--color-secondary); margin: 0;">
						Comparing with <span style="font-weight: 600; color: var(--color-secondary);">{creatorName}</span>
					</p>
				{/if}
			</div>
			{#if currentQ > 0}
				<div style="width: 28px; flex-shrink: 0;"></div>
			{/if}
		</div>

		<!-- Progress bar -->
		<div style="margin-top: 12px; height: 3px; width: 100%; overflow: hidden; border-radius: 100px; background: var(--color-border);">
			<div
				style="
					height: 100%;
					border-radius: 100px;
					width: {progress}%;
					transition: width 400ms ease-in-out;
					background: var(--color-highlight);
				"
			></div>
		</div>

		<!-- Question -->
		<div
			style="
				display: flex;
				flex: 1;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				opacity: {questionVisible ? 1 : 0};
				transition: opacity 300ms var(--ease-entrance);
			"
		>
			{#key currentQ}
				{@const q = questions[currentQ]}
				<div style="width: 100%; max-width: 380px;">
					<p style="text-align: center; font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 4px;">
						{currentQ + 1} of 10
					</p>
					<h2 style="text-align: center; font-size: 1.25rem; font-weight: 700; line-height: 1.4; margin: 0 0 32px; letter-spacing: -0.01em;">
						{q.prompt}
					</h2>

					{#if q.type === 'binary'}
						<BinaryInput
							labelLeft={q.labelLeft}
							labelRight={q.labelRight}
							value={answers[currentQ]}
							onSelect={answer}
						/>
					{:else if q.type === 'slider'}
						<SliderInput
							labelLeft={q.labelLeft}
							labelRight={q.labelRight}
							value={answers[currentQ]}
							onChange={(v) => (answers[currentQ] = v)}
							onConfirm={confirmSlider}
						/>
					{:else}
						<SpectrumInput
							labelLeft={q.labelLeft}
							labelRight={q.labelRight}
							value={answers[currentQ]}
							onSelect={(v) => { answer(v); }}
						/>
					{/if}
				</div>
			{/key}
		</div>

		<!-- Tension line -->
		{#if tensionLine}
			<div
				style="padding-bottom: 24px; text-align: center; animation: fadeIn 200ms ease;"
			>
				<p style="font-size: 0.8125rem; font-style: italic; color: var(--color-secondary); margin: 0;">{tensionLine}</p>
			</div>
		{/if}
	</main>
{/if}

{#if showPicker}
	<AvatarPicker
		currentEmoji={emoji}
		currentAvatarUrl={avatarUrl}
		onSelect={handleAvatarSelect}
		onClose={() => (showPicker = false)}
	/>
{/if}


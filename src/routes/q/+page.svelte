<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { questions, categories, TOTAL_QUESTIONS, EMOJI_OPTIONS } from '$lib/questions';
	import { loadQuizState, saveQuizState, clearQuizState } from '$lib/quiz-state';
	import BinaryInput from '$lib/components/BinaryInput.svelte';
	import SliderInput from '$lib/components/SliderInput.svelte';
	import SpectrumInput from '$lib/components/SpectrumInput.svelte';
	import FiveChoiceInput from '$lib/components/FiveChoiceInput.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarPicker from '$lib/components/AvatarPicker.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { browser } from '$app/environment';

	let sessionId = $derived($page.url.searchParams.get('s') ?? undefined);
	let isCreator = $derived(!sessionId);
	let creatorName = $derived($page.url.searchParams.get('creator') ?? null);

	type Phase = 'name' | 'questions' | 'category-intro';
	let phase = $state<Phase>('name');
	let name = $state('');
	let emoji = $state('');
	let avatarUrl = $state<string | null>(null);
	let showPicker = $state(false);
	let answers = $state<(number | null)[]>(Array(TOTAL_QUESTIONS).fill(null));
	let currentQ = $state(0);
	let startedAt = $state<number | undefined>(undefined);
	let questionVisible = $state(false);
	let tensionLine = $state<string | null>(null);
	let categoryIntroVisible = $state(false);
	let direction = $state<'forward' | 'back'>('forward');
	let transitioning = $state(false);
	let quizLoaded = false;

	// Category boundaries: questions 0-4 = values, 5-9 = social, 10-14 = conflict
	const categoryBoundaries = [0, 5, 10];
	let currentCategoryIdx = $state(0);

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
			currentCategoryIdx = categoryBoundaries.findIndex((b, i) => {
				const next = categoryBoundaries[i + 1] ?? TOTAL_QUESTIONS;
				return saved.currentQuestion >= b && saved.currentQuestion < next;
			});
			if (currentCategoryIdx < 0) currentCategoryIdx = 0;
			phase = 'questions';
			questionVisible = true;
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
		startedAt = Date.now();
		save();
		showCategoryIntro(0);
	}

	function showCategoryIntro(catIdx: number) {
		currentCategoryIdx = catIdx;
		phase = 'category-intro';
		categoryIntroVisible = false;
		setTimeout(() => (categoryIntroVisible = true), 50);
	}

	function dismissCategoryIntro() {
		categoryIntroVisible = false;
		setTimeout(() => {
			phase = 'questions';
			questionVisible = true;
		}, 200);
	}

	let advancing = false;

	function answer(value: number) {
		if (currentQ >= questions.length || advancing) return;
		answers[currentQ] = value;
		if (browser) navigator.vibrate?.(10);
		save();

		advancing = true;
		const q = questions[currentQ];
		if (q.tensionLine) {
			tensionLine = q.tensionLine;
			setTimeout(() => {
				tensionLine = null;
				advanceQuestion();
			}, 900);
		} else if (q.type === 'binary' || q.type === 'spectrum' || q.type === 'fiveChoice') {
			setTimeout(() => advanceQuestion(), 400);
		} else {
			advancing = false;
		}
	}

	function confirmSlider() {
		if (currentQ >= questions.length) return;
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

	function advanceQuestion() {
		const nextQ = currentQ + 1;

		// Check if we've crossed into a new category
		if (categoryBoundaries.includes(nextQ) && nextQ < TOTAL_QUESTIONS) {
			const catIdx = categoryBoundaries.indexOf(nextQ);
			questionVisible = false;
			setTimeout(() => {
				currentQ = nextQ;
				advancing = false;
				save();
				showCategoryIntro(catIdx);
			}, 200);
			return;
		}

		moveToNext();
	}

	function moveToNext() {
		if (currentQ >= TOTAL_QUESTIONS - 1) {
			finishQuiz();
			return;
		}
		direction = 'forward';
		transitioning = true;
		questionVisible = false;
		setTimeout(() => {
			currentQ++;
			advancing = false;
			save();
			questionVisible = true;
			transitioning = false;
		}, 300);
	}

	function goBack() {
		if (currentQ <= 0 || transitioning || tensionLine) return;

		// Don't go back across category boundaries — stop at the start of current category
		const catStart = categoryBoundaries[currentCategoryIdx] ?? 0;
		if (currentQ <= catStart) return;

		direction = 'back';
		transitioning = true;
		questionVisible = false;
		setTimeout(() => {
			currentQ--;
			advancing = false;
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

	let progress = $derived(((currentQ + (answers[currentQ] !== null ? 1 : 0)) / TOTAL_QUESTIONS) * 100);

	// Position within the current category (e.g. "2 / 5")
	let categoryStart = $derived(categoryBoundaries[currentCategoryIdx] ?? 0);
	let categoryEnd = $derived(categoryBoundaries[currentCategoryIdx + 1] ?? TOTAL_QUESTIONS);
	let categoryPosition = $derived(currentQ - categoryStart + 1);
	let categorySize = $derived(categoryEnd - categoryStart);
</script>

{#if phase === 'name'}
	<main class="quiz-fullscreen quiz-centered">
		<div style="width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 24px;">
			<!-- Logo -->
			<div style="display: flex; justify-content: center;">
				<Logo size="sm" />
			</div>

			<h2 style="
				text-align: center;
				font-family: var(--font-display);
				font-size: 1.5rem;
				font-weight: 400;
				margin: 0;
				letter-spacing: -0.02em;
			">First — what's your name?</h2>

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
					transition: opacity 200ms ease, transform 150ms var(--ease-spring);
					box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
				"
			>
				Next
			</button>
		</div>
	</main>
{:else if phase === 'category-intro'}
	{@const cat = categories[currentCategoryIdx]}
	<main
		class="quiz-fullscreen"
		style="
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 0 20px;
			cursor: pointer;
			background: var(--color-cream);
			position: relative;
			overflow: hidden;
		"
		onclick={dismissCategoryIntro}
		onkeydown={(e) => e.key === 'Enter' && dismissCategoryIntro()}
		role="button"
		tabindex="0"
	>
		<!-- Decorative background -->
		<div class="deco-blob" style="width: 200px; height: 200px; background: var(--color-accent); top: 20%; left: -50px;"></div>
		<div class="deco-blob" style="width: 160px; height: 160px; background: #7C4DFF; bottom: 20%; right: -40px;"></div>

		<div
			style="
				text-align: center;
				opacity: {categoryIntroVisible ? 1 : 0};
				transform: scale({categoryIntroVisible ? 1 : 0.9});
				transition: opacity 400ms var(--ease-entrance), transform 400ms var(--ease-spring);
				position: relative;
				z-index: 1;
			"
		>
			<div style="
				font-size: 3rem;
				margin-bottom: 16px;
				animation: float 3s ease-in-out infinite;
			">{cat.emoji}</div>
			<p style="
				font-size: 0.6875rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: var(--color-accent);
				margin: 0 0 8px;
			">Part {currentCategoryIdx + 1} of {categories.length}</p>
			<p style="
				font-family: var(--font-display);
				font-size: 1.5rem;
				color: var(--color-primary);
				margin: 0 0 8px;
				line-height: 1.3;
				letter-spacing: -0.02em;
			">{cat.name}</p>
			<p style="
				font-size: 0.9375rem;
				color: var(--color-secondary);
				margin: 0 0 24px;
				line-height: 1.5;
				max-width: 280px;
			">{cat.tagline}</p>
			<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 0;">Tap to continue</p>
		</div>
	</main>
{:else}
	<main class="quiz-layout">
		<!-- Fixed top zone: nav + progress -->
		<div class="quiz-top">
			<div style="display: flex; align-items: center; gap: 12px;">
				<div style="width: 28px; flex-shrink: 0;">
					{#if currentQ > categoryStart}
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
							"
							aria-label="Previous question"
						>&#8592;</button>
					{/if}
				</div>
				<div style="flex: 1;">
					{#if creatorName}
						<p style="text-align: center; font-size: 0.6875rem; color: var(--color-secondary); margin: 0;">
							Comparing with <span style="font-weight: 600; color: var(--color-accent);">{creatorName}</span>
						</p>
					{:else}
						<p style="text-align: center; font-size: 0.6875rem; color: var(--color-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600;">
							{categories[currentCategoryIdx]?.name ?? ''}
						</p>
					{/if}
				</div>
				<div style="width: 28px; flex-shrink: 0;"></div>
			</div>

			<div style="margin-top: 12px; height: 4px; width: 100%; overflow: hidden; border-radius: 100px; background: var(--color-border);">
				<div
					style="
						height: 100%;
						border-radius: 100px;
						width: {progress}%;
						transition: width 400ms ease-in-out;
						background: linear-gradient(90deg, var(--color-accent), var(--color-score-mid));
						animation: progressGlow 2s ease-in-out infinite;
					"
				></div>
			</div>
		</div>

		<!-- Question zone: vertically centered in remaining space -->
		<div class="quiz-question-zone" style="opacity: {questionVisible ? 1 : 0}; transition: opacity 300ms var(--ease-entrance);">
			{#key currentQ}
				{#if currentQ < questions.length}
					{@const q = questions[currentQ]}
					<div class="quiz-question-content">
						<p class="quiz-counter">
							{categoryPosition} / {categorySize}
						</p>
						<h2 class="quiz-prompt">
							{q.prompt}
						</h2>

						<div class="quiz-input-area">
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
									onChange={(v) => { answers[currentQ] = v; save(); }}
									onConfirm={confirmSlider}
								/>
							{:else if q.type === 'fiveChoice' && q.fiveChoiceLabels}
								<FiveChoiceInput
									options={q.fiveChoiceLabels}
									value={answers[currentQ]}
									onSelect={(v) => { answer(v); }}
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
					</div>
				{/if}
			{/key}
		</div>

		<!-- Fixed bottom zone: tension line or spacer (prevents shift) -->
		<div class="quiz-bottom">
			{#if tensionLine}
				<p style="
					font-size: 0.9375rem;
					font-family: var(--font-display);
					font-style: italic;
					color: var(--color-accent);
					margin: 0;
					animation: slideUp 300ms var(--ease-entrance);
				">{tensionLine}</p>
			{/if}
		</div>
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

<style>
	.quiz-fullscreen {
		min-height: 100dvh;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		box-sizing: border-box;
	}

	@supports not (min-height: 100dvh) {
		.quiz-fullscreen {
			min-height: 100vh;
		}
	}

	.quiz-centered {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px 20px;
	}

	.quiz-layout {
		display: grid;
		grid-template-rows: auto 1fr auto;
		height: 100dvh;
		padding: 0 20px;
		padding-top: env(safe-area-inset-top, 0px);
		padding-bottom: env(safe-area-inset-bottom, 0px);
		box-sizing: border-box;
		overflow: hidden;
	}

	@supports not (height: 100dvh) {
		.quiz-layout {
			height: 100vh;
		}
	}

	.quiz-top {
		padding-top: 16px;
	}

	.quiz-question-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		overflow: hidden;
	}

	.quiz-question-content {
		width: 100%;
		max-width: 400px;
	}

	.quiz-counter {
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-accent);
		margin: 0 0 6px;
		letter-spacing: 0.04em;
	}

	.quiz-prompt {
		text-align: center;
		font-family: var(--font-display);
		font-size: clamp(1.375rem, 4vw, 1.75rem);
		font-weight: 400;
		line-height: 1.35;
		margin: 0 0 32px;
		letter-spacing: -0.01em;
	}

	/* Reserve stable space for input area to prevent shifts between question types */
	.quiz-input-area {
		min-height: 140px;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
	}

	.quiz-bottom {
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	@media (min-height: 700px) {
		.quiz-prompt {
			font-size: clamp(1.5rem, 4.5vw, 2rem);
			margin-bottom: 40px;
		}
		.quiz-input-area {
			min-height: 160px;
		}
	}

	@media (min-height: 800px) {
		.quiz-bottom {
			height: 64px;
		}
	}
</style>

<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { getScoreTier, archetypes, type ArchetypeId } from '$lib/questions';
	import { getScoreColor } from '$lib/scoring';
	import { getMySessionId } from '$lib/device';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data } = $props();

	const skipReveal = $derived($page.url.searchParams.get('reveal') === '1');

	type Phase = 'interstitial' | 'result';
	let phase = $state<Phase>('interstitial');

	let interstitialText = $state('');
	let fullText = $state('');
	let showRevealHint = $state(false);

	let scoreCount = $state(0);
	let resultVisible = $state(false);
	let tierVisible = $state(false);
	let tensionVisible = $state(false);
	let alignmentVisible = $state(false);
	let detailVisible = $state(false);

	const tensionLines = [
		'You disagreed on something...',
		"Some of your answers don't match...",
		'This might surprise you...'
	];

	const tier = getScoreTier(data.match.score);
	const scoreColor = getScoreColor(data.match.score);
	const creatorArch = archetypes[data.creator.archetype as ArchetypeId];
	const responderArch = archetypes[data.responder.archetype as ArchetypeId];

	let autoSessionId = $state<string | null>(null);
	let isCreator = $state(false);
	let resultInited = false;

	$effect(() => {
		if (!browser || resultInited) return;
		resultInited = true;
		autoSessionId = getMySessionId();
		isCreator = autoSessionId === data.sessionId;

		if (skipReveal) {
			phase = 'result';
			scoreCount = data.match.score;
			resultVisible = true;
			tierVisible = true;
			tensionVisible = true;
			alignmentVisible = true;
			detailVisible = true;
			return;
		}

		fullText = tensionLines[Math.floor(Math.random() * tensionLines.length)];
		typeText();
	});

	function typeText() {
		let i = 0;
		const interval = setInterval(() => {
			if (i < fullText.length) {
				interstitialText = fullText.slice(0, i + 1);
				i++;
			} else {
				clearInterval(interval);
				setTimeout(() => (showRevealHint = true), 300);
			}
		}, 30);
	}

	function reveal() {
		if (phase !== 'interstitial') return;
		phase = 'result';
		if (browser) navigator.vibrate?.([10, 30, 10]);
		animateResult();
	}

	function animateResult() {
		resultVisible = true;

		const duration = 800;
		const target = data.match.score;
		const start = performance.now();

		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			scoreCount = Math.round(eased * target);
			if (progress < 1) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);

		setTimeout(() => (tierVisible = true), 600);
		setTimeout(() => (tensionVisible = true), 800);
		setTimeout(() => (alignmentVisible = true), 1100);
		setTimeout(() => (detailVisible = true), 1400);
	}
</script>

<svelte:head>
	<title>{data.creator.name} & {data.responder.name}: {data.match.score}% — Haystack</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if phase === 'interstitial'}
	<main
		style="
			display: flex;
			min-height: 100dvh;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 24px 20px;
			background: var(--color-cream);
			cursor: pointer;
			user-select: none;
			-webkit-user-select: none;
		"
		onclick={reveal}
		onkeydown={(e) => e.key === 'Enter' && reveal()}
		role="button"
		tabindex="0"
		aria-label="Tap to reveal your result"
	>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 24px; max-width: 300px; text-align: center;">

			<!-- Avatars + blurred score -->
			<div style="display: flex; align-items: center; gap: 20px;">
				<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
					<Avatar emoji={data.creator.emoji} avatarUrl={data.creator.avatarUrl} size={68} />
					<span style="font-size: 0.8125rem; font-weight: 600;">{data.creator.name}</span>
				</div>

				<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
					<span style="
						font-size: 2rem;
						font-weight: 800;
						color: var(--color-secondary);
						letter-spacing: -0.03em;
						line-height: 1;
						filter: blur(8px);
						opacity: 0.6;
					">{data.match.score}%</span>
				</div>

				<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
					<Avatar emoji={data.responder.emoji} avatarUrl={data.responder.avatarUrl} size={68} />
					<span style="font-size: 0.8125rem; font-weight: 600;">{data.responder.name}</span>
				</div>
			</div>

			<!-- Tension line -->
			<p style="
				font-size: 1.25rem;
				font-weight: 500;
				font-style: italic;
				color: var(--color-primary);
				opacity: 0.8;
				margin: 0;
				min-height: 3.6em;
				line-height: 1.4;
			">
				{interstitialText}
			</p>

			<!-- Tap CTA — always takes space, fades in -->
			<button
				style="
					margin-top: 8px;
					border-radius: 100px;
					background: var(--color-primary);
					padding: 14px 40px;
					font-size: 1rem;
					font-weight: 700;
					color: white;
					border: none;
					cursor: pointer;
					opacity: {showRevealHint ? 1 : 0};
					transition: opacity 400ms ease;
					pointer-events: {showRevealHint ? 'auto' : 'none'};
				"
			>
				Reveal
			</button>
		</div>
	</main>
{:else}
	<main class="min-h-dvh min-h-[100vh] bg-cream">
		<div
			class="mx-auto max-w-sm px-5 pt-10 pb-8"
			class:opacity-100={resultVisible}
			class:opacity-0={!resultVisible}
			style="transition: opacity 300ms ease"
		>
			<!-- Wordmark -->
			<p class="mb-6 text-center text-xs font-bold tracking-wider text-secondary/60 uppercase">Haystack</p>

			<!-- Score hero card -->
			<div style="
				background: var(--color-surface);
				border-radius: 24px;
				padding: 32px 24px 28px;
				text-align: center;
				border: 1.5px solid var(--color-border);
				margin-bottom: 20px;
			">
				<!-- Overlapping avatars -->
				<div style="display: flex; justify-content: center; margin-bottom: 20px;">
					<div style="position: relative; z-index: 2;">
						<Avatar emoji={data.creator.emoji} avatarUrl={data.creator.avatarUrl} size={56} borderColor="var(--color-border)" />
					</div>
					<div style="position: relative; z-index: 1; margin-left: -14px;">
						<Avatar emoji={data.responder.emoji} avatarUrl={data.responder.avatarUrl} size={56} borderColor="var(--color-border)" />
					</div>
				</div>

				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 4px;">
					{data.creator.name}
					{#if creatorArch}<span style="opacity: 0.7;"> · {creatorArch.name}</span>{/if}
					&nbsp;&nbsp;×&nbsp;&nbsp;
					{data.responder.name}
					{#if responderArch}<span style="opacity: 0.7;"> · {responderArch.name}</span>{/if}
				</p>

				<!-- Big score -->
				<div style="margin: 12px 0 8px; color: {scoreColor};">
					<span style="
						font-size: 5rem;
						font-weight: 800;
						line-height: 1;
						letter-spacing: -0.04em;
						font-variant-numeric: tabular-nums;
					">{scoreCount}%</span>
				</div>

				<!-- Tier -->
				<p
					style="
						font-size: 1rem;
						font-weight: 600;
						color: var(--color-secondary);
						margin: 0;
						opacity: {tierVisible ? 1 : 0};
						transition: opacity 200ms ease;
					"
				>
					{tier}
				</p>

				<!-- Pair dynamic -->
				<p
					style="
						font-size: 0.8125rem;
						color: var(--color-secondary);
						opacity: {tierVisible ? 0.8 : 0};
						transition: opacity 200ms ease;
						margin: 4px 0 0;
					"
				>
					{data.match.pairDynamic}
				</p>
			</div>

			<!-- Insight cards -->
			<div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
				<!-- Tension -->
				<div
					style="
						background: var(--color-surface);
						border-radius: 20px;
						padding: 20px;
						border: 1.5px solid var(--color-border);
						opacity: {tensionVisible ? 1 : 0};
						transform: translateY({tensionVisible ? '0' : '8px'});
						transition: opacity 400ms var(--ease-entrance), transform 400ms var(--ease-entrance);
					"
				>
					<p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-score-low); margin: 0 0 8px;">Biggest tension</p>
					<p style="font-size: 1.0625rem; font-weight: 500; font-style: italic; color: var(--color-primary); margin: 0; line-height: 1.4;">
						"{data.match.biggestTension}"
					</p>
				</div>

				<!-- Alignment -->
				<div
					style="
						background: var(--color-surface);
						border-radius: 20px;
						padding: 20px;
						border: 1.5px solid var(--color-border);
						opacity: {alignmentVisible ? 1 : 0};
						transform: translateY({alignmentVisible ? '0' : '8px'});
						transition: opacity 400ms var(--ease-entrance), transform 400ms var(--ease-entrance);
					"
				>
					<p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-score-high); margin: 0 0 8px;">Strongest alignment</p>
					<p style="font-size: 1.0625rem; font-weight: 500; color: var(--color-primary); margin: 0; line-height: 1.4;">
						{data.match.strongestAlignment}
					</p>
				</div>
			</div>

			<!-- CTA -->
			<div
				style="
					opacity: {detailVisible ? 1 : 0};
					transition: opacity 400ms ease;
				"
			>
				{#if isCreator}
					<a
						href="/dashboard/{data.sessionId}"
						style="
							display: block;
							width: 100%;
							border-radius: 100px;
							background: var(--color-accent);
							padding: 16px 24px;
							font-size: 1.0625rem;
							font-weight: 700;
							color: white;
							text-align: center;
							text-decoration: none;
						"
					>
						See all matches
					</a>
				{:else}
					<a
						href="/"
						style="
							display: block;
							width: 100%;
							border-radius: 100px;
							background: var(--color-accent);
							padding: 16px 24px;
							font-size: 1.0625rem;
							font-weight: 700;
							color: white;
							text-align: center;
							text-decoration: none;
						"
					>
						Test someone else
					</a>
				{/if}
			</div>
		</div>
	</main>
{/if}

<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Logo from '$lib/components/Logo.svelte';

	let ready = $state(false);
	let mounted = $state(false);

	const examples = [
		{ emoji: '🧑‍🤝‍🧑', label: 'Best friend', score: 73, color: 'var(--color-score-high)' },
		{ emoji: '💕', label: 'Your crush', score: 41, color: 'var(--color-score-mid)' },
		{ emoji: '👨‍👩‍👧', label: 'Sibling', score: 88, color: 'var(--color-score-high)' },
		{ emoji: '🫠', label: 'Your ex', score: 29, color: 'var(--color-score-low)' },
	];

	let activeExample = $state(0);
	let animatedScore = $state(0);
	let scoreAnimating = $state(false);
	let exampleVisible = $state(false);
	let cycleTimer: ReturnType<typeof setInterval> | undefined;

	let liveCount = $state(0);
	let liveTimer: ReturnType<typeof setInterval> | undefined;

	$effect(() => {
		if (!browser) return;
		if (!localStorage.getItem('haystack_intro_seen')) {
			goto('/intro', { replaceState: true });
			return;
		}
		ready = true;
		showLanding();
	});

	function showLanding() {
		mounted = true;
		liveCount = 14 + Math.floor(Math.random() * 8);
		startLiveCounter();
		setTimeout(() => {
			exampleVisible = true;
			animateScore(examples[0].score);
			startCycle();
		}, 600);
	}

	function startLiveCounter() {
		liveTimer = setInterval(() => {
			const delta = Math.random() < 0.5 ? 1 : -1;
			const next = liveCount + delta;
			if (next >= 8 && next <= 30) liveCount = next;
		}, 3500 + Math.random() * 3000);
	}

	function animateScore(target: number) {
		scoreAnimating = true;
		const duration = 700;
		const start = performance.now();
		function tick(now: number) {
			const elapsed = now - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			animatedScore = Math.round(eased * target);
			if (progress < 1) requestAnimationFrame(tick);
			else scoreAnimating = false;
		}
		requestAnimationFrame(tick);
	}

	function startCycle() {
		cycleTimer = setInterval(() => {
			exampleVisible = false;
			setTimeout(() => {
				activeExample = (activeExample + 1) % examples.length;
				animatedScore = 0;
				exampleVisible = true;
				animateScore(examples[activeExample].score);
			}, 350);
		}, 3000);
	}

	function start() {
		if (cycleTimer) clearInterval(cycleTimer);
		if (liveTimer) clearInterval(liveTimer);
		goto('/q');
	}
</script>

{#if ready}
<main
	style="
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px 20px;
		background: var(--color-cream);
		position: relative;
		overflow: hidden;
	"
>
	<!-- Decorative blobs -->
	<div class="deco-blob" style="width: 300px; height: 300px; background: var(--color-accent); top: -80px; right: -100px;"></div>
	<div class="deco-blob" style="width: 250px; height: 250px; background: #7C4DFF; bottom: -60px; left: -80px;"></div>

	<div style="display: flex; flex-direction: column; align-items: center; gap: 28px; text-align: center; max-width: 340px; width: 100%; position: relative; z-index: 1;">

		<!-- Logo -->
		<div
			class={mounted ? 'landing-in' : ''}
		>
			<Logo size="lg" />
		</div>

		<!-- Cycling avatar hero -->
		<div
			class={mounted ? 'landing-in' : ''}
			style="
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 20px;
				min-height: 120px;
				animation-delay: 100ms;
			"
		>
			<!-- You avatar -->
			<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
				<div style="
					width: 72px;
					height: 72px;
					border-radius: 50%;
					background: var(--color-surface);
					border: 2.5px solid var(--color-accent);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 2rem;
					box-shadow: 0 4px 20px rgba(232, 86, 63, 0.15);
				">🫵</div>
				<span style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary);">You</span>
			</div>

			<!-- Score in the middle -->
			<div style="
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 2px;
				width: 64px;
				opacity: {exampleVisible ? 1 : 0};
				transition: opacity 300ms ease;
			">
				<span style="
					font-family: var(--font-display);
					font-size: 2rem;
					color: {examples[activeExample].color};
					letter-spacing: -0.03em;
					line-height: 1;
					font-variant-numeric: tabular-nums;
				">{animatedScore}%</span>
				<span style="
					font-size: 0.5625rem;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.06em;
					color: var(--color-secondary);
				">match</span>
			</div>

			<!-- Other person avatar (cycles) -->
			<div
				style="
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 6px;
					opacity: {exampleVisible ? 1 : 0};
					transform: translateY({exampleVisible ? '0' : '6px'});
					transition: opacity 300ms ease, transform 300ms var(--ease-entrance);
				"
			>
				<div style="
					width: 72px;
					height: 72px;
					border-radius: 50%;
					background: var(--color-surface);
					border: 2px dashed var(--color-border);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 2rem;
				">{examples[activeExample].emoji}</div>
				<span style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary);">{examples[activeExample].label}</span>
			</div>
		</div>

		<!-- Tagline — serif for the emotional word -->
		<p
			class={mounted ? 'landing-in' : ''}
			style="
				font-size: 1.125rem;
				line-height: 1.55;
				color: var(--color-primary);
				margin: 0;
				font-weight: 500;
				animation-delay: 200ms;
			"
		>
			Research-informed. 15 questions. 90 seconds.<br />Find out if you <span style="
				font-family: var(--font-display);
				font-style: italic;
				font-size: 1.3rem;
				background: linear-gradient(135deg, var(--color-accent) 0%, #D44A35 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
			">actually</span> get each other.
		</p>

		<!-- Credibility line -->
		<p
			class={mounted ? 'landing-in' : ''}
			style="
				font-size: 0.6875rem;
				color: var(--color-secondary);
				margin: -16px 0 0;
				letter-spacing: 0.02em;
				opacity: 0.7;
				animation-delay: 250ms;
			"
		>
			Grounded in the Big Five, Attachment Theory & the Love Languages
		</p>

		<!-- CTA -->
		<button
			onclick={start}
			class={mounted ? 'landing-in' : ''}
			style="
				width: 100%;
				max-width: 280px;
				border-radius: 100px;
				background: linear-gradient(135deg, var(--color-accent) 0%, #D44A35 100%);
				padding: 16px 24px;
				font-size: 1.125rem;
				font-weight: 700;
				color: white;
				border: none;
				cursor: pointer;
				animation-delay: 350ms;
				box-shadow: 0 4px 20px rgba(232, 86, 63, 0.3);
				transition: transform 150ms var(--ease-spring), box-shadow 150ms ease;
			"
			onmousedown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
			onmouseup={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
			ontouchstart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
			ontouchend={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
		>
			Start — it's 60 seconds
		</button>

		<div
			class={mounted ? 'landing-in' : ''}
			style="
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 6px;
				font-size: 0.75rem;
				color: var(--color-secondary);
				margin: 0;
				animation-delay: 500ms;
			"
		>
			<span style="
				display: inline-block;
				width: 6px;
				height: 6px;
				border-radius: 50%;
				background: var(--color-score-high);
				animation: pulse 2s ease-in-out infinite;
			"></span>
			<span><strong style="font-weight: 600; color: var(--color-primary);">{liveCount}</strong> people comparing right now</span>
		</div>

		<a
			href="/auth?redirect=/"
			class={mounted ? 'landing-in' : ''}
			style="
				font-size: 0.75rem;
				color: var(--color-secondary);
				text-decoration: underline;
				text-underline-offset: 2px;
				animation-delay: 600ms;
				opacity: 0.7;
			"
		>Already took it? Get your results back</a>

		<a
			href="/archetypes"
			class={mounted ? 'landing-in' : ''}
			style="
				font-size: 0.75rem;
				color: var(--color-secondary);
				text-decoration: underline;
				text-underline-offset: 2px;
				animation-delay: 700ms;
				opacity: 0.7;
			"
		>Explore the 10 archetypes</a>
	</div>
</main>
{/if}

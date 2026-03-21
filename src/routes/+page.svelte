<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getMySessionId, setMySessionId } from '$lib/device';
	import { supabase } from '$lib/supabase';

	let mounted = $state(false);
	let checking = $state(true);

	let showRecovery = $state(false);
	let recoveryPhone = $state('');
	let recoveryLoading = $state(false);
	let recoveryError = $state('');

	const examples = [
		{ emoji: '🧑‍🤝‍🧑', label: 'Your friend', score: 73, color: 'var(--color-score-high)' },
		{ emoji: '💕', label: 'Your crush', score: 41, color: 'var(--color-score-mid)' },
		{ emoji: '👨‍👩‍👧', label: 'Your sibling', score: 88, color: 'var(--color-score-high)' },
		{ emoji: '💼', label: 'Co-worker', score: 29, color: 'var(--color-score-low)' },
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
		checkReturningUser();
	});

	async function checkReturningUser() {
		const sessionId = getMySessionId();
		if (!sessionId) {
			showLanding();
			return;
		}
		goto(`/dashboard/${sessionId}`, { replaceState: true });
	}

	function showLanding() {
		checking = false;
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

	async function recoverSession() {
		const cleaned = recoveryPhone.replace(/\s/g, '');
		if (!cleaned || cleaned.length < 7) return;
		recoveryLoading = true;
		recoveryError = '';
		const { data: session } = await supabase
			.from('sessions')
			.select('id')
			.eq('creator_phone', cleaned)
			.order('created_at', { ascending: false })
			.limit(1)
			.single();
		if (session) {
			setMySessionId(session.id);
			goto(`/dashboard/${session.id}`);
		} else {
			recoveryError = 'No matches found for that number.';
			recoveryLoading = false;
		}
	}
</script>

{#if checking}
	<main style="display: flex; min-height: 100dvh; align-items: center; justify-content: center; background: var(--color-cream);">
		<p style="font-size: 0.875rem; color: var(--color-secondary); opacity: 0.5;">Loading...</p>
	</main>
{:else}
<main
	style="
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px 20px;
		background: var(--color-cream);
	"
>
	<div style="display: flex; flex-direction: column; align-items: center; gap: 32px; text-align: center; max-width: 340px; width: 100%;">

		<!-- Logo -->
		<h1
			class={mounted ? 'landing-in' : ''}
			style="
				font-size: 1.5rem;
				font-weight: 800;
				letter-spacing: -0.02em;
				color: var(--color-primary);
				margin: 0;
			"
		>
			Haystack
		</h1>

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
					border: 2px solid var(--color-highlight);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 2rem;
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
					font-size: 1.75rem;
					font-weight: 800;
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

		<!-- Tagline -->
		<p
			class={mounted ? 'landing-in' : ''}
			style="
				font-size: 1.125rem;
				line-height: 1.5;
				color: var(--color-primary);
				margin: 0;
				font-weight: 500;
				animation-delay: 200ms;
			"
		>
			Both answer 10 questions.<br />See how you <span style="background: var(--color-highlight); color: white; padding: 2px 8px; border-radius: 6px; font-weight: 600;">actually</span> compare.
		</p>

		<!-- CTA -->
		<button
			onclick={start}
			class={mounted ? 'landing-in' : ''}
			style="
				width: 100%;
				max-width: 280px;
				border-radius: 100px;
				background-color: var(--color-accent);
				padding: 16px 24px;
				font-size: 1.125rem;
				font-weight: 700;
				color: white;
				border: none;
				cursor: pointer;
				animation-delay: 350ms;
			"
		>
			Try it — takes 60 seconds
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
			<span><strong style="font-weight: 600; color: var(--color-primary);">{liveCount}</strong> people testing right now</span>
		</div>

		{#if !showRecovery}
			<button
				onclick={() => showRecovery = true}
				class={mounted ? 'landing-in' : ''}
				style="
					font-size: 0.6875rem;
					color: var(--color-secondary);
					background: none;
					border: none;
					cursor: pointer;
					text-decoration: underline;
					text-underline-offset: 2px;
					font-family: inherit;
					margin-top: 8px;
					animation-delay: 600ms;
				"
			>
				Already played? Find your results
			</button>
		{:else}
			<div
				style="
					width: 100%;
					max-width: 280px;
					margin-top: 12px;
					animation: fadeIn 300ms ease;
				"
			>
				<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 0 0 8px; text-align: center;">
					Enter the phone number you used before
				</p>
				<div style="display: flex; gap: 8px;">
					<input
						type="tel"
						bind:value={recoveryPhone}
						placeholder="Your phone number"
						onkeydown={(e) => e.key === 'Enter' && recoverSession()}
						style="
							flex: 1;
							border-radius: 100px;
							border: 1.5px solid var(--color-border);
							padding: 10px 14px;
							font-size: 0.8125rem;
							background: var(--color-input-bg);
							color: var(--color-primary);
							outline: none;
							font-family: inherit;
						"
					/>
					<button
						onclick={recoverSession}
						disabled={recoveryLoading}
						style="
							border-radius: 100px;
							background: var(--color-primary);
							padding: 10px 14px;
							font-size: 0.75rem;
							font-weight: 700;
							color: white;
							border: none;
							cursor: pointer;
							white-space: nowrap;
							opacity: {recoveryLoading ? 0.6 : 1};
						"
					>
						Find
					</button>
				</div>
				{#if recoveryError}
					<p style="font-size: 0.6875rem; color: var(--color-score-low); margin: 6px 0 0; text-align: center;">
						{recoveryError}
					</p>
				{/if}
			</div>
		{/if}
	</div>
</main>
{/if}

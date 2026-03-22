<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import {
		getScoreTier,
		archetypes,
		TRAIT_LABELS,
		ATTACHMENT_STYLE_LABELS,
		LOVE_LANG_LABELS,
		type ArchetypeId,
		type LoveLanguageId
	} from '$lib/questions';
	import { computeTraitProfile, getScoreColor, type TraitProfile, type ComponentScores } from '$lib/scoring';
	import { markMatchRevealed, getRevealedMatches } from '$lib/device';
	import Avatar from '$lib/components/Avatar.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { data } = $props();

	let shareUrl = $state('');

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
	let scoreRevealed = $state(false);
	let showBreakdown = $state(false);

	const tensionLines = [
		'You two see things differently...',
		"One of you answered something the other wouldn't expect...",
		'This might change how you see each other...',
		"You're not as similar as you think..."
	];

	const tier = getScoreTier(data.match.score);
	const scoreColor = getScoreColor(data.match.score);
	const creatorArch = archetypes[data.creator.archetype as ArchetypeId];
	const responderArch = archetypes[data.responder.archetype as ArchetypeId];

	const archColors: Record<string, string> = {
		guardian: '#2DB87A', maker: '#E8863F', visionary: '#2979FF', champion: '#E8563F',
		connector: '#AB47BC', catalyst: '#F9A825', dreamer: '#7C4DFF', maverick: '#546E7A',
		advocate: '#E91E63', facilitator: '#43A047'
	};
	const creatorArchColor = archColors[data.creator.archetype] ?? 'var(--color-secondary)';
	const responderArchColor = archColors[data.responder.archetype] ?? 'var(--color-secondary)';

	// Compute trait profiles from answers
	const creatorProfile: TraitProfile | null = data.creator.answers?.length
		? computeTraitProfile(data.creator.answers)
		: null;
	const responderProfile: TraitProfile | null = data.responder.answers?.length
		? computeTraitProfile(data.responder.answers)
		: null;

	const hasProfiles = creatorProfile && responderProfile;

	// Compute component scores if we have profiles
	function computeComponents(cp: TraitProfile, rp: TraitProfile): ComponentScores {
		function traitDist(a: number, b: number) { return 100 - Math.abs(a - b); }
		const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;
		let tTotal = 0;
		for (const t of traits) tTotal += traitDist(cp[t], rp[t]);
		const traitAlignment = Math.round(tTotal / traits.length);

		let attachBase = 100 - (Math.abs(cp.attachmentAnxiety - rp.attachmentAnxiety) * 0.5 + Math.abs(cp.attachmentAvoidance - rp.attachmentAvoidance) * 0.5);
		if (cp.attachmentStyle === 'secure' && rp.attachmentStyle === 'secure') attachBase = Math.min(100, attachBase + 15);
		if ((cp.attachmentStyle === 'anxious' && rp.attachmentStyle === 'avoidant') || (cp.attachmentStyle === 'avoidant' && rp.attachmentStyle === 'anxious')) attachBase = Math.max(0, attachBase - 20);
		const attachmentFit = Math.round(Math.max(0, Math.min(100, attachBase)));

		const loveLangMatch = cp.loveLangPrimary === rp.loveLangPrimary ? 100
			: (cp.loveLangPrimary === rp.loveLangSecondary || rp.loveLangPrimary === cp.loveLangSecondary) ? 70 : 40;

		const rhythmFit = Math.round(traitDist(cp.extraversion, rp.extraversion) * 0.5 + traitDist(cp.conscientiousness, rp.conscientiousness) * 0.5);
		const repairFit = Math.round((cp.agreeableness + rp.agreeableness) / 2 * 0.6 + ((100 - cp.neuroticism) + (100 - rp.neuroticism)) / 2 * 0.4);

		return { traitAlignment, attachmentFit, loveLangMatch, rhythmFit, repairFit };
	}

	const componentScores: ComponentScores | null = hasProfiles ? computeComponents(creatorProfile, responderProfile) : null;

	// Generate tips based on profiles
	function generateWatchOuts(cp: TraitProfile, rp: TraitProfile): string[] {
		const tips: string[] = [];
		const traits = TRAIT_LABELS;
		for (const [key, labels] of Object.entries(traits)) {
			const gap = Math.abs((cp as any)[key] - (rp as any)[key]);
			if (gap > 35) {
				const aLabel = (cp as any)[key] > 50 ? labels.high : labels.low;
				const bLabel = (rp as any)[key] > 50 ? labels.high : labels.low;
				tips.push(`${data.creator.name} leans ${aLabel.toLowerCase()}, ${data.responder.name} leans ${bLabel.toLowerCase()} on ${labels.name.toLowerCase()}. Name it, don't assume.`);
			}
		}
		if ((cp.attachmentStyle === 'anxious' && rp.attachmentStyle === 'avoidant') || (cp.attachmentStyle === 'avoidant' && rp.attachmentStyle === 'anxious')) {
			tips.push('One needs closeness, the other needs space — the classic anxious-avoidant dance. Build small rituals of reassurance.');
		}
		if (cp.loveLangPrimary !== rp.loveLangPrimary) {
			const cLang = LOVE_LANG_LABELS[cp.loveLangPrimary].name;
			const rLang = LOVE_LANG_LABELS[rp.loveLangPrimary].name;
			tips.push(`${data.creator.name} feels loved through ${cLang}, ${data.responder.name} through ${rLang}. Translate your effort into their language.`);
		}
		return tips.slice(0, 3);
	}

	function generateStrengths(cp: TraitProfile, rp: TraitProfile): string[] {
		const tips: string[] = [];
		const traits = TRAIT_LABELS;
		for (const [key, labels] of Object.entries(traits)) {
			const gap = Math.abs((cp as any)[key] - (rp as any)[key]);
			if (gap < 15) {
				tips.push(`You're both ${(cp as any)[key] > 50 ? labels.high.toLowerCase() : labels.low.toLowerCase()} on ${labels.name.toLowerCase()} — that creates natural understanding.`);
			}
		}
		if (cp.attachmentStyle === 'secure' && rp.attachmentStyle === 'secure') {
			tips.push('Both secure attachment styles — a foundation of trust that compounds over time.');
		}
		if (cp.loveLangPrimary === rp.loveLangPrimary) {
			tips.push(`You both feel loved through ${LOVE_LANG_LABELS[cp.loveLangPrimary].name.toLowerCase()} — your effort naturally registers.`);
		}
		return tips.slice(0, 3);
	}

	const watchOuts = hasProfiles ? generateWatchOuts(creatorProfile, responderProfile) : [];
	const strengths = hasProfiles ? generateStrengths(creatorProfile, responderProfile) : [];

	const componentLabels: { key: keyof ComponentScores; label: string; weight: string }[] = [
		{ key: 'traitAlignment', label: 'Trait Alignment', weight: '35%' },
		{ key: 'attachmentFit', label: 'Attachment Fit', weight: '25%' },
		{ key: 'loveLangMatch', label: 'Love Language', weight: '15%' },
		{ key: 'rhythmFit', label: 'Daily Rhythm', weight: '15%' },
		{ key: 'repairFit', label: 'Repair Ability', weight: '10%' }
	];

	function getTierShareCopy(score: number): string {
		if (score >= 90) return `We got ${score}% on Haystack — scarily in sync 🔮`;
		if (score >= 75) return `We got ${score}% on Haystack — easy momentum. Think you can beat it? 👀`;
		if (score >= 60) return `We got ${score}% on Haystack — solid potential. Think you'd score higher? 👀`;
		if (score >= 45) return `We got ${score}% — interesting differences. Think you'd do better? 👀`;
		if (score >= 30) return `We got ${score}% — different wavelengths. Can you beat it? 👀`;
		return `We got ${score}% on Haystack — more different than we thought. Can you do better? 👀`;
	}

	const tierShareText = getTierShareCopy(data.match.score);
	const challengeShareText = `${tierShareText}\n`;

	let resultInited = false;

	$effect(() => {
		if (!browser || resultInited) return;
		resultInited = true;

		if (data.viewerInviteCode) {
			shareUrl = `${window.location.origin}/s/${data.viewerInviteCode}`;
		}

		// Check before marking so first visit still gets the animation
		const alreadySeen = skipReveal || getRevealedMatches().has(data.match.id);
		markMatchRevealed(data.match.id);

		if (alreadySeen) {
			phase = 'result';
			scoreCount = data.match.score;
			resultVisible = true;
			scoreRevealed = true;
			tierVisible = true;
			tensionVisible = true;
			alignmentVisible = true;
			detailVisible = true;
		} else {
			phase = 'interstitial';
			fullText = tensionLines[Math.floor(Math.random() * tensionLines.length)];
			typeText();
		}
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

		setTimeout(() => {
			scoreRevealed = true;
		}, 200);

		const duration = 900;
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

		setTimeout(() => (tierVisible = true), 700);
		setTimeout(() => (tensionVisible = true), 1000);
		setTimeout(() => (alignmentVisible = true), 1300);
		setTimeout(() => (detailVisible = true), 1600);
	}
</script>

<svelte:head>
	<title>{data.creator.name} & {data.responder.name}: {data.match.score}% — Haystack</title>
	<meta name="robots" content="noindex" />
</svelte:head>

{#if phase === 'interstitial'}
	<!-- Dark reveal moment -->
	<main
		style="
			display: flex;
			min-height: 100dvh;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 24px 20px;
			background: var(--color-reveal-bg);
			cursor: pointer;
			user-select: none;
			-webkit-user-select: none;
			transition: background 600ms ease;
		"
		onclick={reveal}
		onkeydown={(e) => e.key === 'Enter' && reveal()}
		role="button"
		tabindex="0"
		aria-label="Tap to reveal your result"
	>
		<div style="display: flex; flex-direction: column; align-items: center; gap: 28px; max-width: 300px; text-align: center;">
			<div style="display: flex; align-items: center; gap: 20px;">
				<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
					<Avatar emoji={data.creator.emoji} avatarUrl={data.creator.avatarUrl} size={68} borderColor="rgba(255,255,255,0.15)" />
					<span style="font-size: 0.8125rem; font-weight: 600; color: rgba(255,255,255,0.7);">{data.creator.name}</span>
				</div>
				<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
					<span style="
						font-family: var(--font-display);
						font-size: 2.5rem;
						color: rgba(255,255,255,0.3);
						letter-spacing: -0.03em;
						line-height: 1;
						filter: blur(10px);
					">{data.match.score}%</span>
				</div>
				<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
					<Avatar emoji={data.responder.emoji} avatarUrl={data.responder.avatarUrl} size={68} borderColor="rgba(255,255,255,0.15)" />
					<span style="font-size: 0.8125rem; font-weight: 600; color: rgba(255,255,255,0.7);">{data.responder.name}</span>
				</div>
			</div>
			<p style="
				font-family: var(--font-display);
				font-size: 1.375rem;
				font-style: italic;
				color: rgba(255,255,255,0.85);
				margin: 0;
				min-height: 3.6em;
				line-height: 1.4;
			">
				{interstitialText}
			</p>
			<button
				style="
					margin-top: 8px;
					border-radius: 100px;
					background: var(--color-accent);
					padding: 14px 44px;
					font-size: 1rem;
					font-weight: 700;
					color: white;
					border: none;
					cursor: pointer;
					opacity: {showRevealHint ? 1 : 0};
					transform: translateY({showRevealHint ? '0' : '8px'});
					transition: opacity 400ms ease, transform 400ms var(--ease-entrance);
					pointer-events: {showRevealHint ? 'auto' : 'none'};
					box-shadow: 0 4px 24px rgba(232, 86, 63, 0.4);
				"
			>
				Reveal
			</button>
		</div>
	</main>
{:else}
	<main style="
		min-height: 100dvh;
		min-height: 100vh;
		background: var(--color-cream);
	">
		<div
			style="
				max-width: 24rem;
				margin: 0 auto;
				padding: 40px 20px 32px;
				opacity: {resultVisible ? 1 : 0};
				transition: opacity 300ms ease;
			"
		>
			<!-- Logo — links to dashboard -->
			<div style="display: flex; justify-content: center; margin-bottom: 28px;">
				<a href={data.isSessionOwner ? `/dashboard/${data.sessionId}` : '/'} style="text-decoration: none;">
					<Logo size="sm" />
				</a>
			</div>

			<!-- Score hero card -->
			<div style="
				background: var(--color-surface);
				border-radius: 28px;
				padding: 32px 20px 24px;
				text-align: center;
				border: 1.5px solid var(--color-border);
				margin-bottom: 16px;
				position: relative;
				overflow: hidden;
			">
				<div style="
					position: absolute;
					inset: 0;
					background: radial-gradient(ellipse at 50% 0%, {scoreColor}10 0%, transparent 70%);
					pointer-events: none;
				"></div>

				<!-- Two-person layout -->
				<div style="
					display: grid;
					grid-template-columns: 1fr auto 1fr;
					align-items: center;
					gap: 12px;
					margin-bottom: 20px;
					position: relative;
					z-index: 1;
				">
					<!-- Creator -->
					<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
						<Avatar emoji={data.creator.emoji} avatarUrl={data.creator.avatarUrl} size={52} borderColor="var(--color-border)" />
						<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
							<span style="font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); line-height: 1.2;">{data.creator.name}</span>
							{#if creatorArch}
								<span style="font-size: 0.6875rem; font-weight: 600; color: {creatorArchColor}; line-height: 1.2;">{creatorArch.name}</span>
							{/if}
						</div>
					</div>

					<!-- Score center -->
					<div style="
						display: flex;
						flex-direction: column;
						align-items: center;
						color: {scoreColor};
						animation: {scoreRevealed ? 'scoreReveal 700ms var(--ease-spring) both' : 'none'};
					">
						<span class={data.match.score >= 75 ? 'score-glow' : ''} style="
							font-family: var(--font-display);
							font-size: 3.5rem;
							line-height: 1;
							letter-spacing: -0.04em;
							font-variant-numeric: tabular-nums;
						">{scoreCount}%</span>
					</div>

					<!-- Responder -->
					<div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
						<Avatar emoji={data.responder.emoji} avatarUrl={data.responder.avatarUrl} size={52} borderColor="var(--color-border)" />
						<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
							<span style="font-size: 0.8125rem; font-weight: 700; color: var(--color-primary); line-height: 1.2;">{data.responder.name}</span>
							{#if responderArch}
								<span style="font-size: 0.6875rem; font-weight: 600; color: {responderArchColor}; line-height: 1.2;">{responderArch.name}</span>
							{/if}
						</div>
					</div>
				</div>

				<p
					style="
						font-family: var(--font-display);
						font-size: 1.125rem;
						font-style: italic;
						color: var(--color-primary);
						margin: 0;
						opacity: {tierVisible ? 1 : 0};
						transition: opacity 300ms ease;
						position: relative;
						z-index: 1;
					"
				>
					{tier}
				</p>

				<p
					style="
						font-size: 0.8125rem;
						color: var(--color-secondary);
						opacity: {tierVisible ? 0.8 : 0};
						transition: opacity 200ms ease;
						margin: 6px 0 0;
						position: relative;
						z-index: 1;
					"
				>
					{data.match.pairDynamic}
				</p>

				<!-- Tension line elevated into hero card -->
				<div
					style="
						margin: 16px 0 0;
						padding: 12px 16px;
						background: rgba(0,0,0,0.03);
						border-radius: 14px;
						position: relative;
						z-index: 1;
						opacity: {tensionVisible ? 1 : 0};
						transform: translateY({tensionVisible ? '0' : '6px'});
						transition: opacity 400ms var(--ease-entrance), transform 400ms var(--ease-entrance);
					"
				>
					<p style="font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-score-low); margin: 0 0 4px;">⚡ Biggest tension</p>
					<p style="font-family: var(--font-display); font-size: 0.9375rem; font-style: italic; color: var(--color-primary); margin: 0; line-height: 1.4;">
						"{data.match.biggestTension}"
					</p>
				</div>

				<p class="result-watermark" style="margin: 14px 0 0; position: relative; z-index: 1;">haystack</p>
			</div>

			<!-- Alignment card -->
			<div
				style="
					background: var(--color-surface);
					border-radius: 20px;
					padding: 20px;
					border: 1.5px solid var(--color-border);
					margin-bottom: 16px;
					opacity: {alignmentVisible ? 1 : 0};
					transform: translateY({alignmentVisible ? '0' : '8px'});
					transition: opacity 400ms var(--ease-entrance), transform 400ms var(--ease-entrance);
					position: relative;
					overflow: hidden;
				"
			>
				<div style="position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: var(--color-score-high); border-radius: 0 2px 2px 0;"></div>
				<p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-score-high); margin: 0 0 8px;">Strongest alignment</p>
				<p style="font-family: var(--font-display); font-size: 1.0625rem; font-style: italic; color: var(--color-primary); margin: 0; line-height: 1.4;">
					{data.match.strongestAlignment}
				</p>
			</div>

			<!-- Component score bars -->
			{#if componentScores}
				<div
					class="component-scores-card"
					style="
						opacity: {detailVisible ? 1 : 0};
						transform: translateY({detailVisible ? '0' : '8px'});
						transition: opacity 400ms var(--ease-entrance), transform 400ms var(--ease-entrance);
					"
				>
					<p class="component-scores-title">Compatibility Breakdown</p>
					{#each componentLabels as comp}
						{@const val = componentScores[comp.key]}
						<div class="component-row">
							<div class="component-label-row">
								<span class="component-label">{comp.label}</span>
								<span class="component-value">{val}%</span>
							</div>
							<div class="component-bar-bg">
								<div
									class="component-bar-fill"
									style="width: {val}%; background: {val >= 70 ? 'var(--color-score-high)' : val >= 45 ? 'var(--color-score-mid)' : 'var(--color-score-low)'};"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Full breakdown button -->
			{#if hasProfiles}
				<div
					style="
						margin-bottom: 16px;
						opacity: {detailVisible ? 1 : 0};
						transition: opacity 400ms ease;
					"
				>
					<button
						onclick={() => (showBreakdown = true)}
						class="breakdown-trigger"
					>
						<span>🔬</span>
						Full Breakdown
					</button>
				</div>
			{/if}

			<!-- Challenge share -->
			{#if shareUrl}
				<div style="
					margin-bottom: 16px;
					opacity: {detailVisible ? 1 : 0};
					transition: opacity 400ms ease;
					text-align: center;
				">
					<p style="font-family: var(--font-display); font-size: 1rem; font-style: italic; color: var(--color-primary); margin: 0 0 12px;">
						Think someone can beat {data.match.score}%?
					</p>
					<ShareButton url={shareUrl} text={challengeShareText} />
				</div>
			{/if}

			<!-- CTA -->
			<div
				style="
					opacity: {detailVisible ? 1 : 0};
					transition: opacity 400ms ease;
				"
			>
				{#if data.isSessionOwner}
					<a
						href="/dashboard/{data.sessionId}"
						style="
							display: block;
							width: 100%;
							border-radius: 100px;
							background: var(--color-surface);
							border: 1.5px solid var(--color-border);
							padding: 14px 24px;
							font-size: 0.9375rem;
							font-weight: 600;
							color: var(--color-primary);
							text-align: center;
							text-decoration: none;
							transition: transform 150ms var(--ease-spring);
						"
					>
						← See all my matches
					</a>
				{:else if shareUrl && data.viewerArchetype}
					<!-- Responder chain CTA: archetype identity + share prompt -->
					{@const viewerArch = archetypes[data.viewerArchetype as ArchetypeId]}
					<div style="
						background: var(--color-surface);
						border-radius: 24px;
						border: 1.5px solid var(--color-border);
						padding: 24px 20px;
						text-align: center;
					">
						{#if viewerArch}
							<p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-secondary); margin: 0 0 6px;">You are</p>
							<p style="font-family: var(--font-display); font-size: 1.25rem; margin: 0 0 4px; letter-spacing: -0.01em;">{viewerArch.name}</p>
							<p style="font-size: 0.8125rem; font-style: italic; color: var(--color-accent); margin: 0 0 18px; font-weight: 500;">{viewerArch.tagline}</p>
						{/if}
						<p style="font-family: var(--font-display); font-size: 1rem; font-style: italic; color: var(--color-primary); margin: 0 0 14px;">
							Now see how you match with someone else
						</p>
						<ShareButton url={shareUrl} />
					</div>
				{:else if shareUrl}
					<div style="text-align: center;">
						<p style="font-family: var(--font-display); font-size: 1rem; font-style: italic; color: var(--color-primary); margin: 0 0 14px;">
							Compare with someone else
						</p>
						<ShareButton url={shareUrl} />
					</div>
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
							box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
						"
					>
						Compare with someone else
					</a>
				{/if}
			</div>
		</div>
	</main>

	<!-- Full Breakdown Modal -->
	{#if showBreakdown && hasProfiles}
		<div
			class="breakdown-overlay"
			onclick={() => (showBreakdown = false)}
			onkeydown={(e) => e.key === 'Escape' && (showBreakdown = false)}
			role="button"
			tabindex="-1"
		>
			<div
				class="breakdown-sheet"
				onclick={(e) => e.stopPropagation()}
				role="dialog"
				aria-label="Full compatibility breakdown"
			>
				<div class="breakdown-handle"></div>
				<button class="breakdown-close" onclick={() => (showBreakdown = false)}>×</button>

				<h2 class="breakdown-heading">Full Breakdown</h2>
				<p class="breakdown-subheading">{data.creator.name} & {data.responder.name}</p>

				<!-- Big Five Comparison -->
				<section class="breakdown-section">
					<h3 class="breakdown-section-title">Personality Traits</h3>
					{#each Object.entries(TRAIT_LABELS) as [key, labels]}
						{@const cVal = (creatorProfile as any)[key] as number}
						{@const rVal = (responderProfile as any)[key] as number}
						<div class="trait-compare-row">
							<div class="trait-compare-header">
								<span class="trait-label-low">{labels.low}</span>
								<span class="trait-name">{labels.name}</span>
								<span class="trait-label-high">{labels.high}</span>
							</div>
							<div class="trait-compare-bar">
								<div
									class="trait-marker trait-marker-creator"
									style="left: {cVal}%;"
									title="{data.creator.name}: {cVal}"
								></div>
								<div
									class="trait-marker trait-marker-responder"
									style="left: {rVal}%;"
									title="{data.responder.name}: {rVal}"
								></div>
							</div>
							<div class="trait-compare-legend">
								<span style="color: var(--color-accent); font-size: 0.6875rem; font-weight: 600;">{data.creator.name} {cVal}</span>
								<span style="color: #6366f1; font-size: 0.6875rem; font-weight: 600;">{data.responder.name} {rVal}</span>
							</div>
						</div>
					{/each}
				</section>

				<!-- Attachment Styles -->
				<section class="breakdown-section">
					<h3 class="breakdown-section-title">Attachment Styles</h3>
					<div class="attachment-badges">
						<div class="attachment-badge">
							<span class="attachment-name">{data.creator.name}</span>
							<span class="attachment-style" style="color: {creatorArchColor};">
								{ATTACHMENT_STYLE_LABELS[creatorProfile.attachmentStyle].name}
							</span>
							<span class="attachment-desc">{ATTACHMENT_STYLE_LABELS[creatorProfile.attachmentStyle].description}</span>
						</div>
						<div class="attachment-badge">
							<span class="attachment-name">{data.responder.name}</span>
							<span class="attachment-style" style="color: {responderArchColor};">
								{ATTACHMENT_STYLE_LABELS[responderProfile.attachmentStyle].name}
							</span>
							<span class="attachment-desc">{ATTACHMENT_STYLE_LABELS[responderProfile.attachmentStyle].description}</span>
						</div>
					</div>
					{#if creatorProfile.attachmentStyle === responderProfile.attachmentStyle}
						<p class="attachment-note">You share the same attachment style — you intuitively understand each other's needs.</p>
					{:else if (creatorProfile.attachmentStyle === 'anxious' && responderProfile.attachmentStyle === 'avoidant') || (creatorProfile.attachmentStyle === 'avoidant' && responderProfile.attachmentStyle === 'anxious')}
						<p class="attachment-note attachment-note-warn">The anxious-avoidant pairing can create a push-pull cycle. Awareness is the first step to breaking it.</p>
					{:else}
						<p class="attachment-note">Different attachment styles — understanding each other's patterns helps bridge the gap.</p>
					{/if}
				</section>

				<!-- Love Languages -->
				<section class="breakdown-section">
					<h3 class="breakdown-section-title">Love Languages</h3>
					<div class="love-lang-pair">
						<div class="love-lang-person">
							<span class="love-lang-name">{data.creator.name}</span>
							<div class="love-lang-badge">
								<span class="love-lang-emoji">{LOVE_LANG_LABELS[creatorProfile.loveLangPrimary].emoji}</span>
								<span class="love-lang-label">{LOVE_LANG_LABELS[creatorProfile.loveLangPrimary].name}</span>
							</div>
						</div>
						<div class="love-lang-person">
							<span class="love-lang-name">{data.responder.name}</span>
							<div class="love-lang-badge">
								<span class="love-lang-emoji">{LOVE_LANG_LABELS[responderProfile.loveLangPrimary].emoji}</span>
								<span class="love-lang-label">{LOVE_LANG_LABELS[responderProfile.loveLangPrimary].name}</span>
							</div>
						</div>
					</div>
					{#if creatorProfile.loveLangPrimary === responderProfile.loveLangPrimary}
						<p class="attachment-note">Same love language — your care naturally resonates with each other.</p>
					{:else}
						<p class="attachment-note">Different love languages — learn to show love in the way the other person feels it.</p>
					{/if}
				</section>

				<!-- Tips -->
				{#if watchOuts.length > 0}
					<section class="breakdown-section">
						<h3 class="breakdown-section-title" style="color: var(--color-score-low);">What to watch for</h3>
						{#each watchOuts as tip}
							<p class="tip-item">• {tip}</p>
						{/each}
					</section>
				{/if}

				{#if strengths.length > 0}
					<section class="breakdown-section">
						<h3 class="breakdown-section-title" style="color: var(--color-score-high);">Where you'll thrive</h3>
						{#each strengths as tip}
							<p class="tip-item">• {tip}</p>
						{/each}
					</section>
				{/if}

				<p class="breakdown-disclaimer">Scores are directional, not definitive. Use these insights as tools, not labels.</p>

				<!-- Share from breakdown -->
				{#if shareUrl}
					<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--color-border);">
						<p style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); margin: 0 0 10px; text-align: center;">Share this result</p>
						<ShareButton url={shareUrl} text={challengeShareText} />
					</div>
				{/if}
			</div>
		</div>
	{/if}
{/if}

<style>
	/* Component score bars card */
	.component-scores-card {
		background: var(--color-surface);
		border-radius: 20px;
		padding: 20px;
		border: 1.5px solid var(--color-border);
		margin-bottom: 16px;
	}
	.component-scores-title {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-secondary);
		margin: 0 0 14px;
	}
	.component-row {
		margin-bottom: 12px;
	}
	.component-row:last-child {
		margin-bottom: 0;
	}
	.component-label-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
	}
	.component-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
	}
	.component-value {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-secondary);
		font-variant-numeric: tabular-nums;
	}
	.component-bar-bg {
		height: 8px;
		border-radius: 4px;
		background: var(--color-border);
		overflow: hidden;
	}
	.component-bar-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 700ms var(--ease-spring);
	}

	/* Breakdown trigger */
	.breakdown-trigger {
		width: 100%;
		border-radius: 100px;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		padding: 14px 24px;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-family: inherit;
		transition: transform 150ms var(--ease-spring), border-color 200ms ease;
	}
	.breakdown-trigger:active {
		transform: scale(0.97);
	}

	/* Breakdown modal overlay */
	.breakdown-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 100;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fadeIn 200ms ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.breakdown-sheet {
		background: var(--color-cream);
		width: 100%;
		max-width: 28rem;
		max-height: 90dvh;
		overflow-y: auto;
		border-radius: 24px 24px 0 0;
		padding: 16px 20px 40px;
		position: relative;
		animation: slideUp 300ms var(--ease-entrance);
	}

	@keyframes slideUp {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	.breakdown-handle {
		width: 36px;
		height: 4px;
		border-radius: 2px;
		background: var(--color-border);
		margin: 0 auto 12px;
	}
	.breakdown-close {
		position: absolute;
		top: 16px;
		right: 20px;
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--color-secondary);
		cursor: pointer;
		line-height: 1;
		padding: 4px;
	}
	.breakdown-heading {
		font-family: var(--font-display);
		font-size: 1.5rem;
		margin: 0 0 2px;
		color: var(--color-primary);
	}
	.breakdown-subheading {
		font-size: 0.875rem;
		color: var(--color-secondary);
		margin: 0 0 24px;
	}
	.breakdown-section {
		margin-bottom: 28px;
	}
	.breakdown-section-title {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-secondary);
		margin: 0 0 14px;
	}

	/* Trait comparison bars */
	.trait-compare-row {
		margin-bottom: 16px;
	}
	.trait-compare-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 6px;
	}
	.trait-label-low, .trait-label-high {
		font-size: 0.6875rem;
		color: var(--color-secondary);
		font-weight: 500;
	}
	.trait-name {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--color-primary);
	}
	.trait-compare-bar {
		position: relative;
		height: 10px;
		background: var(--color-border);
		border-radius: 5px;
	}
	.trait-marker {
		position: absolute;
		top: 50%;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		border: 2px solid white;
		box-shadow: 0 1px 4px rgba(0,0,0,0.15);
	}
	.trait-marker-creator {
		background: var(--color-accent);
		z-index: 2;
	}
	.trait-marker-responder {
		background: #6366f1;
		z-index: 1;
	}
	.trait-compare-legend {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
	}

	/* Attachment */
	.attachment-badges {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 12px;
	}
	.attachment-badge {
		background: var(--color-surface);
		border-radius: 16px;
		padding: 14px;
		border: 1.5px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.attachment-name {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-secondary);
	}
	.attachment-style {
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 700;
	}
	.attachment-desc {
		font-size: 0.75rem;
		color: var(--color-secondary);
		line-height: 1.3;
	}
	.attachment-note {
		font-size: 0.8125rem;
		color: var(--color-secondary);
		margin: 0;
		line-height: 1.4;
		font-style: italic;
	}
	.attachment-note-warn {
		color: var(--color-score-low);
	}

	/* Love Languages */
	.love-lang-pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 12px;
	}
	.love-lang-person {
		background: var(--color-surface);
		border-radius: 16px;
		padding: 14px;
		border: 1.5px solid var(--color-border);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.love-lang-name {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--color-secondary);
	}
	.love-lang-badge {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.love-lang-emoji {
		font-size: 1.25rem;
	}
	.love-lang-label {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary);
	}

	/* Tips */
	.tip-item {
		font-size: 0.8125rem;
		color: var(--color-primary);
		line-height: 1.5;
		margin: 0 0 8px;
	}

	.breakdown-disclaimer {
		font-size: 0.75rem;
		color: var(--color-secondary);
		text-align: center;
		font-style: italic;
		margin: 0;
		padding-top: 8px;
		border-top: 1px solid var(--color-border);
	}
</style>

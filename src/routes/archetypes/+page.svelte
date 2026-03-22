<script lang="ts">
	import { browser } from '$app/environment';
	import { archetypes, type ArchetypeId } from '$lib/questions';
	import ArchetypeIcon from '$lib/components/ArchetypeIcon.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let visible = $state(false);

	const archColors: Record<string, { bg: string; fg: string; glow: string }> = {
		guardian:    { bg: '#E0F2F1', fg: '#2DB87A', glow: 'rgba(45, 184, 122, 0.2)' },
		maker:      { bg: '#FFF3E0', fg: '#E8863F', glow: 'rgba(232, 134, 63, 0.2)' },
		visionary:  { bg: '#E3F2FD', fg: '#2979FF', glow: 'rgba(41, 121, 255, 0.2)' },
		champion:   { bg: '#FFEBEE', fg: '#E8563F', glow: 'rgba(232, 86, 63, 0.2)' },
		connector:  { bg: '#F3E5F5', fg: '#AB47BC', glow: 'rgba(171, 71, 188, 0.2)' },
		catalyst:   { bg: '#FFF8E1', fg: '#F9A825', glow: 'rgba(249, 168, 37, 0.2)' },
		dreamer:    { bg: '#EDE7F6', fg: '#7C4DFF', glow: 'rgba(124, 77, 255, 0.2)' },
		maverick:   { bg: '#ECEFF1', fg: '#546E7A', glow: 'rgba(84, 110, 122, 0.2)' },
		advocate:   { bg: '#FCE4EC', fg: '#E91E63', glow: 'rgba(233, 30, 99, 0.2)' },
		facilitator:{ bg: '#E8F5E9', fg: '#43A047', glow: 'rgba(67, 160, 71, 0.2)' }
	};

	const orderedIds: ArchetypeId[] = [
		'guardian', 'maker', 'visionary', 'champion', 'connector',
		'catalyst', 'dreamer', 'maverick', 'advocate', 'facilitator'
	];

	$effect(() => {
		if (!browser) return;
		setTimeout(() => (visible = true), 80);
	});
</script>

<svelte:head>
	<title>The 10 Archetypes — Haystack</title>
	<meta name="description" content="Discover the 10 Haystack archetypes. Which one are you?" />
</svelte:head>

<main style="
	min-height: 100dvh;
	background: var(--color-cream);
	opacity: {visible ? 1 : 0};
	transition: opacity 400ms ease;
">
	<div style="max-width: 480px; margin: 0 auto; padding: 32px 20px 48px;">

		<div style="display: flex; justify-content: center; margin-bottom: 28px;">
			<Logo size="sm" />
		</div>

		<div style="text-align: center; margin-bottom: 36px;">
			<h1 style="
				font-family: var(--font-display);
				font-size: 1.75rem;
				margin: 0 0 8px;
				letter-spacing: -0.02em;
			">The 10 Archetypes</h1>
			<p style="font-size: 0.9375rem; color: var(--color-secondary); margin: 0; line-height: 1.5;">
				Everyone falls into one of these. Take the quiz to find yours.
			</p>
		</div>

		<div class="card-grid">
			{#each orderedIds as id, i}
				{@const arch = archetypes[id]}
				{@const colors = archColors[id]}
				<div
					class="arch-card"
					style="
						animation-delay: {60 + i * 50}ms;
						--card-fg: {colors.fg};
						--card-bg: {colors.bg};
						--card-glow: {colors.glow};
					"
				>
					<!-- Hero zone -->
					<div class="card-hero">
						<div class="hero-pattern">
							<div class="hero-ring ring-1"></div>
							<div class="hero-ring ring-2"></div>
							<div class="hero-ring ring-3"></div>
						</div>
						<div class="hero-icon">
							<ArchetypeIcon archetype={id} size={72} />
						</div>
						<span class="card-number">#{String(i + 1).padStart(2, '0')}</span>
					</div>

					<!-- Content zone -->
					<div class="card-body">
						<h2 class="card-name">{arch.name}</h2>
						<p class="card-tagline" style="color: {colors.fg};">{arch.tagline}</p>
						<p class="card-description">{arch.description}</p>

						<div class="card-meta">
							<span class="meta-pill" style="background: {colors.bg}; color: {colors.fg};">{arch.traitSignature}</span>
							<span class="meta-pill" style="background: {colors.bg}; color: {colors.fg};">{arch.attachmentTendency}</span>
							<span class="meta-pill" style="background: {colors.bg}; color: {colors.fg};">{arch.typicalLoveLanguage}</span>
						</div>

						<div class="card-traits">
							<div class="trait-block">
								<p class="trait-block-title" style="color: var(--color-score-high);">Strengths</p>
								{#each arch.strengths as s}
									<p class="trait-item">✦ {s}</p>
								{/each}
							</div>
							<div class="trait-block">
								<p class="trait-block-title" style="color: var(--color-score-low);">Blind spots</p>
								{#each arch.blindSpots as b}
									<p class="trait-item">• {b}</p>
								{/each}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div style="text-align: center; margin-top: 40px;">
			<a
				href="/q"
				style="
					display: inline-block;
					border-radius: 100px;
					background: var(--color-accent);
					padding: 14px 36px;
					font-size: 1rem;
					font-weight: 700;
					color: white;
					text-decoration: none;
					box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
					transition: transform 150ms var(--ease-spring);
				"
			>Find your archetype</a>
		</div>
	</div>
</main>

<style>
	.card-grid {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.arch-card {
		background: var(--color-surface);
		border-radius: 24px;
		border: 1.5px solid var(--color-border);
		overflow: hidden;
		animation: cardEnter 500ms var(--ease-entrance) both;
		transition: transform 200ms var(--ease-spring), box-shadow 200ms ease;
	}

	.arch-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 32px var(--card-glow);
	}

	.card-hero {
		position: relative;
		background: var(--card-bg);
		height: 160px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-pattern {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-ring {
		position: absolute;
		border-radius: 50%;
		border: 1.5px solid var(--card-fg);
		opacity: 0.08;
	}

	.ring-1 {
		width: 120px;
		height: 120px;
	}

	.ring-2 {
		width: 200px;
		height: 200px;
	}

	.ring-3 {
		width: 300px;
		height: 300px;
	}

	.hero-icon {
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 4px 12px var(--card-glow));
	}

	.card-number {
		position: absolute;
		top: 12px;
		right: 14px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: var(--card-fg);
		opacity: 0.4;
	}

	.card-body {
		padding: 20px 22px 24px;
	}

	.card-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		margin: 0;
		letter-spacing: -0.01em;
		color: var(--color-primary);
	}

	.card-tagline {
		font-size: 0.8125rem;
		font-style: italic;
		font-weight: 600;
		margin: 4px 0 0;
	}

	.card-description {
		font-size: 0.875rem;
		color: var(--color-secondary);
		margin: 12px 0 0;
		line-height: 1.6;
	}

	.card-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 14px;
	}

	.meta-pill {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 100px;
		white-space: nowrap;
	}

	.card-traits {
		margin-top: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.trait-block-title {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0 0 6px;
	}

	.trait-item {
		font-size: 0.8125rem;
		color: var(--color-primary);
		margin: 0 0 4px;
		line-height: 1.5;
	}

	@keyframes cardEnter {
		from {
			opacity: 0;
			transform: translateY(20px) scale(0.97);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (min-width: 480px) {
		.card-hero {
			height: 180px;
		}
	}
</style>

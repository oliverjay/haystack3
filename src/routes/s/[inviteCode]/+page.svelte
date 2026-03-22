<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { markMatchRevealed } from '$lib/device';
	import Avatar from '$lib/components/Avatar.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { data } = $props();
	let visible = $state(false);
	let matching = $state(false);
	let liveCount = $state(0);
	let liveTimer: ReturnType<typeof setInterval> | undefined;

	$effect(() => {
		if (!browser) return;

		if (data.returningUser?.alreadyMatchedId && data.returningUser?.alreadyMatchedSessionId) {
			goto(
				`/result/${data.returningUser.alreadyMatchedSessionId}/${data.returningUser.alreadyMatchedId}?reveal=1`,
				{ replaceState: true }
			);
			return;
		}

		liveCount = 14 + Math.floor(Math.random() * 8);
		liveTimer = setInterval(() => {
			const delta = Math.random() < 0.5 ? 1 : -1;
			const next = liveCount + delta;
			if (next >= 8 && next <= 30) liveCount = next;
		}, 3500 + Math.random() * 3000);

		setTimeout(() => (visible = true), 100);

		return () => { if (liveTimer) clearInterval(liveTimer); };
	});

	function start() {
		goto(`/q?s=${data.session.id}&creator=${encodeURIComponent(data.session.creatorName)}`);
	}
</script>

<svelte:head>
	<title>{data.session.creatorName} wants to know — Haystack</title>
	<meta name="description" content="{data.session.creatorName} answered 15 questions about themselves. Answer the same ones — find out your % match." />
	<meta name="robots" content="noindex" />
	<meta property="og:title" content="{data.session.creatorName} wants to compare with you" />
	<meta property="og:description" content="{data.session.creatorName} answered 15 questions about how they connect. Now it's your turn. See your score in 60 seconds." />
	<meta property="og:image" content="/og/{data.session.id}" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{data.session.creatorName} wants to compare with you" />
	<meta name="twitter:description" content="{data.session.creatorName} answered 15 questions about how they connect. Now it's your turn. See your score in 60 seconds." />
	<meta name="twitter:image" content="/og/{data.session.id}" />
</svelte:head>

<main
	style="
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px 20px;
		position: relative;
		overflow: hidden;
		background: var(--color-cream);
		opacity: {visible ? 1 : 0};
		transition: opacity 400ms var(--ease-entrance);
	"
>
	<!-- Decorative blobs -->
	<div class="deco-blob" style="width: 260px; height: 260px; background: var(--color-accent); top: -80px; left: -80px;"></div>
	<div class="deco-blob" style="width: 200px; height: 200px; background: #7C4DFF; bottom: -40px; right: -60px;"></div>

	<div style="display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; width: 100%; max-width: 380px; position: relative; z-index: 1;">

		<!-- Logo -->
		<div style="margin-bottom: 4px;">
			<Logo size="sm" />
		</div>

		<!-- Avatar with glow -->
		<div style="animation: bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1); position: relative;">
			<div style="
				position: absolute;
				inset: -8px;
				border-radius: 50%;
				background: radial-gradient(circle, rgba(232, 86, 63, 0.15), transparent 70%);
				pointer-events: none;
			"></div>
			<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={96} />
		</div>

		{#if data.returningUser && !data.returningUser.alreadyMatchedId}
			<!-- Returning user: instant match -->
			<div>
				<p style="font-family: var(--font-display); font-size: 1.25rem; line-height: 1.4; margin: 0;">
					See your result with <span style="font-style: italic;">{data.session.creatorName}</span>
				</p>
				<p style="font-size: 0.9375rem; color: var(--color-secondary); margin: 8px 0 0;">
					You've already taken the quiz — instant match.
				</p>
			</div>

			<!-- Visual hint: both avatars -->
			<div style="
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 14px 24px;
				background: var(--color-surface);
				border-radius: 100px;
				border: 1.5px solid var(--color-border);
			">
				<Avatar emoji={data.returningUser.emoji} avatarUrl={data.returningUser.avatarUrl} size={34} />
				<span style="font-family: var(--font-display); font-size: 1.125rem; color: var(--color-accent); opacity: 0.8;">?%</span>
				<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={34} />
			</div>

			<form
				method="POST"
				action="?/instantMatch"
				use:enhance={() => {
					matching = true;
					return async ({ result }) => {
						if (result.type === 'redirect') {
							const matchId = result.location.split('/').pop() ?? '';
							markMatchRevealed(matchId);
							goto(result.location);
						} else {
							matching = false;
						}
					};
				}}
			>
				<button
					type="submit"
					disabled={matching}
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
						margin-top: 4px;
						box-shadow: 0 4px 20px rgba(232, 86, 63, 0.3);
						transition: transform 150ms var(--ease-spring);
						opacity: {matching ? 0.7 : 1};
					"
				>
					{matching ? 'Matching...' : 'Reveal your result'}
				</button>
			</form>

			<button
				onclick={start}
				style="
					background: none;
					border: none;
					color: var(--color-secondary);
					font-size: 0.8125rem;
					cursor: pointer;
					text-decoration: underline;
					padding: 0;
				"
			>
				Retake the quiz instead
			</button>
		{:else}
			<!-- New user: take quiz flow -->
			<div>
				<p style="font-family: var(--font-display); font-size: 1.25rem; line-height: 1.4; margin: 0;">
					<span style="font-style: italic;">{data.session.creatorName}</span> answered 15 questions.
				</p>
				<p style="font-size: 0.9375rem; color: var(--color-secondary); margin: 8px 0 0;">
					Answer the same ones. See if you actually match.
				</p>
			</div>

			<!-- Visual hint -->
			<div style="
				display: flex;
				align-items: center;
				gap: 14px;
				padding: 14px 24px;
				background: var(--color-surface);
				border-radius: 100px;
				border: 1.5px solid var(--color-border);
			">
				<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={34} />
				<span style="font-family: var(--font-display); font-size: 1.125rem; color: var(--color-accent); opacity: 0.8;">?%</span>
				<div style="
					width: 34px;
					height: 34px;
					border-radius: 50%;
					border: 2px dashed var(--color-border);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.875rem;
					background: var(--color-surface);
				">🫵</div>
			</div>

			<!-- What you'll get preview -->
			<div style="
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 20px;
			">
				<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
					<span style="font-size: 1.125rem;">📊</span>
					<span style="font-size: 0.6875rem; font-weight: 600; color: var(--color-secondary);">Score</span>
				</div>
				<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
					<span style="font-size: 1.125rem;">🧬</span>
					<span style="font-size: 0.6875rem; font-weight: 600; color: var(--color-secondary);">Archetype</span>
				</div>
				<div style="display: flex; flex-direction: column; align-items: center; gap: 3px;">
					<span style="font-size: 1.125rem;">⚡</span>
					<span style="font-size: 0.6875rem; font-weight: 600; color: var(--color-secondary);">Tension</span>
				</div>
			</div>

			<button
				onclick={start}
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
					margin-top: 4px;
					box-shadow: 0 4px 20px rgba(232, 86, 63, 0.3);
					transition: transform 150ms var(--ease-spring);
				"
			>
				Take the quiz
			</button>

			<!-- Time badge + social proof -->
			<div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
				<span style="
					display: inline-flex;
					align-items: center;
					gap: 6px;
					padding: 6px 14px;
					border-radius: 100px;
					background: var(--color-surface);
					border: 1.5px solid var(--color-border);
					font-size: 0.75rem;
					font-weight: 600;
					color: var(--color-primary);
				">⏱ 60 sec · no sign-up</span>
				<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 0; display: flex; align-items: center; gap: 4px;">
					<span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--color-score-high); animation: pulse 2s ease-in-out infinite;"></span>
					{liveCount} people comparing right now
				</p>
			</div>
		{/if}
	</div>
</main>

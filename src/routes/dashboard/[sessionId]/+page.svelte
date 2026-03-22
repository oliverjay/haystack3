<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { getRevealedMatches, markMatchRevealed } from '$lib/device';
	import { archetypes, type ArchetypeId } from '$lib/questions';
	import { getScoreColor } from '$lib/scoring';
	import { getSupabase } from '$lib/supabase';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarPicker from '$lib/components/AvatarPicker.svelte';
	import ArchetypeIcon from '$lib/components/ArchetypeIcon.svelte';
	import ShareButton from '$lib/components/ShareButton.svelte';
	import Logo from '$lib/components/Logo.svelte';

	let { data } = $props();

	const sessionId = data.session.id;
	let visible = $state(false);
	let inited = false;

	let shareUrl = $derived(
		browser && data.session.inviteCode
			? `${window.location.origin}/s/${data.session.inviteCode}`
			: ''
	);

	const arch = archetypes[data.archetype as ArchetypeId];

	let creatorEmoji = $state(data.session.creatorEmoji);
	let creatorAvatarUrl = $state<string | null>(data.session.creatorAvatarUrl);
	let showPicker = $state(false);
	let showArchetypeDetail = $state(false);

	// Live-polling state for new matches
	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let liveMatches = $state(data.matches);
	let newMatchAlert = $state<{ id: string; sessionId: string; name: string; emoji: string; avatarUrl: string | null } | null>(null);
	let revealedIds = $state<Set<string>>(new Set());

	let hasMatches = $derived(liveMatches.length > 0);

	$effect(() => {
		if (!browser || inited) return;
		inited = true;

		revealedIds = getRevealedMatches();

		setTimeout(() => (visible = true), 100);

		startPolling();
		return () => {
			if (pollTimer) clearInterval(pollTimer);
		};
	});

	function startPolling() {
		pollTimer = setInterval(pollForNewMatches, 4000);
	}

	async function pollForNewMatches() {
		try {
			const supabase = getSupabase();
			const { data: freshMatches, error: err } = await supabase
				.from('matches')
				.select('id, score, pair_dynamic, biggest_tension, responder_response_id')
				.eq('session_id', sessionId)
				.order('created_at', { ascending: false });

			if (err || !freshMatches) return;

			if (freshMatches.length > liveMatches.length) {
				const newMatch = freshMatches[0];
				const { data: resp } = await supabase
					.from('responses')
					.select('responder_name, responder_emoji, archetype, avatar_url')
					.eq('id', newMatch.responder_response_id)
					.single();

			const newEntry = {
				id: newMatch.id,
				sessionId,
				score: newMatch.score,
				pairDynamic: newMatch.pair_dynamic ?? '',
				biggestTension: newMatch.biggest_tension ?? '',
				otherName: resp?.responder_name ?? 'Someone',
				otherEmoji: resp?.responder_emoji ?? '❓',
				otherArchetype: resp?.archetype ?? 'guardian',
				otherAvatarUrl: resp?.avatar_url ?? null
			};

			liveMatches = [newEntry, ...liveMatches];
			newMatchAlert = {
				id: newMatch.id,
				sessionId,
				name: newEntry.otherName,
				emoji: newEntry.otherEmoji,
				avatarUrl: newEntry.otherAvatarUrl
			};
			}
		} catch {
			// Polling error — silently retry
		}
	}

	async function handleAvatarChange(newEmoji: string, newAvatarUrl: string | null) {
		creatorEmoji = newEmoji;
		creatorAvatarUrl = newAvatarUrl;
		showPicker = false;

		const supabase = getSupabase();
		await supabase.from('sessions').update({
			creator_emoji: newEmoji,
			creator_avatar_url: newAvatarUrl
		}).eq('id', sessionId);
		await supabase.from('responses').update({
			responder_emoji: newEmoji,
			avatar_url: newAvatarUrl
		}).eq('session_id', sessionId).eq('is_creator', true);
	}

	function viewResult(matchSessionId: string, matchId: string) {
		newMatchAlert = null;
		const alreadySeen = revealedIds.has(matchId);
		markMatchRevealed(matchId);
		revealedIds = getRevealedMatches();
		const url = alreadySeen
			? `/result/${matchSessionId}/${matchId}?reveal=1`
			: `/result/${matchSessionId}/${matchId}`;
		goto(url);
	}

	async function logout() {
		await getSupabase().auth.signOut();
		goto('/', { replaceState: true });
	}
</script>

<svelte:head>
	<title>{hasMatches ? 'Your matches' : data.session.creatorName} — Haystack</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	style="
		min-height: 100dvh;
		background: var(--color-cream);
		opacity: {visible ? 1 : 0};
		transition: opacity 400ms ease;
	"
>
	<div style="max-width: 380px; margin: 0 auto; padding: 32px 20px 48px;">

		<!-- Top logo -->
		<div style="display: flex; justify-content: center; margin-bottom: 24px;">
			<Logo size="sm" />
		</div>

		<!-- Profile card -->
		<div style="
			background: var(--color-surface);
			border-radius: 24px;
			border: 1.5px solid var(--color-border);
			padding: 28px 20px 24px;
			margin-bottom: 28px;
			display: flex;
			flex-direction: column;
			align-items: center;
			text-align: center;
		">
			<div style="position: relative; margin-bottom: 14px;">
				<Avatar
					emoji={creatorEmoji}
					avatarUrl={creatorAvatarUrl}
					size={80}
					onClick={() => (showPicker = true)}
				/>
				<div style="
					position: absolute;
					bottom: -2px;
					right: -2px;
					width: 22px;
					height: 22px;
					border-radius: 50%;
					background: var(--color-surface);
					border: 1.5px solid var(--color-border);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.55rem;
					pointer-events: none;
				">✏️</div>
			</div>

			<h1 style="font-family: var(--font-display); font-size: 1.375rem; margin: 0; letter-spacing: -0.01em;">{data.session.creatorName}</h1>

			{#if arch}
				<div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
					<ArchetypeIcon archetype={data.archetype as ArchetypeId} size={24} />
					<span style="font-family: var(--font-display); font-size: 0.9375rem;">{arch.name}</span>
				</div>
				<p style="
					font-size: 0.75rem;
					font-style: italic;
					color: var(--color-accent);
					margin: 4px 0 0;
					font-weight: 500;
				">{arch.tagline}</p>

				<button
					onclick={() => (showArchetypeDetail = true)}
					style="
						margin-top: 14px;
						padding: 8px 20px;
						border-radius: 100px;
						background: var(--color-cream);
						border: 1.5px solid var(--color-border);
						font-size: 0.8125rem;
						font-weight: 600;
						color: var(--color-primary);
						cursor: pointer;
						transition: transform 150ms var(--ease-spring);
					"
				>Learn more</button>
			{/if}
		</div>

		<!-- New match alert banner -->
		{#if newMatchAlert}
			<button
				onclick={() => viewResult(newMatchAlert?.sessionId ?? sessionId, newMatchAlert?.id ?? '')}
				style="
					width: 100%;
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 14px 16px;
					background: var(--color-surface);
					border-radius: 20px;
					border: 1.5px solid var(--color-accent);
					margin-bottom: 16px;
					cursor: pointer;
					animation: scaleUp 400ms var(--ease-spring);
				"
			>
				<Avatar emoji={newMatchAlert.emoji} avatarUrl={newMatchAlert.avatarUrl} size={40} />
				<div style="flex: 1; text-align: left;">
					<p style="font-size: 0.9375rem; font-weight: 700; color: var(--color-accent); margin: 0;">
						{newMatchAlert.name} just finished!
					</p>
					<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 2px 0 0;">
						Tap to see your score
					</p>
				</div>
				<span style="font-size: 1.25rem;">→</span>
			</button>
		{/if}

		{#if hasMatches}
			<!-- ===== MATCH LIST ===== -->
			<div style="display: flex; flex-direction: column; gap: 14px;">
	{#each liveMatches as match}
		{@const isRevealed = revealedIds.has(match.id)}
		{@const matchArch = archetypes[match.otherArchetype as ArchetypeId]}
		<button
			onclick={() => viewResult(match.sessionId, match.id)}
			style="
				width: 100%;
				background: var(--color-surface);
				border-radius: 20px;
				border: 1.5px solid var(--color-border);
				padding: 14px 16px;
				text-align: left;
				cursor: pointer;
				transition: transform 150ms var(--ease-spring);
				display: flex;
				align-items: center;
				gap: 14px;
			"
		>
			<Avatar
				emoji={match.otherEmoji}
				avatarUrl={match.otherAvatarUrl}
				size={44}
				borderColor="var(--color-border)"
			/>
			<div style="flex: 1; min-width: 0;">
				<p style="font-size: 0.9375rem; font-weight: 600; margin: 0; color: var(--color-primary);">{match.otherName}</p>
				{#if !isRevealed}
					<p style="font-size: 0.75rem; color: var(--color-accent); margin: 2px 0 0; font-weight: 500;">Tap to reveal</p>
				{:else if matchArch}
					<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 2px 0 0;">{matchArch.name}</p>
				{/if}
			</div>
			{#if !isRevealed}
				<span style="font-size: 1.125rem;">✨</span>
			{:else}
				<span style="
					font-family: var(--font-display);
					font-size: 1.375rem;
					font-variant-numeric: tabular-nums;
					letter-spacing: -0.02em;
					color: {getScoreColor(match.score)};
				">{match.score}%</span>
			{/if}
		</button>
	{/each}
			</div>

			<!-- Share CTA -->
			{#if shareUrl}
				<div style="margin-top: 28px;">
					<p style="font-family: var(--font-display); font-size: 1.125rem; font-style: italic; color: var(--color-primary); margin: 0 0 12px; text-align: center;">Compare with someone else</p>
					<ShareButton url={shareUrl} />
				</div>
			{/if}

		{:else}
			<!-- ===== EMPTY STATE — SHARE PROMPT ===== -->
			<div style="
				text-align: center;
				padding: 36px 24px;
				background: var(--color-surface);
				border-radius: 28px;
				border: 1.5px solid var(--color-border);
				margin-bottom: 20px;
			">
				<p style="font-family: var(--font-display); font-size: 1.25rem; font-style: italic; color: var(--color-primary); margin: 0 0 6px; line-height: 1.4;">
					Now pick someone to compare with.
				</p>
				<p style="font-size: 0.875rem; color: var(--color-secondary); margin: 0 0 24px; line-height: 1.5;">
					Send your link. They answer the same 15 questions. You both get a score.
				</p>

				<!-- Visual: how it works -->
				<div style="
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 12px;
					padding: 0 0 24px;
				">
					<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
						<Avatar emoji={creatorEmoji} avatarUrl={creatorAvatarUrl} size={44} />
						<span style="font-size: 0.625rem; font-weight: 600; color: var(--color-primary);">{data.session.creatorName}</span>
						<span style="font-size: 0.5625rem; font-weight: 600; color: var(--color-score-high);">Done ✓</span>
					</div>

					<div style="display: flex; flex-direction: column; align-items: center; gap: 1px;">
						<span style="font-family: var(--font-display); font-size: 1rem; color: var(--color-primary); letter-spacing: -0.02em;">x%</span>
						<span style="font-size: 0.5625rem; font-weight: 500; color: var(--color-secondary);">compatible</span>
					</div>

					<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
						<div style="
							width: 44px;
							height: 44px;
							border-radius: 50%;
							border: 2px dashed var(--color-border);
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 1.125rem;
							background: var(--color-surface);
							animation: gentleBounce 2.5s ease-in-out infinite;
						">🫵</div>
						<span style="font-size: 0.625rem; font-weight: 600; color: var(--color-secondary);">A friend</span>
						<span style="font-size: 0.5625rem; color: var(--color-accent);">Their turn</span>
					</div>
				</div>

				{#if shareUrl}
					<ShareButton url={shareUrl} />
				{/if}
			</div>

			<!-- Polling indicator -->
			<div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.6875rem; color: var(--color-secondary); opacity: 0.6; text-align: center;">
				<span style="display: inline-block; flex-shrink: 0; width: 5px; height: 5px; border-radius: 50%; background: var(--color-score-high); animation: pulse 2s ease-in-out infinite;"></span>
				Waiting for someone to finish — results appear here automatically
			</div>
		{/if}

		<button
			onclick={logout}
			style="
				display: block;
				margin: 32px auto 0;
				background: none;
				border: none;
				padding: 8px 16px;
				font-size: 0.75rem;
				font-weight: 500;
				color: var(--color-secondary);
				opacity: 0.5;
				cursor: pointer;
				font-family: inherit;
			"
		>Log out</button>

	</div>
</main>

{#if showPicker}
	<AvatarPicker
		currentEmoji={creatorEmoji}
		currentAvatarUrl={creatorAvatarUrl}
		onSelect={handleAvatarChange}
		onClose={() => (showPicker = false)}
	/>
{/if}

{#if showArchetypeDetail && arch}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={() => (showArchetypeDetail = false)}
		onkeydown={(e) => e.key === 'Escape' && (showArchetypeDetail = false)}
		style="
			position: fixed;
			inset: 0;
			z-index: 100;
			background: rgba(0, 0, 0, 0.4);
			display: flex;
			align-items: flex-end;
			justify-content: center;
			padding: 20px;
			animation: fadeIn 200ms ease;
		"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			style="
				background: var(--color-surface);
				border-radius: 24px 24px 24px 24px;
				padding: 28px 24px 32px;
				width: 100%;
				max-width: 400px;
				max-height: 80dvh;
				overflow-y: auto;
				animation: slideUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
				display: flex;
				flex-direction: column;
				align-items: center;
				text-align: center;
			"
		>
			<ArchetypeIcon archetype={data.archetype as ArchetypeId} size={56} />
			<p style="
				font-family: var(--font-display);
				font-size: 1.375rem;
				margin: 12px 0 0;
				letter-spacing: -0.01em;
			">{arch.name}</p>
			<p style="
				font-size: 0.8125rem;
				font-style: italic;
				color: var(--color-accent);
				margin: 4px 0 0;
				font-weight: 500;
			">{arch.tagline}</p>
			<p style="
				font-size: 0.875rem;
				color: var(--color-secondary);
				margin: 16px 0 0;
				line-height: 1.6;
				text-align: left;
			">{arch.description}</p>

			<!-- Trait signature + meta -->
			<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px;">
				<span style="font-size: 0.6875rem; font-weight: 600; padding: 4px 10px; border-radius: 100px; background: var(--color-accent-light); color: var(--color-accent);">{arch.traitSignature}</span>
				<span style="font-size: 0.6875rem; font-weight: 600; padding: 4px 10px; border-radius: 100px; background: var(--color-accent-light); color: var(--color-accent);">{arch.attachmentTendency}</span>
				<span style="font-size: 0.6875rem; font-weight: 600; padding: 4px 10px; border-radius: 100px; background: var(--color-accent-light); color: var(--color-accent);">{arch.typicalLoveLanguage}</span>
			</div>

			<!-- Strengths -->
			<div style="width: 100%; text-align: left; margin-top: 18px;">
				<p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-score-high); margin: 0 0 8px;">Strengths</p>
				{#each arch.strengths as s}
					<p style="font-size: 0.8125rem; color: var(--color-primary); margin: 0 0 4px; line-height: 1.5;">✦ {s}</p>
				{/each}
			</div>

			<!-- Blind spots -->
			<div style="width: 100%; text-align: left; margin-top: 14px;">
				<p style="font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--color-score-low); margin: 0 0 8px;">Blind spots</p>
				{#each arch.blindSpots as b}
					<p style="font-size: 0.8125rem; color: var(--color-primary); margin: 0 0 4px; line-height: 1.5;">• {b}</p>
				{/each}
			</div>

			<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 24px; width: 100%;">
				<button
					onclick={() => (showArchetypeDetail = false)}
					style="
						padding: 12px 32px;
						border-radius: 100px;
						background: var(--color-accent);
						color: white;
						border: none;
						font-size: 0.9375rem;
						font-weight: 700;
						cursor: pointer;
						transition: transform 150ms var(--ease-spring);
					"
				>Got it</button>
				<a
					href="/archetypes"
					style="
						font-size: 0.8125rem;
						color: var(--color-secondary);
						text-decoration: underline;
						text-underline-offset: 2px;
					"
				>See all 10 archetypes</a>
			</div>
		</div>
	</div>
{/if}


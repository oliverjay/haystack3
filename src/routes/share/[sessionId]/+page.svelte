<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { archetypes, type ArchetypeId } from '$lib/questions';
	import { getDeviceId } from '$lib/device';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data } = $props();

	let sessionId = $derived($page.params.sessionId);
	let shareUrl = $derived(browser ? `${window.location.origin}/s/${sessionId}` : '');
	let copied = $state(false);
	let visible = $state(false);
	let cardRevealed = $state(false);

	let phone = $state('');
	let phoneSaved = $state(false);
	let phoneSaving = $state(false);

	const arch = archetypes[data.archetype as ArchetypeId];

	let matchResult = $state<{ id: string; score: number; otherName: string; otherEmoji: string } | null>(null);
	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let shareInited = false;

	$effect(() => {
		if (!browser || shareInited) return;
		shareInited = true;

		const currentDeviceId = getDeviceId();
		if (currentDeviceId !== data.session.creatorDeviceId) {
			goto('/', { replaceState: true });
			return;
		}

		setTimeout(() => (visible = true), 100);
		setTimeout(() => (cardRevealed = true), 500);
		startPolling();
		return () => {
			if (pollTimer) clearInterval(pollTimer);
		};
	});

	function startPolling() {
		checkForMatch();
		pollTimer = setInterval(checkForMatch, 4000);
	}

	async function checkForMatch() {
		const { data: matches } = await supabase
			.from('matches')
			.select('id, score, responder_response_id')
			.eq('session_id', sessionId)
			.limit(1);

		if (matches && matches.length > 0) {
			const match = matches[0];
			const { data: resp } = await supabase
				.from('responses')
				.select('responder_name, responder_emoji')
				.eq('id', match.responder_response_id)
				.single();

			matchResult = {
				id: match.id,
				score: match.score,
				otherName: resp?.responder_name ?? 'Someone',
				otherEmoji: resp?.responder_emoji ?? '❓'
			};
			if (pollTimer) clearInterval(pollTimer);
		}
	}

	function viewResult() {
		if (matchResult) goto(`/result/${sessionId}/${matchResult.id}`);
	}

	async function shareNative() {
		const text = `Think we're compatible? Find out 👀\n${shareUrl}`;
		if (navigator.share) {
			try {
				await navigator.share({ text, url: shareUrl });
				return;
			} catch {}
		}
		window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
	}

	async function savePhone() {
		const cleaned = phone.replace(/\s/g, '');
		if (!cleaned || cleaned.length < 7) return;
		phoneSaving = true;
		await supabase
			.from('sessions')
			.update({ creator_phone: cleaned })
			.eq('id', sessionId);
		phoneSaved = true;
		phoneSaving = false;
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			const input = document.createElement('input');
			input.value = shareUrl;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<main
	style="
		display: flex;
		min-height: 100dvh;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px 20px;
		background: var(--color-cream);
		opacity: {visible ? 1 : 0};
		transition: opacity 500ms var(--ease-entrance);
		position: relative;
	"
>
	<!-- Wordmark nav -->
	<a
		href="/"
		style="
			position: absolute;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			font-size: 0.75rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			color: var(--color-secondary);
			opacity: 0.5;
			text-decoration: none;
			text-transform: uppercase;
		"
	>Haystack</a>

	<div style="display: flex; flex-direction: column; align-items: center; gap: 24px; text-align: center; max-width: 340px; width: 100%;">

		{#if matchResult}
			<!-- ===== MATCH FOUND STATE ===== -->

			<!-- Score hero card -->
			<div style="
				width: 100%;
				background: var(--color-surface);
				border-radius: 24px;
				padding: 28px 24px 24px;
				border: 1.5px solid var(--color-border);
				text-align: center;
				animation: fadeIn 400ms ease;
			">
				<!-- Overlapping avatars -->
				<div style="display: flex; justify-content: center; margin-bottom: 16px;">
					<div style="position: relative; z-index: 1;">
						<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={56} />
					</div>
					<div style="margin-left: -12px; animation: bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1);">
						<Avatar emoji={matchResult.otherEmoji} size={56} />
					</div>
				</div>

				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 2px;">
					{data.session.creatorName} × {matchResult.otherName}
				</p>

				<!-- Blurred score tease -->
				<div style="
					font-size: 3rem;
					font-weight: 800;
					color: var(--color-secondary);
					filter: blur(8px);
					opacity: 0.4;
					margin: 8px 0;
					letter-spacing: -0.04em;
					font-variant-numeric: tabular-nums;
				">{matchResult.score}%</div>

				<p style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); margin: 0;">
					{matchResult.otherName} finished!
				</p>
				<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 4px 0 0;">
					Your compatibility result is ready.
				</p>
			</div>

			<button
				onclick={viewResult}
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
					animation: fadeIn 600ms ease;
					animation-delay: 200ms;
					animation-fill-mode: both;
				"
			>
				See your result
			</button>

		{:else}
			<!-- ===== WAITING STATE ===== -->

			<!-- Archetype result -->
			<div
				style="
					width: 100%;
					background: var(--color-surface);
					border-radius: 24px;
					padding: 28px 24px 24px;
					border: 1.5px solid var(--color-border);
					text-align: center;
					opacity: {cardRevealed ? 1 : 0};
					transform: translateY({cardRevealed ? '0' : '8px'});
					transition: opacity 500ms var(--ease-entrance), transform 500ms var(--ease-entrance);
				"
			>
				<div style="margin: 0 auto 12px; display: flex; justify-content: center;">
					<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={64} />
				</div>
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 2px;">You are</p>
				<p style="font-size: 1.25rem; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
					{arch?.name ?? 'The Drifter'}
				</p>
				{#if arch?.tagline}
					<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 4px 0 0;">
						{arch.tagline}
					</p>
				{/if}
			</div>

			<!-- The "what now" explanation -->
			<div
				style="
					width: 100%;
					text-align: center;
					opacity: {cardRevealed ? 1 : 0};
					transition: opacity 600ms var(--ease-entrance);
					transition-delay: 200ms;
				"
			>
				<p style="font-size: 1.125rem; font-weight: 700; color: var(--color-primary); margin: 0 0 6px; line-height: 1.4;">
					Now send it to someone.
				</p>
				<p style="font-size: 0.875rem; color: var(--color-secondary); margin: 0; line-height: 1.5;">
					They answer the same 10 questions — then you both get a compatibility score.
				</p>
			</div>

			<!-- Visual: how it works -->
			<div
				style="
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 12px;
					padding: 16px 0;
					opacity: {cardRevealed ? 1 : 0};
					transition: opacity 600ms var(--ease-entrance);
					transition-delay: 300ms;
				"
			>
				<div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
					<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={44} />
					<span style="font-size: 0.625rem; font-weight: 600; color: var(--color-primary);">{data.session.creatorName}</span>
					<span style="font-size: 0.5625rem; font-weight: 600; color: var(--color-score-high);">Done ✓</span>
				</div>

				<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
					<span style="font-size: 0.6875rem; font-weight: 700; color: var(--color-secondary); opacity: 0.5; letter-spacing: -0.01em;">x%</span>
					<span style="font-size: 0.5rem; color: var(--color-secondary); opacity: 0.4;">compatible</span>
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
					<span style="font-size: 0.5625rem; color: var(--color-secondary);">Their turn</span>
				</div>
			</div>

			<!-- Share CTAs -->
			<div
				style="
					width: 100%;
					display: flex;
					flex-direction: column;
					gap: 10px;
					opacity: {cardRevealed ? 1 : 0};
					transition: opacity 600ms var(--ease-entrance);
					transition-delay: 400ms;
				"
			>
				<button
					onclick={shareNative}
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
					"
				>
					Send to a friend
				</button>

				<button
					onclick={copyLink}
					style="
						width: 100%;
						border-radius: 100px;
						background: transparent;
						padding: 14px 24px;
						font-size: 0.9375rem;
						font-weight: 500;
						color: var(--color-secondary);
						border: 1.5px solid var(--color-border);
						cursor: pointer;
					"
				>
					{copied ? 'Copied!' : 'Copy link instead'}
				</button>
			</div>

			<!-- Polling indicator -->
			<div style="display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; color: var(--color-secondary); opacity: 0.6;">
				<span style="display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: var(--color-score-high); animation: pulse 2s ease-in-out infinite;"></span>
				We'll show your result here when they finish
			</div>

			<!-- Phone notification opt-in -->
			{#if !phoneSaved}
				<div
					style="
						width: 100%;
						background: var(--color-surface);
						border-radius: 20px;
						padding: 16px;
						text-align: center;
						border: 1.5px solid var(--color-border);
						opacity: {cardRevealed ? 1 : 0};
						transition: opacity 600ms var(--ease-entrance);
						transition-delay: 600ms;
					"
				>
					<p style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); margin: 0 0 4px;">
						Don't want to wait?
					</p>
					<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 0 0 12px;">
						We'll text you when your result is ready.
					</p>
					<div style="display: flex; gap: 8px;">
						<input
							type="tel"
							bind:value={phone}
							placeholder="Your phone number"
							onkeydown={(e) => e.key === 'Enter' && savePhone()}
							style="
								flex: 1;
								border-radius: 100px;
								border: 1.5px solid var(--color-border);
								padding: 10px 12px;
								font-size: 0.875rem;
								background: var(--color-input-bg);
								color: var(--color-primary);
								outline: none;
								font-family: inherit;
							"
						/>
						<button
							onclick={savePhone}
							disabled={phoneSaving}
							style="
								border-radius: 100px;
								background: var(--color-primary);
								padding: 10px 16px;
								font-size: 0.8125rem;
								font-weight: 700;
								color: white;
								border: none;
								cursor: pointer;
								white-space: nowrap;
								opacity: {phoneSaving ? 0.6 : 1};
							"
						>
							Notify me
						</button>
					</div>
				</div>
			{:else}
				<p style="font-size: 0.75rem; color: var(--color-score-high); animation: fadeIn 300ms ease;">
					We'll text you when your result is ready.
				</p>
			{/if}
		{/if}
	</div>
</main>

<script lang="ts">
	import { browser } from '$app/environment';
	import { isUnlocked, setUnlocked, getMySessionId, getDeviceId, clearSession } from '$lib/device';
	import { getScoreTier, archetypes, type ArchetypeId } from '$lib/questions';
	import { getScoreColor } from '$lib/scoring';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import Avatar from '$lib/components/Avatar.svelte';
	import AvatarPicker from '$lib/components/AvatarPicker.svelte';

	let { data } = $props();

	let unlocked = $state(false);
	let visible = $state(false);
	let shareUrl = $state('');
	let dashInited = false;

	let phone = $state('');
	let phoneSaved = $state(data.session.hasPhone);
	let phoneSaving = $state(false);

	let creatorEmoji = $state(data.session.creatorEmoji);
	let creatorAvatarUrl = $state<string | null>(data.session.creatorAvatarUrl);
	let showPicker = $state(false);

	$effect(() => {
		if (!browser || dashInited) return;
		dashInited = true;

		const currentDeviceId = getDeviceId();
		if (currentDeviceId !== data.session.creatorDeviceId) {
			goto('/', { replaceState: true });
			return;
		}

		unlocked = isUnlocked();
		const mySession = getMySessionId();
		if (mySession) {
			shareUrl = `${window.location.origin}/s/${mySession}`;
		}
		if (!unlocked) checkServerUnlock();
		setTimeout(() => (visible = true), 100);
	});

	async function checkServerUnlock() {
		const deviceId = getDeviceId();
		const { data: device } = await supabase
			.from('devices')
			.select('completed_matches, unlocked_at')
			.eq('id', deviceId)
			.single();
		if (device && (device.unlocked_at || (device.completed_matches ?? 0) >= 2)) {
			setUnlocked();
			unlocked = true;
		}
	}

	async function shareLink() {
		if (!shareUrl) return;
		const text = `Think we're compatible? Find out 👀\n${shareUrl}`;
		if (navigator.share) {
			try { await navigator.share({ text, url: shareUrl }); return; } catch {}
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
			.eq('id', data.session.id);
		phoneSaved = true;
		phoneSaving = false;
	}

	async function handleAvatarChange(newEmoji: string, newAvatarUrl: string | null) {
		creatorEmoji = newEmoji;
		creatorAvatarUrl = newAvatarUrl;
		showPicker = false;

		const update: Record<string, unknown> = {
			creator_emoji: newEmoji,
			creator_avatar_url: newAvatarUrl
		};
		await supabase.from('sessions').update(update).eq('id', data.session.id);
		await supabase
			.from('responses')
			.update({ responder_emoji: newEmoji, avatar_url: newAvatarUrl })
			.eq('session_id', data.session.id)
			.eq('is_creator', true);
	}

	function viewResult(matchId: string, index: number) {
		if (index === 0 || unlocked) {
			goto(`/result/${data.session.id}/${matchId}?reveal=1`);
		} else {
			goto('/gate');
		}
	}

	function logout() {
		clearSession();
		goto('/', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Your matches — Haystack</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main
	class="min-h-dvh min-h-[100vh] bg-cream"
	class:opacity-100={visible}
	class:opacity-0={!visible}
	style="transition: opacity 400ms ease"
>
	<div class="mx-auto max-w-sm px-5 pt-10 pb-12">

		<!-- Profile header -->
		<div style="
			display: flex;
			align-items: center;
			gap: 14px;
			margin-bottom: 28px;
		">
			<div style="position: relative;">
				<Avatar
					emoji={creatorEmoji}
					avatarUrl={creatorAvatarUrl}
					size={52}
					onClick={() => (showPicker = true)}
				/>
				<div style="
					position: absolute;
					bottom: -2px;
					right: -2px;
					width: 20px;
					height: 20px;
					border-radius: 50%;
					background: var(--color-surface);
					border: 1.5px solid var(--color-border);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.5rem;
					pointer-events: none;
				">✏️</div>
			</div>
			<div style="flex: 1; min-width: 0;">
				<h1 style="font-size: 1.25rem; font-weight: 800; margin: 0; letter-spacing: -0.01em;">{data.session.creatorName}</h1>
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 2px 0 0;">
					{data.matches.length} {data.matches.length === 1 ? 'match' : 'matches'}
				</p>
			</div>
			<button
				onclick={logout}
				style="
					background: none;
					border: none;
					padding: 6px 10px;
					font-size: 0.6875rem;
					font-weight: 500;
					color: var(--color-secondary);
					opacity: 0.6;
					cursor: pointer;
					font-family: inherit;
				"
			>Log out</button>
		</div>

		<!-- Match list -->
		{#if data.matches.length === 0}
			<div style="
				text-align: center;
				padding: 48px 20px;
				background: var(--color-surface);
				border-radius: 24px;
				border: 1.5px dashed var(--color-border);
			">
				<p style="font-size: 2.5rem; line-height: 1; margin: 0 0 12px;">👻</p>
				<p style="font-size: 1rem; font-weight: 600; color: var(--color-primary); margin: 0 0 4px;">No matches yet</p>
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 20px;">Invite someone to see how you compare.</p>
				{#if shareUrl}
					<button
						onclick={shareLink}
						style="
							border-radius: 100px;
							background: var(--color-accent);
							padding: 14px 28px;
							font-size: 1rem;
							font-weight: 700;
							color: white;
							border: none;
							cursor: pointer;
						"
					>
						Invite someone
					</button>
				{/if}
			</div>
		{:else}
			<div style="display: flex; flex-direction: column; gap: 12px;">
				{#each data.matches as match, i}
					{@const isLocked = i > 0 && !unlocked}
					{@const arch = archetypes[match.otherArchetype as ArchetypeId]}
					<button
						onclick={() => viewResult(match.id, i)}
						style="
							width: 100%;
							background: var(--color-surface);
							border-radius: 20px;
							border: 1.5px solid {isLocked ? 'rgba(229, 229, 224, 0.5)' : 'var(--color-border)'};
							padding: 16px;
							text-align: left;
							cursor: pointer;
							display: flex;
							align-items: center;
							gap: 14px;
							opacity: {isLocked ? 0.55 : 1};
							transition: opacity 200ms ease;
						"
					>
						<Avatar
						emoji={match.otherEmoji}
						avatarUrl={match.otherAvatarUrl}
						size={48}
						borderColor="var(--color-border)"
					/>
						<div style="flex: 1; min-width: 0;">
							<p style="font-size: 0.9375rem; font-weight: 600; margin: 0; color: var(--color-primary);">{match.otherName}</p>
							{#if isLocked}
								<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 2px 0 0; opacity: 0.6;">Tap to unlock</p>
							{:else if arch}
								<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 2px 0 0;">{arch.name}</p>
							{/if}
						</div>
						{#if isLocked}
							<div style="display: flex; align-items: center; gap: 4px;">
								<span style="font-size: 1.375rem; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--color-secondary); filter: blur(5px); opacity: 0.4;">??%</span>
								<span style="font-size: 0.875rem;">🔒</span>
							</div>
						{:else}
							<span style="
								font-size: 1.5rem;
								font-weight: 800;
								font-variant-numeric: tabular-nums;
								letter-spacing: -0.02em;
								color: {getScoreColor(match.score)};
							">{match.score}%</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Gate reminder -->
		{#if data.matches.length > 1 && !unlocked}
			<div style="
				margin-top: 16px;
				padding: 14px 16px;
				border-radius: 100px;
				background: var(--color-surface);
				border: 1.5px solid var(--color-border);
				text-align: center;
			">
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0;">
					{data.matches.length - 1} locked.
					<a href="/gate" style="font-weight: 600; color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px;">Unlock all</a>
				</p>
			</div>
		{/if}

		<!-- Invite CTA -->
		{#if shareUrl}
			<button
				onclick={shareLink}
				style="
					margin-top: 28px;
					width: 100%;
					background: var(--color-surface);
					border-radius: 24px;
					padding: 24px;
					text-align: center;
					border: 1.5px solid var(--color-border);
					cursor: pointer;
				"
			>
				<div style="
					width: 48px;
					height: 48px;
					border-radius: 50%;
					background: var(--color-cream);
					border: 1.5px dashed var(--color-border);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 1.25rem;
					margin: 0 auto 12px;
				">+</div>
				<p style="font-size: 0.9375rem; font-weight: 700; color: var(--color-primary); margin: 0 0 4px;">Who's next?</p>
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0;">
					Tap to invite someone
				</p>
			</button>
		{/if}

		<!-- Phone notification opt-in -->
		{#if !phoneSaved}
			<div style="
				margin-top: 16px;
				background: var(--color-surface);
				border-radius: 20px;
				padding: 16px;
				text-align: center;
				border: 1.5px solid var(--color-border);
			">
				<p style="font-size: 0.8125rem; font-weight: 600; color: var(--color-primary); margin: 0 0 4px;">
					Get notified when someone finishes
				</p>
				<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 0 0 12px;">
					We'll text you once — then delete your number.
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
			<p style="margin-top: 16px; font-size: 0.75rem; color: var(--color-secondary); text-align: center;">
				We'll text you when someone finishes.
			</p>
		{/if}

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

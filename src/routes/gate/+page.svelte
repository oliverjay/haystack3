<script lang="ts">
	import { browser } from '$app/environment';
	import { getDeviceId, setUnlocked, isUnlocked, getMySessionId } from '$lib/device';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let completedMatches = $state(0);
	let unlocked = $state(false);
	let loading = $state(true);
	let shareUrl = $state('');
	let gateInited = false;

	let phone = $state('');
	let phoneSaved = $state(false);
	let phoneSaving = $state(false);
	let sessionId = $state<string | null>(null);

	const REQUIRED_COMPLETIONS = 2;

	$effect(() => {
		if (!browser || gateInited) return;
		gateInited = true;
		loadGateState();
	});

	async function loadGateState() {
		if (isUnlocked()) {
			unlocked = true;
			loading = false;
			return;
		}

		const deviceId = getDeviceId();
		const mySession = getMySessionId();
		if (mySession) {
			shareUrl = `${window.location.origin}/s/${mySession}`;
			sessionId = mySession;
			const { data: sess } = await supabase
				.from('sessions')
				.select('creator_phone')
				.eq('id', mySession)
				.single();
			if (sess?.creator_phone) phoneSaved = true;
		}

		const { data: device } = await supabase
			.from('devices')
			.select('completed_matches, unlocked_at')
			.eq('id', deviceId)
			.single();

		if (device) {
			completedMatches = device.completed_matches ?? 0;
			if (device.unlocked_at || completedMatches >= REQUIRED_COMPLETIONS) {
				setUnlocked();
				unlocked = true;
			}
		}

		loading = false;
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
		if (!sessionId) return;
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

	function goBack() {
		history.back();
	}
</script>

<main class="flex min-h-dvh min-h-[100vh] flex-col items-center justify-center px-5">
	{#if loading}
		<p style="font-size: 0.875rem; color: var(--color-secondary); opacity: 0.5;">Loading...</p>
	{:else if unlocked}
		<div style="
			text-align: center;
			max-width: 320px;
		">
			<div style="
				width: 72px;
				height: 72px;
				border-radius: 50%;
				background: var(--color-surface);
				border: 2px solid var(--color-score-high);
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 2rem;
				margin: 0 auto 16px;
			">🎉</div>
			<h1 style="font-size: 1.5rem; font-weight: 800; margin: 0 0 6px;">You're unlocked!</h1>
			<p style="font-size: 0.875rem; color: var(--color-secondary); margin: 0 0 24px;">All your matches are now visible.</p>
			<button
				onclick={goBack}
				style="
					border-radius: 100px;
					background: var(--color-accent);
					padding: 14px 32px;
					font-size: 1rem;
					font-weight: 700;
					color: white;
					border: none;
					cursor: pointer;
				"
			>
				Go back
			</button>
		</div>
	{:else}
		<div style="width: 100%; max-width: 380px;">
			<!-- Header -->
			<div style="text-align: center; margin-bottom: 28px;">
				<div style="
					width: 56px;
					height: 56px;
					border-radius: 50%;
					background: var(--color-surface);
					border: 1.5px solid var(--color-border);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 1.5rem;
					margin: 0 auto 14px;
				">🔒</div>
				<h1 style="font-size: 1.375rem; font-weight: 800; margin: 0 0 6px;">Unlock all matches</h1>
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0;">First result is free. Unlock the rest below.</p>
			</div>

			<!-- Option A: Completions -->
			<div style="
				background: var(--color-surface);
				border-radius: 24px;
				padding: 24px;
				border: 1.5px solid var(--color-border);
				text-align: center;
				margin-bottom: 20px;
			">
				<p style="font-size: 1rem; font-weight: 600; margin: 0 0 16px; color: var(--color-primary);">Get 2 people to complete your test</p>

				<!-- Progress dots -->
				<div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 16px;">
					{#each Array(REQUIRED_COMPLETIONS) as _, i}
						<div style="
							width: 44px;
							height: 44px;
							border-radius: 50%;
							display: flex;
							align-items: center;
							justify-content: center;
							font-size: 1rem;
							font-weight: 700;
							background: {i < completedMatches ? 'var(--color-score-high)' : 'var(--color-cream)'};
							color: {i < completedMatches ? 'white' : 'var(--color-secondary)'};
							border: 1.5px solid {i < completedMatches ? 'var(--color-score-high)' : 'var(--color-border)'};
							transition: all 300ms ease;
						">
							{i < completedMatches ? '✓' : i + 1}
						</div>
					{/each}
				</div>

				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 16px;">
					{completedMatches} of {REQUIRED_COMPLETIONS} completed
				</p>

				{#if shareUrl}
					<button
						onclick={shareLink}
						style="
							width: 100%;
							border-radius: 100px;
							background: var(--color-accent);
							padding: 14px 24px;
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

				<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 12px 0 0;">
					Unlocks after 2 people finish.
				</p>

				{#if !phoneSaved}
					<div style="
						margin-top: 16px;
						padding-top: 16px;
						border-top: 1px solid var(--color-border);
					">
						<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 0 0 8px;">
							Get a text when someone finishes
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
									padding: 8px 12px;
									font-size: 0.8125rem;
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
									padding: 8px 14px;
									font-size: 0.75rem;
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
					<p style="margin-top: 12px; font-size: 0.75rem; color: var(--color-score-high);">
						We'll text you when someone finishes.
					</p>
				{/if}
			</div>

			<!-- Divider -->
			<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
				<div style="flex: 1; height: 1px; background: var(--color-border);"></div>
				<span style="font-size: 0.8125rem; color: var(--color-secondary); font-weight: 500;">or</span>
				<div style="flex: 1; height: 1px; background: var(--color-border);"></div>
			</div>

			<!-- Option B: Pay -->
			<div style="
				background: var(--color-surface);
				border-radius: 24px;
				padding: 24px;
				border: 1.5px solid var(--color-border);
				text-align: center;
			">
				<div style="margin-bottom: 12px;">
					<span style="font-size: 0.875rem; color: var(--color-secondary); text-decoration: line-through;">$4.99</span>
					<span style="font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-left: 8px;">$1</span>
				</div>
				<p style="font-size: 0.8125rem; color: var(--color-secondary); margin: 0 0 16px;">Unlock everything instantly</p>
				<button
					style="
						width: 100%;
						border-radius: 100px;
						background: transparent;
						padding: 14px 24px;
						font-size: 1rem;
						font-weight: 700;
						color: var(--color-primary);
						border: 2px solid var(--color-primary);
						cursor: pointer;
					"
				>
					Pay $1
				</button>
				<p style="font-size: 0.6875rem; color: var(--color-secondary); margin: 10px 0 0;">One-time. All current + future results.</p>
			</div>
		</div>
	{/if}
</main>

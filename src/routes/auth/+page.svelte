<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { getSupabase } from '$lib/supabase';
	import Logo from '$lib/components/Logo.svelte';

	let email = $state('');
	let sending = $state(false);
	let sent = $state(false);
	let errorMsg = $state('');

	const redirectTo = $derived($page.url.searchParams.get('redirect') ?? '/');

	async function sendMagicLink() {
		const trimmed = email.trim().toLowerCase();
		if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
			errorMsg = 'Please enter a valid email.';
			return;
		}
		errorMsg = '';
		sending = true;

		const callbackUrl = browser
			? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
			: '/auth/callback';

		const { error } = await getSupabase().auth.signInWithOtp({
			email: trimmed,
			options: {
				emailRedirectTo: callbackUrl
			}
		});

		sending = false;
		if (error) {
			console.error('[auth] Magic link error:', error);
			errorMsg = 'Something went wrong. Please try again.';
		} else {
			sent = true;
		}
	}
</script>

<svelte:head>
	<title>Sign in — Haystack</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main style="
	display: flex;
	min-height: 100dvh;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 24px 20px;
	background: var(--color-cream);
	position: relative;
	overflow: hidden;
">
	<div class="deco-blob" style="width: 260px; height: 260px; background: var(--color-accent); top: -80px; right: -80px;"></div>

	<div style="display: flex; flex-direction: column; align-items: center; gap: 24px; max-width: 320px; width: 100%; text-align: center; position: relative; z-index: 1;">
		<Logo size="md" />

		{#if sent}
			<div style="animation: fadeIn 400ms ease;">
				<div style="font-size: 2.5rem; margin-bottom: 12px;">📬</div>
				<h2 style="font-family: var(--font-display); font-size: 1.375rem; color: var(--color-primary); margin: 0 0 8px;">Check your email</h2>
				<p style="font-size: 0.875rem; color: var(--color-secondary); line-height: 1.5; margin: 0;">
					We sent a login link to <strong style="color: var(--color-primary);">{email}</strong>. Click it to sign in and access your results.
				</p>
				<button
					onclick={() => { sent = false; email = ''; }}
					style="
						margin-top: 20px;
						background: none;
						border: none;
						color: var(--color-secondary);
						font-size: 0.8125rem;
						cursor: pointer;
						text-decoration: underline;
						text-underline-offset: 2px;
					"
				>Use a different email</button>
			</div>
		{:else}
			<div style="animation: fadeIn 400ms ease; width: 100%;">
				<h2 style="font-family: var(--font-display); font-size: 1.375rem; color: var(--color-primary); margin: 0 0 6px;">Welcome back</h2>
				<p style="font-size: 0.875rem; color: var(--color-secondary); line-height: 1.5; margin: 0 0 24px;">
					Enter the email you used when you took the quiz. We'll send you a link to sign in.
				</p>

				<form
					onsubmit={(e) => { e.preventDefault(); sendMagicLink(); }}
					style="display: flex; flex-direction: column; gap: 12px;"
				>
					<input
						type="email"
						placeholder="your@email.com"
						bind:value={email}
						disabled={sending}
						autofocus
						style="
							width: 100%;
							padding: 14px 18px;
							border-radius: 100px;
							border: 1.5px solid var(--color-border);
							background: var(--color-surface);
							font-size: 0.9375rem;
							color: var(--color-primary);
							outline: none;
							font-family: inherit;
							text-align: center;
							box-sizing: border-box;
							transition: border-color 200ms;
						"
					/>
					{#if errorMsg}
						<p style="font-size: 0.8125rem; color: var(--color-score-low); margin: -4px 0 0;">{errorMsg}</p>
					{/if}
					<button
						type="submit"
						disabled={sending}
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
							opacity: {sending ? 0.6 : 1};
							box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
						"
					>{sending ? 'Sending...' : 'Send login link'}</button>
				</form>

				<a href="/" style="font-size: 0.8125rem; color: var(--color-secondary); margin-top: 8px;">
					or start a new quiz
				</a>
			</div>
		{/if}
	</div>
</main>

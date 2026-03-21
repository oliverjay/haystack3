<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Avatar from '$lib/components/Avatar.svelte';

	let { data } = $props();
	let visible = $state(false);

	$effect(() => {
		if (browser) setTimeout(() => (visible = true), 100);
	});

	function start() {
		goto(`/q?s=${data.session.id}`);
	}
</script>

<svelte:head>
	<title>{data.session.creatorName} invited you — Haystack</title>
	<meta name="description" content="{data.session.creatorName} took 10 questions. Now it's your turn — see your % compatibility in 60 seconds." />
	<meta name="robots" content="noindex" />
	<meta property="og:title" content="{data.session.creatorName} invited you to Haystack" />
	<meta property="og:description" content="10 quick questions. See your % compatibility in 60 seconds." />
	<meta property="og:image" content="/og/{data.session.id}" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{data.session.creatorName} invited you to Haystack" />
	<meta name="twitter:description" content="10 quick questions. See your % compatibility in 60 seconds." />
	<meta name="twitter:image" content="/og/{data.session.id}" />
</svelte:head>

<main
	class="flex min-h-dvh min-h-[100vh] flex-col items-center justify-center px-5"
	class:opacity-100={visible}
	class:opacity-0={!visible}
	style="transition: opacity 400ms var(--ease-entrance)"
>
	<div class="flex w-full max-w-sm flex-col items-center gap-6 text-center">

		<!-- Avatar in circle -->
		<div style="animation: bounceIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1);">
			<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={88} />
		</div>

		<div>
			<p style="font-size: 1.125rem; line-height: 1.4; margin: 0;">
				<span style="font-weight: 700;">{data.session.creatorName}</span> took 10 questions.
			</p>
			<p style="font-size: 0.9375rem; color: var(--color-secondary); margin: 6px 0 0;">
				Now it's your turn — see how you compare.
			</p>
		</div>

		<!-- Visual hint -->
		<div style="
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 14px 20px;
			background: var(--color-surface);
			border-radius: 100px;
			border: 1.5px solid var(--color-border);
		">
			<Avatar emoji={data.session.creatorEmoji} avatarUrl={data.session.creatorAvatarUrl} size={32} />
			<span style="font-size: 1rem; font-weight: 800; color: var(--color-secondary); opacity: 0.5;">?%</span>
			<Avatar emoji="You" size={32} borderColor="var(--color-border)" borderStyle="dashed" />
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
			"
		>
			Let's find out
		</button>

		<p style="font-size: 0.75rem; color: var(--color-secondary); margin: 0;">No sign up. Takes 60 seconds.</p>
	</div>
</main>

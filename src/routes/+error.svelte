<script>
	import { page } from '$app/stores';
	import Logo from '$lib/components/Logo.svelte';
</script>

<main style="
	display: flex;
	min-height: 100dvh;
	min-height: 100vh;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 20px;
	position: relative;
	overflow: hidden;
">
	<!-- Decorative -->
	<div class="deco-blob" style="width: 200px; height: 200px; background: var(--color-accent); bottom: -40px; right: -60px; opacity: 0.06;"></div>

	<div style="text-align: center; max-width: 300px; position: relative; z-index: 1;">
		<div style="margin-bottom: 24px;">
			<Logo size="sm" />
		</div>
		<div style="
			width: 72px;
			height: 72px;
			border-radius: 50%;
			background: var(--color-surface);
			border: 1.5px solid var(--color-border);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 2rem;
			margin: 0 auto 20px;
		">🌾</div>
		<h1 style="font-family: var(--font-display); font-size: 1.5rem; margin: 0 0 6px;">
			{$page.status === 404 ? "Lost in the haystack" : 'Something went wrong'}
		</h1>
		<p style="font-size: 0.875rem; color: var(--color-secondary); margin: 0 0 28px; line-height: 1.5;">
			{$page.error?.message ?? 'An unexpected error occurred.'}
		</p>
		<a
			href="/"
			style="
				display: inline-block;
				border-radius: 100px;
				background: var(--color-accent);
				padding: 14px 32px;
				font-size: 1rem;
				font-weight: 700;
				color: white;
				text-decoration: none;
				box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
			"
		>
			Start your own
		</a>
	</div>
</main>

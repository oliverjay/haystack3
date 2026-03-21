<script>
	import { page } from '$app/stores';
</script>

<main style="
	display: flex;
	min-height: 100dvh;
	min-height: 100vh;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0 20px;
">
	<div style="text-align: center; max-width: 300px;">
		<div style="
			width: 64px;
			height: 64px;
			border-radius: 50%;
			background: var(--color-surface);
			border: 1.5px solid var(--color-border);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1.75rem;
			margin: 0 auto 16px;
		">🌾</div>
		<h1 style="font-size: 1.375rem; font-weight: 800; margin: 0 0 6px;">
			{$page.status === 404 ? "This page doesn't exist" : 'Something went wrong'}
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
			"
		>
			Start your own
		</a>
	</div>
</main>

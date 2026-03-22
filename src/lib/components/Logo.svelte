<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
		variant?: 'full' | 'mark' | 'wordmark';
	}

	let { size = 'md', variant = 'full' }: Props = $props();

	const sizes = {
		sm: { icon: 20, text: '0.75rem', gap: 6 },
		md: { icon: 26, text: '1rem', gap: 8 },
		lg: { icon: 34, text: '1.375rem', gap: 10 }
	};

	let s = $derived(sizes[size]);
</script>

<div style="
	display: inline-flex;
	align-items: center;
	gap: {s.gap}px;
">
	{#if variant !== 'wordmark'}
		<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
			width={s.icon} height={s.icon}
		>
			<rect width="32" height="32" rx="8" fill="var(--color-accent)"/>
			<path d="M10 22L16 8L22 22" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
			<circle cx="16" cy="15" r="2" fill="white"/>
		</svg>
	{/if}
	{#if variant !== 'mark'}
		<span style="
			font-family: var(--font-display);
			font-size: {s.text};
			font-weight: 400;
			color: var(--color-primary);
			letter-spacing: -0.02em;
			line-height: 1;
		">Haystack</span>
	{/if}
</div>

<script lang="ts">
	import { browser } from '$app/environment';
	import type { LoveLanguageOption } from '$lib/questions';

	interface Props {
		options: LoveLanguageOption[];
		value: number | null;
		onSelect: (value: number) => void;
	}

	let { options, value, onSelect }: Props = $props();

	function select(index: number) {
		if (browser) navigator.vibrate?.(10);
		onSelect(index);
	}
</script>

<div class="five-choice-grid">
	{#each options as opt, i}
		{@const selected = value === i}
		<button
			type="button"
			onclick={() => select(i)}
			class="five-choice-btn"
			class:selected
		>
			<span class="five-choice-emoji">{opt.emoji}</span>
			<span class="five-choice-label">{opt.label}</span>
		</button>
	{/each}
</div>

<style>
	.five-choice-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 8px;
	}

	.five-choice-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 14px 4px;
		border-radius: 16px;
		border: 1.5px solid var(--color-border);
		background: var(--color-surface);
		cursor: pointer;
		transition: border-color 200ms ease, transform 150ms var(--ease-spring), background 200ms ease;
	}

	.five-choice-btn:active {
		transform: scale(0.95);
	}

	.five-choice-btn.selected {
		border-color: var(--color-accent);
		background: var(--color-accent-light);
	}

	.five-choice-emoji {
		font-size: 1.375rem;
		line-height: 1;
	}

	.five-choice-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: var(--color-secondary);
		text-align: center;
		line-height: 1.2;
	}

	.five-choice-btn.selected .five-choice-label {
		color: var(--color-accent);
	}

	@media (min-height: 700px) {
		.five-choice-btn {
			padding: 16px 6px;
			gap: 8px;
		}
		.five-choice-emoji {
			font-size: 1.5rem;
		}
		.five-choice-label {
			font-size: 0.6875rem;
		}
	}
</style>

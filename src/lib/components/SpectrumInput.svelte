<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		labelLeft: string;
		labelRight: string;
		value: number | null;
		onSelect: (value: number) => void;
	}

	let { labelLeft, labelRight, value, onSelect }: Props = $props();

	let barEl: HTMLButtonElement | undefined = $state();
	let selectedPos = $derived(value);

	function handleClick(e: MouseEvent) {
		if (!barEl) return;
		const rect = barEl.getBoundingClientRect();
		const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
		const rounded = Math.round(pct);
		if (browser) navigator.vibrate?.(10);
		onSelect(rounded);
	}
</script>

<div class="spectrum-wrap">
	<div class="spectrum-labels">
		<span style="
			color: {selectedPos !== null && selectedPos <= 35 ? 'var(--color-accent)' : 'var(--color-secondary)'};
			font-weight: {selectedPos !== null && selectedPos <= 35 ? '700' : '500'};
			transition: color 200ms ease, font-weight 200ms ease;
		">
			{labelLeft}
		</span>
		<span style="
			color: {selectedPos !== null && selectedPos >= 65 ? 'var(--color-accent)' : 'var(--color-secondary)'};
			font-weight: {selectedPos !== null && selectedPos >= 65 ? '700' : '500'};
			transition: color 200ms ease, font-weight 200ms ease;
		">
			{labelRight}
		</span>
	</div>

	<button
		bind:this={barEl}
		type="button"
		role="slider"
		aria-valuenow={selectedPos ?? 50}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label="Select a position between {labelLeft} and {labelRight}"
		onclick={handleClick}
		class="spectrum-bar"
	>
		<div style="position: absolute; left: 50%; top: 50%; width: 1px; height: 18px; transform: translate(-50%, -50%); background: var(--color-border);"></div>

		{#if selectedPos === null}
			<div class="spectrum-hint">
				Tap where you land
			</div>
		{/if}

		{#if selectedPos !== null}
			<div class="spectrum-thumb" style="left: {selectedPos}%;"></div>
		{/if}
	</button>
</div>

<style>
	.spectrum-wrap {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.spectrum-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		font-weight: 500;
	}
	.spectrum-bar {
		position: relative;
		height: 56px;
		cursor: pointer;
		border-radius: 100px;
		background: var(--color-surface);
		border: 1.5px solid var(--color-border);
		width: 100%;
		padding: 0;
		overflow: hidden;
		transition: border-color 200ms ease;
	}
	.spectrum-hint {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		color: var(--color-secondary);
		pointer-events: none;
	}
	.spectrum-thumb {
		position: absolute;
		top: 50%;
		width: 32px;
		height: 32px;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: var(--color-accent);
		box-shadow: 0 2px 12px rgba(232, 86, 63, 0.3);
		transition: left 200ms var(--ease-spring);
	}
	@media (min-height: 700px) {
		.spectrum-labels {
			font-size: 0.9375rem;
		}
		.spectrum-bar {
			height: 64px;
		}
		.spectrum-thumb {
			width: 36px;
			height: 36px;
		}
	}
</style>

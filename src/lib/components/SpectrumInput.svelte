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

<div style="display: flex; flex-direction: column; gap: 10px;">
	<div style="display: flex; justify-content: space-between; font-size: 0.875rem; font-weight: 500;">
		<span style="color: {selectedPos !== null && selectedPos <= 35 ? 'var(--color-primary)' : 'var(--color-secondary)'}; transition: color 200ms ease;">
			{labelLeft}
		</span>
		<span style="color: {selectedPos !== null && selectedPos >= 65 ? 'var(--color-primary)' : 'var(--color-secondary)'}; transition: color 200ms ease;">
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
		style="
			position: relative;
			height: 56px;
			cursor: pointer;
			border-radius: 100px;
			background: var(--color-surface);
			border: 1.5px solid var(--color-border);
			width: 100%;
			padding: 0;
			overflow: hidden;
		"
	>
		<!-- Center tick -->
		<div style="position: absolute; left: 50%; top: 50%; width: 1px; height: 18px; transform: translate(-50%, -50%); background: var(--color-border);"></div>

		{#if selectedPos === null}
			<div style="
				position: absolute;
				inset: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 0.8125rem;
				color: var(--color-secondary);
				pointer-events: none;
			">
				Tap where you land
			</div>
		{/if}

		{#if selectedPos !== null}
			<div style="
				position: absolute;
				top: 50%;
				left: {selectedPos}%;
				width: 30px;
				height: 30px;
				transform: translate(-50%, -50%);
				border-radius: 50%;
				background: var(--color-primary);
				box-shadow: 0 2px 10px rgba(26,26,26,0.18);
				transition: left 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
			"></div>
		{/if}
	</button>
</div>

<script lang="ts">
	interface Props {
		labelLeft: string;
		labelRight: string;
		value: number | null;
		onSelect: (value: number) => void;
	}

	let { labelLeft, labelRight, value, onSelect }: Props = $props();

	let selected = $derived<'left' | 'right' | null>(
		value === 0 ? 'left' : value === 100 ? 'right' : null
	);

	function pick(side: 'left' | 'right') {
		onSelect(side === 'left' ? 0 : 100);
	}
</script>

<div class="binary-row">
	<button
		onclick={() => pick('left')}
		class="binary-btn"
		style="
			border-color: {selected === 'left' ? 'var(--color-accent)' : 'var(--color-border)'};
			background: {selected === 'left' ? 'var(--color-accent)' : 'var(--color-surface)'};
			color: {selected === 'left' ? 'white' : 'var(--color-primary)'};
			opacity: {selected === 'right' ? 0.25 : 1};
			transform: scale({selected === 'left' ? 1.03 : selected === 'right' ? 0.95 : 1});
			box-shadow: {selected === 'left' ? '0 4px 16px rgba(232, 86, 63, 0.25)' : 'none'};
		"
	>
		{labelLeft}
	</button>
	<button
		onclick={() => pick('right')}
		class="binary-btn"
		style="
			border-color: {selected === 'right' ? 'var(--color-accent)' : 'var(--color-border)'};
			background: {selected === 'right' ? 'var(--color-accent)' : 'var(--color-surface)'};
			color: {selected === 'right' ? 'white' : 'var(--color-primary)'};
			opacity: {selected === 'left' ? 0.25 : 1};
			transform: scale({selected === 'right' ? 1.03 : selected === 'left' ? 0.95 : 1});
			box-shadow: {selected === 'right' ? '0 4px 16px rgba(232, 86, 63, 0.25)' : 'none'};
		"
	>
		{labelRight}
	</button>
</div>

<style>
	.binary-row {
		display: flex;
		gap: 10px;
	}
	.binary-btn {
		flex: 1;
		border-radius: 100px;
		padding: 18px 14px;
		text-align: center;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 250ms var(--ease-spring);
		border: 1.5px solid;
		font-family: inherit;
	}
	@media (min-height: 700px) {
		.binary-btn {
			padding: 22px 16px;
			font-size: 1.0625rem;
		}
	}
</style>

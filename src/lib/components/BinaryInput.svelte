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

<div style="display: flex; gap: 10px;">
	<button
		onclick={() => pick('left')}
		style="
			flex: 1;
			border-radius: 100px;
			padding: 18px 14px;
			text-align: center;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 200ms ease;
			border: 1.5px solid {selected === 'left' ? 'var(--color-primary)' : 'var(--color-border)'};
			background: {selected === 'left' ? 'var(--color-primary)' : 'var(--color-surface)'};
			color: {selected === 'left' ? 'white' : 'var(--color-primary)'};
			opacity: {selected === 'right' ? 0.3 : 1};
			box-shadow: {selected === 'left' ? '0 2px 12px rgba(26,26,26,0.12)' : 'none'};
		"
	>
		{labelLeft}
	</button>
	<button
		onclick={() => pick('right')}
		style="
			flex: 1;
			border-radius: 100px;
			padding: 18px 14px;
			text-align: center;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 200ms ease;
			border: 1.5px solid {selected === 'right' ? 'var(--color-primary)' : 'var(--color-border)'};
			background: {selected === 'right' ? 'var(--color-primary)' : 'var(--color-surface)'};
			color: {selected === 'right' ? 'white' : 'var(--color-primary)'};
			opacity: {selected === 'left' ? 0.3 : 1};
			box-shadow: {selected === 'right' ? '0 2px 12px rgba(26,26,26,0.12)' : 'none'};
		"
	>
		{labelRight}
	</button>
</div>

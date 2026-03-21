<script lang="ts">
	interface Props {
		labelLeft: string;
		labelRight: string;
		value: number | null;
		onChange: (value: number) => void;
		onConfirm: () => void;
	}

	let { labelLeft, labelRight, value, onChange, onConfirm }: Props = $props();
	let sliderValue = $state(50);
	let touched = $state(false);

	$effect(() => {
		if (value !== null) {
			sliderValue = value;
			touched = true;
		}
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		sliderValue = Number(target.value);
		touched = true;
		onChange(sliderValue);
	}

	function confirm() {
		if (!touched) {
			onChange(sliderValue);
		}
		onConfirm();
	}
</script>

<div style="display: flex; flex-direction: column; gap: 24px;">
	<div style="position: relative; padding: 0 4px;">
		<input
			type="range"
			min="0"
			max="100"
			bind:value={sliderValue}
			oninput={handleInput}
			class="haystack-slider"
			style="width: 100%;"
		/>
		<div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.8125rem; color: var(--color-secondary);">
			<span>{labelLeft}</span>
			<span>{labelRight}</span>
		</div>
	</div>

	<button
		onclick={confirm}
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
		"
	>
		Next
	</button>
</div>

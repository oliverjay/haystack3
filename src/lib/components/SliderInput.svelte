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

<div class="slider-wrap">
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
		<div class="slider-labels">
			<span style="
				color: {sliderValue <= 35 ? 'var(--color-accent)' : 'var(--color-secondary)'};
				font-weight: {sliderValue <= 35 ? '700' : '500'};
				transition: color 200ms ease;
			">{labelLeft}</span>
			<span style="
				color: {sliderValue >= 65 ? 'var(--color-accent)' : 'var(--color-secondary)'};
				font-weight: {sliderValue >= 65 ? '700' : '500'};
				transition: color 200ms ease;
			">{labelRight}</span>
		</div>
	</div>

	<button
		onclick={confirm}
		class="slider-confirm"
	>
		Next
	</button>
</div>

<style>
	.slider-wrap {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.slider-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 10px;
		font-size: 0.8125rem;
		color: var(--color-secondary);
	}
	.slider-confirm {
		width: 100%;
		border-radius: 100px;
		background: var(--color-accent);
		padding: 16px 24px;
		font-size: 1.0625rem;
		font-weight: 700;
		color: white;
		border: none;
		cursor: pointer;
		font-family: inherit;
		box-shadow: 0 4px 16px rgba(232, 86, 63, 0.25);
		transition: transform 150ms var(--ease-spring);
	}
	@media (min-height: 700px) {
		.slider-labels {
			font-size: 0.9375rem;
			margin-top: 14px;
		}
		.slider-confirm {
			padding: 18px 24px;
		}
	}
</style>

<script lang="ts">
	interface Props {
		emoji: string;
		avatarUrl?: string | null;
		size?: number;
		borderColor?: string;
		borderStyle?: string;
		onClick?: (() => void) | null;
	}

	let {
		emoji,
		avatarUrl = null,
		size = 52,
		borderColor = 'var(--color-highlight)',
		borderStyle = 'solid',
		onClick = null
	}: Props = $props();

	let fontSize = $derived(size * 0.55);
</script>

{#if onClick}
	<button
		type="button"
		onclick={onClick}
		style="
			width: {size}px;
			height: {size}px;
			border-radius: 50%;
			background: {avatarUrl ? 'none' : 'var(--color-surface)'};
			border: 2px {borderStyle} {borderColor};
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: {fontSize}px;
			flex-shrink: 0;
			cursor: pointer;
			padding: 0;
			overflow: hidden;
			position: relative;
		"
	>
		{#if avatarUrl}
			<img
				src={avatarUrl}
				alt="Avatar"
				style="
					width: 100%;
					height: 100%;
					object-fit: cover;
					border-radius: 50%;
				"
			/>
		{:else}
			{emoji}
		{/if}
	</button>
{:else}
	<div
		style="
			width: {size}px;
			height: {size}px;
			border-radius: 50%;
			background: {avatarUrl ? 'none' : 'var(--color-surface)'};
			border: 2px {borderStyle} {borderColor};
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: {fontSize}px;
			flex-shrink: 0;
			overflow: hidden;
			position: relative;
		"
	>
		{#if avatarUrl}
			<img
				src={avatarUrl}
				alt="Avatar"
				style="
					width: 100%;
					height: 100%;
					object-fit: cover;
					border-radius: 50%;
				"
			/>
		{:else}
			{emoji}
		{/if}
	</div>
{/if}

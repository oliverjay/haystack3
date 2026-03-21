<script lang="ts">
	import { EMOJI_OPTIONS } from '$lib/questions';
	import { resizeImageToDataUrl } from '$lib/avatar';
	import { browser } from '$app/environment';

	interface Props {
		currentEmoji: string;
		currentAvatarUrl?: string | null;
		onSelect: (emoji: string, avatarUrl: string | null) => void;
		onClose: () => void;
	}

	let { currentEmoji, currentAvatarUrl = null, onSelect, onClose }: Props = $props();

	let fileInput: HTMLInputElement | undefined = $state();
	let uploading = $state(false);

	function pickEmoji(e: string) {
		if (browser) navigator.vibrate?.(10);
		onSelect(e, null);
	}

	function triggerUpload() {
		fileInput?.click();
	}

	async function handleFile(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;
		uploading = true;
		try {
			const dataUrl = await resizeImageToDataUrl(file);
			onSelect(currentEmoji, dataUrl);
		} catch (err) {
			console.error('[AvatarPicker] resize error:', err);
		} finally {
			uploading = false;
		}
	}
</script>

<!-- Backdrop -->
<div
	style="
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(0,0,0,0.4);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fadeIn 200ms ease;
	"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="button"
	tabindex="-1"
>
	<!-- Sheet -->
	<div
		style="
			width: 100%;
			max-width: 400px;
			background: var(--color-cream);
			border-radius: 24px 24px 0 0;
			padding: 20px 20px 32px;
			animation: slideUp 300ms var(--ease-entrance);
		"
		onclick={(e) => e.stopPropagation()}
		onkeydown={() => {}}
		role="dialog"
		aria-label="Choose avatar"
	>
		<!-- Handle -->
		<div style="width: 36px; height: 4px; border-radius: 2px; background: var(--color-border); margin: 0 auto 16px;"></div>

		<p style="font-size: 0.9375rem; font-weight: 700; text-align: center; margin: 0 0 16px;">Choose your avatar</p>

		<!-- Upload photo button -->
		<button
			onclick={triggerUpload}
			disabled={uploading}
			style="
				width: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				padding: 14px;
				border-radius: 100px;
				background: var(--color-surface);
				border: 1.5px solid var(--color-border);
				cursor: pointer;
				font-size: 0.875rem;
				font-weight: 600;
				color: var(--color-primary);
				margin-bottom: 16px;
				opacity: {uploading ? 0.5 : 1};
			"
		>
			<span style="font-size: 1.125rem;">📷</span>
			{uploading ? 'Processing...' : 'Upload a photo'}
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			onchange={handleFile}
			style="display: none;"
		/>

		<!-- Divider -->
		<div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
			<div style="flex: 1; height: 1px; background: var(--color-border);"></div>
			<span style="font-size: 0.75rem; color: var(--color-secondary);">or pick an emoji</span>
			<div style="flex: 1; height: 1px; background: var(--color-border);"></div>
		</div>

		<!-- Emoji grid -->
		<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; justify-items: center;">
			{#each EMOJI_OPTIONS as e}
				<button
					onclick={() => pickEmoji(e)}
					style="
						width: 44px;
						height: 44px;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 1.375rem;
						border: 2px solid {!currentAvatarUrl && currentEmoji === e ? 'var(--color-highlight)' : 'transparent'};
						background: {!currentAvatarUrl && currentEmoji === e ? 'rgba(125, 211, 192, 0.12)' : 'transparent'};
						cursor: pointer;
						transition: all 150ms ease;
					"
				>
					{e}
				</button>
			{/each}
		</div>
	</div>
</div>

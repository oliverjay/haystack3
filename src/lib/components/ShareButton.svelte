<script lang="ts">
	import { browser } from '$app/environment';

	let { url, text = '' }: { url: string; text?: string } = $props();

	let copied = $state(false);
	let hasNativeShare = $state(false);

	const defaultText = 'Do we actually get each other? Take this and find out 👀';
	const baseText = $derived(text || defaultText);

	$effect(() => {
		if (browser) {
			hasNativeShare = typeof navigator.share === 'function';
		}
	});

	function whatsAppText() {
		return `${baseText}\n${url}`;
	}

	function smsText() {
		return `${baseText} ${url}`;
	}

	function emailSubject() {
		if (baseText.includes('beat')) return 'Think you can beat our score?';
		return 'Do we actually match?';
	}

	function emailBody() {
		return `${baseText}\n\nTake it here: ${url}`;
	}

	function twitterText() {
		return `${baseText}`;
	}

	async function primaryAction() {
		if (hasNativeShare) {
			try {
				await navigator.share({ text: baseText, url });
				return;
			} catch { /* user cancelled or not supported — fall through to copy */ }
		}
		await copyLink();
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			const input = document.createElement('input');
			input.value = url;
			document.body.appendChild(input);
			input.select();
			document.execCommand('copy');
			document.body.removeChild(input);
		}
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function openWhatsApp() {
		window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppText())}`, '_blank');
	}

	function openSMS() {
		window.open(`sms:?&body=${encodeURIComponent(smsText())}`, '_blank');
	}

	function openEmail() {
		window.open(`mailto:?subject=${encodeURIComponent(emailSubject())}&body=${encodeURIComponent(emailBody())}`, '_blank');
	}

	function openTelegram() {
		window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(baseText)}`, '_blank');
	}

	function openX() {
		window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(twitterText())}&url=${encodeURIComponent(url)}`, '_blank');
	}

	const channels: { label: string; icon: string; action: () => void }[] = [
		{ label: 'WhatsApp', icon: '💬', action: openWhatsApp },
		{ label: 'iMessage', icon: '💭', action: openSMS },
		{ label: 'Email', icon: '✉️', action: openEmail },
		{ label: 'Telegram', icon: '📨', action: openTelegram },
		{ label: 'X', icon: '𝕏', action: openX },
	];
</script>

<div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
	<button
		onclick={primaryAction}
		style="
			width: 100%;
			border-radius: 100px;
			background: {copied ? 'var(--color-score-high)' : 'var(--color-accent)'};
			padding: 16px 24px;
			font-size: 1.0625rem;
			font-weight: 700;
			color: white;
			border: none;
			cursor: pointer;
			box-shadow: 0 4px 16px {copied ? 'rgba(45, 184, 122, 0.3)' : 'rgba(232, 86, 63, 0.25)'};
			transition: background 200ms ease, box-shadow 200ms ease, transform 150ms var(--ease-spring);
		"
	>
		{copied ? '✓ Copied!' : hasNativeShare ? 'Send your link' : 'Copy your link'}
	</button>

	<!-- Channel buttons always visible -->
	<div
		style="
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 6px;
		"
	>
		{#each channels as ch}
			<button
				onclick={ch.action}
				style="
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 3px;
					padding: 8px 4px;
					background: var(--color-surface);
					border: 1.5px solid var(--color-border);
					border-radius: 14px;
					cursor: pointer;
					font-family: inherit;
					transition: transform 150ms var(--ease-spring), border-color 150ms ease;
				"
			>
				<span style="font-size: 1.125rem; line-height: 1;">{ch.icon}</span>
				<span style="font-size: 0.5625rem; font-weight: 500; color: var(--color-secondary);">{ch.label}</span>
			</button>
		{/each}
	</div>
</div>

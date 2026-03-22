<script lang="ts">
	import type { ArchetypeId } from '$lib/questions';

	interface Props {
		archetype: ArchetypeId;
		size?: number;
	}

	let { archetype, size = 48 }: Props = $props();

	const colors: Record<ArchetypeId, { bg: string; fg: string }> = {
		guardian:    { bg: '#E0F2F1', fg: '#2DB87A' },
		maker:      { bg: '#FFF3E0', fg: '#E8863F' },
		visionary:  { bg: '#E3F2FD', fg: '#2979FF' },
		champion:   { bg: '#FFEBEE', fg: '#E8563F' },
		connector:  { bg: '#F3E5F5', fg: '#AB47BC' },
		catalyst:   { bg: '#FFF8E1', fg: '#F9A825' },
		dreamer:    { bg: '#EDE7F6', fg: '#7C4DFF' },
		maverick:   { bg: '#ECEFF1', fg: '#546E7A' },
		advocate:   { bg: '#FCE4EC', fg: '#E91E63' },
		facilitator:{ bg: '#E8F5E9', fg: '#43A047' }
	};

	let c = $derived(colors[archetype] ?? colors.guardian);
</script>

<div style="
	width: {size}px;
	height: {size}px;
	border-radius: 50%;
	background: {c.bg};
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
">
	<svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke={c.fg} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		{#if archetype === 'guardian'}
			<!-- Shield -->
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
		{:else if archetype === 'maker'}
			<!-- Wrench / tool -->
			<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
		{:else if archetype === 'visionary'}
			<!-- Telescope / eye to horizon -->
			<circle cx="12" cy="12" r="2"/>
			<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/>
			<path d="M12 5V2"/>
			<path d="M12 22v-3"/>
		{:else if archetype === 'champion'}
			<!-- Trophy / flag -->
			<path d="M6 9l6-6 6 6"/>
			<path d="M12 3v18"/>
			<path d="M8 21h8"/>
		{:else if archetype === 'connector'}
			<!-- People / heart connection -->
			<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
			<path d="M21 21v-2a4 4 0 0 0-3-3.87"/>
			<path d="M12 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0z"/>
			<path d="M3 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/>
		{:else if archetype === 'catalyst'}
			<!-- Lightning / spark -->
			<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
		{:else if archetype === 'dreamer'}
			<!-- Cloud / moon -->
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
		{:else if archetype === 'maverick'}
			<!-- Compass / arrow pointing its own way -->
			<circle cx="12" cy="12" r="10"/>
			<polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/>
		{:else if archetype === 'advocate'}
			<!-- Heart -->
			<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
		{:else}
			<!-- Facilitator — cog / gear -->
			<circle cx="12" cy="12" r="3"/>
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
		{/if}
	</svg>
</div>

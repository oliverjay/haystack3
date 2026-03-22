<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import CinematicIntro from '$lib/components/CinematicIntro.svelte';

	function handleComplete() {
		if (browser) {
			localStorage.setItem('haystack_intro_seen', '1');
		}
		goto('/', { replaceState: true });
	}
</script>

<svelte:head>
	<title>Haystack</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<CinematicIntro onComplete={handleComplete} />

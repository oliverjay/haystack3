<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { getSupabase } from '$lib/supabase';

	let { data, children } = $props();

	onMount(() => {
		const supabase = getSupabase();
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<title>Haystack — Think you're compatible? Prove it.</title>
	<meta name="description" content="Answer 15 questions. Send the link. Find out how compatible you really are. Takes 90 seconds." />
</svelte:head>

{@render children()}

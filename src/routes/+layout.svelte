<script>
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Haystack — Think you're compatible? Prove it.</title>
	<meta name="description" content="Answer 10 questions. Send the link. Find out how compatible you really are. Takes 90 seconds." />
</svelte:head>

{@render children()}

import { browser } from '$app/environment';

const REVEALED_KEY = 'haystack_revealed_matches';

export function getRevealedMatches(): Set<string> {
	if (!browser) return new Set();
	try {
		const raw = localStorage.getItem(REVEALED_KEY);
		return raw ? new Set(JSON.parse(raw)) : new Set();
	} catch {
		return new Set();
	}
}

export function markMatchRevealed(matchId: string): void {
	if (!browser) return;
	const set = getRevealedMatches();
	set.add(matchId);
	localStorage.setItem(REVEALED_KEY, JSON.stringify([...set]));
}

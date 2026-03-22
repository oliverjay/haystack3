import { supabaseAdmin } from '$lib/server/supabase';
import { getScoreTier } from '$lib/questions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const { data: session } = await supabaseAdmin
		.from('sessions')
		.select('creator_name, creator_emoji')
		.eq('id', params.sessionId)
		.single();

	const matchId = url.searchParams.get('match');
	let score: number | null = null;
	let responderName: string | null = null;
	let responderEmoji: string | null = null;

	if (matchId) {
		const { data: match } = await supabaseAdmin
			.from('matches')
			.select('score, responder_response_id')
			.eq('id', matchId)
			.single();

		if (match) {
			score = match.score;
			const { data: resp } = await supabaseAdmin
				.from('responses')
				.select('responder_name, responder_emoji')
				.eq('id', match.responder_response_id)
				.single();
			responderName = resp?.responder_name ?? null;
			responderEmoji = resp?.responder_emoji ?? null;
		}
	}

	const name = session?.creator_name ?? 'Someone';
	const emoji = session?.creator_emoji ?? '👀';

	const isPostResult = score !== null && responderName;
	const scoreColor = isPostResult
		? score! >= 75 ? '#34B68E' : score! >= 45 ? '#F0A848' : '#E05A5A'
		: '#7A7A7A';

	let svg: string;

	if (isPostResult) {
		const tierLabel = getScoreTier(score!);
		const rEmoji = responderEmoji ?? '👤';

		svg = `
		<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
			<rect width="1200" height="630" fill="#F6F5F0"/>

			<!-- Two overlapping circles with emojis -->
			<circle cx="520" cy="170" r="72" fill="#F0EDEA" stroke="#E0DDD8" stroke-width="2"/>
			<circle cx="680" cy="170" r="72" fill="#F0EDEA" stroke="#E0DDD8" stroke-width="2"/>
			<text x="520" y="190" font-family="system-ui, sans-serif" font-size="56" text-anchor="middle">${emoji}</text>
			<text x="680" y="190" font-family="system-ui, sans-serif" font-size="56" text-anchor="middle">${rEmoji}</text>

			<!-- Score -->
			<text x="600" y="340" font-family="system-ui, sans-serif" font-size="120" font-weight="800" text-anchor="middle" fill="${scoreColor}">${score}%</text>

			<!-- Tier label -->
			<text x="600" y="400" font-family="system-ui, sans-serif" font-size="32" font-style="italic" text-anchor="middle" fill="#1A1A1A">${escapeXml(tierLabel)}</text>

			<!-- Names -->
			<text x="600" y="455" font-family="system-ui, sans-serif" font-size="28" font-weight="600" text-anchor="middle" fill="#7A7A7A">${escapeXml(name)} &amp; ${escapeXml(responderName!)}</text>

			<!-- Challenge line -->
			<text x="600" y="500" font-family="system-ui, sans-serif" font-size="24" text-anchor="middle" fill="#999">Think you can beat that?</text>

			<!-- Brand -->
			<text x="600" y="580" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#B0ADA8" letter-spacing="2">HAYSTACK</text>
		</svg>`;
	} else {
		svg = `
		<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
			<rect width="1200" height="630" fill="#F6F5F0"/>

			<!-- Venn diagram: creator circle + mystery circle -->
			<circle cx="520" cy="190" r="80" fill="#F0EDEA" stroke="#E0DDD8" stroke-width="2"/>
			<circle cx="680" cy="190" r="80" fill="none" stroke="#E0DDD8" stroke-width="2" stroke-dasharray="12 8"/>
			<text x="520" y="210" font-family="system-ui, sans-serif" font-size="64" text-anchor="middle">${emoji}</text>
			<text x="680" y="210" font-family="system-ui, sans-serif" font-size="64" text-anchor="middle" fill="#C0BDB8">?</text>

			<!-- Score placeholder -->
			<text x="600" y="355" font-family="system-ui, sans-serif" font-size="140" font-weight="800" text-anchor="middle" fill="#D0CDC8">?%</text>

			<!-- Name + prompt -->
			<text x="600" y="435" font-family="system-ui, sans-serif" font-size="34" font-weight="700" text-anchor="middle" fill="#1A1A1A">${escapeXml(name)} wants to see your score</text>
			<text x="600" y="480" font-family="system-ui, sans-serif" font-size="26" text-anchor="middle" fill="#7A7A7A">15 questions. 60 seconds.</text>

			<!-- Brand -->
			<text x="600" y="580" font-family="system-ui, sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#B0ADA8" letter-spacing="2">HAYSTACK</text>
		</svg>`;
	}

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};

function escapeXml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

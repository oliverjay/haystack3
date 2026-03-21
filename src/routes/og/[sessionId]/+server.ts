import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

	const { data: session } = await supabase
		.from('sessions')
		.select('creator_name, creator_emoji')
		.eq('id', params.sessionId)
		.single();

	const matchId = url.searchParams.get('match');
	let score: number | null = null;
	let responderName: string | null = null;

	if (matchId) {
		const { data: match } = await supabase
			.from('matches')
			.select('score, responder_response_id')
			.eq('id', matchId)
			.single();

		if (match) {
			score = match.score;
			const { data: resp } = await supabase
				.from('responses')
				.select('responder_name')
				.eq('id', match.responder_response_id)
				.single();
			responderName = resp?.responder_name ?? null;
		}
	}

	const name = session?.creator_name ?? 'Someone';
	const emoji = session?.creator_emoji ?? '👀';

	const isPostResult = score !== null && responderName;
	const title = isPostResult
		? `${name} & ${responderName}: ${score}%`
		: `${name} ${emoji}`;
	const subtitle = isPostResult
		? 'Think you can beat that?'
		: 'took 10 questions. Now it\'s your turn.';
	const scoreText = isPostResult ? `${score}%` : '?%';
	const scoreColor = isPostResult
		? score! >= 75 ? '#34B68E' : score! >= 45 ? '#F0A848' : '#E05A5A'
		: '#7A7A7A';

	const svg = `
		<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
			<rect width="1200" height="630" fill="#F6F5F0"/>
			<text x="600" y="180" font-family="system-ui, sans-serif" font-size="80" text-anchor="middle" fill="#1A1A1A">${emoji}</text>
			<text x="600" y="300" font-family="system-ui, sans-serif" font-size="${isPostResult ? '120' : '140'}" font-weight="800" text-anchor="middle" fill="${scoreColor}">${scoreText}</text>
			<text x="600" y="380" font-family="system-ui, sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="#1A1A1A">${escapeXml(title)}</text>
			<text x="600" y="430" font-family="system-ui, sans-serif" font-size="28" text-anchor="middle" fill="#7A7A7A">${escapeXml(subtitle)}</text>
			<text x="600" y="560" font-family="system-ui, sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#7A7A7A" letter-spacing="2">HAYSTACK</text>
		</svg>
	`;

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

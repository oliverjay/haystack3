import { redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { getSessionFast } }) => {
	if (url.searchParams.has('s')) return;

	const session = await getSessionFast();
	if (!session) return;

	const { data: mySession } = await supabaseAdmin
		.from('sessions')
		.select('id')
		.eq('user_id', session.user.id)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (mySession) {
		throw redirect(303, `/dashboard/${mySession.id}`);
	}
};

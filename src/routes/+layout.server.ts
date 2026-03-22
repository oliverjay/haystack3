import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { getSessionFast }, cookies }) => {
	const session = await getSessionFast();

	return {
		session,
		cookies: cookies.getAll()
	};
};

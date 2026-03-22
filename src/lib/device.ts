import { browser } from '$app/environment';

const DEVICE_ID_KEY = 'haystack_device_id';
const UNLOCK_KEY = 'haystack_unlocked';
const MY_SESSION_KEY = 'haystack_my_session';

export function getDeviceId(): string {
	if (!browser) return '';
	let id = localStorage.getItem(DEVICE_ID_KEY);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(DEVICE_ID_KEY, id);
	}
	return id;
}

export function isUnlocked(): boolean {
	if (!browser) return false;
	return localStorage.getItem(UNLOCK_KEY) === 'true';
}

export function setUnlocked(): void {
	if (!browser) return;
	localStorage.setItem(UNLOCK_KEY, 'true');
}

export function getMySessionId(): string | null {
	if (!browser) return null;
	return localStorage.getItem(MY_SESSION_KEY);
}

export function setMySessionId(sessionId: string): void {
	if (!browser) return;
	localStorage.setItem(MY_SESSION_KEY, sessionId);
}

export function clearSession(): void {
	if (!browser) return;
	localStorage.removeItem(MY_SESSION_KEY);
	localStorage.removeItem(UNLOCK_KEY);
	const deviceId = localStorage.getItem(DEVICE_ID_KEY);
	if (deviceId) {
		localStorage.removeItem(`haystack_auto_session_${deviceId}`);
	}
}


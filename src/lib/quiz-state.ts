import { browser } from '$app/environment';

const QUIZ_KEY = 'haystack_quiz';

export interface QuizState {
	sessionId?: string;
	name: string;
	emoji: string;
	avatarUrl?: string | null;
	answers: (number | null)[];
	currentQuestion: number;
	startedAt?: number;
	isCreator: boolean;
}

function defaultState(isCreator: boolean): QuizState {
	return {
		name: '',
		emoji: '',
		answers: Array(10).fill(null),
		currentQuestion: 0,
		isCreator
	};
}

function storageKey(sessionId?: string): string {
	return sessionId ? `${QUIZ_KEY}_${sessionId}` : QUIZ_KEY;
}

export function loadQuizState(sessionId?: string, isCreator = true): QuizState {
	if (!browser) return defaultState(isCreator);
	try {
		const raw = localStorage.getItem(storageKey(sessionId));
		if (raw) {
			const parsed = JSON.parse(raw) as QuizState;
			return parsed;
		}
	} catch {
		// corrupted storage, start fresh
	}
	return defaultState(isCreator);
}

export function saveQuizState(state: QuizState, sessionId?: string): void {
	if (!browser) return;
	localStorage.setItem(storageKey(sessionId), JSON.stringify(state));
}

export function clearQuizState(sessionId?: string): void {
	if (!browser) return;
	localStorage.removeItem(storageKey(sessionId));
}

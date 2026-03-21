export type QuestionType = 'binary' | 'slider' | 'spectrum';
export type ScoringType = 'similarity' | 'complementary' | 'blended';

export interface Question {
	id: number;
	type: QuestionType;
	prompt: string;
	labelLeft: string;
	labelRight: string;
	scoring: ScoringType;
	weight: number;
	divisive: boolean;
	tensionLine?: string;
	tensionTemplate: string;
	tensionTemplateComplement?: string;
	alignmentTemplate: string;
}

export const questions: Question[] = [
	{
		id: 1,
		type: 'spectrum',
		prompt: 'Friday night — what are you doing?',
		labelLeft: 'Going out',
		labelRight: 'Staying in',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		tensionTemplate: 'One of you is restless on a Friday night. The other is already in bed.',
		alignmentTemplate: "You'd never fight over Friday night plans."
	},
	{
		id: 2,
		type: 'spectrum',
		prompt: 'When someone you care about is upset, what do you do?',
		labelLeft: 'Try to fix it',
		labelRight: 'Just be there',
		scoring: 'blended',
		weight: 1.0,
		divisive: false,
		tensionTemplate: "One of you wants solutions. The other just wants to be heard. That's a classic collision.",
		alignmentTemplate: 'You show up for people the same way. They feel it.'
	},
	{
		id: 3,
		type: 'spectrum',
		prompt: 'In an argument, are you more logical or emotional?',
		labelLeft: 'Head',
		labelRight: 'Heart',
		scoring: 'blended',
		weight: 1.0,
		divisive: false,
		tensionTemplate: "You argue in completely different languages. That gets exhausting fast.",
		alignmentTemplate: "You handle conflict the same way. Fewer misunderstandings."
	},
	{
		id: 4,
		type: 'spectrum',
		prompt: 'Would you rather be respected or loved?',
		labelLeft: 'Respected',
		labelRight: 'Loved',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		tensionTemplate: 'One of you needs to be respected first. The other just wants to feel loved.',
		alignmentTemplate: 'You both want the same thing from the people around you.'
	},
	{
		id: 5,
		type: 'slider',
		prompt: 'How comfortable are you with silence in a conversation?',
		labelLeft: 'Awkward',
		labelRight: 'Peaceful',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		tensionTemplate: "You experience silence completely differently. One relaxes, the other panics.",
		alignmentTemplate: "You're both comfortable in the quiet. That's rare and it matters."
	},
	{
		id: 6,
		type: 'spectrum',
		prompt: 'How do you feel about spontaneity?',
		labelLeft: 'Plan everything',
		labelRight: 'Wing it',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		tensionTemplate: 'One of you has a plan. The other just ripped it up.',
		alignmentTemplate: "You'd pack for a trip the same way."
	},
	{
		id: 7,
		type: 'binary',
		prompt: "Is it okay to look through a close friend's phone if you're worried about them?",
		labelLeft: 'Yes',
		labelRight: 'No',
		scoring: 'similarity',
		weight: 1.5,
		divisive: true,
		tensionLine: 'That one splits people.',
		tensionTemplate: "One of you would go through a friend's phone and sleep fine. The other wouldn't.",
		alignmentTemplate: 'You agree on where the line is. That matters more than people think.'
	},
	{
		id: 8,
		type: 'spectrum',
		prompt: "If a friend asks 'Do I look good?', how honest are you?",
		labelLeft: 'Tell them what they want to hear',
		labelRight: 'Brutal honesty',
		scoring: 'blended',
		weight: 1.5,
		divisive: true,
		tensionLine: 'People tend to have strong opinions on this.',
		tensionTemplate: "One of you lies to be kind. The other thinks that's worse than the truth.",
		alignmentTemplate: "You'd give a friend the same advice. That's rare."
	},
	{
		id: 9,
		type: 'spectrum',
		prompt: 'In a group, are you more of a listener or a talker?',
		labelLeft: 'Listener',
		labelRight: 'Talker',
		scoring: 'complementary',
		weight: 1.0,
		divisive: false,
		tensionTemplate: "You're both talkers. Who's listening?",
		tensionTemplateComplement: "You're both quiet. Someone's got to break the silence.",
		alignmentTemplate: "One talks, the other listens. You'd balance each other perfectly."
	},
	{
		id: 10,
		type: 'binary',
		prompt: 'Can you stay close friends with someone you once had feelings for?',
		labelLeft: 'Yes',
		labelRight: 'No',
		scoring: 'similarity',
		weight: 1.5,
		divisive: true,
		tensionLine: 'This answer usually changes the vibe of a match.',
		tensionTemplate: "One of you is still texting an ex. The other thinks that's a red flag.",
		alignmentTemplate: "You're on the same page about exes. No awkward conversations."
	}
];

export type ArchetypeId = 'spark' | 'mirror' | 'anchor' | 'compass' | 'drifter';

export interface Archetype {
	id: ArchetypeId;
	name: string;
	tagline: string;
	description: string;
}

export const archetypes: Record<ArchetypeId, Archetype> = {
	spark: {
		id: 'spark',
		name: 'The Spark',
		tagline: 'Lives out loud',
		description: 'You bring energy to every room. People gravitate toward your warmth and spontaneity, even when it borders on chaos.'
	},
	mirror: {
		id: 'mirror',
		name: 'The Mirror',
		tagline: 'Reads people deeply',
		description: "You notice what others miss. You feel things strongly and understand people on a level that can be uncomfortable — for them."
	},
	anchor: {
		id: 'anchor',
		name: 'The Anchor',
		tagline: 'Steady and grounding',
		description: "You're the person people call when things fall apart. Reliable, calm, and quietly strong — even when you don't feel it."
	},
	compass: {
		id: 'compass',
		name: 'The Compass',
		tagline: 'Knows where they stand',
		description: "You have strong principles and you stick to them. People respect you for it, even when they disagree."
	},
	drifter: {
		id: 'drifter',
		name: 'The Drifter',
		tagline: 'Comfortable in the grey',
		description: "You resist being pinned down — not because you don't care, but because you see every side. Flexibility is your superpower."
	}
};

export type PairKey = `${ArchetypeId}_${ArchetypeId}`;

function pairKey(a: ArchetypeId, b: ArchetypeId): PairKey {
	return [a, b].sort().join('_') as PairKey;
}

export const pairDynamics: Record<PairKey, string> = {
	[pairKey('spark', 'spark')]: 'All gas, no brakes.',
	[pairKey('spark', 'mirror')]: 'One lights up the room, the other sees everything in it.',
	[pairKey('spark', 'anchor')]: "One of you is the gas, the other is the brakes.",
	[pairKey('spark', 'compass')]: "You'd challenge each other. Could go either way.",
	[pairKey('spark', 'drifter')]: "Easy energy. But who's steering?",
	[pairKey('mirror', 'mirror')]: 'You understand each other almost too well.',
	[pairKey('mirror', 'anchor')]: "A safe combination. You'd talk about the real stuff.",
	[pairKey('mirror', 'compass')]: "You see the world differently. You'd learn a lot.",
	[pairKey('mirror', 'drifter')]: 'One of you feels deeply, the other floats.',
	[pairKey('anchor', 'anchor')]: 'Solid ground. But who shakes things up?',
	[pairKey('anchor', 'compass')]: 'Two people who know who they are.',
	[pairKey('anchor', 'drifter')]: "You'd ground them. Question is if they want that.",
	[pairKey('compass', 'compass')]: 'Two strong wills. Power duo or standoff.',
	[pairKey('compass', 'drifter')]: "One has a plan. The other doesn't.",
	[pairKey('drifter', 'drifter')]: "You'd vibe. Nothing would ever get decided."
};

export function getPairDynamic(a: ArchetypeId, b: ArchetypeId): string {
	return pairDynamics[pairKey(a, b)] ?? "An interesting combination.";
}

export const EMOJI_OPTIONS = [
	'😎', '🤠', '🦊', '🐸', '🌸', '🔥', '💀', '🌊',
	'🍄', '🦋', '🌙', '⚡', '🎭', '🧊', '🌿', '🎪',
	'🦇', '🍑', '🌶️', '🐙', '💫', '🎯', '🪐', '🦈',
	'🍀', '🐝', '🌻', '🎲', '🦜', '🧿'
];

export const SCORE_TIERS = [
	{ min: 90, max: 100, label: 'Scarily in sync' },
	{ min: 75, max: 89, label: 'You just get each other' },
	{ min: 60, max: 74, label: "More alike than you'd think" },
	{ min: 45, max: 59, label: "You'd have interesting arguments" },
	{ min: 30, max: 44, label: 'Different wavelengths' },
	{ min: 0, max: 29, label: 'Opposites — for better or worse' }
];

export function getScoreTier(score: number): string {
	const tier = SCORE_TIERS.find((t) => score >= t.min && score <= t.max);
	return tier?.label ?? '';
}

import {
	questions,
	archetypes,
	getPairDynamic,
	TOTAL_QUESTIONS,
	type ArchetypeId,
	type LoveLanguageId,
	type TraitAxis
} from './questions';

// ─── Types ───

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface TraitProfile {
	openness: number;
	conscientiousness: number;
	extraversion: number;
	agreeableness: number;
	neuroticism: number;
	attachmentAnxiety: number;
	attachmentAvoidance: number;
	attachmentStyle: AttachmentStyle;
	loveLangPrimary: LoveLanguageId;
	loveLangSecondary: LoveLanguageId;
}

export interface ComponentScores {
	traitAlignment: number;
	attachmentFit: number;
	loveLangMatch: number;
	rhythmFit: number;
	repairFit: number;
}

export interface MatchResult {
	score: number;
	questionScores: number[];
	biggestTension: string;
	strongestAlignment: string;
	pairDynamic: string;
	creatorArchetype: ArchetypeId;
	responderArchetype: ArchetypeId;
	creatorProfile: TraitProfile;
	responderProfile: TraitProfile;
	componentScores: ComponentScores;
}

// ─── Trait Computation ───

/** Get questions mapping to a specific trait axis */
function questionsForTrait(axis: TraitAxis): number[] {
	return questions
		.map((q, i) => (q.traitAxis === axis ? i : -1))
		.filter((i) => i >= 0);
}

/** Normalize an answer to trait direction (0-100 scale where 100 = high trait) */
function normalizeToTrait(answerValue: number, positive: boolean): number {
	return positive ? answerValue : 100 - answerValue;
}

/** Love language questions store 0-4 representing which option was picked */
function decodeLoveLangAnswer(value: number): LoveLanguageId {
	const ids: LoveLanguageId[] = ['quality_time', 'words', 'touch', 'acts', 'gifts'];
	const idx = Math.round(Math.max(0, Math.min(4, value)));
	return ids[idx];
}

export function computeTraitProfile(answers: number[]): TraitProfile {
	const traitScores: Record<string, number[]> = {};

	for (let i = 0; i < questions.length; i++) {
		const q = questions[i];
		if (q.traitAxis === 'love_language') continue;

		const key = q.traitAxis;
		if (!traitScores[key]) traitScores[key] = [];
		traitScores[key].push(normalizeToTrait(answers[i], q.traitPositive));
	}

	const avg = (arr: number[]) =>
		arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 50;

	const openness = avg(traitScores['openness'] ?? []);
	const conscientiousness = avg(traitScores['conscientiousness'] ?? []);
	const extraversion = avg(traitScores['extraversion'] ?? []);
	const agreeableness = avg(traitScores['agreeableness'] ?? []);
	const neuroticism = avg(traitScores['neuroticism'] ?? []);
	const attachmentAnxiety = avg(traitScores['attachment_anxiety'] ?? []);
	const attachmentAvoidance = avg(traitScores['attachment_avoidance'] ?? []);

	const attachmentStyle = deriveAttachmentStyle(attachmentAnxiety, attachmentAvoidance);

	// Love languages from Q14 and Q15
	const llIndices = questionsForTrait('love_language');
	const llAnswers = llIndices.map((i) => decodeLoveLangAnswer(answers[i]));
	const llCounts: Record<string, number> = {};
	for (const ll of llAnswers) {
		llCounts[ll] = (llCounts[ll] ?? 0) + 1;
	}
	const sorted = Object.entries(llCounts).sort((a, b) => b[1] - a[1]);
	const loveLangPrimary = (sorted[0]?.[0] ?? 'quality_time') as LoveLanguageId;
	const loveLangSecondary = (sorted[1]?.[0] ?? loveLangPrimary) as LoveLanguageId;

	return {
		openness: Math.round(openness),
		conscientiousness: Math.round(conscientiousness),
		extraversion: Math.round(extraversion),
		agreeableness: Math.round(agreeableness),
		neuroticism: Math.round(neuroticism),
		attachmentAnxiety: Math.round(attachmentAnxiety),
		attachmentAvoidance: Math.round(attachmentAvoidance),
		attachmentStyle,
		loveLangPrimary,
		loveLangSecondary
	};
}

function deriveAttachmentStyle(anxiety: number, avoidance: number): AttachmentStyle {
	const anxiousThreshold = 55;
	const avoidantThreshold = 55;

	if (anxiety < anxiousThreshold && avoidance < avoidantThreshold) return 'secure';
	if (anxiety >= anxiousThreshold && avoidance < avoidantThreshold) return 'anxious';
	if (anxiety < anxiousThreshold && avoidance >= avoidantThreshold) return 'avoidant';
	return 'disorganized';
}

// ─── Compatibility Scoring ───

/** Per-question compatibility (used for tension/alignment picking) */
function questionCompatibility(questionIndex: number, a: number, b: number): number {
	const q = questions[questionIndex];
	if (q.type === 'fiveChoice') {
		return a === b ? 100 : 30;
	}
	switch (q.scoring) {
		case 'similarity':
			return 100 - Math.abs(a - b);
		case 'complementary':
			return Math.abs(a - b);
		case 'blended':
			return 100 - Math.abs(Math.abs(a - b) - 40);
	}
}

function traitDistance(a: number, b: number): number {
	return 100 - Math.abs(a - b);
}

/** 1. Trait alignment: closeness across Big Five (35%) */
function computeTraitAlignment(a: TraitProfile, b: TraitProfile): number {
	const traits: (keyof TraitProfile)[] = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
	let total = 0;
	for (const t of traits) {
		total += traitDistance(a[t] as number, b[t] as number);
	}
	return total / traits.length;
}

/** 2. Attachment fit: secure-secure is best, anxious-avoidant penalized (25%) */
function computeAttachmentFit(a: TraitProfile, b: TraitProfile): number {
	const anxietyGap = Math.abs(a.attachmentAnxiety - b.attachmentAnxiety);
	const avoidanceGap = Math.abs(a.attachmentAvoidance - b.attachmentAvoidance);
	let base = 100 - (anxietyGap * 0.5 + avoidanceGap * 0.5);

	// Bonus: both secure
	if (a.attachmentStyle === 'secure' && b.attachmentStyle === 'secure') {
		base = Math.min(100, base + 15);
	}

	// Penalty: anxious-avoidant trap
	if (
		(a.attachmentStyle === 'anxious' && b.attachmentStyle === 'avoidant') ||
		(a.attachmentStyle === 'avoidant' && b.attachmentStyle === 'anxious')
	) {
		base = Math.max(0, base - 20);
	}

	return Math.max(0, Math.min(100, base));
}

/** 3. Love language match (15%) */
function computeLoveLangMatch(a: TraitProfile, b: TraitProfile): number {
	if (a.loveLangPrimary === b.loveLangPrimary) return 100;
	if (a.loveLangPrimary === b.loveLangSecondary || b.loveLangPrimary === a.loveLangSecondary) return 70;
	return 40;
}

/** 4. Rhythm fit: extraversion + conscientiousness alignment (15%) */
function computeRhythmFit(a: TraitProfile, b: TraitProfile): number {
	const extraversionFit = traitDistance(a.extraversion, b.extraversion);
	const conscientiousnessFit = traitDistance(a.conscientiousness, b.conscientiousness);
	return extraversionFit * 0.5 + conscientiousnessFit * 0.5;
}

/** 5. Repair fit: agreeableness + inverse neuroticism (10%) */
function computeRepairFit(a: TraitProfile, b: TraitProfile): number {
	const agreeablenessAvg = (a.agreeableness + b.agreeableness) / 2;
	const stabilityAvg = ((100 - a.neuroticism) + (100 - b.neuroticism)) / 2;
	return agreeablenessAvg * 0.6 + stabilityAvg * 0.4;
}

function spreadCurve(raw: number): number {
	const stretched = 50 + (raw - 50) * 1.2;
	return Math.round(Math.max(0, Math.min(100, stretched)));
}

// ─── Main scoring function ───

export function computeScore(creatorAnswers: number[], responderAnswers: number[]): MatchResult {
	const creatorProfile = computeTraitProfile(creatorAnswers);
	const responderProfile = computeTraitProfile(responderAnswers);

	// Per-question scores (for tension/alignment picking)
	const questionScores = questions.map((_, i) =>
		questionCompatibility(i, creatorAnswers[i], responderAnswers[i])
	);

	// Component scores
	const componentScores: ComponentScores = {
		traitAlignment: Math.round(computeTraitAlignment(creatorProfile, responderProfile)),
		attachmentFit: Math.round(computeAttachmentFit(creatorProfile, responderProfile)),
		loveLangMatch: Math.round(computeLoveLangMatch(creatorProfile, responderProfile)),
		rhythmFit: Math.round(computeRhythmFit(creatorProfile, responderProfile)),
		repairFit: Math.round(computeRepairFit(creatorProfile, responderProfile))
	};

	// Weighted composite
	const rawScore =
		componentScores.traitAlignment * 0.35 +
		componentScores.attachmentFit * 0.25 +
		componentScores.loveLangMatch * 0.15 +
		componentScores.rhythmFit * 0.15 +
		componentScores.repairFit * 0.10;

	const score = spreadCurve(rawScore);

	const creatorArchetype = assignArchetype(creatorProfile);
	const responderArchetype = assignArchetype(responderProfile);
	const pairDynamic = getPairDynamic(creatorArchetype, responderArchetype);
	const biggestTension = pickTension(questionScores, creatorAnswers, responderAnswers);
	const strongestAlignment = pickAlignment(questionScores);

	return {
		score,
		questionScores,
		biggestTension,
		strongestAlignment,
		pairDynamic,
		creatorArchetype,
		responderArchetype,
		creatorProfile,
		responderProfile,
		componentScores
	};
}

// ─── Tension / Alignment picking ───

function pickTension(scores: number[], aAnswers: number[], bAnswers: number[]): string {
	let worstIdx = 0;
	let worstScore = scores[0];

	for (let i = 1; i < scores.length; i++) {
		const isBetter =
			scores[i] < worstScore ||
			(scores[i] === worstScore && questions[i].divisive && !questions[worstIdx].divisive);

		if (isBetter) {
			worstIdx = i;
			worstScore = scores[i];
		}
	}

	return questions[worstIdx].tensionTemplate;
}

function pickAlignment(scores: number[]): string {
	let bestIdx = 0;
	let bestScore = scores[0];

	for (let i = 1; i < scores.length; i++) {
		if (scores[i] > bestScore) {
			bestIdx = i;
			bestScore = scores[i];
		}
	}

	return questions[bestIdx].alignmentTemplate;
}

// ─── Archetype assignment ───

export function assignArchetype(profileOrAnswers: TraitProfile | number[]): ArchetypeId {
	const p: TraitProfile = Array.isArray(profileOrAnswers)
		? computeTraitProfile(profileOrAnswers)
		: profileOrAnswers;

	const { openness: O, conscientiousness: C, extraversion: E, agreeableness: A, neuroticism: N } = p;
	const secureBonus = p.attachmentStyle === 'secure' ? 10 : 0;
	const avoidBonus = p.attachmentAvoidance > 55 ? 10 : 0;
	const closeBonus = p.attachmentAvoidance < 45 ? 10 : 0;

	const scores: [ArchetypeId, number][] = [
		// Guardian: high C, low N, secure
		['guardian', C * 0.35 + (100 - N) * 0.3 + secureBonus + (100 - E) * 0.1 + (100 - O) * 0.05],
		// Maker: high C, moderate O, low N
		['maker', C * 0.35 + O * 0.15 + (100 - N) * 0.25 + (100 - E) * 0.1 + (100 - A) * 0.05],
		// Visionary: high O, moderate C, close-comfortable
		['visionary', O * 0.35 + C * 0.2 + closeBonus + (100 - N) * 0.15 + E * 0.1],
		// Champion: high E, high C, low N
		['champion', E * 0.3 + C * 0.3 + (100 - N) * 0.2 + (100 - A) * 0.05 + secureBonus * 0.5],
		// Connector: high A, high E, close-comfortable
		['connector', A * 0.35 + E * 0.3 + closeBonus + (100 - N) * 0.1],
		// Catalyst: high O, high E, low C
		['catalyst', O * 0.3 + E * 0.3 + (100 - C) * 0.25 + (100 - N) * 0.05],
		// Dreamer: high O, low E, moderate N
		['dreamer', O * 0.35 + (100 - E) * 0.25 + N * 0.1 + A * 0.1 + (100 - C) * 0.1],
		// Maverick: low A, high O, avoidant-leaning
		['maverick', (100 - A) * 0.3 + O * 0.2 + avoidBonus + E * 0.1 + (100 - N) * 0.1],
		// Advocate: high A, low E, close-comfortable
		['advocate', A * 0.35 + (100 - E) * 0.25 + closeBonus + N * 0.05 + (100 - C) * 0.05],
		// Facilitator: high C, high A, secure
		['facilitator', C * 0.3 + A * 0.3 + secureBonus + (100 - N) * 0.1 + E * 0.05]
	];

	scores.sort((a, b) => b[1] - a[1]);
	return scores[0][0];
}

// ─── Utilities ───

export function getScoreColor(score: number): string {
	if (score >= 75) return 'var(--color-score-high)';
	if (score >= 45) return 'var(--color-score-mid)';
	return 'var(--color-score-low)';
}

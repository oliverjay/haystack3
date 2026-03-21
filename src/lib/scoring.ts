import {
	questions,
	archetypes,
	getPairDynamic,
	type ArchetypeId
} from './questions';

export interface MatchResult {
	score: number;
	questionScores: number[];
	biggestTension: string;
	strongestAlignment: string;
	pairDynamic: string;
	creatorArchetype: ArchetypeId;
	responderArchetype: ArchetypeId;
}

function questionCompatibility(questionIndex: number, a: number, b: number): number {
	const q = questions[questionIndex];
	switch (q.scoring) {
		case 'similarity':
			return 100 - Math.abs(a - b);
		case 'complementary':
			return Math.abs(a - b);
		case 'blended':
			return 100 - Math.abs(Math.abs(a - b) - 40);
	}
}

function spreadCurve(raw: number): number {
	const stretched = 50 + (raw - 50) * 1.4;
	return Math.round(Math.max(0, Math.min(100, stretched)));
}

export function computeScore(creatorAnswers: number[], responderAnswers: number[]): MatchResult {
	const questionScores = questions.map((_, i) =>
		questionCompatibility(i, creatorAnswers[i], responderAnswers[i])
	);

	let weightedSum = 0;
	let weightTotal = 0;
	for (let i = 0; i < questions.length; i++) {
		weightedSum += questionScores[i] * questions[i].weight;
		weightTotal += questions[i].weight;
	}
	const rawAverage = weightedSum / weightTotal;
	const score = spreadCurve(rawAverage);

	const creatorArchetype = assignArchetype(creatorAnswers);
	const responderArchetype = assignArchetype(responderAnswers);
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
		responderArchetype
	};
}

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

	const q = questions[worstIdx];

	if (q.scoring === 'complementary' && scores[worstIdx] < 40) {
		const avg = (aAnswers[worstIdx] + bAnswers[worstIdx]) / 2;
		if (q.tensionTemplate.includes('{direction}')) {
			const direction = avg < 50 ? q.labelLeft.toLowerCase() : q.labelRight.toLowerCase();
			return q.tensionTemplate.replace('{direction}', direction);
		}
		return q.tensionTemplate;
	}

	return q.tensionTemplate;
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

function assignArchetype(answers: number[]): ArchetypeId {
	const socialEnergy = avg(answers[0], answers[8]);
	const emotionalStyle = avg(answers[2], answers[3], answers[7]);
	const structure = avg(answers[1], answers[4], answers[5], answers[9]);

	if (socialEnergy >= 60) return 'spark';
	if (socialEnergy < 50 && emotionalStyle >= 55) return 'mirror';
	if (socialEnergy < 50 && emotionalStyle < 45) return 'anchor';
	if (emotionalStyle < 45 && structure >= 55) return 'compass';
	return 'drifter';
}

function avg(...values: number[]): number {
	return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function getScoreColor(score: number): string {
	if (score >= 75) return 'var(--color-score-high)';
	if (score >= 45) return 'var(--color-score-mid)';
	return 'var(--color-score-low)';
}

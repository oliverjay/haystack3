export type QuestionType = 'binary' | 'slider' | 'spectrum' | 'fiveChoice';
export type ScoringType = 'similarity' | 'complementary' | 'blended';

export type TraitAxis =
	| 'openness'
	| 'conscientiousness'
	| 'extraversion'
	| 'agreeableness'
	| 'neuroticism'
	| 'attachment_anxiety'
	| 'attachment_avoidance'
	| 'love_language';

export type CategoryId = 'identity' | 'connection' | 'love';

export interface Category {
	id: CategoryId;
	name: string;
	tagline: string;
	emoji: string;
}

export const categories: Category[] = [
	{
		id: 'identity',
		name: 'Who you are',
		tagline: 'The instincts, habits, and patterns that make you, you.',
		emoji: '🧭'
	},
	{
		id: 'connection',
		name: 'How you connect',
		tagline: 'The way you show up for people — and what you need back.',
		emoji: '🤝'
	},
	{
		id: 'love',
		name: 'How you love',
		tagline: 'What makes you feel close, safe, and understood.',
		emoji: '💛'
	}
];

export type LoveLanguageId = 'quality_time' | 'words' | 'touch' | 'acts' | 'gifts';

export interface LoveLanguageOption {
	id: LoveLanguageId;
	label: string;
	emoji: string;
}

export const LOVE_LANGUAGE_OPTIONS: LoveLanguageOption[] = [
	{ id: 'quality_time', label: 'Quality time', emoji: '⏳' },
	{ id: 'words', label: 'Words', emoji: '💬' },
	{ id: 'touch', label: 'Touch', emoji: '🤗' },
	{ id: 'acts', label: 'Actions', emoji: '🛠️' },
	{ id: 'gifts', label: 'Gifts', emoji: '🎁' }
];

export interface Question {
	id: number;
	type: QuestionType;
	category: CategoryId;
	prompt: string;
	labelLeft: string;
	labelRight: string;
	scoring: ScoringType;
	weight: number;
	divisive: boolean;
	traitAxis: TraitAxis;
	/** true = high answer value → high trait; false = high answer value → low trait */
	traitPositive: boolean;
	tensionLine?: string;
	tensionTemplate: string;
	tensionTemplateComplement?: string;
	alignmentTemplate: string;
	/** For fiveChoice type: the labels for the 5 options */
	fiveChoiceLabels?: LoveLanguageOption[];
}

export const questions: Question[] = [
	// ── Category 1: Who you are (Q1–Q5) ──
	// Conscientiousness
	{
		id: 1,
		type: 'spectrum',
		category: 'identity',
		prompt: 'When plans change last minute, how do you feel?',
		labelLeft: 'Stressed',
		labelRight: 'Excited',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'conscientiousness',
		traitPositive: false,
		tensionTemplate: 'One of you rolls with change. The other needs the plan to stick.',
		alignmentTemplate: 'You handle disruption the same way. That prevents a lot of friction.'
	},
	// Openness
	{
		id: 2,
		type: 'spectrum',
		category: 'identity',
		prompt: 'Do you prefer trying something new or perfecting what you know?',
		labelLeft: 'Perfect what I know',
		labelRight: 'Try something new',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'openness',
		traitPositive: true,
		tensionTemplate: 'One of you craves novelty. The other wants to go deeper, not wider.',
		alignmentTemplate: 'You explore the world at the same pace. Less pulling in different directions.'
	},
	// Extraversion
	{
		id: 3,
		type: 'spectrum',
		category: 'identity',
		prompt: 'After a long week, what recharges you?',
		labelLeft: 'People and energy',
		labelRight: 'Solitude and quiet',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'extraversion',
		traitPositive: false,
		tensionTemplate: 'One of you needs a crowd to recharge. The other needs to be alone. That gap shows up every weekend.',
		alignmentTemplate: 'You recharge the same way. That means fewer "why don\'t you want to come?" moments.'
	},
	// Conscientiousness
	{
		id: 4,
		type: 'spectrum',
		category: 'identity',
		prompt: 'When you start something, how often do you see it through?',
		labelLeft: 'Almost always',
		labelRight: 'Depends how I feel',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'conscientiousness',
		traitPositive: false,
		tensionLine: 'This one says a lot about reliability.',
		tensionTemplate: 'One of you always finishes. The other moves on when it stops being interesting.',
		alignmentTemplate: 'You follow through at the same rate. People can count on you both.'
	},
	// Openness
	{
		id: 5,
		type: 'spectrum',
		category: 'identity',
		prompt: 'Would you rather explore an unfamiliar city or revisit your favourite place?',
		labelLeft: 'Revisit a favourite',
		labelRight: 'Somewhere new',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'openness',
		traitPositive: true,
		tensionTemplate: 'One of you books the same holiday. The other has never been to the same place twice.',
		alignmentTemplate: 'You\'d plan the same kind of trip. No one\'s being dragged along.'
	},

	// ── Category 2: How you connect (Q6–Q10) ──
	// Extraversion (complementary)
	{
		id: 6,
		type: 'spectrum',
		category: 'connection',
		prompt: 'In a group, are you usually the one talking or listening?',
		labelLeft: 'Listening',
		labelRight: 'Talking',
		scoring: 'complementary',
		weight: 1.0,
		divisive: false,
		traitAxis: 'extraversion',
		traitPositive: true,
		tensionTemplate: 'You\'re both talkers — who\'s listening?',
		tensionTemplateComplement: 'You\'re both quiet. Someone has to break the silence.',
		alignmentTemplate: 'One talks, the other listens. A natural balance.'
	},
	// Agreeableness
	{
		id: 7,
		type: 'spectrum',
		category: 'connection',
		prompt: 'When someone disagrees with you, what\'s your first instinct?',
		labelLeft: 'Stand my ground',
		labelRight: 'Find common ground',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'agreeableness',
		traitPositive: true,
		tensionTemplate: 'One of you digs in. The other bends. That pattern gets old.',
		alignmentTemplate: 'You meet disagreement the same way. Fewer power struggles.'
	},
	// Neuroticism
	{
		id: 8,
		type: 'spectrum',
		category: 'connection',
		prompt: 'How do you handle a stressful day?',
		labelLeft: 'It hits me hard',
		labelRight: 'I shake it off',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'neuroticism',
		traitPositive: false,
		tensionTemplate: 'One of you absorbs stress. The other lets it bounce off. That difference affects everything.',
		alignmentTemplate: 'You process stress at the same speed. Neither has to explain why they\'re off.'
	},
	// Agreeableness
	{
		id: 9,
		type: 'binary',
		category: 'connection',
		prompt: 'A friend lets you down. Do you confront them or let it go?',
		labelLeft: 'Confront them',
		labelRight: 'Let it go',
		scoring: 'similarity',
		weight: 1.5,
		divisive: true,
		traitAxis: 'agreeableness',
		traitPositive: true,
		tensionLine: 'This one reveals a lot about conflict.',
		tensionTemplate: 'One of you addresses it head-on. The other swallows it. That gap builds quietly.',
		alignmentTemplate: 'You handle disappointment the same way. No one\'s left guessing.'
	},
	// Neuroticism
	{
		id: 10,
		type: 'slider',
		category: 'connection',
		prompt: 'When things feel uncertain, how much does it affect you?',
		labelLeft: 'I feel it deeply',
		labelRight: 'I stay pretty calm',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'neuroticism',
		traitPositive: false,
		tensionTemplate: 'One of you spirals in uncertainty. The other barely notices. That mismatch can feel lonely.',
		alignmentTemplate: 'You sit with uncertainty the same way. That\'s a deeper kind of safety.'
	},

	// ── Category 3: How you love (Q11–Q15) ──
	// Attachment anxiety
	{
		id: 11,
		type: 'spectrum',
		category: 'love',
		prompt: 'In a close relationship, how much reassurance do you need?',
		labelLeft: 'Very little',
		labelRight: 'A lot',
		scoring: 'similarity',
		weight: 1.5,
		divisive: true,
		traitAxis: 'attachment_anxiety',
		traitPositive: true,
		tensionLine: 'This shapes every close relationship you have.',
		tensionTemplate: 'One of you needs to hear it. The other assumes it\'s obvious. That gap erodes trust slowly.',
		alignmentTemplate: 'You need the same level of reassurance. Neither feels clingy or cold.'
	},
	// Attachment avoidance
	{
		id: 12,
		type: 'spectrum',
		category: 'love',
		prompt: 'How comfortable are you being emotionally vulnerable?',
		labelLeft: 'Very comfortable',
		labelRight: 'I keep my guard up',
		scoring: 'similarity',
		weight: 1.5,
		divisive: true,
		traitAxis: 'attachment_avoidance',
		traitPositive: true,
		tensionTemplate: 'One of you opens up easily. The other builds walls. That\'s the classic intimacy standoff.',
		alignmentTemplate: 'You open up at the same speed. That builds real intimacy.'
	},
	// Attachment avoidance
	{
		id: 13,
		type: 'spectrum',
		category: 'love',
		prompt: 'When someone depends on you emotionally, how does it feel?',
		labelLeft: 'I love it',
		labelRight: 'It feels heavy',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'attachment_avoidance',
		traitPositive: true,
		tensionTemplate: 'One of you craves being needed. The other feels trapped by it. Neither is wrong.',
		alignmentTemplate: 'You feel the same way about emotional responsibility. That prevents resentment.'
	},
	// Love language
	{
		id: 14,
		type: 'fiveChoice',
		category: 'love',
		prompt: 'What makes you feel most loved?',
		labelLeft: '',
		labelRight: '',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'love_language',
		traitPositive: true,
		fiveChoiceLabels: LOVE_LANGUAGE_OPTIONS,
		tensionTemplate: 'You feel loved in completely different ways. What feels like effort to one doesn\'t register for the other.',
		alignmentTemplate: 'You speak the same love language. Your effort actually lands.'
	},
	// Love language (confirming)
	{
		id: 15,
		type: 'fiveChoice',
		category: 'love',
		prompt: 'How do you know someone really cares?',
		labelLeft: '',
		labelRight: '',
		scoring: 'similarity',
		weight: 1.0,
		divisive: false,
		traitAxis: 'love_language',
		traitPositive: true,
		fiveChoiceLabels: [
			{ id: 'quality_time', label: 'They show up', emoji: '⏳' },
			{ id: 'words', label: 'They tell me', emoji: '💬' },
			{ id: 'touch', label: 'They hold me', emoji: '🤗' },
			{ id: 'acts', label: 'They help me', emoji: '🛠️' },
			{ id: 'gifts', label: 'They surprise me', emoji: '🎁' }
		],
		tensionTemplate: 'You read care through different signals. One person\'s "I love you" doesn\'t translate.',
		alignmentTemplate: 'You recognise care the same way. Nothing gets lost in translation.'
	}
];

export const TOTAL_QUESTIONS = questions.length;

// ─── Trait display labels (human-friendly axis names) ───

export const TRAIT_LABELS: Record<string, { low: string; high: string; name: string }> = {
	openness: { low: 'Grounded', high: 'Curious', name: 'Openness' },
	conscientiousness: { low: 'Easygoing', high: 'Diligent', name: 'Conscientiousness' },
	extraversion: { low: 'Reserved', high: 'Outgoing', name: 'Extraversion' },
	agreeableness: { low: 'Assertive', high: 'Agreeable', name: 'Agreeableness' },
	neuroticism: { low: 'Resilient', high: 'Sensitive', name: 'Neuroticism' }
};

export const ATTACHMENT_STYLE_LABELS: Record<string, { name: string; description: string }> = {
	secure: { name: 'Secure', description: 'Comfortable with closeness and independence' },
	anxious: { name: 'Anxious', description: 'Craves closeness, fears abandonment' },
	avoidant: { name: 'Avoidant', description: 'Values independence, wary of closeness' },
	disorganized: { name: 'Disorganized', description: 'Wants closeness but fears getting hurt' }
};

export const LOVE_LANG_LABELS: Record<LoveLanguageId, { name: string; emoji: string; description: string }> = {
	quality_time: { name: 'Quality Time', emoji: '⏳', description: 'Undivided attention and shared experiences' },
	words: { name: 'Words of Affirmation', emoji: '💬', description: 'Appreciation, encouragement, and sincere compliments' },
	touch: { name: 'Physical Touch', emoji: '🤗', description: 'Hugs, hand-holding, and physical closeness' },
	acts: { name: 'Acts of Service', emoji: '🛠️', description: 'Easing burdens, helping out, following through' },
	gifts: { name: 'Gifts', emoji: '🎁', description: 'Thoughtful tokens that say "I was thinking of you"' }
};

// ─── Archetypes ───

export type ArchetypeId =
	| 'guardian'
	| 'maker'
	| 'visionary'
	| 'champion'
	| 'connector'
	| 'catalyst'
	| 'dreamer'
	| 'maverick'
	| 'advocate'
	| 'facilitator';

export interface Archetype {
	id: ArchetypeId;
	name: string;
	tagline: string;
	description: string;
	traitSignature: string;
	attachmentTendency: string;
	typicalLoveLanguage: string;
	strengths: string[];
	blindSpots: string[];
}

export const archetypes: Record<ArchetypeId, Archetype> = {
	guardian: {
		id: 'guardian',
		name: 'The Guardian',
		tagline: 'Steady and protective',
		description: 'Steady, dependable, and protective of what matters. You build calm through consistency and people feel safe around you.',
		traitSignature: 'High conscientiousness, low neuroticism',
		attachmentTendency: 'Tends toward secure attachment',
		typicalLoveLanguage: 'Acts of Service',
		strengths: [
			'Reliable under pressure — people trust you instinctively',
			'Creates stability that others build their lives around',
			'Follows through when others lose focus',
			'Emotionally grounded in crisis'
		],
		blindSpots: [
			'Can resist change even when it\'s overdue',
			'May mistake rigidity for strength',
			'Can struggle to express vulnerability'
		]
	},
	maker: {
		id: 'maker',
		name: 'The Maker',
		tagline: 'Gets it done',
		description: 'Disciplined executor who gets things done with precision and consistency. You turn ideas into reality through quiet, focused effort.',
		traitSignature: 'High conscientiousness, moderate openness',
		attachmentTendency: 'Tends toward secure attachment',
		typicalLoveLanguage: 'Acts of Service',
		strengths: [
			'Turns abstract ideas into concrete results',
			'Disciplined follow-through others admire',
			'Balances creativity with structure',
			'Reliable and self-motivated'
		],
		blindSpots: [
			'Can prioritise output over relationships',
			'May struggle to delegate or ask for help',
			'Perfectionism can slow things down'
		]
	},
	visionary: {
		id: 'visionary',
		name: 'The Visionary',
		tagline: 'Builds the future',
		description: 'Strategic leader who combines innovation with organization to build the future. You see patterns others miss and chart paths others follow.',
		traitSignature: 'High openness, moderate conscientiousness',
		attachmentTendency: 'Comfortable with emotional closeness',
		typicalLoveLanguage: 'Quality Time',
		strengths: [
			'Sees the big picture when others are lost in detail',
			'Combines creativity with strategic thinking',
			'Inspires others to think beyond the obvious',
			'Comfortable with ambiguity and complexity'
		],
		blindSpots: [
			'Can overlook people\'s feelings in pursuit of the vision',
			'May start more things than they finish',
			'Can come across as detached or overly theoretical'
		]
	},
	champion: {
		id: 'champion',
		name: 'The Champion',
		tagline: 'Pushes through to the goal',
		description: 'Rallies teams with drive and accountability. You bring energy to everything and push through when others give up.',
		traitSignature: 'High extraversion, high conscientiousness',
		attachmentTendency: 'Tends toward secure attachment',
		typicalLoveLanguage: 'Words of Affirmation',
		strengths: [
			'Infectious energy that lifts everyone up',
			'Gets things done and holds others accountable',
			'Thrives under pressure',
			'Natural leadership that people gravitate toward'
		],
		blindSpots: [
			'Can steamroll quieter voices',
			'May confuse activity with progress',
			'Can struggle with patience when others move slowly'
		]
	},
	connector: {
		id: 'connector',
		name: 'The Connector',
		tagline: 'Reads the room',
		description: 'People-centred and empathic. You build social connection by reading the room and bridging differences that others don\'t even notice.',
		traitSignature: 'High agreeableness, high extraversion',
		attachmentTendency: 'Comfortable with closeness',
		typicalLoveLanguage: 'Quality Time',
		strengths: [
			'Makes people feel seen and understood instantly',
			'Natural mediator who bridges differences',
			'Builds networks others benefit from for years',
			'Reads emotional undercurrents effortlessly'
		],
		blindSpots: [
			'Can over-extend to keep everyone happy',
			'May avoid necessary conflict to preserve harmony',
			'Can lose themselves in others\' needs'
		]
	},
	catalyst: {
		id: 'catalyst',
		name: 'The Catalyst',
		tagline: 'Sparks something new',
		description: 'Energetic explorer who sparks innovation and brings fresh perspectives. You see opportunity where others see routine.',
		traitSignature: 'High openness, high extraversion, low conscientiousness',
		attachmentTendency: 'Values both closeness and freedom',
		typicalLoveLanguage: 'Quality Time',
		strengths: [
			'Brings fresh energy to stale situations',
			'Comfortable with risk and experimentation',
			'Makes even routine feel exciting',
			'Connects seemingly unrelated ideas'
		],
		blindSpots: [
			'Can struggle with follow-through on long commitments',
			'May get bored once the novelty wears off',
			'Can leave others feeling like they can\'t keep up'
		]
	},
	dreamer: {
		id: 'dreamer',
		name: 'The Dreamer',
		tagline: 'Explores possibilities',
		description: 'Imaginative and introspective. You explore ideas and possibilities through deep, quiet contemplation that others often underestimate.',
		traitSignature: 'High openness, low extraversion',
		attachmentTendency: 'Tends toward moderate anxiety',
		typicalLoveLanguage: 'Words of Affirmation',
		strengths: [
			'Rich inner world that produces surprising insights',
			'Deeply reflective and thoughtful in relationships',
			'Comfortable with ambiguity and complexity',
			'Brings depth to conversations others skim past'
		],
		blindSpots: [
			'Can retreat inward when action is needed',
			'May overthink to the point of paralysis',
			'Can struggle to communicate their inner world'
		]
	},
	maverick: {
		id: 'maverick',
		name: 'The Maverick',
		tagline: 'Carves their own path',
		description: 'Self-reliant and direct. You value autonomy, clear ownership, and space to execute independently on your own terms.',
		traitSignature: 'Low agreeableness, high openness',
		attachmentTendency: 'Tends toward avoidant attachment',
		typicalLoveLanguage: 'Acts of Service',
		strengths: [
			'Strong sense of self that doesn\'t bend to pressure',
			'Decisive and direct — no guessing games',
			'Thrives with autonomy and clear ownership',
			'Brings uncomfortable truths others won\'t say'
		],
		blindSpots: [
			'Can come across as cold or dismissive',
			'May push people away when stressed',
			'Can mistake independence for invulnerability'
		]
	},
	advocate: {
		id: 'advocate',
		name: 'The Advocate',
		tagline: 'Champions others',
		description: 'Thoughtful and deeply caring. You champion others through attentive listening and genuine understanding that makes people feel truly known.',
		traitSignature: 'High agreeableness, low extraversion',
		attachmentTendency: 'Comfortable with emotional closeness',
		typicalLoveLanguage: 'Words of Affirmation',
		strengths: [
			'Makes people feel deeply understood',
			'Patient listener who catches what others miss',
			'Builds trust slowly but deeply',
			'Advocates for others before themselves'
		],
		blindSpots: [
			'Can absorb others\' emotions at their own expense',
			'May avoid confrontation even when it\'s necessary',
			'Can struggle to set boundaries'
		]
	},
	facilitator: {
		id: 'facilitator',
		name: 'The Facilitator',
		tagline: 'Keeps things running',
		description: 'Practical and organized. You enable others and keep operations running smoothly through thoughtful coordination that often goes unnoticed.',
		traitSignature: 'High conscientiousness, high agreeableness',
		attachmentTendency: 'Tends toward secure attachment',
		typicalLoveLanguage: 'Acts of Service',
		strengths: [
			'Makes complex situations feel manageable',
			'Anticipates needs before others even notice them',
			'Brings order without being controlling',
			'Reliable in ways that compound over time'
		],
		blindSpots: [
			'Can become invisible — their work goes unrecognised',
			'May over-function and enable others\' passivity',
			'Can struggle to say no or prioritise themselves'
		]
	}
};

// ─── Pair dynamics ───

export type PairKey = `${ArchetypeId}_${ArchetypeId}`;

function pairKey(a: ArchetypeId, b: ArchetypeId): PairKey {
	return [a, b].sort().join('_') as PairKey;
}

export const pairDynamics: Record<string, string> = {
	[pairKey('guardian', 'guardian')]: 'Double fortress. Unshakeable but might resist change together.',
	[pairKey('maker', 'maker')]: 'Two machines. Everything gets done. Nothing gets questioned.',
	[pairKey('visionary', 'visionary')]: 'Big picture squared. Brilliant strategy — if anyone actually executes.',
	[pairKey('champion', 'champion')]: 'Unstoppable force meets unstoppable force.',
	[pairKey('connector', 'connector')]: 'All heart, deep bond. But who pushes whom?',
	[pairKey('catalyst', 'catalyst')]: 'All gas, no brakes. Exciting but chaotic.',
	[pairKey('dreamer', 'dreamer')]: 'Beautiful ideas. Infinite potential. Someone still has to do the laundry.',
	[pairKey('maverick', 'maverick')]: 'Two lone wolves. Respect the space — or clash hard.',
	[pairKey('advocate', 'advocate')]: 'So much care between you. You\'d never feel unheard.',
	[pairKey('facilitator', 'facilitator')]: 'Everything runs smoothly. But who decides where you\'re headed?',
	[pairKey('guardian', 'maker')]: 'Steady meets precise. A dependable duo that doesn\'t cut corners.',
	[pairKey('guardian', 'visionary')]: 'One protects the ground, the other scans the horizon.',
	[pairKey('guardian', 'champion')]: 'The shield and the sword. Powerful if they trust each other.',
	[pairKey('guardian', 'connector')]: 'Safety meets warmth. People feel at ease around you both.',
	[pairKey('guardian', 'catalyst')]: 'One stabilises, the other disrupts. You\'d stretch each other.',
	[pairKey('guardian', 'dreamer')]: 'One builds the walls, the other dreams beyond them.',
	[pairKey('guardian', 'maverick')]: 'Two strong wills. Mutual respect or standoff.',
	[pairKey('guardian', 'advocate')]: 'Protection and care — a safe harbour together.',
	[pairKey('guardian', 'facilitator')]: 'Structure on structure. Rock solid, maybe too rigid.',
	[pairKey('maker', 'visionary')]: 'Vision meets execution. A natural partnership.',
	[pairKey('maker', 'champion')]: 'Precision and drive. A results machine.',
	[pairKey('maker', 'connector')]: 'One builds, the other brings people in. Complementary strengths.',
	[pairKey('maker', 'catalyst')]: 'One refines, the other reinvents. Productive tension.',
	[pairKey('maker', 'dreamer')]: 'The dreamer imagines. The maker builds. If they communicate.',
	[pairKey('maker', 'maverick')]: 'Both independent. Both capable. The question is coordination.',
	[pairKey('maker', 'advocate')]: 'Discipline meets empathy. You\'d balance each other well.',
	[pairKey('maker', 'facilitator')]: 'A well-oiled machine. Everything runs, everything ships.',
	[pairKey('visionary', 'champion')]: 'Strategy and execution. A leadership dream team.',
	[pairKey('visionary', 'connector')]: 'One sees the future, the other brings everyone along.',
	[pairKey('visionary', 'catalyst')]: 'Innovation overload. Brilliant — if someone steers.',
	[pairKey('visionary', 'dreamer')]: 'Two minds in the clouds. One plans, the other wanders.',
	[pairKey('visionary', 'maverick')]: 'Both want to lead. Powerful if aligned, volatile if not.',
	[pairKey('visionary', 'advocate')]: 'Big picture meets big heart. Meaningful work happens here.',
	[pairKey('visionary', 'facilitator')]: 'The architect and the builder. Clean handoffs.',
	[pairKey('champion', 'connector')]: 'Drive meets empathy. Charismatic together.',
	[pairKey('champion', 'catalyst')]: 'Energy and intensity. You\'d move mountains — or butt heads.',
	[pairKey('champion', 'dreamer')]: 'One charges forward, the other drifts. Find the middle.',
	[pairKey('champion', 'maverick')]: 'Both competitive, both independent. Electric.',
	[pairKey('champion', 'advocate')]: 'One pushes, the other protects. A powerful balance.',
	[pairKey('champion', 'facilitator')]: 'Ambition meets organisation. Things get done — and done right.',
	[pairKey('connector', 'catalyst')]: 'One bridges people, the other sparks ideas. Great energy.',
	[pairKey('connector', 'dreamer')]: 'Emotional depth meets imagination. You\'d understand each other.',
	[pairKey('connector', 'maverick')]: 'One craves closeness, the other needs space. Handle with care.',
	[pairKey('connector', 'advocate')]: 'All heart. A deeply nurturing pair.',
	[pairKey('connector', 'facilitator')]: 'People and process. Everyone feels looked after.',
	[pairKey('catalyst', 'dreamer')]: 'Two explorers. One acts, the other contemplates.',
	[pairKey('catalyst', 'maverick')]: 'Freedom-loving duo. Exciting but hard to pin down.',
	[pairKey('catalyst', 'advocate')]: 'One ignites change, the other makes sure no one gets left behind.',
	[pairKey('catalyst', 'facilitator')]: 'One disrupts, the other organises the fallout.',
	[pairKey('dreamer', 'maverick')]: 'Both march to their own beat. Independent spirits.',
	[pairKey('dreamer', 'advocate')]: 'Imagination meets compassion. A gentle, thoughtful bond.',
	[pairKey('dreamer', 'facilitator')]: 'One dreams it, the other builds the plan.',
	[pairKey('maverick', 'advocate')]: 'One guards their space, the other opens their heart. A learning curve.',
	[pairKey('maverick', 'facilitator')]: 'Independence meets coordination. Productive if boundaries are clear.',
	[pairKey('advocate', 'facilitator')]: 'Care meets competence. People trust you both.'
};

export function getPairDynamic(a: ArchetypeId, b: ArchetypeId): string {
	return pairDynamics[pairKey(a, b)] ?? 'An interesting combination — complementary in unexpected ways.';
}

// ─── Emoji options ───

export const EMOJI_OPTIONS = [
	'😎', '🤠', '🦊', '🐸', '🌸', '🔥', '💀', '🌊',
	'🍄', '🦋', '🌙', '⚡', '🎭', '🧊', '🌿', '🎪',
	'🦇', '🍑', '🌶️', '🐙', '💫', '🎯', '🪐', '🦈',
	'🍀', '🐝', '🌻', '🎲', '🦜', '🧿'
];

// ─── Score tiers ───

export const SCORE_TIERS = [
	{ min: 90, max: 100, label: 'Scarily in sync' },
	{ min: 75, max: 89, label: 'Easy momentum' },
	{ min: 60, max: 74, label: 'Solid potential' },
	{ min: 45, max: 59, label: 'Interesting differences' },
	{ min: 30, max: 44, label: 'Different wavelengths' },
	{ min: 0, max: 29, label: 'More differences than overlap — use as a playbook, not a verdict' }
];

export function getScoreTier(score: number): string {
	const tier = SCORE_TIERS.find((t) => score >= t.min && score <= t.max);
	return tier?.label ?? '';
}

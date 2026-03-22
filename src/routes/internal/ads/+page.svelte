<script lang="ts">
	import { browser } from '$app/environment';

	interface AdVariation {
		id: string;
		name: string;
		hookLines: string[];
		question: { number: number; text: string; left: string; right: string; thumbPos: number };
		youAnswer: { label: string; fill: number; pink?: boolean };
		themEmoji: string;
		themAnswer: { label: string; fill: number; pink?: boolean };
		answerHint: string;
		score: number;
		scoreColor: string;
		tier: string;
		tensionText: string;
		ctaLine: string;
		ctaSub: string;
	}

	interface AdAngle {
		id: string;
		name: string;
		emoji: string;
		description: string;
		variations: AdVariation[];
	}

	const angles: AdAngle[] = [
		{
			id: 'crush', name: 'The Crush', emoji: '💕',
			description: 'Romantic tension. Do they feel it too?',
			variations: [
				{
					id: 'crush-1', name: 'Do they feel it?',
					hookLines: ['You like them.', 'But do they get you?'],
					question: { number: 4, text: 'Would you rather be<br/><strong>respected</strong> or <strong>loved</strong>?', left: 'Respected', right: 'Loved', thumbPos: 35 },
					youAnswer: { label: 'Loved', fill: 85, pink: true },
					themEmoji: '💕',
					themAnswer: { label: 'Respected', fill: 70 },
					answerHint: 'You want different things.',
					score: 41, scoreColor: 'var(--color-score-mid)', tier: 'Different wavelengths',
					tensionText: '"One of you needs to be respected first. The other just wants to feel loved."',
					ctaLine: 'Find out before you<br/>say something stupid.',
					ctaSub: '15 questions. Send the link. Know where you stand.'
				},
				{
					id: 'crush-2', name: 'Friday night',
					hookLines: ["It's Friday.", 'Would they even text back?'],
					question: { number: 1, text: 'Friday night —<br/><strong>what are you doing?</strong>', left: 'Going out', right: 'Staying in', thumbPos: 25 },
					youAnswer: { label: 'Going out', fill: 80 },
					themEmoji: '💕',
					themAnswer: { label: 'Staying in', fill: 90, pink: true },
					answerHint: "They're home. You're not.",
					score: 38, scoreColor: 'var(--color-score-mid)', tier: 'Different wavelengths',
					tensionText: '"One of you is restless on a Friday night. The other is already in bed."',
					ctaLine: 'Stop guessing.<br/>Get the number.',
					ctaSub: '15 questions. 60 seconds. No sign-up.'
				},
				{
					id: 'crush-3', name: 'The ex question',
					hookLines: ['One question', 'changes everything.'],
					question: { number: 10, text: 'Can you stay close friends<br/>with someone you once<br/><strong>had feelings for?</strong>', left: 'Yes', right: 'No', thumbPos: 20 },
					youAnswer: { label: 'Yes', fill: 90 },
					themEmoji: '💕',
					themAnswer: { label: 'No', fill: 85, pink: true },
					answerHint: 'That changes things.',
					score: 34, scoreColor: 'var(--color-score-low)', tier: 'Different wavelengths',
					tensionText: "\"One of you is still texting an ex. The other thinks that's a red flag.\"",
					ctaLine: "Find out if you're on<br/>the same page.",
					ctaSub: 'Takes 60 seconds. The answer might surprise you.'
				}
			]
		},
		{
			id: 'bestfriend', name: 'The Best Friend', emoji: '🧑‍🤝‍🧑',
			description: 'You think you know them. Prove it.',
			variations: [
				{
					id: 'bf-1', name: 'You think you know them',
					hookLines: ['You think you', 'know them.'],
					question: { number: 4, text: 'Would you rather be<br/><strong>respected</strong> or <strong>loved</strong>?', left: 'Respected', right: 'Loved', thumbPos: 35 },
					youAnswer: { label: 'Respected', fill: 75 },
					themEmoji: '🧑‍🤝‍🧑',
					themAnswer: { label: 'Loved', fill: 85, pink: true },
					answerHint: 'Different answer.',
					score: 73, scoreColor: 'var(--color-score-high)', tier: "More alike than you'd think",
					tensionText: '"One of you needs to be respected first. The other just wants to feel loved."',
					ctaLine: 'Find out how you<br/>actually compare.',
					ctaSub: '15 questions. Send the link. Get your score.'
				},
				{
					id: 'bf-2', name: 'The phone question',
					hookLines: ['Send this to', 'your best friend.'],
					question: { number: 7, text: "Is it okay to look through<br/>a close friend's phone if<br/><strong>you're worried about them?</strong>", left: 'Yes', right: 'No', thumbPos: 25 },
					youAnswer: { label: 'Yes', fill: 90 },
					themEmoji: '🧑‍🤝‍🧑',
					themAnswer: { label: 'No', fill: 80, pink: true },
					answerHint: 'That one splits people.',
					score: 61, scoreColor: 'var(--color-score-high)', tier: "More alike than you'd think",
					tensionText: "\"One of you would go through a friend's phone and sleep fine. The other wouldn't.\"",
					ctaLine: 'Think you agree on<br/>everything?',
					ctaSub: "You probably don't. Find out in 60 seconds."
				},
				{
					id: 'bf-3', name: 'Silence test',
					hookLines: ['The real test', "isn't talking."],
					question: { number: 5, text: 'How comfortable are you<br/>with <strong>silence</strong> in a<br/>conversation?', left: 'Awkward', right: 'Peaceful', thumbPos: 70 },
					youAnswer: { label: 'Peaceful', fill: 85 },
					themEmoji: '🧑‍🤝‍🧑',
					themAnswer: { label: 'Awkward', fill: 75, pink: true },
					answerHint: 'You feel it differently.',
					score: 58, scoreColor: 'var(--color-score-mid)', tier: "You'd have interesting arguments",
					tensionText: '"You experience silence completely differently. One relaxes, the other panics."',
					ctaLine: 'How well do you<br/>really know them?',
					ctaSub: '15 questions. The answer might sting.'
				},
				{
					id: 'bf-4', name: 'Honesty test',
					hookLines: ['"Do I look good?"', 'What do you say?'],
					question: { number: 8, text: "If a friend asks<br/>'Do I look good?',<br/><strong>how honest are you?</strong>", left: 'White lie', right: 'Brutal honesty', thumbPos: 75 },
					youAnswer: { label: 'Brutal honesty', fill: 80 },
					themEmoji: '🧑‍🤝‍🧑',
					themAnswer: { label: 'White lie', fill: 70, pink: true },
					answerHint: 'One of you lies to be kind.',
					score: 52, scoreColor: 'var(--color-score-mid)', tier: "You'd have interesting arguments",
					tensionText: "\"One of you lies to be kind. The other thinks that's worse than the truth.\"",
					ctaLine: 'Find out what your<br/>friend really thinks.',
					ctaSub: 'Send them the link. Get your score.'
				}
			]
		},
		{
			id: 'sibling', name: 'The Sibling', emoji: '👨‍👩‍👧',
			description: 'Same house. Different people. Or not?',
			variations: [
				{
					id: 'sib-1', name: 'Same parents, same person?',
					hookLines: ['Same parents.', 'Same person?'],
					question: { number: 3, text: 'In an argument, are you<br/>more <strong>logical</strong> or<br/><strong>emotional</strong>?', left: 'Head', right: 'Heart', thumbPos: 30 },
					youAnswer: { label: 'Head', fill: 80 },
					themEmoji: '👨‍👩‍👧',
					themAnswer: { label: 'Heart', fill: 90, pink: true },
					answerHint: 'Classic.',
					score: 88, scoreColor: 'var(--color-score-high)', tier: 'You just get each other',
					tensionText: '"You argue in completely different languages. That gets exhausting fast."',
					ctaLine: 'Same family.<br/>Same wavelength?',
					ctaSub: 'Find out in 60 seconds. Send them the link.'
				},
				{
					id: 'sib-2', name: 'The argument one',
					hookLines: ['You already know', 'how this ends.'],
					question: { number: 6, text: 'How do you feel about<br/><strong>spontaneity</strong>?', left: 'Plan everything', right: 'Wing it', thumbPos: 20 },
					youAnswer: { label: 'Plan everything', fill: 85 },
					themEmoji: '👨‍👩‍👧',
					themAnswer: { label: 'Wing it', fill: 90, pink: true },
					answerHint: 'Every. Single. Trip.',
					score: 71, scoreColor: 'var(--color-score-high)', tier: "More alike than you'd think",
					tensionText: '"One of you has a plan. The other just ripped it up."',
					ctaLine: 'Send this to<br/>your sibling.',
					ctaSub: "You'll both have opinions. That's the point."
				},
				{
					id: 'sib-3', name: 'Fix it vs feel it',
					hookLines: ["They're upset.", 'What do you do?'],
					question: { number: 2, text: 'When someone you care<br/>about is upset, what<br/><strong>do you do?</strong>', left: 'Try to fix it', right: 'Just be there', thumbPos: 25 },
					youAnswer: { label: 'Fix it', fill: 80 },
					themEmoji: '👨‍👩‍👧',
					themAnswer: { label: 'Just be there', fill: 85, pink: true },
					answerHint: 'You show up differently.',
					score: 76, scoreColor: 'var(--color-score-high)', tier: 'You just get each other',
					tensionText: "\"One of you wants solutions. The other just wants to be heard. That's a classic collision.\"",
					ctaLine: 'Same house.<br/>Different wiring.',
					ctaSub: '15 questions. Settle it once and for all.'
				}
			]
		},
		{
			id: 'coworker', name: 'The Co-worker', emoji: '💼',
			description: 'You spend 40 hours a week together. How aligned are you?',
			variations: [
				{
					id: 'cw-1', name: 'Slack vs real life',
					hookLines: ['You Slack them', 'every day.', 'Do you know them?'],
					question: { number: 9, text: 'In a group, are you more<br/>of a <strong>listener</strong> or<br/>a <strong>talker</strong>?', left: 'Listener', right: 'Talker', thumbPos: 30 },
					youAnswer: { label: 'Listener', fill: 75 },
					themEmoji: '💼',
					themAnswer: { label: 'Talker', fill: 80, pink: true },
					answerHint: 'One talks, one listens.',
					score: 29, scoreColor: 'var(--color-score-low)', tier: 'Opposites — for better or worse',
					tensionText: "\"You're both talkers. Who's listening?\"",
					ctaLine: 'Send this to<br/>your work wife.',
					ctaSub: 'Takes 60 seconds. No sign-up required.'
				},
				{
					id: 'cw-2', name: 'The meeting question',
					hookLines: ['Same meeting.', 'Different experience.'],
					question: { number: 3, text: 'In an argument, are you<br/>more <strong>logical</strong> or<br/><strong>emotional</strong>?', left: 'Head', right: 'Heart', thumbPos: 20 },
					youAnswer: { label: 'Head', fill: 90 },
					themEmoji: '💼',
					themAnswer: { label: 'Heart', fill: 70, pink: true },
					answerHint: 'You solve problems differently.',
					score: 44, scoreColor: 'var(--color-score-mid)', tier: 'Different wavelengths',
					tensionText: '"You argue in completely different languages. That gets exhausting fast."',
					ctaLine: 'Find out why<br/>meetings feel weird.',
					ctaSub: '15 questions. Finally understand your co-worker.'
				},
				{
					id: 'cw-3', name: 'The planner vs improviser',
					hookLines: ['One of you plans.', 'The other wings it.'],
					question: { number: 6, text: 'How do you feel about<br/><strong>spontaneity</strong>?', left: 'Plan everything', right: 'Wing it', thumbPos: 15 },
					youAnswer: { label: 'Plan everything', fill: 90 },
					themEmoji: '💼',
					themAnswer: { label: 'Wing it', fill: 85, pink: true },
					answerHint: 'That explains a lot.',
					score: 35, scoreColor: 'var(--color-score-mid)', tier: 'Different wavelengths',
					tensionText: '"One of you has a plan. The other just ripped it up."',
					ctaLine: 'Same team.<br/>Same brain?',
					ctaSub: 'Probably not. Find out in 60 seconds.'
				}
			]
		}
	];

	type Phase = 'hook' | 'question' | 'slide-left' | 'slide-right' | 'score-blur' | 'score-reveal' | 'tension' | 'cta';
	const PHASE_ORDER: Phase[] = ['hook', 'question', 'slide-left', 'slide-right', 'score-blur', 'score-reveal', 'tension', 'cta'];
	const DURATIONS: Record<Phase, number> = {
		'hook': 2200, 'question': 2400, 'slide-left': 1200, 'slide-right': 1200,
		'score-blur': 1600, 'score-reveal': 2000, 'tension': 2600, 'cta': 4000
	};

	let activeAngle = $state(0);
	let activeVar = $state(0);
	let phase = $state<Phase>('hook');
	let playing = $state(true);
	let scoreCount = $state(0);
	let scoreRevealed = $state(false);
	let ad = $state(angles[0].variations[0]);

	let _phaseIdx = 0;
	let _gen = 0;
	let _score = 0;
	let _booted = false;

	function boot() {
		if (_booted) return;
		_booted = true;
		run();
	}

	function run() {
		_gen++;
		const gen = _gen;
		ad = angles[activeAngle].variations[activeVar];
		_score = ad.score;
		_phaseIdx = 0;
		phase = 'hook';
		playing = true;
		scoreCount = 0;
		scoreRevealed = false;
		step(gen);
	}

	function step(gen: number) {
		const dur = DURATIONS[PHASE_ORDER[_phaseIdx]];
		setTimeout(() => {
			if (gen !== _gen) return;
			_phaseIdx++;
			if (_phaseIdx >= PHASE_ORDER.length) { playing = false; return; }
			phase = PHASE_ORDER[_phaseIdx];
			if (phase === 'score-reveal') {
				scoreRevealed = true;
				animScore(_score, gen);
			}
			step(gen);
		}, dur);
	}

	function animScore(target: number, gen: number) {
		const t0 = performance.now();
		(function tick(now: number) {
			if (gen !== _gen) return;
			const p = Math.min((now - t0) / 900, 1);
			scoreCount = Math.round((1 - Math.pow(1 - p, 3)) * target);
			if (p < 1) requestAnimationFrame(tick);
		})(t0);
	}

	function pGte(t: Phase) { return PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(t); }

	function pickAngle(i: number) { activeAngle = i; activeVar = 0; run(); }
	function pickVar(i: number) { activeVar = i; run(); }

	$effect(() => { if (browser) boot(); });
</script>

<svelte:head>
	<title>Ad Mockups — Haystack</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="pg">
	<nav class="tabs">
		{#each angles as a, i}
			<button class="tab" class:on={activeAngle === i} onclick={() => pickAngle(i)}>
				<span class="tab-e">{a.emoji}</span>
				<span class="tab-n">{a.name}</span>
			</button>
		{/each}
	</nav>
	<p class="desc">{angles[activeAngle].description}</p>
	<div class="pills">
		{#each angles[activeAngle].variations as v, i}
			<button class="pill" class:on={activeVar === i} onclick={() => pickVar(i)}>{v.name}</button>
		{/each}
	</div>

	<div class="frame">
		<div class="screen">

			<div class="sc" class:on={phase === 'hook'}>
				<div class="hook">
					{#each ad.hookLines as line, i}
						<span class="hk" style="animation-delay:{200 + i * 400}ms">{line}</span>
					{/each}
				</div>
			</div>

			<div class="sc" class:on={phase === 'question'}>
				<div class="qcard">
					<p class="ql">Question {ad.question.number} of 10</p>
					<p class="qt">{@html ad.question.text}</p>
					<div class="qsp">
						<span class="qp">{ad.question.left}</span>
						<div class="qbar"><div class="qth" style="left:{ad.question.thumbPos}%"></div></div>
						<span class="qp">{ad.question.right}</span>
					</div>
				</div>
			</div>

			<div class="sc" class:on={phase === 'slide-left' || phase === 'slide-right'}>
				<div class="ans">
					<div class="arow" class:vis={pGte('slide-left')}>
						<div class="av">🫵</div>
						<div class="apill">
							<span class="alab">{ad.youAnswer.label}</span>
							<div class="abar"><div class="afill" class:pk={ad.youAnswer.pink} style="width:{ad.youAnswer.fill}%"></div></div>
						</div>
					</div>
					<div class="arow r2" class:vis={pGte('slide-right')}>
						<div class="av">{ad.themEmoji}</div>
						<div class="apill">
							<span class="alab">{ad.themAnswer.label}</span>
							<div class="abar"><div class="afill" class:pk={ad.themAnswer.pink} style="width:{ad.themAnswer.fill}%"></div></div>
						</div>
					</div>
					<p class="ahint" class:vis={pGte('slide-right')}>{ad.answerHint}</p>
				</div>
			</div>

			<div class="sc" class:on={phase === 'score-blur' || phase === 'score-reveal'}>
				<div class="ssc">
					<div class="savs"><div class="av a1">🫵</div><div class="av a2">{ad.themEmoji}</div></div>
					{#if scoreRevealed}
						<span class="sn" style="color:{ad.scoreColor}">{scoreCount}%</span>
					{:else}
						<span class="sn blur">??%</span>
					{/if}
					<p class="st" class:vis={scoreRevealed}>{ad.tier}</p>
				</div>
			</div>

			<div class="sc" class:on={phase === 'tension'}>
				<div class="tsc">
					<div class="tbad">Biggest tension</div>
					<p class="ttx">{ad.tensionText}</p>
				</div>
			</div>

			<div class="sc" class:on={phase === 'cta'}>
				<div class="csc">
					<p class="clogo">Haystack</p>
					<p class="ctag">{@html ad.ctaLine}</p>
					<div class="cbtn">Try it — takes 60 seconds</div>
					<p class="csub">{ad.ctaSub}</p>
				</div>
			</div>

		</div>
	</div>

	<div class="ctrl">
		{#if !playing}<button class="rep" onclick={() => run()}>Replay</button>{/if}
		<span class="ph">{phase}</span>
	</div>
</div>

<style>
	.pg { min-height:100dvh; background:#0e0e0e; display:flex; flex-direction:column; align-items:center; padding:20px 16px 48px; gap:14px; }

	.tabs { display:flex; gap:4px; background:rgba(255,255,255,.04); border-radius:14px; padding:4px; width:100%; max-width:480px; }
	.tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:10px 4px; border-radius:10px; border:none; background:transparent; cursor:pointer; transition:background .2s; font-family:inherit; }
	.tab.on { background:rgba(255,255,255,.1); }
	.tab-e { font-size:1.25rem; line-height:1; }
	.tab-n { font-size:.625rem; font-weight:600; color:rgba(255,255,255,.45); white-space:nowrap; }
	.tab.on .tab-n { color:rgba(255,255,255,.9); }

	.desc { font-size:.75rem; color:rgba(255,255,255,.3); margin:0; text-align:center; }

	.pills { display:flex; gap:6px; overflow-x:auto; max-width:480px; width:100%; padding:0 4px 2px; scrollbar-width:none; justify-content:center; }
	.pills::-webkit-scrollbar { display:none; }
	.pill { flex-shrink:0; padding:7px 14px; border-radius:100px; border:1px solid rgba(255,255,255,.12); background:transparent; color:rgba(255,255,255,.45); font-size:.6875rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all .18s; white-space:nowrap; }
	.pill.on { background:rgba(255,255,255,.12); color:rgba(255,255,255,.95); border-color:rgba(255,255,255,.25); }

	.frame { width:280px; height:540px; border-radius:36px; background:#1a1a1a; padding:10px; box-shadow:0 0 0 1.5px rgba(255,255,255,.06),0 24px 48px rgba(0,0,0,.5); flex-shrink:0; }
	.screen { width:100%; height:100%; border-radius:27px; background:var(--color-cream); position:relative; overflow:hidden; }

	.sc { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px; opacity:0; transition:opacity .3s; pointer-events:none; text-align:center; }
	.sc.on { opacity:1; pointer-events:auto; }

	/* Hook */
	.hook { display:flex; flex-direction:column; align-items:center; gap:4px; text-align:center; }
	.hk { font-size:1.5rem; font-weight:800; color:var(--color-primary); letter-spacing:-.02em; opacity:0; transform:translateY(10px); text-align:center; }
	.sc.on .hk { animation:fu .45s var(--ease-entrance) forwards; }

	/* Question */
	.qcard { width:100%; background:var(--color-surface); border-radius:18px; padding:20px 16px; border:1.5px solid var(--color-border); text-align:center; opacity:0; transform:scale(.96); }
	.sc.on .qcard { animation:ci .35s var(--ease-entrance) .15s forwards; }
	.ql { font-size:.5625rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-secondary); margin:0 0 10px; text-align:center; }
	.qt { font-size:.9375rem; font-weight:600; color:var(--color-primary); margin:0 0 16px; line-height:1.4; text-align:center; }
	.qsp { display:flex; align-items:center; gap:8px; }
	.qp { font-size:.625rem; font-weight:600; color:var(--color-secondary); white-space:nowrap; }
	.qbar { flex:1; height:5px; background:var(--color-border); border-radius:3px; position:relative; }
	.qth { width:20px; height:20px; border-radius:50%; background:var(--color-primary); border:2.5px solid white; box-shadow:0 2px 5px rgba(0,0,0,.15); position:absolute; top:50%; transform:translate(-50%,-50%); }
	.sc.on .qth { animation:tw 1s ease-in-out .3s forwards; }

	/* Answers */
	.ans { width:100%; display:flex; flex-direction:column; gap:14px; align-items:center; }
	.arow { display:flex; align-items:center; gap:10px; width:100%; opacity:0; transform:translateX(-16px); transition:opacity .35s var(--ease-entrance),transform .35s var(--ease-entrance); }
	.arow.r2 { transform:translateX(16px); }
	.arow.vis { opacity:1; transform:translateX(0); }
	.av { width:40px; height:40px; border-radius:50%; background:var(--color-surface); border:1.5px solid var(--color-border); display:flex; align-items:center; justify-content:center; font-size:1.125rem; flex-shrink:0; }
	.apill { flex:1; background:var(--color-surface); border-radius:12px; padding:10px 12px; border:1.5px solid var(--color-border); text-align:left; }
	.alab { font-size:.6875rem; font-weight:700; color:var(--color-primary); margin-bottom:5px; display:block; }
	.abar { height:4px; border-radius:2px; background:var(--color-border); overflow:hidden; }
	.afill { height:100%; border-radius:2px; background:var(--color-highlight); transition:width .5s var(--ease-entrance); }
	.afill.pk { background:var(--color-tertiary); }
	.ahint { font-size:.75rem; font-weight:600; color:var(--color-score-mid); margin:2px 0 0; opacity:0; transition:opacity .35s; text-align:center; }
	.ahint.vis { opacity:1; }

	/* Score */
	.ssc { display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center; }
	.savs { display:flex; align-items:center; }
	.a1 { position:relative; z-index:2; border-color:var(--color-highlight); }
	.a2 { margin-left:-10px; position:relative; z-index:1; }
	.sn { font-size:3.5rem; font-weight:800; letter-spacing:-.04em; line-height:1; font-variant-numeric:tabular-nums; transition:filter .5s,opacity .35s; margin:6px 0 2px; text-align:center; }
	.sn.blur { filter:blur(10px); color:var(--color-secondary); opacity:.5; }
	.st { font-size:.8125rem; font-weight:600; color:var(--color-secondary); margin:0; opacity:0; transform:translateY(5px); transition:opacity .35s,transform .35s var(--ease-entrance); text-align:center; }
	.st.vis { opacity:1; transform:translateY(0); }

	/* Tension */
	.tsc { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; opacity:0; }
	.sc.on .tsc { animation:fu .4s var(--ease-entrance) .1s forwards; }
	.tbad { font-size:.5625rem; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:var(--color-score-low); background:rgba(224,90,90,.08); padding:5px 12px; border-radius:100px; }
	.ttx { font-size:.9375rem; font-weight:500; font-style:italic; color:var(--color-primary); line-height:1.5; margin:0; text-align:center; }

	/* CTA */
	.csc { display:flex; flex-direction:column; align-items:center; gap:14px; text-align:center; }
	.clogo { font-size:1.125rem; font-weight:800; letter-spacing:-.02em; color:var(--color-primary); margin:0; opacity:0; text-align:center; }
	.sc.on .clogo { animation:fu .4s var(--ease-entrance) .08s forwards; }
	.ctag { font-size:1.125rem; font-weight:600; color:var(--color-primary); margin:0; line-height:1.4; opacity:0; text-align:center; }
	.sc.on .ctag { animation:fu .4s var(--ease-entrance) .25s forwards; }
	.cbtn { background:var(--color-accent); color:white; padding:12px 28px; border-radius:100px; font-size:.9375rem; font-weight:700; opacity:0; text-align:center; }
	.sc.on .cbtn { animation:fu .4s var(--ease-entrance) .5s forwards; }
	.csub { font-size:.6875rem; color:var(--color-secondary); margin:0; opacity:0; text-align:center; }
	.sc.on .csub { animation:fu .4s var(--ease-entrance) .75s forwards; }

	.ctrl { display:flex; flex-direction:column; align-items:center; gap:8px; }
	.rep { background:rgba(255,255,255,.08); color:rgba(255,255,255,.6); border:1px solid rgba(255,255,255,.12); padding:8px 24px; border-radius:100px; font-size:.8125rem; font-weight:600; cursor:pointer; font-family:inherit; transition:background .18s; }
	.rep:hover { background:rgba(255,255,255,.15); }
	.ph { font-size:.625rem; color:rgba(255,255,255,.15); font-family:monospace; }

	@keyframes fu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
	@keyframes ci { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
	@keyframes tw { 0%{transform:translate(-50%,-50%) scale(1)} 30%{transform:translate(-50%,-50%) scale(1.15)} 60%{transform:translate(-50%,-50%) scale(.95)} 100%{transform:translate(-50%,-50%) scale(1)} }
</style>

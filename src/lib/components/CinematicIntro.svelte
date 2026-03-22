<script lang="ts">
	import { browser } from '$app/environment';

	let { onComplete }: { onComplete: () => void } = $props();

	let canvas: HTMLCanvasElement;
	let phase = $state(0);
	let textOpacity = $state(0);
	let showSkip = $state(false);
	let transitioning = $state(false);

	const narrative = [
		{ text: '8.1 billion people on Earth.', duration: 3000 },
		{ text: 'The average person will meet\naround 80,000 in a lifetime.', duration: 3500 },
		{ text: "Most of them won't really\nknow you.", duration: 3000 },
		{ text: "Research says compatibility\nisn't magic — it's patterns.", duration: 3500 },
		{ text: "How you connect, love, and\nrecover from conflict.", duration: 3500 },
		{ text: "Let's find yours.", duration: 2500 },
	];

	// Skin-tone palette for placeholder circles
	const skinTones = [
		'#FFDBB4', '#EDB98A', '#D08B5B', '#AE5D29', '#614335',
		'#F1C27D', '#C68642', '#8D5524', '#FFDBAC', '#E0AC69',
	];

	function skip() {
		if (transitioning) return;
		transitioning = true;
		onComplete();
	}

	function startNarrative() {
		let currentPhase = 0;

		function advancePhase() {
			if (currentPhase >= narrative.length) {
				transitioning = true;
				textOpacity = 0;
				setTimeout(() => onComplete(), 600);
				return;
			}
			phase = currentPhase;
			textOpacity = 0;
			requestAnimationFrame(() => {
				setTimeout(() => { textOpacity = 1; }, 50);
			});
			const dur = narrative[currentPhase].duration;
			setTimeout(() => { textOpacity = 0; }, dur - 600);
			setTimeout(() => { currentPhase++; advancePhase(); }, dur);
		}

		setTimeout(() => advancePhase(), 800);
	}

	// Generate a placeholder face texture using Canvas 2D
	function makeFaceCanvas(tone: string): HTMLCanvasElement {
		const s = 64;
		const c = document.createElement('canvas');
		c.width = s;
		c.height = s;
		const ctx = c.getContext('2d')!;

		// Circle background (skin tone)
		ctx.beginPath();
		ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
		ctx.fillStyle = tone;
		ctx.fill();

		// Simple eyes
		ctx.fillStyle = '#333';
		ctx.beginPath();
		ctx.arc(s * 0.36, s * 0.4, 2.5, 0, Math.PI * 2);
		ctx.arc(s * 0.64, s * 0.4, 2.5, 0, Math.PI * 2);
		ctx.fill();

		// Smile
		ctx.strokeStyle = '#555';
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.arc(s / 2, s * 0.48, 8, 0.15 * Math.PI, 0.85 * Math.PI);
		ctx.stroke();

		return c;
	}

	let inited = false;

	$effect(() => {
		if (!browser || inited) return;
		inited = true;

		setTimeout(() => (showSkip = true), 2000);
		startNarrative();

		// Lazy-load Three.js only on this route
		import('three').then((THREE) => {
			if (!canvas) return;
			initScene(THREE);
		}).catch((err) => {
			console.error('[Intro] Three.js load error:', err);
		});
	});

	function initScene(THREE: typeof import('three')) {
		const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x0e0e10, 1);

		const scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x0e0e10, 0.0055);

		const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 800);
		camera.position.set(0, 0, 120);

		const spread = 300;
		const depth = 500;
		const faceCount = 180;
		const circleGeo = new THREE.CircleGeometry(1, 32);

		// Pre-generate a set of placeholder textures
		const placeholderTextures: InstanceType<typeof THREE.CanvasTexture>[] = [];
		for (const tone of skinTones) {
			const cv = makeFaceCanvas(tone);
			const tex = new THREE.CanvasTexture(cv);
			tex.colorSpace = THREE.SRGBColorSpace;
			placeholderTextures.push(tex);
		}

		type FaceData = {
			mesh: InstanceType<typeof THREE.Mesh>;
			baseY: number;
			speed: number;
			wobbleOffset: number;
		};
		const faces: FaceData[] = [];

		for (let i = 0; i < faceCount; i++) {
			const size = 3 + Math.random() * 6;
			const x = (Math.random() - 0.5) * spread;
			const y = (Math.random() - 0.5) * spread;
			const z = (Math.random() - 0.5) * depth;

			const tex = placeholderTextures[i % placeholderTextures.length];
			const mat = new THREE.MeshBasicMaterial({
				map: tex,
				transparent: true,
				opacity: 0.6 + Math.random() * 0.3,
				depthWrite: false,
				side: THREE.DoubleSide,
			});

			const mesh = new THREE.Mesh(circleGeo, mat);
			mesh.position.set(x, y, z);
			mesh.scale.setScalar(size);
			scene.add(mesh);

			faces.push({
				mesh,
				baseY: y,
				speed: 0.3 + Math.random() * 0.6,
				wobbleOffset: Math.random() * Math.PI * 2,
			});

			// Try loading a real face photo over the placeholder
			const gender = i % 2 === 0 ? 'men' : 'women';
			const idx = Math.floor(Math.random() * 99);
			const url = `https://randomuser.me/api/portraits/thumb/${gender}/${idx}.jpg`;
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				const realTex = new THREE.Texture(img);
				realTex.colorSpace = THREE.SRGBColorSpace;
				realTex.needsUpdate = true;
				(mat as InstanceType<typeof THREE.MeshBasicMaterial>).map = realTex;
				mat.needsUpdate = true;
			};
			img.src = url;
		}

		// Ambient dust
		const dustCount = 400;
		const dustPos = new Float32Array(dustCount * 3);
		for (let i = 0; i < dustCount; i++) {
			dustPos[i * 3] = (Math.random() - 0.5) * spread * 1.2;
			dustPos[i * 3 + 1] = (Math.random() - 0.5) * spread * 1.2;
			dustPos[i * 3 + 2] = (Math.random() - 0.5) * depth;
		}
		const dustGeo = new THREE.BufferGeometry();
		dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
		const dustMat = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 1.5,
			transparent: true,
			opacity: 0.25,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			sizeAttenuation: true,
		});
		scene.add(new THREE.Points(dustGeo, dustMat));

		const startTime = performance.now();
		let alive = true;

		function animate() {
			if (!alive) return;
			requestAnimationFrame(animate);

			const elapsed = (performance.now() - startTime) / 1000;

			camera.position.z = 120 - elapsed * 3.5;
			camera.position.x = Math.sin(elapsed * 0.12) * 15;
			camera.position.y = Math.cos(elapsed * 0.08) * 10;
			camera.lookAt(
				Math.sin(elapsed * 0.06) * 5,
				Math.cos(elapsed * 0.04) * 3,
				camera.position.z - 80
			);

			for (const f of faces) {
				f.mesh.lookAt(camera.position);
				f.mesh.position.y = f.baseY + Math.sin(elapsed * f.speed + f.wobbleOffset) * 2;
			}

			renderer.render(scene, camera);
		}

		animate();

		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onResize);

		return () => {
			alive = false;
			window.removeEventListener('resize', onResize);
			renderer.dispose();
		};
	}
</script>

<div
	style="
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: #0e0e10;
		opacity: {transitioning ? 0 : 1};
		transition: opacity 600ms ease;
	"
>
	<canvas bind:this={canvas} style="position: absolute; inset: 0; width: 100%; height: 100%;"></canvas>

	<!-- Narrative text -->
	<div style="
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		padding: 24px;
	">
		<p style="
			font-family: var(--font-display);
			font-size: clamp(1.5rem, 5vw, 2.5rem);
			color: rgba(255, 255, 255, 0.92);
			text-align: center;
			line-height: 1.4;
			letter-spacing: -0.02em;
			max-width: 480px;
			margin: 0;
			opacity: {textOpacity};
			transform: translateY({textOpacity > 0 ? '0' : '12px'});
			transition: opacity 500ms ease, transform 500ms var(--ease-entrance);
			white-space: pre-line;
			text-shadow: 0 2px 30px rgba(0,0,0,0.8);
		">
			{narrative[phase]?.text ?? ''}
		</p>
	</div>

	{#if showSkip}
		<button
			onclick={skip}
			style="
				position: absolute;
				bottom: 40px;
				left: 50%;
				transform: translateX(-50%);
				background: none;
				border: 1px solid rgba(255, 255, 255, 0.2);
				border-radius: 100px;
				padding: 10px 28px;
				color: rgba(255, 255, 255, 0.5);
				font-size: 0.8125rem;
				font-weight: 500;
				cursor: pointer;
				font-family: inherit;
				transition: color 200ms ease, border-color 200ms ease;
				z-index: 10;
			"
		>
			Skip intro
		</button>
	{/if}

	<div style="
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(ellipse at center, transparent 30%, rgba(14, 14, 16, 0.7) 100%);
	"></div>
</div>

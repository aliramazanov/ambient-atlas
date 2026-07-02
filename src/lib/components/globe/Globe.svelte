<script lang="ts">
	import { ui } from '$lib/state/state.svelte';
	import { Canvas } from '@threlte/core';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { WebGPURenderer } from 'three/webgpu';
	import Scene from './Scene.svelte';

	let { active = true }: { active?: boolean } = $props();

	let backend = $state<'pending' | 'webgpu' | 'webgl'>('pending');
	let ready = $state(false);
	let pageVisible = $state(true);

	const renderMode = $derived(
		ready && active && !ui.selected && pageVisible ? 'always' : 'manual'
	);

	onMount(() => {
		const onVis = () => (pageVisible = document.visibilityState === 'visible');
		document.addEventListener('visibilitychange', onVis);
		return () => document.removeEventListener('visibilitychange', onVis);
	});
</script>

<div class="globe-root">
	<Canvas
		{renderMode}
		createRenderer={(canvas) => {
			const renderer = new WebGPURenderer({ canvas, antialias: true, forceWebGL: false });

			renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 880 ? 1.5 : 2));
			renderer
				.init()
				.then(() => {
					ready = true;
					// @ts-expect-error backend flag is present after init
					backend = renderer.backend?.isWebGPUBackend ? 'webgpu' : 'webgl';
				})
				.catch((err) => console.error('renderer init failed', err));
			return renderer;
		}}
	>
		<Scene />
	</Canvas>

	{#if backend === 'pending'}
		<div class="splash" out:fade={{ duration: 500 }}>
			<div class="brand"><span class="brand-dot"></span> Ambient Atlas</div>
			<div class="spinner big"></div>
			<div class="sub">preparing the globe</div>
		</div>
	{/if}
</div>

<style>
	.globe-root {
		position: absolute;
		inset: 0;
	}
	.splash {
		position: absolute;
		inset: 0;
		z-index: 5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background: radial-gradient(120% 120% at 50% 40%, #0c1830 0%, #05070e 75%);
	}
	.brand {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 20px;
		letter-spacing: -0.01em;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.brand-dot {
		width: 9px;
		height: 9px;
		border-radius: 2px;
		background: linear-gradient(135deg, #e6c785, #c79a52);
		animation: brand-pulse 2.4s ease-in-out infinite;
	}
	@keyframes brand-pulse {
		0%,
		100% {
			opacity: 0.45;
		}
		50% {
			opacity: 1;
		}
	}
	.spinner.big {
		width: 18px;
		height: 18px;
	}
	.sub {
		font-size: 12px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
</style>

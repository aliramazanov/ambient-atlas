import { onMount } from 'svelte';

export function useIsMobile(query = '(max-width: 1023px)') {
	let matches = $state(typeof window !== 'undefined' && window.matchMedia(query).matches);
	onMount(() => {
		const mql = window.matchMedia(query);
		const on = (e: MediaQueryListEvent) => (matches = e.matches);
		mql.addEventListener('change', on);
		return () => mql.removeEventListener('change', on);
	});
	return {
		get current() {
			return matches;
		}
	};
}

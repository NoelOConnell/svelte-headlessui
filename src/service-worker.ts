import { build, files, version } from "$service-worker";

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	"/docs",
	...build, // the app itself
	...files // everything in `static`
];

self.addEventListener("install", (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
		self.skipWaiting();
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener("activate", (event) => {
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener("fetch", (event) => {
	// disable caching on non production environment
	if (!import.meta.env.PROD) return;

	// ignore POST requests etc
	if (event.request.method !== "GET") return;

	const url = new URL(event.request.url);
	// don't handle other urls accept http/https
	if (!url.protocol.startsWith("http")) return;

	// don't cache trpc api routes, as they are cached by svelte-query
	if (url.pathname.startsWith("/api/trpc")) return;

	async function respond() {
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			return cache.match(event.request);
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch {
			const cached = await cache.match(event.request);
			if (cached) return cached;

			return await cache.match("/docs");
		}
	}

	event.respondWith(respond());
});
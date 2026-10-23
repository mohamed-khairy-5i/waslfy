/*
 * Waslfy service worker — offline-first for a local-first app.
 * The whole product runs on the device (IndexedDB via Dexie), so the
 * service worker only has one job: make the shell + assets available
 * with no network at all.
 *
 * Path-safe: derives everything from the registration scope, so the
 * same file works at "/" and under a basePath like "/waslfy/".
 */
const VERSION = 'waslfy-v1';

const BASE = new URL(self.registration.scope).pathname;

/* App shell: the exported index.html, manifest and icons. */
const PRECACHE = [
  BASE,
  BASE + 'manifest.webmanifest',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
  BASE + 'icons/icon-maskable-512.png',
];

/* Immutable build assets get a long-lived runtime cache. */
const RUNTIME = `waslfy-runtime-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== VERSION && k !== RUNTIME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1) Navigations: network-first (so updates land), fall back to the
  //    cached shell. The app is 100% client-side, so serving the shell
  //    offline is always correct.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(BASE))
        )
    );
    return;
  }

  // 2) Immutable assets (hashed chunks + self-hosted fonts): cache-first.
  if (url.pathname.includes('/_next/static/') || url.pathname.includes('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(RUNTIME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // 3) Everything else same-origin: network-first with cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(RUNTIME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

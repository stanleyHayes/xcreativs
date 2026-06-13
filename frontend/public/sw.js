const CACHE_VERSION = 'v3';

// Disable the service worker on localhost. In development a caching SW serves
// stale built chunks and fights Next.js HMR, causing infinite hard-reload loops.
const IS_DEV =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const STATIC_CACHE = `xcreatives-static-${CACHE_VERSION}`;
const PAGE_CACHE = `xcreatives-pages-${CACHE_VERSION}`;
const API_CACHE = `xcreatives-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `xcreatives-images-${CACHE_VERSION}`;

const PRECACHE_PAGES = [
  '/',
  '/en',
  '/fr',
  '/offline',
  '/en/services',
  '/en/work',
  '/en/insights',
  '/en/contact',
];

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install: precache critical pages and assets
self.addEventListener('install', (event) => {
  if (IS_DEV) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  event.waitUntil(
    Promise.all([
      caches.open(PAGE_CACHE).then((cache) => cache.addAll(PRECACHE_PAGES)),
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
    ]).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  if (IS_DEV) {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((c) => c.navigate(c.url));
      })()
    );
    return;
  }
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('xcreatives-') && !name.includes(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: determine cache strategy
function getStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API calls
  if (pathname.startsWith('/api/')) {
    return 'api';
  }

  // Static assets
  if (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff')
  ) {
    return 'static';
  }

  // Images
  if (
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.gif')
  ) {
    return 'image';
  }

  // HTML pages (navigation)
  if (request.mode === 'navigate' || request.destination === 'document') {
    return 'page';
  }

  return null;
}

// Stale-while-revalidate: return cached version immediately, then update cache
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Network-first with cache fallback
async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }

    throw err;
  }
}

// Cache-first with network fallback
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    throw err;
  }
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  if (IS_DEV) return;
  const { request } = event;

  // Skip non-GET requests (except for background sync)
  if (request.method !== 'GET') {
    return;
  }

  const strategy = getStrategy(request);
  if (!strategy) return;

  switch (strategy) {
    case 'page':
      event.respondWith(
        staleWhileRevalidate(request, PAGE_CACHE).catch(() =>
          caches.match('/offline')
        )
      );
      break;

    case 'static':
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      break;

    case 'image':
      event.respondWith(
        cacheFirst(request, IMAGE_CACHE).catch(() => {
          // Return a 1x1 transparent pixel for missing images
          return new Response(
            new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x3b]),
            { headers: { 'Content-Type': 'image/gif' } }
          );
        })
      );
      break;

    case 'api':
      // Only cache safe API calls (GET requests to certain endpoints)
      event.respondWith(
        networkFirst(request, API_CACHE, null).catch((err) => {
          // Return a JSON error for failed API calls
          return new Response(
            JSON.stringify({ error: 'You are offline. This data is not cached.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
      );
      break;
  }
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-submissions') {
    event.waitUntil(processFormSubmissions());
  }
});

async function processFormSubmissions() {
  const db = await openSyncDB();
  const submissions = await db.getAll('formSubmissions');

  for (const submission of submissions) {
    try {
      const response = await fetch(submission.url, {
        method: submission.method,
        headers: submission.headers,
        body: JSON.stringify(submission.body),
      });

      if (response.ok) {
        await db.delete('formSubmissions', submission.id);
      }
    } catch (err) {
      // Will retry on next sync
    }
  }
}

// IndexedDB helper for background sync
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('xcreatives-sync', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('formSubmissions')) {
        db.createObjectStore('formSubmissions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Message handler for cache updates from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

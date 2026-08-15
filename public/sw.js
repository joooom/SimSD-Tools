const CACHE_NAME = 'simsd-chair-shell-v4';

function discoverLocalAssets(text, baseUrl) {
  const values = [];
  for (const match of text.matchAll(/\b(?:src|href)="([^"]+)"/g)) values.push(match[1]);
  for (const match of text.matchAll(/url\(([^)]+)\)/g)) values.push(match[1].replace(/^['"]|['"]$/g, ''));
  for (const match of text.matchAll(/["']([^"']+\.(?:js|css|png|svg|webp|woff2?))["']/g)) values.push(match[1]);
  return values.flatMap(value => {
    if (!value || value.includes('$')) return [];
    try {
      const url = new URL(value, baseUrl);
      return url.origin === self.location.origin ? [url.pathname] : [];
    } catch { return []; }
  });
}

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  const queue = ['/index.html'];
  const visited = new Set();
  while (queue.length) {
    const path = queue.shift();
    if (visited.has(path) || path.startsWith('/api/') || path.startsWith('/auth/')) continue;
    visited.add(path);
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) continue;
    await cache.put(path, response.clone());
    const contentType = response.headers.get('content-type') || '';
    if (/html|css|javascript/.test(contentType)) {
      const text = await response.text();
      for (const asset of discoverLocalAssets(text, new URL(path, self.location.origin))) {
        if (!visited.has(asset)) queue.push(asset);
      }
    }
  }
  const index = await cache.match('/index.html');
  if (index) await cache.put('/', index.clone());
}

self.addEventListener('install', event => {
  event.waitUntil(precacheAppShell());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/') || url.pathname === '/ws') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});

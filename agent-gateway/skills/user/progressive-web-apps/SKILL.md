---
name: progressive-web-apps
description: Progressive Web Apps with service workers, manifest, and offline capabilities
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: web-development
---
## What I do
- Create PWAs with manifest.json
- Implement service workers for offline support
- Handle push notifications
- Use cache strategies
- Add to home screen capabilities
- Implement background sync

## When to use me
When building installable web apps with offline capabilities.

## Manifest
```json
{
  "name": "My PWA",
  "short_name": "MyApp",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Service Worker
```javascript
// sw.js
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll(['/', '/index.html', '/styles.css']);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

## Cache Strategies
```javascript
// Cache first
async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

// Network first
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    return caches.match(request);
  }
}

// Stale-while-revalidate
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(response => {
    caches.open('v1').then(cache => cache.put(request, response));
    return response;
  });
  return cached || fetchPromise;
}
```

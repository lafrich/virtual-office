/* sw v6 2026-11-07: unused encrypted game playback removed (Package A / v16a cancelled).
   This worker no longer decrypts the old game page, loads cancelled patches, or redirects to the archive login.
   skipWaiting+clients.claim so visitors who registered the old decrypting SW drop it immediately.
   All same-origin requests pass through to the network. */
'use strict';
const SCOPE = self.registration.scope;
const BASE = new URL(SCOPE).pathname;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', ev => {
  const req = ev.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  // Pass every site file through to the network. No decrypt, no archive redirect.
});

/* sw v25 2026-11-14: NJH98 compact Win98 tray, Sims action bar, Kondisi tab, icon-only AKSI/LARI (njh98-7 assets). Previous: v24 2026-11-14 NJH98 Alat Dev only ?dev=1, no lone Login tab, sticky window buttons (njh98-6 assets); v23 2026-11-14 NJH98 overflow/alignment pass + player "!" cue (njh98-5 assets); v22 2026-11-14 NJH98 SIMULASI layer (njh98-4 assets); v21 2026-11-14 Namanya Juga Hidup Win98 UI (njh98-3 assets); v20 2026-11-10 Mainkan Confirm continues when the Worker profile save is blocked. Phones pick up the new files.
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

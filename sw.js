/* sw v31 2026-11-14: Props/Cove iso scale (size*PX/PY) + test-ID bags 3/8 (njh-125-1 world-builder assets). Previous: v30 2026-11-14: Step 2a UI: hide leftover wake PLACEHOLDER ANIMASI; dedupe legacy AKSI ids; no-crop windows (lesson 18) on top of Minimarket hotfix (njh-step2-4 assets). Previous: v29 2026-11-14: hotfix Minimarket.exe crop + window-fit gate (njh-step2-3 mainkan assets). Previous: v28 2026-11-14: Step 2 live: minimarket, cooking, fishing, kost electricity token + NJH98 step 2 UI (njh-step2-2 assets). Previous: v27 2026-11-14: NJH map is the only default in Mainkan/Semesta (njh-only-map). Previous: v26 2026-11-14: NJH98 Action bar slides upward from AKSI (njh98-8 assets). Previous: v25 2026-11-14 NJH98 compact Win98 tray, Sims action bar, Kondisi tab, icon-only AKSI/LARI (njh98-7 assets); v24 2026-11-14 NJH98 Alat Dev only ?dev=1, no lone Login tab, sticky window buttons (njh98-6 assets); v23 2026-11-14 NJH98 overflow/alignment pass + player "!" cue (njh98-5 assets); v22 2026-11-14 NJH98 SIMULASI layer (njh98-4 assets); v21 2026-11-14 Namanya Juga Hidup Win98 UI (njh98-3 assets); v20 2026-11-10 Mainkan Confirm continues when the Worker profile save is blocked. Phones pick up the new files.
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

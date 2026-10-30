/* STAGING sw v1 2026-10-30: isolated test build; production assets read-only. */
/* sw v2 2026-10-29 game-only: no caching of office files (always network + decrypt) */
/* Virtual Office decrypting service worker. Holds the AES key in memory only;
   when restarted it asks an unlocked tab (which keeps it in sessionStorage). */
'use strict';
const SCOPE = self.registration.scope;              // e.g. https://x.github.io/virtual-office/
const BASE = new URL(SCOPE).pathname;
const PLAIN = new Set(['', 'index.html', 'sw.js', 'life-context.js', '.nojekyll', '404.html']);
let KEY = null, MAN = null, MANP = null, MANT = 0;

const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function setKey(k) { if (!k) return null; KEY = await crypto.subtle.importKey('raw', b64(k), 'AES-GCM', false, ['decrypt']); return KEY; }
async function decrypt(buf) { const u = new Uint8Array(buf); return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.slice(0, 12) }, KEY, u.slice(12)); }

function ask(client) {
  return new Promise(res => { const ch = new MessageChannel(); const t = setTimeout(() => res(null), 2500);
    ch.port1.onmessage = e => { clearTimeout(t); res(e.data && e.data.key); }; client.postMessage({ type: 'need-key' }, [ch.port2]); });
}
async function getKey(ev) {
  if (KEY) return KEY;
  const cs = [];
  if (ev.clientId) { const c = await self.clients.get(ev.clientId); if (c) cs.push(c); }
  for (const c of await self.clients.matchAll({ type: 'window' })) if (!cs.includes(c)) cs.push(c);
  for (const c of cs) { const k = await ask(c); if (k) { try { return await setKey(k); } catch (e) {} } }
  return null;
}
async function manifest(fresh) {
  if (MAN && !fresh) return MAN;
  if (!MANP || fresh) MANP = (async () => { const r = await fetch(SCOPE + 'manifest.enc?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('manifest ' + r.status); MAN = JSON.parse(new TextDecoder().decode(await decrypt(await r.arrayBuffer()))).files; return MAN; })();
  try { return await MANP; } catch (e) { MANP = null; throw e; }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'key') e.waitUntil(setKey(d.key).then(() => { MAN = null; MANP = null; e.ports[0] && e.ports[0].postMessage({ ok: true }); },
    () => e.ports[0] && e.ports[0].postMessage({ ok: false })));
  if (d.type === 'lock') { KEY = null; MAN = null; MANP = null; }
});

self.addEventListener('fetch', ev => {
  const req = ev.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  let p; try { p = decodeURIComponent(u.pathname.slice(BASE.length)); } catch (e) { return; }
  if (PLAIN.has(p) || p.endsWith('.enc')) return;               // lock page + ciphertext straight from the network
  ev.respondWith(handle(ev, p, u));
});

async function handle(ev, p, u) {
  const nav = ev.request.mode === 'navigate';
  if (!await getKey(ev)) return nav ? Response.redirect(SCOPE + '?next=' + encodeURIComponent(p + u.search), 302)
                                    : new Response('locked', { status: 401 });
  try {
    if (p === 'data.json') {                                    // live data: always fresh, cache-busted
      const r = await fetch(new URL('../data.enc?t=' + Date.now(), SCOPE).href, { cache: 'no-store' });
      if (!r.ok) return new Response('', { status: r.status });
      return new Response(await decrypt(await r.arrayBuffer()), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    let m = await manifest(nav), ent = m[p];
    if (!ent && !nav && Date.now() - MANT > 60000) { MANT = Date.now(); m = await manifest(true); ent = m[p]; }
    if (!ent) return new Response('Not found', { status: 404 });
    const bucket = ent[0].startsWith('vclife_') ? SCOPE + 'b/' : new URL('../b/', SCOPE).href;
    const r = await fetch(bucket + ent[0]);
    if (!r.ok) return new Response('', { status: r.status });
    const plaintext = await decrypt(await r.arrayBuffer());
    if (p === 'office.html') {
      const html = new TextDecoder().decode(plaintext);
      if (!html.includes('virtual-city-life-prototype') || !html.includes('</body>')) {
        return new Response('staging game version mismatch', { status: 500 });
      }
      // Patch the decoded document in memory; all original encrypted files
      // remain intact. Every anchor is checked to avoid a silent partial patch.
      const seatAnchor = '  res.use=(a.use_points||[]).map(u=>';
      const tickAnchor = '  let moving=false;\n  if(m>0.05){';
      const routeAnchor = 'function goTo(t){ if(OUT_ON){';
      const hudAnchor = "window.addEventListener('pagehide',store);";
      if (![seatAnchor,tickAnchor,routeAnchor,hudAnchor].every(s=>html.includes(s))) {
        console.warn('[staging] life-context anchors no longer match source');
        return new Response('staging life controller version mismatch', { status: 500 });
      }
      let patched = html.replace(seatAnchor,
        "  (window.__vcLifeSeats || (window.__vcLifeSeats=[])).push(...res.seats.map((s,seatIndex)=>({...s,objectId:id,seatIndex})));\n" + seatAnchor);
      // Outdoor furniture is procedural, unlike indoor asset-manifest seats.
      // Register seat anchors at construction time, without modifying
      // the bench/chair meshes, collision data, Baymax, or Migi.
      const parkAnchor = 'function bench(c,r){ return prop(c+0.8,r+0.25,0.8,g=>';
      const parkSeats = "function bench(c,r){ (window.__vcLifeSeats||(window.__vcLifeSeats=[])).push(" +
        "{c:c+0.42,r:r+0.29,zone:'street',objectId:'park_bench',seatIndex:0,dir:'sw',pose:'sit'}," +
        "{c:c+1.18,r:r+0.29,zone:'street',objectId:'park_bench',seatIndex:1,dir:'sw',pose:'sit'}); " +
        "return prop(c+0.8,r+0.25,0.8,g=>";
      const cafeAnchor = "function chairP(c,r,back,col){ col=col||";
      const cafeSeats = "function chairP(c,r,back,col){ " +
        "(window.__vcLifeSeats||(window.__vcLifeSeats=[])).push(" +
        "{c,r,zone:'street',objectId:'warteg_terrace_chair',seatIndex:back<0?0:1," +
        "dir:back<0?'se':'nw',pose:'sit'}); col=col||";
      const wtTableAnchor = 'const table=(id,c,r,chairs)=>{ const g=wtB';
      const wtTableSeats = "const table=(id,c,r,chairs)=>{ " +
        "const t=(window.__vcLifeSeats||(window.__vcLifeSeats=[])); " +
        "const rowBack=r-0.65,rowFront=r+0.65; " +
        "const spots=chairs?" +
        "[{c,r:rowBack,dir:'sw'},{c,r:rowFront,dir:'ne'}]:" +
        "[{c:c-0.23,r:rowBack,dir:'sw'},{c:c+0.23,r:rowBack,dir:'sw'}," +
        "{c:c-0.23,r:rowFront,dir:'ne'},{c:c+0.23,r:rowFront,dir:'ne'}]; " +
        "t.push(...spots.map((s,i)=>({...s,zone:'warteg'," +
        "objectId:'warteg_'+id+(chairs?'_chair':'_bench'),seatIndex:i,pose:'sit'}))); " +
        "const g=wtB";
      for (const [oldValue,newValue] of [
        [parkAnchor,parkSeats], [cafeAnchor,cafeSeats],
        [wtTableAnchor,wtTableSeats]
      ]) {
        if (patched.split(oldValue).length !== 2) {
          console.warn('[staging] outdoor seat anchor changed:',oldValue);
          return new Response('staging exterior seat version mismatch', {status:500});
        }
        patched = patched.replace(oldValue,newValue);
      }
      patched = patched.replace(tickAnchor,
        "  let moving=false;\n  if ((m>0.05 || me.path.length>0) && me._lifeStandOrigin && window.__lifeBridge && window.__lifeBridge.exitPoseForMovement) window.__lifeBridge.exitPoseForMovement();\n  if(m>0.05){");
      patched = patched.replace(routeAnchor,
        "function goTo(t){ if(me._lifeStandOrigin && window.__lifeBridge && window.__lifeBridge.exitPoseForMovement) window.__lifeBridge.exitPoseForMovement(); if(OUT_ON){");
      patched = patched.replace(hudAnchor,
        "window.addEventListener('vc-life-stand',()=>{ if(mode==='sit'||mode==='sleep') mode='idle'; });\n" + hudAnchor);
      // Baymax and the player need the same render layer while seated.
      // Call the world-space sprite renderer from the game's native frame loop.
      const placeAnchor = "meEl.classList.toggle('flip',me.dir==='sw'||me.dir==='nw'); }";
      if (patched.split(placeAnchor).length !== 2)
        return new Response('staging render anchor mismatch', {status:500});
      patched = patched.replace(placeAnchor,
        "meEl.classList.toggle('flip',me.dir==='sw'||me.dir==='nw'); if(window.__vcLifeSeatRenderer) window.__vcLifeSeatRenderer(); }");
      // actionCtx, doAction and me are private to the original game IIFE.
      // Put the contextual controller inside that IIFE, not in an external script.
      const scopeEnd = '  MP.me=null; MP.tok=null; showLogin(true);\n})();\n})();\n</script>';
      if (patched.split(scopeEnd).length !== 2) {
        console.warn('[staging] game IIFE closure changed');
        return new Response('staging game scope mismatch', {status:500});
      }
      const ctxResponse = await fetch(SCOPE + 'life-context.js?v=16', {cache:'no-store'});
      if (!ctxResponse.ok) return new Response('life-context unavailable', {status:503});
      const ctx = await ctxResponse.text();
      if (ctx.includes('</script') || !ctx.includes('window.__vcLifeContextReady = true')) {
        return new Response('invalid life-context controller', {status:500});
      }
      const extended = patched.replace(scopeEnd,
        '  MP.me=null; MP.tok=null; showLogin(true);\n})();\n' + ctx + '\n})();\n</script>');
      return new Response(extended, { headers: { 'Content-Type': ent[1], 'Cache-Control': 'no-store' } });
    }
    return new Response(plaintext, { headers: { 'Content-Type': ent[1], 'Cache-Control': 'no-store' } });
  } catch (e) {
    if (e && e.name === 'OperationError') KEY = null;           // wrong/stale key: force re-unlock
    return nav ? Response.redirect(SCOPE + '?next=' + encodeURIComponent(p + u.search), 302) : new Response('decrypt failed', { status: 500 });
  }
}

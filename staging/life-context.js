/* Virtual City — contextual life actions, staging only.
   Hooks into the EXISTING game Action button, preserves other interactions.
   No Cloudflare Worker messages or multiplayer persistence changes. */
(function () {
  'use strict';
  if (typeof actionCtx !== 'function' || typeof doAction !== 'function' ||
      typeof me === 'undefined' || !window.__lifeBridge) {
    console.warn('[life-context] Existing game controller not found');
    return;
  }
  const originalCtx = actionCtx;
  const originalAction = doAction;
  const distance = (a, b) => Math.hypot(a.c - b.c, a.r - b.r);
  const RANGE_SEAT = 1.35;
  const RANGE_WALL = 1.15;
  const lifeHUD = document.getElementById('vclife');
  const style = document.createElement('style');
  style.textContent = `
    #vclife .life-actions {display:none!important}
    #vclife .life-note:after {content:" · Action muncul saat dekat objek"}
    .me .life-pee-fx {position:absolute;left:8px;bottom:1px;width:3px;height:18px;
      background:linear-gradient(#dff6a7,#eedc54 70%,transparent);
      opacity:.95;transform:rotate(-16deg);border-radius:50%;
      animation:vcPee 1s ease-in-out 2;pointer-events:none;z-index:9}
    @keyframes vcPee {0%{opacity:0;height:4px}20%{opacity:.95;height:19px}
      75%{opacity:.9;height:24px}100%{opacity:0;height:15px}}
  `;
  document.head.appendChild(style);

  function gameUserReady() {
    const p = window.__mp;
    return !SPEC && !!p && p.status === 'live' && !!p.me;
  }

  function occupied(s) {
    if (typeof actors !== 'undefined' && actors.some(a =>
      a && a.pos && distance(s, a.pos) < 0.5)) return true;
    if (typeof NOOR !== 'undefined' && NOOR && !NOOR.out &&
        distance(s, NOOR) < 0.5) return true;
    const peers = window.__mp && window.__mp.peers;
    if (peers) for (const p of Object.values(peers)) {
      if (p && p.s && p.s.z === 'in' && distance(s, p.s) < 0.5) return true;
    }
    return false;
  }

  function nearestSeat() {
    if (OUT_ON || typeof SEATDY === 'undefined') return null;
    let best = null;
    for (const s of SEATDY) {
      const d = distance(me, s);
      if (d > RANGE_SEAT || (occupied(s) && d > 0.2)) continue;
      if (!best || d < best.distance) best = { c:s.c, r:s.r, distance:d };
    }
    return best;
  }

  function nearSofa(seat) {
    if (!seat || typeof LOUNGE === 'undefined') return false;
    return LOUNGE.some(s => s.id.indexOf('sofa') === 0 && distance(seat, s) < 0.48);
  }

  function nearWall() {
    if (OUT_ON) {
      if (WT.on) {
        // Warteg: rear/side interior walls, away from the doorway.
        const d = Math.min(Math.abs(me.r - 24.5), Math.abs(me.c - 28.6));
        if (me.c >= 28.6 && me.c <= 35.05 && me.r >= 24.5 &&
            me.r <= 27.92 && d <= RANGE_WALL) return d;
        return null;
      }
      // Building facade: visible exterior walls at r=28 and c=27.
      // Doorway deliberately excluded.
      const doorDistance = Math.abs(me.c - EXT.door.c);
      const front = me.c > -18 && me.c < 26.8 && doorDistance > 1.5 &&
          me.r >= 28.25 && me.r < 29.15 ? Math.abs(me.r - 28) : Infinity;
      const side = me.r >= 28.25 && me.r <= 31.7 && me.c > 27 &&
          me.c < 28.15 ? Math.abs(me.c - 27) : Infinity;
      const d = Math.min(front, side);
      return d <= RANGE_WALL ? d : null;
    }
    // Indoor: only mapped perimeter/gallery partitions, never desks or furniture.
    const walls = [
      Math.abs(me.c - 0.5),
      Math.abs(me.r - 0.5),
      Math.abs(me.c - (C - 0.5)),
      Math.abs(me.r - (R - 0.5))
    ];
    if (me.r >= 0 && me.r <= 8 && Math.abs(me.r - 4.5) > 1.25) {
      walls.push(Math.abs(me.c - 22));
    }
    const d = Math.min(...walls);
    return d <= RANGE_WALL ? d : null;
  }

  function contextualLife() {
    if (!gameUserReady()) return null;
    const seat = nearestSeat();
    if (seat) {
      if (me.forceAnim === 'lie') {
        return {k:'vc-stand',l:'Bangun',hint:'Bangun dari sofa',d:seat.distance / RANGE_SEAT - 1.0,seat};
      }
      if (me.forceAnim === 'sit') {
        if (nearSofa(seat)) return {k:'vc-sleep',l:'Tidur',hint:'Tidur di sofa',d:seat.distance / RANGE_SEAT - 1.0,seat};
        return {k:'vc-stand',l:'Bangun',hint:'Berdiri dari kursi',d:seat.distance / RANGE_SEAT - 1.0,seat};
      }
      return {k:'vc-sit',l:'Duduk',hint:'Duduk di kursi',d:seat.distance / RANGE_SEAT - 1.0,seat};
    }
    // Standing up remains available even if the seat position is slightly offset.
    if (me.forceAnim === 'sit' || me.forceAnim === 'lie') {
      return {k:'vc-stand',l:'Bangun',hint:'Berdiri',d:-0.7};
    }
    const w = nearWall();
    if (w != null) return {k:'vc-pee',l:'Pipis',hint:'Pipis sembarangan dekat tembok',d:w / RANGE_WALL - 0.8};
    return null;
  }

  actionCtx = function () {
    const existing = originalCtx();
    const life = contextualLife();
    if (!life) return existing || (gameUserReady()?{
      k:'vc-fart',l:'Kentut',hint:'Kentut sembarangan',d:2
    }:null);
    // Exit doors, Migi and conversational interactions retain priority
    // unless a seat or wall is materially closer.
    return !existing || life.d < existing.d ? life : existing;
  };

  function activate(which) {
    const button = lifeHUD && lifeHUD.querySelector('[data-act="' + which + '"]');
    if (!button || button.disabled) return false;
    button.click(); // Uses the existing Life HUD's user-scoped logic and saving.
    return true;
  }

  function peeEffect() {
    const el = document.createElement('span');
    el.className = 'life-pee-fx';
    meEl.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  doAction = function () {
    const choice = actionCtx();
    if (!choice || !choice.k || !choice.k.startsWith('vc-')) {
      return originalAction();
    }
    // Re-check proximity on the actual click (never trust cached action hints).
    if (!gameUserReady()) return;
    const fresh = contextualLife();
    if (choice.k === 'vc-fart') {
      if (!fresh && !originalCtx()) activate('fart');
      return;
    }
    if (!fresh || fresh.k !== choice.k) return;
    if (choice.k === 'vc-sit') {
      if (!fresh.seat || occupied(fresh.seat)) return;
      // Snap only within interaction radius; avoids sitting mid-air.
      me.c = fresh.seat.c;
      me.r = fresh.seat.r;
      me.path = [];
      if (typeof LOUNGE !== 'undefined') {
        const lounge = LOUNGE.find(s => distance(s, fresh.seat) < 0.35);
        if (lounge && lounge.dir) me.dir = lounge.dir;
      }
      activate('sit');
    } else if (choice.k === 'vc-sleep') {
      activate('sleep');
    } else if (choice.k === 'vc-stand') {
      activate('stand');
    } else if (choice.k === 'vc-pee') {
      if (nearWall() == null) return;
      if (activate('pee')) peeEffect();
    }
  };
  if (typeof updAction === 'function') {
    try { updAction(); } catch (e) { console.warn('[life-context]',e); }
  }
  console.info('[life-context] object proximity actions enabled');
})();

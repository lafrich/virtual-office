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
  // This script runs inside the game's closure, before the Life HUD creates its DOM.
  // Always resolve the hidden HUD lazily at the moment an action is chosen.
  const style = document.createElement('style');
  style.textContent = `
    /* No floating LIFE panel. Use the game's original bottom-right Action button. */
    #vclife {display:none!important}
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
    if (OUT_ON) return null;
    // All registered furniture seats, including zero-offset desk chairs.
    // These are captured from the original put() / res.seats template data.
    const seats = window.__vcLifeSeats || [];
    let best = null;
    for (const s of seats) {
      const d = distance(me, s);
      if (d > RANGE_SEAT || occupied(s)) continue;
      const chair = /(?:^|_)chair_/i.test(s.objectId || '') ? 1 : 0;
      const oldChair = best && /(?:^|_)chair_/i.test(best.objectId || '') ? 1 : 0;
      if (!best || d < best.distance - 0.001 ||
          (Math.abs(d - best.distance) < 0.001 && chair > oldChair))
        best = { ...s, distance:d };
    }
    return best;
  }

  function nearSofa(seat) {
    if (!seat) return false;
    if (typeof seat.objectId === 'string' && /^sofa_/i.test(seat.objectId)) return true;
    return typeof LOUNGE !== 'undefined' &&
      LOUNGE.some(s => s.id.indexOf('sofa') === 0 && distance(seat, s) < 0.48);
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
      if (me.forceAnim === 'sit' || me.forceAnim === 'perch') {
        if (nearSofa(seat)) return {k:'vc-sleep',l:'Tidur',hint:'Tidur di sofa',d:seat.distance / RANGE_SEAT - 1.0,seat};
        return {k:'vc-stand',l:'Bangun',hint:'Berdiri dari kursi',d:seat.distance / RANGE_SEAT - 1.0,seat};
      }
      return {k:'vc-sit',l:'Duduk',hint:'Duduk di kursi',d:seat.distance / RANGE_SEAT - 1.0,seat};
    }
    // Standing up remains available even if the seat position is slightly offset.
    if (me.forceAnim === 'sit' || me.forceAnim === 'lie' || me.forceAnim === 'perch') {
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
    const lifeHUD = document.getElementById('vclife');
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
      // Remember an actually walkable standing position: furniture seat tiles
      // can be blocked, so movement must start from the approach tile.
      if (typeof okG === 'function' && !okG(me.c, me.r)) return;
      me._lifeStandOrigin = { c:me.c, r:me.r };
      me._lifeSeat = { c:fresh.seat.c, r:fresh.seat.r };
      me.c = fresh.seat.c;
      me.r = fresh.seat.r;
      me.path = [];
      if (fresh.seat.dir) me.dir = fresh.seat.dir;
      if (!fresh.seat.dir && typeof LOUNGE !== 'undefined') {
        const lounge = LOUNGE.find(s => distance(s, fresh.seat) < 0.35);
        if (lounge && lounge.dir) me.dir = lounge.dir;
      }
      if (activate('sit') && fresh.seat.pose === 'perch' &&
          typeof SL !== 'undefined' && SL.anims && SL.anims.perch) {
        me.forceAnim = 'perch';
      }
    } else if (choice.k === 'vc-sleep') {
      activate('sleep');
    } else if (choice.k === 'vc-stand') {
      activate('stand');
      if (window.__lifeBridge.exitPoseForMovement)
        window.__lifeBridge.exitPoseForMovement();
    } else if (choice.k === 'vc-pee') {
      if (nearWall() == null) return;
      if (activate('pee')) peeEffect();
    }
  };
  // Called synchronously at the beginning of the original movement tick,
  // and before pathfinding when the player taps another location.
  window.__lifeBridge.exitPoseForMovement = function () {
    const hadPose = !!me._lifeStandOrigin; // never interrupt unrelated game poses
    if (!hadPose) return false;
    me.forceAnim = null;
    const origin = me._lifeStandOrigin;
    if (origin && typeof okG === 'function' && okG(origin.c,origin.r) &&
        Math.hypot(me.c-origin.c,me.r-origin.r) <= RANGE_SEAT+0.2) {
      me.c = origin.c;
      me.r = origin.r;
    }
    me._lifeSeat = null;
    me._lifeStandOrigin = null;
    window.dispatchEvent(new Event('vc-life-stand'));
    return true;
  };


  // Render the seated *player* in the same depth-sorted SVG world as Baymax.
  // The normal player avatar is HTML above all furniture, causing the player to
  // appear in front of armrests/partition walls even with correct seat coords.
  // sheetSprite + sprite + sortWorld use the very same pivot and draw order as
  // AI actors; no hand-tuned pixel offsets are used.
  (function prepareSeatLayer() {
    const entry = typeof charEntry === 'function' ? charEntry('_user') : null;
    if (!entry || !entry.sheet || typeof sprite !== 'function' ||
        typeof sheetSprite !== 'function') return;
    const group = sprite(0, 'bot vc-life-sitter');
    group.setAttribute('display', 'none');
    const seatedSprite = sheetSprite(group, entry.sheet);
    let valid = false;
    let displayed = false;
    let lastDepth = null;
    let lastFrame = '';
    loadImg(entry.sheet).then(img => { valid = !!img; });
    window.__vcLifeSeatRenderer = function renderSeatLayer() {
      const sitting = valid && !SPEC && !OUT_ON && !!me._lifeSeat &&
        !me.moving && ['sit','perch','lie'].includes(me.forceAnim);
      if (!sitting) {
        if (displayed) {
          displayed = false;
          group.setAttribute('display', 'none');
          meEl.style.visibility = '';
        }
        return;
      }
      const p = P(me.c, me.r);
      // Match Baymax's world-space, art-pixel-aligned anchor and seat sinking.
      const y = p.y + sitOffset(me.c, me.r, me.forceAnim, null);
      const xSnap = Math.round(p.x * PPU) / PPU;
      const ySnap = Math.round(y * PPU) / PPU;
      const depth = me.c + me.r + 0.05;
      group.setAttribute('transform', 'translate(' + xSnap + ',' + ySnap + ')');
      if (!displayed) {
        displayed = true;
        group.setAttribute('display', 'inline');
        meEl.style.visibility = 'hidden';
      }
      if (depth !== lastDepth) {
        group._d = depth;
        if (typeof sortWorld === 'function') sortWorld();
        lastDepth = depth;
      }
      const {col,row} = sheetCell(me.forceAnim, me.dir, me.at);
      const frame = col + ':' + row;
      if (frame !== lastFrame) {
        seatedSprite.im.setAttribute('x', -col * SL.frame[0]);
        seatedSprite.im.setAttribute('y', -row * SL.frame[1]);
        lastFrame = frame;
      }
    };
  })();

  if (typeof updAction === 'function') {
    try { updAction(); } catch (e) { console.warn('[life-context]',e); }
  }
  window.__vcLifeContextReady = true;
  console.info('[life-context] native Action integrated; floating Life panel hidden');
})();

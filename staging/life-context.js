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
    .me .vc-fart-cloud {
      position:absolute;display:block;width:0;height:0;z-index:5;
      pointer-events:none;overflow:visible;image-rendering:pixelated
    }
    .me .vc-fart-cloud i {
      position:absolute;display:block;left:0;top:0;
      width:var(--vc-fart-dot);height:var(--vc-fart-dot);
      background:#e1e8dc;
      box-shadow:
        var(--vc-fart-dot) 0 #bdcbc2,
        0 var(--vc-fart-dot-neg) #eff0e4,
        var(--vc-fart-half-neg) var(--vc-fart-half) #96ada9;
      animation:vc-fart-trail 860ms steps(8,end) both;
      transform-origin:center;pointer-events:none
    }
    @keyframes vc-fart-trail {
      0% {opacity:0;transform:translate(0,0) scale(.6)}
      12% {opacity:.95;transform:translate(0,0) scale(.75)}
      62% {opacity:.7}
      100% {opacity:0;transform:
        translate(var(--vc-fart-x),var(--vc-fart-y)) scale(1.25)}
    }
  `;
  document.head.appendChild(style);

  // The old fart effect was an 18px emoji at a fixed 2D offset.
  // The original Grok PNG has 64x112 px frames and a (32,100) feet pivot.
  // Place pixel smoke at the hip and send it away from the back of the player.
  const FART_HIPS = Object.freeze({
    se: { x:24, y:73, vx:-1, vy:-0.32 },
    sw: { x:40, y:73, vx: 1, vy:-0.32 },
    ne: { x:28, y:73, vx:-1, vy: 0.28 },
    nw: { x:36, y:73, vx: 1, vy: 0.28 }
  });
  const oldFartPuff = window.__lifeBridge.puff;
  window.__lifeBridge.puff = function positionedFartPuff() {
    if (!gameUserReady() || !meEl || !meEl.isConnected) return;
    if (!meEl.classList.contains('spr') ||
        typeof cam === 'undefined' || !cam.sc ||
        typeof SL === 'undefined' || !SL.pivot) {
      if (typeof oldFartPuff === 'function') oldFartPuff();
      return;
    }
    const dir=FART_HIPS[me.dir] || FART_HIPS.se;
    const scale=cam.sc / PPU;
    if (!(scale>0)) return;
    const fx=Math.round((dir.x-SL.pivot[0])*scale);
    const fy=Math.round((dir.y-SL.pivot[1])*scale);
    const cloud=document.createElement('span');
    cloud.className='vc-fart-cloud';
    cloud.setAttribute('aria-hidden','true');
    cloud.style.left=fx+'px';
    cloud.style.top=fy+'px';
    const pixels=val=>Math.max(1,Math.round(val*scale))+'px';
    cloud.style.setProperty('--vc-fart-dot',pixels(3));
    cloud.style.setProperty('--vc-fart-dot-neg','-'+pixels(3));
    cloud.style.setProperty('--vc-fart-half',pixels(2));
    cloud.style.setProperty('--vc-fart-half-neg','-'+pixels(2));
    for(let i=0;i<3;i++){
      const bit=document.createElement('i');
      bit.style.setProperty('--vc-fart-x',(dir.vx*(8+6*i)*scale).toFixed(2)+'px');
      bit.style.setProperty('--vc-fart-y',((dir.vy*(8+6*i)-5-2*i)*scale).toFixed(2)+'px');
      bit.style.animationDelay=(i*100)+'ms';
      cloud.appendChild(bit);
    }
    meEl.appendChild(cloud);
    setTimeout(()=>cloud.remove(),1200);
  };

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
    // Indoor seats come from asset metadata; outdoor benches and warteg chairs
    // are registered at construction time by the original exterior builders.
    const zone = OUT_ON ? (WT.on ? 'warteg' : 'street') : 'office';
    const seats = window.__vcLifeSeats || [];
    let best = null;
    for (const s of seats) {
      if ((s.zone || 'office') !== zone) continue;
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
    if (OUT_ON) return false;
    return typeof LOUNGE !== 'undefined' &&
      LOUNGE.some(s => s.id.indexOf('sofa') === 0 && distance(seat, s) < 0.48);
  }

  function nearWall() {
    // Pipis only while FACING an actual wall. Direction mapping follows
    // Grok's native isometric grid: +c=SE, +r=SW, -c=NW, -r=NE.
    // Checking this inside nearWall() also protects the actual Action click,
    // not only the button hint shown in the previous render frame.
    const facing=me.dir;
    let nearest=Infinity;
    const consider=(distance,requiredFacing)=>{
      if (facing===requiredFacing && distance<=RANGE_WALL &&
          distance<nearest) nearest=distance;
    };

    if (OUT_ON) {
      if (WT.on) {
        // Warteg interior: both walls are behind the upper/left boundaries.
        if (me.c>=28.6 && me.c<=35.05 &&
            me.r>=24.5 && me.r<=27.92) {
          consider(Math.abs(me.r-24.5),'ne');
          consider(Math.abs(me.c-28.6),'nw');
        }
      } else {
        // Outdoor building facades: street-side player must look AT the wall.
        // The entrance remains excluded from outdoor peeing.
        const awayFromDoor=Math.abs(me.c-EXT.door.c)>1.5;
        if (me.c>-18 && me.c<26.8 && awayFromDoor &&
            me.r>=28.25 && me.r<29.15)
          consider(Math.abs(me.r-28),'ne');
        if (me.r>=28.25 && me.r<=31.7 &&
            me.c>27 && me.c<28.15)
          consider(Math.abs(me.c-27),'nw');
      }
    } else {
      // Office walls: front/back and left/right use different facings.
      consider(Math.abs(me.c-0.5),'nw');
      consider(Math.abs(me.r-0.5),'ne');
      consider(Math.abs(me.c-(C-0.5)),'se');
      consider(Math.abs(me.r-(R-0.5)),'sw');

      // Gallery divider has two sides. Which side the character stands on
      // determines the required facing; no pipis while facing away.
      if (me.r>=0 && me.r<=8 && Math.abs(me.r-4.5)>1.25) {
        if (me.c<22) consider(Math.abs(me.c-22),'se');
        else if (me.c>22) consider(Math.abs(me.c-22),'nw');
      }
    }
    return Number.isFinite(nearest)?nearest:null;
  }

  function contextualLife() {
    if (!gameUserReady()) return null;
    const seat = nearestSeat();
    // Once positioned in a furniture slot, maintain the correct action even
    // if the seat is occupied by this user (or the player shifts slightly).
    if (me._lifeStandOrigin && me.forceAnim === 'lie') {
      return {k:'vc-stand',l:'Bangun',hint:'Berdiri dari tempat rebahan',d:-1};
    }
    if (seat) {
      if (me.forceAnim === 'lie') {
        return {k:'vc-stand',l:'Bangun',hint:'Bangun dari sofa',d:seat.distance / RANGE_SEAT - 1.0,seat};
      }
      if (me.forceAnim === 'sit' || me.forceAnim === 'perch') {
        if (nearSofa(seat)) return {k:'vc-sleep',l:'Tidur',hint:'Tidur di sofa',d:seat.distance / RANGE_SEAT - 1.0,seat};
        return {k:'vc-stand',l:'Bangun',hint:'Berdiri dari kursi',d:seat.distance / RANGE_SEAT - 1.0,seat};
      }
      if (seat.pose === 'lie' || (seat.anims && seat.anims.length === 1 && seat.anims[0] === 'lie')) {
        return {k:'vc-recline',l:'Rebah',hint:'Rebah di kursi pantai',d:seat.distance / RANGE_SEAT - 1.0,seat};
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
    if (choice.k === 'vc-sit' || choice.k === 'vc-recline') {
      if (!fresh.seat || occupied(fresh.seat)) return;
      // Snap only within interaction radius; avoids sitting mid-air.
      // Remember an actually walkable standing position: furniture seat tiles
      // can be blocked, so movement must start from the approach tile.
      // Outdoor geometry has separate collision rules from office pathfinding.
      if (OUT_ON ? !extOK(me.c, me.r) : (typeof okG === 'function' && !okG(me.c, me.r))) return;
      me._lifeStandOrigin = { c:me.c, r:me.r };
      me._lifeSeat = { ...fresh.seat }; // retain furniture-specific render depth
      me.c = fresh.seat.c;
      me.r = fresh.seat.r;
      me.path = [];
      if (fresh.seat.dir) me.dir = fresh.seat.dir;
      if (!fresh.seat.dir && typeof LOUNGE !== 'undefined') {
        const lounge = LOUNGE.find(s => distance(s, fresh.seat) < 0.35);
        if (lounge && lounge.dir) me.dir = lounge.dir;
      }
      if (choice.k === 'vc-recline') {
        // sun_lounger_* already defines its lie anchor and facing in the
        // environment manifest; reuse the existing animation and seat point.
        // 'sleep' chooses pose 'lie' and the existing Life energy recovery.
        if (!activate('sleep')) window.__lifeBridge.exitPoseForMovement?.();
      } else if (activate('sit') && fresh.seat.pose === 'perch' &&
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
    if (origin && (OUT_ON ? extOK(origin.c,origin.r) :
        (typeof okG !== 'function' || okG(origin.c,origin.r))) &&
        Math.hypot(me.c-origin.c,me.r-origin.r) <= RANGE_SEAT+0.2) {
      me.c = origin.c;
      me.r = origin.r;
    }
    me._lifeSeat = null;
    me._lifeStandOrigin = null;
    window.dispatchEvent(new Event('vc-life-stand'));
    return true;
  };



  // Staging-only visual seat calibration. Hidden unless office.html?seatCal=1
  // is opened deliberately; the usual contextual Action UI is unchanged.
  // Exact player-only calibration: user verified the MIDDLE BLUE SOFA seat.
  // The other two slots have separate, as-yet uncalibrated offsets (0,0).
  // Old localStorage v1 was for ALL sofa seats and must not override this value.
  const BLUE_SOFA_DEFAULT_OFFSETS = [
    { x: 0, y: 0 },      // left; awaiting visual calibration
    { x: -2, y: -4 },    // MIDDLE; user-confirmed 2026-10-31
    { x: 0, y: 0 }       // right; awaiting visual calibration
  ];
  const SEAT_CAL_KEY = 'vc-blue-sofa-player-offsets-v2';
  const seatVisualTunings = BLUE_SOFA_DEFAULT_OFFSETS.map(v => ({ ...v }));
  const seatCalibrationMode = new URLSearchParams(location.search).get('seatCal') === '1';

  // These temporary overrides are only honored in explicit calibration mode.
  // Standard staging is deterministic and always uses the confirmed defaults.
  if (seatCalibrationMode) {
    try {
      const saved = JSON.parse(localStorage.getItem(SEAT_CAL_KEY) || 'null');
      if (Array.isArray(saved)) {
        saved.slice(0, 3).forEach((v, i) => {
          if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) {
            seatVisualTunings[i].x = Math.max(-32, Math.min(32, Math.round(v.x)));
            seatVisualTunings[i].y = Math.max(-32, Math.min(32, Math.round(v.y)));
          }
        });
      }
    } catch (e) {}
  }
  function selectedSofaSlot() {
    if (!me._lifeSeat || me._lifeSeat.objectId !== 'sofa_3_sw') return -1;
    const index = me._lifeSeat.seatIndex;
    return Number.isInteger(index) && index >= 0 && index <= 2 ? index : -1;
  }

  let calPanel = null;
  if (seatCalibrationMode) {
    const css = document.createElement('style');
    css.textContent = [
      '#vc-seat-cal{position:fixed;right:8px;top:51px;z-index:9997;background:#171c29;color:#fff;',
      'padding:8px;border:2px solid #ffe08c;box-shadow:2px 3px 0 #000;display:none;',
      'font:700 11px monospace;max-width:180px}',
      '#vc-seat-cal button{font:700 13px monospace;padding:7px;min-width:35px;min-height:33px;',
      'border:1px solid #8793a3;color:#fff;background:#2b3950;touch-action:manipulation}',
      '#vc-seat-cal .value{color:#ffe08c;margin:5px 0 8px}',
      '#vc-seat-cal .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}',
      '#vc-seat-cal .bottom{display:flex;gap:4px;margin-top:7px}',
      '#vc-seat-cal .bottom button{font-size:10px;flex:1}'
    ].join('');
    document.head.appendChild(css);
    calPanel = document.createElement('div');
    calPanel.id = 'vc-seat-cal';
    calPanel.innerHTML = '<div>SOFA PLAYER ONLY</div><div class="value"></div>' +
      '<div class="grid"><span></span><button data-dy="-2">↑</button><span></span>' +
      '<button data-dx="-2">←</button><button data-reset="1">↺</button>' +
      '<button data-dx="2">→</button><span></span><button data-dy="2">↓</button><span></span></div>' +
      '<div class="bottom"><button data-copy="1">COPY X/Y</button></div>';
    document.body.appendChild(calPanel);
    const update = () => {
      const slot = selectedSofaSlot();
      if (slot < 0) return;
      const offset = seatVisualTunings[slot];
      calPanel.querySelector('.value').textContent =
        'SLOT ' + (slot + 1) + '/3 · X: ' + offset.x + ' · Y: ' + offset.y + ' px';
      try { localStorage.setItem(SEAT_CAL_KEY, JSON.stringify(seatVisualTunings)); } catch (e) {}
    };
    for (const eventName of ['pointerdown','pointerup','touchstart','touchend','click','keydown','keyup']) {
      calPanel.addEventListener(eventName, e => e.stopPropagation());
    }
    calPanel.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      const slot = selectedSofaSlot();
      if (slot < 0) return;
      const offset = seatVisualTunings[slot];
      if (button.hasAttribute('data-dx')) {
        offset.x = Math.max(-32, Math.min(32, offset.x + Number(button.dataset.dx)));
      } else if (button.hasAttribute('data-dy')) {
        offset.y = Math.max(-32, Math.min(32, offset.y + Number(button.dataset.dy)));
      } else if (button.hasAttribute('data-reset')) {
        Object.assign(offset, BLUE_SOFA_DEFAULT_OFFSETS[slot]);
      } else if (button.hasAttribute('data-copy')) {
        const val = 'Blue sofa player seat SLOT ' + (slot + 1) +
          ' offset: X=' + offset.x + ', Y=' + offset.y + ' atlas px';
        navigator.clipboard?.writeText(val).catch(() => {});
      }
      update();
    }));
  }
  window.__vcLifeSeatTuning = seatCalibrationMode ? seatVisualTunings : null;

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
      if (calPanel) {
        const onSofa = sitting && selectedSofaSlot() >= 0;
        calPanel.style.display = onSofa ? 'block' : 'none';
        if (onSofa) {
          const current = seatVisualTunings[selectedSofaSlot()];
          calPanel.querySelector('.value').textContent =
            'SLOT ' + (selectedSofaSlot() + 1) + '/3 · X: ' + current.x +
            ' · Y: ' + current.y + ' px';
        }
      }
      if (!sitting) {
        if (displayed) {
          displayed = false;
          group.setAttribute('display', 'none');
          meEl.style.visibility = '';
        }
        return;
      }
      const p = P(me.c, me.r);
      // The reference_man sit frame is NOT aligned like Baymax's Bima sheet.
      // Calibrate only the rendered PLAYER on the BLUE sofa: a small
      // screen-diagonal step into the cushion (right/back), never move the
      // actual seat, collision, Baymax, Migi, or the furniture itself.
      const slot = me.forceAnim === 'sit' ? selectedSofaSlot() : -1;
      const offset = slot < 0 ? null : seatVisualTunings[slot];
      const dx = offset ? offset.x / PPU : 0;
      const dy = offset ? offset.y / PPU : 0;
      const y = p.y + sitOffset(me.c, me.r, me.forceAnim, null) + dy;
      const xSnap = Math.round((p.x + dx) * PPU) / PPU;
      const ySnap = Math.round(y * PPU) / PPU;
      // Native world depth: keep the same sofa, Baymax and Migi sorting.
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

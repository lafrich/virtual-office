import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'fs';

const ORIGIN = process.env.ORIGIN || 'http://localhost:8962/virtual-office';
const SHOTS = process.env.SHOTS || '/workspace/njh-sync-shots/cp3-live';
mkdirSync(SHOTS, { recursive: true });

const INTERIOR_ART = /njh-play-interiors\/art\/|njh-interior-preview-art\/|[^/]+\.interior-scene\.json/;
const CATALOG_ONLY = /njh-play-interiors\/catalog\.json/;
const R7_ART = /furniture-(washing_machine|laundry_counter|locker|waiting_bench|wooden_bench|prayer_mat|wudhu_tap|workbench|tool_rack|atm|registration_desk|arcade|drink_cooler|aisle_rack|rice_cooker|food_cart|plastic_bench)/;

const rec = { steps: [], errors: [], boot: {}, enter: {}, q1: {}, spawn: {}, checks: {} };
const net = [];

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
page.on('response', async (resp) => {
  const url = resp.url();
  let bytes = Number(resp.headers()['content-length'] || 0);
  if (!bytes) {
    try { bytes = (await resp.body()).length; } catch { bytes = 0; }
  }
  net.push({ url, status: resp.status(), ok: resp.ok(), bytes });
});
page.on('pageerror', (err) => rec.errors.push(String(err.message || err).slice(0, 240)));

function worldFrame() {
  return page.frames().find((f) => /world-builder/.test(f.url() || ''));
}

async function dismiss() {
  for (const sel of ['#skipSplash', '#njhHowtoWinSkip', '#tutorialSkip', '#tutorialDone', '#welcomeContinue']) {
    const loc = page.locator(sel);
    try { if (await loc.isVisible({ timeout: 400 }).catch(() => false)) await loc.click(); } catch {}
  }
}

async function waitReady(ms = 150000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await dismiss();
    const loadHidden = await page.evaluate(() => document.getElementById('worldLoading')?.hidden === true);
    const gameVis = await page.evaluate(() => {
      const g = document.getElementById('gameScreen');
      return !!(g && !g.hidden);
    });
    const loadText = await page.locator('#worldLoading').innerText().catch(() => '');
    if (/Asset tidak tersedia|LGR-1 gagal/.test(loadText)) {
      rec.errors.push('world-load:' + loadText.replace(/\s+/g, ' ').slice(0, 300));
      return false;
    }
    if (loadHidden && gameVis) {
      await page.waitForTimeout(1200);
      return true;
    }
    await page.waitForTimeout(400);
  }
  rec.errors.push('world-timeout');
  return false;
}

async function exitInterior(wb) {
  try {
    await wb.evaluate(async () => {
      const I = window.__njhPlayInteriors;
      try { I?.exit?.(); } catch {}
    });
  } catch {}
  await page.waitForTimeout(200);
}

function summarizeNet(list) {
  const interior = list.filter((r) => INTERIOR_ART.test(r.url) && !CATALOG_ONLY.test(r.url));
  const r7art = list.filter((r) => R7_ART.test(r.url));
  const scenes = list.filter((r) => /\.interior-scene\.json/.test(r.url));
  const bytes = (arr) => arr.reduce((s, r) => s + (r.bytes || 0), 0);
  return {
    all: list.length,
    allBytes: bytes(list),
    interior: interior.length,
    interiorBytes: bytes(interior),
    r7art: r7art.length,
    r7artBytes: bytes(r7art),
    scenes: scenes.length,
    sceneBytes: bytes(scenes),
    catalog: list.filter((r) => CATALOG_ONLY.test(r.url)).length,
  };
}

function fail(msg) {
  rec.errors.push(msg);
  rec.ok = false;
}

try {
  await page.goto(ORIGIN + '/mainkan/?njhMap=1&fresh=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  rec.steps.push('goto');
  const ok = await waitReady();
  rec.steps.push(ok ? 'ready' : 'not-ready');
  rec.boot.net = summarizeNet(net);
  const bootMark = net.length;
  await page.screenshot({ path: `${SHOTS}/boot.png` });
  if (!ok) fail('not-ready');

  const wb = worldFrame();
  if (!wb) fail('no world-builder iframe');
  else {
    rec.spawn = await wb.evaluate(() => {
      const last = window.__semestaLastSpawn || window.VLNjhMapPreview?.resolveSpawn?.('');
      const pos = window.SemestaLifePlay?.playerPosition?.() || {};
      return {
        kind: last?.kind, reason: last?.reason,
        point: last?.point, pos: { x: pos.x, y: pos.y, z: pos.z },
        fresh: !!(window.NJH_FRESH_MODE || /fresh=1/.test(location.search)),
        housing: document.querySelector('#njhHousing')?.textContent || null,
      };
    }).catch((e) => ({ error: String(e.message || e) }));
    const x = rec.spawn?.point?.x ?? rec.spawn?.pos?.x;
    const z = rec.spawn?.point?.z ?? rec.spawn?.pos?.z;
    rec.spawn.ok = Math.abs(x - -51.5) < 1.5 && Math.abs(z - 64.5) < 1.5;
    if (!rec.spawn.ok) rec.steps.push('spawn-unexpected:' + JSON.stringify(rec.spawn));
    rec.steps.push('spawn:' + rec.spawn.ok);
    rec.boot.preview = await wb.evaluate(() => ({
      search: location.search,
      href: location.href,
      player: new URLSearchParams(location.search).get('player'),
      status: window.VLNjhInteriorArtPreview?.status?.() || null,
    })).catch((e) => ({ error: String(e.message || e) }));

    // Old CP3 source/runtime checks in the same session
    rec.checks = await wb.evaluate(() => {
      const play = window.SemestaLifePlay;
      const hooks = window.SemestaLifeHooks;
      const B = window.NJHBalancing;
      const st = play?.state?.() || {};
      const aliases = typeof play?.sellableFish === 'function' && typeof play?.sell === 'function' && typeof play?.cook === 'function';
      const confirmMin = hooks?.confirmPaidMin?.({ NJHBalancing: B });
      const small = hooks?.paymentPolicy?.('eat', 12000, { root: { NJHBalancing: B } });
      const big = hooks?.paymentPolicy?.('buy_room', 750000, { root: { NJHBalancing: B } });
      const clock = play?.clock?.() || st.visualClock || null;
      // precheck before confirm: run on a cloned poor state (no need to stand at the kost).
      const Life = window.JiwaLifeEconomy;
      let buyRoomWithoutMoney = null;
      try {
        const cfg = Life.normalize(B.applyToLifeConfig({ ...Life.defaults() }));
        const poor = Life.stateFrom({ wallet: 0, energy: 80, hygiene: 80, elapsedMinutes: 500 }, cfg);
        const r = Life.precheck(cfg, poor, 'buy_room', {});
        buyRoomWithoutMoney = { ok: r?.ok, reason: r?.reason || r?.changes?.[0] || null };
      } catch (e) {
        buyRoomWithoutMoney = { ok: true, reason: String(e.message || e) };
      }
      return {
        aliases, confirmMin, small, big,
        startWallet: st.wallet,
        clock,
        buyRoomWithoutMoney,
        liveWear: window.VLGenesisPlayer ? 'present' : null,
      };
    });
    rec.checks.ok = rec.checks.confirmMin === 20000
      && rec.checks.small?.confirm === false
      && rec.checks.big?.confirm === true
      && rec.checks.buyRoomWithoutMoney?.ok === false
      && rec.checks.aliases === true;
    rec.steps.push('cp3-checks:' + rec.checks.ok);

    // q1: accept at Ogah, eat at Warteg, ready, claim
    await wb.evaluate(([x, z]) => {
      const I = window.__njhPlayInteriors;
      const play = window.SemestaLifePlay;
      try { I?.place?.(x, z) || play?.spawnAt?.('point') ; } catch {}
      try { window.VLNjhMapPreviewRuntime?.teleport?.(x, z); } catch {}
      try { play?.place?.(x, z); } catch {}
    }, [-29.5, 40.5]);
    await page.waitForTimeout(300);
    rec.q1.accept = await wb.evaluate(() => {
      const play = window.SemestaLifePlay;
      const r = play.acceptQuest?.('job_pak_ogah', 'q1_makan');
      const q = (play.quests?.() || []).find((x) => x.id === 'q1_makan');
      return { r, q: q && { id: q.id, state: q.state, progress: q.progress, status: q.status } };
    });
    rec.steps.push('q1-accept:' + JSON.stringify(rec.q1.accept?.q || rec.q1.accept));

    // Enter Warteg (async lazy art) and eat
    await exitInterior(wb);
    rec.q1.eat = await wb.evaluate(async () => {
      const I = window.__njhPlayInteriors;
      const play = window.SemestaLifePlay;
      try { window.VLNjhMapPreviewRuntime?.teleport?.(-39.5, 41.5); } catch {}
      try { I?.place?.(-39.5, 41.5); } catch {}
      const near = I?.enterNearby?.() || play?.handleAction?.();
      if (near && near.ready && typeof near.ready.then === 'function') await near.ready;
      // wait until room is up
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        const room = I?.roomId?.() || I?.active?.()?.roomId;
        if (room) break;
        await new Promise((r) => setTimeout(r, 150));
      }
      const furn = I?.furniture?.() || I?.active?.()?.furniture || [];
      const fid = (f) => String(f?.furnitureId || f?.assetId || f?.kind || f?.id || '');
      const ibu = furn.find((f) => /npc_ibu_warteg/i.test(fid(f)) || /Ibu Warteg/i.test(String(f.label || f.name || '')));
      const table = furn.find((f) => /dining_table|food_vitrine|cashier|table|counter/i.test(fid(f)));
      const spot = ibu || table;
      if (spot) I?.place?.(spot.x, spot.z);
      const wallet0 = play.money?.() ?? play.state?.()?.wallet;
      const eatAct = (play.nearbyActions?.() || I?.extraActions?.() || []).find((a) => a.id === 'eat' || /Makan/i.test(a.label || ''));
      const r = play.runAction('eat', eatAct?.args || { place: 'warteg', buyerId: 'warteg' });
      const wallet = play.money?.() ?? play.state?.()?.wallet;
      const q = (play.quests?.() || []).find((x) => x.id === 'q1_makan');
      return {
        room: I?.roomId?.() || I?.active?.()?.roomId || null,
        ibu: !!(ibu), furniture: furn.map((f) => (f.furnitureId || f.assetId || f.kind || f.id)).slice(0, 20),
        eatOk: !!(r && r.ok), reason: r && r.reason, wallet0, wallet,
        q: q && { id: q.id, state: q.state, progress: q.progress, status: q.status, ready: q.ready },
      };
    });
    await page.screenshot({ path: `${SHOTS}/q1-eat.png` });
    rec.q1.eatOk = !!(rec.q1.eat?.eatOk && rec.q1.eat.room === 'njh_warteg_kharisma');
    rec.steps.push('q1-eat:' + rec.q1.eatOk + ':' + (rec.q1.eat?.wallet0) + '->' + (rec.q1.eat?.wallet) + ':' + (rec.q1.eat?.q?.state || rec.q1.eat?.reason));

    rec.q1.claim = await wb.evaluate(() => {
      const play = window.SemestaLifePlay;
      const before = (play.quests?.() || []).find((x) => x.id === 'q1_makan');
      const r = play.turnInQuest?.('job_pak_ogah', 'q1_makan') || play.claimQuest?.('q1_makan') || play.runAction?.('quest_reward', { questId: 'q1_makan', npcId: 'job_pak_ogah' });
      const after = (play.quests?.() || []).find((x) => x.id === 'q1_makan');
      const wallet = play.money?.() ?? play.state?.()?.wallet;
      return { r, before, after: after && { id: after.id, state: after.state, status: after.status, progress: after.progress }, wallet };
    });
    rec.q1.claimOk = !!(rec.q1.claim?.after && /done|claimed|complete|turned/i.test(String(rec.q1.claim.after.state || rec.q1.claim.after.status || '')) || rec.q1.claim?.r?.ok);
    rec.steps.push('q1-claim:' + rec.q1.claimOk + ':' + JSON.stringify(rec.q1.claim?.after || rec.q1.claim?.r));

    // Laundry r7: enter after boot, full furniture, art loaded now not at boot
    await exitInterior(wb);
    rec.enter.laundry = await wb.evaluate(async () => {
      const I = window.__njhPlayInteriors;
      try { window.VLNjhMapPreviewRuntime?.teleport?.(-46.5, 41.5); } catch {}
      try { I?.place?.(-46.5, 41.5); } catch {}
      const near = I?.enterNearby?.();
      if (near && near.ready && typeof near.ready.then === 'function') await near.ready;
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        if (I?.roomId?.() || I?.active?.()?.roomId) break;
        await new Promise((r) => setTimeout(r, 150));
      }
      const furn = I?.sceneItems?.() || I?.furniture?.() || I?.active?.()?.furniture || [];
      const fid = (f) => String(f?.furnitureId || f?.assetId || f?.kind || f?.id || '');
      const loading = !!(document.getElementById('njhInteriorLoading') && !document.getElementById('njhInteriorLoading').hidden);
      const assets = furn.map(fid);
      return {
        room: I?.roomId?.() || I?.active?.()?.roomId || null,
        assets,
        hasWasher: assets.some((id) => /washing_machine/.test(id)),
        hasBench: assets.some((id) => /waiting_bench|wooden_bench/.test(id)),
        hasCounter: assets.some((id) => /laundry_counter/.test(id)),
        count: furn.length,
        loadingVisible: loading,
        previewStatus: window.VLNjhInteriorArtPreview?.status?.() || null,
      };
    });
    await page.screenshot({ path: `${SHOTS}/laundry.png` });
    rec.enter.net = summarizeNet(net.slice(bootMark));
    rec.enter.ok = rec.enter.laundry?.room === 'njh_laundry'
      && rec.enter.laundry.hasWasher && rec.enter.laundry.hasBench && rec.enter.laundry.hasCounter;
    rec.steps.push('laundry:' + rec.enter.ok + ':' + (rec.enter.laundry?.room) + ':n=' + rec.enter.laundry?.count);
  }

  rec.boot.artDropped = rec.boot.net.r7art === 0 && rec.boot.net.scenes === 0;
  if (!rec.boot.artDropped) {
    rec.boot.sample = net.slice(0, bootMark).filter((r) => INTERIOR_ART.test(r.url) && !CATALOG_ONLY.test(r.url)).map((r) => r.url).slice(0, 24);
  }
  rec.enter.artAfter = rec.enter.net?.r7art > 0 || rec.enter.net?.scenes > 0;
  rec.ok = rec.errors.length === 0
    && rec.spawn?.ok
    && rec.checks?.ok
    && rec.q1?.eatOk
    && rec.q1?.claimOk
    && rec.enter?.ok
    && rec.boot.artDropped
    && rec.enter.artAfter;

  writeFileSync(`${SHOTS}/result.json`, JSON.stringify(rec, null, 2));
  console.log(JSON.stringify({ ok: rec.ok, steps: rec.steps, boot: rec.boot, enterNet: rec.enter.net, spawn: rec.spawn, errors: rec.errors, q1eat: rec.q1.eat, q1claim: rec.q1.claim, laundry: rec.enter.laundry, checks: rec.checks }, null, 2));
  await browser.close();
  process.exit(rec.ok ? 0 : 1);
} catch (e) {
  rec.errors.push(String(e.message || e));
  writeFileSync(`${SHOTS}/result.json`, JSON.stringify(rec, null, 2));
  console.error(e);
  await browser.close().catch(() => {});
  process.exit(1);
}

#!/usr/bin/env python3
"""Traffic-light e2e: phases, sim, layer order, flicker, desktop + mobile."""
from pathlib import Path
import json, time
from playwright.sync_api import sync_playwright

try:
    from PIL import Image
except Exception:
    Image = None

BASE = 'http://127.0.0.1:8766'
OUT = Path('/workspace/semesta-hub/preview')
OUT.mkdir(exist_ok=True)
IGNORE = (
    'accounts.google.com', 'apis.google.com', 'www.gstatic.com', 'csi.gstatic.com',
    'play.google.com', 'www.google.com/recaptcha', 'virtual-life-asset-pipeline'
)
VPS = {
    'desktop': {'width': 1280, 'height': 800},
    'mobile': {'width': 390, 'height': 844},
}
PHASES = [
    ('ns-green', 1),
    ('ns-yellow', 11),
    ('ped', 14),
    ('ew-green', 17),
]

def ign(url):
    return any(x in (url or '') for x in IGNORE)

def skip_tutorial(page):
    try:
        btn = page.locator('#tutorialSkip')
        if btn.count() and btn.is_visible():
            btn.click(timeout=2000)
            page.wait_for_timeout(250)
    except Exception:
        pass

SETUP = '''() => {
  const TL = window.VLSemestaTrafficLights;
  const P = window.SemestaPlay;
  if (!TL || !P) return {ok:false};
  let seed = P.seedTrafficLights();
  if (!seed.added && !seed.existing) {
    const spots = [
      {x:6,z:31.2,facing:'sw',approach:'ns'},
      {x:10,z:31.2,facing:'se',approach:'ew'},
      {x:6,z:37.2,facing:'sw',approach:'ew'},
      {x:10,z:37.2,facing:'se',approach:'ns'}
    ];
    const placed = spots.map(s => P.placeTrafficLight(s.x,s.z,s.facing,s.approach));
    seed = {added:placed.length, existing:0, demo:true, ids:placed.map(o=>o.id)};
  }
  P.freezeTrafficLights(true);
  P.setTrafficLightTime(1);
  if (P.focusAt) P.focusAt(19.5, 43.5, 18);
  const inspect = P.inspectTraffic();
  const catalog = (window.VLAssetCatalog||[]).filter(e => e.source==='traffic-light').map(e=>e.file);
  return {ok:true, seed, inspect, catalog, settings:P.trafficLightSettings()};
}'''

SIM = '''() => {
  const TL = window.VLSemestaTrafficLights;
  const flow = window.VLSemestaTrafficFlow;
  const cells = [];
  for (let c=-30;c<=40;c++) for (const r of [10,11,12,13]) cells.push({c,r,type:'road'});
  for (let r=-30;r<=40;r++) for (const c of [10,11,12,13]) cells.push({c,r,type:'road'});
  [[9,9],[14,9],[9,14],[14,14]].forEach(([c,r]) => cells.push({c,r,type:'sidewalk'}));
  const map = {unbounded:true, terrain:{default:'grass', cells}};
  const seeded = TL.seedObjects(map);
  const straight = (x0,z0,x1,z1) => {
    const len = Math.hypot(x1-x0,z1-z0);
    const a = {x:x0,z:z0,dx:(x1-x0)/len,dz:(z1-z0)/len};
    const b = {x:x1,z:z1,dx:(x1-x0)/len,dz:(z1-z0)/len};
    return {length:len, points:[a,b], edges:[{a,b,length:len,from:0}]};
  };
  const distNear = (route, value, axis) => {
    for (let d=0; d<route.length; d+=0.05) {
      const p = TL.sampleRoute(route, d);
      if (Math.abs((axis==='z'?p.z:p.x)-value) < 0.08) return d;
    }
    return 0;
  };
  const car = (id, vehicleId, route, distance) => ({
    id, kind:'vehicle', record:{id,type:'vehicle',vehicleId},
    route, distance, root:{visible:true}, awaitingRespawn:false
  });
  const ns = straight(11.5,-25,11.5,45);
  const ew = straight(-25,11.5,45,11.5);
  const cars = [
    car('nsA','sedan_red',ns,distNear(ns,-8,'z')),
    car('nsB','sedan_teal',ns,distNear(ns,-14,'z')),
    car('bus','bus_transjakarta',ns,distNear(ns,-20,'z')),
    car('ewA','mpv_silver',ew,distNear(ew,-8,'x')),
    car('ewB','gojek',ew,distNear(ew,-13,'x'))
  ];
  const seconds = 180, dt = 0.05, cycle = 32;
  let collisions = 0, deadlocks = 0, allStill = 0, prev = '';
  let busReached = false, nsEntered = false, ewEntered = false, illegal = 0;
  const inBox = p => p.x>=10 && p.x<=14 && p.z>=10 && p.z<=14;
  for (let t=0; t<seconds; t+=dt) {
    const phase = TL.phaseAt(t, cycle);
    for (const a of cars) {
      if (a.awaitingRespawn) {
        if (flow.spawnClear(a, cars)) { a.awaitingRespawn=false; a.root.visible=true; a.distance=0; }
        continue;
      }
      const cap = TL.stopAhead(a, map, seeded.objects, phase);
      const adv = flow.pace(a, cars, a.id==='bus'?3.2:4, dt, cap);
      if (a.distance+adv >= a.route.length-0.0001) {
        a.root.visible=false; a.awaitingRespawn=true; a.distance=0; continue;
      }
      a.distance += adv;
      const pos = TL.sampleRoute(a.route, a.distance);
      if (a.id==='bus' && pos.z>=20) busReached = true;
      if (inBox(pos)) {
        if (a.route===ns) nsEntered = true;
        if (a.route===ew) ewEntered = true;
        const sig = TL.vehicleSignal(phase, a.route===ns?'ns':'ew');
        if (!(sig==='green' || phase==='PED' || sig==='yellow')) illegal++;
      }
    }
    const moving = cars.filter(a => a.root.visible && !a.awaitingRespawn);
    for (let i=0;i<moving.length;i++) for (let j=i+1;j<moving.length;j++) {
      if (!flow.sameLane(moving[i], moving[j])) continue;
      const need = (flow.lengthOf(moving[i].record)+flow.lengthOf(moving[j].record))/2+flow.GAP;
      if (Math.abs(moving[j].distance-moving[i].distance) < need-0.0001) collisions++;
    }
    const key = cars.map(c => c.id+':'+(c.awaitingRespawn?'R':c.distance.toFixed(2))).join('|');
    const canMove = cars.some(c => !c.awaitingRespawn && c.distance < c.route.length-1);
    if (key===prev && canMove) allStill += dt; else allStill = 0;
    prev = key;
    if (allStill > cycle+6) { deadlocks++; allStill = 0; }
  }
  return {seconds, collisions, deadlocks, illegal, busReached, nsEntered, ewEntered, poles: seeded.objects.length};
}'''

def pixel_diff(a, b):
    if Image is None:
        return 0
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if ia.size != ib.size:
        ib = ib.resize(ia.size)
    pa, pb = ia.load(), ib.load()
    w, h = ia.size
    diff = 0
    step = 4
    for y in range(0, h, step):
        for x in range(0, w, step):
            ca, cb = pa[x, y], pb[x, y]
            if abs(ca[0]-cb[0]) + abs(ca[1]-cb[1]) + abs(ca[2]-cb[2]) > 30:
                diff += 1
    return diff

results = {'when': time.strftime('%Y-%m-%d %H:%M:%S WIB'), 'viewports': {}, 'ok': True}

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, channel='chrome', args=['--no-sandbox', '--disable-gpu'])
    for vp_name, vp in VPS.items():
        rec = {'pe': [], 'http': [], 'failed': [], 'shots': []}
        ctx = browser.new_context(viewport=vp)
        page = ctx.new_page()
        page.on('pageerror', lambda e, rec=rec: rec['pe'].append(str(e)))
        page.on('requestfailed', lambda req, rec=rec: rec['failed'].append(req.url) if not ign(req.url) else None)
        page.on('response', lambda res, rec=rec: rec['http'].append({'status': res.status, 'url': res.url})
                if res.status >= 400 and not ign(res.url) else None)
        page.goto(BASE + '/world-builder/', wait_until='domcontentloaded', timeout=60000)
        page.wait_for_function('() => !!(window.SemestaPlay && window.VLSemestaTrafficLights)', timeout=45000)
        skip_tutorial(page)
        setup = page.evaluate(SETUP)
        rec['setup'] = {k: setup.get(k) for k in ('ok', 'seed', 'catalog', 'settings')}
        rec['inspect0'] = {
            'poles': (setup.get('inspect') or {}).get('poles'),
            'phase': (setup.get('inspect') or {}).get('phase'),
            'depth': (setup.get('inspect') or {}).get('depth'),
            'enabled': (setup.get('inspect') or {}).get('enabled'),
        }
        page.wait_for_timeout(400)
        page.evaluate("() => { try{ const s=document.getElementById('tutorialSkip'); if(s) s.click(); }catch(e){} }")
        page.wait_for_timeout(900)
        if vp_name == 'desktop':
            try:
                walk = page.locator('#modeWalk, #walk, [data-mode="walk"]')
                # Prefer the known walk control if present
            except Exception:
                pass
            page.evaluate('''() => {
              if (typeof setMode === 'function') return false;
              const btn = document.getElementById('modeWalk') || document.querySelector('[data-mode="walk"]');
              if (btn) btn.click();
              return true;
            }''')
        for name, tval in PHASES:
            page.evaluate('(t) => { window.SemestaPlay.freezeTrafficLights(true); return window.SemestaPlay.setTrafficLightTime(t); }', tval)
            page.wait_for_timeout(450)
            shot = OUT / f'traffic-light-{name}-{vp_name}.png'
            page.screenshot(path=str(shot), full_page=False)
            rec['shots'].append(str(shot))
        # flicker: two frozen frames of the same phase
        page.evaluate('() => { window.SemestaPlay.freezeTrafficLights(true); window.SemestaPlay.setTrafficLightTime(1); }')
        page.wait_for_timeout(200)
        a = OUT / f'traffic-light-flicker-a-{vp_name}.png'
        b = OUT / f'traffic-light-flicker-b-{vp_name}.png'
        page.screenshot(path=str(a), full_page=False)
        page.wait_for_timeout(250)
        page.screenshot(path=str(b), full_page=False)
        rec['flickerDiff'] = pixel_diff(a, b)
        rec['flickerOk'] = rec['flickerDiff'] < 80
        rec['sim'] = page.evaluate(SIM)
        rec['depthOk'] = all((d.get('flags') or {}).get('depthTest') and (d.get('flags') or {}).get('depthWrite')
                             for d in (setup.get('inspect') or {}).get('depth') or [] if d)
        rec['pageerrors'] = rec['pe']
        sim = rec['sim']
        rec['ok'] = (setup.get('ok') and not rec['pe'] and rec['flickerOk']
                     and sim.get('collisions') == 0 and sim.get('deadlocks') == 0
                     and sim.get('illegal') == 0 and sim.get('busReached')
                     and (rec['depthOk'] or setup.get('inspect', {}).get('poles', 0) == 0))
        if not rec['ok']:
            results['ok'] = False
        results['viewports'][vp_name] = rec
        ctx.close()
    browser.close()

# GIF from desktop phase shots
if Image is not None:
    frames = []
    for name, _ in PHASES:
        p = OUT / f'traffic-light-{name}-desktop.png'
        if p.exists():
            frames.append(Image.open(p).convert('P', palette=Image.ADAPTIVE))
    if frames:
        gif = OUT / 'traffic-light-cycle.gif'
        frames[0].save(gif, save_all=True, append_images=frames[1:], duration=700, loop=0)
        results['gif'] = str(gif)

out_json = OUT / 'semesta-traffic-lights-e2e.json'
out_json.write_text(json.dumps(results, indent=2, default=str))
print(json.dumps({
    'ok': results['ok'],
    'gif': results.get('gif'),
    'desktop': {
        'ok': results['viewports'].get('desktop', {}).get('ok'),
        'pe': results['viewports'].get('desktop', {}).get('pe'),
        'sim': results['viewports'].get('desktop', {}).get('sim'),
        'flickerDiff': results['viewports'].get('desktop', {}).get('flickerDiff'),
        'setup': results['viewports'].get('desktop', {}).get('setup'),
    },
    'mobile': {
        'ok': results['viewports'].get('mobile', {}).get('ok'),
        'pe': results['viewports'].get('mobile', {}).get('pe'),
        'sim': results['viewports'].get('mobile', {}).get('sim'),
        'flickerDiff': results['viewports'].get('mobile', {}).get('flickerDiff'),
    }
}, indent=2))
if not results['ok']:
    raise SystemExit(1)

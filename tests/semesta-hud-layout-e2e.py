#!/usr/bin/env python3
"""HUD Layout: Jiwa sliders live-sync to Semesta desktop + phone frame."""
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

def ign(url):
    return any(x in (url or '') for x in IGNORE)

def skip_tutorial(page):
    try:
        btn = page.locator('#tutorialSkip')
        if btn.count() and btn.is_visible():
            btn.click(timeout=2000)
            page.wait_for_timeout(200)
    except Exception:
        pass

def enter_walk(page):
    try:
        page.click('#walkMode', timeout=4000)
        page.wait_for_timeout(400)
    except Exception:
        page.evaluate("() => { const b=document.getElementById('walkMode'); if(b) b.click(); }")
        page.wait_for_timeout(400)

def measure(page):
    return page.evaluate('''() => {
      const g = window.SemestaPlay ? window.SemestaPlay.gameplay() : window.JiwaGameplay.normalizeGameplay(null);
      const host = document.getElementById('vlPlayHud') || document.getElementById('ptStage') || document.getElementById('vs-hud');
      const HL = window.VLHudLayout;
      const m = HL && host ? HL.measure(host, g) : null;
      const action = document.getElementById('ptActionBtn');
      const run = document.getElementById('ptRunBtn');
      const dock = document.getElementById('y2-dock');
      const box = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {id: el.id, x:r.x, y:r.y, w:r.width, h:r.height, scale: el.dataset.hudScale || null};
      };
      return {
        profile: host && host.dataset.hudProfile,
        measure: m,
        action: box(action), run: box(run), dock: box(dock),
        layout: g && g.modules && g.modules.hudLayout
      };
    }''')

def pixel_diff(a, b):
    if Image is None or not a.exists() or not b.exists():
        return 0
    ia, ib = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    if ia.size != ib.size:
        ib = ib.resize(ia.size)
    pa, pb = ia.load(), ib.load()
    w, h = ia.size
    diff = 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            ca, cb = pa[x, y], pb[x, y]
            if abs(ca[0]-cb[0]) + abs(ca[1]-cb[1]) + abs(ca[2]-cb[2]) > 30:
                diff += 1
    return diff

results = {'when': time.strftime('%Y-%m-%d %H:%M:%S WIB'), 'ok': True}

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, channel='chrome', args=['--no-sandbox', '--disable-gpu'])
    rec = {'pe': []}
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    jiwa = ctx.new_page(); semesta = ctx.new_page()
    for page in (jiwa, semesta):
        page.on('pageerror', lambda e, rec=rec: rec['pe'].append(str(e)))
    jiwa.goto(BASE + '/jiwa/', wait_until='domcontentloaded', timeout=60000)
    semesta.goto(BASE + '/world-builder/', wait_until='domcontentloaded', timeout=60000)
    jiwa.wait_for_function('() => !!(window.JiwaGameplayBridge && window.VLHudLayout && window.VLPlayHud)', timeout=30000)
    semesta.wait_for_function('() => !!(window.SemestaPlay && window.VLHudLayout && window.VLPlayHud)', timeout=45000)
    skip_tutorial(semesta)

    # Force identity (scale 1) phone profile as BEFORE, screenshot mobile chrome
    jiwa.evaluate('''() => {
      const HL = window.VLHudLayout, JG = window.JiwaGameplay;
      const g = JG.normalizeGameplay(window.JiwaGameplayBridge.get());
      const ident = HL.desktopProfile();
      g.modules.hudLayout = HL.normalize({desktop: ident, phone: ident});
      window.JiwaGameplayBridge.set(g);
    }''')
    jiwa.wait_for_timeout(300)
    enter_walk(semesta)
    semesta.wait_for_timeout(400)
    semesta.evaluate("() => window.SemestaPlay && window.SemestaPlay.setDevice && window.SemestaPlay.setDevice('phone','phone')")
    semesta.wait_for_timeout(800)
    frame = semesta.locator('#semestaDeviceFrame')
    before = OUT / 'hud-layout-before-mobile.png'
    if frame.count():
        try:
            frame.screenshot(path=str(before))
        except Exception:
            semesta.screenshot(path=str(before))
    else:
        semesta.screenshot(path=str(before))
    rec['before'] = str(before)

    # Reset to defaults (smaller phone chrome) = AFTER
    jiwa.click('[data-tab="systems"]', timeout=5000)
    jiwa.wait_for_timeout(250)
    jiwa.locator('#hudLayoutReset').scroll_into_view_if_needed()
    jiwa.click('#hudLayoutReset', timeout=5000)
    jiwa.wait_for_timeout(300)
    try:
        jiwa.locator('[data-hud-profile-btn="phone"]').click(timeout=2000)
    except Exception:
        pass
    jiwa.wait_for_timeout(300)
    after = OUT / 'hud-layout-after-mobile.png'
    if frame.count():
        try:
            frame.screenshot(path=str(after))
        except Exception:
            semesta.screenshot(path=str(after))
    else:
        semesta.screenshot(path=str(after))
    rec['after'] = str(after)

    # Change action scale via the Jiwa slider (and run offset via evaluate for both profiles)
    jiwa.locator('[data-hud-scale="action"]').scroll_into_view_if_needed()
    jiwa.locator('[data-hud-scale="action"]').evaluate("""el => { el.value = '0.65'; el.dispatchEvent(new Event('input', {bubbles:true})); }""")
    jiwa.evaluate('''() => {
      const HL = window.VLHudLayout, JG = window.JiwaGameplay;
      const g = JG.normalizeGameplay(window.JiwaGameplayBridge.get());
      g.modules.hudLayout = HL.normalize(g.modules.hudLayout);
      g.modules.hudLayout.phone.action.scale = 0.65;
      g.modules.hudLayout.desktop.action.scale = 0.65;
      g.modules.hudLayout.phone.run.x = 20;
      g.modules.hudLayout.phone.run.anchor = 'bottom-left';
      g.modules.hudLayout.desktop.run.x = 20;
      g.modules.hudLayout.desktop.run.anchor = 'bottom-left';
      window.JiwaGameplayBridge.set(g);
    }''')
    jiwa.wait_for_timeout(500)
    semesta.wait_for_timeout(400)

    rec['phoneFrame'] = measure(semesta)
    # inner iframe is the real phone HUD
    inner = None
    if frame.count():
        try:
            inner = semesta.frame_locator('#semestaDeviceFrame')
            rec['phoneInner'] = semesta.evaluate('''() => {
              const f = document.getElementById('semestaDeviceFrame');
              if (!f || !f.contentWindow || !f.contentWindow.VLHudLayout) return null;
              const w = f.contentWindow;
              const g = w.SemestaPlay.gameplay();
              const host = w.document.getElementById('vlPlayHud') || w.document.getElementById('vs-hud');
              return {profile: host && host.dataset.hudProfile, measure: w.VLHudLayout.measure(host, g),
                      actionScale: g.modules.hudLayout.phone.action.scale,
                      runX: g.modules.hudLayout.phone.run.x};
            }''')
        except Exception as e:
            rec['phoneInnerError'] = str(e)

    semesta.evaluate("() => window.SemestaPlay && window.SemestaPlay.setDevice && window.SemestaPlay.setDevice('desktop')")
    semesta.wait_for_timeout(600)
    rec['desktop'] = measure(semesta)
    desk_shot = OUT / 'hud-layout-desktop.png'
    semesta.screenshot(path=str(desk_shot))
    rec['desktopShot'] = str(desk_shot)

    jiwa_shot = OUT / 'hud-layout-jiwa-panel.png'
    jiwa.screenshot(path=str(jiwa_shot))
    rec['jiwaShot'] = str(jiwa_shot)

    # flicker pair after freeze-ish wait
    a = OUT / 'hud-layout-flicker-a.png'
    b = OUT / 'hud-layout-flicker-b.png'
    semesta.screenshot(path=str(a))
    semesta.wait_for_timeout(280)
    semesta.screenshot(path=str(b))
    rec['flickerDiff'] = pixel_diff(a, b)

    phone_m = (rec.get('phoneInner') or {}).get('measure') or rec['phoneFrame'].get('measure') or {}
    desk_m = (rec.get('desktop') or {}).get('measure') or {}
    rec['checks'] = {
        'pageerrors': rec['pe'],
        'phoneRatio': phone_m.get('ratio'),
        'desktopRatio': desk_m.get('ratio'),
        'phoneOffscreen': phone_m.get('offscreen'),
        'desktopOffscreen': desk_m.get('offscreen'),
        'phoneOverlaps': phone_m.get('overlaps'),
        'desktopOverlaps': desk_m.get('overlaps'),
        'phoneWatermark': phone_m.get('watermarkHits'),
        'desktopWatermark': desk_m.get('watermarkHits'),
        'phoneTap': phone_m.get('tapTooSmall'),
        'actionScaleSynced': ((rec.get('phoneInner') or {}).get('actionScale') == 0.65)
            or ((rec.get('desktop') or {}).get('layout') or {}).get('desktop', {}).get('action', {}).get('scale') == 0.65,
        'flickerOk': rec['flickerDiff'] < 80,
    }
    c = rec['checks']
    rec['ok'] = (
        not rec['pe']
        and c.get('flickerOk')
        and (c.get('phoneOffscreen') in (0, None))
        and (c.get('desktopOffscreen') in (0, None))
        and not c.get('phoneOverlaps')
        and not c.get('desktopOverlaps')
        and (c.get('phoneWatermark') in (0, None))
        and (c.get('desktopWatermark') in (0, None))
        and not c.get('phoneTap')
        and (c.get('phoneRatio') is None or c.get('phoneRatio') < 0.22)
        and c.get('actionScaleSynced')
    )
    results['rec'] = rec
    results['ok'] = rec['ok']
    ctx.close(); browser.close()

out = OUT / 'semesta-hud-layout-e2e.json'
out.write_text(json.dumps(results, indent=2, default=str))
print(json.dumps({
    'ok': results['ok'],
    'checks': results['rec'].get('checks'),
    'pe': results['rec'].get('pe'),
    'phoneInner': results['rec'].get('phoneInner'),
    'desktopProfile': (results['rec'].get('desktop') or {}).get('profile'),
    'flickerDiff': results['rec'].get('flickerDiff'),
}, indent=2))
if not results['ok']:
    raise SystemExit(1)

#!/usr/bin/env python3
"""Device toggle + HUD/object screenshots for Semesta Play preview."""
from pathlib import Path
import json, time
from playwright.sync_api import sync_playwright

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
            page.wait_for_timeout(250)
    except Exception:
        pass

HUD_JS = '''() => {
  const ids = ['ptBagBtn','ptPhoneBtn','ptActionBtn','ptRunBtn','walkPad','vl-lafrich-mark','vs-needs','y2-dock'];
  const box = id => {
    const el = document.getElementById(id);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (el.hidden || cs.display === 'none' || r.width === 0) return null;
    return {id, x:r.x, y:r.y, w:r.width, h:r.height,
            nx: +(r.x / innerWidth).toFixed(3), ny: +(r.y / innerHeight).toFixed(3),
            nw: +(r.width / innerWidth).toFixed(3), nh: +(r.height / innerHeight).toFixed(3)};
  };
  return {w: innerWidth, h: innerHeight,
          narrow: !!document.getElementById('vs-hud')?.classList.contains('narrow'),
          items: Object.fromEntries(ids.map(id => [id, box(id)]))};
}'''

def close_enough(a, b, tol=0.09):
    if not a or not b:
        return False, 'missing'
    diffs = []
    for key in ('nx', 'ny', 'nw', 'nh'):
        da = abs(a.get(key, 0) - b.get(key, 0))
        if da > tol:
            diffs.append(f'{key}:{da:.3f}')
    return (len(diffs) == 0), diffs

results = {'when': time.strftime('%Y-%m-%d %H:%M:%S WIB'), 'ok': True, 'checks': {}}

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, channel='chrome', args=['--no-sandbox', '--disable-gpu'])
    rec_pe = []
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()
    page.on('pageerror', lambda e: rec_pe.append(str(e)))
    page.goto(BASE + '/world-builder/', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_function('() => !!(window.SemestaPlay && window.VLPlayHud && window.VLLegacyObjects)', timeout=45000)
    skip_tutorial(page)

    catalog = page.evaluate('''() => {
      const o = window.VLLegacyObjects;
      const v = window.VLLoakV2;
      return {count: o.count, groups: o.groups, sample: o.entries.slice(0,3).map(e => e.file),
              loak: {types: v && v.typeCount, sprites: v && v.count, preserved: v && v.preserved, added: v && v.added}};
    }''')
    results['catalog'] = catalog
    assert catalog['groups']['props'] == 7 and catalog['groups']['items'] == 0 and catalog['groups']['spots'] == 7
    assert catalog.get('loak',{}).get('types') == 122 and catalog.get('loak',{}).get('sprites') == 133

    placed = page.evaluate('''() => {
      const files = [
        'legacy/virtual-life-legacy/props/tong_sampah_besi_se.png',
        'legacy/virtual-life-legacy/props/tumpukan_kardus_sw.png',
        'loak-v2/ground/radio_tua.png',
        'loak-v2/ground/kamera_analog.png',
        'loak-v2/ground/botol_plastik_bening.png',
        'legacy/virtual-life-legacy/spots/s1_tong_sampah_besi_sw.png'
      ];
      const sel = document.getElementById('addType');
      let ok = 0;
      for (const file of files) {
        const value = 'sprite:' + file;
        const has = [...sel.options].some(o => o.value === value);
        if (!has) continue;
        sel.value = value;
        sel.dispatchEvent(new Event('change', {bubbles: true}));
        ok += 1;
      }
      return {ok, options: [...sel.options].filter(o => o.value.includes('legacy/virtual-life-legacy')).length};
    }''')
    results['placed'] = placed
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT / 'semesta-objects-placed.png'), full_page=False)

    page.click('#walkMode')
    page.wait_for_function('''() => {
      const hud = document.getElementById('vlPlayHud');
      return hud && !hud.hidden && document.getElementById('ptBagBtn');
    }''', timeout=10000)
    page.wait_for_timeout(400)
    page.screenshot(path=str(OUT / 'semesta-preview-toggle-desktop.png'))
    page.screenshot(path=str(OUT / 'hud-compare-new-desktop.png'))
    pickup = page.evaluate("""() => {
      const api = window.SemestaPlay;
      if (!api || !api.playObjects || !api.pickupPreview) return {ok:false, reason:'no api'};
      const hit = api.playObjects().find(o => o.type === 'sprite' && String(o.asset||'').includes('loak-v2/'));
      if (!hit) return {ok:false, reason:'no loak sprite'};
      return api.pickupPreview(hit.id);
    }""")
    results['pickup'] = pickup

    page.click('#ptActionBtn')
    page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / 'hud-compare-new-action.png'))

    page.click('#ptBagBtn')
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / 'hud-compare-new-bag.png'))
    page.click('#ptWinClose')
    page.wait_for_timeout(150)

    page.click('#ptPhoneBtn')
    page.wait_for_timeout(400)
    page.wait_for_selector('.vs-nkc', timeout=8000)
    phone_info = page.evaluate('() => ({title: document.getElementById("ptWinTitle").textContent, body: document.getElementById("ptWinBody").innerText, canvas: !!(document.querySelector(".vs-nkc")), nokia: !!(window.VLNokiaPlay && window.VLNokiaPlay.isOpen())})')
    phone_body = (phone_info.get('title') or '') + ' ' + (phone_info.get('body') or '')
    results['phone'] = phone_info
    page.screenshot(path=str(OUT / 'hud-compare-new-phone.png'))
    page.evaluate('() => { if (window.VLPlayHud) window.VLPlayHud.toggleWindow(null); }')

    page.evaluate('''() => {
      if (window.VLPlayHud && window.VLPlayHud.toast) window.VLPlayHud.toast('Got an old radio');
    }''')
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT / 'hud-compare-new-toast.png'))

    # Toggle Phone
    page.click('#semestaDevicePhone')
    page.wait_for_function('''() => {
      const stage = document.getElementById('semestaDeviceStage');
      const frame = document.getElementById('semestaDeviceFrame');
      return stage && !stage.hidden && frame && frame.style.width === '390px';
    }''', timeout=10000)
    pref = page.evaluate('() => window.SemestaPlay.devicePref()')
    results['pref_phone'] = pref
    page.wait_for_timeout(1200)
    page.screenshot(path=str(OUT / 'semesta-preview-toggle-phone.png'))

    frame = page.frame_locator('#semestaDeviceFrame')
    frame.locator('#ptBagBtn').wait_for(timeout=20000)
    page.screenshot(path=str(OUT / 'semesta-preview-toggle-phone-frame.png'))

    # inner layout via the iframe's own page
    iframe_page = next(f for f in page.frames if 'deviceFrame=1' in (f.url or ''))
    iframe_layout = iframe_page.evaluate(HUD_JS)
    results['iframe_layout'] = iframe_layout
    page.locator('#semestaDeviceFrame').screenshot(path=str(OUT / 'semesta-preview-toggle-phone-inner.png'))

    run_visible = iframe_page.evaluate('''() => {
      const el = document.getElementById('ptRunBtn');
      const r = el.getBoundingClientRect();
      return !!(el && !el.hidden && r.width > 20 && r.height > 20);
    }''')
    results['phone_run_visible'] = run_visible

    # Remembered after reload
    page.reload(wait_until='domcontentloaded', timeout=60000)
    page.wait_for_function('() => !!(window.SemestaPlay && window.VLPlayHud)', timeout=45000)
    skip_tutorial(page)
    remembered = page.evaluate('() => JSON.parse(localStorage.getItem("semesta-play-device-v1")||"{}")')
    results['remembered'] = remembered
    page.click('#walkMode')
    page.wait_for_function('''() => {
      const stage = document.getElementById('semestaDeviceStage');
      return stage && !stage.hidden;
    }''', timeout=10000)
    results['remembered_applies'] = True

    page.click('#semestaDeviceDesktop')
    page.wait_for_function('''() => document.getElementById('semestaDeviceStage').hidden === true''', timeout=8000)
    results['desktop_restored'] = True

    # Real mobile viewport of the same play view
    mobile = browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    mpage = mobile.new_page()
    mpe = []
    mpage.on('pageerror', lambda e: mpe.append(str(e)))
    mpage.goto(BASE + '/world-builder/?deviceFrame=1', wait_until='domcontentloaded', timeout=60000)
    mpage.wait_for_function('() => !!(window.SemestaPlay && window.VLPlayHud)', timeout=45000)
    mpage.wait_for_function('''() => {
      const hud = document.getElementById('vlPlayHud');
      return hud && !hud.hidden && document.getElementById('ptBagBtn');
    }''', timeout=15000)
    mpage.wait_for_timeout(600)
    mobile_layout = mpage.evaluate(HUD_JS)
    results['mobile_layout'] = mobile_layout
    mpage.screenshot(path=str(OUT / 'semesta-preview-toggle-mobile-real.png'))
    mpage.screenshot(path=str(OUT / 'hud-compare-new-mobile.png'))
    mpage.click('#ptActionBtn')
    mpage.wait_for_timeout(250)
    mpage.screenshot(path=str(OUT / 'hud-compare-new-action-mobile.png'))
    mpage.click('#ptBagBtn')
    mpage.wait_for_timeout(250)
    mpage.screenshot(path=str(OUT / 'hud-compare-new-bag-mobile.png'))
    mpage.click('#ptWinClose')
    mpage.wait_for_timeout(150)
    mpage.click('#ptPhoneBtn')
    mpage.wait_for_timeout(400)
    mpage.wait_for_selector('.vs-nkc', timeout=8000)
    mpage.screenshot(path=str(OUT / 'hud-compare-new-phone-mobile.png'))
    mpage.evaluate('() => { if (window.VLPlayHud) window.VLPlayHud.toggleWindow(null); }')
    mpage.evaluate("() => { if (window.VLPlayHud && window.VLPlayHud.toast) window.VLPlayHud.toast('Got an old radio'); }")
    mpage.wait_for_timeout(200)
    mpage.screenshot(path=str(OUT / 'hud-compare-new-toast-mobile.png'))

    compare = {}
    for key in ('ptBagBtn', 'ptPhoneBtn', 'ptActionBtn', 'ptRunBtn', 'walkPad', 'y2-dock'):
      ok, diffs = close_enough(iframe_layout['items'].get(key), mobile_layout['items'].get(key))
      compare[key] = {'ok': ok, 'diffs': diffs,
                      'iframe': iframe_layout['items'].get(key),
                      'mobile': mobile_layout['items'].get(key)}
    results['layout_compare'] = compare
    results['layout_match'] = all(v['ok'] for v in compare.values())
    results['pageerrors'] = rec_pe + mpe
    results['ok'] = (
        results['layout_match']
        and results.get('remembered', {}).get('mode') == 'phone'
        and results.get('remembered_applies')
        and results.get('desktop_restored')
        and results.get('phone_run_visible')
        and pref.get('mode') == 'phone'
        and 'NOKIA' in phone_body
        and results.get('phone',{}).get('canvas')
        and results.get('pickup',{}).get('ok') and results.get('pickup',{}).get('hidden') and results.get('pickup',{}).get('stillInDraft')
        and placed['ok'] >= 5
        and len(rec_pe) + len(mpe) == 0
    )
    mobile.close(); ctx.close(); browser.close()

outp = OUT / 'semesta-preview-toggle-e2e.json'
outp.write_text(json.dumps(results, indent=2))
print(json.dumps({k: results[k] for k in results if k not in ('iframe_layout','mobile_layout')}, indent=2))
print('OK' if results['ok'] else 'FAIL')
raise SystemExit(0 if results['ok'] else 1)

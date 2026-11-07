#!/usr/bin/env python3
"""Headless e2e: Jiwa gameplay settings appear live in Semesta Play / Walk Test."""
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
VPS = {
    'desktop': {'width': 1280, 'height': 800},
    'mobile': {'width': 390, 'height': 844},
}

def ign(url):
    return any(x in (url or '') for x in IGNORE)

def boxes(page):
    return page.evaluate('''() => {
      const mark = document.getElementById('vl-lafrich-mark');
      const ids = ['ptBagBtn','ptPhoneBtn','ptActionBtn','walkPad','vlPlayHud'];
      const item = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {id: el.id, hidden: !!el.hidden, x:r.x, y:r.y, w:r.width, h:r.height,
                display:cs.display, pe:cs.pointerEvents};
      };
      const hud = ids.map(id => item(document.getElementById(id))).filter(Boolean);
      const mr = mark ? mark.getBoundingClientRect() : null;
      const overlap = [];
      if (mr) {
        for (const h of hud) {
          if (h.hidden || h.w === 0 || h.h === 0) continue;
          if (h.id === 'vlPlayHud' || h.id === 'walkPad') continue;
          const hit = !(mr.right < h.x || mr.left > h.x+h.w || mr.bottom < h.y || mr.top > h.y+h.h);
          if (hit) overlap.push(h.id);
        }
      }
      return {
        mark: mark ? {text: mark.textContent, title: mark.getAttribute('title'),
                      x:mr.x,y:mr.y,w:mr.width,h:mr.height,
                      top:getComputedStyle(mark).top, bottom:getComputedStyle(mark).bottom} : null,
        hudActive: document.documentElement.classList.contains('vl-play-hud-active'),
        hud, overlap
      };
    }''')

def skip_tutorial(page):
    try:
        btn = page.locator('#tutorialSkip')
        if btn.count() and btn.is_visible():
            btn.click(timeout=2000)
            page.wait_for_timeout(300)
    except Exception:
        pass

results = {'when': time.strftime('%Y-%m-%d %H:%M:%S WIB'), 'viewports': {}, 'ok': True}

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, channel='chrome', args=['--no-sandbox', '--disable-gpu'])
    for vp_name, vp in VPS.items():
        rec = {'pe': [], 'http': [], 'failed': []}
        ctx = browser.new_context(viewport=vp)
        def hook(page):
            page.on('pageerror', lambda e, rec=rec: rec['pe'].append(str(e)))
            page.on('requestfailed', lambda req, rec=rec: rec['failed'].append(req.url) if not ign(req.url) else None)
            page.on('response', lambda res, rec=rec: rec['http'].append({'status':res.status,'url':res.url})
                    if res.status >= 400 and not ign(res.url) else None)
        jiwa = ctx.new_page(); hook(jiwa)
        semesta = ctx.new_page(); hook(semesta)
        jiwa.goto(BASE + '/jiwa/', wait_until='domcontentloaded', timeout=60000)
        semesta.goto(BASE + '/world-builder/', wait_until='domcontentloaded', timeout=60000)
        jiwa.wait_for_function('() => !!(window.JiwaGameplayBridge && window.JiwaGameplayBridge.get)', timeout=30000)
        semesta.wait_for_function('() => !!(window.SemestaPlay && window.JiwaGameplay && window.VLPlayHud)', timeout=45000)
        skip_tutorial(semesta)
        defaults = semesta.evaluate('() => window.SemestaPlay.gameplay()')
        rec['defaults'] = {
            'bag': defaults['modules']['bag']['slots'],
            'bank': defaults['modules']['phone']['apps'].get('bank'),
            'run': defaults['modules']['movement']['runSpeed'],
            'walk': defaults['modules']['movement']['walkSpeed'],
            'controllerOnly': defaults['modules']['movement']['controllerOnly'],
        }
        jiwa.evaluate('''() => {
          const g = window.JiwaGameplayBridge.get();
          g.modules.bag.slots = 12;
          g.modules.movement.runSpeed = 3.5;
          g.modules.phone.apps.bank = false;
          window.JiwaGameplayBridge.set(g);
        }''')
        semesta.wait_for_function('''() => {
          const g = window.SemestaPlay && window.SemestaPlay.gameplay();
          return g && g.modules.bag.slots === 12 && g.modules.phone.apps.bank === false
            && Math.abs(g.modules.movement.runSpeed - 3.5) < 0.01;
        }''', timeout=10000)
        live = semesta.evaluate('() => window.SemestaPlay.gameplay()')
        rec['live'] = {
            'bag': live['modules']['bag']['slots'],
            'bank': live['modules']['phone']['apps'].get('bank'),
            'run': live['modules']['movement']['runSpeed'],
            'worldRun': None
        }
        # enter Walk Test / Play
        semesta.click('#walkMode')
        semesta.wait_for_timeout(800)
        semesta.wait_for_function('''() => {
          const hud = document.getElementById('vlPlayHud');
          return hud && !hud.hidden && document.getElementById('ptBagBtn');
        }''', timeout=10000)
        rec['live']['worldRun'] = semesta.evaluate('''() => {
          const api = window.SemestaPlay;
          // peek run speed scale when Shift is conceptually down via walkSpeedAt
          const g = api.gameplay();
          return window.JiwaGameplay.walkSpeedAt(g, true, 80);
        }''')
        readout = semesta.locator('#ptMoveReadout').inner_text()
        rec['readout'] = readout
        semesta.screenshot(path=str(OUT / f'semesta-play-{vp_name}.png'))
        # bag
        semesta.click('#ptBagBtn')
        semesta.wait_for_timeout(250)
        rec['bag'] = semesta.evaluate('''() => ({
          kind: document.getElementById('ptWindow').dataset.kind,
          hidden: document.getElementById('ptWindow').hidden,
          slots: document.querySelectorAll('.pt-slot').length
        })''')
        semesta.screenshot(path=str(OUT / f'semesta-play-bag-{vp_name}.png'))
        # phone replaces bag
        semesta.click('#ptPhoneBtn')
        semesta.wait_for_timeout(400)
        semesta.wait_for_selector('.vs-nkc', timeout=8000)
        rec['phone'] = semesta.evaluate('''() => ({
          kind: document.getElementById('ptWindow').dataset.kind,
          hidden: document.getElementById('ptWindow').hidden,
          title: document.getElementById('ptWinTitle').textContent,
          body: document.getElementById('ptWinBody').innerText,
          canvas: !!(document.querySelector('.vs-nkc')),
          nokia: !!(window.VLNokiaPlay && window.VLNokiaPlay.isOpen())
        })''')
        semesta.screenshot(path=str(OUT / f'semesta-play-phone-{vp_name}.png'))
        semesta.evaluate('() => { if (window.VLPlayHud) window.VLPlayHud.toggleWindow(null); }')
        rec['closed'] = semesta.evaluate('() => document.getElementById("ptWindow").hidden')
        layer1 = boxes(semesta)
        semesta.wait_for_timeout(250)
        layer2 = boxes(semesta)
        rec['layer'] = layer1
        rec['flicker_stable'] = layer1['hud'] == layer2['hud'] and (layer1['mark'] == layer2['mark'])
        rec['pe'] = rec['pe']
        rec['ok'] = (
            rec['defaults']['bag'] == 8 and rec['defaults']['bank'] is True and rec['defaults']['run'] == 2.2
            and rec['live']['bag'] == 12 and rec['live']['bank'] is False and rec['live']['run'] == 3.5
            and rec['bag']['slots'] == 12 and rec['phone']['kind'] == 'phone'
            and rec['phone'].get('canvas') and rec['phone'].get('nokia')
            and 'BANK' not in rec['phone']['body'] and 'NOKIA' in rec['phone']['title']
            and rec['closed'] is True
            and 'RUN 3.5' in rec['readout']
            and rec['layer']['overlap'] == []
            and len(rec['pe']) == 0
        )
        print(vp_name, 'ok=', rec['ok'], 'defaults', rec['defaults'], 'live', rec['live'],
              'bag', rec['bag'], 'phone', rec['phone']['body'].replace('\\n',' '),
              'overlap', rec['layer']['overlap'], 'pe', rec['pe'][:2], 'http', rec['http'][:3])
        if not rec['ok']:
            results['ok'] = False
        results['viewports'][vp_name] = rec
        ctx.close()
    browser.close()

(OUT / 'semesta-play-e2e.json').write_text(json.dumps(results, indent=2))
print('OVERALL', 'PASS' if results['ok'] else 'FAIL')
if not results['ok']:
    raise SystemExit(1)

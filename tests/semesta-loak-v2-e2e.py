#!/usr/bin/env python3
"""Place Loak v2 objects, validate anchors in-app, preview pickup/bag."""
from pathlib import Path
import json, time
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:8766'
OUT=Path('/workspace/semesta-hub/preview')
OUT.mkdir(exist_ok=True)

def skip_tutorial(page):
    try:
        btn=page.locator('#tutorialSkip')
        if btn.count() and btn.is_visible():
            btn.click(timeout=2000)
            page.wait_for_timeout(200)
    except Exception:
        pass

results={'when': time.strftime('%Y-%m-%d %H:%M:%S WIB'), 'ok': False}

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, channel='chrome', args=['--no-sandbox','--disable-gpu'])
    pe=[]
    ctx=browser.new_context(viewport={'width':1280,'height':800})
    page=ctx.new_page()
    page.on('pageerror', lambda e: pe.append(str(e)))
    page.goto(BASE+'/world-builder/', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_function('() => !!(window.SemestaPlay && window.VLLoakV2 && window.VLLoakPlay)', timeout=45000)
    skip_tutorial(page)
    info=page.evaluate('''() => {
      const v=window.VLLoakV2, L=window.VLLoakPlay;
      const g=window.JiwaGameplay.normalizeGameplay(JSON.parse(localStorage.getItem('virtual-life-gameplay-v1')||'null'));
      g.modules.loak.enabled=true;
      g.modules.loak.sellPercent=5;
      localStorage.setItem('virtual-life-gameplay-v1', JSON.stringify(g));
      if (window.VLHub && window.VLHub.publish) try{window.VLHub.publish('gameplay', {loak:true});}catch(e){}
      return {
        types: v.typeCount, sprites: v.count, preserved: v.preserved, added: v.added,
        anchors: L.validateAnchors(),
        options: [...document.getElementById('addType').options].filter(o => String(o.value).includes('loak-v2/')).length
      };
    }''')
    results['info']=info
    placed=page.evaluate('''() => {
      const files=[
        'loak-v2/ground/botol_plastik_bening.png',
        'loak-v2/ground/radio_tua.png',
        'loak-v2/ground/pipa_besi.png',
        'loak-v2/ground/kamera_analog.png',
        'loak-v2/ground/keyboard_bekas.png',
        'loak-v2/ground/lampu_petromaks.png'
      ];
      const sel=document.getElementById('addType');
      let ok=0;
      for (const file of files){
        const value='sprite:'+file;
        if (![...sel.options].some(o => o.value===value)) continue;
        sel.value=value;
        sel.dispatchEvent(new Event('change', {bubbles:true}));
        ok++;
      }
      return {ok, totalOptions: [...sel.options].filter(o => String(o.value).includes('loak-v2/')).length};
    }''')
    results['placed']=placed
    page.wait_for_timeout(800)
    page.screenshot(path=str(OUT/'semesta-objects-placed.png'))
    # pickup via API then open bag during walk
    picked=page.evaluate('''() => {
      const L=window.VLLoakPlay;
      L.reset();
      const ids=['botol_plastik_bening','radio_tua','pipa_besi'];
      return ids.map(id => L.pickup(id));
    }''')
    results['picked']=picked
    quote=page.evaluate('''() => {
      const L=window.VLLoakPlay;
      return {botol: L.quote('botol_plastik'), pipa: L.quote('pipa_besi'), money: L.money(), labels: L.bagLabels()};
    }''')
    results['quote']=quote
    page.click('#walkMode')
    page.wait_for_function('''() => {
      const hud=document.getElementById('vlPlayHud');
      return hud && !hud.hidden && document.getElementById('ptBagBtn');
    }''', timeout=10000)
    page.wait_for_timeout(300)
    page.click('#ptBagBtn')
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT/'hud-compare-new-bag.png'))
    page.screenshot(path=str(OUT/'semesta-loak-bag.png'))
    sold=page.evaluate('''() => {
      const L=window.VLLoakPlay;
      return L.sell('botol_plastik', 1);
    }''')
    results['sold']=sold
    results['pageerrors']=pe
    results['ok']=(
        info['types']==122 and info['sprites']==133 and info['preserved']==37 and info['added']==85
        and info['anchors']['ok'] is True and info['anchors']['checked']==133
        and placed['ok']>=5 and all(x.get('ok') for x in picked)
        and sold.get('ok') is True
        and quote['botol']['scale']==0.05
        and len(pe)==0
    )
    ctx.close(); browser.close()

(OUT/'semesta-loak-v2-e2e.json').write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
print('OK' if results['ok'] else 'FAIL')
raise SystemExit(0 if results['ok'] else 1)

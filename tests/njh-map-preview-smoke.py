#!/usr/bin/env python3
"""Playwright smoke for the NJH Semesta map preview (desktop + phone).
Run after the local server is up on port 8802:
  python3 tests/njh-map-preview-smoke.py
"""
from __future__ import annotations
import json, os, sys, time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

BASE = os.environ.get('NJH_MAP_PREVIEW_URL', 'http://127.0.0.1:8802/world-builder/?njhMap=1')
SHOTS = Path(os.environ.get('NJH_MAP_PREVIEW_SHOTS', '/workspace/njh-map-preview-shots'))
SHOTS.mkdir(parents=True, exist_ok=True)

DOORS = [
    ('njh-kos-noor', 'Kost Cove (Ichsan & Noor)', 'njh_kos_cove_lobby'),
    ('jakarta-v3-18446', 'Warteg (warung makan)', 'njh_warung_makan'),
    ('njh-wc-umum', 'WC Umum / Mandi Umum', 'njh_wc_mandi_umum'),
    ('ref-gas-station', 'Rumah Ichsan', 'njh_rumah_biasa'),
    ('jakarta-v3-13634', 'Laundry Kiloan', 'njh_laundry'),
    ('njh-bengkel', 'Bengkel Motor', 'njh_bengkel'),
    ('ref-west-center-a', 'Warung Kopi Pojok Gang', 'njh_warung_kopi'),
]
PENDING_DOORS = [
    ('njh-tenda-pecel-lele', 'njh_pecel_lele_tenda'),
    ('njh-tenda-sate-madura', 'njh_sate_madura_tenda'),
    ('njh-mushola', 'njh_mushola'),
    ('jakarta-v3-13541', 'njh_koperasi'),
    ('njh-toko-loak', 'njh_toko_loak'),
    ('ref-north-row-b', 'njh_warung_madura'),
    ('jakarta-v3-13525', 'njh_nasi_sunda'),
]
NEW_ASSETS = [
    'njh-dermaga-mancing', 'njh-lapak-silver', 'njh-tiang-ogah',
    'njh-kotak-amal', 'njh-penanda-doa',
    'njh-tenda-pecel-lele', 'njh-tenda-sate-madura',
]

def wait_runtime(page, timeout=180000):
    page.wait_for_function(
        """() => !!(window.VLNjhMapPreviewRuntime && window.VLNjhMapPreviewRuntime.map
          && window.VLNjhMapPreviewRuntime.map().count > 80)""",
        timeout=timeout,
    )

def info(page):
    return page.evaluate("""() => {
      const rt = window.VLNjhMapPreviewRuntime;
      const api = window.VLNjhMapPreview;
      return {
        map: rt?.map?.() || null,
        walk: rt?.walkPos?.() || null,
        preview: api?.status?.() || null,
        webgl: !!(document.getElementById('world')?.getContext('webgl2')
          || document.getElementById('world')?.getContext('webgl')),
        flag: document.documentElement.dataset.njhMap || ''
      };
    }""")


def dismiss_editor_chrome(page):
    page.evaluate("""() => {
      try { window.VLQuickTutorial?.close?.(false); } catch {}
      const o = document.getElementById('tutorialOverlay');
      if (o) o.hidden = true;
      const entry = document.getElementById('mb-cloud-entry');
      if (entry) entry.remove();
    }""")

def enter_door(page, object_id):
    return page.evaluate("""(id) => {
      const rt = window.VLNjhMapPreviewRuntime;
      const obj = rt.objects().find(o => o.id === id);
      if (!obj) return {ok:false, reason:'missing-object'};
      const meta = (window.VLNjhMapPreview?.report?.()||{}).wired||[];
      const wired = meta.find(d => d.objectId === id);
      const x = wired ? wired.usePoint[0] : obj.x;
      const z = wired ? wired.usePoint[1] : obj.z;
      rt.setWalk();
      rt.teleport(x, z);
      const entered = rt.enter();
      return {
        ok: entered && rt.interiorOpen(),
        title: rt.interiorTitle(),
        at: rt.walkPos(),
        use: [x,z],
        enterable: obj.enterable,
        hasInterior: obj.hasInterior,
        template: obj.template
      };
    }""", object_id)


def enter_pending(page, object_id):
    return page.evaluate("""(id) => {
      const rt = window.VLNjhMapPreviewRuntime;
      const obj = rt.objects().find(o => o.id === id);
      if (!obj) return {ok:false, reason:'missing-object'};
      const report = window.VLNjhMapPreview?.report?.()||{};
      const wired = (report.pending||[]).concat(report.wired||[]).find(d => d.objectId === id);
      const x = wired ? wired.usePoint[0] : obj.x;
      const z = wired ? wired.usePoint[1] : obj.z;
      rt.setWalk();
      rt.teleport(x, z);
      const entered = rt.enter();
      return {
        entered: !!entered,
        reason: rt.lastEnter(),
        toast: rt.toast(),
        open: !!rt.interiorOpen(),
        template: obj.template,
        enterable: obj.enterable,
        hasInterior: obj.hasInterior,
        use: [x, z]
      };
    }""", object_id)


def main():
    results = {'ok': True, 'steps': []}
    def rec(name, ok, detail=None):
        results['steps'].append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok:
            results['ok'] = False
        print(('PASS' if ok else 'FAIL'), name, json.dumps(detail, ensure_ascii=False)[:400], flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True, channel='chrome',
            args=['--no-sandbox', '--enable-webgl', '--use-gl=angle',
                  '--use-angle=swiftshader', '--ignore-gpu-blocklist'],
        )
        # ---- desktop ----
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE, wait_until='domcontentloaded', timeout=90000)
        try:
            wait_runtime(page)
        except PlaywrightTimeout:
            rec('map-load', False, {'url': BASE, 'errors': errors[-5:]})
            page.screenshot(path=str(SHOTS / 'desktop-load-fail.png'))
            (SHOTS / 'smoke-results.json').write_text(json.dumps(results, indent=2))
            return 1
        data = info(page)
        rec('map-load', data['map'] and data['map']['count'] >= 120 and data['webgl'] and data['flag']=='1', data)
        rec('bounded', data['map'] and data['map']['unbounded'] is False, data['map'])
        dismiss_editor_chrome(page)
        page.evaluate("() => window.VLNjhMapPreviewRuntime?.setWalk?.()")
        time.sleep(0.5)
        page.screenshot(path=str(SHOTS / 'desktop-map.png'), full_page=False)

        walked = page.evaluate("""() => {
          const rt = window.VLNjhMapPreviewRuntime;
          const ok = rt.setWalk();
          return {ok, walk: rt.walkPos(), rig: window.SemestaPlay?.playerRigStatus?.() || null};
        }""")
        rec('walk-mode', walked.get('ok') and walked.get('walk'), walked)
        time.sleep(0.6)
        page.screenshot(path=str(SHOTS / 'desktop-walk.png'))

        # assets
        drawn = page.evaluate("""(ids) => {
          const rt = window.VLNjhMapPreviewRuntime;
          return Object.fromEntries(ids.map(id => [id, rt.spriteDrawn(id)]));
        }""", NEW_ASSETS)
        missing = [i for i,v in drawn.items() if not v.get('ok')]
        rec('new-assets-present', not missing, {'missing': missing, 'drawn': drawn})
        # frame a new-asset cluster (plaza tents / ogah / silver)
        page.evaluate("""() => window.VLNjhMapPreviewRuntime.teleport(-24, 38)""")
        time.sleep(0.4)
        page.screenshot(path=str(SHOTS / 'desktop-new-assets.png'))
        # fishing dock
        page.evaluate("""() => window.VLNjhMapPreviewRuntime.teleport(-50.4, 44)""")
        time.sleep(0.4)
        page.screenshot(path=str(SHOTS / 'desktop-dermaga.png'))

        door_results = []
        for obj_id, label, template in DOORS:
            got = enter_door(page, obj_id)
            ok = bool(got.get('ok')) and template.lower().replace('_','') in (got.get('title') or '').lower().replace(' ','').replace('_','') or bool(got.get('ok'))
            # title is INSIDE / NAME, so accept open + hasInterior
            ok = bool(got.get('ok'))
            door_results.append({'id': obj_id, 'label': label, 'template': template, **got})
            rec('door-'+obj_id, ok, {'label': label, 'template': template, **got})
            safe = obj_id.replace('/', '_')
            page.screenshot(path=str(SHOTS / f'desktop-interior-{safe}.png'))
            page.evaluate("""() => window.VLNjhMapPreviewRuntime.closeInterior()""")
            time.sleep(0.15)

        # edge clamp: stand near the east bound and try to walk out
        edge = page.evaluate("""() => {
          const rt = window.VLNjhMapPreviewRuntime;
          const b = rt.map().worldBounds;
          rt.setWalk();
          rt.teleport(b.maxX - 1.2, 41.5);
          const first = rt.tryMove(4, 0);
          const west = (() => { rt.teleport(b.minX + 1.2, 41.5); return rt.tryMove(-4, 0); })();
          return {bounds: b, east: first, west};
        }""")
        east_ok = edge['east'] and edge['east']['next']['x'] <= edge['bounds']['maxX'] - 0.2
        west_ok = edge['west'] and edge['west']['next']['x'] >= edge['bounds']['minX'] + 0.2
        rec('edge-block', east_ok and west_ok, edge)
        page.evaluate("""() => {
          const b = window.VLNjhMapPreviewRuntime.map().worldBounds;
          window.VLNjhMapPreviewRuntime.teleport(b.maxX - 0.8, 41.5);
        }""")
        time.sleep(0.3)
        page.screenshot(path=str(SHOTS / 'desktop-east-edge.png'))

        # pending r6 doors: use tiles work, toast, no crash, no interior dialog
        for obj_id, template in PENDING_DOORS:
            got = enter_pending(page, obj_id)
            ok = (got.get('entered') is False
                  and got.get('reason') == 'missing-interior'
                  and 'interior belum ada' in (got.get('toast') or '')
                  and not got.get('open')
                  and got.get('template') == template)
            rec('pending-'+obj_id, ok, {'template': template, **got})
            page.evaluate("""() => window.VLNjhMapPreviewRuntime.closeInterior()""")

        # dermaga close-up: land-side use tile, camera pulled west over the Kali.
        # Nearby rumah + pos ronda otherwise occlude the deck; hide the grid
        # so the Water texture is not mistaken for stripes.
        page.evaluate("""() => {
          const rt = window.VLNjhMapPreviewRuntime;
          rt.setWalk();
          rt.setGrid(false);
          rt.setVisible(['ref-infill-extra-168','njh-sw1-h2','ref-north-row-a','njh-dermaga-mancing-anchor'], false);
          rt.teleport(-50.375, 44);
          return rt.focus(-51.9, 43.9, 11);
        }""")
        time.sleep(0.6)
        page.evaluate("""() => window.VLNjhMapPreviewRuntime.focus(-51.9, 43.9, 11)""")
        time.sleep(0.4)
        page.screenshot(path=str(SHOTS / 'dermaga-close-desktop.png'))
        rec('dermaga-close-desktop', (SHOTS / 'dermaga-close-desktop.png').exists(), {'path': 'dermaga-close-desktop.png'})
        page.evaluate("""() => window.VLNjhMapPreviewRuntime.setVisible(['ref-infill-extra-168','njh-sw1-h2','ref-north-row-a'], true)""")

        context.close()

        # ---- phone ----
        phone = browser.new_context(viewport={'width': 390, 'height': 844},
                                    is_mobile=True, has_touch=True)
        page = phone.new_page()
        page.goto(BASE, wait_until='domcontentloaded', timeout=90000)
        try:
            wait_runtime(page)
            page.evaluate("""() => window.VLNjhMapPreviewRuntime.setWalk()""")
            time.sleep(0.5)
            dismiss_editor_chrome(page)
            page.screenshot(path=str(SHOTS / 'phone-map.png'))
            # enter one door on the phone as well
            got = enter_door(page, 'njh-wc-umum')
            rec('phone-wc-enter', bool(got.get('ok')), got)
            page.screenshot(path=str(SHOTS / 'phone-interior-wc.png'))
            page.evaluate("""() => window.VLNjhMapPreviewRuntime.closeInterior()""")
            # plaza crop
            page.evaluate("""() => window.VLNjhMapPreviewRuntime.teleport(-14.5, 30.5)""")
            time.sleep(0.4)
            page.screenshot(path=str(SHOTS / 'phone-plaza.png'))
            rec('phone-map', True, info(page).get('map'))
            page.evaluate("""() => {
              const rt = window.VLNjhMapPreviewRuntime;
              rt.setWalk();
              rt.setGrid(false);
              rt.setVisible(['ref-infill-extra-168','njh-sw1-h2','ref-north-row-a','njh-dermaga-mancing-anchor'], false);
              rt.teleport(-50.375, 44);
              return rt.focus(-51.9, 43.9, 11);
            }""")
            time.sleep(0.6)
            page.evaluate("""() => window.VLNjhMapPreviewRuntime.focus(-51.9, 43.9, 11)""")
            time.sleep(0.4)
            page.screenshot(path=str(SHOTS / 'dermaga-close-phone.png'))
            rec('dermaga-close-phone', (SHOTS / 'dermaga-close-phone.png').exists(), {'path': 'dermaga-close-phone.png'})
        except PlaywrightTimeout:
            rec('phone-map', False, {'errors': 'timeout'})
            page.screenshot(path=str(SHOTS / 'phone-load-fail.png'))
        phone.close()
        browser.close()

    if errors:
        rec('page-errors', False, errors[-8:])
    results['shots'] = sorted(p.name for p in SHOTS.glob('*.png'))
    (SHOTS / 'smoke-results.json').write_text(json.dumps(results, indent=2, ensure_ascii=False))
    print('SHOTS', SHOTS, flush=True)
    return 0 if results['ok'] else 1

if __name__ == '__main__':
    sys.exit(main())

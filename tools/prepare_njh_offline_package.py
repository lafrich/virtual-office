#!/usr/bin/env python3
"""Package NJH's CURRENT Semesta/Jiwa/LGR player and the public art pipeline into Android assets.

This is a staging transform only. Original repository and production pages remain unchanged.
A release is NOT considered fully offline until airplane-mode Playwright/on-device smoke passes.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

IGNORED = {'.git', '.github', 'node_modules', 'tests', 'docs', 'android-mini-laptop',
           'android-njh-offline', '__pycache__', '.gradle', 'tools'}
BINARY_SUFFIXES = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp3', '.ogg',
                   '.mp4', '.woff', '.woff2', '.ttf', '.bin', '.wasm'}
ALLOWED_GAME_DIRS = {'mainkan', 'world-builder', 'shared', 'jiwa', 'content',
                     'emotion-studio', 'membangun', 'l3d', 'b'}
REPLACE = [
    ('https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/',
     '/virtual-life-asset-pipeline/assets/'),
    ('https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/site/media/',
     '/virtual-life-asset-pipeline/media/'),
    ('https://lafrich.github.io/virtual-life-asset-pipeline/',
     '/virtual-life-asset-pipeline/'),
    ('https://lafrich.github.io/virtual-office/',
     '/virtual-office/'),
    ('https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main',
     '/virtual-life-asset-pipeline'),
    ('https://raw.githubusercontent.com/lafrich/virtual-office/main',
     '/virtual-office'),
]

def copy_dir(src: Path, dest: Path):
    if not src.exists():
        raise RuntimeError(f'Missing dependency: {src}')
    shutil.copytree(src, dest, dirs_exist_ok=True,
                    ignore=lambda _p, names: [n for n in names if n in IGNORED])

def fix_text(path: Path):
    if path.suffix.lower() not in {'.js', '.html', '.css', '.json', '.mjs'}:
        return
    try:
        original = path.read_text(encoding='utf-8')
    except UnicodeError:
        return
    data = original
    for a,b in REPLACE:
        data = data.replace(a,b)
    # The player uses the canonical internal asset path. An APK has no CDN.
    if path.parts[-2:] == ('world-builder', 'builder.js'):
        for source in ('https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js',
                       'https://unpkg.com/three@0.181.0/build/three.module.js'):
            data = data.replace(source, '../vendor/three.module.js')
    # indonesia-assets.js builds a raw GitHub URL dynamically from PREVIEW_REF;
    # a fixed-string URL replacement cannot catch that construction.
    # Load the same original catalog files from the APK instead.
    if path.parts[-2:] == ('world-builder', 'indonesia-assets.js'):
        data = data.replace(
            "const base='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/'+PREVIEW_REF+'/';",
            "const base='/virtual-life-asset-pipeline/';"
        )
        if 'raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/' in data:
            raise RuntimeError('NJH offline package still has a raw GitHub catalog URL')
    if data != original:
        path.write_text(data, encoding='utf-8')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--game', type=Path, required=True)
    parser.add_argument('--pipeline', type=Path, required=True)
    parser.add_argument('--three', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    root = args.out.resolve()
    if root.exists():
        shutil.rmtree(root)
    game = root / 'virtual-office'
    pipe = root / 'virtual-life-asset-pipeline'
    game.mkdir(parents=True)
    pipe.mkdir(parents=True)
    for part in sorted(ALLOWED_GAME_DIRS):
        if (args.game / part).exists():
            copy_dir(args.game / part, game / part)
    for f in ('sw.js', 'index.html', 'manifest.enc', '.nojekyll'):
        if (args.game / f).is_file():
            shutil.copy2(args.game / f, game / f)
    # GitHub Pages publishes the SITE directory as pipeline's web root.
    copy_dir(args.pipeline / 'site', pipe)
    # The pipeline's artist assets live outside site/.
    copy_dir(args.pipeline / 'assets', pipe / 'assets')
    for part in ('game', 'chars-iso'):
        if (args.pipeline / part).exists():
            copy_dir(args.pipeline / part, pipe / part)
    vendor = game / 'vendor'
    vendor.mkdir()
    for file in ('three.module.js', 'three.core.js'):
        src = args.three / file
        if not src.exists():
            raise RuntimeError(f'Local Three.js vendor dependency missing: {src}')
        shutil.copy2(src, vendor / file)
    for path in root.rglob('*'):
        if path.is_file():
            fix_text(path)
    # Do not register a PWA worker inside the self-contained Android WebView;
    # all responses are already sourced from APK assets, with no INTERNET permission.
    mainkan = game / 'mainkan' / 'index.html'
    html = mainkan.read_text(encoding='utf-8')
    html = html.replace('<head>', '<head>\n<script>window.NJH_NATIVE_OFFLINE=true;</script>', 1)
    mainkan.write_text(html, encoding='utf-8')
    assetsjs = game / 'mainkan' / 'offline-assets.js'
    js = assetsjs.read_text(encoding='utf-8')
    marker = "const btn=$('offlineDownload'),status=$('offlineDownloadStatus');"
    if marker not in js:
        raise RuntimeError('offline-assets.js marker missing')
    js=js.replace(marker,
        marker+"\nif(root.NJH_NATIVE_OFFLINE){if(btn)btn.hidden=true;if(status)status.textContent='Game sudah terpasang di perangkat · tidak memerlukan internet.';return;}", 1)
    assetsjs.write_text(js, encoding='utf-8')
    # Game player-mode never uses the Semesta authoring cloud-login UI.
    worldhtml=game / 'world-builder' / 'index.html'
    txt=worldhtml.read_text(encoding='utf-8')
    txt=re.sub(r'<script\\s+src="https://accounts\\.google\\.com/gsi/client"[^>]*></script>', '', txt)
    # The grok editor preview manifest is not published in the official asset
    # pipeline. The PLAYER iframe must not request an unavailable authoring asset.
    txt=re.sub(r'<script[^>]*src="/virtual-life-asset-pipeline/grok-assets/manifest\\.js[^"]*"[^>]*></script>', '', txt)
    worldhtml.write_text(txt, encoding='utf-8')
    must_have=[
        game/'mainkan'/'index.html',game/'mainkan'/'offline-save.js',
        game/'world-builder'/'builder.js',game/'jiwa'/'life-economy.js',
        pipe/'genesis-source.js',pipe/'emosi-source.js',
        pipe/'media'/'lgr1'/'base'/'index.json',
        vendor/'three.module.js',vendor/'three.core.js',
    ]
    for path in must_have:
        if not path.is_file():
            raise RuntimeError(f'Offline build lacks critical asset: {path}')
    report={'files':0,'bytes':0,'game_scripts':0,'pipeline_files':0}
    for path in root.rglob('*'):
        if path.is_file():
            report['files']+=1
            report['bytes']+=path.stat().st_size
            if path.suffix=='.js' and 'virtual-office' in path.parts:
                report['game_scripts']+=1
            if 'virtual-life-asset-pipeline' in path.parts:
                report['pipeline_files']+=1
    print(json.dumps(report,indent=2))
    (root/'njh-package-manifest.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    print('Android-ready offline NJH assets staged in',root)

if __name__ == '__main__':
    main()

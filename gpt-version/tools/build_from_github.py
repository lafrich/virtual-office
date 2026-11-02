#!/usr/bin/env python3
"""Build an isolated Virtual Life v16a test copy from the encrypted GitHub game.

Uses the original engine, not a replacement minigame. Does not deploy or
touch the Cloudflare production Worker. Requires VO_OFFICE_PASSWORD locally.
"""
import argparse
import base64
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from hashlib import pbkdf2_hmac

BASE = 'https://raw.githubusercontent.com/lafrich/virtual-office/main/'
SALT = re.compile(r"var SALT=['\"]([^'\"]+)['\"], ITER=(\d+)")

def fetch(path):
    if path.startswith('/') or '..' in path.split('/') or '://' in path or '?' in path:
        raise ValueError('Unsafe GitHub path')
    request = urllib.request.Request(BASE + path, headers={'User-Agent': 'VirtualLife-Beta/1.0'})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()

def decrypt(data, key):
    if len(data) < 29:
        raise ValueError('Invalid encrypted file')
    return AESGCM(key).decrypt(data[:12], data[12:], None)

def read_live(password):
    page = fetch('index.html').decode('utf-8')
    match = SALT.search(page)
    if not match:
        raise RuntimeError('Unknown key derivation parameters')
    iterations = int(match.group(2))
    if iterations < 100000:
        raise RuntimeError('Unexpected PBKDF2 rounds')
    key = pbkdf2_hmac('sha256', password.encode(), base64.b64decode(match.group(1)), iterations, 32)
    manifest = json.loads(decrypt(fetch('manifest.enc'), key))['files']
    entry = manifest['office.html']
    if not re.fullmatch(r'[0-9a-f]{32}\.enc', entry[0]) or not entry[1].startswith('text/html'):
        raise RuntimeError('Unexpected encrypted office entry')
    html = decrypt(fetch('b/' + entry[0]), key).decode('utf-8')
    if not (html.startswith('<!DOCTYPE html>') and 'vc-street2-xing' in html and 'Virtual Life v15a' in html):
        raise RuntimeError('Incompatible live source: stop without making changes')
    return html, manifest, key

def safe_preview(html):
    policy = (
        '<meta http-equiv="Content-Security-Policy" content="'
        "default-src 'self' data: blob:; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
        "font-src 'self' data:; "
        "connect-src 'self' http://127.0.0.1:8799 ws://127.0.0.1:8799; "
        "frame-src 'none'; object-src 'none'; base-uri 'self'\">\n"
    )
    if html.count('</head>') != 1:
        raise RuntimeError('Unsafe HTML head anchor')
    return html.replace('</head>', policy + '</head>', 1)

def build(source, output, html, manifest, key):
    source = source.resolve()
    game = source / 'workspace' / 'virtual-office'
    patch = source / 'workspace' / 'vo-patch' / 'v16a' / 'src' / 'p_v16a.py'
    if not patch.is_file() or not (game / 'assets').is_dir():
        raise RuntimeError('Missing Virtual Life handover folder')
    with tempfile.TemporaryDirectory(prefix='virtual-life-beta-') as temp:
        tmp = Path(temp)
        target = tmp / 'virtual-office'
        target.mkdir()
        (target / 'index.html').write_text(html, encoding='utf-8')
        scripts = tmp / 'v16a-src'
        shutil.copytree(patch.parent, scripts)
        code = (scripts / 'p_v16a.py').read_text().replace('/workspace/virtual-office/', str(target) + '/')
        (scripts / 'p_v16a.py').write_text(code)
        result = subprocess.run([sys.executable, str(scripts / 'p_v16a.py')], capture_output=True, text=True, timeout=30)
        if result.returncode:
            raise RuntimeError('Grok patch anchor mismatch: ' + (result.stdout + result.stderr)[-600:])
        patched = (target / 'index.html').read_text()
        if 'vc-v16a-free' not in patched or 'Virtual Life v16a' not in patched:
            raise RuntimeError('Missing v16a marker')
        output.mkdir(parents=True, exist_ok=True)
        (output / 'index.html').write_text(safe_preview(patched), encoding='utf-8')
        shutil.copytree(game / 'assets', output / 'assets', dirs_exist_ok=True)
        restored = 0
        for name, ent in manifest.items():
            if not name.startswith('assets/'):
                continue
            if any(part in ('.', '..') for part in Path(name).parts):
                raise RuntimeError('Unsafe asset path')
            dst = output / name
            if dst.exists():
                continue
            if not isinstance(ent, list) or len(ent) < 2 or not re.fullmatch(r'[0-9a-f]{32}\.enc', ent[0]):
                raise RuntimeError('Unexpected asset entry')
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(decrypt(fetch('b/' + ent[0]), key))
            restored += 1
        (output / 'BETA_README.txt').write_text(
            'GPT Version v16a: original engine; isolated local build.\\n'
            'Production Worker connection blocked. Multiplayer requires a separate test Worker.\\n'
            'Never publish unencrypted output to the public GitHub repository.\\n')
        print('Local beta prepared; restored', restored, 'missing original assets')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    pw = os.environ.get('VO_OFFICE_PASSWORD')
    if not pw:
        parser.error('VO_OFFICE_PASSWORD must be set locally; do not commit credentials')
    html, manifest, key = read_live(pw)
    build(args.source, args.output, html, manifest, key)

if __name__ == '__main__':
    main()

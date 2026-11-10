#!/usr/bin/env python3
"""Local preview server for the NJH Semesta map (port 8802).
Serves this virtual-office clone at / and the asset pipeline at
/virtual-life-asset-pipeline/. Cache-Control: no-store. Preview only.
"""
from __future__ import annotations
import argparse, os, posixpath, sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import unquote, urlparse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PIPELINE = os.path.abspath('/workspace/virtual-life-asset-pipeline')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()

    def translate_path(self, path):
        parsed = urlparse(path)
        raw = unquote(parsed.path)
        if raw.startswith('/virtual-life-asset-pipeline/'):
            rel = raw[len('/virtual-life-asset-pipeline/'):]
            rel = posixpath.normpath(rel).lstrip('/')
            if rel.startswith('..'):
                return os.path.join(PIPELINE, '')
            return os.path.join(PIPELINE, rel)
        return super().translate_path(path)

    def log_message(self, fmt, *args):
        sys.stderr.write('%s - %s\n' % (self.address_string(), fmt % args))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8802)
    ap.add_argument('--bind', default='127.0.0.1')
    args = ap.parse_args()
    httpd = ThreadingHTTPServer((args.bind, args.port), Handler)
    print('NJH map preview http://%s:%d/world-builder/?njhMap=1' % (args.bind, args.port), flush=True)
    print('Mainkan preview http://%s:%d/mainkan/?njhMap=1' % (args.bind, args.port), flush=True)
    print('root=%s pipeline=%s' % (ROOT, PIPELINE), flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    main()

import base64
import importlib.util
import json
from pathlib import Path
import unittest
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from hashlib import pbkdf2_hmac

SRC = Path(__file__).resolve().parents[1] / 'tools' / 'build_from_github.py'
spec = importlib.util.spec_from_file_location('gpt_builder', SRC)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class TestBuilder(unittest.TestCase):
    def test_decrypt_and_guard(self):
        password = 'fixture-only'
        salt = bytes(range(16))
        key = pbkdf2_hmac('sha256', password.encode(), salt, 600000, 32)
        html = '<!DOCTYPE html><html><head></head><body>vc-street2-xing Virtual Life v15a</body></html>'
        manifest = {'files': {'office.html': ['a' * 32 + '.enc', 'text/html; charset=utf-8']}}
        def enc(b, iv): return iv + AESGCM(key).encrypt(iv, b, None)
        urls = {
            'index.html': ("var SALT='%s', ITER=600000;" % base64.b64encode(salt).decode()).encode(),
            'manifest.enc': enc(json.dumps(manifest).encode(), bytes([1] * 12)),
            'b/' + 'a' * 32 + '.enc': enc(html.encode(), bytes([2] * 12)),
        }
        old_fetch = mod.fetch
        try:
            mod.fetch = lambda path: urls[path]
            real_html, entries, derived = mod.read_live(password)
            self.assertEqual(real_html, html)
            self.assertEqual(derived, key)
            self.assertEqual(len(entries), 1)
            with self.assertRaises(Exception):
                mod.read_live('wrong-password')
        finally:
            mod.fetch = old_fetch

    def test_network_isolation(self):
        html = '<!DOCTYPE html><html><head></head><body>game</body></html>'
        result = mod.safe_preview(html)
        self.assertIn("connect-src 'self' http://127.0.0.1:8799", result)
        self.assertNotIn('workers.dev', result)
        with self.assertRaises(RuntimeError):
            mod.safe_preview('<head></head><head></head>')
        for path in ['/secret','../secret','https://other.com/a','a?b']:
            with self.assertRaises(ValueError): mod.fetch(path)

if __name__ == '__main__':
    unittest.main()

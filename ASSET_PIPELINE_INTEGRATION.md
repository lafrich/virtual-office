# Virtual Life — Asset Pipeline notes

The original [Virtual Life Asset Pipeline](https://lafrich.github.io/virtual-life-asset-pipeline/#rigs) remains an **independent asset authoring and preview service**. Semesta, Bangun Ruang, Membangun, jiwa.exe, and Emotion Studio load pipeline assets from that origin directly.

The unused encrypted Virtual Life playback (`arsip.html` / decrypted `office.html`) was removed from this repository. The opt-in in-game inspector that used to be injected into `office.html?assetbridge=1` (`game-assets/asset-bridge.js` and `game-assets/rig-runtime.js`) went with it. Package A / v16a in-SW patches were cancelled and are not deployed.

The experimental Cove Room addon remains deleted (`cove-reskin.js` is gone; `?cove=1` does nothing). The unrelated `/rebuild/` test game stays retired.

Encrypted original **images** used by Semesta’s Virtual Life Assets vault (`manifest.enc` and `b/*.enc`) are unchanged. The Cloudflare Worker is unchanged.

## Tests

```bash
node --check sw.js
node tests/asset-bridge.test.cjs
node --test tests/root-launcher.test.cjs
```

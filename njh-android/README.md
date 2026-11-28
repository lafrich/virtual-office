# NJH offline Android APK (Capacitor)

The offline single-player build of *Namanya Juga Hidup: The Game*. Branch `offline/android-apk-20261128`. It is never deployed to Pages.

## Build
```
source /workspace/njh-toolchain/env.sh        # JDK 21 + Android SDK 35 (kept on /workspace)
bash tools/offline/build-apk.sh /workspace/njh-apk
```
1. `tools/offline/build-offline.mjs` builds `offline-www/` (gitignored, rebuildable, about 13 MB). It contains only the play set, plus the pipeline/raw assets from `tools/offline/asset-manifest.json` (mirror `/workspace/njh-offline-mirror`, which re-downloads anything missing and checks sha256) and vendored three@0.181.0. The layout matches GitHub Pages, so absolute `/virtual-life-asset-pipeline/...` paths still work at `https://localhost/`.
2. `npx cap sync android` and then `gradlew assembleDebug` produce `NJH-offline-debug.apk`.

## Test
- `node tools/offline/verify-offline.mjs` runs Playwright on desktop and phone landscape. Every request outside 127.0.0.1 is aborted, and the server mimics Capacitor's local server (a path with no extension gets the root index.html).
- `node tools/offline/crawl.mjs` plays the game against the repo with pipeline/raw/CDN proxied from live and refreshes the asset manifest. Re-run it when the map or assets change.

## Offline differences (only when `window.NJH_OFFLINE=true`, which only the build sets)
- Guest only: no Worker login and no Google Identity script. The menu shows **Mulai Main**, or **Lanjutkan** / **Karakter Baru** when a save exists, and the guest character is kept on the device (`mainkan-character-v1:offline-guest`).
- three.js is local, `raw.githubusercontent.com` maps to `/vlap-raw/`, and `lafrich.github.io/virtual-life-asset-pipeline` maps to `/virtual-life-asset-pipeline`.
- Android: `com.lafrich.njh`, `sensorLandscape`, immersive fullscreen, keep-screen-on, hardware acceleration, no INTERNET permission.

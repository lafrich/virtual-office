# Package A audit — GPT Version v16a (2026-11-02)

Source of truth: owner's full first-package brief in ChatGPT; v15a original engine, encrypted `main` source, Grok handover ZIP. Beta URL: https://lafrich.github.io/virtual-office/rebuild/gpt-version/

**IMPORTANT:** `main` website still hosts the encrypted production game. GPT Version exists in the isolated subfolder `rebuild/gpt-version/`. Do not deploy beta backend changes to the production Worker.

| Owner request | Code status (beta) | Remaining verification/work |
|---|---|---|
| Walk animation after crossing | Patched forceAnim release | Android gameplay walk/stop/re-enter regression |
| Cross freely, no button, lamp or special sequence | Implemented in v16a beta logic | Browser movement/collision QA; Worker multiplayer integration not deployed |
| Traffic dense/quiet + safe six-second gap | Deterministic 40s cycle, 15 vehicles | In-browser rendering + collision parity |
| Hit returns to original curb, no penalty | Local hit/respawn implemented | Multiplayer server rules unavailable in offline beta |
| Slower walk/run | Patched code | Mobile feel / actual relative velocity QA |
| Existing open Indomaret frontage, visible search items | Grok six spot locations applied | Item placement, occlusion, loot and economy must be tested with isolated backend; beta glint only |
| No closed/roof item locations | Spots moved from roof cells | Visual occlusion QA in live scene |
| Blink/glint search items | Re-enabled server-less visual preview, sprite prefetch | Visual QA; server item availability does not run in offline beta |
| No floor tap-to-walk | Original click-floor path disabled | Mobile NPC/object interaction regression |
| No demo NPC | Scheduled demo NPC disabled | Verify no other placeholders |
| Lower mobile toast | CSS moved | Mobile viewport snapshots |
| Remove blue XP window bar | CSS hidden, game viewport flex | Portrait/landscape QA |
| Remove cat/bell notification panel | UI hidden in beta | Remove obsolete panel logic/asset loading not yet done |
| No HUD minimap, keep phone map | CSS hides HUD map only if phone Map source found | Verify actual phone Map opens/works |
| WebP compress map/buildings | **NOT DONE** | Must derive image assets safely, compare exact pixel/alpha fidelity and size, rebuild encrypted asset manifest |
| Offline asset cache | **PARTIAL**: CacheStorage holds only immutable AES-GCM `b/*.enc` assets | Full offline game needs encrypted manifest caching + session/key recovery |
| Redraw only on changes | **NOT DONE** | Need renderer dirty-region and moving camera/traffic benchmarks |
| 30 FPS low-battery / slow Android | **NOT DONE** | Must measure visual stutter first; don't skip player/foreground compositor frames blindly |
| Reduce server position update frequency | **NOT DONE** | Beta deliberately does not connect to production Worker; requires isolated test Worker |
| Don't render/calculate offscreen item/search locations | **NOT DONE** | Need clipping integrated with native canvas and item state |
| Delay far area imagery | **PARTIAL**: preload in batches and wait for image decoding before far-side layer transitions | Measure network + perceived pop-in on Android |
| Don't load locked features | **NOT DONE** | Need dependency inventory to avoid loading core asset prematurely |
| Layer correctness, eliminate flicker | **ACTIVE FIX**: native painter ordering, hysteresis; patch 07 removes road-band foreground hide and uses sprite alpha to reveal player without blanking world | Pixel screenshot/Android recording required before marking complete |

## Known visual regression and patch 07
- User screenshot: foreground road/gateway raster covers avatar; beginning of crossing briefly loses background.
- Root cause: original compositor draws full `XC.f` z=7 over the avatar; a previous GPT patch hid entire foreground baked `lv_*.png` on crossing zones, producing background pop.
- Patch 07 restores full foreground bitmap on every frame and alpha-cuts only the player's opaque sprite pixels from the front canvas when on a relevant road band; other world pixels remain intact.
- Patch 07 starts preloading all 17 far-side level assets when outdoor scene activates, and waits until image decoding completes before switching foreground layering. It also caches only encrypted immutable asset blobs; no plaintext cached.
- New regression tests: `tests/render-layer-regression.cjs`, updated `tests/gang-exit-regression.cjs`. Source transformation against decrypted current GitHub game: **26 anchors, executable script syntax PASS**.
- **Not proven:** no remaining flickering on user's Android screen; cannot browser QA the public site from the current environment.

## Separate user-requested exploration (not Grok Package A)
Earlier turns separately requested expanding the rear alley and full lateral street exploration. That experimental beta behavior is retained but should **not** be mistaken for an item of Grok's first package; the owner's original package explicitly deferred further expansion behind buildings.

## Next priorities
1. Android screenshot comparison for crossing, forecourt/gateway, moving vehicle overlap, roof glint.
2. Close any remaining visual layering issues.
3. Test interactions, item placement and Map in a dedicated beta environment with an isolated test backend.
4. Measure A6 changes; then implement and test WebP, redraw culling, adaptive FPS, and WebSocket update-rate changes safely.

## 2026-11-02 — Patch 08: correcting player/vehicle/pedestrian depth (published)

After Patch 07 user reported the player suddenly rendered ABOVE road traffic and crossing NPCs; far-side background still disappeared near crossing.

Actual original compositor: `XC.b` (outdoor background and behind-player sprites) and `XC.f` (foreground), plus CSS player `.me` at z-index 7. Previous Patch 07 `destination-out` alpha punching of `XC.f` removed **all** foreground pixels in the player's silhouette, including vehicles and pedestrians, forcing the player to appear in front regardless of depth. **This entire mask is removed.**

- Patch 08 uses native `XC.skip` on **individual vehicles**, not entire `EXT.gC` (which would incorrectly move crossing NPCs behind the player). Sort by moving sprite's projected foot depth `c+r` versus player `c+r`, with hysteresis to limit flickering; the back canvas draws skipped car sprites before the HTML player, and the front canvas draws remaining cars/NPCs in front.
- The generated far-side level overlay includes pavement. When the player stands on the relevant road bands, move only the baked `S2X.lv.g` to `XC.b`. Do not mask the player or hide all street art.
- Far-side painter switch requires *both* level images and `S2` base to be decoded and present in the native `XC.imgs` cache. A missing/late background therefore does not trigger an empty far-side layer.
- A transient `xcFrame` exception no longer destroys `XC.b` permanently; discard suspect skip list and retry next frame, with a single diagnostic warning.
- Explicit regression suites: `tests/render-layer-regression.cjs`, `tests/gang-exit-regression.cjs`. Both pass in an isolated VM harness. Latest original encrypted game's 26 patch anchors apply; all executable JavaScript snippets syntactically valid.
- **Android visual check not yet completed by assistant**; cannot state the remaining flicker/background issue is 100% fixed before actual gameplay recording. `main` files other than `rebuild/gpt-version/` unchanged. Beta patch loaded via scoped service worker import `a8`.


## 2026-11-02 — Patch 09: gate floor, tree proportion, mobile canvas
- Following owner screenshot and request to remove only the obstructing plane: narrowed the original baked `S2X.lv.g` front-to-back painter routing to the actual gate/sidewalk footprint (`c=20.4..25.3, r=35.65..40.15`). **Not** an indiscriminate removal of building, roof or pillar geometry. All other native movable cars and NPCs retain normal sorting.
- Enlarged original `extTree` vector art BEFORE `pxBake/extCompose`, anchored at the same ground pivot: tall 1.28x, round 1.26x, wide 1.20x. Small planters, other environmental props and the collider radius are unchanged.
- Caps only the expensive `xcFrame` compositor painting to ~30 FPS on touch devices; input/physics/game tick is not capped. Original desktop painting remains uncapped.
- Regression: real encrypted source transformation passed 28 anchors, all executable JS scripts parse; the simulated gate road overlay is behind player on passage, not behind player in adjacent shop frontage, and vehicle/NPC group is never moved wholesale.
- Deployed only the `rebuild/gpt-version/` beta overlay and service worker import `a9` to GitHub Pages. Not merged into encrypted production game. Actual Android visual/performance measurements still pending.

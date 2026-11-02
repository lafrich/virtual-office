# GPT Version — isolated beta workspace

Status: **v16a Package A isolated public beta deployed; NOT production-ready**.

This branch was created from `main` to keep GPT Version separate from the live Virtual Life game. The production encrypted site and Cloudflare Worker are unchanged.

2026-11-02 development patch 01 (kept outside this public repo to avoid leaking decrypted source):
- Restore lane-A vehicles as direct children of the original native traffic layer to preserve NPC/vehicle depth order.
- Preserve moving the far lane onto the back canvas for between-lanes player positions without creating a nested SVG group.
- Disable empty-floor tap-to-walk; keep keyboard, joystick, D-pad, and NPC/object clicks.
- Disable scheduled demo protest NPCs outside explicit test mode.
- Hide obsolete outer title bar; use full viewport; move mobile job toast clear of profile/needs.
- Correct the v16a-only build-label expectation in the depth regression.

Local isolated checks: Python/JS syntax, 15 vehicle-parent checks, 8 far-lane checks, traffic phases and no collision at the clear-phase crossing point: **PASS**.

**Not yet verified:** complete source rebuild, desktop/mobile visual depth and flicker regression, full Worker/multiplayer integration, UI screenshot QA. Do not merge or deploy this branch without full test coverage and owner approval.

The original handover ZIP is development context. The encrypted `main` game remains the design and gameplay reference.

Do not commit decrypted game HTML or developer passwords to this public repository.
## 2026-11-02 — Recovery without external hosting

- Added `gpt-version/tools/build_from_github.py` to reconstruct v16a locally from the original encrypted GitHub `main` build, rather than making another visual prototype. Password is read from an environment variable and not stored.
- The builder reuses the handover's Grok patch and runtime assets and fetches genuinely missing encrypted assets from GitHub, with path and version checks.
- Added `gpt-version/tests/test_builder.py` for encrypted fixture and network-isolation guard tests. Equivalent local test fixtures pass. Actual GitHub download, complete patch application against latest `main`, and full game QA are NOT YET VERIFIED.
- No Vercel, new hosting provider, live Worker changes, or public plaintext game build. `main` stays untouched.

## 2026-11-02 — GPT Version v16a public beta (isolated)

Public beta: https://lafrich.github.io/virtual-office/rebuild/gpt-version/
Rollback to prior beta: https://lafrich.github.io/virtual-office/rebuild/gpt-version/?classic=1

New files/edits under `rebuild/gpt-version/` **only**; published as additive files on `main` to work with existing GitHub Pages. The production `sw.js`, encrypted manifests, main game shell, and Cloudflare Worker have NOT been changed.

- `package-a.js` applies v16a original-engine transforms in the scoped beta SW. The original encrypted game and original sprites are fetched unchanged, decrypted in browser memory. The patch is not a standalone game and is never applied to production.
- Owner feedback covered: free crossing anywhere, 40s traffic density cycle (busy 12s/quiet 28s/clear 6s), 15 vehicles, local vehicle collisions and respawn to starting kerb with no gameplay penalty, slower walk/run, walk animation release, loak roof-occluded search spots, A1 no floor tap, A2 scheduled demo NPC off, A3 toast mobile, A4 fullscreen, A5 far-side image preload near crossing, lower sparkles, fewer NPC crossers, phone-map-verified HUD minimap removal.
- A7 depth fix: cars stay attached to the native `EXT.gC` painter; no synthetic lane-A SVG group. The existing far-side world layer contract is preserved.
- Verified against GitHub encrypted production build: 20 exact replacements applied; all resulting JavaScript script blocks compiled successfully. Traffic phases and the 26–32s clear crossing interval checked at both lane positions. Beta login and SW are syntax checked; `main/sw.js` SHA unchanged.
- Browser/Android screenshot QA and live end-to-end user testing are still pending. A5 locked-asset deferral, A6 performance optimizations, and full A7 flicker regression are deliberately NOT represented as completed without measurements. Multiplayer/Worker v16a server changes are NOT deployed and remain out of scope for this offline beta.

SAFETY: Never merge unencrypted game HTML, never connect the beta to the live Worker, and never claim that unit checks prove end-to-end gameplay.

## 2026-11-02 — GPT Version patch 02 (deployed)

Public beta unchanged: https://lafrich.github.io/virtual-office/rebuild/gpt-version/

- Replaced approximate vehicle footprint values with the exact Grok handover `traffic.json` metadata for all 15 sprite kinds; added a read-only vehicle snapshot inspector.
- Replaced one-step fallback respawn with nearest walkable curb-slot search (near/far), retaining the old emergency spawn if none can be found.
- Stabilized the near-lane back-canvas toggle with a 0.32-cell hysteresis band (33.24–33.56), avoiding flip-flop/flicker near the player threshold.
- Cached lane-A vehicle nodes on scene setup rather than scanning/filtering the native SVG painter group every frame. No synthetic SVG lane group was added.
- Added Node-only offline regression suite at `rebuild/gpt-version/tests/package-a-regression.cjs`. Isolated tests: 3600 vehicle samples, all 15 kinds, exact hitbox widths, clear crossing, positive collisions, safe curb spawns, painter-layer invariants PASS.
- Bumped scoped service worker import version for immediate beta update. Files published on `main` are limited to `rebuild/gpt-version/package-a.js` and `rebuild/gpt-version/sw.js`. The production `sw.js` and encrypted files remain unchanged.
- Still pending: real-browser end-to-end visual inspection, mobile screenshots, quantitative FPS/load-time A6 measurements, and full flickering QA A7. Do not merge beta code into the live game without these checks.

## 2026-11-02 — GPT Version patch 03 (deployed)

- Split far-side scene prefetch of 17 level images into batches of at most 3 per frame while the player approaches; on a direct teleport very close to the far side, prioritize all images to prevent pop-in. Tested 17 assets over 6 frames without duplicate loads.
- Reuse cached CSSAnimation handles; query `getAnimations()` again only if no handle exists or the previous animation is idle.
- Scoped SW import URL bumped to `package-a.js?v=a3`. Only subfolder `rebuild/gpt-version/` was changed on the published `main` branch.
- Regression test suite was extended at `rebuild/gpt-version/tests/package-a-regression.cjs`; equivalent harness assertions for loading batches, 15 vehicle kinds and traffic phases passed.
- A6 is still *partial*: quantitative FPS, long-task, resource-transfer and Android load-time comparisons remain outstanding. The beta is not the approved production build.

## 2026-11-02 — GPT Version patch 04 (deployed, user feedback)

Confirmed owner reports remaining vehicle glitches/flickering, missing Loak item blinking, unstable visual layering, and an alley endpoint that should be explorable.

Changes isolated to `rebuild/gpt-version/`:
- Vehicle sprites now use a deterministic transform computed every frame from exactly the same `trfVeh().pr` used by the collision system; CSS animation is disabled for the scoped beta cars. This avoids repeated 600ms CSSAnimation currentTime snapping and vehicle sprite/collision mismatch. Original 15 vehicle sprites and `EXT.gC` parent ordering stay intact.
- Loak spot sparkle in isolated offline preview no longer relies on unavailable multiplayer `S2L.st/bag` state; the original 3-frame sequence `s2lKilau()` is preserved, with incremental sprite prefetch. Live-game search and inventory logic are NOT changed.
- Added hysteresis for far-mode transition, far-side prop/NPC layer splits, moving NPC painter order, and baked occluder level changes; retains the original world layering without a synthetic group.
- Expanded only the **existing baked gang corridor** walkability (c 21.85–24.15, r 37.6–50). No art beyond the drawn map was invented; deep-gang package C content remains deferred.
- Added/updated isolated regression assertions for deterministic vehicle visual vs clock position, 15 kinds, empty-road cycle, safe spawn, sparkle restoration, gang corridor, and painter hysteresis.

Validation: v16a patch applied to the encrypted GitHub original (24 exact source replacements, resulting main game scripts syntax-checked); deterministic 15-car renderer simulated with zero CSSAnimation reads and native `EXT.gC` nodes; previously 3600 traffic samples and 17-art-image prefetch checks passed.
The headless browser in this environment blocks navigation, so flicker-free Android/desktop gameplay is NOT yet independently verified visually. Do not mistake automated checks for screen QA.

Deployment: beta scoped SW import version `a4`; changes on published `main` are confined to `rebuild/gpt-version/package-a.js` and `rebuild/gpt-version/sw.js`. Production `sw.js`, main game source, encrypted manifest, and Cloudflare Worker are unchanged. Rollback: `/rebuild/gpt-version/?classic=1`.

## 2026-11-02 — GPT Version patch 05 (deployed: true alley exit)

User reported the far alley end was still impassable. Root cause verified: the original `s2xInFar()` checker had an explicit far-lane cutoff at `r=50`; previous GPT patch merely widened its `c` range and left the `r` cutoff unchanged. The original Grok v15a/V16a artwork describes an existing secondary local road at `r=51..55` (facade line F=51).

- Extended the **connected** existing alley walking region to `c=21.85..24.15, r=37.6..52.05`.
- Introduced a carefully bounded rear local road `c=18.8..27.2, r=51.4..54.7`. The overlapping walkable rectangles allow stepping through r=50 and then moving sideways on the rear road; no invisible open world beyond the baked image.
- Updated **the original** `s2xInFar()` return expression via the encrypted-engine patch, not only the config mutation. This fixes the actual collision rejection.
- Kept buildings/objects' `EXT.blk` blocker checks in `s2xOK()`; no noclip or unbounded movement.
- Added beta introspection `__v16.passage()` and corrected the on-enter message to trigger only after reaching the rear road.
- 25 patch anchors applied successfully against actual decrypted original game source; output JavaScript blocks compiled successfully. New `gang-exit-regression.cjs` test passed 262 continuous walking samples and 5 out-of-art boundary checks.
- Scoped beta `package-a.js` and `sw.js` updated under `rebuild/gpt-version/` only, SW version `a5`. Production sw.js and encrypted game remain unchanged. Full Android/browser motion QA is still unverified.

## 2026-11-02 — GPT Version patch 06 (published; screenshot-specific road layering)

Owner's Android screenshot showed the static street/sidewalk occluder drawing above the player near the gang entry; owner also requested the entire east-west rear road be traversable to its left/right baked artwork ends.

- Root cause: `street2/xing/lv_NN.png` foreground occluder atlases include some flattened pavement/road textures (confirmed by visually inspecting `lv_00.png` and `lv_16.png`). Rendering the entire level over the player hides their body even when the player is actually standing on ground.
- Scoped beta-only source patch suppresses the **baked** front occluder group on the road/sidewalk bands (`r 36.35..38.05` and `r 51.25..54.85`). The original world ground/base image remains below the sprite; dynamic foreground props (`EXT.gF`) and depth sorting continue normally elsewhere. Production build and encrypted assets untouched.
- Rear-road collision rectangle widened from `c 18.8..27.2` to `c -40..34`, `r 51.4..54.7`, matching the long horizontal strip already baked in Ellen's v15a Street2 source (`S.render(V4.ground, -42, V4.C_MAX, 37.7, 75)`). It overlaps the connecting alley. No infinite noclip.
- Removed duplicate "OFFLINE BETA" banner only for v16, preserving classic fallback.
- Original encrypted game patch: 26 anchors applied; executable main scripts syntax-check; 6 embedded JSON data script tags are not executable JS. Regression: 919 sampled walkable points and 5 out-of-bounds checks PASS.
- Deployed only `rebuild/gpt-version/package-a.js` and `rebuild/gpt-version/sw.js` as patch `a6`. Live game sw.js, encrypted files, Cloudflare Worker unaffected.
- **Not yet independently verified visually in browser**. The user should check the gateway player's feet, both ends of the rear street, and interactions with foreground posts/roofs.

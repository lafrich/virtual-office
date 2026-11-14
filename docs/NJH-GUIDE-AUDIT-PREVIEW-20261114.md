# NJH guide compliance — preview audit fixes (14 Nov 2026)

**State: PREVIEW / NOT LIVE.** Branch `fix/njh-guide-audit-20261114` from live `a8bd4337`. No production Worker, logins, existing saves, main-branch scenes, official LGR/Emosi anchors, or production service worker changed. This preview branch DOES modify selected scene JSONs. Do not merge/push live until Ichsan gives explicit approval.

## Sources of truth

- Drive: *NJH — Recap Mekanik & Guide Tim (sumber tunggal)*, 14 November 2026.
- *NJH-LFB-ASSET-CLASSIFICATION-SCALE-GUIDE*, especially §10–§13 for pixels, drainage, trees and the NJH-only map.
- *NJH-INTERIOR-LAYOUT-RULES-MANDATORY* and *NJH-INTERIOR-LAYOUT-STANDARD-KHARISMA*.
- `mainkan/NJH98-UI.md` and `docs/HOOKS-STEP2.md`.
- `world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json` is the one authorized playable city. No other city was edited.

## Fixes implemented in this branch

1. **Tree physical collision and placement.** 11 existing tree instances now have solid trunk collision and `blocking:yes`; their trunk bases were moved off forbidden sidewalk/road/drain areas to valid grass/plaza cells. This changes composition visibly (several trees moved approximately 6–8 tiles): screenshot and approve their placement before live. All keep `rotation:0` and the original 1.25×1.25 trunk footprint. The physics no longer multiplies trunk footprint by uniform *visual* scale.
2. **Tree/LGR scale.** Vegetation registry uses exact `width = spriteWidth·√2/64`, `height = spriteHeight·√2/64·2/√3`, plus `minVisualScale` estimated from crown-to-trunk pivot and an extra margin. One placed Trembesi had its scale increased from 1.69 to 1.86. This does **not** redraw source PNG art; the mandatory **visible opaque crown → trunk base** check still needs actual play screenshot, especially for the 8 small native registry sprites that failed the original audit.
3. **Drain axis.** Seven `selokan_grill` covers now use rotation 90 for their along-r channel. `VLMapTerrain.drainAxis` determines connected runs. The renderer rotates the plane of each *along-c* `drain.png` tile by 90°, so its baked along-r texture follows the grid. The current city contains 74 along-c tiles, 72 along-r, 1 junction and 4 isolated drain cells. Corners, culverts and end-cap sprites **are not implemented**; specifically do not claim that the original 87 FAIL/16 WARN drainage QA is fully clean.
4. **Tent pixel lock.** The four-view Pecel Lele/Sate Madura tents use the full PNG `size·PX/PY` billboard dimensions (formerly mixed `size/50` and pivot-derived height). Compare all views against official LGR before release.
5. **NJH Mart → Bangun Ruang.** The existing 11 supermarket furniture types (8 types and 3 recolors) were registered under their official IDs and source footprints, preserving upstream `VLIndonesiaInteriorPack`. The preview art adapter now reads `njh-play-interiors/catalog.json` and reuses corresponding four-view PNGs rather than making new art; network failures are exposed in `martKitStatus`.
6. **Cache isolation.** Version tags were bumped for changed World Builder modules only on this preview branch. No production Mainkan CSS/JS or service worker changes.
7. **Regression tests.** New `tests/njh-guide-map-guard.test.cjs` checks tree collision, legal terrain, dimensions, drain axes and tent metadata; `tests/njh-mart-registry.test.cjs` checks the 11 Mart IDs, source footprints and four-view art.

## Verification available so far

- Syntax of nine changed/new JavaScript files parsed with a V8 compiler (all OK).
- In-memory data/function checks passed: 11 tree placements have permitted terrain, fixed-size trunk collider and required visual-scale metadata; all 7 grill rotations are 90; drain neighbor counts are 74/72/1/4; all 11 NJH Mart assets match the source registry.
- **GitHub Actions PR CI:** on commit `60e1cb69cc37f8c206d821ad3dfa7ac29bf5a0ca`, all **7/7** workflows PASS. The full unit gate runs 551 tests: **549 PASS, 0 FAIL, 2 SKIP** (two artist-owned Beraksi source/fixture checks not present on GitHub runner). Playwright Mainkan, Jiwa, Nokia and native HUD tests run on headless Chrome. Passing CI does NOT certify every gameplay feature or release compliance.

## Additional repairs in the same draft PR (continued 14 Nov 2026)

- Corrected authoring/runtime test mismatch after guide updates. Seven GitHub workflows passed at commit `478360df9`; new subsequent commits must rerun the CI before any ready-for-review change.
- Browser-proofed `SemestaPlay.playerRigStatus()` with read-only `visible`, `opaquePixels` and `visibleHeight`. The real player texture must exceed 350 opaque pixels and 60 pixels tall. A "loaded" blank sprite now fails CI.
- NJH MART in native play mode now bakes its declared five wall paint layers (dado/trim/midDisplay/identity/ceiling) rather than a flat background.
- Deleted invented/fallback map-site pins from the playable site list and prevented an artificial `npc_ibu_warteg` capsule at (0,0). Only actual placed world objects can become source IDs.
- Added WC privacy geometry in the native interior renderer: the already-registered `sekat_wc` TYPE blocks traversal but is not an interaction, and `doors[]` entries with role `bathroom`/`stall` render as curtains while remaining walkable and never trigger kost-room ownership logic.
- Enclosed bathrooms in `njh_kos` (both the 10×8 map scene and older 8×6 play scene), `njh_kos_ichsan` and `njh_kos_noor` (preview+play copies). Enclosed three individual public toilet stalls and two bak-air bays in `njh_wc_mandi_umum`, without adding a shower. Enclosed `njh_rumah_biasa` bathroom; fixed bed headboard against wall and dining-seat direction/path.
- Existing `world-builder/bangun-ruang/njh-interior-preview-art` contained approved four-view PNG art for six previously invisible/placeholder types: `water_tub`, `sekat_wc`, `fan`, `shoe_rack`, `bathtub`, `registration_desk`. The play catalog now points to these 24 existing PNGs, retaining checksums, pivots and footprints. Procedural privacy wall geometry is a **missing-image fallback**, not a replacement for PNG art.
- Added read-only `njh-wc-privacy.test.cjs`: checks 4-connected walkable privacy entries, physical overlaps, wet-fixture approach tiles and diagonal entrance privacy line-of-sight on eight preview/play scenes. Added `njh-interior-art-catalog.test.cjs` to check all 24 source PNG paths and hashes, plus updated older `njh-play-interiors.test.cjs` for the privacy layout. Tests are in the regular PR CI gate.

**Limitations:** These scene changes are not a full 14/15-scene compliance pass. The CI renderer exercises synthetic and headless Chrome paths, not human inspection from every camera angle. The 65 original layout findings must be independently re-audited with the missing full checker; new mandatory art and 3D visual review still need approval. Drain junction/culvert art and LGR Beraksi poses are not fabricated here.

## 15 Nov continuation: full unit gate and visible player cleanup

- Added required `node --test tests/*.test.cjs` to `semesta-mahluk-sync.yml` and path coverage `tests/**`. 13 old failures exposed; updated stale assertions for 11 NJH Mart registry types, approved Kharisma count, integrated Emosi launcher, modern Jiwa/Nokia HUD, correct bathtub action, UI version tags, and valid external PNG path lookups. Fixed THREE.BoxGeometry test mock for the actual bathroom partitions.
- `semesta-int-scenes.test.cjs` now accepts portable `BERAKSI_SLOT_DIR` and `LGR_DB_FILE`; it does not hard-code an unavailable artist's `/workspace` path. **Two author-owned fixture tests skip explicitly when assets are absent**, while scene gameplay fallbacks continue to be checked.
- Genesis CI now verifies not just opaque CanvasTexture, but the actor's **on-screen projection after the 5-phase hobo/tent exit animation finishes**. Captures `screenshots/mainkan-world-genesis-visible.png` with no Nokia overlay. The early screenshot was blank because `semesta-spawn-hobo.js` intentionally hides the actor root during that intro.
- The first post-spawn screenshot revealed editor-only wireframe/placement grid. Mainkan player mode now hides `THREE.BoxHelper` selection boxes, the full-screen grid, and authoring-only logic markers while preserving entity/actor references and collision. Semesta authoring mode is unchanged. Regression asserts `editorOutline=false`, `editorGrid=false`, and `editorMarkersVisible=0`.
- The remaining white/navy `!` bubble over Genesis is **intentional contextual AKSI cue** (`mainkan/njh98.js`), **not** an editor logic pin or a quest marker. It remains as designed.
- Artifacts inspected: cleaned headless screenshot shows the player visible beside the road with no editor wireframe or grid. This proves the precise preview renderer case, not a manual mobile-device release QA pass.

## Remaining open before game can be called stable

- **P0:** Genesis player sprite now has a real opacity/visible-height browser regression gate and passes headless Chrome. **Independent manual live-device visual confirmation is still required**; no official LGR/Emosi master was changed.
- **P1:** Former 14/15 interior layout failures (65 recorded violations) were only PARTIALLY resolved: seven kost/public-WC scene copies plus `njh_rumah_biasa` have privacy walls/curtains and some facing fixes. More layouts need pairing, wall-backing, density, service-line and full checker QA. The original `tools/check_interior_layout.py` is not bundled in this repo and **has NOT been run**.
- **P1:** Drain: junction/corners, isolated ends, 9 crossings without gorong; re-run original `check_water_axis.py` with runtime-axis-aware checks.
- **P1:** Screenshot-check every relocated/scaled tree, avoid obstruction of doors and interaction tiles, and re-run `check_trees.py` on new map.
- **P1:** Genesis LGR latest joint/outfit animation (v4/preview W4-v5) and six Beraksi scenes `njh_int_wc/bed/tree/room/npc_f/npc_m`. Must use approved DB IDs and preserve head/Emosi/rig pivot; no autogenerated motion art was substituted.
- **P2:** NJH Mart five declared wall paint layers are rendered and automatically tested. The official 11 furniture variants and six older fixture types now reuse source PNGs. Human visual review of paint/readability/framing remains open.
- **P2:** NPC dialogue/quests, full housing progression, missing real places, wall_pee visual and four-player online sync, plus Guest1 mobile-specific QA.
- **QA:** The previously hidden 13/548 full-suite baseline failures were triaged to **0**, with 549 unit passes and 2 explicitly skipped Beraksi fixture cases. Full suite is now a hard required GitHub Actions gate; the skipped artist-specific validations remain open.

## Required gate before merging (run from a local checkout of both sibling repos)

```bash
node --test tests/njh-guide-map-guard.test.cjs tests/njh-mart-registry.test.cjs tests/njh-mart-paint.test.cjs tests/njh-wc-privacy.test.cjs tests/njh-interior-art-catalog.test.cjs tests/njh-play-interiors.test.cjs
node --test tests/njh-map-preview.test.cjs tests/njh-step2.test.cjs tests/njh98-window-fit.test.cjs
node --test tests/*.test.cjs
node mainkan/tools/njh98-window-fit.mjs http://localhost:8901/virtual-office/mainkan/index.html --shots /tmp/njh-preview-shots
```

Also run the guide's `check_water_axis.py`, `check_trees.py`, and `check_interior_layout.py` from their existing QA workspaces. The world-layout checker and four-view contact sheets are **required**, not optional. Smoke all four test IDs on desktop and Guest1 on landscape/portrait mobile. Confirm single AKSI, unchanged auth/save/Worker, token gating, and a **visible** Genesis player.

Rollback on approval: fast-forward-only deploy with explicit Ichsan OK, bump `?v` and service worker, record commit in `ROLLBACK.md`; revert the exact fix commit(s) instead of force-push. This preview must not overwrite the Drive masters.

# NJH guide compliance — preview audit fixes (14 Nov 2026)

**State: PREVIEW / NOT LIVE.** Branch `fix/njh-guide-audit-20261114` from live `a8bd4337`. No production Worker, logins, existing saves, scenes, official LGR/Emosi anchors, or service worker changed. Do not merge/push live until Ichsan gives explicit approval.

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
- **Node tests and Playwright smoke/browser QA have NOT been run in this session**: the sandbox cannot connect to GitHub to clone the actual repository. Do not call this fully tested or production-ready.

## Remaining open before game can be called stable

- **P0:** Genesis player sprite visibility in local game (check serving both repos, LGR DB status and `SemestaPlay.playerRigStatus()`; do not fake a renderer or replace the face source).
- **P1:** 14/15 interior layout scenes previously failed (65 recorded violations). Enclose WC/bathrooms with authentic partitions + door/curtain, fix facing/pairing/clearance **with real supported fixture types**. Re-run `tools/check_interior_layout.py`. No speculative re-layout was committed.
- **P1:** Drain: junction/corners, isolated ends, 9 crossings without gorong; re-run original `check_water_axis.py` with runtime-axis-aware checks.
- **P1:** Screenshot-check every relocated/scaled tree, avoid obstruction of doors and interaction tiles, and re-run `check_trees.py` on new map.
- **P1:** Genesis LGR latest joint/outfit animation (v4/preview W4-v5) and six Beraksi scenes `njh_int_wc/bed/tree/room/npc_f/npc_m`. Must use approved DB IDs and preserve head/Emosi/rig pivot; no autogenerated motion art was substituted.
- **P2:** NJH Mart wall paint/zoning and interior visual QA; drawer/furniture registry integration after art load must be visually verified.
- **P2:** NPC dialogue/quests, full housing progression, missing real places, wall_pee visual and four-player online sync, plus Guest1 mobile-specific QA.
- **P2:** Existing 7 baseline unit failures (last 16:00 checkpoint) remain untriaged.

## Required gate before merging (run from a local checkout of both sibling repos)

```bash
node --test tests/njh-guide-map-guard.test.cjs tests/njh-mart-registry.test.cjs
node --test tests/njh-map-preview.test.cjs tests/njh-step2.test.cjs tests/njh98-window-fit.test.cjs
node --test tests/*.test.cjs
node mainkan/tools/njh98-window-fit.mjs http://localhost:8901/virtual-office/mainkan/index.html --shots /tmp/njh-preview-shots
```

Also run the guide's `check_water_axis.py`, `check_trees.py`, and `check_interior_layout.py` from their existing QA workspaces. The world-layout checker and four-view contact sheets are **required**, not optional. Smoke all four test IDs on desktop and Guest1 on landscape/portrait mobile. Confirm single AKSI, unchanged auth/save/Worker, token gating, and a **visible** Genesis player.

Rollback on approval: fast-forward-only deploy with explicit Ichsan OK, bump `?v` and service worker, record commit in `ROLLBACK.md`; revert the exact fix commit(s) instead of force-push. This preview must not overwrite the Drive masters.

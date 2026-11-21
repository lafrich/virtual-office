# NJH checkpoint 2 preview testing guide (Ellen r7 interiors + copy + 404 fixes + door drop-ins)

Preview only. Branch: `preview/njh-sync-decisions-20261122`.
Do not merge to `main` and do not deploy the Worker until New Bot / Ichsan approve.

## Build ids (after this checkpoint is pushed)

- Service worker: **sw v37** (`sw.js` header)
- Script tag: **`?v=njh-ellen-r7-20261122`**
- Hub build: **`hub-20261122-ellen-r7`**
- GitHub tree: https://github.com/lafrich/virtual-office/tree/preview/njh-sync-decisions-20261122

Hard-refresh once so the browser drops sw v36. Confirm DevTools Application shows sw v37 and script URLs use `?v=njh-ellen-r7-20261122`.

## What landed in this checkpoint

1. **Ellen r7 Kharisma interiors (7):** `njh_mushola`, `njh_koperasi`, `njh_toko_loak`, `njh_warung_madura`, `njh_nasi_sunda`, `njh_pecel_lele_tenda`, `njh_sate_madura_tenda`. Moved from `NJH_PENDING` to `NJH_READY`. `interiorPending` cleared only on those 7 doors. `loadInteriors()` fetches **READY only**, so any remaining locked door never 404s an interior JSON.
2. **Plastic benches** `plastic_bench_red` / `plastic_bench_blue` (2x1, sit, true back view) registered in TYPES, Indonesia pack types, play catalog, and preview-art. Used by the two tenda scenes.
3. **Generic `paint.layers` hook:** any scene with `paint.layers` (including the 7 r7 rooms, not only NJH MART) bakes walls via the existing nearest-neighbor painter.
4. **Copy:** user-facing **Sewa kost** → **Bayar kos (sekali bayar, permanen)**; `REASON_PARTNER` **Punya pacar** → **Hanya pemilik**.
5. **Furniture 404 fix:** play-interior `loadImg` requests only `art/<file>` (no fallback fetch of `njh-play-interiors/<file>` which 404s on live).
6. **Door drop-in art (Ellen missing-assets-r1):** raised-door PNGs + catalog/manifest patches for `rumah_kampung_a`, `rumah_kampung_d`, `toko_loak`, and `id_warteg_sederhana` (door ~84–86 px). Safe to ship with this checkpoint.
7. **Trees are not in this checkpoint.** Ellen’s tree art r1 and instance-scale fixes live on `preview/njh-map-densify` (origin head `a804890a`, base `0484b22a`). That branch is its own package, rebased FF after checkpoints 2/3. Do not cherry-pick or duplicate tree art into this branch. New Bot will test densify in-game (selokan turn direction, no culvert sprite). Checkpoint 3 logic (sw v39) is later; v38 is reserved by the other stream.

## Per-item tests

### A. Seven r7 doors (was “Belum buka”)

Walk up and press E at:

- Mushola, Koperasi, Toko loak, Warung Madura, Nasi Sunda, Tenda Pecel Lele, Tenda Sate Madura.

Expect: the matching r7 interior opens (8x6, entrance (4,5), door-front clear). No “Belum buka”. Walls show painted bands (dado/trim/identity etc.), not a flat fill. Tenda rooms show red/blue plastic benches you can sit on.

Ellen source renders and contact sheet: `/workspace/njh-sync-shots/ellen-interiors-r7/ellen-source/`.

### B. Remaining locked doors

Any door still not in `NJH_READY` must toast **Belum buka** and must **not** fetch `…/interiors/<id>.interior-scene.json`. A leftover `interiorPending: true` remains on `njh_door_warung_kopi` in meta, but warung kopi is already READY and still wires from its existing scene (flag is unused by `wireDoors`). Do not treat warung kopi as a new lock.

### C. Copy strings

- Wherever the UI showed **Sewa kost**, it now shows **Bayar kos (sekali bayar, permanen)**.
- Partner rejected from an owner-only action sees **Hanya pemilik**, not **Punya pacar**.

### D. 404s that were 51 on live

Live unique 404s: 44 furniture/kopi PNGs requested under `njh-play-interiors/` (missing `art/`) + 7 locked-door interior JSONs.

On this preview:

- Minimarket / kopi furniture must load from `world-builder/njh-play-interiors/art/…` only. Both `njh-play-interiors.js` (`loadImg`) and `bangun-ruang/njh-interior-art-preview.js` (mart kit `sourceBase`) request `art/` and never the bare `njh-play-interiors/<file>` path.
- The 7 r7 interiors must 200 from `njh-map-preview/interiors/`.
- Locked (non-READY) interiors must not be requested at all.

Enter NJH Mart and a kopi-using room if present, then check the Network tab (or the Playwright netcap) for unique 404s. Target: **0**.

### E. Door facades (kampung / warteg / loak)

Look at `rumah_kampung_a`, `rumah_kampung_d`, warteg, and `toko_loak` from SW/SE. Door/opening should be ~84–86 px, ground pivot and footprint unchanged. Compare against Ellen contact sheets in `/workspace/njh-missing-assets-r1/` if needed.

### F. Trees (NOT this checkpoint)

This SHA does not change tree art, vegetation catalog, or city tree instance scales. The densify package (`preview/njh-map-densify`, `a804890a`) already has tree art r1 served from `world-builder/vegetation-trees-r1/` plus placement/scale work. Leave trees to that branch.

## Gates already run on the worktree (before push)

- Unit tests (non-browser): 582 pass, 0 fail, 2 skipped.
- Mandatory Kharisma checker on the 7 vendored r7 scenes: 7 PASS, 0 violations, exit 0.
- `office_chair` `pair_target` unpack crash fixed in the workspace checker at `/workspace/njh-interior-layout-rules/tools/check_interior_layout.py` (not part of the VO commit; checker repo is separate).

## Rollback

Revert the checkpoint 2 commit on `preview/njh-sync-decisions-20261122` (VO + matching pipeline door commit). That restores sw v36 / `?v=njh-ellen-assets-20261122` from checkpoint 1 (`7ee7b1f`). Leave `main`, the Worker, and `preview/njh-map-densify` untouched. This stream did not add a tree-art commit.

## Must not go live (unchanged)

Old r6 interiors, old Kang Parkir / Manusia Silver / Pak Ogah sprites, zebra, hobo tent, and warkop v2 were not added in checkpoint 1 or 2. Do not merge any of those from other branches.

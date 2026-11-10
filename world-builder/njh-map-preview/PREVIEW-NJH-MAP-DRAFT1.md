# NJH Semesta map draft1 — local PREVIEW

Preview only. Ichsan has not reviewed this map. Do not push or deploy.

Local clone: `/workspace/njh-map-preview`  
Branch: `preview/njh-map-draft1` (from `origin/main` at `63133e4`)  
Do not touch `/workspace/virtual-office` (another worker uses that checkout).

## How to run

```bash
python3 /workspace/njh-map-preview/world-builder/njh-map-preview/serve.py
```

- Semesta walk preview: http://127.0.0.1:8802/world-builder/?njhMap=1
- Mainkan (forwards the flag): http://127.0.0.1:8802/mainkan/?njhMap=1

`?njhMap=1` skips the Drive-first lock and the Quick Start tutorial, loads Ellen's 52×63 city, registers the 7 new assets, wires door use tiles, and keeps `map.unbounded=false`. Live URLs without the flag are unchanged.

The local `/virtual-life-asset-pipeline/` mount is incomplete (genesis-source.js 404s), so the reliable walk test is the Semesta editor path above, not Mainkan `?player=1`. The walk actor still appears as Ichsan.

## Asset key mapping (guessed → registered)

| Guessed key (with-pending-assets) | Registered key |
| --- | --- |
| `object:obj-njh-dermaga-mancing` | `object:njh_dermaga_mancing` |
| `object:obj-njh-lapak-silver` | `object:njh_lapak_silver` |
| `object:obj-njh-tiang-ogah` | `object:njh_tiang_ogah` |
| `object:obj-njh-kotak-amal` | `object:njh_kotak_amal` |
| `object:obj-njh-penanda-doa` | `object:njh_penanda_doa` |
| `studio:br-warung-pecel-lele` | `studio:br-warung-pecel-lele` (unchanged) |
| `studio:br-lapak-sate-madura` | `studio:br-lapak-sate-madura` (unchanged) |

Art for the five `object:` props comes from `/workspace/lfb-placeholders-v2/`. Tent exteriors come from the existing Bangun kits. `njh_dermaga_mancing` uses `rotateFootprint` so a 2×1 dock flips correctly at rot 90/270; unit test 13 checks the dock edge stays clear for `fishing_wait_sit` shin overhang.

Object `asset` fields in the preview city already use the real keys. A few notes/pending-anchor comments still mention the guessed names; runtime remaps those too.

## Door → interior wiring

Use tiles come from `njh-map-meta.json`. Enter radius is 1.25 from the use point when `?njhMap=1` (live maps stay at “2.1 from center”). Interiors were copied read-only from `/workspace/njh-interior-preview` at `35ac8ed` (r3 rooms + r5 WC).

| Door (object id) | Use tile | Interior | Result |
| --- | --- | --- | --- |
| Laundry Kiloan (`jakarta-v3-13634`) | -46.5, 41.5 | `njh_laundry` | wired |
| Warteg / warung makan (`jakarta-v3-18446`) | -39.5, 41.5 | `njh_warung_makan` | wired |
| Rumah Ichsan (`ref-gas-station`) | -45.5, 57.5 | `njh_rumah_biasa` | wired |
| Bengkel Motor (`njh-bengkel`) | -48.0, 71.5 | `njh_bengkel` | wired |
| WC / Mandi Umum (`njh-wc-umum`) | -43.0, 71.5 | `njh_wc_mandi_umum` | wired |
| Kos Noor (`njh-kos-noor`) | -26.25, 71.5 | `njh_kos` | wired |
| Warung Madura (`ref-north-row-b`) | -43.5, 41.5 | `njh_warung_madura` | pre-wired, pending r6 (toast: interior belum ada) |
| Warung Kopi Pojok Gang (`ref-west-center-a`) | -38.5, 51.5 | `njh_warung_kopi` | pre-wired, pending r6 |
| Warung nasi Sunda (`jakarta-v3-13525`) | -21.15, 71.5 | `njh_nasi_sunda` | pre-wired, pending r6 |
| Koperasi (`jakarta-v3-13541`) | -17.0, 71.5 | `njh_koperasi` | pre-wired, pending r6 |
| Toko Loak (`njh-toko-loak`) | -27.0, 26.0 | `njh_toko_loak` | pre-wired, pending r6 |
| Mushola Kampung (`njh-mushola`) | -16.25, 26.6 | `njh_mushola` | pre-wired, pending r6 |
| Warung Pecel Lele tenda (`njh-tenda-pecel-lele`) | -25.0, 38.5 | `njh_pecel_lele_tenda` | pre-wired, pending r6 |
| Lapak Sate Madura tenda (`njh-tenda-sate-madura`) | -20.0, 38.5 | `njh_sate_madura_tenda` | pre-wired, pending r6 |

All 14 doors have use tiles. The six ready interiors open now. The eight pending ones are enterable at their use tiles and toast `interior belum ada` until Ellen's r6 scenes land in `interiors/`.

## Spawns and homes

- `t_ichsan` → rumah Ichsan door, homeSpawn `[-45.5, 57.5]`, interior `njh_rumah_biasa`
- `t_noor` → kos Noor door, homeSpawn `[-26.25, 71.5]`, interior `njh_kos`
- `guest1` → plaza `njh_spawn_3` `[-14.5, 32.5]`
- `guest2` → plaza `njh_spawn_4` `[-12.5, 32.5]`
- Default / unknown → plaza `njh_spawn_1` `[-14.5, 30.5]`

## Map edge

`worldBounds` `{minX:-57, maxX:-5, minZ:14, maxZ:77}` (52×63 cells). `map.unbounded` is `false` only in this preview. `world-physics.check()` rejects moves outside those bounds when unbounded is explicitly false, so existing tests that set `unbounded:true` stay free.

## Tests

- `tests/njh-map-preview.test.cjs`: 7/7 pass
- Combined with `tests/world-physics.test.cjs` and `tests/spawn-respawn.test.cjs`: 15/15 pass
- `tests/bangun-ruang-interiors.test.cjs`: 4 pass, 2 fail, unchanged from before this work:
  - “Mahluk Hidup canonical pose bindings for interior furniture”
  - “fractional Semesta footprint survives bridge; decorative buildings are not enterable” (`'sw' !== ''`)

Playwright smoke (`tests/njh-map-preview-smoke.py`), desktop 1280×800 and phone 390×844: **13/13 pass** — map load (131 objects), bounded, walk, all 7 new assets textured, 6 wired doors enter their interiors, edge block, phone WC enter, phone map.

## Screenshots

`/workspace/njh-map-preview-shots/`

- `desktop-map.png`, `desktop-walk.png` — plaza spawn, Ichsan walk actor, bounded HUD
- `desktop-new-assets.png` — tent / stall cluster
- `desktop-dermaga.png` — framed toward the west dock (sprite confirmed textured via API)
- `desktop-east-edge.png` — east bound
- `desktop-interior-njh-kos-noor.png`, `desktop-interior-jakarta-v3-18446.png`, `desktop-interior-njh-wc-umum.png`, `desktop-interior-ref-gas-station.png`, `desktop-interior-jakarta-v3-13634.png`, `desktop-interior-njh-bengkel.png`
- `phone-map.png`, `phone-plaza.png`, `phone-interior-wc.png`
- `smoke-results.json`

## Open issues for Ellen

1. No NJH interior yet for mushola, koperasi, toko loak, warung Madura, warung kopi, and nasi Sunda. Of the seven far doors, the first three still cannot be entered.
2. Pecel lele and sate madura tents are registered and drawn, but their Bangun kits are not hooked up as enterable interiors (furniture types in those kits are not in the Bangun interior model).
3. Kali / dermaga (preview only): authored tiles at the channel, including `(-53,43)` and `(-53,44)`, are type `river` (252 river cells, 0 water). Only those `river` cells are painted with Water (`water.png`, still not walkable). The bank at `c=-52` and the use tile `[-50.375, 44]` (`c=-51, r=44`) stay sidewalk; they were never remapped. The sidewalk looked too close in color to the water, so river-adjacent sidewalks use the existing `sidewalk_edge_*` curb as a turap (yellow edge toward the Kali). The dock footprint stays on the bank; a 0.8-tile draw offset puts the deck out over the water, starting at the turap. Live maps are unchanged. Close-ups: `/workspace/njh-map-preview-shots/dermaga-close-desktop.png` and `dermaga-close-phone.png`.
4. Known leftover from the interior art preview: TV back-view still resembles the screen; furniture icons in the left panel may still use older art.
5. Preview only — not live, and Ichsan has not reviewed the map.

# NJH New Bot fix — preview test guide (22 Nov 2026, Asia/Jakarta)

Preview only: `preview/njh-sync-decisions-20261122`. Do not merge/push `main`. Do not deploy the Worker.

- Service worker: **v42** (`v41` is reserved for the joystick+loading package that lands on main first; this branch will rebase later — expect conflicts in `mainkan/index.html` cache-bust and `sw.js`. CP3 uses **v43**. Balancing uses **v44**.)
- Cache tag: `?v=njh-newbot-fix-20261122`
- Hub build: `hub-20261122-newbot-fix`
- Pipeline SHA to ship with this VO commit: **`c9dc88f`** (no new pipeline commit in this fix). Ellen door/catalog art from CP2 is on that SHA; catalogs now fetch published packs from **`main`**, so `c9dc88f` must go live together with VO.

## What changed

1. **Kali ripple removed.** `njh-map-preview.js` `tileUrl()` no longer serves the 512×32 8-frame ripple sheet as a terrain tile (that rendered as black/teal boxes). River/water use the same terrain PNGs as `main`.
2. **`PREVIEW_REF` is `main`.** `world-builder/indonesia-assets.js` no longer points 26 raw GitHub requests at `preview/njh-sync-decisions-20261122`. Local Ellen packs still load from `./ellen-preview-assets/`.
3. **E opens all READY interiors in Mainkan**, not only Warteg / Kost / NJH Mart. Laundry, Bengkel, WC, Rumah, Warung Kopi, and the 7 r7 interiors (mushola, koperasi, toko loak, warung madura, nasi sunda, pecel lele, sate madura) are fetched from `njh-map-preview/interiors/` and entered via `enterNearby()` / `enterInterior()`.
4. **Locked doors** show tooltip **Belum buka** (not `Masuk [E]`). E toasts **Belum buka**.
5. **Copy:** user-facing **Sewa kamar di Kost** / **Sewa sekali bayar** / **Sewa Kamar** → **Bayar kos (sekali bayar, permanen)**. Docs no longer double “(sekali bayar, permanen) (sekali bayar)”.
6. **Plastic benches** use `visualAs:'plastic_bench_red'|'plastic_bench_blue'` (PNG mapping), not `wooden_bench`.
7. **LGR script `?v`** is `pakaian-v2-njh-newbot-fix-20261122` (was bare `pakaian-v2`).

Kept: tee_v4 / trousers_v4. Mahluk sheets stay files only, unhooked and unannounced. No balancing values. Trees still belong to `preview/njh-map-densify`.

## How to test (Mainkan `?fresh=1`)

Open Mainkan on a preview static server with `?fresh=1` (bypass SW). Guest or test-ID login is fine for street doors; use a 4-ID smoke ID only on a throwaway auth port, never 8787, never shared `.dev.vars`.

- Walk to **Kali** near spawn / Laundry: river should match `main` (smooth teal water, no black/teal boxes). DevTools: terrain requests go to `world-builder/njh-map-preview/terrain/water.png` (200). 0 requests for `sheet_8x1.png` / `ellen-env-r1/animations/water_sw`.
- DevTools: **0** requests to `raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/preview/njh-sync-decisions-20261122`. Pack fetches should use `/main/` (local Ellen vehicles/WC may still come from `./ellen-preview-assets/`).
- Stand at a **r7 door** (mushola, koperasi, toko loak, warung madura, nasi sunda, pecel/sate tenda) and press **E**: the interior opens. Repeat for **Laundry, Bengkel, WC, Rumah, Warung Kopi**.
- Stand at a **locked / not-READY** building such as **Rumah warga 09** (`ref-infill-extra-168`, about −48.5, 49.4): tooltip is **Belum buka [E]**, and E shows the **Belum buka** toast (does not enter a fallback). Do not use Warung Kopi as a locked-door sample — it is READY despite leftover meta `interiorPending`.
- If the in-game **Cara Main** window covers the view, click **Lewati** (`#njhHowtoWinSkip`).
- Kost UI / Nokia / goals: **Bayar kos (sekali bayar, permanen)**, not Sewa kamar / Sewa sekali bayar.
- Inside pecel lele or sate madura: benches are **plastic** (red/blue), not brown wood.

## Rollback

On this preview branch only, revert the VO fix SHA (restore CP2 `9065c7a`). Leave `main`, the Worker, densify, and pipeline `c9dc88f` untouched.

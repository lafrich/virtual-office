# NJH STEP 1 — lock r7 + Warung Kopi, Belum buka tooltip, default tee (22 Nov 2026, Asia/Jakarta)

Preview only: `preview/njh-sync-decisions-20261122`. Do not merge/push `main`. Do not deploy the Worker.

This is the morning live package New Bot asked for after rejecting `947388c` as-is. STEP 2 (reopen r7 with template-first kind, declared paint, catalog, plastic sit) and CP3 come later on a separate preview.

- Service worker: **v42** (v41 is reserved for joystick+loading on main first; if that lands, rebase this branch linearly onto it and keep v42 above v41). Balancing uses **v44**. Rebase conflicts expected in `mainkan/index.html` and `sw.js`.
- Cache tag: `?v=njh-step1-lock-r7-20261122`
- Hub build: `hub-20261122-step1-lock-r7`
- LGR `?v` kept: `pakaian-v2-njh-newbot-fix-20261122`
- Pipeline to ship with VO: **`c9dc88f`** (`PREVIEW_REF` is `main`)

## What changed

1. The **7 r7 doors** are locked again (`NJH_PENDING`, meta `interiorPending: true`, not fetched by play interiors): mushola, koperasi, toko loak, warung madura, nasi sunda, pecel lele, sate madura. Tooltip and E toast **Belum buka**. Interiors stay on disk for STEP 2, but are not wired or fetched, so locked doors do not 404.
2. **Warung Kopi** is also locked (removed from `NJH_READY` / `PUBLIC_SCENES`). It was already `interiorPending` in meta but still opened because READY wiring ignored that flag.
3. **Locked-door tooltip** is **Belum buka**. `enterables()` now marks `closed` for any enterable/interaction-enter building without a READY interior (`wantsEnter && !ready`), so `doorList()` can have closed doors. Toast already worked.
4. **Guest / creator default is clothed:** `topStyle=tee` (and `pantsStyle=trousers` so the body is not unclothed from the waist down), including `?fresh=1`, HTML selected options, classic-creator reset, and `normalizeProfile` defaults. Shoes stay optional/nude.
5. **Kept from the fix:** Kali ripple unhooked, `PREVIEW_REF=main`, Bayar kos copy, furniture-without-art 404 path, LGR `?v`.

Still open: Laundry, Bengkel, WC umum, Rumah Ichsan, Warteg, Kost, NJH Mart.

## How to test (Mainkan `?fresh=1`)

On a preview static server with `?fresh=1`. Throwaway auth only, never port 8787, never shared `.dev.vars`. Dismiss Cara Main with **Lewati** (`#njhHowtoWinSkip`) if it covers the view.

- Walk to each r7 door and Warung Kopi: tooltip is **Belum buka [E]** (not Masuk). E toasts **Belum buka** and does not enter a fallback warteg/mart scene.
- Warteg, Kost (owner), and NJH Mart still open on E.
- Laundry / Bengkel / WC / Rumah Ichsan still open.
- New guest at character creator: the top dropdown is **T-shirt** (selected), not “Tanpa atasan”. In the world the guest wears a tee, not a nude base.
- Kali near spawn matches main (smooth teal, no black/teal boxes). 0 requests for `sheet_8x1.png`. 0 raw requests to the preview branch.
- DevTools: locked interiors (`njh_mushola.interior-scene.json` etc.) are **not** fetched.

## Rollback

On this preview branch only, revert the STEP 1 SHA to restore `947388c`. Leave `main`, the Worker, densify, and pipeline `c9dc88f` untouched.

# NJH Checkpoint 3 — remaining logic fixes preview test guide (22 Nov 2026, Asia/Jakarta)

Preview only: `preview/njh-cp3-logic-20261122`, based on STEP 2 `9e61a23`. Do not merge or push `main`. Do not deploy the Worker.

- Service worker: **v46**. (v43 is STEP 1 live / Warteg fix on another stream; **v44** = balancing; **v45** = STEP 2.)
- Cache tag: `?v=njh-cp3-confirm-20261122`
- Hub build: `hub-20261122-cp3-confirm`
- LGR pack stays `?v=pakaian-v2-njh-newbot-fix-20261122` (not bumped).
- Pipeline (optional companion): `preview/njh-cp3-lgr-20261122` on top of CP2 `c9dc88f` — `tee_v4` / `trousers_v4` allowed in `spec()` and under-strip composite in `site/lgr-wear.js` / `site/lgr-game.js`. `PREVIEW_REF` remains `main`.


**Rebase onto the balancing package:** this CP3 base (STEP 2) does not yet ship `content/balancing.json` / `shared/njh-balancing.js`. When CP3 is rebased onto the balancing package (SW v44, live before STEP 2), add the key **`ui.confirmPaidMin: 20000`** to `content/balancing.json`. Do not invent the file on this branch; the runtime already falls back to 20000 and will read the loader's `get` / `num('ui.confirmPaidMin')` once that package is present.

## What changed (remaining logic only)

Already covered by STEP 1 / STEP 2 and **not** re-done here: r7 door locks + Warung Kopi Belum buka, default tee/trousers, template-first `kindOfBuilding`, Warteg → `njh_warteg_kharisma` + Ibu Warteg, `bakeDeclaredPaint` (no NJH MART on mushola), r7/laundry/bengkel catalog art, plastic-bench sit, `wantsEnter&&!ready` tooltip. No balancing values. Trees stay on `preview/njh-map-densify`. Mahluk sheets stay unhooked.

1. **Clock on login is preserved.** `restore(obj,'player')` holds the saved visual clock; a later non-player restore cannot reset it. Day length and speeds 1/2/4 are unchanged (`DAY_REAL_SECONDS=24*60`, `DEFAULT_MINUTE=7:00`).
2. **E / AKSI at a door does not override other actions** (cook, talk, mancing). Auto-enter only when there is nothing else to show. **`confirmPaid` is not shown for every paid action.** Only payments **≥ Rp20.000** (kos, big shopping) or **irreversible** actions (bayar kos, beli kulkas, beli perabot) ask first. Small purchases (gorengan, WC, mandi, kopi, warteg meal) go straight through with a toast `−RpX`. The threshold is `ui.confirmPaidMin` via the balancing loader (`window.NJHBalancing` / `window.NJH_BALANCING`) when present, otherwise **20000**. Locked doors still toast / menu **Belum buka**.
3. **Jual ikan API:** `sellableFish` aliases `sellList` / `fishSellList`; `sell(itemId, qty, buyerId)` (object form also accepted). Documented in `docs/HOOKS-STEP2.md`.
4. **Masak** can use bahan from tas, kulkas, or lemari. Cooking uses a **scene stove** (`stoveHere()`), not a start-seed stove (4P Ichsan/Noor seeds stay stove-less). Old Simpan/Ambil kulkas-lemari buttons are replaced by **Buka Kulkas** / **Buka Lemari**.
5. Hold-to-work emits `window` event `mainkan:work-progress` with `{progress,label,done}`.
6. Partner `roomAccess` stays **Hanya pemilik** for partner-restricted furniture (existing access module; unchanged).
7. Placeholder life NPCs show a **PH** name plate (already present from earlier work; still gated).
8. At the dermaga, the **fishing** menu wins over Pos Hansip when both are in range. Automatic Hansip arrest is skipped on a real fishing tile.
9. Non-READY / 404 interiors stay **locked** (Belum buka); READY public interiors still open (STEP 1/2). Warung Kopi stays locked.
10. Mushola / r7 declared paint is still `bakeDeclaredPaint` (STEP 2). Mart itself still uses `bakeMartWall`.
11. Profile-PUT **CORS pack is vendored only** at `docs/worker-cors-fix-ready/`. Not deployed.
12. Pipeline LGR (companion preview): `tee_v4` / `trousers_v4` allowed in `spec()`, under-strip composite for those pieces. Genesis V6P under-strips are still not feasible (phase-1 strips are 256×112 4-dir stills).

## How to test (Mainkan `?fresh=1`)

Open Mainkan on a preview static server with `?njhMap=1&fresh=1`. Use throwaway auth on a port other than 8787; never touch shared `.dev.vars`. If **Cara Main** covers the view, click **Lewati** (`#njhHowtoWinSkip`).

- Guest still wears a **tee / trousers** by default (STEP 1; do not regress to nude).
- **Mushola:** use point (−16.25, 26.6), press **E**. Enter the mushola. Walls must say **MUSHOLA**, not **NJH MART**. NJH Mart itself should still say **NJH MART**.
- **Warteg** still enters `njh_warteg_kharisma` with Ibu Warteg. Warung Kopi stays **Belum buka**.
- **Locked door:** Rumah warga 09 (−48.5, 49.4) still **Belum buka**.
- **Kali** still matches main (no ripple boxes). 0 requests to a preview-branch raw pipeline URL.
- At the **dermaga mancing** (near −51.5, 44), E should offer fishing, not the Hansip arrest menu. Pos Hansip itself (−49, 40) still works when you are at the pos and not on the fishing tile.
- In a kost with a scene stove, **Masak Resep** should accept bahan from kulkas/lemari, not only Tas. 4P Ichsan start seed still has no stove item; the room scene supplies the stove.
- Hold a work action: a listener on `mainkan:work-progress` should see `{progress,label,done}`.
- Small purchases (gorengan / makan warteg / kopi / WC / mandi, under Rp20.000): **no confirm dialog**; a toast `−RpX` appears after a successful spend.
- Bayar kos (Rp750.000 / room price) or other irreversible / ≥ Rp20.000 payments (isi token at the default Rp20.000): a confirm dialog appears first (`args.confirmed` / `__NJH_SKIP_CONFIRM` for tests).
- Re-login: the clock day/time should continue, not jump back to 07:00 unless the save had no clock.
- Placeholder NPCs show **· PH** on the plate.

## Gates

- `node --test tests/*.test.cjs` (unit only).
- Kharisma checker on the 7 r7 scene files: 7 PASS, 0 violations, exit 0.
- 4-ID smoke (Ichsan, Noor, Guest1, Guest2) on a throwaway port other than 8787.
- Secret scan of added lines: counts only.
- 404 / preview-ref / ripple / furniture-without-art: all 0.

## Rollback

On this preview branch only, revert the CP3 VO SHA (and the CP3 pipeline SHA if it was pushed). That restores STEP 2 `9e61a23` / pipeline `c9dc88f`. Leave `main`, the Worker, densify, STEP 1, and STEP 2 untouched.

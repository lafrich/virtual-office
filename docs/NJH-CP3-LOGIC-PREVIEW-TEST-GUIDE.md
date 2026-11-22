# NJH Checkpoint 3 — live rebase preview test guide (22 Nov 2026, Asia/Jakarta)

Preview only: `preview/njh-cp3-live-20261122`, linear on live main tip `b4e0f04` (ROLLBACK.md docs on top of STEP 2 live `d96ec125` / sw v45; balancing r4b `7f7a45d` / `6ddfec25`). Rebase of approved CP3 VO `preview/njh-cp3-logic-20261122` @ `e71027c3`. Do not merge or push `main`. Do not deploy the Worker. SW stays v46; Cache `?v=njh-cp3-live-20261122`; hub `hub-20261122-cp3-live`. Pipeline stays live `c9dc88f` (tee_v4→tee, trousers_v4→trousers).

- Service worker: **v46**. (v43 = STEP 1 live; **v44** = balancing r4b, was live; **v45** = STEP 2, going live.)
- Cache tag: `?v=njh-cp3-live-20261122`
- Hub build: `hub-20261122-cp3-live`
- LGR pack stays `?v=pakaian-v2-njh-newbot-fix-20261122` (not bumped).
- Pipeline stays **`c9dc88f`** (current live pack). The rejected companion `c5fcc7f` / `preview/njh-cp3-lgr-20261122` must not be used. VO maps `tee_v4` → `tee` and `trousers_v4` → `trousers`. `PREVIEW_REF` remains `main`.

This branch already sits on r4b, so **`ui.confirmPaidMin: 20000`** is a real key in `content/balancing.json` and is read through `shared/njh-balancing.js` (`num` / `value`) into `confirmPaid` / `paymentPolicy`.

## Live-rebase add-ons (same branch)

1. **`ui.confirmPaidMin: 20000`** in `content/balancing.json`, consumed by the balancing loader. `confirmPaid` uses `paymentPolicy` with that min (fallback 20000 only if the loader is missing).
2. **`?fresh=1` new players spawn at the hobo tent (−51.5, 64.5)** (HUD “Tenda”, interactable `njh_tenda_hobo`). Existing / non-fresh sessions keep the plaza pool or a home spawn. Ichsan/Noor homes still win.
3. **Laundry waiting bench is visible.** The I4 `waiting_bench` sprite is a low divider, so play now aliases `waiting_bench` → `wooden_bench` (art already in `njh-play-interiors/art/`). Sit / “Duduk sebentar” is unchanged.
4. **Parkir payout is the balancing wage (Rp5.000).** The extra +Rp500 on desktop was `luck_find` (“rezeki tak terduga”) chained after `work`. Work no longer chains luck; desktop and mobile share the same `runAction('work')` path. `luck_find` remains a separate action.
5. **q1 e2e (one Playwright session):** accept at Pak Ogah, eat at the Warteg (Makan), q1 ready, hand in / claim.
6. **Lazy-load r7 interior art.** Boot no longer fetches every catalog furniture PNG / every ready scene (that ballooned the session from ~6.18 MB to ~9.84 MB). Catalog JSON loads at boot; scene JSON + that room’s art load the first time a door is opened, behind a short “Memuat interior…” overlay, then the room is built in one shot (no empty-room flicker). Playwright checks that boot interior-art bytes drop and that entering an r7 room still renders the full furniture.

## Gates

- `node --test tests/*.test.cjs` (unit only).
- Kharisma checker on the 7 r7 scene files: 7 PASS, 0 violations, exit 0.
- Window-fit.
- 4-ID smoke (Ichsan, Noor, Guest1, Guest2) on throwaway ports other than 8787 (never shared `srv/.dev.vars`).
- Playwright `?fresh=1` in one session: old CP3 checks (clock hold, E menu priority, precheck before confirm, small buy toast, big buy confirm, fish sell aliases, cook, dermaga) plus q1 e2e and lazy-load boot/enter.
- Sim (`node tools/njh-slice-sim.cjs`); explain any change. Work no longer chains luck in play, but the slice sim calls `RULES.run` directly and should be unchanged.
- Secret scan of added lines: counts only.

## Rollback

On this preview branch only, drop `preview/njh-cp3-live-20261122`. That restores live main tip `b4e0f04` (ROLLBACK.md notes on STEP 2 live `d96ec125`, sw v45). Leave `main`, the Worker, densify, and the rejected pipeline alone.

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


## New Bot QA notes (required before live)

(a) Requirements are checked **before** `confirmPaid`. A guest with no kost who taps Isi Token gets `Perlu kost dahulu.` and no dialog; a wallet that cannot afford kos gets `Uang tidak cukup.` and no dialog.
(b) Door / AKSI button labels no longer double: `Masuk — Masuk` is just **Masuk** (hint is omitted when it repeats the label).
(c) **Buka Kulkas** / **Buka Lemari** only appear when `furnOk(...)` is true (`||true` removed).
(d) The `−RpX` spend toast is posted as `mainkan:toast` to the Mainkan HUD, rendered with `position:fixed; z-index:80`, and stays 4.5s.
(e) The visual clock is persisted every 3s and on `visibilitychange` / `pagehide` / `beforeunload`, so a reload should not jump back ~19 game minutes.

The interior `nearbyActions` blocker is **not** fixed here; a balancing-live change covers it and CP3 will rebase onto that later.

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
- Small purchases (gorengan / makan warteg / kopi / WC / mandi, under Rp20.000): **no confirm dialog**; a Mainkan toast `−RpX` appears on top for 4.5s after a successful spend.
- Bayar kos or other irreversible / ≥ Rp20.000 payments: requirements are checked first (enough uang, already punya kost, etc.). The confirm dialog appears only if the payment can succeed (`args.confirmed` / `__NJH_SKIP_CONFIRM` for tests).
- Reload after a few minutes of play: the visual clock should continue, not jump back ~19 game minutes.
- Guest default outfit is live **tee / trousers**. A saved profile with `tee_v4` still wears the live tee (not nude).
- Re-login: the clock day/time should continue, not jump back to 07:00 unless the save had no clock.
- Placeholder NPCs show **· PH** on the plate.

## Gates

- `node --test tests/*.test.cjs` (unit only).
- Kharisma checker on the 7 r7 scene files: 7 PASS, 0 violations, exit 0.
- 4-ID smoke (Ichsan, Noor, Guest1, Guest2) on a throwaway port other than 8787.
- Secret scan of added lines: counts only.
- 404 / preview-ref / ripple / furniture-without-art: all 0.

## Playwright evidence (static `127.0.0.1:8962`, `serviceWorkers=block`, `?fresh=1`)

Boot (before any door): 351 requests / 6.92 MB; interior art 0 / 0 B; r7 art 0; scene JSON 0; play catalog JSON 1. (Earlier same-path boot with art preloaded: 667 req / 7.61 MB, 18 scenes, 64 r7 art files / 101 KB interior-art. New Bot’s live session weight had grown from ~6.18 MB to ~9.84 MB when r7 interiors loaded at boot.)

q1 in the same session: spawn tent (−51.5, 64.5, `njh-fresh-tent`) → accept `q1_makan` at Ogah → eat at official `njh_warteg_kharisma` (wallet 15.000→3.000, quest ready) → claim done +Rp10.000 (wallet 13.000).

Laundry enter after boot: room `njh_laundry`, 8 furniture items including `washing_machine`, `laundry_counter`, `waiting_bench` (wooden_bench art). Enter-path network (Warteg + Laundry): 2 scene JSONs + 16 r7 art files, room built after “Memuat interior…”.

CP3 policy in the same session: `confirmPaidMin` 20000; eat toast `−Rp12.000` (no confirm); `buy_room` confirm true; poor-state precheck “Uang tidak cukup.” (no confirm). sell/cook aliases present on the play API.

4-ID smoke (throwaway auth `127.0.0.1:8868`, static `localhost:8962`, not 8787, no shared `srv/.dev.vars`): Ichsan and Noor spawn `home`; Guest1 and Guest2 spawn `plaza`; all four `SEMESTA • PLAYER READY`.

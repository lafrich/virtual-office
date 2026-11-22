# STEP 2 preview test guide — reopen 7 r7 doors

Preview branch: `preview/njh-step2-r7-20261122` (based on STEP 1 `e418b3d`). Preview only. Do not merge or push `main`. Do not deploy the Worker.

Tags: sw **v45**, `?v=njh-step2-r7-wudhu-20261122`, hub `hub-20261122-step2-wudhu`. LGR pack stays `?v=pakaian-v2-njh-newbot-fix-20261122`.


**QA follow-up (New Bot):** the keran wudu on the door wall no longer overlaps a sajadah. The sajadah that sat under the keran wudu was removed; shaf 2 is at c=2,3 r=3, and the wudhu stays at (6,5),(7,5). Cache `?v=njh-step2-r7-wudhu-20261122`, hub `hub-20261122-step2-wudhu`. SW stays **v45**.

## What changed

- `kindOfBuilding` reads `njhInteriorTemplate` **before** `WARTEG_PATTERN`, so Warung Madura, Nasi Sunda, Pecel Lele, and Warung Kopi no longer open as the warteg room.
- The official Warteg door still maps to `njh_warteg_kharisma` with Ibu Warteg (not Ellen's `njh_warung_makan` fallback), even when the fallback id is what NJH_READY used to list. `readyTemplateIds` always unions `TEMPLATES`.
- `bakeMartWall` runs only for the minimarket. Other 5-layer scenes use `bakeDeclaredPaint` from the scene palette / `paint.layers` (no NJH MART sign on the mushola).
- Every r7, laundry, and bengkel scene item id is in the play catalog with authored art (including prayer_mat, bookshelf, wudhu_tap, washing_machine, workbench, tool_rack).
- `plastic_bench_*` (and `waiting_bench`) are in `FURNITURE_GATES` (`rest`/`sit`). Sitting uses `seatId` and pose `sit`. Public interiors no longer reject `rest` as `Terkunci`.
- The 7 r7 doors are READY and enterable. **Warung Kopi stays locked** (slice-1.0) with tooltip/toast `Belum buka`.

## Mainkan checks (`?fresh=1`)

1. Open Mainkan with `?njhMap=1&fresh=1`. Guest wears a tee by default.
2. Walk or teleport to each of the 7 r7 doors and press E. Each must enter **its own** scene (correct walls and furniture). Screenshot each interior. None may look like the warteg or NJH Mart.
3. Warung Kopi: tooltip and toast stay `Belum buka`; it must not open.
4. Warteg enters `njh_warteg_kharisma` with Ibu Warteg (not `njh_warung_makan`). Kost Cove and NJH Mart still enter. Mart walls still say NJH MART.
5. Laundry Kiloan and Bengkel Motor furniture is drawn (washing machine, laundry counter, locker, workbench, tool rack, waiting bench). Screenshot each.
6. Inside Pecel Lele or Sate Madura, sit on a plastic bench (`Duduk sebentar`); the character uses the sit pose.
7. River stays on `terrain/water.png` (no ripple-sheet boxes).
8. Network: 0 preview-branch pipeline refs, 0 ripple-sheet requests, 0 furniture-without-`art/` 404s, 0 interior JSON 404s for locked Kopi.

## Gates

- `node --test tests/*.test.cjs` (unit only).
- Kharisma checker on the 7 r7 scene files: 7 PASS, 0 violations, exit 0.
- 4-ID smoke (Ichsan, Noor, Guest1, Guest2) on a throwaway port other than 8787.
- Secret scan of added lines: counts only.

## Rollback

Leave `origin/main`, the Worker, densify, and pipeline `c9dc88f` untouched. Delete or reset `preview/njh-step2-r7-20261122`. STEP 1 remains on `preview/njh-sync-decisions-20261122` at `e418b3d`.

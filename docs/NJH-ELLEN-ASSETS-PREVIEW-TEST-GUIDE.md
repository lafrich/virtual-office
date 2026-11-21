# Ellen assets preview — testing guide (checkpoint)

Branch (preview only, do not merge/live yet):
`preview/njh-sync-decisions-20261122`

- Virtual Office: https://github.com/lafrich/virtual-office/tree/preview/njh-sync-decisions-20261122
- Asset pipeline: https://github.com/lafrich/virtual-life-asset-pipeline/tree/preview/njh-sync-decisions-20261122

Cache bust for this checkpoint:

- Service worker: **sw v36** (`sw.js` header)
- Script tag: **`?v=njh-ellen-assets-20261122`**
- Hub build: **`hub-20261122-ellen-assets`**

Do not deploy the Worker. Do not push `main`. The landscape preview branch `preview/njh-landscape-loading-20261122` is owned by another worker.

## How to open the preview locally

From a clone of this preview branch:

```bash
# Virtual Office worktree
python3 -m http.server 8765 --directory .
# then open:
# http://127.0.0.1:8765/mainkan/   (Mainkan / play)
# http://127.0.0.1:8765/world-builder/  (Semesta + Asset Library + Bangun)
```

Confirm the page fetched scripts with `?v=njh-ellen-assets-20261122` and that DevTools Application shows sw v36 after a hard refresh. Raw-branch art (after push) also loads from:

`https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/preview/njh-sync-decisions-20261122/assets/...`

Local copies used when serving world-builder live under `world-builder/ellen-preview-assets/`.

## Per-item checks

### 1. Bangun templates ×3 (`rumah_biasa`, `warung_makan`, `wc_umum`)

- Open Bangun Ruang → Indonesia pack templates.
- Confirm the three recipes appear and can be applied to an 8×6 (or larger) room.
- Check door, chair pairing, reachability, save/reopen.
- These are editor recipes only. Street play doors `rumah_biasa` / `wc_umum` / `warung_makan` already have existing play interiors; this pack does **not** unlock those doors. Other doors stay **Belum buka**.

### 2. 15 catalog vehicles (B1 / B2 / B4-R2)

- In Semesta Asset Library, Indonesia / prop transport, look for Angkot Kota, Ambulans, Bus Kota Kecil, Elf Travel, Mobil Angkut Sampah, both pikap, both truk, Bajaj, Becak, Bentor, Delman, Sepeda Ontel Tua, Sepeda Tukang Roti (4 directions).
- Place one of each; art must be the real PNG (no canvas silhouette), grounded on the manifest pivot, not a 95% footprint clamp.
- These are **not** the four NJH-map traffic vehicles (gojek / taxi / sedan / bus_transjakarta). Those stay on the map with their own v3 PNGs.
- B3 motors stay retired and must not reappear.

### 3. C1 park-bench / park-table

- Place Bangku Taman and Meja Taman. They should use Ellen’s taller proposal canvases (bench 104×89, table 108×68) rather than the old procedural 104×74 / 108×47 draws.
- Lamp / trash from the C1 pack were not requested and were left alone.

### 4. LGR tee + trousers phase 1

- In Mainkan / Mahluk wardrobe, `tee_v4` and `trousers_v4` (M and F) should be selectable on the official LGR bases (male official-8, female official-9).
- Check idle + walk for obvious holes or sleeve gaps. `_under` strips are vendored but compositor injection may still be incomplete — report any rest-pose slits.
- Phase 2 outfits (kemeja, celana pendek, rok, sarung, daster, footwear) must **not** appear.
- Walk-hole sheets on the landscape preview branch may still be a separate conflict; do not treat this checkpoint as a fix for official-9 holes.

### 5. WC V4

- Catalog id is **`id200_publik_wc_umum_kumuh`** (296×254, pivot 148,182).
- The map WC at the existing facade **`id200_publik_toilet_umum_kampung`** (260×262) must be unchanged.
- Interior worn squat toilet + bucket/dipper sprites live under `ellen-preview-assets/wc-v4-interior/` for review; they are not auto-swapped into the live play WC interior.

### 6. Kali / canal ripple

- On the NJH map, river / Kali tiles should show the 8-frame water ripple (120 ms, 960 ms loop). Collision/walkability stays as before (not walkable).
- **Do not expect** selokan / drain cell JSON to change. Drain art and `selokan_grill` were deliberately not overlaid.

### 7. Loak v2 (85 new)

- Asset Library / loak group should list 122 types (37 preserved originals + 85 new). New ground + icon PNGs are under `world-builder/legacy-assets/loak-v2/`.
- Pick up a couple of new types; originals should still match the old bytes.

### 8. Street props r1

- Check tiang listrik / polos / trafo, bangku taman, hydrant Jakarta, tong sampah (revised PNGs).
- `selokan_grill` must **not** have been replaced.

### 9. Mahluk activity / mandi sheets

- Vendored at `ellen-preview-assets/v6p-act-preview/` and pipeline `site/media/v6p-act-preview/`.
- Status is **authored_pending_compositorQA**. They are not marked play-ready. Do not expect live mandi/activity compositing until a later hook.

### 10. Already in this WIP (honest mix, not a second commit)

Some approved logic landed in the same preview tree before the “masukin dulu” checkpoint and ships with it: penanda→sajadah/lapak swaps, real NJH traffic vehicle PNGs, Belum buka doors, wage cap 150000, jijik alias, official-9 constant, NPC kasir/staff aliases, partner/cook/clock-preserve/sell hooks. Clock **rates** must stay unchanged (New Bot owns the single-clock table); this checkpoint only preserves visual clock state.

## What was rejected / skipped

- 8 r6 interiors; Kang Parkir / Manusia Silver / Pak Ogah sprites (Ellen revising).
- Selokan map data and `selokan_grill` overlay (Ellen densify + safety).
- LGR phase 2 outfits.
- Overwriting the live kampung WC facade with V4 (size/pivot mismatch).
- B3 motors.

## Shots

Contact / before-after sheets: `/workspace/njh-sync-shots/ellen-assets/`.

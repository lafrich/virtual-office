# NJH map v2 asset fix — traffic clip + ugly placeholder figures (22 Nov 2026)

Branch `preview/njh-map-v2-assetfix` = live main `dbc72cd5` (CP3, sw v46) + map distance v2 (`f6da4420`, cherry-picked) + this fix.
Data / asset / tools / tests / docs only. **No `sw.js`, `index.html` or engine code.**

## Bug 1 — "mobil masuk ke dalam bangunan" (Ichsan t582–t585)

Reproduced in game (player mode, `?player=1&njhMap=1`, swiftshader) with a 1 s time series of every
car and a follow camera (`/workspace/njh-traffic-clip/renders/`).

| # | Vehicle | Where | What you see | Cause | Fix (data) |
|---|---|---|---|---|---|
| 1 | Sedan Merah (`sedan`) | Jl. utama row z=43.5, x≈-34…-31 and x≈-22…-19 | car slides half under the roofs of Rumah warga 20 / 24 (and 09–11 row), looks like it drives into the house | inner lane z=43.5 is only 4 tiles behind the south house row (r 47.8–52); in the fixed iso camera those nearer houses' sprites cover ~32% of the car | lane moved to the far lane **z=42.5**, direction **east** (cover now ≤17%) |
| 2 | Bluebird Taxi (`vehicle-luy67o`) | west end of row z=73.5 | after its first pass the taxi spawns nose-first into Angsana tree `jakarta-green-v5-22586`, is blocked and never comes back | route start (-47.5,73.5): 3.1–3.36 tile car body reaches x=-49.18, tree footprint starts at -48.88 | lane **z=74.5**, direction **east** (start is clear of trees) |
| 3 | Maxim + Penumpang (`vehicle-jff4pv`) | east end of row z=74.5 | drives west once, then disappears for good | westbound route starts at x=-5.5; the body leaves `worldBounds` (maxX=-5) so the runtime can never respawn it | lane **z=75.5**, direction **east** |
| 4 | all eastbound cars | east map edge | car stops at the edge for up to 6 s, then vanishes | route runs to the last road tile, physics stops the body at `worldBounds`, `stopVehicle` recycles after 6 s | **engine, not in this package** (see below) |

Why nothing caught it: every checker (layout R1–R7, `check_trees`, `check_water_axis`, distance) only tested
static objects; nobody drove the traffic paths or looked at a moving car, and all reviews used stills.

Now caught by `tools/njh-traffic-clip-check.cjs` (+ `tests/njh-traffic-clip.test.cjs`):
T1 ground clip vs solids · T2 door/use/spawn tiles · T3 off-road mid-route · T4 sprite ≥25% under a nearer
building (iso billboard depth x+z, natural sprite px·PX, catalog pivot) · T5 parked vehicles · T6 respawn blocked;
W1–W3 engine/kerb warnings. Routes come from the real `semesta-traffic.js`.

Result: map v2 HEAD and live main `dbc72cd5` → **FAIL** (T1 1, T4 2, T6 2); this branch → **PASS** (warnings W1/W2/W3 only).

### Engine changes needed (Baymax — NOT included, data fix above is complete without them)
1. `world-builder/builder.js` `updateVehicle`: when `physics.check` fails with `reason==='bounds'` (or `remaining <= lengthOf/2`), call `recycleVehicle(agent)` immediately instead of `stopVehicle` (removes the 6 s freeze at the east edge, W1).
2. `attemptVehicleRespawn`: sample the spawn at `distance = lengthOf(record)/2` instead of `0` (and recycle at `route.length - lengthOf/2`), so westbound / northbound lanes can respawn inside `worldBounds` and the body never overhangs the road end (W2). After that the Maxim can drive west again (two-way traffic).
3. Optional: extend the existing player occluder fade (buildings/trees turn transparent over the player) to vehicles, so a car passing behind a roof shows through instead of looking buried.
4. Note: `style-rules.js footprint()` keeps vehicle footprints horizontal for `direction:'auto'` vertical routes (gojek). Harmless today.

## Bug 2 — "placeholder orang jelek lolos ke preview" (Ichsan t586)

Top-right of the map (pasar block):

| Object | Was | Fix |
|---|---|---|
| `njh-tenda-pecel-lele`, `njh-tenda-sate-madura` (`world-builder/njh-map-preview/tents/{pecel,sate}_{sw,se,ne,nw}.png`) | the LFB tent generator baked its 64×112 **placeholder NPC figures** (navy + green "pedagang/pembeli") into all 4 views | re-rendered from the same source (`lfb-quality-guide/demo/bangunan-tenda/make_bangunan.py`, `render(view,'full',extras_fn=None)`); the generator reproduces the old PNGs pixel-exact, so only the figure pixels changed. Same size 242×236 and pivot. |
| `njh-lapak-bekas` Lapak Barang Bekas | `pipeline:lapak_barang_bekas` has a blocky grey seller baked into all 4 views | reuses DB stall **`pipeline:lapak_aksesori`** (published, same 2×1.5 footprint, no person); city + meta interactable asset updated |

Listed for redraw (LGR, not hidden — gameplay NPCs, Ichsan rule t514 keeps old NPCs until LGR exists):
Pak Ogah (`njh-npc-pak-ogah`), Manusia Silver (`ref-ambient-9`), Kang Parkir (`ref-ambient-11`) draw the
procedural canvas figure (`questGraphic`) while the Mahluk reference reset is active. Also redraw a seller for
Lapak Barang Bekas and LGR sellers for the two tents if people are wanted there.

Now caught by `tools/njh-placeholder-check.cjs` (+ `tests/njh-placeholder.test.cjs`): P1 unregistered asset
(fallback render) · P2 pending/unpublished · P3 known figure assets + placeholder-NPC palette in generator tent art ·
P4 procedural quest NPC (t514 list → WARN, anything else FAIL).
Result: live main `dbc72cd5` → **FAIL** (P3 9); this branch → **PASS** (3 t514 warnings).

Both checkers read footprints from `world-builder/njh-map-preview/catalog-snapshot.json` when present (densify package), else from the bundled `tools/njh-catalog-snapshot.json` (same data + `pipeline:lapak_aksesori`).

## Mandatory before any map preview (added to the guides)
1. `node tools/njh-traffic-clip-check.cjs` and `node tools/njh-placeholder-check.cjs` → PASS.
2. Watch moving traffic in game for at least one full loop of every car (not stills).
3. Visually scan the whole map at play size for placeholder / procedural people.

# Merge plan: preview/njh-map-draft1 interiors → main

This is a plan only. This branch does **not** merge the interiors, and it does not touch `/workspace/njh-map-preview` (that tree has uncommitted r6 door-wiring and must be left alone). Dock crop and selokan work stay paused (Ellen P2). Live deploy still needs Ichsan's own OK.

## What exists today

- **main / origin/main:** no NJH district map, no `?njhMap=1` interiors. Player mode is `world-builder/?player=1` on the default Semesta city. Kost/tent/warung are life *sites* (name-pattern pins), not enterable rooms with furniture.
- **preview/njh-map-draft1** (`/workspace/njh-map-preview`): local preview, 4 commits ahead of origin/main plus **uncommitted r6 door-wiring**. Flag `?njhMap=1` (Mainkan forwards it to the iframe). 14 interiors (6 earlier + 8 r6 scenes), door anchors, edge clamp. Kost interior already has `bed`, `stove`, `shower`, `squat_toilet`.

## What to merge (files)

Bring these from the map-preview branch (after r6 is committed *there*, not from a dirty tree):

1. `world-builder/njh-map-preview.js` and `world-builder/njh-map-preview/` (map meta, city JSON, `interiors/*.interior-scene.json`, PREVIEW doc, serve script). Include the 8 untracked r6 interiors once they are signed off: koperasi, mushola, nasi_sunda, pecel_lele_tenda, sate_madura_tenda, toko_loak, warung_kopi, warung_madura.
2. `world-builder/bangun-ruang/njh-interior-art-preview.js` and `njh-interior-preview-art/` (catalog + furniture PNGs). Needed so rooms are not empty boxes.
3. Small, reviewable wiring: `world-builder/index.html` (script tag only), `world-builder/builder.js` (`njhMapPreview` flag, door enter, bounds, enterable copy), `mainkan/app.js` (forward `?njhMap=1` — already a few lines).
4. Tests: `tests/njh-map-preview.test.cjs` and the smoke py.

Do **not** merge incidental dirt from that worktree: `shared/genesis-player.js` is an unrelated LGR edit. Re-check `interior-isometric.js`, `style-rules.js`, `world-physics.js`, `quick-tutorial.js`, and `shared/cloud-first-native-entry.js` diff-by-diff; only take changes that the map preview actually needs.

## What this hooks branch already prepared

- `nearbyActions()` / `runAction` furniture gates (Masak → stove, Mandi → shower/kamar_mandi, Tidur → bed).
- Adapter point: `SemestaLifePlay.setInteriorFurnitureAdapter(fn)` and `bridge.interiorFurniture()`. Builder already forwards `VLNjhMapPreview.interiorFurniture` when that function exists.
- Helper: `SemestaLifeHooks.furnitureFromInteriorItems(items, origin)` understands the interior-scene shape (`assetId`, `name`, `c`/`r` or `x`/`z`).
- `enterables()` already accepts `enterable`, `interior.floors`, and `njhInteriorTemplate`, and will use `VLNjhMapPreview.doorAnchor` when present.
- `questMarkers()` / `worldToScreen()` are ready for the preview map's NPCs and doors.

On merge, add `VLNjhMapPreview.interiorFurniture()` (or set the adapter when an interior opens) so hooks see the room's items in world space. Until then, owned Jiwa furniture (`bed`, `stove`, …) still gates kost actions on main.

## Order

1. Commit the uncommitted r6 door-wiring **on the map-preview branch**, with screenshots. Do not include dock/selokan.
2. Rebase or fast-forward that branch onto the then-current main (fast-forward only if it is going toward live later; preview can rebase).
3. Land this hooks branch (or cherry-pick it) so the adapter exists before interiors go to main.
4. Copy the map/interior files above into a new preview branch on top of hooks+main. Keep `?njhMap=1` off by default so default Mainkan play is unchanged.
5. Wire `interiorFurniture()` when `interiorPreview.openFor` is active; map item `c,r` through the room origin to world `x,z`.
6. Preview + desktop/phone screenshots: enter kost, Masak at the kompor, Tidur at the kasur, Mandi at the shower; street buildings still enter at the door tile. Confirm hooks hide those actions when the matching item is not nearby.
7. Only after Ichsan's own OK: fast-forward deploy, bump the service worker, write a rollback note. No force-push.

## Risks

- **Dirty r6:** merging from the current `/workspace/njh-map-preview` tree would drag uncommitted art/test/meta edits and untracked interiors. Copy from a clean commit.
- **builder.js overlap:** the map-preview builder already has a large `njhMapPreview` patch. Re-apply it carefully onto this hooks builder (pause listener, `worldToScreen`, `SemestaPlay` aliases, day-end). Do not drop either side.
- **Default city vs NJH map:** turning the flag on for everyone would replace the live Semesta city. Keep the flag off until Ichsan wants the district as the default.
- **Dock / selokan:** out of scope and paused. Do not take those assets or rotations in the same merge.
- **Placeholder deletion:** old placeholders stay until Ichsan approves a list himself.
- **Scale / door audit:** Ellen still owns the door/scale pass; hook `enterables()` should keep using door anchors so tooltips sit on the door, not the building centroid.
- **Kost on main vs NJH kos:** today's life "kost" is a site pin plus owned furniture. After merge, prefer the real `njh_kos` interior when the player owns a room, and keep the hobo tent path for players who do not.

## Out of scope here

Merging the map, implementing `VLNjhMapPreview.interiorFurniture`, changing spawn into a real interior, dock/selokan, and any live deploy.

# Semesta — Virtual Life City Builder (XP / AI-ready)

**Single supported editor**: https://lafrich.github.io/virtual-office/world-builder/

This is an authoring companion for [Virtual Life Asset Pipeline](https://lafrich.github.io/virtual-life-asset-pipeline/), built with the same Windows XP / Paint design language. Use it to lay out streets, buildings, trees, furniture, map triggers, and tentative entrances, then export a structured JSON map that future developers or AI agents can connect to gameplay.

**This editor DOES NOT change the online Virtual Life map, accounts, saved game, NPC behavior or multiplayer.** The retired GPT Original Builder route `/world-builder/gpt/` was removed, and original GPT assets were merged into the single catalog.

## Source/art hierarchy

1. **Original GPT art**: individual asset paths already known from the protected game's `assets/env/` and `assets/street2/loak/` catalogs. Requires an authenticated Virtual Life session in the same browser because the root game Service Worker decrypts this art at runtime. No plaintext original assets are copied.
2. **Asset Pipeline art**: original official v6b characters and any genuinely published sprite output (currently the hotel sample).
3. **Official pipeline *metadata***: building dimensions, orientations and anchors in `assets/street_buildings/manifest.json`, and 17 active tree + 15 ground sprite IDs from `assets/vegetation_kebonsirih/manifest.json`. Most output PNGs have **not been committed** to that source repository. Shrubs on hold are excluded.
4. **Explicit placeholders**: labelled pixel planes for missing standalone props, and 3D building block studies matching official footprint. Placeholders are not equivalent to completed source art. A baked GPT street background is not separable into editable building meshes; view it from **Map Reference** for comparison.

## Visual calibration

- Canonical reference: 2:1 isometric; map tile is **64×32 px**; frame is **64×112 px**; character pivot at **(32,100)**; standing height about **84–88 visible pixels**.
- Orthographic camera at a **30° elevation** instead of the old ~35.8°. Sprite geometry compensates for vertical projection; all source pixels use a common 64-px tile width scale instead of separate guessed character scale.
- Sprite planes maintain nearest-neighbor texture sampling, alpha-tested outlines, camera-facing placement and depth testing. Character scale remains locked to 1.
- Drag and snap by half-tile, 90° allowed rotation where source directional variants exist. Other objects have uniform 0.85–1.15 map scale.
- Mobile **two-finger pinch zoom/pan** is anchored to the world position under the fingers. One finger pans empty ground; **Move** + drag places selected entities. Desktop wheel remains a convenience, but there are no zoom +/- UI buttons.

## Workspace

- **FILES / ASSETS**: searchable source-aware categories for Buildings, Street, Vegetation, Interior, Characters, and Logic Markers. Labels distinguish verified GPT originals, published Pipeline PNGs, and metadata-only placeholders.
- **Canvas**: 3D WebGL depth + orthographic camera. Select, move, rotate, duplicate, undo/redo and a 4-way character walk preview.
- **LAYOUT inspector**: C / R / height, 90-degree facing, source-locked character proportions.
- **LOGIC inspector**: object name, layer/subtype, tags, interactions, capacity, optional entrance facing, blocking, and notes.
- **Map markers**: spawn, entrance, interaction, patrol, and trigger. These are authoring markers, not real runtime trigger volumes.
- **Export Map JSON**: data-only `virtual-life-ai-map-v2` schema with source provenance, footprint dimensions and *disabled proposal hooks*. No executable AI/game code embedded in JSON.

Existing map layouts saved in browser local storage are preserved. To see the new default 32-object study, **export your current layout first**, then use **View / Reset**. The new sample includes five candidate markers. Candidate locations are **not** a verified copy of the protected production scene.

For schema contracts and game-logic handoff, see [MAP_SCHEMA.md](./MAP_SCHEMA.md).

## City Builder v3 — roads, tiles, grid, placeholders

- **Grid**: the editor shows a full 1×1 c/r tile grid over the projected 3D floor, aligned to the native 64×32-px iso grid. Use the `#` toolbar control, `# Grid ON/OFF`, or the `H` shortcut to toggle visibility. Placement stays grid-aligned; the independent Snap tool controls half-tile object dragging.
- **Terrain**: choose Road, Sidewalk, Grass, Water, Plaza or Soil under FILES → TERRAIN / ROADS. The Paint tool draws with 1×1, 2×2 or 4×4 brushes. The Fill tool replaces a connected terrain region (up to the map limit). Roads automatically expose an adjacency shape (`straight`, `corner`, `t`, `cross`, `end`). Automatic neighboring sidewalk is optional. Roads and water block new building/prop placement.
- **Buildings**: FILES → CUSTOM BUILDINGS offers **Small 3×3**, **Medium 5×4**, **Large 8×6** replaceable drafts. Tap/click the canvas to place; valid/invalid footprints are shown in green/red. Width, depth and height can be changed in the inspector. Replace with official prefab art using **Replace with asset**; the source catalog remains distinct from placeholders.
- **Props**: tree, streetlamp, bench, native catalog props; select a prop and tap the map to place repeatedly. Pinch zoom and two-finger camera pan remain enabled; pointer gesture cannot move authored objects while pinching.
- **City Sample**: choose **City Sample** for an optional editable layout with road intersections, sidewalks, central park, a small pond, 10 replaceable buildings and 8 street/park props. Existing Street2 draft and browser saves are not changed unless you confirm. Export your draft before replacing it.
- **Persistence**: terrain resides in `map.terrain` (`default` and individual `cells`). Undo/Redo and JSON export/import include the terrain layer. Road cells export their adjacency shape and driveable/walkable/buildable hints in `virtual-life-ai-map-v3`. These are annotations, not active driving or NPC code.

The visual road/ground tile colors and custom building models are **editor placeholders**, not final pixel assets.

## Mobile panel and unbounded map update (2026-11-03)

- **Mobile Properties/Logic sheet**: the header now has a visible **⌄ Minimize** button. The file browser has an explicit × close button. A floating **☷ Properties** control reopens the inspector directly from the canvas. Selecting a building, terrain brush or prop no longer forces a sheet open over the placement view. Sheets are limited to roughly half the mobile viewport; their header remains visible during scroll.
- **Unbounded grid**: the original `map.worldBounds` remains only as a historical sample-region reference. `map.unbounded=true` removes the fixed placement border and terrain painting bounds. The isometric grid and base grass plane are **camera-windowed** (rendering extends as you pan/pinch), while terrain and objects stay serialized in world coordinates. Offscreen ground tiles are not individually allocated.
- **Viewport-limited Fill**: an unbounded grass field cannot be globally flood-filled, so Fill acts on the *current visible area*. The paint brush, roads, water, and placement are not restricted to that area.
- Existing locally saved maps automatically migrate to unbounded mode without erasing the original Street2 placement data. Large drafts may encounter the browser's local-storage quota: export JSON regularly for long-running builds.

This is a map editing system; it does **not** stream an infinite prepopulated town or enable gameplay mechanics.

## Reference City and named draft saves (2026-11-03)

- The **Reference City** preset is a layout recreation inspired by the supplied bird's-eye/isometric city screenshot, not a bitmap: roughly 77 independent replaceable buildings, hospital, church, civic/police/jail buildings, clock tower, school, mixed shops and homes, factory, warehouse, north-west lake/trees, a central public park, and a city-wide road/sidewalk grid. Building geometry and other missing game assets are labelled placeholders.
- **New installs** start with this reference-inspired editable map. Existing browser working copies continue to load first, so they are not overwritten. Use **🏙 Reference City** to load the preset intentionally, or **View / Reset** to return to the current default.
- **Save City / Save Draft** creates a named city snapshot. **My Cities** lists local drafts with last-saved date, object count and tile count. Users can **Open**, **Save**, **Save as New** or **Delete** them. The active draft can be saved again with one tap.
- Draft snapshots are stored **locally in IndexedDB**, with a localStorage fallback when IndexedDB is unavailable. Working edits continue to autosave separately. **These are not GitHub, online server, multiplayer or cloud saves** and are not shared between devices or browsers. Users should **Export JSON** for transferable backups.
- Creating a new preset, resetting or importing JSON detaches the previously active named draft, to avoid accidentally overwriting the prior saved city. A confirmation precedes destructive canvas replacements.
- Preset geometry, terrain and named drafts share the same editable `virtual-life-ai-map-v3` schema. Opening a draft restores its objects and terrain; all markers are design annotations only.

## Camera to Character (follow / Walk Test)

Use **🎥 Character** in the canvas toolbar, the **◎** camera icon in the left tool strip, or **🎥 Camera to this Character** in the selected-character inspector.

- Focuses the orthographic isometric camera directly onto the selected character, or onto the player preview (avatar) / first NPC if no character is selected.
- Switches into **Walk Test** automatically. Move using touch D-pad on mobile or WASD / arrow keys on desktop. Camera tracks the live preview actor with frame-rate independent easing.
- **Two-finger pinch** adjusts zoom while following; **one-finger pan** on empty terrain detaches follow to allow map browsing.
- Use **🗺 Map** (or the Home button) to exit follow, reset unsaved preview movement and restore the exact camera focus and zoom held before entering follow. This does not update map geometry or saved city drafts.
- Switching to a different city, reset, import, undo, or deleting the followed character safely ends the character-camera session.
- New Reference City layouts contain an editable **Player · Camera Preview** avatar near the spawn marker. Older drafts without an avatar can add one from **Assets → Characters**.
- Camera following does not introduce third-person perspective distortion or write character positions to the multiplayer game; it remains a rendering/authoring preview.

## Solid objects, large-building transparency and first-run onboarding

- During **Walk Test / Character Camera**, every static object marked `collision !== false` and `blocking !== "no"` acts as a physical obstacle: buildings, shops, trees, benches, street lamps, trash bins and other players/NPCs. Terrain water is also non-walkable. Marker points and explicitly passable/decorative objects do not block movement.
- Character movement is simulated at up to **0.18 map units per physics substep** with axis-by-axis sliding around obstacles, reducing tunneling at high frame times. Characters are never moved through objects during the Walk Test. This simulation does **not** modify saved player coordinates, the multiplayer engine or gameplay physics.
- Dragging any editable object/player now rejects invalid positions **before** showing an overlapping placement, rather than reverting only after pointer-up. Collision uses native tile footprints and respects quarter-turn building rotation.
- For visibility, only **large, solid buildings/shops** with footprint area ≥12 map cells and nominal height ≥2.8 units are made semi-transparent when a ray from the current preview character toward the orthographic camera passes through their visual occupancy box. Opacity eases toward **0.23**, then restores to its previous value upon leaving the occlusion corridor. Trees, benches, lamps, small props and logic markers stay visually unchanged.
- First-time visitors see an XP-styled, **5-step Welcome Wizard** covering map navigation, asset placement, terrain painting, character camera/collision and saving city drafts. Choose **Skip** at any time. Finish or skip is remembered in local browser storage. Reopen it later with **❔ Quick Tutorial** in the top bar.
- Runtime caveat: the original standalone builder is an **authoring preview**, not a multiplayer game. Collision is footprint-based and the occlusion volume for a complex sprite building is an approximation; integration into a production navigation/physics engine remains a separate task.

## Semesta: automated traffic, pedestrians, crowds, and quest NPCs (2026-11-03)

The map-authoring app is branded **Semesta** (`SEMESTA.EXE`). Both the left-hand tools and the mobile Quick Tutorial / City Draft dialogs are centered vertically.

### Editable ambient movement
- **Assets → MOBIL / MOTOR:** sedan merah/toska, hatchback, MPV, taxi Bluebird, van, TransJakarta bus, Gojek, Gojek passenger, Maxim, Maxim passenger, and SMA triple rider. The official vehicle IDs, dimensions, pivots, directions and route classes come from `lafrich/virtual-life-asset-pipeline/assets/street_vehicles/manifest.json`.
- **Assets → NPC / CROWD:** place an individual canonical V6B character or a multi-person crowd. A regular NPC walks **straight along one connected sidewalk corridor**; on reaching the end, it starts the same path again. Crowds stagger several characters along one such path. Use the Inspector to adjust direction, speed and crowd count.
- **Assets → NPC QUEST / JOB:** Manusia Silver, Pak Ogah, Kang Parkir, Babeh Pemilik Toko Loak, Babeh Jam, Babeh Tas. They remain **stationary** on a sidewalk with a lightweight idle/pose preview. Job IDs and proposed `talk`/`accept_job` interactions are exported but **no actual quest, job payouts or gameplay logic execute here**.
- **Only approved surfaces:** cars/motorbikes snap to authored **road** tiles; pedestrians and crowds snap to **sidewalk** tiles; job NPCs are stationary on sidewalks. Editing the road/sidewalk recalculates routes; automated agents that lose a valid route are hidden rather than driving onto grass. The movement preview operates continuously while Semesta is open, without requiring Character Camera.
- **Repetition:** a vehicle on a two-lane road follows a loop along the paired straight lanes. A single-lane road and straight sidewalks loop by starting again at their beginning. This is deterministic map-preview traffic, not production traffic-light or economy AI.
- **Collision:** actors obey existing authored solid objects; ambient vehicles and walkers also keep their moving footprints separate where possible, and Walk Test includes live traffic/crowd bodies.
- **Reference City** is seeded with example cars, TransJakarta, Gojek, walking NPCs, a crowd, and four stationary job NPCs. Existing saved drafts are not overwritten automatically. New movement settings, job IDs, and the subtype of every automatic entity are included in named City Drafts and exported JSON.

### Asset availability
Upstream `assets/street_vehicles/cars/`, `riders_v3/sheets/`, and the job NPC `frames/` directories currently contain only `.gitkeep`: the actual output PNG files have not been committed. Semesta therefore renders explicitly **temporary, original pixel-preview silhouettes** for the vehicle and special quest NPC archetypes; they are **not pixel-identical to the original game assets**. Canonical V6B walking characters use real published sheets. This tool never decrypts/replaces source artwork or updates the multiplayer game.

### Inspector and controls
Select a traffic object and open **Properties**. The **AUTO LOOP / SIMULATION** section lets you set speed, choose the straight walking direction, pause movement, adjust crowd size, or change a stationary NPC's idle action. **MOBIL / MOTOR**, **NPC / CROWD** and **NPC QUEST / JOB** are available in the Assets category filter. Save with **💾 Save Draft** or Export JSON for AI map handoff.

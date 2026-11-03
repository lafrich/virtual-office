# Virtual Life — World Map Builder (XP / AI-ready v2)

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

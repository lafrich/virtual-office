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

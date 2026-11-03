# Bangun Ruang — Virtual Life Building Studio

Standalone pixel-building asset editor, integrated with Semesta (City Builder) without touching the production game, online inventory, map, accounts, or multiplayer.

- Editor: https://lafrich.github.io/virtual-office/world-builder/bangun-ruang/
- Semesta: https://lafrich.github.io/virtual-office/world-builder/
- Source of truth for style: Virtual Life Asset Pipeline STYLE.md.
- Source of truth for placement: Semesta world-builder/map-schema.js and style-rules.js.

## Building authoring

Choose one of **18 existing Semesta bases**: native Small 3×3, Medium 5×4, Large 8×6 and 15 pipeline metadata prefabs (including ruko, warung, rumah kampung, kantor, hotel, mall, cafe and toko loak). This list is built from Semesta's own world-builder/pipeline-catalog.js and world-builder/semesta-building-spec.js — **not from invented custom dimensions or separate Virtual Life source files**.

The selected base supplies its original **footprint [C,R]**, canonical base height, source identifier and per-facing native-size/pivot metadata where available. Change width/depth (up to 24 tile units, 0.1 precision), 1–12 floors, materials, signage, roof, modular door/window style, awning, optional balcony, entrance facing, collision and interactions. Every structural change regenerates native 1× isometric pixels. Use **Edit Native Pixels** for pencil, eraser, eyedropper, zoom, undo/redo and per-direction manual correction. Structural regeneration intentionally clears manual corrections to avoid stale overlays.

This is a **procedural first-pass building studio**, not an exact hand-painted recreation of the original Virtual Life buildings. It obeys the documented material/geometry rules but visual QA against original production sprites remains necessary.

Native contract:
- 2:1 isometric projection with tile pixels [64,32].
- 4–5 tone flat-shaded materials as v6b; upper-left lighting; material-coloured outlines, no black outlines or gradients.
- Background transparent (separate low-opacity shadow); sprite pixels rather than a 3D mesh screenshot.
- Four views: sw, se, ne, nw; no runtime smoothing or raster rotation.
- Per-view PNG size/pivot preserved for each generated output. Where source catalog views exist, they inform the canvas dimensions/anchor; generated canvas can be larger than a source PNG when necessary to avoid clipping.
- Footprint = [width along C, depth along R] in tiles. Rotations in 90° steps.
- Interactions, entrance facing and blocking are proposed metadata only; Semesta applies collision rules.

## Storage, export, Semesta link

**Save Asset** or **Save to Semesta** stores the building package (including all four embedded PNGs) in the browser's localStorage key **virtual-life-bangun-ruang-v1**.

Semesta loads bangun-ruang/semesta-bridge.js before initializing its World Builder catalog. This makes saved assets available in FILES / ASSETS → BUILDINGS under the reference studio:asset-id. The bridge feeds actual PNG data URLs to the normal Three.js sprite loader, and style-rules.js recognizes custom-building sources as structures. Use Open Semesta or reload an existing Semesta tab to refresh the catalog.

The local integration works only in the **same browser profile and GitHub Pages origin**; it does not commit files to GitHub or sync across devices. Export a building package for backup. When importing a city JSON on another device, first import the matching Bangun Ruang asset package (the importer preserves its stable ID), then import the city JSON in Semesta. Both files must use the same browser profile.

**Export Package** JSON contains:
- format: virtual-life-building-asset-v1
- id, name, config, updatedAt
- projection: iso-2:1, tile [64,32], C/R, four directions
- footprint [w,d], entranceFacing, blocking, interactions
- views.sw/se/ne/nw each with url (embedded PNG data URI), size and pivot

**PNG Current View** exports the actual native transparent PNG, including per-view manual pixel edits. The full package includes `semestaBase`, `baseHeight`, original source-size references and four generated PNGs.

## Limitations / TODO

- Browser-only storage; no cloud publishing, GitHub write token, or production game modification.
- Original Virtual Life art is protected, and most pipeline building PNGs remain unpublished. This editor uses **Semesta metadata** to synthesize new v6b-style pixel art; it does not extract or pretend to reproduce those original sprite pixels.
- Modular facade options and per-direction pixel-editing are implemented, but there is not yet multi-layer interior construction or true native-room editing.
- Large-building collision and occlusion in Semesta are approximate editor previews, not a multiplayer navmesh.
- A production release needs sheet/atlas production, stable-ID cloud publishing, interaction-anchor offsets, and visual comparison against actual game scenes.

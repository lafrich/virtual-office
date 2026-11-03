# Bangun Ruang — Virtual Life Building Studio

Standalone pixel-building asset editor, integrated with Semesta (City Builder) without touching the production game, online inventory, map, accounts, or multiplayer.

- Editor: https://lafrich.github.io/virtual-office/world-builder/bangun-ruang/
- Semesta: https://lafrich.github.io/virtual-office/world-builder/
- Source of truth for style: Virtual Life Asset Pipeline STYLE.md.
- Source of truth for placement: Semesta world-builder/map-schema.js and style-rules.js.

## Building authoring

Generate pixel-art buildings from five presets (Rumah, Ruko, Warung, Kost, Kantor). Set footprint C/R (2–12 tiles per axis), 1–7 floors, windows, wall/roof palette, roof shape, storefront detail, signage, entrance facing, interactions and collision. Every edit redraws the sprite at native 1× pixels; the viewer uses nearest-neighbour scaling.

This is a **procedural first-pass building studio**, not an exact hand-painted recreation of the original Virtual Life buildings. It obeys the documented material/geometry rules but visual QA against original production sprites remains necessary.

Native contract:
- 2:1 isometric projection with tile pixels [64,32].
- 4–5 tone flat-shaded materials as v6b; upper-left lighting; material-coloured outlines, no black outlines or gradients.
- Background transparent (separate low-opacity shadow); sprite pixels rather than a 3D mesh screenshot.
- Four views: sw, se, ne, nw; no runtime smoothing or raster rotation.
- Per-view PNG size and pixel pivot from footprint center at ground level; four directions are native renders.
- Footprint = [width along C, depth along R] in tiles. Rotations in 90° steps.
- Interactions, entrance facing and blocking are proposed metadata only; Semesta applies collision rules.

## Storage, export, Semesta link

**Save Asset** or **Save to Semesta** stores the building package (including all four embedded PNGs) in the browser's localStorage key **virtual-life-bangun-ruang-v1**.

Semesta loads bangun-ruang/semesta-bridge.js before initializing its World Builder catalog. This makes saved assets available in FILES / ASSETS → BUILDINGS under the reference studio:asset-id. The bridge feeds actual PNG data URLs to the normal Three.js sprite loader, and style-rules.js recognizes custom-building sources as structures. Use Open Semesta or reload an existing Semesta tab to refresh the catalog.

The local integration works only in the **same browser profile and GitHub Pages origin**; it does not commit files to GitHub or sync across devices. Export a building package for backup. When importing a city JSON on another device, Semesta can only preserve a studio asset reference if that exact ID is already registered in localStorage.

**Export Package** JSON contains:
- format: virtual-life-building-asset-v1
- id, name, config, updatedAt
- projection: iso-2:1, tile [64,32], C/R, four directions
- footprint [w,d], entranceFacing, blocking, interactions
- views.sw/se/ne/nw each with url (embedded PNG data URI), size and pivot

**PNG Current View** exports a native transparent PNG for further manual pixel-art refinement.

## Limitations / TODO

- Browser-only storage; no cloud publishing, GitHub write token, or production game modification.
- Existing original game assets are protected; most source pipeline building PNGs remain unpublished. Do not label procedure-generated art as original.
- Templates are a starter, not pixel-by-pixel brush editing or layered interior construction.
- Large-building collision and occlusion in Semesta are approximate editor previews, not a multiplayer navmesh.
- A production release needs sheet/atlas production, stable-ID cloud publishing, interaction-anchor offsets, and visual comparison against actual game scenes.

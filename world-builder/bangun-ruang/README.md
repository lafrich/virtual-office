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


## v3 — Mobile-responsive editor and enterable interiors

Bangun Ruang now follows the Mahluk Hidup modular workflow: Semesta building base → exterior customization → interactive mode → room/furniture placement → character action slots → save and place in Semesta.

### UI and furniture

- On mobile: compact Save/Menu toolbar, Semesta base selector before preview, compact exterior/interior preview, direction switch, tabbed Exterior/Interior/Actions/Data inspector and collapsible Saved Buildings.
- On desktop: three-pane editor remains and property tabs prevent tall stacked forms.
- Interactive buildings have an entrance and one editable floor plan per building floor; non-interactive buildings have no entrance or interior action slots.
- Interior templates: Empty, Rumah, Bedroom, Bathroom, Office, Warung, Cafe, Kost.
- Assets: WC, shower, bathtub, sink, bed, wardrobe, chair, sofa, table, desk, office chair, computer, stove, fridge, kitchen sink, cashier, shelf and display counter.
- Select an asset then tap the floor grid to place, or tap furniture to select and move. Editor blocks overlaps and doorway obstruction.
- Each object has position, 90-degree rotation, capacity, trigger radius and an explicit selected action. It may be duplicated or removed.

### Mahluk Hidup action alignment

The canonical Semesta character rig maps these saved poses to original V6B sprite rows.

| Interior item | Saved action | Character pose |
|---|---|---|
| WC | use_toilet, pee, poop | toilet (existing sit rig) |
| Bed | sleep, rest | sleep, lie |
| Chair | sit | sit |
| Desk | work, study | work (sit_type rig) |
| Shower / Bathtub | bathe | bathe (swim rig) |
| Sofa | sit, relax | sit |
| Cashier | buy, sell | talk |
| Stove / Sink | cook, wash | no dedicated pose, metadata hook only |

The editor does not generate nonexistent animations or modify the original Mahluk Hidup rig.

### Storage and Semesta preview

Building package format remains virtual-life-building-asset-v1 and adds: interactive, enterable, entrance, interior (virtual-life-interiors-v1), actionSlots, plus any object actions. The Semesta bridge now accepts decimal footprints (such as 3 x 3.2) and preserves interior and trigger data. City JSON import/export retains these fields.

Select a placed interactive building in Semesta, then choose Enter Building to open the floor-plan preview. Select furniture and Use to trigger its supported VLCharacterRig preview pose on a local editor character. A game-ready multiplayer interior transition, physics and job/economy integration are still separate implementation work.

Data is stored locally in the browser origin; it does not automatically sync to GitHub or the game backend. Virtual Life main game and Mahluk Hidup repositories are unchanged.


## v4 — Isometric interiors

Interior preview now opens in **native 2:1 isometric mode by default**, matching Semesta ground tiles (64×32 px). The same renderer is shared by Bangun Ruang and Semesta Enter Building, so the floor geometry, camera, furniture locations and tap-to-select behavior remain consistent.

- **Isometric:** cutaway rear walls, floor tile diamond grid, pixel-art furnished rooms, green entry threshold, selection highlighting. Generated assets remain semantically linked to the saved interior action slots.
- **Plan / Edit:** previous top-down grid remains available for precise touch placement, editing, collision checks and furniture rotation.
- The view changes do **not** modify world/game coordinates: furniture stays in canonical c/r tile coordinates and works with all existing 8 room presets, multi-floor layouts and saved building packages.
- Isometric renderer draws authored RGBA pixel primitives without gradients or smoothing. Furniture drawings are procedural previews, not imported original Virtual Life art.
- Semesta → select an interactive authored building → **Enter Building** opens **Isometric** by default; **Plan View** remains available for selecting action objects.

### Runtime boundary
This is an editor preview, not an online player teleport, 3D walkable interior physics or server-side action execution. Existing Mahluk Hidup rig poses are previewable through Semesta where available, and unknown actions remain data-only.


## v5 — Building outlines, horizontal furniture shelf, Mahluk Hidup scale test

### Pixel / Garis Penanda exterior

Garis Penanda visualizes the current building sprite as a non-destructive outline. It derives visible edges from the actual current PNG, including manual pixel edits, in each of SW/SE/NE/NW. The overlay also includes the 2:1 tile footprint and ground pivot (orange perimeter, light blue divisions, red pivot). The Pixel Art option restores the original appearance. Neither mode affects exported PNGs or building data.

### Interior furniture tray below canvas

A single-row horizontally scrolling shelf of all 18 supported interior assets appears directly below the Interior canvas. Every entry has a pixel-art thumbnail and label. Tap WC, bed, chair, table or another prop; then tap a free isometric tile or Plan/Edit tile to place it. The selected asset is highlighted. Cancel or tap it again to stop placing. The regular inspector still edits actions, capacity, position and rotation.

### Mahluk Hidup character scale and access simulation

Bangun Ruang shares the published Mahluk Hidup catalog, same-origin Character Storage and the Semesta Mahluk Hidup bridge / VLCharacterRig. This gives the exact original 64x112 px frame, 32x100 foot pivot, four sprite directions, timing and transparent equipment rendering (bag behind the body).

Choose a character, press Place and tap Exterior or Interior to position it at the 2:1 pixel/tile scale. The translucent marker and 112 px ruler reveal size relative to doors, buildings and furniture. In Interactive mode, Enter Door simulates walking to the building threshold and transitions the demo character into the ground-floor isometric preview. Select an interior WC, bed, chair, desk or shower and press Use Selected to test a route around blocking furniture and play the available native character pose. Existing pose aliases are used: toilet maps to sit, bath to swim and work to sit_type. Missing animations are reported as data-only hooks.

The demo actor is editor-only, never exported with the building package and never transferred to the online multiplayer game. If the published Mahluk Hidup sprite is unavailable, the editor shows an explicitly labelled size-only silhouette until an original image loads.


## v6 — WC / Mahluk Hidup seated alignment

The character scale tester previously stopped on a free tile **beside** the toilet and immediately switched to the Mahluk Hidup sit pose. That looked like the character was sitting on the floor.

It now uses the shared isometric WC geometry to define a true fixture seat contact point. The character first takes a collision-safe route to a neighboring tile, then makes a brief final seating transition to the bowl center (local c=0.50, r=0.64, seat z=14). Because the native 64×112 character rig uses a 32×100 foot pivot, its preview receives a calibrated 13-pixel Y adjustment when seated, and automatically faces the cistern. All 0°, 90°, 180°, and 270° WC rotations use corresponding visual geometry and interaction anchors. A foreground porcelain rim masks the feet to clarify depth.

The preview hides scale guide lines during seating. Selecting Idle returns the actor to its last free approach tile before restoring the idle pose, so a later path search never starts inside a blocking toilet cell. Changing character profiles and deleting the selected WC also clears seating state.

The calibration applies only to the editor reference character. The source Mahluk Hidup sprites, original building PNGs, saved interior object actions and online gameplay are unchanged.


## v7 — Same unit scale inside/outside; Mahluk Hidup WC size

The previous interior room grid incorrectly multiplied the original Semesta footprint by two: a 3×3 exterior room was rendered as 6×6 inside. This distorted furniture-to-character proportions and made the interior appear much bigger than the building.

- **Shared unit:** one exterior ground tile equals exactly one interior tile, projected as **64×32 pixels**. A 3×3 building has a 3×3 interior; a 5×4 building has a 5×4 interior. Fractional footprints retain the complete walkable interior tiles within the footprint (e.g. 3×3.2 has a 3×3 complete-tile room; the 0.2 exterior remainder is not stretched).
- **Proportions:** one-storey cutaway walls are 128 pixels tall, above the native Mahluk Hidup 112px character. WC seat and tank have been resized to 36px / 70px above ground. The sit pose uses the shared seat anchor and a corrected foot-to-hip offset. The WC foreground masks the character's lower legs so the sprite appears seated behind the bowl rather than standing on the toilet.
- **Mobile preview:** both the exterior pixel PNG and interior iso canvas use the same preview-height cap. No automatic 2× interior zoom or stretching of sprite pixels.
- **Existing rooms:** older interior layouts (v1, double-size 6×6 rooms) migrate on load to version 2 using proportional re-layout while preserving compatible object IDs, action choices, and collision-free positioning. Users can re-place furniture if a reduced floor plan has less space. The Semesta Enter Building preview performs read-only normalization of old saved floors using the building's real footprint; it does not silently rewrite saved City Drafts.
- **Isolation:** no changes to Mahluk Hidup sprite sheets, account characters, building exterior PNG exports or multiplayer gameplay. Seat scale adjustments are editor preview geometry.


## v8 — Matching Mahluk Hidup character / exterior door / interior WC

The 3×3 world footprint and 64×32 pixel isometric tile units remain **unchanged**. This update repairs their **visual proportions**, not map scale:

- Original 64×112 Mahluk Hidup character sheets are still read using their existing 32×100 source pivot and authentic rig/motion metadata. In *both* exterior and interior world previews, the same source frames (including equipped accessories) render at **0.50×** (32×56 px drawing). Actors no longer grow or shrink when crossing a doorway.
- Exterior door clear opening increased from 49 to **58 px** high, fitting the displayed 56px character, with proportional width adjusted as well. The building's roof and footprint remain as before.
- WC is intentionally **smaller relative to the avatar**, not just scaled down by the same amount: a **14px seat** and a **26px cistern/tank**, versus a 56px character. The seat anchor adjusts the original Mahluk Hidup sit-pose pivot by the same 0.50× factor.
- Toilet use now holds the final frame of Mahluk Hidup's sit transition rather than looping back through frames that can look upright. The foreground porcelain rim continues to mask the feet.
- New preview calibration applies **one screen-pixel zoom per 64×32 world tile** to both exterior PNG and interior isometric canvas. Plan/Edit remains independently zoomable for touch placement.
- This is a reference-character/editor simulation only. Original Mahluk Hidup sprites, recorded tile positions, export footprint, Semesta multiplayer actions, and production game code remain untouched.


## v9 — Virtual Life source-grounded proportions (2026-11-02 snapshot)

The user supplied the actual Virtual Life source bundle, including the complete 2026-11-02 patch chain and approved V6B character sheets. These are the **measured rendering contracts** in the original game, replacing v7/v8's guessed dimensions:

| Property | Original source | Bangun Ruang v9 |
|---|---|---|
| Isometric tile | \`TW=32, TH=16, PPU=2\` | 64×32 art pixels |
| Character image frame | \`SL.frame=[64,112], SL.pivot=[32,100]\` | Draw at native 1× art resolution, same inside/outside |
| Character visible body | Ichsan V6B PNG nontransparent rows y31–102 | ~72 art pixels (do **not** mistake 112-pixel transparent frame for height) |
| Interior wall | Cove \`HW=40\`, height scale \`HS=1.6\` | 128 art pixels |
| Entrance opening | Cove \`faceSW(...,0,30)\` | 96 art pixels, sufficient for ~72px character body |
| Toilet bowl seat | \`h1=4.6\` at \`HS=1.6\` | ~15 art pixels above ground |
| Toilet tank | Cove \`h1=12\` at \`HS=1.6\` | ~38 art pixels |
| Toilet animation | \`me.forceAnim='sit'; me.dir='sw'\` | Real V6B side-on SW sit cycle |
| Toilet docking | Specific \`sc,sr\` close to bowl centre | Actor foot pivot at local (0.61,0.69), no arbitrary Y offset |

### Sources inside supplied ZIP
- \`workspace/vo-patch/abc-backup-20261031/index.html\` — world projection, pixel ratio, sprite sheet layout, and animation frame logic.
- \`workspace/vo-mp/ind/p_cove.py\` — Cove corridor, room doors, toilet dimensions, per-toilet sitting position.
- \`workspace/vo-mp/ind/p_indoor.py\` — office toilet geometry and seated coordinates.
- \`workspace/vo-mp/ind/p_v6b.py\` — actual WC seat action with SW-facing V6B sit animation.
- \`workspace/virtual-office/assets/chars/ichsan_v6b_sheet.png\` — original sprite rows, visually checked.

The source ZIP is **reference only**; none of its auth/server/client code is imported or deployed. Bangun Ruang remains an asset authoring tool with local simulation. Mahluk Hidup and the production Virtual Life game remain unchanged. Existing interior tile coordinates and room sizes are preserved; only procedural visual geometry is recalibrated. Existing manually painted exterior PNGs may require manual reinspection after a change in default building height; the original saved asset is not overwritten without the user saving.

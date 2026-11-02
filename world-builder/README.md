# Virtual Life — 3D World Builder (official assets)

The editable map prototype now uses two independent, authoritative sources:
- **Characters:** official v6b sprite sheets in [virtual-life-asset-pipeline](https://github.com/lafrich/virtual-life-asset-pipeline), `game/assets/chars/*_v6b_sheet.png`. The pipeline's `64×112` frames, pivot `(32,100)`, six columns, 44 rows, directions `SE/SW/NE/NW`, and action row map are reproduced in `pipeline-character-rig.js`. Characters stay as camera-facing 3D alpha-cutout sprites with free world movement, never arbitrarily rotate/squash. The current map includes Ichsan, Noor and Theodore.
- **Buildings and outside props:** prefab names, footprint, pivot and image metadata from the official `assets/street_buildings/manifest.json` in the same pipeline repo, via `pipeline-catalog.js`. Original encrypted GPT Version props remain in `asset-catalog.js` and may be available when the production game asset Service Worker is authenticated.

## Important upstream image availability

The pipeline is primarily a **source-code image generator**. Its manifest describes hundreds of intended PNG outputs, but most generated building PNG files are **not committed** to its main branch. A verified sample (`examples/street_buildings/hotel_sw.png`) is currently used as actual artwork. All other upstream-prefab placements display clearly sourced, editable **3D proxy geometry** until generated artwork becomes available, rather than showing broken or blank sprite planes.

The template `world.json` places 20 independent objects including 3 canonical v6b actors and building/prop references. It is an approximate mapping study, **not a pixel-exact conversion of the production map**. All placements use world X/Y/Z, distinct entity ID and reversible JSON edits. Multiplayer accounts, production saves and NPC AI remain untouched.

### How to use

Open `/world-builder/?v=p4`. Choose an item under Add Object; tap it to select; Move (drag), Rotate, Scale, Delete, Duplicate, Export JSON. Actor rotation and scale are locked. Walk Test uses WASD, arrow keys or touch D-pad to animate the real v6b frames in 3D.

The World Builder does not change the live Virtual Life online game. The retired Rebuild project is not used. If you have an old saved local map, the new pipeline v3 storage namespace loads the latest default separately.

### Next integration work

Render and publish PNG outputs from the pipeline building generators or use authenticated GPT map assets; bind prefab images to physically accurate mesh faces and collision footprints; validate on Android; then link approved map JSON to gameplay/multiplayer services.

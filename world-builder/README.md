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


## Style-lock & canonical placement (2026-11-03)

Both /world-builder/ and /world-builder/gpt/ now share `style-rules.js` and a 27-object street study. Buildings/shops are added as named **official pipeline prefab IDs** (rather than arbitrary recolored boxes). Canonical dimensions use source manifest footprint. Street props such as benches, lamps, park tables and trash bins are separate movable alpha-cutout **2D sprite planes** in 3D with GPU depth testing; trees are also pixel-style planes. Original GPT prop art remains prioritized when an authenticated game session makes it available.

- Placement: half-tile snap, editable world coordinates, bounds check, overlap check against collidable footprints, and automatic nearest empty location when adding/duplicating. Static objects cannot occupy the carriageway at z=32.75–36.3. Actors can move on the road and retain canonical four-way animations.
- Orientation: quarter-turns (90°); single-view GPT sprites are direction-locked. Uniform visual scale is limited to 0.85–1.15 to protect native proportions, with original catalog dimensions preserved in JSON. Position changes that violate placement rules are rejected.
- Source gaps: most pipeline building/taman PNG output paths exist in **metadata but not in the repository**. Those props show explicitly provisional, low-res pixel plane illustrations. Large buildings without PNG show labeled geometry previews with their official footprint. Neither proxy is claimed to be final Virtual Life artwork. Once official PNGs are published the renderer can use their canonical source.
- The sample street layout includes benches, a shaded tree, an original GPT metal bin, a lamp, a table and a pipeline trash bin. The two editors remain isolated from production saves, online accounts, gameplay and multiplayer.
- Saved drafts are retained in local browser storage. Use **Reset Map** (with confirmation) to load the new 27-object default if your browser already saved an older layout. Export JSON first to keep your changes.

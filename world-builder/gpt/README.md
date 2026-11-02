# Virtual Life — GPT Original Asset World Builder

Dedicated editable isometric WebGL draft: /world-builder/gpt/

This route is isolated from /world-builder/ and from the live multiplayer game.
It loads /world-builder/gpt/builder.js and /world-builder/gpt/world.json, with
its own local-storage key. The project does not reinstate /rebuild/.

Visual source priorities:
1. Original GPT / Virtual Life character atlases: root
   assets/chars/{preset}_v6b_sheet.png. This is the exact native 6-column,
   44-row sheet with 64x112 frames and a 32,100 pivot. Four directional
   views and original idle/walk/talk/pose rows come from the original game.
   No proxy character, arbitrary 3D yaw, or nonuniform scaling is allowed.
2. Separated original game furnishings and street props: root assets/env/
   and assets/street2/loak/props/. These images are loaded by the ROOT
   authenticated game service worker and rendered as independently movable
   alpha-tested sprite cards with GPU depth testing.
3. Original scene reference: assets/street2/base.png, accessible through
   "View GPT Map". It is a BAKED image for checking positions, not a building
   mesh and not a replacement for the depth-sorted scene.
4. Building geometry: individually editable 3D approximations. Some original
   GPT buildings are procedural or baked, so they do not have independent
   3D-ready texture/face files yet.
5. Optional additional building facade art comes from
   lafrich/virtual-life-asset-pipeline. These are tagged as pipeline art;
   they are not claimed to be exact GPT building meshes.

How to access protected original images:
- Open Virtual Life from the editor, log in to the main game in the same
  browser, keep that browser tab open, return, and press Reload Sprites.
- The main game's root Service Worker decrypts official image paths
  in memory only. The editor does not store keys or decrypted image files.
- If the game session is missing, native GPT characters remain invisible,
  and the overlay says "GPT character locked". It never substitutes art
  from the retired Rebuild project.

Editor actions: select, move, rotate (props/buildings only), scale
(props/buildings only), delete, duplicate, undo, redo, zoom, directional
Walk Test, pose switching, JSON import/export, and auto-save.

Limitations: This is an asset-mapping prototype, not a pixel-perfect import
of the native online world, and game mechanics / multiplayer have not been
migrated. Camera-facing image cards have real depth-test behavior but are
not a substitute for complete front/side/rear geometry for every building.


## Native art placement rules

The GPT editor shares `../style-rules.js` with the pipeline editor. New buildings and shops reference the official pipeline prefab catalog rather than freeform generic 3D buildings. Existing encrypted GPT character and prop PNGs remain the first choice. Single-view original art cannot rotate, available directional assets turn by 90°, actor scale/rotation remain locked, other uniform scale remains between 85–115%. Floor footprint and road occupancy are validated when adding, moving, or duplicating.

The default draft now has 27 objects including native GPT trash bins and pipeline-referenced park objects. **Tree/bench/lamp/table pixel-art cutouts are temporary previews** where official generated sprites have not yet been published. Large building geometry still is not a faithful conversion of original encrypted scene art. Original game login is required to see protected source sprite paths. Existing local draft users can choose Reset Map after first exporting their JSON.

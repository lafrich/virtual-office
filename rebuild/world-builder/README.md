# Virtual Life — World Builder 3D (isolated prototype)

A standalone **editable 3D isometric map foundation**, committed under `/rebuild/world-builder/`. It is intentionally NOT installed into the encrypted multiplayer game. Existing production `index.html`, `office.html`, encrypted asset manifest, and `sw.js` are not modified.

## What works now

- Orthographic isometric Three.js / WebGL canvas; **real hardware depth testing** for mesh faces and masked pixel-art sprite planes.
- Actual 3D coordinates matching the game's `c, r` convention: **x = c**, **z = r**, and **y = elevation**. The seed approximates the office, crossing, road and shops and should be refined before calling it a production map.
- Locked ground layers: grass, road, curb, footpaths, crossing. No building-sized grass overlay.
- Independent scene entities with stable IDs, position, rotation, scale and optional collision/action metadata.
- Real 3D primitive models for buildings, shops, benches, streetlights and trees; several **existing SVG pixel assets** under `/rebuild/assets/` load as vertically oriented alpha-cutout planes. Source art remains unedited.
- Tap/select objects, Move (drag), Rotate ±15°, Scale ±0.1, numeric coordinates/elevation, Duplicate/Delete, pan/zoom, snap on/off.
- Undo/Redo, automatic localStorage save, complete JSON export/import, Reset.
- Mobile touch pointer support. Does not modify login, online data, game accounts or multiplayer.
- No new game mechanics yet. The `avatar-test` object is a render-depth probe, not a player.

## Scene data format

```json
{
  "format":"virtual-life-world-builder-v1",
  "version":1,
  "map":{"grid":"game:c,r","units":"tile","origin":{"x":0,"z":0}},
  "objects":[
    {"id":"bench-01","type":"bench","name":"Bangku","x":5,"z":29,"y":0,"rotation":0,"scale":1,
     "collision":true,
     "action":{"type":"sit","radius":1.5,"anchor":{"x":5,"z":29}}}
  ]
}
```

The editor stores action/collision fields as **metadata only**; it does not execute or synchronize gameplay actions. Designers or AI agents can generate, validate and merge JSON without touching renderer code.

### Pixel art asset approach

Procedural 3D models own solid depth geometry. Existing isometric art can be displayed using alpha-tested planes in world space: `transparent:false`, `alphaTest:0.5`, `depthWrite:true`, `depthTest:true`. This prevents the common transparent-sprite sorting error, but a sprite plane still cannot magically supply missing geometry (for example a baked tree canopy hiding another object). For exact visual parity, rebuild each large asset as simple meshes plus separately masked planes and place the art at known pivots.

### Production migration prerequisites

1. Convert the **real** encrypted Street2 backgrounds and buildings into independently authored meshes/planes. The current seed is an approximate layout reference, not an extracted pixel-perfect production map.
2. Add footprint, occluder geometry, anchor/collider fields for all objects, and an authoritative conversion tool from current engine c/r coordinates.
3. Add NPC/player 2D animation cards or models and connect them to the depth buffer and action anchors.
4. Establish multiplayer authority and deterministic server-side validation for placed entities, inventory/currency edits, and collision.
5. Bench-test touch selection, save/export, depth sorting, road navigation, performance and WebGL context loss on Android before integrating into the live encrypted engine.

## How to try

Open [World Builder](https://lafrich.github.io/virtual-office/rebuild/world-builder/). Tap a building or lamp to select it. Press **Move** and drag; Rotate and Scale are directly underneath the canvas. Export JSON is the portable version of the layout.

Three.js is currently loaded from a pinned CDN with fallback; editor requires internet to fetch the module. The app's map data and local asset paths are served by GitHub Pages, independent of online auth.

## v2: Existing artwork and actor rig

Uses the original rebuild/character-system.js sprite sheets: character_iso_sheet_v17.svg (SW/SE/NW/NE, idle and three walking frames), character_flat_poses.svg (sit, sleep, bathe, toilet, work) and character_baymax_poses.svg for alternate poses. The actor is a camera-facing, alpha-tested 3D plane. Facing and animation frames change when moving, not actor yaw. Actor rotation and scale are locked in the UI and sanitized on import.

The Add menu exposes 26 existing rebuild SVG art assets; eight have original optional foreground art. 3D buildings use mesh surfaces, while existing furniture art uses independent depth-tested cutout cards. Single-angle art does not provide unseen rotated views.

Use Walk Test with arrows, WASD, or mobile D-pad. This only moves actors in a local preview. Exit test to restore saved spawn positions. The default world.json includes 22 map objects with two actor rigs and eleven original-art furniture objects; Reset Map loads the latest example if a previous local draft was saved.

The original online multiplayer remains unchanged. The asset library comes from the accessible Rebuild art and is not a full extraction of the separately encrypted online world.

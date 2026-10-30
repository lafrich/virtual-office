# Virtual Office — Editable Rebuild 01

Playable, independently editable prototype at **https://lafrich.github.io/virtual-office/rebuild/**.

## Why this exists
The original Virtual Office and staging game ship encrypted. Editing decrypted markup through service-worker injections caused unreliable asset depth sorting and chair flickering. **This rebuild is fresh source code**, so every object, interaction, scene, and UI can be edited directly. It does not copy private game code or expose original encrypted assets.

## Files
- `index.html` — UI skeleton, menu, buttons, Status Player / Notifikasi.
- `style.css` — responsive mobile HUD, pixel-themed interface.
- `game.js` — isometric Canvas 2D world, furniture drawing, needs simulation and actions.

No build step, backend, dependency, password, decryption, npm, or API keys required. Open `index.html` via a local HTTP server (e.g. `python3 -m http.server 8000` in the repo root), or publish on GitHub Pages.

## Current playable scope
- Isometric maps: Office (lounge, desks, Baymax, Migi), Taman (benches, warteg exterior, recliner), Warteg (food display and bar-stool seating). Original game is not modified.
- One contextual Action button: Duduk / Bangun, Rebah, Pet Migi, Kerja, Pesan makanan, Minum, Mandi, Pipis, Masuk/Keluar, plus Kentut.
- Movement: joystick, arrows/WASD, tap/click to walk, Shift to sprint, Space or Enter for Action.
- Self-contained seating render order. Furniture and seated character are drawn in fixed painter order each frame, not reparented between layers.
- Status Player and Notifikasi in a tabbed bell menu; four life needs with progression, in-browser persistence, offline no-decay, and an event feed.
- LOCAL-ONLY. Multiplayer, authentication, server-validated economy and production asset parity are intentionally not implemented.

## Modify the game
- Edit `spots` in `game.js` to add or remove contextual action locations.
- Edit `drawOffice`, `drawWarteg`, `drawPark` and their furniture functions to modify sprites and layout.
- Edit `update(dt)` for the needs formula; `pressAction()` for action effects.
- Edit the markup in `index.html` and responsive design in `style.css`.
- Version any changes with separate feature branches and commit tests before merging.

## How to test
1. Open `/rebuild/` and move around with the left-hand joystick.
2. Press the map pin button to switch **Office → Taman → Warteg**.
3. Approach a sofa, park bench, lounger or bar stool, then tap the contextual action on the lower right.
4. Move to stand; no seated animation while walking.
5. Use the bell button → **Status Player**; walk, sit, eat, shower or pee and confirm bars update.
6. Reopen to verify saved needs (no decay while the game is closed).

This project is not a pixel-perfect replica of the original artwork. It is a clean playable foundation, deliberately designed for iterative asset replacement and expansion without risking the existing deployment.


## Modular Cove Room / Precision Editor (Rebuild 03)

In the game, tap the map pin → **🛏️ COVE ROOM**, then tap **🛠** to edit assets precisely. The rest of Rebuild remains playable.

The Cove demo has **16 independent modules**: bed, nightstand, lamp, desk, chair, bookshelf, plant, rug, bathtub, shower, glass partition, sink, mirror, toilet, dresser, and door.

### Precision controls

- **GRID X / GRID Y**: physical tile coordinates; drag on the map or nudge 0.1 tile.
- **PIXEL X / PIXEL Y**: visual-only sprite offset, adjustable in 1px increments; never shifts collision.
- **HEIGHT Z**: vertical elevation. **SORT BIAS**: drawing order relative to character. **SCALE**: adjust visual sprite size in 5% steps.
- **WIDTH / DEPTH / HEIGHT**: editable footprint and procedural dimensions.
- **ACTION X / ACTION Y**: where the contextual action can be activated, relative to the furniture origin.
- **POSE X / POSE Y**: exact target anchor for the seated, sleeping, bathing or toilet player.
- **Facing, Collision**, plus optional Base PNG and Front PNG sprite paths.

Grid position, sprite offset, action approach and pose offset are deliberately independent. The deterministic painter sorts on grid X + grid Y + depth bias, with base and foreground layers split so a duvet or tub rim can cover the player without moving the entire furniture group.

### PNG replacement workflow

The default visual is a *procedural geometric preview*, NOT the pixel-perfect furnished-room illustration. To change its style, add transparent PNG sprites inside rebuild/assets/, named for example bed_base.png and bed_front.png. Select the bed, open **PNG SPRITE**, and enter ./assets/bed_base.png as Base PNG and ./assets/bed_front.png as Front PNG. Use PIXEL X/Y to calibrate rendering, and POSE X/Y to calibrate the player separately.

Missing PNGs fall back to procedural placeholders. Only local paths within ./assets/ with PNG extensions are accepted.

### Export/import

**EXPORT JSON** generates a complete, versioned layout; the editor attempts to copy it and also puts it in the text box. **IMPORT JSON** restores it, validating known module IDs and numeric bounds. **RESET ASSET** and **RESET ROOM** restore defaults. Changes persist locally under the key vo-rebuild-cove-modules-v1 and are NOT synced across devices or multiplayer.

### Implementation files

- modular-engine.js — data schema, registry, transforms, collision, interaction points, painter commands and serialization.
- modular-editor.js — browser editor, draggable placement, per-axis numeric controls, and JSON export/import.
- cove-scene.js — modular room base and fallback furniture.
- game.js — integration with the game camera, contextual Action button, player poses, and life needs.



## Edit Mode (Rebuild 04) — all locations

The player-facing editor is now a Sims-like **EDIT** button in the upper-right corner of **all four maps**: Office, Taman, Warteg, and Cove Room.

1. Tap **🛠 EDIT** from any map.
2. Tap a visible furniture item on the canvas, or use the furniture dropdown.
3. Drag furniture with a finger. If needed, use the four direction buttons for **0.1 tile** steps or the **1px** buttons for screen-pixel alignment.
4. Tap **✓ SIMPAN** to keep the new layout or **BATAL** to revert all changes made in this edit session.
5. Expand **⚙ Pengaturan detail** only if you need coordinates, depth sorting, scale, interaction pose anchors, visibility, collision or JSON import/export.

Edit Mode temporarily pauses player movement and need decay. Game interactions are disabled while editing.

Movable furniture now includes **13 Office elements, 9 Taman elements, 5 Warteg elements**, plus **16 Cove Room elements**, with distinct local layouts per area. The old furniture artwork is drawn using editable transforms rather than rewritten. Connected actions such as Duduk, Kerja and Pesan shift along with their furniture, including the seated player.

**Limitations:** Changes currently persist in the same browser using localStorage, not to other devices or multiplayer. Furniture orientation cannot yet be visually rotated in all procedural scenes. Moving objects can overlap existing furniture; collision constraints are not yet a full build-mode placement validator. Furniture artwork outside Cove remains the same procedural prototype rather than the target pixel-art sprites. Build Mode does not affect the encrypted production game.

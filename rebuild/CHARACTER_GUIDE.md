# VIRTUAL OFFICE — CHARACTER GUIDE V1
Rebuild 11 | Flat isometric character system | Art benchmark: the user's Cove Room bedroom+bathroom concept (black-haired, glasses-wearing character).

## Purpose
Correct player-facing on every directional input, then replace the previous rigid rough pixel character with a coherent, editable, animated **flat, cozy isometric avatar**. The mechanics and existing Save/Cancel furniture editor remain independent.

## 01 — Technical movement contract

| Movement screen input | Canonical facing | Sprite row | Animation |
|---|---|---:|---|
| Down (S/↓, joystick down, downward tap path) | `down` | 0 | idle_down / walk_down |
| Left (A/←, joystick left, leftward tap path) | `left` | 1 | idle_left / walk_left |
| Right (D/→, joystick right, rightward tap path) | `right` | 2 | idle_right / walk_right |
| Up (W/↑, joystick up, upward tap path) | `up` | 3 | idle_up / walk_up |

The 2:1 iso projection converts **world** delta to screen delta:
- `screenX = (worldX - worldY) × 23`
- `screenY = (worldX + worldY) × 11.5`

**Important:** facing is chosen from the resulting **screen vector**, not the sign of world X alone. Keyboard and analog joystick already specify a screen vector and can set facing directly. Touch-to-walk uses the world-to-screen projection above. The dominant screen axis chooses cardinal facing with a small analog diagonal tolerance. Idle holds the last valid direction and never forces down.

State per player: `player.dir` (one of `up,down,left,right`), `player.moving` (only when the character actually changes grid position), `player.walk` (accumulated frame phase), and `player.seatId` for interaction posture.

Movement semantics:
- Idle frame is column 0 and stays on the last direction.
- Walk cycles through columns 1–3 on the corresponding direction row.
- If movement hits a collider/wall, do not animate walking in place.
- Entry/exit from sleep, bath, toilet, work or sitting uses a separate pose; **never overwrite the remembered walk direction**.
- Edit Mode freezes locomotion; the facing direction remains unchanged.
- Existing version 1 saves now include `dir`, while historical saves without it still load; old isometric abbreviations map via `normalizeDirection`.

## 02 — Source files
- `character-system.js` — direction mapping, animation frame state and image-sheet renderer.
- `assets/character_flat_sheet.svg` — **384×448 SVG**, 4 rows × 4 frames, each **96×112**; rows down/left/right/up, first column idle.
- `assets/character_flat_poses.svg` — **480×112 SVG**, 5 columns: sit, sleep, bathe, toilet, work.
- `character-preview.html` — interactive direction / motion / pose preview generated from the exact sources the game loads.
- `game.js` — movement state updates, last-facing storage, and `drawHuman` integration.
- `VISUAL_GUIDE.md` — shared world palette, lighting and material hierarchy.

Every character frame uses **feet pivot (48,103)** within a 96×112 transparent cell; render scale **0.88 × cameraZoom**, using nearest-neighbor scaling. This pivot does not change furniture collision, seating anchors, or depth order. While an SVG image is loading, the previous canvas character serves as a fallback.

## 03 — Character visual benchmark

The Cove reference is *flat isometric, cozy, clean*, not bulky outlined retro-pixel or semi-photoreal 3D.

**Silhouette**
- Oversized but balanced head, slightly narrow shoulders, simple dark charcoal shirt, tapered black pants and small black shoes.
- Hair is a connected asymmetrical black mass with at most two additional dark grey highlight planes; side profile has visible layered fringe and ear.
- Slim rectangular black glasses; two lenses on front/down, one lens on the side; **no glasses on the back/up**.
- Face: warm medium-tan two-shade skin with tiny eyes and discreet mouth; low-contrast details still readable at game zoom.

**Lighting / palette**
- Upper-left soft diffuse light only. Two or three flat tones per material; no bloom, gradient bevels, photographic texturing or harsh black borders everywhere.
- Charcoal shirt `#303743`, highlight `#424E5E`, shadow `#242D3B`.
- Hair `#202632`, highlight `#485366`, mid `#323B4A`.
- Skin `#E4AC82`, light `#F4C69D`, shadow `#C88763`.
- Trouser `#343B47`, highlight `#48525F`; black glasses `#111D2B`.
- Maintain the same relative proportions, material ramp directions and pivot in ALL direction/pose frames.

## 04 — Interaction poses and occlusion

| Game condition | Draw pose | Furniture depth |
|---|---|---|
| Office sofa, Taman bench, normal chair | `sit` | base → player → foreground |
| Cove desk chair | `work` | chair base → player → chair foreground |
| Cove bed | `sleep` | mattress/base → player → blanket/footboard |
| Cove bathtub | `bathe` | water/base → player → tub rim |
| Cove toilet | `toilet` | toilet base → player → front rim |

Work actions that directly pay a salary remain instant: they do not forcibly seat the player. A longer work animation or more gestures can be added later without changing movement state.

## 05 — Non-regression checklist
- [x] 4 direction sprites distinct, full loop plus idle.
- [x] Last facing preserved when stopped and after interaction.
- [x] Keyboard / joystick / touch-to-walk use coherent screen-facing.
- [x] Flat character sheet matches the current game palette.
- [x] Bed/bath/toilet/chair poses use independent frames and preserve occlusion.
- [x] Existing game areas and Edit Mode source are unchanged.
- [ ] Actual visual inspection on the user's Android screen after GitHub Pages deployment.
- [ ] Full redraw / art-director review against uploaded Cove concept at target device zoom.

**Important:** these are original crisp-edge SVG art sprites produced for the prototype, not a fully hand-painted raster/PNG character asset. Compare the real sprite preview and game before calling the visual final.

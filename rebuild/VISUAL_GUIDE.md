# VIRTUAL OFFICE — Visual System v1.0
Canonical art-direction and implementation rules for Rebuild 05.

## Single source of truth
- **visual-system.js**: palette, material triplets, reusable isometric props, size hierarchy, pose rules, reference asset manifest.
- **visual-theme.css**: all global HUD, modal, status and Edit Mode colors/treatments.
- **game.js**: Office/Taman/Warteg use shared primitives for plant, chair, desk, rug, coffee table, windows; no separate style rules.
- **cove-scene.js**: Cove follows the same palette/materials and shared window primitive. Independent modules remain editable.
- **build-scenes.js**, **modular-engine.js**: actual object footprints, positions, action anchors and persisted per-scene edits. Do not replace or overwrite user-edited transforms when applying style updates.

## Look & proportions
- Cozy, warm, slightly nostalgic **2:1 isometric pixel-art**, never pseudo-3D realism or 3D bevel/glow.
- Main lighting from upper-left, no gradients on assets; use three flat material colors: **top (light), side (medium), right (dark)**.
- One tile is one logical grid cell, iso transform in current Rebuild = **46 px wide × 23 px high before camera zoom** (TX=23 and TY=11.5). The illustrated 32 px × 32 px tile in the concept sheet is an **art reference**, not the current physics grid projection; do not silently change world scale.
- Target standalone character sprite **32 px × 64 px native** for a future asset pass; procedural character is still a smaller placeholder, not a production character sheet.
- Relative asset classes: small=1×1; medium=2×1; large=2×2; extra-large=3×2 grid units. Preserve already-calibrated current item footprints until migration.
- Architecture and floor tiles should be low-contrast; large furniture carries structure, small decor adds warmth, character is always clearly readable, HUD never hides the Action target.
- Do not add glossy photographic gradients, bloom, heavy noise or realistic shadows. Use restrained blue-gray soft ground contact shadow.

## Canonical palette
| Token | Hex | Purpose |
|---|---|---|
| wall | #EADFC7 | cream wall plane |
| wallLight | #FFF3DC | sunlit trim |
| floor | #CFE4FF | blue interior tile |
| bath | #D87469 | terracotta tiles |
| wood | #A26B3F | furniture wood midtone |
| woodLight | #C38C5A | sunlit wood top |
| woodDark | #754A2E | wooden side/shadow |
| blue | #4E8DE6 | accent pillow, bedding |
| green | #6BB77A | leaf, warteg accent |
| cream | #FFF8E6 | sofas, paper, ceramic |
| grey | #B7BDC7 | metal and small hardware |
| shadow | #8A9DB7 | neutral/cool shadows |
| uiRed | #E04848 | red game actions |
| uiGold | #FFC857 | notice and selection |
| ink | #28364A | text and outlines |

Extra tonal ramps are defined in visual-system.js; never guess new random hex colors when one of these material ramps is appropriate.

## Object hierarchy and depth
1. Environment walls & base floor.
2. Floor decoration and contact shadows.
3. Object **base** (or whole sprite).
4. Player and NPC sprite according to world depth.
5. Object **front** for occlusion *only when needed* (blanket, bathtub rim, chair armrest).
6. UI selection handles and status/action text.

All new modules specify: stable ID, name, visual type/category, physical footprint, anchor in grid, optional pixel offset, optional collision, and optional action approach/pose anchors. **Visual offset must not change collision or seating pose**. One actor must not be rendered twice when seated on a special furniture group.

## New sprite asset contract
1. Transparent lossless PNG; design from the same 2:1 isometric 3/4 viewpoint.
2. Use the exact same **bottom-center pivot** for each object sprite.
3. Where foreground occlusion is necessary, export two layers (`*_base.png`, `*_front.png`) with **matching transparent canvas dimensions and pivot**, so both use the same origin.
4. Prefer pixel grid alignment, nearest-neighbor resizing, and clean integer pixel outlines; no inconsistent antialiasing.
5. Match color and light direction to material ramps. Shadow may be baked consistently only if identical to ground contact shadow rules.
6. Register in the modular engine, test the Edit Mode 1px offset, action approach, and correct pose overlay. Make sure collision footprints align to the visible object.
7. Validate on a phone viewport as well as desktop, and confirm Save/Cancel round trips on all maps.

## Acceptance checklist for new rooms
- All furniture fits the common perspective and material palette.
- Character head remains legible at game zoom, furniture does not dominate the room.
- Walk, Sit, Sleep, Bathe, Work, Toilet preserve correct occlusion.
- Edit Mode can tap, drag, nudge and restore every editable object.
- Save/Cancel persists **per map** and does not change unrelated maps.
- Existing production and staging game are untouched.

## Current limitations
The current Rebuild 05 visual pass **does not yet replace all procedural geometry with individually illustrated pixel-art PNGs**. The concept sheet is an **art direction reference**; it is not a complete exported sprite sheet. To reach its exact fidelity, illustrated sprite assets must be produced individually and plugged into the shared manifest/pivot system.


## Rebuild 07 — Depth and Environment Pass

- **Unified world depth:** Office, Warteg, and Taman now enqueue furniture in painter order using `asset.at.x + asset.at.y + depthBias`. This matches the character depth and Cove's modular rendering. Moving furniture through Edit Mode updates draw order automatically instead of retaining an outdated hardcoded order.
- **Seated avatars:** Office work chair, sofa, park bench, and warteg counter render their sitter within that furniture's draw group. The office work chair specifically uses `chair base -> avatar -> chair foreground`; standing player is not drawn again above everything.
- **Shared architecture:** `visual-environment.js` draws the same restrained tile-floor thickness, warm wall skirting and pale hard-edged window light in every location. All coordinate values use the existing 2:1 projection.
- **Warteg detail:** Green buffet counter now has clearly grouped food trays, condensed glass framing, condiments and wooden stool tops; the roadside warteg adds a striped canopy.
- **Taman detail:** Park benches get consistent wooden slats and metal fasteners, with a separate front lip rendered after the seated sprite.
- **Regression coverage:** Exercise 4 map renders, Action interactions, editing and local persistence on every release. Rebuild 07 has 10/10 simulated gameplay/integration checks passing. Browser screenshots and mobile visual QA are still required; simulation tests do not establish pixel-perfect rendering.

No game data or existing per-browser furniture positions are reset by this visual update.

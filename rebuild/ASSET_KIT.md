# PIXEL ASSET KIT — Rebuild 06

## What changed
The first detailed production-oriented procedural asset pass covers all 16 Cove modules. Its shared painter library is also used in the other scenes for **desks, chairs, and plants**.

The new runtime is `pixel-asset-kit.js`, loaded after `visual-system.js` and before `modular-engine.js`, `cove-scene.js` and `game.js`.

### Asset hierarchy
| Level | Examples | Art requirements |
|---|---|---|
| Architecture | wall, floor, window, divider | largest neutral surfaces, low-contrast repetition |
| Primary furniture | bed, bathtub, sofa, work desk | clear silhouette, 3-step material shading, interaction base / front split |
| Secondary furniture | toilet, bookshelf, chair, dresser | readable 2:1 iso structure and consistent heights |
| Accessories | lamp, laptop, books, plants, tray | smaller accents, sparsely distributed saturated color |
| Actor / UI | character, action marker, editor handles | silhouette always visible, UI overlays world |

Colors and material ramps are always sourced from `visual-system.js`.

### Delivered Cove detail pass
- **Bed:** wood bed frame and legs, upholstered mattress, white pillows, blue accent pillow, quilt seam, foreground blanket/footboard.
- **Bathtub:** sage ceramic rim, clear blue water, ripples, wood bath tray, soap and bottles, separate front rim.
- **Desk:** four-leg wooden structure, drawers, laptop screen/keyboard, desk light, stationery and cup.
- **Chair:** wooden legs, seat, upholstered back, separate foreground front edge.
- **Toilet:** cistern, flush button, base pedestal, seat and inner water, foreground lid edge.
- **Bookcase, dresser, nightstand:** shelves, books and differentiated drawer lines/handles.
- **Wastafel, mirror, shower, glass partition:** muted green basin, glass reflection, brass fittings, repeated glass panels.
- **Plant, rug, lamp, door:** consistent leaf language, restrained shadow, warm light and wooden details.

### Rules for new asset generation
1. Use `VOVisualSystem.palette` / `VOVisualSystem.material()` exclusively, avoiding new arbitrary colors.
2. Preserve 2:1 isometric projection, upper-left diffuse light, restrained flat 3-step shading.
3. Draw base shapes and character before front occlusion for sleep/bathe/toilet/chair.
4. World position, pixel adjustment, action approach, pose offset and collision remain *separate* in `modular-engine.js`.
5. Every module must keep its existing stable ID and its anchored footprint; don't reset user-local Edit Mode positions.
6. New **PNG** artwork can override the procedural fallback using the existing sprite-path system; transparent base/front PNG canvas dimensions and pivot must be identical.
7. Test all four maps, player Action, Edit Mode drag, Save/Cancel, collision, sleep and bathtub layers before release.

### Actual source of truth
- `visual-system.js`: palette, material ramps, style rules and per-object categories.
- `pixel-asset-kit.js`: reusable detailed geometry; currently Cove 16 pieces + cross-map desk/chair/plant.
- `cove-scene.js`: architecture and old fallback art; delegates to new kit.
- `game.js`: furniture reuse on other maps and gameplay rendering.
- `VISUAL_GUIDE.md`: complete art-direction reference.

**Status:** This is still a consistent, detailed **procedural pixel-art pass**, not the illustration reference recreated at exact fidelity or raster PNG sprites. The next art pass can replace objects one at a time while keeping the physics, snapping and interaction system.


## Rebuild 08 — Real layered pixel-style sprite files

Three flagship Cove interactions now use **original transparent SVG assets**, not per-frame procedural geometry:

| Asset | Base art | Foreground/occlusion art |
|---|---|---|
| Bed | `assets/bed_base.svg` | `assets/bed_front.svg` |
| Bathtub | `assets/bathtub_base.svg` | `assets/bathtub_front.svg` |
| Toilet | `assets/toilet_base.svg` | `assets/toilet_front.svg` |

Each file is a `160 × 160` transparent, shape-rendering="crispEdges" SVG in the same 2:1 isometric projection, with a shared artwork origin at **(80,118)**.

**Runtime pivot contract:** for these *built-in files only*, the sprite origin is `{x:.5,y:.7375}` in normalized image coordinates. The renderer subtracts that origin so the sprite's physical center matches the object's existing world coordinate. This is independent of the Edit Mode `offset` or action `pose` anchor. The foreground asset uses the same canvas size and origin, so the blanket/tub rim covers a seated avatar without shifting.

The PNG loader now also accepts same-origin `./assets/*.svg` file paths. Unrecognized/remote/parent-traversal paths remain rejected; custom PNG or SVG objects retain the previous bottom-center pivot convention unless a built-in matching sprite is chosen.

Legacy browser layouts with `sprite:null` are upgraded non-destructively to built-in art without resetting the user's edited `at`, `offset`, `size`, `action` positions, or save data. A custom user-specified sprite path is not overwritten.

**Tested:** six XML/SVG asset files, whitelisted paths, legacy layout migration, JSON persistence, foreground painter order, and pixel-precise image pivot. Detailed sprite drawing still needs visual QA in a real browser/device after deployment.

**Next pass:** replace the remaining Cove and Office procedural props with their own authored sprite assets, retaining the same projection, palette and per-object calibrations.

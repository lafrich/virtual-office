# Semesta — Virtual Life City Builder (XP / AI-ready)

**Single supported editor**: https://lafrich.github.io/virtual-office/world-builder/

This is an authoring companion for [Virtual Life Asset Pipeline](https://lafrich.github.io/virtual-life-asset-pipeline/), built with the same Windows XP / Paint design language. Use it to lay out streets, buildings, trees, furniture, map triggers, and tentative entrances, then export a structured JSON map that future developers or AI agents can connect to gameplay.

**This editor DOES NOT change the online Virtual Life map, accounts, saved game, NPC behavior or multiplayer.** The retired GPT Original Builder route `/world-builder/gpt/` was removed, and original GPT assets were merged into the single catalog.

## Source/art hierarchy

1. **Original GPT art**: individual asset paths already known from the protected game's `assets/env/` and `assets/street2/loak/` catalogs. Requires an authenticated Virtual Life session in the same browser because the root game Service Worker decrypts this art at runtime. No plaintext original assets are copied.
2. **Asset Pipeline art**: original official v6b characters and any genuinely published sprite output (currently the hotel sample).
3. **Official pipeline *metadata***: building dimensions, orientations and anchors in `assets/street_buildings/manifest.json`, and 17 active tree + 15 ground sprite IDs from `assets/vegetation_kebonsirih/manifest.json`. Most output PNGs have **not been committed** to that source repository. Shrubs on hold are excluded.
4. **Explicit placeholders**: labelled pixel planes for missing standalone props, and 3D building block studies matching official footprint. Placeholders are not equivalent to completed source art. A baked GPT street background is not separable into editable building meshes; view it from **Map Reference** for comparison.

## Visual calibration

- Canonical reference: 2:1 isometric; map tile is **64×32 px**; frame is **64×112 px**; character pivot at **(32,100)**; standing height about **84–88 visible pixels**.
- Orthographic camera at a **30° elevation** instead of the old ~35.8°. Sprite geometry compensates for vertical projection; all source pixels use a common 64-px tile width scale instead of separate guessed character scale.
- Sprite planes maintain nearest-neighbor texture sampling, alpha-tested outlines, camera-facing placement and depth testing. Character scale remains locked to 1.
- Drag and snap by half-tile, 90° allowed rotation where source directional variants exist. Other objects have uniform 0.85–1.15 map scale.
- Mobile **two-finger pinch zoom/pan** is anchored to the world position under the fingers. One finger pans empty ground; **Move** + drag places selected entities. Desktop wheel remains a convenience, but there are no zoom +/- UI buttons.

## Workspace

- **FILES / ASSETS**: searchable source-aware categories for Buildings, Street, Vegetation, Interior, Characters, and Logic Markers. Labels distinguish verified GPT originals, published Pipeline PNGs, and metadata-only placeholders.
- **Canvas**: 3D WebGL depth + orthographic camera. Select, move, rotate, duplicate, undo/redo and a 4-way character walk preview.
- **LAYOUT inspector**: C / R / height, 90-degree facing, source-locked character proportions.
- **LOGIC inspector**: object name, layer/subtype, tags, interactions, capacity, optional entrance facing, blocking, and notes.
- **Map markers**: spawn, entrance, interaction, patrol, and trigger. These are authoring markers, not real runtime trigger volumes.
- **Export Map JSON**: data-only `virtual-life-ai-map-v2` schema with source provenance, footprint dimensions and *disabled proposal hooks*. No executable AI/game code embedded in JSON.

Existing map layouts saved in browser local storage are preserved. To see the new default 32-object study, **export your current layout first**, then use **View / Reset**. The new sample includes five candidate markers. Candidate locations are **not** a verified copy of the protected production scene.

For schema contracts and game-logic handoff, see [MAP_SCHEMA.md](./MAP_SCHEMA.md).

## City Builder v3 — roads, tiles, grid, placeholders

- **Grid**: the editor shows a full 1×1 c/r tile grid over the projected 3D floor, aligned to the native 64×32-px iso grid. Use the `#` toolbar control, `# Grid ON/OFF`, or the `H` shortcut to toggle visibility. Placement stays grid-aligned; the independent Snap tool controls half-tile object dragging.
- **Terrain**: choose Road, Sidewalk, Grass, Water, Plaza or Soil under FILES → TERRAIN / ROADS. The Paint tool draws with 1×1, 2×2 or 4×4 brushes. The Fill tool replaces a connected terrain region (up to the map limit). Roads automatically expose an adjacency shape (`straight`, `corner`, `t`, `cross`, `end`). Automatic neighboring sidewalk is optional. Roads and water block new building/prop placement.
- **Buildings**: FILES → CUSTOM BUILDINGS offers **Small 3×3**, **Medium 5×4**, **Large 8×6** replaceable drafts. Tap/click the canvas to place; valid/invalid footprints are shown in green/red. Width, depth and height can be changed in the inspector. Replace with official prefab art using **Replace with asset**; the source catalog remains distinct from placeholders.
- **Props**: tree, streetlamp, bench, native catalog props; select a prop and tap the map to place repeatedly. Pinch zoom and two-finger camera pan remain enabled; pointer gesture cannot move authored objects while pinching.
- **City Sample**: choose **City Sample** for an optional editable layout with road intersections, sidewalks, central park, a small pond, 10 replaceable buildings and 8 street/park props. Existing Street2 draft and browser saves are not changed unless you confirm. Export your draft before replacing it.
- **Persistence**: terrain resides in `map.terrain` (`default` and individual `cells`). Undo/Redo and JSON export/import include the terrain layer. Road cells export their adjacency shape and driveable/walkable/buildable hints in `virtual-life-ai-map-v3`. These are annotations, not active driving or NPC code.

The visual road/ground tile colors and custom building models are **editor placeholders**, not final pixel assets.

## Mobile panel and unbounded map update (2026-11-03)

- **Mobile Properties/Logic sheet**: the header now has a visible **⌄ Minimize** button. The file browser has an explicit × close button. A floating **☷ Properties** control reopens the inspector directly from the canvas. Selecting a building, terrain brush or prop no longer forces a sheet open over the placement view. Sheets are limited to roughly half the mobile viewport; their header remains visible during scroll.
- **Unbounded grid**: the original `map.worldBounds` remains only as a historical sample-region reference. `map.unbounded=true` removes the fixed placement border and terrain painting bounds. The isometric grid and base grass plane are **camera-windowed** (rendering extends as you pan/pinch), while terrain and objects stay serialized in world coordinates. Offscreen ground tiles are not individually allocated.
- **Viewport-limited Fill**: an unbounded grass field cannot be globally flood-filled, so Fill acts on the *current visible area*. The paint brush, roads, water, and placement are not restricted to that area.
- Existing locally saved maps automatically migrate to unbounded mode without erasing the original Street2 placement data. Large drafts may encounter the browser's local-storage quota: export JSON regularly for long-running builds.

This is a map editing system; it does **not** stream an infinite prepopulated town or enable gameplay mechanics.

## Reference City and named draft saves (2026-11-03)

- The **Reference City** preset is a layout recreation inspired by the supplied bird's-eye/isometric city screenshot, not a bitmap: roughly 77 independent replaceable buildings, hospital, church, civic/police/jail buildings, clock tower, school, mixed shops and homes, factory, warehouse, north-west lake/trees, a central public park, and a city-wide road/sidewalk grid. Building geometry and other missing game assets are labelled placeholders.
- **New installs** start with this reference-inspired editable map. Existing browser working copies continue to load first, so they are not overwritten. Use **🏙 Reference City** to load the preset intentionally, or **View / Reset** to return to the current default.
- **Save City / Save Draft** creates a named city snapshot. **My Cities** lists local drafts with last-saved date, object count and tile count. Users can **Open**, **Save**, **Save as New** or **Delete** them. The active draft can be saved again with one tap.
- Draft snapshots are stored **locally in IndexedDB**, with a localStorage fallback when IndexedDB is unavailable. Working edits continue to autosave separately. **These are not GitHub, online server, multiplayer or cloud saves** and are not shared between devices or browsers. Users should **Export JSON** for transferable backups.
- Creating a new preset, resetting or importing JSON detaches the previously active named draft, to avoid accidentally overwriting the prior saved city. A confirmation precedes destructive canvas replacements.
- Preset geometry, terrain and named drafts share the same editable `virtual-life-ai-map-v3` schema. Opening a draft restores its objects and terrain; all markers are design annotations only.

## Camera to Character (follow / Walk Test)

Use **🎥 Character** in the canvas toolbar, the **◎** camera icon in the left tool strip, or **🎥 Camera to this Character** in the selected-character inspector.

- Focuses the orthographic isometric camera directly onto the selected character, or onto the player preview (avatar) / first NPC if no character is selected.
- Switches into **Walk Test** automatically. Move using touch D-pad on mobile or WASD / arrow keys on desktop. Camera tracks the live preview actor with frame-rate independent easing.
- **Two-finger pinch** adjusts zoom while following; **one-finger pan** on empty terrain detaches follow to allow map browsing.
- Use **🗺 Map** (or the Home button) to exit follow, reset unsaved preview movement and restore the exact camera focus and zoom held before entering follow. This does not update map geometry or saved city drafts.
- Switching to a different city, reset, import, undo, or deleting the followed character safely ends the character-camera session.
- New Reference City layouts contain an editable **Player · Camera Preview** avatar near the spawn marker. Older drafts without an avatar can add one from **Assets → Characters**.
- Camera following does not introduce third-person perspective distortion or write character positions to the multiplayer game; it remains a rendering/authoring preview.

## Solid objects, large-building transparency and first-run onboarding

- During **Walk Test / Character Camera**, every static object marked `collision !== false` and `blocking !== "no"` acts as a physical obstacle: buildings, shops, trees, benches, street lamps, trash bins and other players/NPCs. Terrain water is also non-walkable. Marker points and explicitly passable/decorative objects do not block movement.
- Character movement is simulated at up to **0.18 map units per physics substep** with axis-by-axis sliding around obstacles, reducing tunneling at high frame times. Characters are never moved through objects during the Walk Test. This simulation does **not** modify saved player coordinates, the multiplayer engine or gameplay physics.
- Dragging any editable object/player now rejects invalid positions **before** showing an overlapping placement, rather than reverting only after pointer-up. Collision uses native tile footprints and respects quarter-turn building rotation.
- For visibility, only **large, solid buildings/shops** with footprint area ≥12 map cells and nominal height ≥2.8 units are made semi-transparent when a ray from the current preview character toward the orthographic camera passes through their visual occupancy box. Opacity eases toward **0.23**, then restores to its previous value upon leaving the occlusion corridor. Trees, benches, lamps, small props and logic markers stay visually unchanged.
- First-time visitors see an XP-styled, **5-step Welcome Wizard** covering map navigation, asset placement, terrain painting, character camera/collision and saving city drafts. Choose **Skip** at any time. Finish or skip is remembered in local browser storage. Reopen it later with **❔ Quick Tutorial** in the top bar.
- Runtime caveat: the original standalone builder is an **authoring preview**, not a multiplayer game. Collision is footprint-based and the occlusion volume for a complex sprite building is an approximation; integration into a production navigation/physics engine remains a separate task.

## Semesta: automated traffic, pedestrians, crowds, and quest NPCs (2026-11-03)

The map-authoring app is branded **Semesta** (`SEMESTA.EXE`). Both the left-hand tools and the mobile Quick Tutorial / City Draft dialogs are centered vertically.

### Editable ambient movement
- **Assets → MOBIL / MOTOR:** sedan merah/toska, hatchback, MPV, taxi Bluebird, van, TransJakarta bus, Gojek, Gojek passenger, Maxim, Maxim passenger, and SMA triple rider. The official vehicle IDs, dimensions, pivots, directions and route classes come from `lafrich/virtual-life-asset-pipeline/assets/street_vehicles/manifest.json`.
- **Assets → NPC / CROWD:** place an individual canonical V6B character or a multi-person crowd. Walkers navigate **connected 90° sidewalk corners** and circle closed blocks without teleporting; a dead-end sidewalk causes a natural U-turn along the same pavement. Crowds are distributed along that continuous route. Solid props and job-NPCs are excluded from the planned sidewalk walk when possible. Use the Inspector to adjust direction, speed and crowd count.
- **Assets → NPC QUEST / JOB:** Manusia Silver, Pak Ogah, Kang Parkir, Babeh Pemilik Toko Loak, Babeh Jam, Babeh Tas. They remain **stationary** on a sidewalk with a lightweight idle/pose preview. Job IDs and proposed `talk`/`accept_job` interactions are exported but **no actual quest, job payouts or gameplay logic execute here**.
- **Only approved surfaces:** cars/motorbikes snap to authored **road** tiles; pedestrians and crowds snap to **sidewalk** tiles; job NPCs are stationary on their designated road/sidewalk/plaza terrain. Editing terrain recalculates routes; a pedestrian without enough sidewalk to walk remains **visible and idle** on a suitable sidewalk tile rather than disappearing. The preview operates continuously while Semesta is open.
- **Vehicle queues & respawn:** cars and motorbikes travel straight down their road lane and leave the scene when they reach its far end. They enter an off-map respawn queue and reappear at the starting end only when the entry is clear. Following vehicles maintain source-sized headway (including larger bus spacing), wait behind slowed traffic, and automatically resume as the leader advances. Persistent static obstructions trigger an off-map recycle rather than frozen road piles. Pedestrians and crowds retain their separate sidewalk loop. This remains preview simulation, not multiplayer traffic AI.
- **Collision:** actors obey existing authored solid objects; ambient vehicles and walkers also keep their moving footprints separate where possible, and Walk Test includes live traffic/crowd bodies.
- **Reference City** is seeded with example cars, TransJakarta, Gojek, walking NPCs, a crowd, and four stationary job NPCs. Existing saved drafts are not overwritten automatically. New movement settings, job IDs, and the subtype of every automatic entity are included in named City Drafts and exported JSON.

### Asset availability
Upstream `assets/street_vehicles/cars/`, `riders_v3/sheets/`, and the job NPC `frames/` directories currently contain only `.gitkeep`: the actual output PNG files have not been committed. Semesta therefore renders explicitly **temporary, original pixel-preview silhouettes** for the vehicle and special quest NPC archetypes; they are **not pixel-identical to the original game assets**. Canonical V6B walking characters use real published sheets. This tool never decrypts/replaces source artwork or updates the multiplayer game.

### Inspector and controls
Select a traffic object and open **Properties**. The **AUTO LOOP / SIMULATION** section lets you set speed, choose an initial sidewalk walking direction, pause movement, adjust crowd size, or change a stationary NPC's idle action. **MOBIL / MOTOR**, **NPC / CROWD** and **NPC QUEST / JOB** are available in the Assets category filter. Save with **💾 Save Draft** or Export JSON for AI map handoff.

## Virtual Life original asset access (session-only)

Semesta includes **🔐 Virtual Life Assets** to browse the original game image manifest from the protected `lafrich/virtual-office` site. Images stay encrypted at rest in the public repository.

- The asset vault uses the **same PBKDF2-SHA256 / AES-GCM format** as the official Virtual Life login screen. When the user arrives from the authenticated game in the same browser tab, it can use their existing session key; otherwise it asks them to enter their own password locally. **No login password or decryption key is hardcoded, transmitted to GitHub, or added to the City Draft**.
- The `↗ Login Virtual Life` link uses the native login flow and returns to the Semesta editor. Authentication is provided by the existing login screen, not by this editor.
- The browser loads `../manifest.enc` as ciphertext, validates image entries, fetches the corresponding `../b/<blob>.enc`, decrypts them **in the current browser session**, and creates in-memory image URLs. Only PNG/JPEG/WebP/GIF images are exposed in the vault UI. Search and preview are lazy to avoid opening all assets.
- **Replace selected:** attach an original image reference to an existing building, shop, sprite, vehicle or stationary quest NPC. **Place on map:** add the selected image as an editable building / prop / tree with footprint and collision. **Auto-match:** link only assets with strong filename matches to existing traffic/quest IDs. No filename match means the old temporary pixel preview stays.
- All original file bytes remain in memory; only the original relative `assetPath` and category are persisted in the JSON City Draft. Rendering after a reload requires another authenticated/unlocked session. Unlock and Lock trigger rebuilding of the preview sprites.
- This is **not** an authenticated export endpoint or a method to republish original assets: the encrypted source and existing game/login/worker remain untouched. Image availability depends on the real protected manifest. Many vehicle and special NPC visuals may still be drawn procedurally by the game, in which case no matching standalone PNG exists.
- **Security:** do not paste your login password in GitHub issues, comments, source code or JSON exports. Unlock only via the official game or the local Semesta password field.

The bridge has source/DOM/syntax checks, but cannot verify live user credentials without a real browser session. Browser verification is required before claiming a particular locked source image is available.

## Building View: Solid / Outline (Semesta)

Use **BUILDING VIEW → ◇ Outline** on the canvas toolbar or the **◇** icon in the left-hand tools to switch all buildings from their solid pixel/mesh appearance into selectable architectural reference lines. **■ Solid** returns to the normal visuals.

- Each outline follows the **actual authored mesh edges** (walls, roof details, doors, windows, landmarks) when those meshes exist.
- Guide lines add a clearly defined **ground footprint**, facade floor levels, entrance reference and vertical building corners. A single-billboard original source image still gets a structural footprint/height guide rather than an empty frame.
- An invisible, non-rendering pick proxy allows **tap, select, move, rotate, resize, and Properties** in Outline mode. Physics/collision, vehicle traffic, NPCs and interior action data are unchanged.
- Both controls use the same toggle state. The view setting is saved in this browser's localStorage only; it never modifies the City Draft or JSON world file.
- Original Virtual Life images unlocked after a view switch rebuild their matching guide geometry; locking restores their preview geometry. Outline meshes are disposed when buildings or maps are replaced.
- This is a **visual inspection aid**, not a mesh-editing CAD application. Complex sprites use a bounding and footprint reference in place of unavailable physical 3D surface geometry.

## Compact TransJakarta and editable yellow markers (2026-11-03)

- **TransJakarta occupies 2×1 Semesta grid units** (visual sprite, static collision footprint, moving overlap and traffic following distance). This is an explicit editor override: its upstream Virtual Life manifest still describes a 6.6×1.3 source footprint, which is retained as metadata, not silently altered.
- **Yellow diamond pins** in the Reference City are `type: "marker"` objects: spawn, entrance, interaction, patrol or trigger points for future AI gameplay. They are not NPCs, props, or solid obstacles.
- Marker pins have a larger invisible touch target and a 20–27 screen-pixel tap-selection radius. Select one with a tap, open **Properties → Delete**, or use the **Logic** tab's **Yellow Logic Markers** selector with **Find / Delete / Remove All**. Removal is undoable. **Remove All** requires confirmation and affects only actual `type:"marker"` records.
- Use **⚑ Markers ON/OFF** in the canvas toolbar or ⚑ in the left tool strip to hide/show the pins without editing or deleting the City Draft. Marker visibility is remembered locally on this browser.
- **Golden building footprint/door lines** are purely the *Building Outline* guide geometry. These are not separate assets to select/delete. Set **BUILDING VIEW → ■ Solid** or use ◇ to turn the guides off; the real building stays editable.

## Day/night, mobile shadows and a 24-hour virtual clock (2026-11-03)

Semesta includes a continuous **24-hour clock** in the top-right of the city canvas. Like a short Harvest Moon day, **1× = 1 real second per in-game minute**, i.e. **24 real minutes per full in-game day**. **2× = 12 minutes/day** and **4× = 6 minutes/day**. Pausing stops only clock progression; editor camera, NPC previews, Walk Test and traffic simulation remain usable. Tap the clock to expand its exact-time scrubber, pause/play button and speed picker; **☀ Morning** jumps to 07:00. The simulated weekday cycles MON–SUN and the day number increases at 00:00.

The solar cycle has dawn, morning, midday, afternoon, sunset and night phases. A procedural sun direction changes the length/orientation of projected **soft ground shadows**:
- **Actors** (including the live moved player, regular NPCs, each crowd member and idle job NPCs) get contact and directional foot shadows.
- **Vehicles** follow their live moving or queuing positions; cars, motorcycles and buses receive contact/cast shadows with sizes based on their **Semesta editor footprints**.
- **Trees, lamps, small props and buildings** receive category-appropriate shadows. Long casts are drawn from the sun direction; shadows become shorter at midday and fade in darkness. In Building Outline mode the building casts are suppressed to keep road/vehicle visibility clean.
- At night the pixel-art scene is shaded using a non-interactive color-grade layer; warm light pools from street lamps and buildings are rendered separately on top. These approximate ambient/directional light for unlit MeshBasicMaterial sprites without expensive GPU shadow maps or altering source game sprites.
- Shadows are shared **InstancedMesh** layers updated about every 50 ms; separate 2D glow layers update with camera movement (otherwise roughly every 35 ms) to avoid lamps visibly lagging behind the world. Neither layer intercepts taps. Vehicle headlights (cool-white), taillights (red), and a subtle body highlight appear **above the night tint**.

The running clock is persisted in the current working copy periodically and written to `map.environmentClock` when saving an authored City Draft or JSON file. Opening another City Draft restores its own time; new/reference/sample city resets to 07:00 unless the imported map contains a saved clock. The visual state does **not** automatically change the real-world time, production Virtual Life multiplayer schedules, jobs or salaries.

## Sidewalk circulation and vehicle lighting (2026-11-03)

- **No disappearing sidewalk NPCs:** Walking NPCs and crowds follow adjacent sidewalk tiles through corners. The graph is walked using a stable right-hand turn preference, producing closed perimeter loops when available; dead ends cause physical U-turns and retracing instead of jumping from the end of a route to its beginning. The client prefers longer enclosing sidewalk circuits when more than one possible turn exists. Walk routes remain on actual sidewalk tiles and can exclude cells occupied by solid authored scenery.
- **Even very short sidewalks remain visible:** An isolated sidewalk square has no route, so its walker simply idles. Vehicles continue using the separate, deliberately off-map road-end respawn system; this is unchanged.
- **Grounded vehicle sprites:** Semesta's authored placeholder 160×108 vehicle texture has different transparent padding from original Virtual Life sprites. The visual mesh now uses a calibrated preview foot pivot (~91.5% of image height), the canonical source pivot for real sheets, and a small clearance above the asphalt to prevent wheels/body being rendered below terrain. Collision and vehicle shadow remain on the ground.
- **Responsive nocturnal lighting:** Night glows track the camera instead of waiting for a 120ms visual throttle. Running traffic is prioritized for lighting: headlights glow pale white, taillights glow red, and a soft cool body highlight is composited above the night color grade, without changing daylight art or world geometry.

All these changes are in Semesta's local preview rendering and route planning; they do not modify multiplayer Virtual Life behavior. The browser must refresh the versioned URL to see updated code.

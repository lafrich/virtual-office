# mainkan.exe — Namanya Juga Hidup / Player Client

**Source:** lafrich/virtual-office (GitHub Pages).

- Player URL: https://lafrich.github.io/virtual-office/mainkan/
- Membangun launcher: https://lafrich.github.io/virtual-office/membangun/?app=mainkan
- Native Semesta player-only entry: https://lafrich.github.io/virtual-office/world-builder/?player=1

## Architecture

Mainkan.exe owns the splash screen, login/register UI, character onboarding, and the outer player shell.

When player enters the world, Mainkan loads **the actual Semesta WebGL engine** in a same-origin fullscreen iframe using `world-builder/?player=1`. The engine reuses Semesta's own:

- World and city working copy, terrain, objects, native V6B art pipeline.
- Renderer / isometric camera, geometry, physics and collision.
- Walk Mode, camera follow, traffic, 24-hour environment.
- SemestaLifePlay, Jiwa interactions, Play HUD and phone, native touch controls.

There is **no second renderer in Mainkan**. The previous duplicate 2D world.json/Canvas simulation was removed.

## Player-mode protections

- Adds `semesta-player-mode` to the Semesta document.
- Hides edit menus, tools, asset browser, property inspector, and authoring controls while preserving the actual native canvas and gameplay overlays.
- Automatically enters `setMode('walk')` and disallows leaving Walk Mode from player entry.
- Skips Semesta editor draft autosaves in player mode, including the periodic clock write, so starting player mode does not overwrite the editor's working map.
- Sends a same-origin `mainkan:semesta-ready` message with city name and object count after the native runtime starts.

This is a **player preview**, not a security boundary: production multiplayer needs a separate server-authoritative client and resource permissions.

## Which city is displayed?

The native Semesta editor currently reads the `virtual-life-gpt-world-builder-pipeline-v3` working map in the **same browser and origin**. If none exists, it loads Semesta's built-in starter city. As a result, the player preview uses what Semesta normally opens **on that device**.

A city stored only in Google Drive or an IndexedDB named draft on another device is **not** automatically published to player mode. For consistent cross-device multiplayer cities, add a separate Publish City pipeline and a canonical hosted read-only world snapshot. This is not yet implemented.

## What remains incomplete?

- Real player accounts and secure backend sessions; current Guest Preview does not persist online. Never store passwords in Drive, GitHub or browser storage.
- Cross-device player progress, wallet, owned rooms, authoritative Jiwa economy, and networking.
- Final character creation / clothing sync with the current Mahluk Hidup data contract. Mainkan currently selects a preview profile, and native Semesta uses the closest available existing rig.
- Latest Drive city publishing / sync into an authoritative player-world build.
- End-to-end interactive browser testing across PC and mobile.

When a backend is available, set `window.MAINKAN_CONFIG.apiBase` inside `mainkan/config.js` to a secure HTTPS origin that supports credentialed CORS and HttpOnly sessions.

Endpoints provisionally expected:
- `POST /auth/register` and `POST /auth/login` receive `{email,password}` and return `{authenticated:true,player?:{character?:...}}`
- `PUT /players/profile` receives `{character:{name,zodiac,asset,gender}}` and returns `{saved:true,player?:...}`

## Smoke tests

Run `node --test tests/mainkan-smoke.test.cjs`.

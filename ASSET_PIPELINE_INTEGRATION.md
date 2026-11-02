# Virtual Life — Game Asset Bridge v1

This connects the existing [Virtual Life Asset Pipeline](https://lafrich.github.io/virtual-life-asset-pipeline/#rigs) to the actual `virtual-office` repository, with an opt-in player renderer on the editable Rebuild and opt-in rendering inside the authenticated Cove module.

**Important:** The main `office.html` game is AES-encrypted. Its original renderer and multiplayer code remain unchanged; a public asset bridge cannot transparently hook inaccessible internal sprites. In the main encrypted world the bridge offers the developer picker and public sprite preview. **Actual sprite replacement** is wired in two editable renderers: `rebuild/game.js` and the authenticated `cove-reskin.js` room module.

## Entry points

- Rebuild without modification: https://lafrich.github.io/virtual-office/rebuild/
- **Rebuild + live rig asset rendering:** https://lafrich.github.io/virtual-office/rebuild/?assetbridge=1
- Original locked game without changes: https://lafrich.github.io/virtual-office/
- **Authenticated main world + asset inspector:** open `office.html?assetbridge=1` after logging in.
- **Authenticated Cove + imported character sprite:** open `office.html?cove=1&assetbridge=1` after logging in, then launch **COVE ROOM**.
- Login redirect shortcut: https://lafrich.github.io/virtual-office/?next=office.html%3Fcove%3D1%26assetbridge%3D1

This is a **developer feature flag**, not automatic rollout. Remove `assetbridge=1` to restore existing visuals and performance.

## What is actually integrated

On enabling the flag, local `game-assets/asset-bridge.js` fetches the public pipeline's `rigs.json` and the selected character's `motion-packs/<actor>.json`. The repo vendors `game-assets/rig-runtime.js`, the tested frame renderer, **locally**; no external executable JavaScript runs.

The bridge validates the requested actor, model type, atlas path, 64×112 layout and frame durations, and fetches original PNGs **on demand**. It exposes:

- `window.VOAssetBridge.preloadActor(id)`: load the specific actor's motion metadata, without replacing the selected local player.
- `window.VOAssetBridge.getClip(id)`: selected actor's reviewed/ready clip, or null.
- `window.VOAssetBridge.selectActor(id)`: change dev preview and the opt-in avatar, preserving underlying player state.
- `window.VOAssetBridge.draw(ctx, point, zoom, options)`: return `true` after rendering a **real** source-actor clip, or `false` to keep the original game's renderer.
- `window.VOAssetBridge.drawActor(...)`: equivalent, explicitly for NPC integrations.
- `window.VOAssetBridge.getStatus()`: status and ready-action list.

Suggested game renderer:

```js
const rendered = window.VOAssetBridge?.drawActor(ctx, screenPoint, zoom, {
  actorId: "legacy_gfunk",
  instanceId: "npc-42",
  direction: "sw",
  moving: true
}) || false;
if (!rendered) renderExistingNPC();
```

The ready clip ID is `walk` for native human rigs but some aliens use `move` or other character-specific actions. For a nonstandard clip, use:

```js
window.VOAssetBridge?.drawActor(ctx, screenPoint, zoom, {
  actorId: "legacy_gfunk",
  instanceId: "npc-42",
  actionId: "move",
  direction: "sw"
});
```

Each actor and instance uses its own motion timer. The engine continues to own the gameplay state and draw ordering. **A clip being present in the central 203-action database does not mean it is authored for that actor.** Unavailable actor-specific pose = `draw()` returns false.

Rebuild's playable player mapping uses `walk` and `idle`, plus action-aware poses (`sit`, `sleep`, `sit_type`, etc.) when the actor actually has that original animation. If missing, legacy sprite/pose remains. The Cove module also maps `bed`, `toilet`, `tub`, and `desk`, with identical fallback behavior.

## Studio-to-game workflow

1. Author a new animation in `virtual-life-asset-pipeline` with **actual original poses for the correct model rig**, not just a `planned` ID.
2. Review sprite continuity (4 directions, frame dimensions, pivot, anatomy and Z layering), and publish.
3. Pipeline builder creates/updates that actor's motion pack and `rigs.json`.
4. Refresh a `?assetbridge=1` game session. **No copy/paste and no game source edit** is needed for an action already mapped by the game renderer.
5. To add a **new gameplay action type** (e.g. cooking, sweeping, toilet), add the relevant gameplay logic and `actionId` trigger in the game's renderer/interaction system. The bridge handles the sprite data, **not** economy, AI, collisions, pathfinding, save state or multiplayer.
6. Keep current deployed fallback visual if missing; never silently retarget Bowie pixels onto Milk or Gfunk.

## Security, performance and constraints

- Main protected assets, `b/` ciphertext, `manifest.enc`, authentication and service-worker key handling are untouched.
- Only public asset definitions and PNGs from the pinned **pipeline hostname and path prefix** can be loaded. No arbitrary remote script or dynamic code execution.
- `sw.js` treats only the two new `game-assets/*.js` files as public, and injects these scripts into decrypted `office.html` *only* when `assetbridge=1`. `?cove=1` remains independently supported.
- Original game default (without opt-in) does not fetch pipeline metadata or extra PNGs.
- Image loading and per-character metadata are lazy, cached within the session. Rendering returns false while loading.
- Assets are hosted publicly on GitHub Pages, so this is appropriate for **public character packs**, not secret/proprietary sprites. For shipping or offline multiplayer, snapshot/version and publish asset files through a controlled game CDN with a release manifest.
- CORS and authenticated on-device behavior must be confirmed with the deployed site on user devices. Failures fall back; no successful online load is assumed before verification.

## Testing

```bash
node --check game-assets/rig-runtime.js
node --check game-assets/asset-bridge.js
node --check sw.js
node --check cove-reskin.js
node --check rebuild/game.js
node tests/asset-bridge.test.cjs
```

The test verifies default-off, opt-in metadata, original sprite frame drawing, four direction mapping, fallback on unrigged actions, lazy NPC loading, and that NPC selection does not override the player's chosen actor.

## Next integration stage

To apply imported pipeline sprites to *all* characters throughout the primary encrypted multiplayer game, modify its original pre-encryption character renderer/build, rather than unconditionally injecting a canvas overlay into encrypted HTML. Hook the engine's NPC entity ID and animation state to `drawActor` and package or pin an approved rig snapshot. Avoid duplicating layers over the street, cars, doors, or other NPCs.

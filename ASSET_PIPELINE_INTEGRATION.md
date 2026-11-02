# Virtual Life — Asset Pipeline developer inspector

The original [Virtual Life Asset Pipeline](https://lafrich.github.io/virtual-life-asset-pipeline/#rigs) remains an **independent asset authoring and preview service**. This repository optionally exposes its model/rig preview **inside the original authenticated game page**, but **does not integrate animations into the encrypted game's live character or multiplayer renderer**.

## Game access

- Original game, unchanged: https://lafrich.github.io/virtual-office/
- Optional developer-only asset picker/preview: open `office.html?assetbridge=1` after normal login.

The experimental, separately developed **Cove Room mode was removed on November 2, 2026** at the owner's request. The `cove-reskin.js` injection, its menu button, its room canvas and its documentation are gone. Adding `?cove=1` no longer activates any extra mode. **Any original Cove location that exists in the authenticated game's own assets is not altered.**

The unrelated `/rebuild/` test game was retired earlier. Neither that archived prototype nor the deleted Cove addon is a target for future development.

## What is retained

- `game-assets/rig-runtime.js`: local, self-contained 2D motion helper, without externally loaded executable JavaScript.
- `game-assets/asset-bridge.js`: an **opt-in inspector**, which reads the public asset pipeline `rigs.json`, loads actor-specific approved `motion-packs/<actor>.json`, previews actual 4-way sprite frames and exposes a developer-only API.
- `sw.js`: existing decrypting service worker. Only when `assetbridge=1` does it inject the inspector scripts into the decrypted `office.html` response **in memory**. No other query flag injects Cove-specific modules.

The API still has `VOAssetBridge.preloadActor(id)`, `getClip(id)`, `drawActor(ctx,point,zoom,options)`, and `getStatus()` for eventual, **explicit** integration into an editable original engine. It is *not currently wired to the production world's NPC renderer*.

## Correct production integration

1. Add and approve original actor-specific animations in the asset pipeline. The shared action database includes planned actions that aren't yet playable.
2. Modify the original engine's character/NPC renderer **before its encryption/build process** to call `drawActor` on the correct entity and action ID, with reliable depth ordering and fallback.
3. Validate collisions, animation pivots, gameplay callbacks, multiplayer replication, and release versioning. Do not splice unrelated test scenes into the live game.
4. Keep login, encrypted assets, account state and native areas (including any built-in Cove location) unchanged unless explicitly requested.

## Tests

```bash
node --check sw.js
node --check game-assets/rig-runtime.js
node --check game-assets/asset-bridge.js
node tests/asset-bridge.test.cjs
```

The tests assert that the separate Cove addon cannot be loaded by the service worker, that the original developer inspector is strictly opt-in, and that actor-specific sprite preview remains source-correct. The original protected `b/` assets, `manifest.enc`, and game logic are untouched.

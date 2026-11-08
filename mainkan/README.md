# mainkan.exe — Namanya Juga Hidup

Player shell and onboarding-flow authoring for the existing Semesta world engine.

## Open
- Game: https://lafrich.github.io/virtual-office/mainkan/
- **Flow Editor:** https://lafrich.github.io/virtual-office/mainkan/flow-editor.html
- Membangun launcher: https://lafrich.github.io/virtual-office/membangun/?app=mainkan

## Clear ownership
- **Mainkan:** splash, Welcome, auth screens, character creator, confirmation, tutorial, pause, user-facing HUD buttons and the editable graph.
- **Semesta:** existing WebGL scene, city data, assets, physics/collision, live character rig, animation, movement, traffic, world time and Jiwa gameplay engines.
- **Mahluk Hidup:** canonical rig / custom appearance art source. Mainkan does not modify its editor or duplicate V6B assets.

Native world is embedded from `../world-builder/?player=1` on the same origin. The player entry hides editor controls and the old Semesta HUD chrome, preserving Nokia/Bag popup engines and touch D-pad. Mainkan's phone/bag/action buttons forward to the original native controls; Mainkan reads Jiwa status, never forks wallet or player economy.

**Performance note:** this separates UI ownership and removes duplicated HUD chrome; it does not yet tree-shake heavy Semesta editor JavaScript from the player-side runtime. A true lightweight production client would need a separated shared engine bundle.

## Onboarding flow (restored from the 2026-11-02 source bundle)
Default flow:

`Splash → Welcome → Login/Register or Guest → Character Creator → Confirm → Loading/Enter World → First-Time Check → Tutorial (if new) → Semesta Gameplay`.

The character screen includes the classic design choices: birthday-derived zodiac, nickname, human male/female or Astrofrich base, hair and colors, skin, glasses, facial hair, tops, pants, shoes, and rotating/animated V6B preview. **Current limitation:** custom outfit/skin choices are collected in the character model but do not yet compose a new V6B rig in the world. Existing prebuilt V6B character sheets are shown as reference. Final integration depends on the current Mahluk Hidup asset/export contract, not the older bundle's private patch chain.

Guest preview stays in memory only. No online account should be claimed as created until a real backend confirms it.

## Flow Editor

Open `flow-editor.html` in the browser.
- Select a node to edit its properties.
- Drag nodes to move them. Click the **yellow output port**, then click another node to reconnect NEXT.
- Branch routes (Guest / New Player / Returning / First-Time) are editable in the inspector.
- Set splash frequency `every_launch`, `once_per_session` or `first_time_player`; set repeat count (1–5), duration (0–15000ms), skip, title and description.
- Add, duplicate, remove, undo, redo, choose start node, and load four presets: Default New Player, Returning, Guest, Debug.
- **Test Flow** opens an isolated same-origin Mainkan iframe with the current in-memory graph via postMessage.
- **Export JSON** downloads a `.json` file to your computer. **Import JSON** restores it. No flow editor browser autosave, online database, Drive backup, or GitHub write is performed.
- To try an exported JSON flow in the main Mainkan application, click **Import Flow JSON** in Mainkan's toolbar. It applies for that active game session only. Export your changes to retain them.

Graph model: `mainkan/flow-model.js`. It rejects malformed formats, missing IDs/targets, unsupported types, excessive nodes and invalid duration/repeat values.

## Known boundaries
- GitHub Pages alone cannot authenticate accounts or run multiplayer. Secure auth needs a backend and session management. `mainkan/config.js` keeps only a public origin, no secrets.
- Native Semesta reads the same browser's Semesta working city. The latest Google Drive city, server-published maps, player-owned rooms and cross-device continuity need a separate publish/online sync pipeline.
- Semesta's world renderer stays authoritative for physics and NPC/gameplay rules.
- Editor UI is hidden in `?player=1`, but hiding controls is **not** a production security boundary.

## Tests
- Node: `node --test tests/mainkan-smoke.test.cjs`
- Real Chromium: `node tests/mainkan-native-semesta.e2e.cjs` and `node tests/mainkan-flow-editor.e2e.cjs` in the CI same-origin checkout layout.

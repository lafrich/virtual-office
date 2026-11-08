# mainkan.exe — Namanya Juga Hidup / Player Client

A separate **player-facing** application in the same GitHub Pages repository as Membangun and Semesta.

## Open

- Player: https://lafrich.github.io/virtual-office/mainkan/
- Developer launcher: https://lafrich.github.io/virtual-office/membangun/?app=mainkan

## Implemented (preview v0.1)

- Windows 98 responsive splash screen and player login / registration screens.
- Clear unauthenticated guest preview path, with in-memory-only character selection (name, zodiac, V6B preview).
- Read-only isometric world runtime loaded from `../world-builder/world.json`, with metadata and verified published sprite URLs from `../world-builder/pipeline-catalog.js`.
- Keyboard (WASD/arrows), touch direction controls, click/tap-to-walk, zoom, player camera, context action probe, world collision fallback.
- Uses shared `../shared/spawn-respawn.js` (fallback spawn pool when no player-owned room).
- No editor controls exposed in player client.
- Standalone launcher entry in Membangun.exe.

## Intentionally not implemented

- **Accounts**: no functional login/register until a secure backend exists. The buttons explain the limitation; passwords are not stored in GitHub, Google Drive, localStorage, or any browser game-save store.
- **Multiplayer and cloud progress**: require authoritative online service and per-player database.
- **Final character editor / clothes**: owned by Mahluk Hidup, not duplicated here.
- **Gameplay rule execution**: Jiwa rules need a published, server-authoritative runtime integration; Action currently identifies nearby objects but deliberately does not award money / alter rules.
- **Latest published Jakarta City**: `world-builder/world.json` is an authoring snapshot, not automatically the user's latest Google Drive city. A separate publish/export step is needed.
- **Missing sprites**: only pipeline assets with published PNGs render as authentic sprites; unavailable legacy assets show visibly approximate primitive placeholders.
- **Owned-room respawn**: requires authenticated profile and room data; guest preview uses shared public spawn fallback.

## Future backend contract

Set `window.MAINKAN_CONFIG.apiBase` in `mainkan/config.js` to a secure HTTPS server origin. API must support CORS for this game origin and Secure HttpOnly session cookies.

- `POST /auth/register`: `{email,password}` -> `{authenticated:true,player?:{character?:...}}`
- `POST /auth/login`: same request and response.
- `PUT /players/profile`: `{character:{name,zodiac,asset,gender}}` -> `{saved:true,player?:...}`

The player client passes `credentials:'include'`, never saves passwords locally, and will **not** claim a login succeeded without the server confirming `authenticated:true`.

Before production launch, implement logout, CSRF protection, rate limiting, email verification, recovery, server validation, secure session lifecycle, per-player persistence, authoritative multiplayer, and publishing of approved Semesta + Jiwa datasets. Guest preview should remain visually distinct from real online play.

## Quick test

`node --test tests/mainkan-smoke.test.cjs`

Do not modify existing Semesta authoring map, Jiwa rules, or Mahluk Hidup assets just to test Mainkan.

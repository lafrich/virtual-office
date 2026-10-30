# Cove Room on the Grok engine — opt-in integration (phase 1)

This is a protected, experimental Cove interior installed into the **original encrypted Grok Virtual Office shell**. It is NOT the independent `/rebuild/` game.

## Access
- Log in at `/?next=office.html%3Fcove%3D1` using existing original-game credentials.
- Once the existing Grok player login reports a live session, select **⌂ COVE ROOM**.
- **← EXIT** returns to the running original game in place; no original game files, multiplayer state, account, or save data are modified.
- Without `?cove=1`, the original game is unchanged.

## Gameplay implemented
- Separate Cove bedroom + bathroom tile world, 2:1 isometric coordinates.
- Uses the original protected `assets/chars/reference_man_sheet.png` (6×44, each frame 64×112, 4 directional rows), never makes the sprite publicly available.
- Local room walk, mouse/tap to walk, mobile D-pad, 4-direction movement.
- Contextual interaction: **bed → sleep; bathtub → bathe; toilet → use toilet; desk → work; stand to exit interaction**.
- Furniture, bath and room geometry rendered as independent pieces; no image background overlaid onto interactions.
- No new credentials, tokens or secrets.

## Integration design / limitations
- The original Grok game currently contains an outdoor Cove Kost facade but **no playable Cove interior** in the encrypted source, so this module adds the missing scene without modifying/repacking ciphertext.
- The original Grok encrypted game and multiplayer run unchanged **behind** this experimental scene. Cove movement and object actions are currently local-only; this initial integration does not claim server-synchronized Cove positions or life-stat changes.
- The opt-in injection is performed in `sw.js` after authentication only for `office.html?cove=1`. The module JS itself is public source code, but original protected sprites remain served by the authenticated service worker.
- Art is a code-authored first pass matching the reference palette and modules, **not final hand-drawn production sprites**.
- Before making this the default experience: finish art-pipeline assets, replace procedural shapes with authored per-object PNG sprites, connect interior zone coordinates to original multiplayer and life status, and run real-device visual/performance QA.

## Files
- `cove-reskin.js` — visual scene, avatar, controls and actions.
- `sw.js` — authenticated, optional module loader.

Do not remove the original game, the password gate or its encrypted `b/` asset store.

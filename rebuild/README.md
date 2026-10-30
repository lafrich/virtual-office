# Virtual Office — Editable Rebuild 01

Playable, independently editable prototype at **https://lafrich.github.io/virtual-office/rebuild/**.

## Why this exists
The original Virtual Office and staging game ship encrypted. Editing decrypted markup through service-worker injections caused unreliable asset depth sorting and chair flickering. **This rebuild is fresh source code**, so every object, interaction, scene, and UI can be edited directly. It does not copy private game code or expose original encrypted assets.

## Files
- `index.html` — UI skeleton, menu, buttons, Status Player / Notifikasi.
- `style.css` — responsive mobile HUD, pixel-themed interface.
- `game.js` — isometric Canvas 2D world, furniture drawing, needs simulation and actions.

No build step, backend, dependency, password, decryption, npm, or API keys required. Open `index.html` via a local HTTP server (e.g. `python3 -m http.server 8000` in the repo root), or publish on GitHub Pages.

## Current playable scope
- Isometric maps: Office (lounge, desks, Baymax, Migi), Taman (benches, warteg exterior, recliner), Warteg (food display and bar-stool seating). Original game is not modified.
- One contextual Action button: Duduk / Bangun, Rebah, Pet Migi, Kerja, Pesan makanan, Minum, Mandi, Pipis, Masuk/Keluar, plus Kentut.
- Movement: joystick, arrows/WASD, tap/click to walk, Shift to sprint, Space or Enter for Action.
- Self-contained seating render order. Furniture and seated character are drawn in fixed painter order each frame, not reparented between layers.
- Status Player and Notifikasi in a tabbed bell menu; four life needs with progression, in-browser persistence, offline no-decay, and an event feed.
- LOCAL-ONLY. Multiplayer, authentication, server-validated economy and production asset parity are intentionally not implemented.

## Modify the game
- Edit `spots` in `game.js` to add or remove contextual action locations.
- Edit `drawOffice`, `drawWarteg`, `drawPark` and their furniture functions to modify sprites and layout.
- Edit `update(dt)` for the needs formula; `pressAction()` for action effects.
- Edit the markup in `index.html` and responsive design in `style.css`.
- Version any changes with separate feature branches and commit tests before merging.

## How to test
1. Open `/rebuild/` and move around with the left-hand joystick.
2. Press the map pin button to switch **Office → Taman → Warteg**.
3. Approach a sofa, park bench, lounger or bar stool, then tap the contextual action on the lower right.
4. Move to stand; no seated animation while walking.
5. Use the bell button → **Status Player**; walk, sit, eat, shower or pee and confirm bars update.
6. Reopen to verify saved needs (no decay while the game is closed).

This project is not a pixel-perfect replica of the original artwork. It is a clean playable foundation, deliberately designed for iterative asset replacement and expansion without risking the existing deployment.

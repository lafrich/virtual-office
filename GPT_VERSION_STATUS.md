# GPT Version — isolated beta workspace

Status: **v16a Package A development / NOT DEPLOYED**.

This branch was created from `main` to keep GPT Version separate from the live Virtual Life game. The production encrypted site and Cloudflare Worker are unchanged.

2026-11-02 development patch 01 (kept outside this public repo to avoid leaking decrypted source):
- Restore lane-A vehicles as direct children of the original native traffic layer to preserve NPC/vehicle depth order.
- Preserve moving the far lane onto the back canvas for between-lanes player positions without creating a nested SVG group.
- Disable empty-floor tap-to-walk; keep keyboard, joystick, D-pad, and NPC/object clicks.
- Disable scheduled demo protest NPCs outside explicit test mode.
- Hide obsolete outer title bar; use full viewport; move mobile job toast clear of profile/needs.
- Correct the v16a-only build-label expectation in the depth regression.

Local isolated checks: Python/JS syntax, 15 vehicle-parent checks, 8 far-lane checks, traffic phases and no collision at the clear-phase crossing point: **PASS**.

**Not yet verified:** complete source rebuild, desktop/mobile visual depth and flicker regression, full Worker/multiplayer integration, UI screenshot QA. Do not merge or deploy this branch without full test coverage and owner approval.

The original handover ZIP is development context. The encrypted `main` game remains the design and gameplay reference.

Do not commit decrypted game HTML or developer passwords to this public repository.
## 2026-11-02 — Recovery without external hosting

- Added `gpt-version/tools/build_from_github.py` to reconstruct v16a locally from the original encrypted GitHub `main` build, rather than making another visual prototype. Password is read from an environment variable and not stored.
- The builder reuses the handover's Grok patch and runtime assets and fetches genuinely missing encrypted assets from GitHub, with path and version checks.
- Added `gpt-version/tests/test_builder.py` for encrypted fixture and network-isolation guard tests. Equivalent local test fixtures pass. Actual GitHub download, complete patch application against latest `main`, and full game QA are NOT YET VERIFIED.
- No Vercel, new hosting provider, live Worker changes, or public plaintext game build. `main` stays untouched.

## 2026-11-02 — GPT Version v16a public beta (isolated)

Public beta: https://lafrich.github.io/virtual-office/rebuild/gpt-version/
Rollback to prior beta: https://lafrich.github.io/virtual-office/rebuild/gpt-version/?classic=1

New files/edits under `rebuild/gpt-version/` **only**; published as additive files on `main` to work with existing GitHub Pages. The production `sw.js`, encrypted manifests, main game shell, and Cloudflare Worker have NOT been changed.

- `package-a.js` applies v16a original-engine transforms in the scoped beta SW. The original encrypted game and original sprites are fetched unchanged, decrypted in browser memory. The patch is not a standalone game and is never applied to production.
- Owner feedback covered: free crossing anywhere, 40s traffic density cycle (busy 12s/quiet 28s/clear 6s), 15 vehicles, local vehicle collisions and respawn to starting kerb with no gameplay penalty, slower walk/run, walk animation release, loak roof-occluded search spots, A1 no floor tap, A2 scheduled demo NPC off, A3 toast mobile, A4 fullscreen, A5 far-side image preload near crossing, lower sparkles, fewer NPC crossers, phone-map-verified HUD minimap removal.
- A7 depth fix: cars stay attached to the native `EXT.gC` painter; no synthetic lane-A SVG group. The existing far-side world layer contract is preserved.
- Verified against GitHub encrypted production build: 20 exact replacements applied; all resulting JavaScript script blocks compiled successfully. Traffic phases and the 26–32s clear crossing interval checked at both lane positions. Beta login and SW are syntax checked; `main/sw.js` SHA unchanged.
- Browser/Android screenshot QA and live end-to-end user testing are still pending. A5 locked-asset deferral, A6 performance optimizations, and full A7 flicker regression are deliberately NOT represented as completed without measurements. Multiplayer/Worker v16a server changes are NOT deployed and remain out of scope for this offline beta.

SAFETY: Never merge unencrypted game HTML, never connect the beta to the live Worker, and never claim that unit checks prove end-to-end gameplay.

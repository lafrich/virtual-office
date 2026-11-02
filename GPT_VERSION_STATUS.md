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
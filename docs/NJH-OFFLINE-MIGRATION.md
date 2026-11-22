# NJH — Single-Player Offline Migration (Preview Only)

Date: 22 November 2026. Owner: New Bot (game design/roadmap/approval). This document is a migration decision and acceptance contract, **not** production deployment approval.

## Locked product direction

Namanya Juga Hidup becomes an offline, single-player Indonesia-city life simulator. Inspired by Harvest Moon's daily rhythm, not its farming setting. The playable identity remains: start as a hobo, survive, work, move into a kos, then pursue optional longer-term goals. There are no shared-world players or server-authored economy decisions in offline gameplay.

One installed game = one persistent local world (with optional separate future save profiles). The world and clock progress while the game is running and stop when closed. Players can play without login, without an online session, and without network connectivity **after all required resources are installed**.

## Authority and preservation

- New Bot: design, balancing, roadmap and final approval.
- Baymax: gameplay logic, persistence, runtime, offline delivery and deployment.
- Layar: Mainkan screens and UI, including save/load clarity.
- Gerak: animation integrations with existing LGR/Genesis assets.
- Ellen: static art, interior templates and approved asset inventory.
- Semesta is still the world renderer/placement authority; Jiwa is still the economy/needs/progression authority; Bangun Ruang and Mahluk Hidup remain development/authoring apps. No parallel game engine or manual re-drawing of official sprites.
- Do not overwrite the main release (22 November rollback STEP 2, SW v48), multiplayer Worker, test-account credentials, production save data, or the art-pipeline repository.
- A legacy online-test escape hatch (Mainkan ?onlineTest=1) exists only to preserve test diagnostics while migrating. It is not the intended shipping game.

## Implemented in draft PR #45

1. Default Mainkan menu is **Lanjutkan / Mulai Baru** without online authentication.
2. Dedicated offline player ID \`njh_offline\`; character, auto-state and manual slots are stored under namespaced keys, not guest/online-test/editor keys. New Game clears **only** those keys, after stopping the runtime.
3. Offline character persists locally, and Continue reuses the approved Genesis profile.
4. Pause menu uses real native Jiwa/SemestaLifePlay \`saveSlot('manual_1')\` / \`loadSlot('manual_1')\`, not a simulated menu action. Local progress still autosaves through the existing life runtime.
5. JSON export/import includes the offline character, current Jiwa state and its slot collection, with schema, IDs, size checks, validation and rollback on storage failure.
6. Pause is session-only when persisting/restoring day and minute.
7. A draft Service Worker caches game scripts, CSS, selected core files and acquired game assets. **Siapkan Offline** fetches the static dependency list and Three.js CDN module. Art fetched during online gameplay is cached opportunistically.
8. The existing production multiplayer Worker and existing local saves for Ichsan/Noor/Guest accounts remain unchanged.

## Important limitations / not yet completed

This preview is **not a verified fully standalone release**:
- A one-time network connection is still needed to download its runtime and art; the present ESM Three.js dependency is not yet vendored inside the repo.
- Dynamic sprites and externally published pipeline assets may not all be discoverable by the static manifest. Cold-start airplane mode after a clean install must be tested, including menu, creator, street, shop, kos and NPC sprites, and failure must be visible—not silent.
- Autosave and manual Slot 1 capture life state; restore of exact world position, interior scene and NPC relationship memory is not yet guaranteed by this PR.
- NPC daily schedules and persistent social progress, additional manual save slots, launcher/APK/desktop packaging, and install progress/size estimates are future implementation steps.
- Existing account saves are not silently migrated to the new profile; migration must be deliberate and reversible.
- Some legacy e2e checks are tied to online test profiles; use the test escape hatch rather than restoring online dependencies to shipping gameplay.

## Acceptance gates before deployment

1. Desktop and Android, zero login: New Game → customize character → 2 game days of work, eating, sleeping, buying items and getting a kos → quit app completely → Continue with exact money, items, needs, day/minute, housing and quests.
2. Manual Slot 1 load must restore the saved state without clock drift. New Game must not resurrect an old autosave. Export → clear local state → import → Continue must recover the same saved state.
3. Cold-launch offline test: fully download official asset pack, close/reopen browser/device and switch to airplane mode; game must not require remote JS, image, CSS, JSON, auth or Worker. Check all player-critical interiors, actions, NPCs and 4 LGR views.
4. No regression in Semesta editor, Bangun Ruang, Mahluk Hidup, Jiwa authoring, Google Drive projects or archived user saves.
5. All Node/Playwright suites, full approved 4-account test flow, and visual art approval green. Record exact release SHA + SW revision, and write a fast-forward-only rollback plan.
6. New Bot explicitly signs off. Keep draft PR unmerged until every gate passes.

The scope of this branch is the **offline vertical slice and migration scaffolding**, not a claim that every migration gate is finished.

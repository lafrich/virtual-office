# Rollback — hotfix Minimarket.exe crop + window-fit gate

Written 2026-11-14 (Asia/Jakarta). CSS + check tool + docs only; no logic, Worker or storage change.

- Previous live `origin/main`: `9196c5923c61e2b4ad07d9e5a8b92a9b96ff1b83` (Step 2 + CHECKPOINT STEP 2, sw v28, `?v=njh-step2-2`)
- Hotfix commit: `0f4681caa18e4d2ee8d0f852a8518c6e70085886` (sw v29, mainkan `?v=njh-step2-3`)

```bash
git fetch origin && git checkout main && git pull --ff-only origin main
git revert --no-edit <rollback-notes commit> 0f4681caa18e4d2ee8d0f852a8518c6e70085886
# bump sw.js to v30, push --ff-only
```

---

# Rollback — Step 2 (minimarket, cooking, fishing, kost token, NJH98 step 2 UI)

Written 2026-11-14 (Asia/Jakarta). Worker, passwords, auth secrets and vault files unchanged. No storage migration (new save fields are additive; old saves load).

- Previous live `origin/main`: `ceb87da8886897d6fc6413cb2e15d985ebef5c90` (NJH-only map, sw v27, `?v=njh-only-map-1`)
- Step 2 tip before this notes commit: `dec6996aa9d1fd7124ddbe5a4672066eabfbcacf` (`preview/njh-step2`; sw v28, `?v=njh-step2-2`)
- Contents: logic + hooks `0a850e2c`; Ellen fishing spot `1a20b3c1` / `f36e173c` (merge `075a3e30`); Ellen minimarket `db5b85c6` + Cove facade `00d0f7a`; merge of `origin/main` ceb87da8; Layar UI `1ff0fa3f` (`shared/genesis-player.js` not included).

Main was fast-forwarded (merges kept). To roll back without force-push, restore the previous tree in one new commit:

```bash
git fetch origin
git checkout main && git pull --ff-only origin main
git checkout ceb87da8886897d6fc6413cb2e15d985ebef5c90 -- .
git commit -m "rollback: step 2 (restore ceb87da8 tree)"
# bump sw.js to v29 so phones drop v28, then push --ff-only
```

---

# Rollback — NJH as the only default playable map

Written 2026-11-14 (Asia/Jakarta). Worker, passwords, auth secrets and vault files unchanged. No storage migration.

- Previous live `origin/main`: `28dcca42b6739fd36c12b78e6dd2aa566e1e0adf` (docs: Step 1a status, rollback, and CHECKPOINT STEP 1)
- Feature commit: `e935083362657a7a4d5f80706725b662a42be64c` (`preview/njh-only-map`; `?v=njh-only-map-1`, sw v27)

Plain `/mainkan/` and `/world-builder/` load the official NJH map (`city-njh-semesta-draft1-with-pending`). Reverting restores the previous default (`world.json` / leftover drafts) and the `?njhMap=1` opt-in.

If `origin/main` has been fast-forwarded to this step, revert the rollback-notes commit on top of `e9350833` first (docs only), then the feature:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit e935083362657a7a4d5f80706725b662a42be64c
# then bump sw.js if a rollback build must drop v27, and push --ff-only
```

If a docs-only rollback-notes commit sits on top of `e9350833`, revert that commit first, then `e9350833`.

---

# Rollback — Step 1 (Kost Cove lobby, NJH map, Win98 UI)

Written 2026-11-14 (Asia/Jakarta). Worker, passwords, auth secrets and vault files unchanged. No storage migration.

- Previous live `origin/main` (before this step): `53cfe59be06b567a6ad2f51c84ea0e68eb5120b8`
- Integration branch: `integ/step1` (tip will be the latest commit on this branch; revert newest first, then the merges with `-m 1`)
- Merge order (do not force-push): ours `preview/main-interiors-kost-warteg` (`0dcc793c`) → Ellen `preview/njh-gameplay-sites` (`8e099eb9`, frozen) → Layar `layar/win98-ui` (`6ffffc8e99a50839a53b9e770319056e4c3c3c65`, `?v=njh98-5`, sw v23) → Layar follow-up `a953045acbedf1096cf8765758df53b22979d0be` (`?v=njh98-6`, sw v24; merge `212c84a6`) → Layar HUD `27a820b2a8792c4bc2de945856d71dd410708925` (`?v=njh98-7`, sw v25; merge `31e74f50`; committed objects only, uncommitted `shared/genesis-player.js` was not included) → Layar follow-up 1a `51cd10f5276f1e96a5cccbda901b5fac533f63b4` (`?v=njh98-8`, sw v26; merge `9c1b2d91`; Action bar slides upward from AKSI and does not cover buttons; committed objects only, uncommitted `shared/genesis-player.js` was not included)
- Ellen park-bench scale fix `5c6de782` (`fix/njh-bangku-taman-scale`) **was included** (cherry-pick `0a11dd94`). Catalog + city instance `njh-atm-16` use plane 1.591×1.888, collision true, blocking yes, sit. `world.json` park benches had their 2.19×2.251 size overrides removed so the catalog size applies, and blocking set to yes. Cove facade `4c3dc4d` was **not** included (step 2).

If `origin/main` has been fast-forwarded to this step, revert the merge commits in reverse order (`-m 1` keeps the first parent, which is `origin/main` / the previous merge). Also revert the builder-string fix if it is still on `main`:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit -m 1 9c1b2d91   # Layar win98-ui 51cd10f (?v=njh98-8, sw v26) follow-up 1a
git revert --no-edit -m 1 31e74f50   # Layar win98-ui 27a820b (?v=njh98-7, sw v25)
git revert --no-edit -m 1 212c84a6   # Layar win98-ui a953045 (?v=njh98-6, sw v24)
git revert --no-edit 2c81b154        # builder.js playerMode / openFor(nearest.o) restore
git revert --no-edit -m 1 9e222a90   # Layar win98-ui 6ffffc8 (?v=njh98-5, sw v23)
git revert --no-edit -m 1 9dc66aeb   # Ellen map 8e099eb
git revert --no-edit -m 1 85f28c3d   # ours 0dcc793
# then bump sw.js if a rollback build must drop v26, and push --ff-only
```

Layar-only rollback (the UI commits on top of `726fde70`) is: revert `51cd10f5` first, then `27a820b2`, `a953045a`, `6ffffc8e`, `dfd8cae7`, and `8eb65938`. `51cd10f5` is follow-up 1a (Action bar slides upward from AKSI, never covers LARI/dock/joystick; `?v=njh98-8`, sw v26) and **must** be reverted with the rest. `27a820b2` is the Step 1 HUD (28px taskbar, Action icon bar, Kondisi tab, translucent icon-only AKSI/LARI; `?v=njh98-7`, sw v25) and **must** also be reverted with the rest. `a953045a` added Alat Dev only with `?dev=1`, no lone Login tab, sticky window OK row on phone, and reachable Pipis di Tembok. The earlier Win98 commits (`dd3396a2`, `2b92b91d`, `726fde70`) came in with the 6ffffc8 merge.

---

# Rollback — Mainkan Confirm network fallback ('Failed to fetch')

Written 2026-11-10 (Asia/Jakarta). Worker, passwords, auth secrets and vault files unchanged.

- Previous live `main`: `e4fcca85006373ae27005e6d3f1b882e4e5082c2`
- Fix commit: `c2761e774d42f1ca9bf4797f5a88b067dcd4da8b`
- Service worker bump: `7892deb351bf0d0f0a77a3ca6809cd9980728590`

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 7892deb351bf0d0f0a77a3ca6809cd9980728590
git revert --no-edit c2761e774d42f1ca9bf4797f5a88b067dcd4da8b
git push origin main
```

Worker v20 preflight allows only POST/OPTIONS, so the browser blocks `PUT /players/profile` ("Failed to fetch"). Confirm now treats a blocked request like a missing route and keeps the character on the device per player id. Reverting brings back the stuck Confirm.

---

# Rollback — Mainkan Confirm local-save fallback + kost recipe cooking + life motions

Written 2026-11-10 (Asia/Jakarta). Worker, passwords, auth secrets and vault files unchanged.

- Previous live `main`: `63133e4acec16e0705d96b6238054c09facbb7ca`
- Feature commit: `f797be85b32585a83b9ef64648f870fa2c0a4cb2`
- Service worker bump: `a25d26f22279bf5e9c4d7de1db4214580575d054`

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit a25d26f22279bf5e9c4d7de1db4214580575d054
git revert --no-edit f797be85b32585a83b9ef64648f870fa2c0a4cb2
git push origin main
```

What it changes: when `PUT /players/profile` answers 403/404/405/501 (test Worker v20 has no save route), Confirm stores the character on the device under `mainkan-character-v1:<player id>` (mainkan/local-character.js; character only, never credentials) and continues; login restores it. Kost panel gets "Masak Resep" (Jiwa cooking recipes, ingredients → item; sandbox demo offers the catalog's default recipes). Successful life actions play their LGR motion for 4 s. Test start profiles v2 (adds 30 electricity units so cooking works; re-applies once for t_ichsan/t_noor). Genesis player loads lgr-game-7. After rollback Confirm again needs the Worker save route.

---

# Rollback — Mainkan LGR-only player path (no V6P)

Written 2026-11-10 (Asia/Jakarta). Worker, secrets and vault files unchanged.

- Previous live `main`: `a3fecc26cc8284e1abfa5a24eb306be8e92c1442`
- Feature commit: `b473581d3a2e435bffd8360c7458af46f73f7dfc`
- Service worker bump: `02a9de487edcf596a9fb7c3317a17b7fa14e4b9b`

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 02a9de487edcf596a9fb7c3317a17b7fa14e4b9b
git revert --no-edit b473581d3a2e435bffd8360c7458af46f73f7dfc
git push origin main
```

After this change `?renderer=v6p` no longer applies on the Mainkan path (v6p-compositor.js is not loaded); rollback is the revert above.

---

# Rollback — Mainkan LGR-1 player + test start profiles

Written 2026-11-10 (Asia/Jakarta). Worker, secrets, passwords and vault files were not changed.

- Previous live `main`: `f4adb239d1d4917642408f3355698ed25fb0d1aa`
- Feature commit: `79dca8c29bc23243bec218b6fc20d8b6021b8417` (shared/genesis-player.js LGR path + pipeline lgr-game.js loader, Semesta test hooks, mainkan/test-start-profiles.json, per-player life save, cache busters)
- Service worker bump: `f50e94ee72ef39b85c02f0fad9b1baa454106da9`

Restore (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit f50e94ee72ef39b85c02f0fad9b1baa454106da9
git revert --no-edit 79dca8c29bc23243bec218b6fc20d8b6021b8417
git push origin main
```

Instant per-device switch without a revert: open any page with `?renderer=v6p` (`?renderer=lgr` switches back).
Test start profiles only: empty `profiles` in `mainkan/test-start-profiles.json`. Seeded saves are per player
(`semesta-life-play-v1:<city>@<id>` in the browser); guests keep the old key.
Pipeline side (lgr-game.js) rollback: see virtual-life-asset-pipeline ROLLBACK.md.

---

# Rollback — Retire the old Virtual Office, keep NJH apps

Written 2026-11-10 (Asia/Jakarta).

The encrypted office game front-end, office Worker login routes, seed-account HTTP access, and office WebSocket are retired. The repo root is now a simple NJH landing page. Semesta, Mainkan, Bangun Ruang, Jiwa, Membangun, and Emosi stay. The Semesta Virtual Life Assets vault (`manifest.enc`, `b/*.enc`, `world-builder/virtual-life-vault.js`) stays, because Semesta still unlocks those images in the browser. Emosi / Membangun Drive auth does not use office login or `SITE_KEY`.

Git tag `office-final` (`4de02b74da451eb6c71fa4e61c2a46538f0be8e0`) is the last tip that still had the office redirect and office Worker routes. A copy is also at `/workspace/vo-office-retire-backup/` (chmod 700): git archive, vault files, Worker source, and SQL game-state tables. Account password hashes in Durable Object `_cf_KV` could not be exported (`SQLITE_AUTH`); that data remains in the live `ROOM` namespace, which was left in place and is no longer called.

## Pages

- Previous live `main`: `4de02b74da451eb6c71fa4e61c2a46538f0be8e0` (tag `office-final`)
- Feature: commit titled "Retire the old Virtual Office front-end and replace the root with an NJH landing"

Restore the previous root redirect to Membangun (fast-forward only — do not force-push). The cleanest path is to revert this retirement commit, or to check out the `office-final` tree into a new commit on top of `main`. Do not force-push the tag.

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit "$(git log --grep='Retire the old Virtual Office front-end' -1 --format=%H)"
git push origin main
```

That does not restore deleted Worker secrets (see below) and does not change the vault files (they were never removed).

## Worker (vo-multiplayer)

- Code version that removed office routes: `fed4a95d-1c86-443c-b331-eef2e1ee1906` (version 16, 2026-11-10 21:18 Asia/Jakarta)
- Live after deleting unused secrets: `fd62482d-52c3-4cb8-99cf-e199c3e0c0bd` (version 20, deployment `83646808-2314-437f-bd91-112e346746af`, 21:18 Asia/Jakarta)
- Previous version that still had office `/login` `/register` `/char` `/ws`: `273aeb9c-91a1-4fcc-9c7c-810597e4c24a` (version 15)
- Durable Object `ROOM` namespace still `119b66c0f7e34b81bb62e403d3fc45bd` (not deleted)

Kept bindings: `TOKEN_KEY`, `MAINKAN_TEST_PW_HASH`, `MAINKAN_TEST_LOGIN=1`, and `ROOM`. Removed after grep showed no remaining app or Worker-code references: `OFFICE_PASS`, `INVITE_PASS`, `GATE_H`, `SITE_KEY`. Those secret values are not in the git backup; `OFFICE_PASS` still exists only in the private box file `/home/box/.config/vo/office_pass`. Rolling the Worker back to version 15 would restore office routes in code, but the deleted secrets would not come back.

To turn only the test login off: set `MAINKAN_TEST_LOGIN` to `0`.

---

# Rollback — Mainkan test login + vo-multiplayer /auth/login

Written 2026-11-10 (Asia/Jakarta).

Mainkan now calls `https://vo-multiplayer.lafrich.workers.dev/auth/login` with a plain player ID. Email registration is hidden. This path is gated by Worker flag `MAINKAN_TEST_LOGIN=1` and a salted password hash in secret `MAINKAN_TEST_PW_HASH`. Tokens are `aud: "mainkan"` and do not include `SITE_KEY`, so they cannot open the encrypted office world. Office `/login`, `/register`, seed accounts `ichsan`/`noorz`, and the 8-character registration rule were not changed.

## Pages (Mainkan client)

- Previous live `main`: `f74234917a70b243e3adf4184e992223f7a2e042`
- Feature: commit titled "Add Mainkan test login against vo-multiplayer /auth/login"

Restore the Mainkan client (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit "$(git log --grep='Add Mainkan test login against vo-multiplayer /auth/login' -1 --format=%H)"
git push origin main
```

That points `mainkan/config.js` `apiBase` back to empty, restores the email/register form, and does not change the Worker.

## Worker (vo-multiplayer)

- Previous live version (office-only, schema 4): `78481157-346f-41e6-bc56-27043643de66` (version 13, deployed 2026-11-01)
- Current version: `273aeb9c-91a1-4fcc-9c7c-810597e4c24a` (version 15, message: "Mainkan test login path; office auth unchanged.")
- Deployment: `5a0e2b1f-8412-4e24-83b7-6b8eebe269a9` at 2026-11-10 21:10 Asia/Jakarta
- Durable Object `ROOM` namespace stays `119b66c0f7e34b81bb62e403d3fc45bd` (do not migrate or recreate)

Turn the test login off without rolling back code (preferred):

- Set Worker plain-text binding `MAINKAN_TEST_LOGIN` to `0`. `/auth/login` then returns 404. Office `/login` is unaffected.

Full Worker rollback to the pre-test-login script (version 13). This is not a force-push; it creates a new deployment of the older version. Existing office secrets stay in place:

```bash
# Use the Cloudflare dashboard (Workers → vo-multiplayer → Deployments → rollback to version 13)
# or the API: POST /accounts/<account>/workers/scripts/vo-multiplayer/deployments
# with versions: [{ version_id: "78481157-346f-41e6-bc56-27043643de66", percentage: 100 }]
```

After a version-13 rollback, `/auth/login` no longer exists. To delete the test-login secret later: remove `MAINKAN_TEST_PW_HASH` only after the flag is off or the old version is live. Do not delete `OFFICE_PASS`, `TOKEN_KEY`, `SITE_KEY`, `GATE_H`, or `INVITE_PASS` as part of this rollback.

Worker source used for this deploy lives on the box at `/workspace/vo-mainkan-auth/` (not in this git tree). Unit tests: `node --test /workspace/vo-mainkan-auth/test_mainkan_auth.mjs`.

---

# Rollback — Emosi.exe game emotion placeholder slots

Written 2026-11-10 (Asia/Jakarta). Cloudflare Worker and secrets were not changed. Drive masters in `Membangun / Emotion Studio` were not modified. A read-only copy of the 36 existing files (18 JSON + 18 PNG) is at `Membangun / Emotion-Studio-backup-20261110-before-game-slots`.

## This deploy (Emosi game placeholder slots)

- Previous live `main`: `78dc2c332a22455f30fb231fca8814da0e28bd01`
- Feature commit: `40f129112f0fd89b7ac79dc78ccdfe3dcb9b5bb3`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 40f129112f0fd89b7ac79dc78ccdfe3dcb9b5bb3
git push origin main
```

That removes the 13 `game-*` placeholder slots from the Emosi starter catalog and the "Kebutuhan game" list grouping. It does not change Drive-authored faces (Ahe, Sleep, Takut, Insecure, O, Kiss, or the 12 saved `universal-*` projects). After revert, existing faces remain as they are.

# Rollback — Semesta hub + unused old-game cleanup

Written 2026-11-07 (Asia/Jakarta). Cloudflare Worker and secrets were not changed.

## This deploy (unused-file cleanup and launcher Mahluk Hidup labels)

- Previous live `main`: `ddc8e5b4aa734cc2f0dcdaee8b38011793dab8b1`
- Feature commit: `666b38b3d3c38c398bc0258a935097787d3d73a8`
- Service worker bump: `9d8b51c9f6df51b34f55f99e8322301184fec387`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 9d8b51c9f6df51b34f55f99e8322301184fec387
git revert --no-edit 666b38b3d3c38c398bc0258a935097787d3d73a8
git push origin main
```

That restores `world-builder/gpt-character-rig.js` (still unreferenced) and the stale launcher labels (`V6B / CHARACTER STUDIO`, `MAHLUK HIDUP 1`, `V6B CHARACTER`), and returns `sw.js` to v15. It does not revert the additive v6p activity clip consume-list, native bed side-lie frames, tent seating, spawn/respawn, or Mahluk Hidup v6p launcher URL.

## Previous deploy (additive v6p activity clip consume-list)

- Previous live `main`: `47c3105fed3ec6f7bc60c66f8f56b96af252c378`
- Feature commit: `799a0d7b4ff721eaa1f4fd56a9947ba9f5a229b3`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 799a0d7b4ff721eaa1f4fd56a9947ba9f5a229b3
git push origin main
```

That restores the previous Semesta consume-list (`idle|walk|talk|sit|lie|sleep|custom` only) and returns `sw.js` to v14. It does not revert the native bed side-lie frames, tent seating, spawn/respawn, or Mahluk Hidup launcher commits. jiwa/ pose playback is unchanged.

## Previous deploy (native side-lie frames on the bed)

- Previous live `main`: `4ee84ca1f07c69bcf8ebb3c3877531165682651b`
- Feature commit: `ebc2a4bfde582c5562daa91174436ad39f78de35`
- Service worker bump: `4308de611e0fed60efa3352e3f45b2e81cc7a4dc`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 4308de611e0fed60efa3352e3f45b2e81cc7a4dc
git revert --no-edit ebc2a4bfde582c5562daa91174436ad39f78de35
git push origin main
```

That restores the unavailable `lie` resolve (Ichsan and other 44-row V6B sheets without a `motions[].lie` entry drew the tiny head-blob silhouette on the mattress) and `sw.js` v13. It does not revert mapping elevated-bed sleep to pose `lie`, the tidy hobo tent exit, generic spawn/respawn, seated-tent ground contact, or Mahluk Hidup v6p launcher commits.

## This deploy (bed sleep uses the lie pose)

- Previous live `main`: `37d288e439685c2e68ec6b37df333015bd8fae15`
- Feature commit: `c42fdd79b61c3d04a467b2ce885af63212fa40e5`
- Service worker bump + stale sw v11 test fix: `ccd43b12af8d6fae364348369e9a7ba31b2373b3`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit ccd43b12af8d6fae364348369e9a7ba31b2373b3
git revert --no-edit c42fdd79b61c3d04a467b2ce885af63212fa40e5
git push origin main
```

That restores elevated-bed sleep to the floor `sleep` pose (characters will no longer lie on the mattress with row 36 / v2Clips.lie) and `sw.js` v12. It does not revert the tidy hobo tent exit, generic spawn/respawn, seated-tent ground contact, Mahluk Hidup v6p launcher, loak-picker, lamp-glow, sleep-clip, or grass_v2 commits.

## This deploy (tidy hobo tent exit)

- Previous live `main`: `eba74c01657bd5de3fee1850d3ddc060479700fb`
- Inside-tent character seating: `d7b5919beedbea5916a555985c02e8af9a86d442`
- Relocated default tent points: `f1d610de406841ee0c07a922671c15676cf08012`
- Hide contact shadow during exit-tent: `5fde96f91cf521af5e8b9aa342fab531053ff4f0`
- Service worker bump: `65c1983ee5c57631fd44ec2e3dfd627e067b4c91`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 65c1983ee5c57631fd44ec2e3dfd627e067b4c91
git revert --no-edit 5fde96f91cf521af5e8b9aa342fab531053ff4f0
git revert --no-edit f1d610de406841ee0c07a922671c15676cf08012
git revert --no-edit d7b5919beedbea5916a555985c02e8af9a86d442
git push origin main
```

That restores the previous tent exit (character could read as in front of the door or on the roof, the old 8-point pool with 3 invalid Kebon Sirih spots, and a contact shadow during the clip) and `sw.js` v11. It does not revert the generic spawn/respawn mechanic, seated-tent ground contact, Mahluk Hidup v6p launcher, loak-picker, lamp-glow, sleep-clip, or grass_v2 commits.

## This deploy (Mahluk Hidup launcher → v6p-studio)

- Previous live `main`: `13d95293f4d00ad93c1f63374584905b97ac0f20`
- Feature commit: `2f366da0045a56296311b96990afb7e364081ca9`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 2f366da0045a56296311b96990afb7e364081ca9
git push origin main
```

That restores the Membangun Mahluk Hidup OPEN button, program URL, and laptop launcher to the old Character Studio root / `v6b-reset-studio.html`, and returns `sw.js` to v10. It does not revert the seated hobo tent, spawn/respawn, loak-picker, lamp-glow, sleep-clip, or grass_v2 commits. jiwa/ and world-builder/ were not changed.

## This deploy (sleep clip + grass_v2)

- Previous live `main`: `66d584f4c41f7e367044fc357df2217d18d4bec5`
- Feature commit: `0bd30872af5fa69f924d429b99c9c06a7cf49bd0`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 0bd30872af5fa69f924d429b99c9c06a7cf49bd0
git push origin main
```

That restores `lie`-only clip consumption, `terrain/grass.png`, `sw.js` v6, and the previous kebon-sirih cache tag. It does not revert the earlier hub or cleanup commits. Keep `grass.png`; it was never overwritten.

## This deploy (loak picker visibility + lamp head glow)

- Previous live `main`: `912972091bbc5c8f656ea7163a40e071749fd5d9`
- Feature commit: `45f18ce52af5bceebc23e6f2fea7e70216f8e32f`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 45f18ce52af5bceebc23e6f2fea7e70216f8e32f
git push origin main
```

That restores the previous Asset Library picker (no LOAK OBJECTS / ITEMS category), the height-based lamp glow, and `sw.js` v7. It does not revert the sleep-clip or grass_v2 commits.

## This deploy (generic spawn and respawn / roadside hobo tent)

- Previous live `main`: `3175c6822e1b17972bc7c90fcec330f644fe2db7`
- Feature commit: `6f0ce8b250098ace26a9d1c50b3d107da34fa039`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit 6f0ce8b250098ace26a9d1c50b3d107da34fa039
git push origin main
```

That restores the previous Play start (no roadside tent / exit-tent clip), removes the Jiwa SPAWN & RESPAWN card and `modules.spawnRespawn`, and returns `sw.js` to v8. It does not revert the loak-picker, lamp-glow, sleep-clip, or grass_v2 commits.

## This deploy (seat hobo tent on its ground-contact row)

- Previous live `main`: `eccb9ad6c58e32c0a3b8e2da5d62f95e0218d82e`
- Feature commit: `68d024e9fb844093d27073e9b993578a93a42fa8`
- Service worker bump: `fc4a8dc22faef5b4653ccdfbc8192cb6e11708a5`

Restore this deploy (fast-forward only — do not force-push):

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit fc4a8dc22faef5b4653ccdfbc8192cb6e11708a5
git revert --no-edit 68d024e9fb844093d27073e9b993578a93a42fa8
git push origin main
```

That restores the previous tent seating (authored plot-centre pivot, tent appearing sunk into the sidewalk) and `sw.js` v9. It does not revert the generic spawn/respawn mechanic, loak-picker, lamp-glow, sleep-clip, or grass_v2 commits.





## SHAs

| Step | SHA | Subject |
| --- | --- | --- |
| Previous live `main` | `16054afc1d26d6b7720090ce4bb4b8065589e0f4` | feat: open Membangun at the site root and archive Virtual Life v15a |
| Hub release | `8d89bd8402ab14dfc97b26a1e7b736de74aa5112` | feat(hub): Semesta hub, Play HUD, and VLHub characters wiring |
| Old-game cleanup | `a477914ff287cf5a30c00e60c820c9fba528464a` | chore: remove unused Virtual Life archive playback |

Live tip after these land is the commit that added this file (parent is the cleanup SHA above).

## Undo cleanup only (restore `arsip.html` / old SW, keep the hub)

Fast-forward only — do not force-push.

```bash
git revert --no-edit a477914ff287cf5a30c00e60c820c9fba528464a
git push origin main
```

That restores archive login, `data.enc`, cancelled Package A files, staging, and the decrypting SW. Semesta vault ciphertext (`manifest.enc`, `b/*.enc`) was never deleted.

## Undo cleanup and hub (return to previous live site)

```bash
git revert --no-edit a477914ff287cf5a30c00e60c820c9fba528464a
git revert --no-edit 8d89bd8402ab14dfc97b26a1e7b736de74aa5112
git push origin main
```

Revert cleanup first, then the hub, so each revert applies cleanly. If later commits have landed on `main`, stop and rebase the reverts instead of force-pushing.

## Notes

- Visitors who already installed `sw.js` v6 will pick up a restored worker on the next navigation (`skipWaiting` + `clients.claim`).
- Shared play-hud files (`shared/vl-hud/phone_ellen.js`, `nokia-play.js`, `shell.css`, `y2k.css`, `y2k_art.json`) and `world-builder/legacy-assets/` belong to the hub commit; reverting only cleanup leaves them in place.

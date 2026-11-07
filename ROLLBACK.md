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

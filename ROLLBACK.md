# Rollback — Semesta hub + unused old-game cleanup

Written 2026-11-07 (Asia/Jakarta). Cloudflare Worker and secrets were not changed.

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

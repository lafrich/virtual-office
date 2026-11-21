# Worker CORS fix — READY, NOT DEPLOYED

Vendored onto preview `preview/njh-cp3-logic-20261122` for CP3 (22 Nov 2026, Asia/Jakarta).
This pack only prepares profile-PUT CORS (`GET, POST, PUT, OPTIONS`, allowlist echo, no localhost on production).
**Do not deploy the Worker. Do not push `main`.** Apply later with Ichsan / New Bot approval.


Do **not** apply this to live `https://vo-multiplayer.lafrich.workers.dev` until
Ichsan / the parent explicitly says to deploy. This folder is a ready pack
only. The live Worker source remains `/workspace/vo-mainkan-auth/worker.js`
(unchanged).

## Live diagnosis (probed 2026-11-22, Asia/Jakarta)

Source of truth in repo (`worker.js`):

- Hardcoded `ORIGIN = "https://lafrich.github.io"`.
- `Access-Control-Allow-Methods: POST, OPTIONS` only.
- OPTIONS from github.io returns 204, but `cors()` always sends
  `Access-Control-Allow-Origin: https://lafrich.github.io` even on a 403
  to a foreign Origin.
- After OPTIONS, any non-POST request is 404 (`if (req.method !== "POST")`).

Effects:

1. Mainkan login (`POST /auth/login`) preflight is fine.
2. Mainkan still issues `PUT /players/profile` (`mainkan/app.js`). The
   browser will block that preflight because Allow-Methods omits PUT.
3. Even after CORS is fixed, the current retired Worker has **no**
   `/players/profile` route. That 404 is a separate follow-up, not part
   of this CORS pack. Do not invent a profile API here.
4. A 403 to a hostile Origin still advertises the github.io allow-origin.
   Browsers usually ignore a mismatched ACO, but we should not echo an
   allow-origin that is not the request Origin.

Lesson 16: do **not** add `http://localhost:*` (or 127.0.0.1) to the
production allowlist. Use a throwaway local worker for local testing.

## Intended production change

See `cors-patch.diff` (against current `worker.js`). Summary:

- `ALLOWED_ORIGINS` allowlist (github.io only in production).
- `cors(reqOrigin)` echoes `Access-Control-Allow-Origin` only when the
  request Origin is on the list; otherwise omit ACO (still Vary: Origin).
- `Access-Control-Allow-Methods` includes `GET, POST, PUT, OPTIONS`.
- OPTIONS: 204 only for allowed origins; 403 without a spoofed ACO.

`test_cors_headers.mjs` is a header-level unit test of the helper
(no deploy, no secrets). Run:

    node /workspace/vo-mainkan-auth/cors-fix-ready/test_cors_headers.mjs

## How to apply later (when approved)

1. In `worker.js`, replace the hardcoded `ORIGIN` / `cors()` helper with
   the helper in `cors-helper.mjs` (or the same logic inlined).
2. Thread the request Origin into every `cors()` / `json()` call
   (`corsFor(req)`). Today `json()` and the OPTIONS branch call `cors()`
   with no request Origin, which is why 403s still advertise github.io.
3. Keep `if (origin !== ORIGIN) return json({ error: "origin" }, 403)`
   (or `!allowedOrigin(origin)`) for actual requests.
4. Adding PUT to Allow-Methods unblocks the browser preflight only.
   Wire `/players/profile` separately if/when that API is restored.
5. Deploy via the usual Worker inherit path. Do not change secrets.
6. Re-probe: github.io OPTIONS PUT → 204 with Allow-Methods containing
   PUT and ACO = github.io; evil Origin OPTIONS → 403 and no ACO.

## Live probe (current, before this pack)

Captured against `https://vo-multiplayer.lafrich.workers.dev`:

- OPTIONS Origin=github.io, Access-Control-Request-Method=POST → 204,
  Allow-Methods `POST, OPTIONS`, ACO github.io.
- OPTIONS Origin=github.io, Access-Control-Request-Method=PUT → 204
  (status is fine) but Allow-Methods still `POST, OPTIONS` only.
- OPTIONS Origin=https://evil.example → 403, but ACO still github.io.
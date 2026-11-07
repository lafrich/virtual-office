# Ellen.exe — AI project companion

Ellen lives at /ellen/ in lafrich/virtual-office. The launcher at /membangun/ and foldable Mini Laptop include Ellen. The character editor / Mahluk Hidup is intentionally untouched.

## Features in this branch

- Windows XP-style chat, mobile responsive and keyboard friendly.
- 24 read-only baseline knowledge records in knowledge.json curated from owner decisions, with PLANNED vs VERIFIED caution.
- TEACH records are owner-authored only; chat messages are not silently promoted to rules.
- Local-first chat and teaching in localStorage; export backup JSON.
- OAuth popup sign-in to Google Drive using the existing Membangun OAuth client and drive.file, openid, email scopes. Create private Membangun / Ellen / ellen-memory-v1.json. Synchronize teachings and chat with merge-by-ID, timestamps, tombstones and best-effort version conflict guard. The OAuth token is held in memory only.
- With no backend, Ellen is an offline knowledge lookup, not an LLM. It states that limitation.
- Optional Cloudflare Worker (worker.js) accepts authenticated owner chat, fetches selected read-only GitHub source documentation, and calls OpenAI Responses API with server-side credentials. It cannot commit, merge, publish, or deploy code. Coding tasks remain explicitly reviewed.

## AI Worker setup (required for generative chat)

Worker code is NOT DEPLOYED by this PR. Use your Cloudflare account and model API credential; do not put secrets in the repository, chat, Drive or browser.

From a trusted local CLI with Wrangler installed, log in to your Cloudflare account and deploy the Worker:

    npx wrangler deploy ellen/worker.js --name ellen-agent

Configure all required environment secrets in Cloudflare for this Worker:

- OPENAI_API_KEY — your API key for the OpenAI Responses API.
- OPENAI_MODEL — an actual model accessible to your account.
- GOOGLE_CLIENT_ID — existing Membangun browser OAuth client ID (public identifier, not a secret).
- ALLOWED_EMAIL — the Google account allowed to use Ellen.

From CLI use 'npx wrangler secret put VARIABLE_NAME --name ellen-agent' for each secret, or use the Cloudflare dashboard. If the Google OAuth client has not authorized https://lafrich.github.io as an origin, add it in Google Cloud OAuth configuration. Only authorized verified Google account receives access.

After deployment, navigate to Ellen → SYNC & AI and save the Worker HTTPS URL ending /chat. Google Connect is required before AI chat; otherwise local knowledge lookup works.

Worker allows POST only from https://lafrich.github.io, checks Google token and OAuth audience and the allowed account, caps input sizes, and loads selected public GitHub documentation. CORS alone is not the authentication layer. Add API/Cloudflare usage limits before wider use.

## Google Drive behavior

Frontend uses same OAuth Web Client ID as Membangun Drive. drive.file only grants access to files the Ellen client creates/opens through app. Ellen does not scan unrelated Drive files or automatically ingest all of Drive.

- Offline saves stay local until Drive Connect.
- Connect performs pull + union merge + save.
- TEACH and chat changes queue automatic sync while session remains valid.
- Delete taught memory through tombstone; seed knowledge in GitHub is never deleted through app.
- Conflict protection is best effort (read-compare-write version guard), not a transactional database. Concurrent multi-device edits still carry a race window.
- Neither OAuth token nor model API credentials are saved in Drive/localStorage. Only Worker endpoint URL is stored locally.
- Live mobile WebView OAuth compatibility and cross-device readback still need device testing; the public GitHub Pages URL alone does not prove sync worked.

## Project guardrails

Consult these sources before touching mechanics or art:

- ellen/knowledge.json
- virtual-life-asset-pipeline/AGENTS.md, STYLE.md, README.md
- virtual-office/jiwa/README.md, world-builder/MAP_SCHEMA.md
- virtual-office/ASSET_PIPELINE_INTEGRATION.md

Do not revive retired applications or duplicate ownership. Do not modify Mahluk Hidup character code while its owner is repairing it. V6B assets must come from real NumPy/Pillow generator, previewed and owner-approved.

## Tests

    node --check ellen/ellen.js
    node --check ellen/worker.js
    node --test tests/ellen-app.test.cjs

No live Worker API call, OAuth account access, GitHub write permission or device render is part of this smoke test. Test those before marking Ellen fully live.

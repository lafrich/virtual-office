import { allowedOrigin, corsHeaders, optionsResponse, ALLOWED_ORIGINS } from "./cors-helper.mjs";
import assert from "node:assert/strict";

const GH = "https://lafrich.github.io";
const EVIL = "https://evil.example";

assert.ok(!ALLOWED_ORIGINS.some((o) => /localhost|127\.0\.0\.1/i.test(o)), "no localhost on production allowlist");
assert.equal(allowedOrigin(GH), GH);
assert.equal(allowedOrigin(EVIL), null);
assert.equal(allowedOrigin(undefined), null);

const ok = corsHeaders(GH);
assert.equal(ok["Access-Control-Allow-Origin"], GH);
assert.equal(ok.Vary, "Origin");
assert.match(ok["Access-Control-Allow-Methods"], /\bPUT\b/);
assert.match(ok["Access-Control-Allow-Methods"], /\bPOST\b/);
assert.match(ok["Access-Control-Allow-Methods"], /\bGET\b/);
assert.match(ok["Access-Control-Allow-Methods"], /\bOPTIONS\b/);

const bad = corsHeaders(EVIL);
assert.equal(bad["Access-Control-Allow-Origin"], undefined);
assert.equal(bad.Vary, "Origin");

const preflightOk = optionsResponse(GH);
assert.equal(preflightOk.status, 204);
assert.equal(preflightOk.headers["Access-Control-Allow-Origin"], GH);
assert.match(preflightOk.headers["Access-Control-Allow-Methods"], /\bPUT\b/);

const preflightBad = optionsResponse(EVIL);
assert.equal(preflightBad.status, 403);
assert.equal(preflightBad.headers["Access-Control-Allow-Origin"], undefined);

console.log("cors-fix-ready tests: ok");

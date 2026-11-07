"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const swSrc=fs.readFileSync(path.join(root,"sw.js"),"utf8");

// The independent Rebuild demo and Cove addon stay retired.
assert.equal(fs.existsSync(path.join(root,"rebuild/index.html")),false);
assert.equal(fs.existsSync(path.join(root,"rebuild/game.js")),false);
assert.equal(fs.existsSync(path.join(root,"cove-reskin.js")),false);
assert.equal(fs.existsSync(path.join(root,"COVE_INTEGRATION.md")),false);
assert.ok(!swSrc.includes("cove-reskin.js"));
assert.ok(!swSrc.includes("searchParams.get('cove')"));

// Unused old-game inspector / Package A playback are gone with office.html serving.
assert.equal(fs.existsSync(path.join(root,"game-assets")),false);
assert.equal(fs.existsSync(path.join(root,"game-core")),false);
assert.equal(fs.existsSync(path.join(root,"arsip.html")),false);
assert.ok(!swSrc.includes("assetbridge"));
assert.ok(!swSrc.includes("game-assets/asset-bridge.js"));
assert.ok(!swSrc.includes("office.html"));
assert.ok(!swSrc.includes("importScripts"));
assert.ok(!swSrc.includes("onlineEnhanceHtml"));
assert.match(swSrc,/sw v11/);

const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("shared/cloud-first-trial.html","utf8");
test("Cloud trial loads the complete verified cloud stack",()=>{
 for(const filename of ["cloud-first-universal.js","cloud-first-drive.js","cloud-first-startup.js"])
  assert.ok(html.includes('src="./'+filename+'"'));
 assert.ok(html.includes('accounts.google.com/gsi/client'));
});
test("Cloud trial never mounts into or rewrites live editors",()=>{
 assert.ok(html.includes("SAFE TRIAL"));
 assert.ok(html.includes("MembangunCloudStartup.mount"));
 assert.ok(!/localStorage\s*\.|indexedDB\s*\.|deleteDatabase\s*\(/.test(html));
 assert.ok(!/window\.location\.pathname.*(world-builder|mahluk)/.test(html));
});
test("Cloud trial has explicit user-triggered test write, no automatic uploads",()=>{
 assert.ok(html.includes('id="probe" disabled'));
 assert.ok(html.includes('id="export" disabled'));
 assert.ok(html.includes('id="open" disabled'));
 assert.ok(html.includes('$("probe").onclick=async()=>'));
 assert.ok(!html.includes('setInterval('));
});

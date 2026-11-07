/* Ellen smoke tests. No credentials or network calls. */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const load=p=>fs.readFileSync(path.join(root,p),"utf8");
test("project knowledge has unique and enforceable owner rules",()=>{
 const data=JSON.parse(load("ellen/knowledge.json"));
 assert.equal(data.format,"ellen-knowledge-seed-v1");
 assert.ok(data.facts.length>=20);
 const ids=data.facts.map(f=>f.id);
 assert.equal(new Set(ids).size,ids.length);
 for(const f of data.facts){assert.ok(f.topic.length>2);assert.ok(f.text.length>25)}
 assert.ok(data.facts.some(f=>/Mahluk Hidup/.test(f.text)&&/jangan/i.test(f.text)));
 assert.ok(data.facts.some(f=>/Refresh\/Sync/.test(f.text)&&/NPC/.test(f.text)));
 assert.ok(data.facts.some(f=>/AGENTS\.md/.test(f.text)));
});
test("Ellen exists in both launcher and fold Mini Laptop",()=>{
 const launcher=load("membangun/index.html");
 const laptop=load("membangun/laptop.html");
 assert.match(launcher,/data-app="ellen"/);
 assert.match(launcher,/id="url-ellen"/);
 assert.match(launcher,/id="icon-semesta"/);
 assert.match(launcher,/ids=\['mahluk','bangun','semesta','jiwa','ellen'\]/);
 assert.match(laptop,/id:'ellen',label:'ELLEN'/);
 assert.match(laptop,/\/virtual-office\/ellen\//);
});
test("UI distinguishes local knowledge from live AI",()=>{
 const html=load("ellen/index.html"),logic=load("ellen/ellen.js");
 assert.match(html,/LOCAL KNOWLEDGE/);
 assert.match(html,/view-teach/);
 assert.match(html,/view-settings/);
 assert.match(logic,/owner-teach/);
 assert.match(logic,/ellen-memory-v1\.json/);
 assert.match(logic,/drive\.file/);
 assert.doesNotMatch(logic,/sk-[A-Za-z0-9]{20,}/);
});
test("worker requires owner auth and has no GitHub write action",()=>{
 const worker=load("ellen/worker.js");
 assert.match(worker,/ALLOWED_EMAIL/);
 assert.match(worker,/GOOGLE_CLIENT_ID/);
 assert.match(worker,/OPENAI_API_KEY/);
 assert.match(worker,/\/v1\/responses/);
 assert.match(worker,/read-only GitHub source documentation|READ-ONLY|Read-only/);
 assert.doesNotMatch(worker,/api\.github\.com\/repos\/.*\/(git\/refs|contents)\/.*method:\s*"PUT"/);
});

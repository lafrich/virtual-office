'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const js=fs.readFileSync('world-builder/legacy-objects.js','utf8');
const builder=fs.readFileSync('world-builder/builder.js','utf8');
const html=fs.readFileSync('world-builder/index.html','utf8');

test('legacy object catalog ports loak props and search spots',()=>{
 assert.match(js,/VLLegacyObjects/);
 assert.match(js,/Virtual Life Legacy/);
 assert.match(js,/"category": "props"/);
 assert.doesNotMatch(js,/"category": "items"/);
 assert.match(js,/"category": "spots"/);
 assert.match(js,/tong_sampah_besi/);
 assert.match(js,/jiwaAction/);
 assert.match(html,/legacy-objects\.js/);
 assert.match(builder,/legacy-local/);
 const props=(js.match(/"category": "props"/g)||[]).length;
 const items=(js.match(/"category": "items"/g)||[]).length;
 const spots=(js.match(/"category": "spots"/g)||[]).length;
 assert.equal(props,7);
 assert.equal(items,0);
 assert.equal(spots,7);
});

test('legacy sprites exist as plaintext local files and skip the street2 map',()=>{
 const root='world-builder/legacy-assets/virtual-life-legacy';
 assert.equal(fs.readdirSync(path.join(root,'props')).filter(f=>f.endsWith('.png')).length,7);
 assert.equal(fs.readdirSync(path.join(root,'items')).filter(f=>f.endsWith('.png')).length,48);
 assert.equal(fs.readdirSync(path.join(root,'spots')).filter(f=>f.endsWith('.png')).length,7);
 assert.ok(fs.existsSync(path.join(root,'manifest.json')));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 assert.equal(manifest.format,'semesta-asset-library-v1');
 assert.equal(manifest.counts.total,62);
 assert.doesNotMatch(js,/street2\/base\.png/);
});

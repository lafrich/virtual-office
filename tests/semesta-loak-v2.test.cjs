
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createContext,runInContext}=require('node:vm');
const G=require('../shared/gameplay-schema.js');

test('Loak Objects v2 adapter registers 122 types and 133 sprites without duplicating preserved items',()=>{
 const html=fs.readFileSync('world-builder/index.html','utf8');
 const adapter=fs.readFileSync('world-builder/loak-v2-adapter.js','utf8');
 const legacy=fs.readFileSync('world-builder/legacy-objects.js','utf8');
 assert.match(html,/loak-v2-adapter\.js/);
 assert.match(html,/shared\/loak-play\.js/);
 assert.match(adapter,/VLLoakV2/);
 assert.match(adapter,/"status": "preserved_original"/);
 assert.match(adapter,/"status": "new_review_only"/);
 assert.doesNotMatch(legacy,/"category": "items"/);
 const ctx=createContext({window:{},console});
 ctx.window=ctx;
 runInContext(adapter,ctx);
 const api=ctx.window.VLLoakV2;
 assert.equal(api.typeCount,122);
 assert.equal(api.count,133);
 assert.equal(api.preserved,37);
 assert.equal(api.added,85);
 const ids=api.types.map(t=>t.id);
 assert.equal(new Set(ids).size,122);
});

test('object/item category is registered in Asset Library and Semesta',()=>{
 const lib=fs.readFileSync('world-builder/asset-library.js','utf8');
 const builder=fs.readFileSync('world-builder/builder.js','utf8');
 assert.match(lib,/object:'OBJEK \/ ITEM'/);
 assert.match(lib,/source==='loak-v2'/);
 assert.match(builder,/source==='loak-v2'/);
 assert.match(builder,/tryLoakPickup/);
});

test('v15a sell rule is catalog x 5% x daily 0.8-1.2 with bargaining steps',()=>{
 const g=G.defaultGameplay();
 assert.equal(g.modules.loak.sellPercent,5);
 const play=fs.readFileSync('shared/loak-play.js','utf8');
 assert.match(play,/0\.8/);
 assert.match(play,/1\.2/);
 assert.match(play,/\[5,0\.85\]/);
 assert.match(play,/\[20,0\.25\]/);
 const sandbox={JiwaGameplay:G,localStorage:{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=String(v);}},Math,Date};
 sandbox.window=sandbox;
 const ctx=createContext(sandbox);
 const adapter=fs.readFileSync('world-builder/loak-v2-adapter.js','utf8');
 runInContext(adapter+'\n'+play,ctx);
 const L=sandbox.VLLoakPlay;
 const q=L.quote('botol_plastik');
 assert.ok(q);
 assert.equal(q.catalog,300);
 assert.equal(q.scale,0.05);
 assert.ok(q.mult>=0.8&&q.mult<=1.2);
 const expected=Math.max(10,Math.round((300*0.05*q.mult)/10)*10);
 assert.equal(q.unit,expected);
 const v=L.validateAnchors();
 assert.equal(v.checked,133);
 assert.equal(v.bad.length,0);
 assert.equal(v.ok,true);
});

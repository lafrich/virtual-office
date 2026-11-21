'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function identityLabel(spec){
 const m=String(spec||'').match(/'([^']+)'|"([^"]+)"/);
 return String((m&&(m[1]||m[2]))||'').trim();
}

test('sw v46 and unique CP3 cache / hub tags',()=>{
 const sw=read('sw.js');
 assert.match(sw,/^\/\* sw v46 /);
 assert.match(read('mainkan/index.html'),/\?v=njh-cp3-logic-20261122/);
 const hub=JSON.parse(read('shared/hub-version.json'));
 assert.equal(hub.build,'hub-20261122-cp3-logic');
 assert.match(read('shared/genesis-player.js'),/\?v=pakaian-v2-njh-newbot-fix-20261122/);
});

test('clock restore(src=player) holds against later non-player restores; rates unchanged',()=>{
 const src=read('world-builder/semesta-daynight.js');
 assert.match(src,/DAY_REAL_SECONDS=24\*60/);
 assert.match(src,/DEFAULT_MINUTE=7\*60/);
 assert.match(src,/if\(\[1,2,4\]\.includes\(n\)\)clock\.speed=n/);
 assert.match(src,/restore\(obj,src\)/);
 assert.match(src,/if\(src!=='player'&&playerHold\)return/);
 const window={};
 vm.runInNewContext(src,{window});
 const e=window.VLSemestaDayNight;
 assert.equal(e.DAY_REAL_SECONDS,24*60);
 assert.equal(e.DEFAULT_MINUTE,7*60);
 const c=e.makeClock({day:3,minute:14*60,speed:1});
 c.restore({day:3,minute:14*60,speed:1},'player');
 const held=c.restore({day:1,minute:e.DEFAULT_MINUTE,speed:1},'map');
 assert.equal(held.day,3);
 assert.equal(held.minute,14*60);
 const again=c.restore({day:9,minute:22*60,speed:2},'player');
 assert.equal(again.day,9);
 assert.equal(again.minute,22*60);
});

test('fish sell aliases and sell(itemId,qty,buyerId) exist; HOOKS documents them',()=>{
 const hooks=read('world-builder/semesta-life-hooks.js');
 assert.match(hooks,/function sellableFish\(buyerId\)/);
 assert.match(hooks,/function sell\(itemId,qty,buyerId\)/);
 assert.match(hooks,/sellList:sellableFish,fishSellList:sellableFish,sell/);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/sellList:hookApi\('sellableFish'/);
 assert.match(play,/fishSellList:hookApi\('sellableFish'/);
 const doc=read('docs/HOOKS-STEP2.md');
 assert.match(doc,/sellList/);
 assert.match(doc,/fishSellList/);
 assert.match(doc,/sell\(itemId, qty, buyerId\)/);
});

test('cook uses pantry (tas/kulkas/lemari) and a scene stove, not a start-seed stove',()=>{
 const econ=read('jiwa/life-economy.js');
 assert.match(econ,/const pantry=\[\.\.\.s\.inventory,\.\.\.\(s\.fridge\|\|\[\]\),\.\.\.\(s\.homeStorage\|\|\[\]\)\]/);
 assert.match(econ,/Bahan kurang di Tas, kulkas, atau lemari/);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/const stoveHere=\(\)=>\{/);
 assert.match(play,/interiorFurniture/);
 assert.doesNotMatch(play,/!ownsRoom\(\)\|\|!state\.furniture\.includes\('stove'\)/);
 assert.match(play,/button\('open_fridge'/);
 assert.match(play,/button\('open_storage'/);
 assert.doesNotMatch(play,/button\('store_fridge','🧊 Simpan Kulkas'\)/);
 assert.doesNotMatch(play,/button\('take_fridge','📦 Ambil dari Kulkas'\)/);
});

test('hold-to-work emits mainkan:work-progress {progress,label,done}',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/new CustomEvent\('mainkan:work-progress',\{detail:\{progress:pct,label:jobLabel,done:!!done\}\}\)/);
});

test('E at a door does not override other contextual actions; locked door menu is Belum buka',()=>{
 const js=read('mainkan/njh98.js');
 assert.match(js,/A nearby door must not override other contextual actions/);
 assert.match(js,/const otherActs=opts\.filter\(a=>a\.src!=='door'\)/);
 assert.match(js,/if\(doorOnly&&otherActs\.length===0&&!info\)/);
 assert.match(js,/label:cleanLabel\(doorNearObj\.closed\?'Belum buka':'Masuk'\)/);
});

test('paid actions go through confirmPaid',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/function confirmPaid\(action,args\)/);
 assert.match(play,/if\(!confirmPaid\(action,args\)\)return \{ok:false,reason:'Dibatalkan'\}/);
});

test('dermaga mancing wins the menu over Pos Hansip when both are in range',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/Dermaga mancing sits inside Hansip's radius/);
 assert.match(play,/if\(fish&&found&&found\.id==='hansip'\)return fish/);
 const hooks=read('world-builder/semesta-life-hooks.js');
 assert.match(hooks,/if\(fishing\)/);
 assert.match(hooks,/hansip/);
});

test('placeholder life NPCs get a PH plate',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/npc\.label\+\(placeholder\?' · PH':''\)/);
});

test('mushola / r7 declared paint is not baked as NJH MART',()=>{
 const runtime=read('world-builder/njh-play-interiors.js');
 assert.match(runtime,/function bakeDeclaredPaint\(side\)/);
 assert.match(runtime,/Must not reuse NJH MART branding/);
 const martBody=runtime.slice(runtime.indexOf('function bakeMartWall(side)'), runtime.indexOf('function bakeDeclaredPaint(side)'));
 const declaredBody=runtime.slice(runtime.indexOf('function bakeDeclaredPaint(side)'), runtime.indexOf('const wallMaterial='));
 assert.match(martBody,/NJH MART/);
 assert.doesNotMatch(declaredBody,/NJH MART/);
 assert.doesNotMatch(declaredBody,/SEGAR   SEMBAKO   MINUMAN/);
 const mushola=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_mushola.interior-scene.json'));
 const ident=mushola.paint.layers.find(x=>x.layer==='identity');
 assert.equal(identityLabel(ident.spec),'MUSHOLA');
 const pecel=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_pecel_lele_tenda.interior-scene.json'));
 assert.equal(identityLabel(pecel.paint.layers.find(x=>x.layer==='identity').spec),'PECEL LELE LAMONGAN');
 assert.equal(mushola.id,'njh_mushola');
});

test('profile PUT CORS pack is vendored and not a live deploy',()=>{
 const readme=read('docs/worker-cors-fix-ready/README.md');
 assert.match(readme,/NOT DEPLOYED/);
 assert.match(readme,/Do not deploy the Worker/);
 const helper=read('docs/worker-cors-fix-ready/cors-helper.mjs');
 assert.match(helper,/Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS"/);
 assert.match(helper,/Access-Control-Allow-Origin/);
});

test('Kali ripple stays unhooked and PREVIEW_REF stays main',()=>{
 const preview=read('world-builder/njh-map-preview.js');
 assert.doesNotMatch(preview,/RIPPLE\.sheet/);
 assert.match(preview,/Do not hook the 8-frame Kali ripple/);
 const assets=read('world-builder/indonesia-assets.js');
 assert.match(assets,/const PREVIEW_REF='main'/);
});

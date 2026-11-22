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
 assert.match(read('mainkan/index.html'),/\?v=njh-cp3-qa-20261122/);
 const hub=JSON.parse(read('shared/hub-version.json'));
 assert.equal(hub.build,'hub-20261122-cp3-qa');
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

test('confirmPaid only asks at >= Rp20.000 or irreversible; small pay toasts −RpX',()=>{
 const hooks=require(path.join(root,'world-builder/semesta-life-hooks.js'));
 assert.equal(hooks.CONFIRM_PAID_MIN_FALLBACK,20000);
 assert.equal(hooks.confirmPaidMin({}),20000);
 assert.equal(hooks.actionPrice('buy_room',{settings:{roomPrice:750000}},{}),750000);

 const small=hooks.paymentPolicy('eat',2000);
 assert.equal(small.confirm,false);
 assert.equal(small.toast,'\u2212Rp2.000');
 assert.equal(small.min,20000);

 const kos=hooks.paymentPolicy('buy_room',750000);
 assert.equal(kos.confirm,true);
 assert.equal(kos.toast,null);
 assert.equal(kos.irreversible,true);

 const irr=hooks.paymentPolicy('buy_furniture',0);
 assert.equal(irr.confirm,true);
 assert.equal(irr.irreversible,true);
 const irrCheap=hooks.paymentPolicy('buy_fridge',1000,{min:20000});
 assert.equal(irrCheap.confirm,true);

 const raised=hooks.paymentPolicy('coffee',5000,{min:3000});
 assert.equal(raised.confirm,true);
 assert.equal(raised.toast,null);
 const lowered=hooks.paymentPolicy('buy_token',20000,{min:50000});
 assert.equal(lowered.confirm,false);
 assert.equal(lowered.toast,'\u2212Rp20.000');
 assert.equal(hooks.confirmPaidMin({NJHBalancing:{num:k=>k==='ui.confirmPaidMin'?10000:undefined}}),10000);
 assert.equal(hooks.confirmPaidMin({NJH_BALANCING:{get:k=>k==='ui.confirmPaidMin'?50000:undefined}}),50000);
 assert.equal(hooks.confirmPaidMin({NJH_BALANCING:{ui:{confirmPaidMin:15000}}}),15000);

 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/function confirmPaid\(action,args\)/);
 assert.match(play,/function spendToast\(action,args\)/);
 assert.match(play,/H\.paymentPolicy\(action,pay,\{root\}\)/);
 assert.match(play,/if\(!policy\.confirm\)return true;/);
 assert.match(play,/const spend=spendToast\(action,args\);/);
 assert.match(play,/if\(!confirmPaid\(action,args\)\)return \{ok:false,reason:'Dibatalkan'\}/);
 assert.equal(fs.existsSync(path.join(root,'content/balancing.json')),false);
 assert.equal(fs.existsSync(path.join(root,'shared/njh-balancing.js')),false);
 const guide=read('docs/NJH-CP3-LOGIC-PREVIEW-TEST-GUIDE.md');
 assert.match(guide,/ui\.confirmPaidMin: 20000/);
 assert.match(guide,/content\/balancing\.json/);
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

test('confirmPaid runs only after requirements pass',()=>{
 const E=require(path.join(root,'jiwa/life-economy.js'));
 const cfg=E.normalize(E.defaults());
 const poor=E.stateFrom({wallet:6000,energy:80,hygiene:75,bladder:20,moral:50,experience:0},cfg);
 const wallet=poor.wallet;
 const kos=E.precheck(cfg,poor,'buy_room',{});
 assert.equal(kos.ok,false);
 assert.match(String(kos.reason),/Uang tidak cukup/);
 assert.equal(poor.wallet,wallet);
 const token=E.precheck(cfg,poor,'topup_token',{units:5});
 assert.equal(token.ok,false);
 assert.match(String(token.reason),/Perlu kost dahulu/);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/function actionBlocked\(action,args\)/);
 assert.match(play,/function rejectBlocked\(action,args\)/);
 const tok=play.slice(play.indexOf("action==='buy_token'||action==='topup_token'"));
 const tokHead=tok.slice(0,tok.indexOf('topupToken'));
 assert.match(tokHead,/rejectBlocked\(action,args\)/);
 assert.ok(tokHead.indexOf('rejectBlocked')<tokHead.indexOf('confirmPaid'),'token: requirements before confirm');
 const run=play.slice(play.indexOf("placeReligion:node.religion"));
 const runHead=run.slice(0,run.indexOf('const prior='));
 assert.match(runHead,/rejectBlocked\(action,args\)/);
 assert.ok(runHead.indexOf('rejectBlocked')<runHead.indexOf('confirmPaid'),'runAction: requirements before confirm');
});

test('AKSI button does not double Masuk — Masuk',()=>{
 const js=read('mainkan/njh98.js');
 assert.match(js,/cleanLabel\(a\.hint\)!==cleanLabel\(a\.label\)/);
 assert.doesNotMatch(js,/const tip=a\.label\+\(a\.hint\?\(' — '\+a\.hint\):''\)/);
});

test('Kulkas/Lemari buttons are gated by furnOk only (no ||true)',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.doesNotMatch(play,/furnOk\('open_fridge'\)\|\|true/);
 assert.doesNotMatch(play,/furnOk\('open_storage'\)\|\|true/);
 assert.match(play,/\.\.\.\(furnOk\('open_fridge'\)\?\[button\('open_fridge'/);
 assert.match(play,/\.\.\.\(furnOk\('open_storage'\)\?\[button\('open_storage'/);
});

test('−RpX toast is posted to the Mainkan HUD, on top, and lasts 4.5s',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/CustomEvent\('mainkan:toast',\{detail:\{text:statusText\}\}\)/);
 assert.match(play,/postMessage\(\{type:'mainkan:toast',text:statusText\},'\*'\)/);
 const js=read('mainkan/njh98.js');
 assert.match(js,/addEventListener\('message',onLifeToast\)/);
 assert.match(js,/addEventListener\('mainkan:toast'/);
 assert.match(js,/setTimeout\(\(\)=>\{t\.hidden=true;\},4500\)/);
 const css=read('mainkan/njh98.css');
 assert.match(css,/\.njh-toast\{[^}]*position:fixed/);
 assert.match(css,/\.njh-toast\{[^}]*z-index:80/);
});

test('visual clock persists every 3s and on visibilitychange/pagehide',()=>{
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/function armClockPersist\(/);
 assert.match(play,/addEventListener\('visibilitychange'/);
 assert.match(play,/addEventListener\('pagehide'/);
 assert.match(play,/setInterval\(\(\)=>\{try\{if\(active\)persist\(\);\}catch\{\}\},3000\)/);
 assert.match(play,/restore\(\);applyVisualClock\(\);armClockPersist\(\);/);
 assert.match(play,/persist\(\);disarmClockPersist\(\);/);
});

test('saved tee_v4 / trousers_v4 map to the live tee / trousers (pipeline c9dc88f)',()=>{
 const gen=read('shared/genesis-player.js');
 assert.match(gen,/c9dc88f/);
 assert.match(gen,/LIVE_WEAR_ALIAS=Object\.freeze\(\{tee_v4:"tee",trousers_v4:"trousers"\}\)/);
 assert.match(gen,/function liveWear\(value\)\{return LIVE_WEAR_ALIAS\[value\]\|\|value;\}/);
 assert.match(gen,/a\.topStyle=liveWear\(a\.topStyle\);a\.pantsStyle=liveWear\(a\.pantsStyle\);/);
 const window={};
 // alias table only — full normalizeProfile needs Genesis assets
 assert.match(gen,/const value=liveWear\(input\.appearance\?\.\[key\]\|\|defaults\[key\]\)/);
});

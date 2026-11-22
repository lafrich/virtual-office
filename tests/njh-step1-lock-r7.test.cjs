'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const VO=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(VO,rel),'utf8');
const R7=['njh_mushola','njh_koperasi','njh_toko_loak','njh_warung_madura','njh_nasi_sunda','njh_pecel_lele_tenda','njh_sate_madura_tenda'];
const LOCK=['njh_warung_kopi'];
const STILL_READY=['njh_laundry','njh_bengkel','njh_wc_mandi_umum','njh_rumah_biasa','njh_warung_makan','njh_minimarket','njh_kos'];

function loadPreview(){
 const src=read('world-builder/njh-map-preview.js');
 const window={
  VLAssetCatalog:[],
  location:{search:'?njhMap=1',href:'http://127.0.0.1/world-builder/?njhMap=1'},
  document:{getElementsByTagName:()=>[{src:'http://127.0.0.1/world-builder/njh-map-preview.js'}]}
 };
 vm.createContext; // keep vm imported
 const context=vm.createContext({window,globalThis:window,URLSearchParams,Object,Math,Number,Array,JSON,Error,Map,Set,console});
 vm.runInContext(src,context,{filename:'njh-map-preview.js'});
 return window.VLNjhMapPreview;
}

test('STEP 2 tags are sw v46 with a unique cache/hub; LGR ?v is kept',()=>{
 assert.match(read('sw.js'),/^\/\* sw v46 /);
 assert.match(read('sw.js'),/STEP 2/);
 assert.match(read('mainkan/index.html'),/\?v=njh-cp3-qa-20261122/);
 const hub=JSON.parse(read('shared/hub-version.json'));
 assert.equal(hub.build,'hub-20261122-cp3-qa');
 assert.match(read('shared/genesis-player.js'),/\?v=pakaian-v2-njh-newbot-fix-20261122/);
 assert.match(read('world-builder/indonesia-assets.js'),/const PREVIEW_REF='main'/);
});

test('the 7 r7 interiors are READY; only Warung Kopi stays pending',()=>{
 const P=loadPreview();
 for(const id of LOCK){
  assert.ok(P.pendingTemplates.includes(id),id+' pending');
  assert.ok(!P.readyTemplates.includes(id),id+' not ready');
 }
 for(const id of STILL_READY){
  assert.ok(P.readyTemplates.includes(id),id+' stays ready');
  assert.ok(!P.pendingTemplates.includes(id),id+' not pending');
 }
 const meta=JSON.parse(read('world-builder/njh-map-preview/njh-map-meta.json'));
 const pendingDoors=meta.doors.filter(d=>LOCK.includes(d.interiorTemplate));
 assert.equal(pendingDoors.length,1);
 for(const d of pendingDoors)assert.equal(d.interiorPending,true,d.doorId);
 for(const id of R7){
  assert.ok(P.readyTemplates.includes(id),id+' r7 ready');
  assert.ok(!P.pendingTemplates.includes(id),id+' r7 not pending');
  const door=meta.doors.find(d=>d.interiorTemplate===id);
  assert.equal(door.interiorPending,false,door.doorId);
 }
 const play=read('world-builder/njh-play-interiors.js');
 const pub=play.match(/const PUBLIC_SCENES=\[([^\]]*)\]/)[1];
 for(const id of R7)assert.ok(pub.includes("'"+id+"'"),id+' is fetched as a public play scene');
 assert.ok(!pub.includes("'njh_warung_kopi'"),'kopi is not fetched as a public play scene');
});

test('locked official doors are closed in isClosedDoor and enterables (tooltip Belum buka)',()=>{
 const P=loadPreview();
 const mushola={id:'njh-mushola',name:'Mushola Kampung',x:-16.25,z:23.8,enterable:true,
  njhInteriorTemplate:'njh_mushola',njhInteriorPending:true,interior:null,
  njhDoors:[{doorId:'njh_door_mushola',template:'njh_mushola',pending:true,interior:null,usePoint:[-16.25,26.6]}]};
 assert.equal(P.isClosedDoor(mushola),true);
 const kopi={id:'njh-warung-kopi',name:'Warung Kopi Pojok Gang',x:-38.5,z:51.5,enterable:true,
  njhInteriorTemplate:'njh_warung_kopi',njhInteriorPending:true,interior:null,
  interactions:['enter'],
  njhDoors:[{doorId:'njh_door_warung_kopi',template:'njh_warung_kopi',pending:true,interior:null}]};
 assert.equal(P.isClosedDoor(kopi),true);
 const hooks=read('world-builder/semesta-life-hooks.js');
 assert.match(hooks,/wantsEnter&&!ready/);
 assert.match(hooks,/const closed=!!\(/);
 const hud=read('mainkan/njh98.js');
 assert.match(hud,/const doorHint=best\.closed\?'Belum buka':'Masuk'/);
 assert.match(hud,/closed:!!d\.closed/);
});

test('guest / creator default is a tee, including reset and normalizeProfile',()=>{
 const html=read('mainkan/index.html');
 assert.match(html,/classic-creator\.js\?v=njh-cp3-qa-20261122/);
 assert.match(html,/<option value="tee" selected>T-shirt/);
 assert.match(html,/<option value="trousers" selected>Trousers/);
 assert.doesNotMatch(html,/<select id="topStyle"><option value="nude" selected>/);
 const gen=read('shared/genesis-player.js');
 assert.match(gen,/topStyle:"tee"/);
 assert.match(gen,/pantsStyle:"trousers"/);
 assert.match(read('mainkan/classic-creator.js'),/topStyle:'tee'/);
});

test('Kali ripple stays unhooked',()=>{
 const preview=read('world-builder/njh-map-preview.js');
 assert.doesNotMatch(preview,/RIPPLE\.sheet/);
 assert.match(preview,/Do not hook the 8-frame Kali ripple/);
});

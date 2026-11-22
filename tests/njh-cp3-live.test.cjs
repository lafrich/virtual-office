'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('ui.confirmPaidMin is 20000 in balancing.json and is read through the loader',()=>{
 const B=require(path.join(root,'shared/njh-balancing.js'));
 assert.equal(B.ok(),true);
 assert.equal(B.num('ui.confirmPaidMin'),20000);
 assert.equal(B.value('ui.confirmPaidMin'),20000);
 const hooks=require(path.join(root,'world-builder/semesta-life-hooks.js'));
 assert.equal(hooks.confirmPaidMin({NJHBalancing:B}),20000);
 const policy=hooks.paymentPolicy('eat',12000,{root:{NJHBalancing:B}});
 assert.equal(policy.confirm,false);
 assert.match(String(policy.toast),/12.000/);
 const kos=hooks.paymentPolicy('buy_room',750000,{root:{NJHBalancing:B}});
 assert.equal(kos.confirm,true);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/function confirmPaid\(action,args\)/);
 assert.match(play,/H\.paymentPolicy\(action,pay,\{\s*root\}/);
});

test('?fresh=1 new players spawn at the hobo tent; non-fresh guests stay on the plaza',()=>{
 const wb=path.join(root,'world-builder');
 function loadPreview(search,extra){
  const window=Object.assign({
   VLAssetCatalog:[],
   location:{search,href:'http://127.0.0.1:8802/world-builder/'+search},
   document:{getElementsByTagName:()=>[{src:'http://127.0.0.1:8802/world-builder/njh-map-preview.js'}]}
  },extra||{});
  const context=vm.createContext({window,globalThis:window,URLSearchParams,Object,Math,Number,Array,JSON,Error,Map,Set});
  vm.runInContext(fs.readFileSync(path.join(wb,'njh-map-preview.js'),'utf8'),context,{filename:'njh-map-preview.js'});
  return {window,api:window.VLNjhMapPreview};
 }
 const meta=JSON.parse(fs.readFileSync(path.join(wb,'njh-map-preview/njh-map-meta.json'),'utf8'));
 const fresh=loadPreview('?njhMap=1&fresh=1');
 const tent=fresh.api.resolveSpawn('guest',meta);
 assert.equal(tent.ok,true);
 assert.equal(tent.kind,'tent');
 assert.equal(tent.reason,'njh-fresh-tent');
 assert.equal(tent.point.x,-51.5);
 assert.equal(tent.point.z,64.5);
 assert.equal(tent.point.id,'njh-tenda-hobo');
 // homes still win over the tent, even with fresh=1
 const ichsan=fresh.api.resolveSpawn('t_ichsan',meta);
 assert.equal(ichsan.kind,'home');
 // existing / non-fresh guests keep the plaza pool
 const plaza=loadPreview('?njhMap=1');
 const g1=plaza.api.resolveSpawn('guest1',meta);
 assert.equal(g1.kind,'plaza');
 assert.equal(g1.point.id,'njh_spawn_3');
 const unknown=plaza.api.resolveSpawn('',meta);
 assert.equal(unknown.kind,'plaza');
 assert.equal(unknown.point.id,'njh_spawn_1');
 // NJH_FRESH_MODE flag also counts as fresh
 const flagged=loadPreview('?njhMap=1',{NJH_FRESH_MODE:true});
 const t2=flagged.api.resolveSpawn('guest2',meta);
 assert.equal(t2.kind,'tent');
 assert.equal(t2.point.x,-51.5);
 assert.equal(t2.point.z,64.5);
});

test('Laundry waiting_bench uses wooden_bench art (visible sit bench, not the I4 divider)',()=>{
 const view=require(path.join(root,'world-builder/semesta-interior-view.js'));
 assert.equal(view.ART_ALIAS.waiting_bench,'wooden_bench');
 assert.equal(view.artId('waiting_bench'),'wooden_bench');
 const catalog=JSON.parse(read('world-builder/njh-play-interiors/catalog.json'));
 const typ=catalog.items.wooden_bench;
 assert.ok(typ&&typ.se&&typ.sw&&typ.ne&&typ.nw,'wooden_bench has 4 views');
 for(const dir of ['se','sw','ne','nw']){
  const file=typ[dir].file;
  const disk=path.join(root,'world-builder/njh-play-interiors',file.startsWith('art/')?file:'art/'+file);
  assert.equal(fs.existsSync(disk),true,'missing '+disk);
  assert.ok(fs.statSync(disk).size>800,'bench file too small: '+file);
 }
 const laundry=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_laundry.interior-scene.json'));
 assert.ok(laundry.items.some(i=>i.assetId==='waiting_bench'));
});

test('Parkir work pays the balancing wage only (no +Rp500 luck tip)',()=>{
 const Life=require(path.join(root,'jiwa/life-economy.js'));
 const B=require(path.join(root,'shared/njh-balancing.js'));
 const cfg=Life.normalize(B.applyToLifeConfig({...Life.defaults()}));
 const job=cfg.jobs.find(j=>j.id==='kang_parkir');
 assert.equal(job.wage,5000);
 const start=15000;
 const st=Life.stateFrom({wallet:start,energy:80,hygiene:80,elapsedMinutes:500},cfg);
 const r=Life.run(cfg,st,'work',{jobId:'kang_parkir'});
 assert.equal(r.ok,true);
 assert.equal(r.state.wallet,start+5000);
 assert.equal(r.state.wallet-start,job.wage);
 assert.ok(!r.changes.some(c=>/rezeki tak terduga/.test(c)));
 // A forced lucky roll on its own still works, but work must not chain it.
 const luck=Life.run(cfg,r.state,'luck_find',{roll:0});
 assert.equal(luck.ok,true);
 assert.ok(luck.changes.some(c=>/rezeki tak terduga \+Rp500/.test(c)));
 assert.equal(luck.state.wallet,start+5000+500);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/if\(\['fish','scavenge','catch_fruit'\]\.includes\(action\)/);
 assert.doesNotMatch(play,/if\(\['fish','work','scavenge','catch_fruit'\]/);
 // Desktop and mobile share the same runAction/finishWorkHold path.
 assert.match(play,/if\(jobId\)runAction\('work',\{jobId\}\)/);
});

test('Interior art is lazy-loaded per room, not at boot',()=>{
 const src=read('world-builder/njh-play-interiors.js');
 assert.match(src,/lazy:true/);
 assert.match(src,/function filesForScene/);
 assert.match(src,/function enterWhenReady/);
 assert.match(src,/function ensureRoomReady/);
 assert.doesNotMatch(src,/for\(const typ of Object\.values\(items\)\)\{\s*for\(const view of Object\.values\(typ\|\|\{\}\)\)if\(view\?\.file\)files\.add/);
 const Interiors=require(path.join(root,'world-builder/njh-play-interiors.js'));
 const catalog=JSON.parse(read('world-builder/njh-play-interiors/catalog.json'));
 const laundry=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_laundry.interior-scene.json'));
 const scene={name:'world',children:[],add(){},remove(){}};
 const api=Interiors.create({THREE:{Group:class{},Mesh:class{},PlaneGeometry:class{},BoxGeometry:class{},MeshBasicMaterial:class{},Texture:class{},DoubleSide:2,NearestFilter:1,SRGBColorSpace:'srgb'},scene,catalog,scenes:{}});
 const files=api.filesForScene(laundry);
 assert.ok(files.length>0&&files.length<40,'laundry should load only its own views, got '+files.length);
 assert.ok(files.some(f=>/wooden_bench|waiting_bench/.test(f)),'laundry art includes the bench');
 assert.ok(files.some(f=>/washing_machine/.test(f)));
 assert.ok(!files.some(f=>/prayer_mat|wudhu_tap|sajadah/.test(f)),'laundry must not pull mushola art');
 const world={objects:[{id:'njh-laundry',type:'sprite',name:'Laundry',njhInteriorTemplate:'njh_laundry',x:0,z:0,d:3}]};
 // Official warteg template stays even when no scene is preloaded (no fallback regression).
 const city={objects:[{id:'njh-warteg',type:'sprite',name:'Warteg Kharisma',njhInteriorTemplate:'njh_warteg_kharisma',x:0,z:0,d:3}]};
 const buildings=api.wireWorld(city);
 // warteg may be discovered by name; kost is auto-ensured. Just assert loadAssets is lazy.
 const out=api.loadAssets();
 assert.equal(typeof out.then,'function');
 return out.then(r=>{
  assert.equal(r.lazy,true);
  assert.equal(r.ready,0);
  assert.equal(Object.keys(r.scenes||{}).length,0);
 });
});

test('Player-mode city load does not prefetch READY interiors; doors stay open without scene JSON',()=>{
 const src=read('world-builder/njh-map-preview.js');
 assert.match(src,/player\?Promise\.resolve\(\{\}\):loadInteriors\(\)/);
 const previewArt=read('world-builder/bangun-ruang/njh-interior-art-preview.js');
 assert.match(previewArt,/function isPlayerMode/);
 assert.match(previewArt,/function isAuthoringPreview/);
 assert.match(previewArt,/isAuthoringPreview\(\)/);
 assert.match(previewArt,/if\(!isAuthoringPreview\(\)\)return true;/);
 assert.match(previewArt,/typeof document!=='undefined'&&isAuthoringPreview\(\)/);
 const wb=path.join(root,'world-builder');
 const window={
  VLAssetCatalog:[],
  location:{search:'?njhMap=1&player=1',href:'http://127.0.0.1:8802/world-builder/?njhMap=1&player=1'},
  document:{getElementsByTagName:()=>[{src:'http://127.0.0.1:8802/world-builder/njh-map-preview.js'}]}
 };
 const context=vm.createContext({window,globalThis:window,URLSearchParams,Object,Math,Number,Array,JSON,Error,Map,Set});
 vm.runInContext(fs.readFileSync(path.join(wb,'njh-map-preview.js'),'utf8'),context,{filename:'njh-map-preview.js'});
 const api=window.VLNjhMapPreview;
 const document={objects:[{id:'njh-laundry',x:0,z:0,name:'Laundry'}]};
 const meta={doors:[{doorId:'laundry-door',objectId:'njh-laundry',label:'Laundry',interiorTemplate:'njh_laundry',usePoint:[-1,1],doorPoint:[0,0],facing:'sw'}]};
 const report=api.wireDoors(document,meta,{});
 assert.ok(report.wired.some(r=>r.template==='njh_laundry'));
 assert.equal(report.pending.length,0);
 const obj=document.objects[0];
 assert.equal(obj.njhInteriorPending,false);
 assert.equal(api.isClosedDoor(obj),false);
 const warkop={objects:[{id:'njh-warkop',x:1,z:1,name:'Warkop'}]};
 const pendingMeta={doors:[{doorId:'warkop-door',objectId:'njh-warkop',label:'Warkop',interiorTemplate:'njh_warung_kopi',usePoint:[1,1],facing:'sw'}]};
 const pending=api.wireDoors(warkop,pendingMeta,{});
 assert.ok(pending.pending.some(r=>r.template==='njh_warung_kopi'));
 assert.equal(warkop.objects[0].njhInteriorPending,true);
 assert.equal(api.isClosedDoor(warkop.objects[0]),true);
});

'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=path.join(__dirname,'..');
const Interiors=require(path.join(R,'world-builder/njh-play-interiors.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));

const DIR=path.join(R,'world-builder/njh-play-interiors');
const catalog=JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8'));
const kos=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos.interior-scene.json'),'utf8'));
const warteg=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warung_makan.interior-scene.json'),'utf8'));
const kharisma=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warteg_kharisma.interior-scene.json'),'utf8'));

function THREE(){
 class Vec{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
 class Object3D{
  constructor(){this.children=[];this.parent=null;this.name='';this.visible=true;this.position=new Vec();this.rotation=new Vec();this.userData={};}
  add(ch){this.children.push(ch);ch.parent=this;return this;}
  remove(ch){this.children=this.children.filter(c=>c!==ch);if(ch.parent===this)ch.parent=null;return this;}
  traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}
 }
 class Mesh extends Object3D{constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
 class Group extends Object3D{}
 class PlaneGeometry{constructor(){this.type='PlaneGeometry';}dispose(){this.disposed=true;}}
 class MeshBasicMaterial{constructor(opts){Object.assign(this,opts||{});}dispose(){this.disposed=true;}}
 class Texture{constructor(){this.needsUpdate=false;}dispose(){this.disposed=true;}}
 return {Group,Mesh,PlaneGeometry,MeshBasicMaterial,Texture,DoubleSide:2,NearestFilter:1003,SRGBColorSpace:'srgb'};
}

function kit(opts={}){
 const T=THREE();
 const scene=new T.Group();scene.name='world';
 const world={objects:opts.objects||[
  {id:'warteg-front',type:'sprite',asset:'pipeline:warung_madura',name:'Warung Madura',x:31.8,z:25,d:3}
 ]};
 const roots=new Map();
 let state=opts.state||Life.stateFrom({
  wallet:20000,energy:80,hygiene:75,bladder:20,fullness:50,moral:50,
  furniture:['bed','chair','stove','wardrobe'],housing:{room:opts.room!==false,fridge:true}
 },Life.defaults());
 let pos=opts.pos||{x:31.8,y:0,z:27.4};
 const persisted=[];
 const api=Interiors.create({
  THREE:T,scene,catalog,scenes:{njh_kos:kos,njh_warung_makan:warteg},
  getWorld:()=>world,getState:()=>state,persist:()=>persisted.push(JSON.parse(JSON.stringify(state.interior||null))),
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  message:()=>{},playerObjectId:()=>'player',
  getRoots:()=>[...roots.entries()].map(([id,root])=>({id,root})),
  onAddObject:o=>{const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);}
 });
 for(const o of world.objects){
  const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);
 }
 api.wireWorld(world);
 const kost=api.findBuilding('kost',world);
 if(kost&&!roots.has(kost.id))api; // ensureKost already called onAddObject
 return {api,T,scene,world,roots,get state(){return state;},set state(v){state=v;},get pos(){return pos;},
  set pos(v){pos=v;},persisted};
}

test('preview wires Ellen kost and Kharisma warteg; Ellen warung remains fallback',()=>{
 assert.equal(Interiors.TEMPLATES.kost,'njh_kos');
 assert.equal(Interiors.TEMPLATES.warteg,'njh_warteg_kharisma');
 assert.equal(Interiors.FALLBACK.warteg,'njh_warung_makan');
 assert.equal(kos.width,8);assert.equal(kos.depth,6);assert.equal(kos.entrance.c,4);assert.equal(kos.entrance.r,5);
 assert.equal(warteg.width,8);assert.equal(warteg.depth,6);
 assert.deepEqual(kos.items.map(i=>i.assetId),[
  'bed','wardrobe','stove','fridge','shower','squat_toilet','sink','chair','dining_table']);
 assert.deepEqual(warteg.items.map(i=>i.assetId),[
  'stove','noodle_pot','kitchen_sink','dish_rack','fridge','coffee_machine','water_dispenser',
  'wooden_bench','dining_table','food_vitrine','cashier','dining_table','chair']);
 assert.equal(kos.items.length,9);
 assert.equal(warteg.items.length,13);
 assert.equal(kharisma.name,'Warteg Kharisma Bahari');
 assert.equal(kharisma.width,8);assert.equal(kharisma.depth,6);
 assert.equal(kharisma.entrance.c,3);assert.equal(kharisma.entrance.r,5);
 assert.equal(kharisma.items.length,14);
 const artDir=path.join(DIR,'art');
 assert.ok(fs.statSync(artDir).isDirectory());
 assert.ok(fs.readdirSync(artDir).filter(f=>f.endsWith('.png')).length>=17);
 assert.ok(Object.keys(catalog.items).includes('bed'));
 assert.ok(Object.keys(catalog.items).includes('food_vitrine'));
});

test('index.html loads play interiors before the world builder module',()=>{
 const html=fs.readFileSync(path.join(R,'world-builder/index.html'),'utf8');
 const interiors=html.indexOf('njh-play-interiors.js');
 const builder=html.indexOf('src="./builder.js');
 assert.ok(interiors>0);assert.ok(builder>interiors);
});

test('ensureKost injects a play-only rumah_kampung_a without replacing an existing kost',()=>{
 const empty={objects:[{id:'warteg-front',type:'sprite',asset:'pipeline:warung_madura',name:'Warung Madura',x:31.8,z:25}]};
 const a=Interiors.create({});
 const added=a.ensureKost(empty);
 assert.equal(added.id,'__njh_play_kost__');
 assert.equal(added.asset,'pipeline:rumah_kampung_a');
 assert.equal(added.name,'Kost');
 assert.equal(added.playOnly,true);
 assert.equal(empty.objects.filter(o=>o.id==='__njh_play_kost__').length,1);
 const already={objects:[{id:'city-kost',type:'sprite',name:'Kost Cove',x:10,z:10}]};
 const keep=a.ensureKost(already);
 assert.equal(keep.id,'city-kost');
 assert.equal(already.objects.some(o=>o.id==='__njh_play_kost__'),false);
 assert.equal(a.isPlayObject('__njh_play_kost__'),true);
});

test('owner can enter kost, guest cannot; warteg is open; enter/exit and save restore',()=>{
 const owned=kit({room:true,pos:{x:16.5,z:26.4}});
 const kost=owned.api.findBuilding('kost',owned.world);
 const wartegB=owned.api.findBuilding('warteg',owned.world);
 assert.ok(kost);assert.ok(wartegB);
 assert.equal(owned.api.canEnter('kost').ok,true);
 owned.pos={x:kost.njhUsePoint.x,z:kost.njhUsePoint.z};
 const inn=owned.api.enterNearby();
 assert.equal(inn.ok,true);assert.equal(inn.kind,'kost');
 assert.equal(owned.api.kind(),'kost');
 assert.equal(owned.state.interior.kind,'kost');
 assert.equal(owned.api.active().furniture.length,kos.items.length);
 assert.equal(owned.api.furniture().length,3);
 assert.ok(owned.api.furniture().some(f=>f.kind==='bed'));
 assert.ok(owned.api.furniture().some(f=>f.kind==='bathroom'),'shower maps to bathroom for Mandi');
 assert.ok(owned.api.furniture().some(f=>f.kind==='stove'));
 const door=owned.api.active().door;
 assert.equal(owned.pos.x,door.x);assert.equal(owned.pos.z,door.z);
 const clamped=owned.api.constrain({x:door.x,z:door.z},{x:door.x+80,z:door.z-80});
 const room=owned.api.active();
 assert.ok(clamped.x<=room.origin.x+room.width-0.35);
 assert.ok(clamped.z>=room.origin.z+0.35);
 const out=owned.api.exit();
 assert.equal(out.ok,true);assert.equal(owned.api.kind(),null);assert.equal(owned.state.interior,undefined);

 const guest=kit({room:false,pos:{x:kost.njhUsePoint.x,z:kost.njhUsePoint.z}});
 const gk=guest.api.findBuilding('kost',guest.world);
 guest.pos={x:gk.njhUsePoint.x,z:gk.njhUsePoint.z};
 const denied=guest.api.enterNearby();
 assert.equal(denied.ok,false);
 assert.match(String(denied.reason),/akses|milik|beli/i);

 const shop=kit({room:true});
 const w=shop.api.findBuilding('warteg',shop.world);
 shop.pos={x:w.njhUsePoint.x,z:w.njhUsePoint.z};
 assert.equal(shop.api.enterNearby().ok,true);
 assert.equal(shop.api.kind(),'warteg');
 shop.state.interior={kind:'warteg',exit:{x:31.8,z:27}};
 shop.api.exit();
 shop.state.interior={kind:'warteg',exit:{x:31.8,z:27}};
 const restored=shop.api.restoreIfNeeded();
 assert.equal(restored.ok,true);assert.equal(shop.api.kind(),'warteg');
});

test('warteg extra action is Makan at Rp12.000; eat spends that price',()=>{
 const shop=kit({room:true});
 const w=shop.api.findBuilding('warteg',shop.world);
 shop.pos={x:w.njhUsePoint.x,z:w.njhUsePoint.z};
 assert.equal(shop.api.enterNearby().ok,true);
 const table=shop.api.active().furniture.find(f=>f.assetId==='dining_table'||f.assetId==='food_vitrine'||f.assetId==='cashier');
 assert.ok(table);
 shop.pos={x:table.x,z:table.z};
 const extras=shop.api.extraActions();
 const meal=extras.find(a=>a.id==='eat');
 assert.ok(meal);assert.equal(meal.price,12000);assert.equal(meal.args.price,12000);
 assert.match(meal.label,/Makan/i);

 const cfg=Life.defaults();
 const cheap=Life.stateFrom({wallet:10000,fullness:20},cfg);
 const paid=Life.run(cfg,cheap,'eat',{price:12000});
 assert.equal(paid.ok,false,'Rp10.000 cannot cover a Rp12.000 meal');
 const rich=Life.stateFrom({wallet:20000,fullness:20},cfg);
 const ok=Life.run(cfg,rich,'eat',{price:12000});
 assert.equal(ok.ok,true);
 assert.equal(ok.state.wallet,8000);
 const street=Life.stateFrom({wallet:5000,fullness:20},cfg);
 const def=Life.run(cfg,street,'eat',{});
 assert.equal(def.ok,true);
 assert.equal(def.state.wallet,2500);
});

test('hooks expose kost furniture actions inside the room and warteg Makan as an extra',()=>{
 const furniture=()=>[
  {id:'bed',kind:'bed',furnitureId:'bed',x:240.5,z:0.5},
  {id:'shower',kind:'bathroom',furnitureId:'shower',x:246.5,z:0.5},
  {id:'stove',kind:'stove',furnitureId:'stove',x:244.5,z:0.5}
 ];
 let kind='kost';
 let extra=[];
 const events=[];
 let state=Life.stateFrom({
  wallet:20000,energy:40,hygiene:40,bladder:80,fullness:40,
  furniture:['bed','chair','stove','wardrobe'],housing:{room:true,fridge:true}
 },Life.defaults());
 let pos={x:240.5,y:0,z:0.5};
 const ctx={
  storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  cityId:()=>'city-test',playerId:()=>'t_ichsan',
  dataKey:()=>'semesta-life-play-v1:city-test@t_ichsan',
  getState:()=>state,setState:s=>{state=s;},loadState:s=>{state=Life.stateFrom(s,Life.defaults());},
  getSites:()=>[
   {id:'kost',label:'Kost / Kamar',x:16,z:25,action:'buy_room'},
   {id:'warung',label:'Warteg',x:31.8,z:25,action:'eat'}
  ],
  getWorld:()=>({objects:[]}),getPos:()=>pos,getConfig:()=>Life.defaults(),
  persist:()=>{},teleport:(x,z)=>{pos={x,y:0,z};return true;},
  interiorFurniture:furniture,interiorKind:()=>kind,extraActions:()=>extra,
  onEvent:(type,payload)=>events.push({type,payload})
 };
 const api=Hooks.create(ctx);
 pos={x:240.5,z:0.5};
 let list=api.nearbyActions();
 assert.ok(list.some(a=>a.id==='sleep'),'Tidur near the bed inside the kost');
 pos={x:246.5,z:0.5};
 list=api.nearbyActions();
 assert.ok(list.some(a=>a.id==='home_shower'),'Mandi near the shower');
 pos={x:244.5,z:0.5};
 list=api.nearbyActions();
 assert.ok(list.some(a=>a.id==='cook'||a.id==='cook_recipe'),'Masak near the stove');
 assert.equal(list.some(a=>a.id==='eat'),false,'street warteg is hidden while inside the kost');

 kind='warteg';
 extra=[{id:'eat',label:'Makan Warteg',price:12000,args:{price:12000},furnitureId:'dining_table'}];
 pos={x:262,z:2};
 list=api.nearbyActions();
 const meal=list.find(a=>a.id==='eat');
 assert.ok(meal);assert.equal(meal.price,12000);
 assert.equal(list.some(a=>a.id==='sleep'),false);
});

test('kharisma is used when present; Ellen layout is the fallback if it is missing',()=>{
 const withK=kit();
 // kit injects only Ellen; wireWorld must fall back
 const fallbackTpl=withK.world.objects.find(o=>/warung|warteg/i.test([o.name,o.asset,o.id].join(' ')));
 // find via api
 const w=withK.api.findBuilding('warteg',withK.world);
 assert.ok(w);
 assert.equal(withK.api.buildings().warteg.template,'njh_warung_makan');
 withK.pos={x:w.njhUsePoint.x,z:w.njhUsePoint.z};
 assert.equal(withK.api.enterNearby().ok,true);
 assert.equal(withK.api.active().template,'njh_warung_makan');
 withK.api.exit();

 const T=THREE();
 const scene=new T.Group();
 const world={objects:[{id:'warteg-front',type:'sprite',asset:'pipeline:warung_madura',name:'Warung Madura',x:31.8,z:25,d:3}]};
 const roots=new Map();
 let state=Life.stateFrom({wallet:20000,energy:80,hygiene:75,bladder:20,fullness:50,moral:50,
  furniture:['bed','chair','stove','wardrobe'],housing:{room:true,fridge:true}},Life.defaults());
 let pos={x:31.8,y:0,z:27.4};
 const api=Interiors.create({
  THREE:T,scene,catalog,scenes:{njh_kos:kos,njh_warteg_kharisma:kharisma,njh_warung_makan:warteg},
  getWorld:()=>world,getState:()=>state,persist:()=>{},
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  message:()=>{},playerObjectId:()=>'player',
  getRoots:()=>[...roots.entries()].map(([id,root])=>({id,root})),
  onAddObject:o=>{const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);}
 });
 for(const o of world.objects){const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);}
 api.wireWorld(world);
 assert.equal(api.buildings().warteg.template,'njh_warteg_kharisma');
 const ww=api.findBuilding('warteg',world);
 pos={x:ww.njhUsePoint.x,z:ww.njhUsePoint.z};
 assert.equal(api.enterNearby().ok,true);
 assert.equal(api.active().furniture.length,kharisma.items.length);
 const table=api.active().furniture.find(f=>f.assetId==='table'||f.assetId==='counter'||f.assetId==='dining_table');
 assert.ok(table);
 pos={x:table.x,z:table.z};
 const meal=api.extraActions().find(a=>a.id==='eat');
 assert.ok(meal);assert.equal(meal.price,12000);
 // far walls only: no plane at origin.x+width (near/right wall)
 const room=api.active();
 let right=false;
 scene.traverse(n=>{
  if(n.geometry&&n.geometry.type==='PlaneGeometry'&&Math.abs((n.position?.x||0)-(room.origin.x+room.width+0.04))<0.02)right=true;
 });
 assert.equal(right,false,'near-side right wall must not be drawn');
 assert.equal(api.cameraLocked(),true);
});

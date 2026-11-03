'use strict';
// node tests/semesta-traffic.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.resolve(__dirname,'../world-builder'),g={};
const ctx=vm.createContext({window:g});
for(const src of ['asset-catalog.js','pipeline-catalog.js','vegetation-catalog.js',
 'semesta-traffic-catalog.js','semesta-traffic.js','style-rules.js','map-terrain.js',
 'map-schema.js','world-physics.js','reference-city.js']){
 vm.runInContext(fs.readFileSync(path.join(base,src),'utf8'),ctx,{filename:src});
}
const catalog=new Map(g.VLAssetCatalog.map(x=>[x.file,x]));
const t=g.VLSemestaTraffic,style=g.VLWorldStyle,schema=g.VLMapSchema;
const cells=[];
for(let c=0;c<20;c++)for(const r of [1,2,5])cells.push({c,r,type:r===5?'sidewalk':'road'});
const map={unbounded:true,terrain:{default:'grass',cells}};
const car=t.makeRoute(map,3.5,1.5,'vehicle');
const walker=t.makeRoute(map,3.5,5.5,'pedestrian');
assert.equal(g.VLSemestaCatalog.vehicles.length,12);
assert.equal(g.VLSemestaCatalog.questNPCs.length,6);
assert.equal(g.VLSemestaCatalog.vehicle('bus_transjakarta').published,false);
assert.ok(car&&car.wrap&&car.length===19,'cars travel straight to road end and respawn at the starting end');
assert.ok(walker&&walker.wrap,'sidewalk NPC loops only along the straight corridor');
assert.ok(car.points.every(p=>p.z===1.5),'vehicle stays on one road lane with no U-turn');
for(let d=0;d<car.length*2;d+=.3){
 const p=t.sample(car,d);
 assert.equal(t.allowed(map,p.x,p.z,'vehicle'),true,'vehicle must remain on road');
}
for(let d=0;d<walker.length*2;d+=.35){
 const p=t.sample(walker,d);
 assert.equal(t.allowed(map,p.x,p.z,'pedestrian'),true,'walker must stay on sidewalk');
 assert.equal(p.z,5.5,'walker remains on straight sidewalk, never turns');
}
assert.equal(t.spawnPosition(map,6,6,'vehicle',2),null);
assert.ok(t.spawnPosition(map,6,6,'pedestrian',2));
const vehicle={id:'v',name:'Car',type:'vehicle',vehicleId:'sedan_red',x:3.5,z:1.5,rotation:0,scale:1,
 motion:{mode:'road',direction:'auto',speed:4,enabled:true}};
const pedestrian={id:'p',name:'Walker',type:'pedestrian',x:3.5,z:5.5,rotation:0,scale:1,
 motion:{mode:'sidewalk',direction:'auto',speed:1.6,enabled:true},profile:'ichsan'};
const quest={id:'q',name:'Manusia Silver',type:'quest_npc',questId:'manusia_silver',jobId:'street_performer',
 x:15.5,z:5.5,rotation:0,scale:1,collision:true,motion:{mode:'idle',idleAction:'statue',enabled:true}};
for(const o of [vehicle,pedestrian,quest]){
 style.normalize(o,catalog);schema.normalize(o,catalog,style);
 assert.equal(style.reason(o,[],map,catalog),'');
}
assert.match(style.reason({...vehicle,z:5.5},[],map,catalog),/jalan/);
assert.match(style.reason({...pedestrian,z:1.5},[],map,catalog),/trotoar/);
assert.match(style.reason({...quest,z:1.5},[],map,catalog),/trotoar/);
const document={format:'virtual-life-world-builder-v1',map,objects:[vehicle,pedestrian,quest]};
const exported=schema.enrich(document,catalog,style);
assert.equal(schema.validate(exported,catalog,style).length,0);
assert.equal(exported.objects[0].assetPublished,false);
assert.deepEqual(JSON.parse(JSON.stringify(exported.objects[2])).motion.mode,'idle');
assert.equal(exported.objects[2].jobId,'street_performer');
assert.ok(exported.objects[2].interactionHooks.some(x=>x.id==='accept_job'&&!x.enabled));
const reference=g.VLReferenceCity.create(JSON.parse(fs.readFileSync(path.join(base,'world.json'))),
 catalog,style,schema);
const dynamics=reference.objects.filter(x=>['vehicle','pedestrian','crowd','quest_npc'].includes(x.type));
assert.ok(dynamics.length>=13,'reference city includes active previews');
assert.ok(dynamics.some(x=>x.vehicleId==='bus_transjakarta'));
assert.ok(dynamics.some(x=>x.vehicleId==='gojek'));
assert.ok(dynamics.some(x=>x.questId==='pak_ogah'));
assert.ok(dynamics.some(x=>x.type==='crowd'));
for(const o of dynamics){
 assert.equal(style.reason(o,reference.objects.filter(x=>x.id!==o.id),reference.map,catalog),'');
 if(o.type==='quest_npc')continue;
 const mode=o.type==='vehicle'?'vehicle':'pedestrian';
 const route=t.makeRoute(reference.map,o.x,o.z,mode);
 assert.ok(route?.length>2, 'valid loop for '+o.id);
 const p=t.sample(route,t.nearestDistance(route,o)+.1);
 assert.equal(t.allowed(reference.map,p.x,p.z,mode),true);
}
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
assert.match(html,/<title>Semesta/);
assert.match(html,/id="motionControls"/);
assert.match(html,/id="jobRole"/);
assert.match(html,/option value="vehicles"/);
assert.match(html,/option value="people"/);
assert.match(html,/option value="quest"/);
const css=fs.readFileSync(path.join(base,'xp.css'),'utf8');
assert.match(css,/#toolsPanel\{justify-content:safe center/);
assert.match(css,/\.tutorial-overlay\{align-items:center!important/);
console.log('Semesta traffic / quest / crowd / schema / UI PASS ('+dynamics.length+' agents).');

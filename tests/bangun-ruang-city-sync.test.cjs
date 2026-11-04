'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..','world-builder');
const storage=new Map();
const localStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,value)=>storage.set(key,String(value)),
 removeItem:key=>storage.delete(key)
};
const window={};
vm.runInNewContext(fs.readFileSync(path.join(base,'city-building-link.js'),'utf8'),{window,localStorage,console});
const link=window.VLSemestaCityBuildings;
const catalog=[
 {file:'pipeline:rumah_kampung_a',source:'pipeline-street',group:'kampung'},
 {file:'pipeline:lampu_taman',source:'pipeline-street',group:'taman'},
 {file:'studio:br-existing',source:'custom-building',group:'kampung'}
];
const original={map:{name:'Kota A',terrain:{cells:[{c:0,r:0,type:'grass'}]}},objects:[
 {id:'gedung-1',type:'building',name:'Gedung A',w:5,d:4,x:12,z:20,y:0,rotation:90,scale:1.1,notes:'Keep me'},
 {id:'lamp-1',type:'sprite',name:'Lampu',asset:'pipeline:lampu_taman',x:11,z:21},
 {id:'gedung-2',type:'sprite',name:'Rumah B',asset:'pipeline:rumah_kampung_a',x:25,z:40},
 {id:'gedung-3',type:'sprite',name:'Rumah C',asset:'studio:br-existing',x:30,z:50},
 {id:'ped-1',type:'pedestrian',name:'NPC',x:8,z:4}
]};
const asset={id:'br-city-abc',name:'Gedung Baru',config:{collision:'yes'},
 views:{sw:{size:[400,550],pivot:[200,495]}},
 interactive:true,enterable:true,entranceFacing:'sw',interactions:['enter','sleep'],
 entrance:{facing:'sw',entry:{c:1,r:0}},
 interior:{format:'virtual-life-interiors-v1',floors:[]},
 actionSlots:[{id:'wc-1',interaction:'toilet'}]};
test('saved cities: inventory includes actual buildings, not street lamps/NPCs',()=>{
 const ids=link.inventory(original,catalog).map(x=>x.id);
 assert.deepEqual(Array.from(ids),['gedung-1','gedung-2','gedung-3']);
});
test('replace one instance; preserve city map, coordinates, rotation, scale and other objects',()=>{
 const result=link.updateDocument(original,'gedung-1',asset);
 assert.equal(result.map,original.map);
 for(let i=1;i<original.objects.length;i++)assert.equal(result.objects[i],original.objects[i]);
 const building=result.objects[0];
 assert.equal(building.type,'sprite');
 assert.equal(building.asset,'studio:br-city-abc');
 assert.equal(building.x,12);
 assert.equal(building.z,20);
 assert.equal(building.rotation,90);
 assert.equal(building.scale,1.1);
 assert.equal(building.notes,'Keep me');
 assert.equal(building.w,undefined);
 assert.equal(building.sizeClass,undefined);
 assert.equal(building.enterable,true);
 assert.equal(building.actionSlots.length,1);
 assert.equal(original.objects[0].type,'building');
});
test('patch working copy only when matching the active named city',()=>{
 storage.set(link.ACTIVE_KEY,'city-a');
 storage.set(link.WORKING_KEY,JSON.stringify(original));
 assert.equal(link.patchWorkingCopy('city-b','gedung-1',asset),false);
 assert.equal(JSON.parse(storage.get(link.WORKING_KEY)).objects[0].type,'building');
 assert.equal(link.patchWorkingCopy('city-a','gedung-1',asset),true);
 const live=JSON.parse(storage.get(link.WORKING_KEY));
 assert.equal(live.objects[0].asset,'studio:br-city-abc');
 assert.equal(live.objects[1].asset,'pipeline:lampu_taman');
});
test('save signal carries city ID and specific placement ID',()=>{
 const notice=link.publishSignal('city-a','gedung-1',asset.id);
 assert.equal(notice.draftId,'city-a');
 assert.equal(notice.objectId,'gedung-1');
 assert.equal(JSON.parse(storage.get(link.UPDATE_KEY)).assetId,'br-city-abc');
});
test('both apps load shared link and use city-specific updates',()=>{
 const studio=fs.readFileSync(path.join(base,'bangun-ruang','index.html'),'utf8');
 const semesta=fs.readFileSync(path.join(base,'index.html'),'utf8');
 const game=fs.readFileSync(path.join(base,'builder.js'),'utf8');
 const browser=fs.readFileSync(path.join(base,'bangun-ruang','city-browser.js'),'utf8');
 assert.match(studio,/city-building-link\.js/);
 assert.match(studio,/city-browser\.js/);
 assert.match(semesta,/city-building-link\.js/);
 assert.match(browser,/KOTA SEMESTA/);
 assert.match(browser,/drafts\.load\(/);
 assert.match(browser,/drafts\.save\(/);
 assert.match(game,/reconcileExternalCityBuilding/);
});

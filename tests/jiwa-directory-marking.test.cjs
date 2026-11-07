'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../jiwa/interaction-rules.js'),A=require('../jiwa/activity-catalog.js'),E=require('../jiwa/life-economy.js');
const rows=[
 {id:'npc-ogah',type:'quest_npc',name:'Pak Ogah',x:1,z:1},
 {id:'npc-parkir',type:'npc',name:'Kang Parkir',x:2,z:1},
 {id:'bank-a',type:'building',name:'Kantor Bank A',x:3,z:1},
 {id:'bank-b',type:'building',name:'Kantor Bank B',x:4,z:1},
 {id:'bench-a',type:'prop',name:'Bangku Taman',x:5,z:1}
];
const rule=(kind,ids,city='jakarta',active=true)=>P.worldRule({
 id:'test_'+kind,kind,enabled:active,selectionMode:'directory',
 operation:kind==='npc'?'npc_quest':kind==='building'?'enter':'ambient',
 query:kind==='building'?'Bank':'Pak Ogah',
 targets:ids.map(objectId=>({cityId:city,objectId}))
});
const rules=()=>[rule('npc',['npc-ogah','npc-parkir']),rule('building',['bank-a'])];
test('Semesta directory is split into NPC, building and asset kinds',()=>{
 assert.deepEqual(rows.map(A.kindOf),['npc','npc','building','building','object']);
});
test('Entities can mark many exact directory IDs, and unmarked peers stay excluded',()=>{
 const selected=A.eligibleTargets(rows,rules(),'jakarta');
 assert.deepEqual(selected.map(o=>o.id).sort(),['bank-a','npc-ogah','npc-parkir']);
 assert.equal(P.matchWorldAll(rules()[0],rows,'jakarta').length,2);
 assert.equal(selected.some(o=>o.id==='bank-b'),false);
});
test('A directory marking is city-scoped; another city with equal names is not matched',()=>{
 assert.equal(A.eligibleTargets(rows,rules(),'bandung').length,0);
 assert.equal(P.matchWorldAll(rules()[0],rows,'bandung').length,0);
});
test('A disabled or unmarked rule does not expose a directory entry',()=>{
 assert.equal(A.eligibleTargets(rows,[rule('npc',['npc-ogah'],'jakarta',false)],'jakarta').length,0);
 assert.equal(A.eligibleTargets(rows,[rule('npc',[])],'jakarta').length,0);
 assert.equal(P.matchWorld(rule('npc',[]),rows,'jakarta'),null,
  'Unmarking all must not fall back to a broad query match');
});
test('Money activities can bind NPCs; stale ID does not fall back to a different name match',()=>{
 const job=A.activity({...P.preset('money','sepele'),id:'test_job',category:'money',
  label:'Jaga Parkir',enabled:true,actionAsset:'work',objectId:'npc-parkir',
  buildingQuery:'Pak Ogah'});
 assert.equal(A.matchActivityTarget(job,rows,rules(),'jakarta')?.id,'npc-parkir');
 assert.equal(A.matchActivityTarget({...job,objectId:'bank-b'},rows,rules(),'jakarta'),null);
 assert.equal(A.matchActivityTarget(job,rows,rules(),'bandung'),null);
 assert.equal(A.validation(job,rows,rules(),'jakarta').length,0);
});
test('Manual directory targets persist through save, load, and runtime normalize',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v))};
 const config={...A.seed(),worldEntities:rules()};
 const stored=A.saveLocal(config,storage),restored=A.readLocal(storage);
 assert.equal(stored.worldEntities[0].selectionMode,'directory');
 assert.equal(restored.worldEntities[0].targets.length,2);
 assert.equal(E.normalize({worldEntities:restored.worldEntities}).worldEntities[0].targets.length,2);
});
test('Old query-based matching retains first-only behavior, never becomes a bulk marking',()=>{
 const old=P.worldRule({id:'old',kind:'building',operation:'enter',
  enabled:true,matchMode:'name',query:'Kantor Bank'});
 assert.equal(old.selectionMode,'query');
 assert.deepEqual(P.matchWorldAll(old,rows,'jakarta').map(o=>o.id),['bank-a']);
 assert.equal(A.eligibleTargets(rows,[old],'jakarta').length,0);
});
test('UI and Semesta runtime implement explicit markings and refresh controls',()=>{
 const ui=fs.readFileSync('jiwa/entity-editor.js','utf8'),
  activity=fs.readFileSync('jiwa/activity-editor.js','utf8'),
  semesta=fs.readFileSync('world-builder/semesta-life-play.js','utf8');
 for(const id of ['worldDirectorySearch','worldDirectoryList','worldDirectoryMarkAll',
  'worldDirectoryUnmarkAll','worldDirectoryRefresh'])assert.ok(ui.includes(id),id);
 assert.match(activity,/eligibleTargets\(currentObjects,draft\.worldEntities,cityId\)/);
 assert.match(activity,/id="activityTargetKind"/);
 assert.doesNotMatch(entities,/id="worldMatchMode"/);
 assert.doesNotMatch(entities,/id="worldQuery"/);
 assert.match(entities,/PILIH DIRECTORY DAHULU/);
 assert.match(activity,/id="activityRefreshDirectory"/);
 assert.match(semesta,/matchActivityTarget\(a,objects,config\.worldEntities\|\|\[\],projectId\)/);
 assert.match(semesta,/matchWorldAll\?\.\(rule,candidates,projectId\)/);
});

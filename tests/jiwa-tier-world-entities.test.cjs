'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../jiwa/interaction-rules.js'),A=require('../jiwa/activity-catalog.js'),
 E=require('../jiwa/life-economy.js');
const read=p=>fs.readFileSync(p,'utf8');
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v))};};
test('All eight tabs share a mandatory primary metric and tier value ranges',()=>{
 const ids=['money','energy','moral','immoral','exp','cooking','buying','punishment'];
 assert.deepEqual(Object.keys(P.CATEGORY),ids);
 for(const key of ids){
  const c=P.CATEGORY[key];assert.equal(c.tiers.length,3);
  assert.deepEqual(c.tiers.map(t=>t.id),['sepele','menengah','prestige']);
  for(const t of c.tiers){
   assert.ok(t.range[0]<=t.range[1],key+' tier range');
   const item={...P.preset(key,t.id),category:key,tier:t.id};
   assert.deepEqual(P.violations(item),[],key+' '+t.id+' defaults must be runnable');
  }
  for(let i=1;i<c.tiers.length;i++){
   const prev=c.tiers[i-1],next=c.tiers[i];
   assert.ok(prev.range[1]<next.range[0]||prev.range[0]>next.range[1],
    key+' tier ranges must not overlap');
  }
 }
});
test('Money tier limit cannot be circumvented by editing UI, JSON or engine call',()=>{
 const source=A.activity({...P.preset('money','sepele'),id:'unit_test_bank',category:'money',
  label:'Bank',enabled:true,buildingQuery:'Bank',actionAsset:'work',moneyDelta:4000});
 const failures=P.violations(source);
 assert.ok(failures.some(x=>x.key==='moneyDelta'));
 assert.throws(()=>A.saveLocal({activities:[source],worldEntities:[]},mem()),/tier sepele/);
 const cfg={...E.defaults(),activities:[source]};
 const res=E.run(cfg,{wallet:5000,experience:30,energy:75,hygiene:80},'configured_activity',{activityId:source.id});
 assert.equal(res.ok,false);
});
test('World entity templates and tier limits are canonical',()=>{
 const rules=P.seedWorld();
 assert.deepEqual(rules.map(x=>x.kind),['building','npc','object','object']);
 assert.ok(rules.every(x=>x.enabled===false),'starter templates must not silently change game');
 assert.equal(rules.find(x=>x.id==='wall_pee').operation,'ambient');
 assert.equal(rules.find(x=>x.id==='npc_quest').operation,'npc_quest');
 assert.equal(rules.find(x=>x.id==='building_enter').operation,'enter');
 const found=P.matchWorld(P.worldRule({matchMode:'asset',query:'wall_01'}),[
  {id:'obj1',name:'Building',asset:'wall_01'},{id:'obj2',name:'Wall',asset:'wall_02'}]);
 assert.equal(found.id,'obj1');
});
test('Nonquest object action is governed by tier rules and applies stat consequences',()=>{
 const wall=P.worldRule({...P.seedWorld().find(x=>x.id==='wall_pee'),enabled:true});
 const cfg={...E.defaults(),worldEntities:[wall]};
 const result=E.run(cfg,{wallet:5000,experience:30,energy:80,bladder:95,
   moral:70,hygiene:80},'world_ambient',{ruleId:wall.id,riskRoll:1});
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.state.wallet,5000);
 assert.ok(result.state.moral<70);
 assert.ok(result.state.bladder<95);
 assert.equal(E.run({...cfg,worldEntities:[]},{wallet:5000},'world_ambient',{ruleId:wall.id}).ok,false);
});
test('Both apps load premise library before tier engine; NPC, Building and Object bind only real sites',()=>{
 const jiwa=read('jiwa/index.html'),world=read('world-builder/index.html');
 const a=jiwa.indexOf('src="./interaction-rules.js'),b=jiwa.indexOf('src="./life-economy.js');
 assert.ok(a>=0&&a<b,'Jiwa premise rules before engine');
 const c=world.indexOf('src="../jiwa/interaction-rules.js'),d=world.indexOf('src="../jiwa/activity-catalog.js');
 assert.ok(c>=0&&c<d,'Semesta premise rules before catalog');
 const s=read('world-builder/semesta-life-play.js');
 assert.match(s,/matchWorld\?\.\(rule,objects\)/);
 assert.match(s,/worldRuleId:rule\.id/);
 assert.match(s,/sites\.filter\(n=>!n\.ambient\)/);
 assert.match(s,/action==='world_ambient'/);
 assert.match(s,/action==='world_enter'/);
 assert.match(s,/action==='world_quest'/);
 assert.match(read('world-builder/builder.js'),/openInteriorById:id=>/);
});
test('World entity UI and activity wizard enforce category tier template before details',()=>{
 const jiwa=read('jiwa/index.html');
 for(const id of ['entityTab','entitiesView','entitySave','entityNew'])
  assert.match(jiwa,new RegExp('id="'+id+'"'));
 const form=read('jiwa/activity-editor.js');
 assert.match(form,/function presetStep\(/);
 assert.match(form,/function presetContinue|presetContinue/);
 assert.match(form,/PREMISES|P\.preset\(/);
 const entities=read('jiwa/entity-editor.js');
 assert.match(entities,/function presetForm\(/);
 assert.match(entities,/function detailForm\(/);
 assert.match(entities,/data-entity-tier/);
});

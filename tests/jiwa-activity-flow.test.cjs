'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const A=require('../jiwa/activity-catalog.js'),E=require('../jiwa/life-economy.js'),D=require('../world-builder/drive-sync.js');
const read=p=>fs.readFileSync(p,'utf8');
function storage(){const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))};}
test('Eight icon categories have premise-first seeded activities, initially disabled',()=>{
 assert.deepEqual(A.CATEGORIES.map(c=>c.id),['money','energy','moral','immoral','exp','cooking','buying','punishment']);
 const s=A.seed();
 assert.equal(s.id,'global-game-activities');
 assert.ok(s.activities.length>=20);
 assert.ok(A.CATEGORIES.every(c=>s.activities.some(a=>a.category===c.id)));
 assert.ok(s.activities.every(a=>!a.enabled));
 const bank=s.activities.find(a=>a.id==='bank_teller');
 assert.equal(bank.minExp,40);assert.equal(bank.moneyDelta,4800);
 assert.equal(bank.buildingQuery,'bank');assert.equal(bank.actionAsset,'work_bank_counter');
 assert.ok(bank.premise.includes('bank'));
 assert.deepEqual(s.activities.find(a=>a.id==='nasi_goreng').ingredients,['nasi','telur','minyak']);
 assert.equal(s.activities.find(a=>a.id==='beli_kost').grantType,'room');
});
test('Global Save is independent of map and rejects broken payloads',()=>{
 const store=storage(),draft=A.seed();
 draft.activities[0].label='Kerja Bank Baru';draft.activities[0].enabled=true;
 const saved=A.saveLocal(draft,store);
 assert.equal(A.readLocal(store).activities[0].label,'Kerja Bank Baru');
 assert.equal(A.readLocal(store).activities[0].enabled,true);
 assert.ok(saved.updatedAt);
 D.validateRecord('jiwa','activities',saved);
 assert.throws(()=>D.validateRecord('jiwa','activities',{...saved,id:'jakarta'}));
 assert.throws(()=>D.validateRecord('jiwa','city',saved));
 assert.equal(D.APPS.jiwa.folder,'Jiwa');
});
test('Premise building matching requires actual asset, not fake map pins',()=>{
 const bank=A.seed().activities.find(a=>a.id==='bank_teller');
 assert.equal(A.matchBuilding(bank,[{id:'i',name:'Pohon Besar'}]),null);
 assert.equal(A.matchBuilding(bank,[{id:'a',name:'Bank BRI / Kantor'}]).id,'a');
 const exact=A.activity({...bank,objectId:'o-42'});
 assert.equal(A.matchBuilding(exact,[{id:'o-42',name:'Gedung Serbaguna'}]).id,'o-42');
 assert.ok(A.validation(bank,[{id:'a',name:'Pasar'}]).some(t=>t.includes('Bangunan')));
});
test('Configured activity enforces EXP, hygiene and energy before modifying money',()=>{
 const bank=A.activity({...A.seed().activities.find(a=>a.id==='bank_teller'),enabled:true});
 const cfg={...E.defaults(),activities:[bank]};
 const base={wallet:1000,experience:45,energy:75,hygiene:85,fullness:80,bladder:0,moral:70};
 const work=E.run(cfg,base,'configured_activity',{activityId:'bank_teller'});
 assert.equal(work.ok,true,work.reason);
 assert.equal(work.state.wallet,5800);assert.ok(work.state.energy<=57);
 assert.ok(work.state.experience>45);
 assert.ok(work.state.elapsedMinutes>=45);
 assert.ok(work.state.transactions.some(x=>x.delta===4800&&x.label==='Kerja di Bank'));
 const noExp=E.run(cfg,{...base,experience:10},'configured_activity',{activityId:'bank_teller'});
 assert.equal(noExp.ok,false);assert.equal(noExp.state.wallet,1000);
 assert.equal(E.run({...cfg,activities:[]},base,'configured_activity',{activityId:'bank_teller'}).ok,false);
});
test('Cooking consumes combinations once and grants the selected inventory outcome',()=>{
 const meal=A.activity({...A.seed().activities.find(a=>a.id==='nasi_goreng'),enabled:true});
 const cfg={...E.defaults(),activities:[meal]};
 const base={wallet:8000,energy:80,experience:0,
  inventory:['a','b','c'],
  itemMeta:{a:{species:'nasi',label:'Nasi'},b:{species:'telur',label:'Telur'},c:{species:'minyak',label:'Minyak'}}};
 const made=E.run(cfg,base,'configured_activity',{activityId:'nasi_goreng'});
 assert.equal(made.ok,true,made.reason);
 assert.equal(made.state.inventory.length,1);
 assert.equal(made.state.itemMeta[made.state.inventory[0]].species,'nasi_goreng');
 const missing=E.run(cfg,{...base,inventory:['a','b']},'configured_activity',{activityId:'nasi_goreng'});
 assert.equal(missing.ok,false);
});
test('Buying can acquire permanent room/furniture, and illicit choices can trigger detention',()=>{
 const src=A.seed().activities;
 const room=A.activity({...src.find(a=>a.id==='beli_kost'),enabled:true});
 const furniture=A.activity({...src.find(a=>a.id==='beli_furnitur'),enabled:true});
 const theft=A.activity({...src.find(a=>a.id==='mencuri'),enabled:true});
 const cfg={...E.defaults(),activities:[room,furniture,theft]};
 const initial={wallet:3_000_000,energy:80,experience:50};
 const bought=E.run(cfg,initial,'configured_activity',{activityId:room.id,roomSpawn:{id:'kost-1',x:4,z:7}});
 assert.equal(bought.ok,true,bought.reason);
 assert.equal(bought.state.housing.room,true);
 assert.equal(bought.state.housing.roomPosition.id,'kost-1');
 const furnished=E.run(cfg,bought.state,'configured_activity',{activityId:furniture.id});
 assert.equal(furnished.ok,true,furnished.reason);
 assert.ok(furnished.state.furniture.includes('bed'));
 const gotCaught=E.run(cfg,initial,'configured_activity',{activityId:theft.id,riskRoll:0});
 assert.equal(gotCaught.ok,true,gotCaught.reason);
 assert.equal(gotCaught.state.detained,true);
 assert.ok(gotCaught.state.detentionMinutes>=60);
});
test('Jiwa icon UX, Semesta runtime binding and Google Drive wiring are present',()=>{
 const html=read('jiwa/index.html'),ui=read('jiwa/activity-editor.js'),semesta=read('world-builder/semesta-life-play.js');
 for(const cat of A.CATEGORIES)assert.match(html,new RegExp('data-activity-tab="'+cat.id+'"'));
 for(const id of ['activityView','activitySave','activityDrivePush','activityDrivePull','activityHeading',
  'activityEditor','activityList'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(ui,/id="activityObject"/);
 assert.match(ui,/function chooseCategory/);
 assert.match(ui,/function editor\(/);
 assert.match(ui,/D\(\)/);
 assert.match(ui,/cloud\.save\('jiwa','activities'/);
 assert.match(ui,/cloud\.load\(cloudFile\)/);
 assert.match(semesta,/catalog\.matchActivityTarget\(a,objects,config\.worldEntities/);
 assert.match(semesta,/id:'act:'\+a\.id/);
 assert.match(semesta,/action:'configured_activity'/);
 assert.match(semesta,/expected='act:'\+String\(args\.activityId/);
 assert.match(semesta,/root\.JiwaActivities\?\.readLocal/);
});

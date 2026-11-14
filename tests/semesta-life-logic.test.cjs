'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('path');
const R=path.join(__dirname,'..');
const Life=require(path.join(R,'jiwa/life-economy.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const play=fs.readFileSync(path.join(R,'world-builder/semesta-life-play.js'),'utf8');
const rules=fs.readFileSync(path.join(R,'jiwa/interaction-rules.js'),'utf8');
const catalog=fs.readFileSync(path.join(R,'jiwa/activity-catalog.js'),'utf8');
const docs=fs.readFileSync(path.join(R,'docs/LOGIC-STATUS.md'),'utf8');

test('Pipis sembarangan is gone; wall_pee and fart go through nearbyActions',()=>{
 assert.doesNotMatch(play,/Pipis sembarangan/);
 assert.doesNotMatch(play,/<div class="slp-actions">'\+optsButton\('pee_outside'/);
 assert.match(play,/action==='wall_pee'/);
 assert.match(play,/action==='fart'/);
 assert.equal(Hooks.WALL_PEE.moral,-5);
 assert.equal(Hooks.WALL_PEE.bladder,-70);
 assert.equal(Hooks.WALL_PEE.hygiene,-5);
 assert.equal(Hooks.WALL_PEE.bladderMin,65);
 assert.equal(Hooks.FART.moralWitness,-3);
 assert.equal(Hooks.FART.cooldownMinutes,1);
 assert.match(rules,/statEffects:\{moral:-5,bladder:-70,hygiene:-5\}/);
 assert.match(catalog,/\{bladder:-70,moral:-5,hygiene:-5\}/);
});

test('fish at a placeholder does not need water tiles',()=>{
 const c=Life.defaults();
 const s=Life.stateFrom({wallet:1000,energy:80},c);
 const r=Life.run(c,s,'fish',{spotId:'placeholder_fish',roll:0.02});
 assert.ok(r.ok,r.reason);
 assert.ok(r.state.inventory.length>=1);
});

test('life sites() shape and NPC defs cover every requested placeholder site',()=>{
 const need=['fish','siomay_batagor','pasar_ikan','job_silver','job_pak_ogah','job_kang_parkir','premium_job',
  'coffee','public_wc','public_bath','kost','tent','prayer_islam_a','prayer_islam_b','prayer_islam_c',
  'prayer_kristen','prayer_katolik','prayer_hindu','prayer_buddha','prayer_konghucu','hansip','help','charity','course'];
 for(const id of need)assert.match(play,new RegExp("id:'"+id+"'"));
 const real=['loak','scavenge','tree','warung','bench'];
 for(const id of real)assert.match(play,new RegExp("id:'"+id+"'"));
 const npcIds=['npc_silver','npc_ogah','npc_parkir','npc_premium','npc_siomay','npc_pasar','npc_loak','npc_hansip','npc_help'];
 for(const id of npcIds)assert.match(play,new RegExp("id:'"+id+"'"));
 assert.match(play,/behavior:'patrol'/);
 assert.match(play,/behavior:'work'/);
 assert.match(play,/behavior:'idle'/);
 assert.match(play,/function publicSites\(\)/);
 assert.match(docs,/placeholder-position/);
});

test('authoritative prices and wall_pee/fart economy deltas',()=>{
 const c=Life.defaults();
 assert.equal(c.settings.wartegMealPrice,12000);
 assert.equal(c.settings.coffeePrice,5000);
 assert.equal(c.settings.teaPrice,3000);
 assert.equal(c.settings.tokenPrice,20000);
 assert.equal(c.settings.roomPrice,700000);
 assert.equal(c.settings.fridgePrice,2000000);
 assert.equal(c.settings.streetFoodPrice,2500);
 const furn=Object.fromEntries(Life.FURNITURE.map(f=>[f.id,f.price]));
 assert.equal(furn.bed,1500000);
 assert.equal(furn.chair,350000);
 assert.equal(furn.stove,850000);
 assert.equal(furn.wardrobe,1000000);
 const s=Life.stateFrom({wallet:100000,energy:80,bladder:80,hygiene:80,moral:50},c);
 const pee=Life.run(c,s,'wall_pee',{});
 assert.ok(pee.ok);
 assert.equal(pee.state.moral,45);
 assert.equal(pee.state.bladder,10);
 assert.equal(pee.state.hygiene,75);
 assert.equal(Life.run(c,s,'pee_outside',{}).ok,false);
 const tea=Life.run(c,s,'tea',{});
 assert.ok(tea.ok);assert.equal(tea.state.wallet,97000);
});

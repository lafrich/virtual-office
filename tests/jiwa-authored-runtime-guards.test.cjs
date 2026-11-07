'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../jiwa/interaction-rules.js'),A=require('../jiwa/activity-catalog.js'),E=require('../jiwa/life-economy.js');
const world=fs.readFileSync('world-builder/semesta-life-play.js','utf8');
test('EXP tier requirements match the actual 0..100 character cap',()=>{
 for(const [category,rules] of Object.entries(P.CATEGORY))for(const tier of rules.tiers){
  const range=P.bounds(category,tier.id).minExp;
  assert.ok(range[0]>=0&&range[1]<=100,category+'/'+tier.id);
 }
 const a={id:'high',category:'money',tier:'prestige',enabled:true,moneyDelta:20000,minExp:99999};
 assert.equal(A.activity(a).minExp,100);
 assert.equal(E.normalize({activities:[a]}).activities[0].minExp,100);
 assert.equal(P.worldRule({minExp:99999}).minExp,100);
 assert.equal(E.stateFrom({experience:99999},E.defaults()).experience,100);
});
test('Exact object binding cannot silently target another same-name object',()=>{
 const a=A.activity({id:'exact',objectId:'bank-a',buildingQuery:'Bank'});
 assert.equal(A.matchBuilding(a,[{id:'bank-b',name:'Bank'}]),null);
 assert.equal(A.matchBuilding(a,[{id:'bank-a',name:'Other'}]).id,'bank-a');
});
test('Published runtime never exposes legacy jobs or auto-enables name matching',()=>{
 assert.match(world,/publishedCatalog\?\[\]:SITES\.map\(/);
 assert.match(world,/publishedCatalog=!!(?:gameCatalog|catalog)\?\.updatedAt/);
 assert.match(world,/rule\.selectionMode!=='directory'/);
 assert.match(world,/if\(publishedCatalog&&\['pee_outside'/);
 const life=fs.readFileSync('jiwa/life-economy.js','utf8');
 assert.equal((life.match(/base\.worldEntities=/g)||[]).length,1);
});

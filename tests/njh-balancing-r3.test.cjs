'use strict';
// NJH slice-1.0 r3 levers (New Bot): fast "Tidur sampai pagi", drain rates, walking energy, walk speed —
// all read from content/balancing.json; missing keys fall back to the old behaviour.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(R,rel),'utf8');
const FILE=JSON.parse(read('content/balancing.json'));
const P=Object.fromEntries(FILE.params.map(p=>[p.key,p.value]));
const B=require(path.join(R,'shared/njh-balancing.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));
const harness=require('./helpers/life-play-harness.cjs');
const SPM=P['clock.realSecondsPerGameMinute'];
function loaderWith(mutate){
 const doc=JSON.parse(JSON.stringify(FILE));mutate(doc);
 const win={__NJH_BALANCING_DOC__:doc,console};
 vm.runInNewContext(read('shared/njh-balancing.js'),{window:win,globalThis:win,URL,console});
 return win.NJHBalancing;
}

test('r3 table revision and lever keys are read from the file (old defaults when missing)',()=>{
 assert.match(FILE.contentRevision,/^slice-1\.0-r3$/);
 for(const k of ['sleep.untilMorningSpeed','movement.walkEnergyTilesPerUnit','movement.walkSpeedMultiplier'])assert.ok(k in P,k);
 assert.equal(B.sleepTuning().untilMorningSpeed,P['sleep.untilMorningSpeed']);
 assert.equal(B.movement().walkEnergyTilesPerUnit,P['movement.walkEnergyTilesPerUnit']);
 assert.equal(B.movement().walkSpeedMultiplier,P['movement.walkSpeedMultiplier']);
 const L=loaderWith(doc=>{doc.params=doc.params.filter(p=>!/^(sleep\.untilMorningSpeed|movement\.)/.test(p.key));});
 assert.equal(L.sleepTuning().untilMorningSpeed,1);
 assert.equal(L.movement().walkEnergyTilesPerUnit,8);
 assert.equal(L.movement().walkSpeedMultiplier,1);
});

test('L1: "Tidur sampai pagi" hours run untilMorningSpeed x faster; manual sleep stays 60 game min = 30 s; drain still per hour',()=>{
 const h=harness();h.P.start();
 const hourMs=P['sleep.actionMinutes']*SPM*1000;
 let s=h.P.state();s.energy=5;s.clockOrigin=22*60-s.elapsedMinutes;
 const t0=s.elapsedMinutes,hy0=s.hygiene;
 const r=h.P.runAction('sleep_until_morning',{});
 assert.equal(r.neededMs,hourMs/P['sleep.untilMorningSpeed']);
 // after one fast hour exactly one sleep hour has been applied
 for(let t=0;t<r.neededMs/1000+0.05;t+=0.05)h.P.tick(0.05);
 s=h.P.state();
 assert.equal(s.elapsedMinutes,t0+60);
 assert.equal(s.energy,5+P['sleep.tent.energy']);
 assert.equal(s.hygiene,hy0+P['sleep.tent.hygiene']-Math.floor(60/P['needs.passiveHygieneMinutes']));
 h.P.runAction('wake');
 const m=h.P.runAction('sleep',{});
 assert.equal(m.neededMs,hourMs,'manual 1-hour sleep stays '+hourMs+' ms');
 h.P.runAction('wake');
});

test('L2: drain per hour and walking energy come from the table',()=>{
 const c=Life.normalize(B.applyToLifeConfig(Life.defaults()));
 assert.equal(c.settings.passiveEnergyMinutes,P['needs.passiveEnergyMinutes']);
 assert.equal(c.settings.passiveFullnessMinutes,P['needs.passiveFullnessMinutes']);
 assert.equal(c.settings.passiveHygieneMinutes,P['needs.passiveHygieneMinutes']);
 const s0=Life.stateFrom({},c),s1=Life.run(c,s0,'advance_time',{minutes:120}).state;
 assert.equal(s0.energy-s1.energy,120/P['needs.passiveEnergyMinutes']);
 assert.equal(s0.fullness-s1.fullness,Math.floor(120/P['needs.passiveFullnessMinutes'])*2);
 assert.equal(s0.hygiene-s1.hygiene,Math.floor(120/P['needs.passiveHygieneMinutes']));
 // walking: one energy unit per movement.walkEnergyTilesPerUnit tiles
 const h=harness();h.P.start();const per=P['movement.walkEnergyTilesPerUnit'];
 const w0=h.P.state().actionCounts?.walk||0;
 let x=0;h.P.tick(0.01);
 while(x<per*3-0.01){x+=0.5;h.setPos({x,z:0});h.P.tick(0.01);}
 assert.equal((h.P.state().actionCounts?.walk||0)-w0,3);
});

test('L3: movement.walkSpeedMultiplier scales the player speed factor the builder uses',()=>{
 const h=harness();h.P.start();
 assert.equal(h.P.speedFactor(),Life.speedFactor(h.P.state())*P['movement.walkSpeedMultiplier']);
 assert.match(read('world-builder/builder.js'),/life\.speedFactor\(\)/);
});

'use strict';
// NJH slice-1.0 r4 (New Bot): "Tidur sampai pagi" only inside the night window from content/balancing.json
// (18:00–05:00); outside it the button is disabled "Tidur sampai pagi (malam saja)" and only manual sleep works.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(R,rel),'utf8');
const FILE=JSON.parse(read('content/balancing.json'));
const P=Object.fromEntries(FILE.params.map(p=>[p.key,p.value]));
const B=require(path.join(R,'shared/njh-balancing.js'));
const harness=require('./helpers/life-play-harness.cjs');
const hm=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
const hhmm=s=>((s.elapsedMinutes+s.clockOrigin)%1440+1440)%1440;
function at(h,time){const s=h.P.state();s.clockOrigin=hm(time)-s.elapsedMinutes;return s;}
const untilAwake=h=>{let t=0;while(h.P.sleepInfo()&&t<600){h.P.tick(0.05);t+=0.05;}};
function labels(h){return h.P.nearbyActions().filter(a=>a.id==='sleep_until_morning').map(a=>({label:a.label,disabled:!!a.disabled}));}

test('night window comes from the table (r4) and the loader reads it; no window = always allowed',()=>{
 assert.match(FILE.contentRevision,/^slice-1\.0-r[4-9]$/);
 assert.equal(P['sleep.untilMorningWindowStart'],'18:00');assert.equal(P['sleep.untilMorningWindowEnd'],'05:00');
 const t=B.sleepTuning();assert.equal(t.windowStart,hm('18:00'));assert.equal(t.windowEnd,hm('05:00'));
 for(const [time,ok] of [['17:59',false],['18:00',true],['23:59',true],['00:00',true],['04:59',true],['05:00',false],['06:01',false],['12:00',false]])
  assert.equal(B.untilMorningAllowed(hm(time)),ok,time);
 const doc=JSON.parse(JSON.stringify(FILE));doc.params=doc.params.filter(p=>!/untilMorningWindow/.test(p.key));
 const win={__NJH_BALANCING_DOC__:doc,console};vm.runInNewContext(read('shared/njh-balancing.js'),{window:win,globalThis:win,URL,console});
 assert.equal(win.NJHBalancing.untilMorningAllowed(hm('12:00')),true);
});

test('06:01 and 17:59 are rejected; the button is disabled "Tidur sampai pagi (malam saja)"; manual 1-hour sleep still works',()=>{
 for(const time of ['06:01','17:59']){
  const h=harness();h.P.start();at(h,time);
  const r=h.P.runAction('sleep_until_morning',{});
  assert.equal(r.ok,false,time);assert.equal(r.closed,true);assert.match(r.reason,/malam/);
  assert.equal(h.P.sleepInfo(),null);
  assert.equal(JSON.stringify(labels(h)),JSON.stringify([{label:'Tidur sampai pagi (malam saja)',disabled:true}]),time);
  const m=h.P.runAction('sleep',{});assert.equal(m.ok,true,'manual sleep at '+time);assert.equal(m.untilMorning,false);
  h.P.runAction('wake');
 }
});

test('18:00 and 04:59 run all the way to 06:00 (button enabled)',()=>{
 for(const [time,mins] of [['18:00',12*60],['04:59',61]]){
  const h=harness();h.P.start();const s=at(h,time);const t0=s.elapsedMinutes;
  assert.equal(JSON.stringify(labels(h)),JSON.stringify([{label:'Tidur sampai pagi',disabled:false}]),time);
  const r=h.P.runAction('sleep_until_morning',{});assert.equal(r.ok,true,time);
  untilAwake(h);
  const e=h.P.state();
  assert.equal(hhmm(e),hm('06:00'),time);assert.equal(e.elapsedMinutes-t0,mins,time);
 }
});

test('UI copy: panel and kos bed use the same disabled label outside the window',()=>{
 assert.match(read('world-builder/semesta-life-play.js'),/'🌙 Tidur sampai pagi \(malam saja\)',\{\},true/);
 assert.match(read('world-builder/semesta-life-hooks.js'),/label:'Tidur sampai pagi \(malam saja\)',disabled:true/);
});

test('hook-listed actions render disabled in the native panel (so the Mainkan bar shows it disabled too)',()=>{
 assert.match(read('world-builder/semesta-life-play.js'),/\(a\.disabled\?' disabled title="'\+esc\(a\.hint\|\|''\)\+'"':''\)/);
});

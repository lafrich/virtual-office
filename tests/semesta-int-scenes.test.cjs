'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
const Scenes=require('../world-builder/semesta-int-scenes.js');
const LGR=require('/workspace/lgr-joint-wt/site/lgr-db.js');
const SLOT_DIR='/workspace/beraksi-int-slots';
const IDS=['njh_int_wc','njh_int_bed','njh_int_tree','njh_int_room','njh_int_npc_f','njh_int_npc_m'];

function canonical(v){
 if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).sort().filter(k=>v[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
function sha256(s){return crypto.createHash('sha256').update(s).digest('hex');}

test('6 slot files are importable lgr1-db beraksi and checksum matches',()=>{
 for(const id of IDS){
  const raw=JSON.parse(fs.readFileSync(path.join(SLOT_DIR,id+'.json'),'utf8'));
  assert.equal(raw.schema,'lgr1-db-file-v1');
  assert.equal(raw.kind,'beraksi');
  assert.equal(raw.id,id);
  assert.equal(raw.sha256,sha256(canonical(raw.entry)));
  const v=LGR.validateBeraksi(raw.entry);
  assert.equal(v.id,id);
  assert.equal(v.format,'lgr1-beraksi-v1');
  assert.ok(v.actors.length>=2);
  assert.ok(v.actors.every(a=>a.track.length&&a.gender));
 }
});

test('partner slots only offered to pacaran pairs; NPC slots need NPC gender',()=>{
 assert.equal(Scenes.canOffer('njh_int_bed',{partnered:false,context:'bed'}),false);
 assert.equal(Scenes.canOffer('njh_int_bed',{partnered:true,context:'bed'}),true);
 assert.equal(Scenes.canOffer('njh_int_npc_f',{npcGender:'male'}),false);
 assert.equal(Scenes.canOffer('njh_int_npc_f',{npcGender:'female'}),true);
 assert.equal(Scenes.canOffer('njh_int_npc_m',{npcGender:'male'}),true);
 const acts=Scenes.nearbySceneActions({partnered:true,context:'wc'});
 assert.ok(acts.some(a=>a.id==='scene:njh_int_wc'));
 assert.ok(!acts.some(a=>a.id==='scene:njh_int_bed'));
});

test('DB scene version replaces the in-code fallback after sync',()=>{
 Scenes.cache.clear();
 const first=Scenes.load('njh_int_wc');
 assert.equal(first.source,'fallback');
 const file=JSON.parse(fs.readFileSync(path.join(SLOT_DIR,'njh_int_wc.json'),'utf8'));
 Scenes.ingest(file.entry,{source:'db'});
 const synced=Scenes.load('njh_int_wc');
 assert.equal(synced.source,'db');
 assert.equal(synced.version,file.entry.rev);
 const v2=Object.assign({},file.entry,{rev:2,notes:file.entry.notes+' v2'});
 Scenes.ingest(v2,{source:'db'});
 const again=Scenes.load('njh_int_wc');
 assert.equal(again.version,2);
 assert.match(again.scene.notes,/v2/);
});

test('play emits start/end, pauses and resumes, plays both tracks',()=>{
 const ev=[];
 let paused=false;
 const r=Scenes.play('njh_int_room',{
  now:true,
  pause:()=>{paused=true;},
  resume:()=>{paused=false;},
  emit:(t,d)=>ev.push({t,d})
 });
 assert.equal(r.ok,true);
 assert.equal(r.tracks.length,2);
 assert.deepEqual(ev.map(e=>e.t),['mainkan:scene-start','mainkan:scene-end']);
 assert.equal(paused,false);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Publish=require('../shared/vlhub-characters-publish.js');
const Hub=require('../shared/hub-registry.js');

test('Mahluk characters publisher writes Semesta keys and VLHub characters topic',()=>{
 const store=new Map();
 const env={
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  console
 };
 env.VLHub=Hub.create(env);
 const seen=[];
 env.VLHub.subscribe('characters',msg=>seen.push(msg));
 const result=Publish.publish({
  name:'Audit Wardrobe',
  gender:'male',
  id:'mh2_auditward',
  sprite:'data:image/png;base64,aaa',
  clips:{
   idle:{sheet:'data:image/png;base64,idle',frames:1,frame_ms:[240]},
   walk:{sheet:'data:image/png;base64,walk',frames:4,frame_ms:[140,140,140,140]},
   run:{sheet:'data:image/png;base64,run',frames:2,frame_ms:[100,100]}
  }
 },env);
 assert.equal(result.ok,true);
 assert.equal(result.id,'mh2_auditward');
 assert.equal(result.v1Id,'custom_human_auditward');
 assert.deepEqual(result.unsupportedBySemestaClips,['run']);
 const v2=JSON.parse(store.get(Publish.V2_KEY));
 const v1=JSON.parse(store.get(Publish.V1_KEY));
 assert.equal(v2[0].format,'mahluk-2-character-v1');
 assert.equal(v2[0].template_base,'human_male_base');
 assert.ok(v2[0].clips.idle.sheet.startsWith('data:image/png'));
 assert.equal(v1[0].id,'custom_human_auditward');
 assert.equal(v1[0].source,'shared-base-rig');
 assert.equal(seen.length,1);
 assert.equal(seen[0].topic,'characters');
 assert.equal(seen[0].payload.source,'mahluk-hidup');
 assert.equal(seen[0].payload.project,'Namanya Juga Hidup: The Game');
 assert.equal(Hub.KEY_TO_TOPIC[Publish.V2_KEY],'characters');
 assert.equal(Hub.KEY_TO_TOPIC[Publish.V1_KEY],'characters');
});

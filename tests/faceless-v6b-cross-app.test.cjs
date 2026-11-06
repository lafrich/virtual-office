'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const PNG='data:image/png;base64,aGVsbG8=';
function root(sex,id){
 return {format:'mahluk-2-character-v1',version:1,id,
  name:'Human '+sex+' / No Face Nude',base:sex,
  facelessBase:sex,rigSystem:'v6b',presetRevision:'faceless-nude-v6b-v1',
  template_base:'human_'+sex+'_base',
  sprite:PNG,clips:{idle:{sheet:PNG,frames:1,frame_ms:[83],loop:true}},
  emotionPlane:{asset:'db:emotion-blink',placement:{se:{x:0,y:0,scale:1}}},
  pixelPlanes:{head:PNG}};
}
const male=root('male','mh2_cleanmale11'),female=root('female','mh2_cleanfemale12');
const storage=new Map([['mahluk-2-library-v1',JSON.stringify([male,female])]]);
const reset={
 active:true,visible:id=>/^mh2_[a-z0-9]+$/.test(id),
 filter:()=>[],message:'NEW RIG',approvedIds:[]
};
const window={VLCharacterReferenceReset:reset,VLPipelineAssets:{characters:[]}};
const context=vm.createContext({window,location:{origin:'https://lafrich.github.io'},
 localStorage:{getItem:k=>storage.get(k)||null},URL,AbortController,Map,console});
vm.runInContext(fs.readFileSync('world-builder/mahluk-hidup-bridge.js','utf8'),context);
vm.runInContext(fs.readFileSync('world-builder/pipeline-character-rig.js','utf8'),context);
test('Semesta and Bangun Ruang share installed V6B male/female roots even under legacy reset policy',async()=>{
 const status=await window.VLMahlukHidup.load();
 assert.equal(status.loaded,true);
 for(const r of [male,female]){
  const actor=window.VLMahlukHidup.get(r.id);
  assert.ok(actor,'Missing '+r.id);
  assert.equal(actor.v2,true);
  assert.equal(actor.v2RigSystem,'v6b');
  assert.equal(actor.v2FacelessBase,r.facelessBase);
  assert.equal(actor.baseId,r.template_base);
  assert.equal(actor.v2EmotionPlane.asset,'db:emotion-blink');
  assert.deepEqual(Array.from(actor.v2EditableBones).includes('head'),true);
  assert.equal(actor.v2Clips.idle.url,PNG);
  const pose=window.VLCharacterRig.resolve(r.id,'idle',false);
  assert.equal(pose.source,'mahluk2');
  assert.equal(pose.url,PNG);
  assert.equal(pose.separate,true);
 }
 assert.equal(window.VLMahlukHidup.list().filter(x=>x.v2).length,2);
});
test('JiWA reads the same canonical root storage without modifying mechanics',()=>{
 const html=fs.readFileSync('jiwa/index.html','utf8');
 const link=fs.readFileSync('jiwa/character-link.js','utf8');
 assert.match(html,/id="jiwaActor"/);
 assert.match(html,/id="jiwaActorPreview"/);
 assert.match(html,/id="jiwaSyncActors"/);
 assert.match(html,/character-link\.js\?v=/);
 assert.match(link,/mahluk-2-library-v1/);
 assert.match(link,/jiwa-sandbox-actor-v1/);
 assert.match(link,/e\.key===SOURCE/);
 assert.match(link,/row\.sprite/);
 assert.doesNotThrow(()=>new Function(link));
});
test('EMOSI.EXE remains the only editor for face assets, shared bridge carries asset ID not duplicate atlas',()=>{
 for(const id of [male.id,female.id]){
  const e=window.VLMahlukHidup.get(id);
  assert.equal(e.v2EmotionPlane.asset,'db:emotion-blink');
  assert.equal(Object.hasOwn(e.v2EmotionPlane,'png'),false);
 }
});

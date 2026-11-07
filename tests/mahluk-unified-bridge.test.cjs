'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
function read(name){return fs.readFileSync(path.join(root,name),'utf8')}
function bridgeWithStorage(records){
 const saved=new Map(Object.entries(records||{}));
 const win={localStorage:{getItem:k=>saved.get(k)||null},addEventListener(){},removeEventListener(){}};
 vm.runInNewContext(read('shared/mahluk-hub-bridge.js'),{window:win,console});
 return win.VLMahlukUnifiedBridge;
}
test('all 3 game editors load the same read-only Mahluk database bridge',()=>{
 for(const file of ['world-builder/index.html','world-builder/bangun-ruang/index.html','jiwa/index.html']){
  assert.ok(read(file).includes('mahluk-hub-bridge.js'),file);
 }
 assert.match(read('membangun/index.html'),/mahluk-hidup\.html/);
 assert.match(read('membangun/laptop.html'),/mahluk-hidup\.html/);
});
test('Mahluk situation is discoverable across apps, never directly playable while draft',()=>{
 const record={id:'sit_in_cafe',name:'Sit at Cafe',trigger:'interact',object:'chair',
  enter:'grok:sit_down',loop:'grok:sit_idle',exit:'grok:stand_up',status:'draft_unapproved',
  offsetX:0,offsetY:0};
 const b=bridgeWithStorage({
  'mahluk-action-situations-v1':JSON.stringify({format:'mahluk-situation-database-v1',items:[record]})
 });
 const list=b.situationDrafts();
 assert.equal(list.length,1);
 assert.equal(list[0].name,record.name);
 assert.equal(list[0].playable,false);
 assert.deepEqual(Array.from(b.playableActions()),[]);
});
test('Mahluk clip metadata never exposes large PNG layers to other apps',()=>{
 const b=bridgeWithStorage({'vl-v6p-act-clips-v1':JSON.stringify({format:'v6p-act-clips-store-v1',
  clips:{clp_test:{manifest:{name:'Test',frames:[{key:'f0',ms:140}]},
   layers:{'base/fx':'data:image/png;base64,REALLY-LARGE-ASSET'}}}})});
 const row=b.animationDrafts()[0];
 assert.equal(row.frames,1);
 assert.equal(row.playable,false);
 assert.equal('layers' in row,false);
});
test('shared hub observes action and animation updates',()=>{
 const Hub=require('../shared/hub-registry.js');
 assert.equal(Hub.KEY_TO_TOPIC['mahluk-action-situations-v1'],'actions');
 assert.equal(Hub.KEY_TO_TOPIC['vl-v6p-act-clips-v1'],'animations');
 assert.ok(Hub.TOPICS.includes('actions')&&Hub.TOPICS.includes('animations'));
});

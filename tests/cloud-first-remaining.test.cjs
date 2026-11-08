'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const hash=async v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const valid=x=>!!x&&typeof x==='object';
class Element{
 constructor(t){this.tagName=t;this.style={};this.children=[];this.textContent='';this.hidden=false}
 append(...x){this.children.push(...x)}
 prepend(...x){this.children.unshift(...x)}
 remove(){}
 setAttribute(){}
}
function bootstrap(path,window={}){
 const document={readyState:'complete',createElement:t=>new Element(t),body:new Element('body'),querySelector:()=>null,getElementById:()=>null};
 window.document=document;window.location={search:'',origin:'https://lafrich.github.io'};
 vm.runInNewContext(read(path),{window,document,URLSearchParams,console,setTimeout,clearTimeout,Event:function Event(n){this.type=n}}, {filename:path});
 return window;
}
function shell(){
 let config;
 return {mount:c=>(config=c,{exportUniversal:async()=>true,isReady:()=>false}),config:()=>config};
}
test('cloud-first source in Emosi/Jiwa/Mainkan parses, is non-destructive, and is loaded in exact native editors',()=>{
 const pairs=[
  ['emotion-studio/cloud-first-emosi-entry.js','emotion-studio/index.html'],
  ['jiwa/cloud-first-jiwa-entry.js','jiwa/index.html'],
  ['mainkan/cloud-first-flow-entry.js','mainkan/flow-editor.html']
 ];
 for(const [js,html] of pairs){
  assert.doesNotThrow(()=>new vm.Script(read(js)),js);
  assert.ok(read(html).includes(js.split('/').pop()),html+' missing '+js);
  assert.ok(!/localStorage\.(?:removeItem|clear)\s*\(/.test(read(js)),js+' removes browser data');
  assert.ok(!/indexedDB\.deleteDatabase/.test(read(js)),js+' deletes IndexedDB');
 }
 assert.doesNotThrow(()=>new vm.Script(read('shared/cloud-first-startup.js')));
 assert.doesNotThrow(()=>new vm.Script(read('jiwa/jiwa.js')));
 assert.doesNotThrow(()=>new vm.Script(read('jiwa/activity-editor.js')));
 assert.doesNotThrow(()=>new vm.Script(read('mainkan/flow-editor.js')));
 assert.ok(!read('mainkan/index.html').includes('cloud-first-flow-entry'));
});
test('Emosi: imported existing different ID is blocked without calling save',async()=>{
 let saves=0;const old={id:'emo1',name:'Older',png:'data:image/png;base64,AA'},incoming={...old,name:'Changed'};
 const D={connected:()=>true,documentFor:o=>({entries:[o]}),list:async()=>[{id:'f1',name:'emo1.emotion.json'}],
  loadOne:async()=>old,save:async()=>{saves++;return {project:{id:'f1'}}},loadAll:async()=>({entries:[old],errors:[]})};
 const Gate=shell();
 const w=bootstrap('emotion-studio/cloud-first-emosi-entry.js',
  {MembangunUniversal:{hash},MembangunCloudStartup:Gate,EmotionDrive:D,EmosiCloudBridge:{reconcile:async()=>({verified:true})},
   MH2UniversalEmotions:{validEntry:valid}});
 const adapter=Gate.config().adapter;
 const rows=await adapter.loadAll();assert.equal(rows.count,1);
 await assert.rejects(adapter.upload({app:'emosi',kind:'emotion',id:'emo1',data:incoming}),/CLOUD CONFLICT/);
 assert.equal(saves,0);
});
test('Emosi: verified new upload is read back from the actual native Drive project',async()=>{
 const item={id:'emonew',name:'Smile',png:'data:image/png;base64,AA'},files=[];
 const D={connected:()=>true,documentFor:o=>({entries:[o]}),list:async()=>[],
  save:async o=>{files.push(o);return {project:{id:'new-file'}}},
  loadOne:async()=>files[0],loadAll:async()=>({entries:files,errors:[]})};
 const Gate=shell();
 bootstrap('emotion-studio/cloud-first-emosi-entry.js',
 {MembangunUniversal:{hash},MembangunCloudStartup:Gate,EmotionDrive:D,EmosiCloudBridge:{reconcile:async()=>({verified:true})},
  MH2UniversalEmotions:{validEntry:valid}});
 const a=Gate.config().adapter;
 const r=await a.upload({app:'emosi',kind:'emotion',id:'emonew',data:item});
 assert.equal(r.verified,true);
 assert.equal((await a.readback({id:'emonew'},r)).data.name,'Smile');
});
test('Jiwa: local-only mechanics projects are uploaded with verified readback',async()=>{
 const project={cityId:'__jiwa_global__',updatedAt:'2026-11-08',bindings:{}};
 let rows=[],uploaded=0;
 const Drive={create:()=>({
  connect:async()=>true,connected:()=>true,loadAll:async()=>({verified:true,records:rows,count:rows.length}),
  upload:async row=>{uploaded++;rows.push(row);return{verified:true,id:row.id}},
  readback:async row=>row,exportRows:async()=>rows
 })};
 const Gate=shell();
 const w=bootstrap('jiwa/cloud-first-jiwa-entry.js',{MembangunUniversal:{hash},
  MembangunCloudStartup:Gate,MembangunCloudFirstDrive:Drive,
  JiwaCloudProjects:{list:async()=>[project],idFor:id=>id==='__jiwa_global__'?'global-foundation':id,
   putNew:async()=>{},reload:async()=>{}},
  JiwaActivityEditor:{hasLocal:()=>false,get:()=>({}),applyCloud:()=>{}},
  JiwaActivities:{FORMAT:'jiwa-activity-catalog-v1'}
 });
 const result=await w.JiwaCloudEntry.reconcile();
 assert.equal(result.uploaded,1);assert.equal(uploaded,1);assert.equal(rows[0].id,'global-foundation');
});
test('Jiwa: conflicting remote and browser projects are rejected without mutation',async()=>{
 const local={cityId:'test',updatedAt:'2026-11-08',bindings:{a:{}}};
 const remote={app:'jiwa',kind:'mechanics',id:'test',data:{cityId:'test',updatedAt:'2026-11-08',bindings:{b:{}}}};
 let uploaded=0,applied=0;
 const Drive={create:()=>({connected:()=>true,loadAll:async()=>({verified:true,records:[remote]}),
  upload:async()=>{uploaded++},readback:async()=>{},exportRows:async()=>[]})};
 const Gate=shell();
 const w=bootstrap('jiwa/cloud-first-jiwa-entry.js',{MembangunUniversal:{hash},MembangunCloudStartup:Gate,
  MembangunCloudFirstDrive:Drive,
  JiwaCloudProjects:{list:async()=>[local],idFor:x=>x,putNew:async()=>{applied++},reload:async()=>{}},
  JiwaActivityEditor:{hasLocal:()=>false,get:()=>null,applyCloud:()=>{applied++}},
  JiwaActivities:{FORMAT:'jiwa-activity-catalog-v1'}});
 await assert.rejects(w.JiwaCloudEntry.reconcile(),/CONFLICT/);
 assert.equal(uploaded,0);assert.equal(applied,0);
});
test('Mainkan: cloud import validates normalized flow and does not touch player state',async()=>{
 const first={format:'mainkan-flow-v1',name:'Default',start:'one',nodes:[{id:'one'}]};
 let applied=null;const Gate=shell(),files=[];
 const D={create:()=>({connect:async()=>true,connected:()=>true,loadAll:async()=>({verified:true,records:files}),
  upload:async r=>{files.push(r);return{verified:true,id:r.id}},readback:async r=>r,exportRows:async()=>files})};
 const w=bootstrap('mainkan/cloud-first-flow-entry.js',{MembangunUniversal:{hash},MembangunCloudStartup:Gate,
  MembangunCloudFirstDrive:D,MainkanFlow:{normalize:v=>{if(!v?.nodes)throw Error('Invalid flow');return v}},
  MainkanFlowCloudBridge:{get:()=>first,apply:v=>{applied=v},onEdit:()=>{}}});
 const cfg=Gate.config();
 await cfg.adapter.apply([{app:'mainkan',kind:'flow',id:'main-flow',data:first}]);
 assert.equal(applied.name,'Default');
 await assert.rejects(cfg.adapter.upload({app:'mainkan',kind:'flow',id:'other-flow',data:first}),/exactly one/);
 assert.ok(w.MainkanCloudEntry.gate);
});

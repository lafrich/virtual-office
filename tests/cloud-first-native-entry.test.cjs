const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const U=require("../shared/cloud-first-universal.js");
const SOURCE=fs.readFileSync("shared/cloud-first-native-entry.js","utf8");
function make(records=[],stats={imported:1,uploaded:0,failed:0,conflicts:0}){
 class Elem{
  constructor(tag){this.tag=tag;this.children=[];this.style={};this.hidden=false;this.disabled=false;this.textContent="";this.removed=false}
  append(...nodes){this.children.push(...nodes)}
  remove(){this.removed=true}
  setAttribute(k,v){this[k]=v}
  click(){return this.onclick?.()}
 }
 const nodes=[],document={createElement(t){const e=new Elem(t);nodes.push(e);return e},body:new Elem("body")};
 let online=false,connects=0,uploads=0,saveCalls=[],syncCalls=0,db=records.map(r=>({...r}));
 const D={
  connected:()=>online,connect:async()=>{online=true;connects++},
  validateRecord:(app,kind,record)=>{assert.equal(app,record.app);assert.equal(kind,record.kind);return record.id},
  filename:(kind,id)=>kind+"--"+id+".json",
  list:async(app,kind)=>db.filter(r=>r.app===app&&r.kind===kind).map(r=>({id:r.id,name:kind+"--"+r.id+".json",kind:r.kind})),
  save:async(app,kind,record)=>{uploads++;saveCalls.push({app,kind,record});let r={app,kind,id:record.id,data:record};db.push(r);return{file:{id:r.id,name:kind+"--"+r.id+".json"}}},
  load:async f=>{const r=db.find(x=>x.id===f.id);if(!r)throw Error("not found");return{app:r.app,kind:r.kind,id:r.id,record:r.data}},
 };
 const window={document,confirm:()=>true,MembangunUniversal:U,MembangunCloudDrive:D,
  MembangunCloudUI:{syncOnConnect:async()=>{syncCalls++;return stats}}};
 const context={window,document,console,Blob,URL,setTimeout};
 vm.runInNewContext(SOURCE,context);
 const button=s=>nodes.find(n=>n.tag==="button"&&n.textContent.includes(s));
 return{window,D,nodes,button,db,stats,connects:()=>connects,uploads:()=>uploads,syncCalls:()=>syncCalls,saveCalls};
}
test("native startup waits for verified Drive reconciliation",async()=>{
 const m=make();const gate=m.window.MembangunNativeCloudEntry.init({app:"semesta"});
 assert.equal(gate.isReady(),false);
 await m.button("SYNC GOOGLE DRIVE").onclick();
 assert.equal(gate.isReady(),true);
 assert.equal(m.connects(),1);
 assert.equal(m.syncCalls(),1);
});
test("native startup refuses to unlock when Drive found conflicts",async()=>{
 const m=make([],{imported:0,uploaded:0,conflicts:1,failed:0});
 const gate=m.window.MembangunNativeCloudEntry.init({app:"bangun"});
 await m.button("SYNC GOOGLE DRIVE").onclick();
 assert.equal(gate.isReady(),false);
 assert.equal(m.uploads(),0);
});
test("validated manual import uploads into native Drive before opening",async()=>{
 const m=make();const gate=m.window.MembangunNativeCloudEntry.init({app:"semesta"});
 const record={app:"semesta",kind:"city",id:"new",data:{app:"semesta",kind:"city",id:"new",format:"vl-city-draft-1",document:{objects:[]}}};
 const packageFile=await U.pack([record]);
 const input=m.nodes.find(n=>n.tag==="input");
 input.files=[{size:500,text:async()=>JSON.stringify(packageFile)}];
 await input.onchange();
 await m.button("UPLOAD IMPORT TO DRIVE").onclick();
 assert.equal(gate.isReady(),true);
 assert.equal(m.uploads(),1);
 assert.equal(m.syncCalls(),1);
});
test("manual import rejects different existing Drive record without saving",async()=>{
 const r={app:"bangun",kind:"building",id:"warteg",
  data:{app:"bangun",kind:"building",id:"warteg",config:{v:1},views:{se:"old"}}};
 const m=make([r]);
 const gate=m.window.MembangunNativeCloudEntry.init({app:"bangun"});
 const different={app:"bangun",kind:"building",id:"warteg",data:{...r.data,config:{v:2}}};
 const bundle=await U.pack([different]);const input=m.nodes.find(n=>n.tag==="input");
 input.files=[{size:600,text:async()=>JSON.stringify(bundle)}];await input.onchange();
 await m.button("UPLOAD IMPORT TO DRIVE").onclick();
 assert.equal(gate.isReady(),false);assert.equal(m.uploads(),0);
});
test("cross-app import is blocked before upload, local data untouched",async()=>{
 const m=make();const gate=m.window.MembangunNativeCloudEntry.init({app:"semesta"});
 const r={app:"bangun",kind:"building",id:"x",data:{app:"bangun",kind:"building",id:"x",views:{}}};
 const f=await U.pack([r]);const input=m.nodes.find(n=>n.tag==="input");
 input.files=[{size:400,text:async()=>JSON.stringify(f)}];await input.onchange();
 assert.equal(m.button("UPLOAD IMPORT TO DRIVE").hidden,true);
 assert.equal(gate.isReady(),false);assert.equal(m.uploads(),0);
});
test("startup integration is loaded in both production pages",()=>{
 for(const html of ["world-builder/index.html","world-builder/bangun-ruang/index.html"]){
  const source=fs.readFileSync(html,"utf8");
  assert.ok(source.includes("cloud-first-universal.js"));
  assert.ok(source.includes("cloud-first-native-entry.js"));
  assert.ok(source.includes("MembangunNativeCloudEntry.init"));
 }
});
test("cloud entry never deletes local or IndexedDB records",()=>{
 assert.ok(!/localStorage\.(?:clear|removeItem)\s*\(/.test(SOURCE));
 assert.ok(!/indexedDB\.deleteDatabase\s*\(/.test(SOURCE));
 assert.ok(!/localStorage\s*\.\s*setItem\s*\(/.test(SOURCE));
});

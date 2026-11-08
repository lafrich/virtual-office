const test=require("node:test"),assert=require("node:assert/strict");
const U=require("../shared/cloud-first-universal.js");
function dom(){
 const all=[];
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.style={};
   this.hidden=false;this.disabled=false;this.textContent="";this.files=null;this.removed=false;
   all.push(this)}
  append(...kids){this.children.push(...kids)}
  setAttribute(k,v){this.attributes[k]=v}
  remove(){this.removed=true}
  click(){if(this.onclick)return this.onclick()}
 }
 const document={createElement:t=>new Element(t),body:new Element("body")};
 const window={document,MembangunUniversal:U};
 global.window=window;
 delete require.cache[require.resolve("../shared/cloud-first-startup.js")];
 const UI=require("../shared/cloud-first-startup.js");
 const nodes=tag=>all.filter(x=>x.tagName===tag);
 const button=t=>nodes("button").find(x=>x.textContent.includes(t));
 return{window,UI,nodes,button};
}
function driver(overrides={}){
 const db={connect:async()=>true,loadAll:async()=>({verified:true,records:[]}),
  upload:async()=>({verified:true}),readback:async row=>row,
  apply:async()=>{},exportRows:async()=>[],...overrides};
 return db;
}
test("Startup blocks entry until Drive sync returns verified records",async()=>{
 const d=dom(),events=[];
 const ui=d.UI.mount({app:"semesta",adapter:driver({
  loadAll:async()=>{events.push("verified-load");return{verified:true,records:[]}},
  cleanup:async()=>events.push("cleanup")}),
  onReady:async()=>events.push("editor")});
 assert.equal(ui.isReady(),false);
 await d.button("SYNC FROM DRIVE").onclick();
 assert.equal(ui.isReady(),true);assert.equal(ui.view.removed,true);
 assert.deepEqual(events,["verified-load","editor","cleanup"]);
});
test("Unverified sync keeps editor locked and does not clean data",async()=>{
 const d=dom();let applied=false,cleaned=false;
 const ui=d.UI.mount({app:"mahluk",adapter:driver({
  loadAll:async()=>({verified:false}),cleanup:async()=>{cleaned=true}}),
  onReady:async()=>{applied=true}});
 await d.button("SYNC FROM DRIVE").onclick();
 assert.equal(ui.isReady(),false);assert.equal(ui.view.removed,false);
 assert.equal(applied,false);assert.equal(cleaned,false);
});
test("Manual file must pass Drive verification before editor starts",async()=>{
 const d=dom();let applied=false,entered=false;const rec={app:"semesta",kind:"city",id:"test",data:{value:1}};
 const packet=await U.pack([rec]);
 const ui=d.UI.mount({app:"semesta",adapter:driver({
  upload:async()=>({verified:true}),readback:async()=>({...rec,data:{corrupt:true}}),
  apply:async()=>{applied=true}}),
  onReady:async()=>{entered=true}});
 d.button("IMPORT UNIVERSAL").onclick();
 const file=d.nodes("input")[0];file.files=[{size:100,text:async()=>JSON.stringify(packet)}];
 await file.onchange();
 await d.button("CONNECT & UPLOAD IMPORT").onclick();
 assert.equal(ui.isReady(),false);assert.equal(applied,false);assert.equal(entered,false);
});
test("Verified manual import unlocks editor after readback and hydration",async()=>{
 const d=dom();const trace=[],rec={app:"semesta",kind:"city",id:"test",data:{value:42}};
 const packet=await U.pack([rec]);
 const ui=d.UI.mount({app:"semesta",adapter:driver({
  upload:async()=>{trace.push("upload");return{verified:true}},
  readback:async()=>{trace.push("readback");return rec},
  apply:async()=>trace.push("import-applied"),
  loadAll:async()=>{trace.push("cloud-load");return{verified:true,records:[rec]}},
  cleanup:async()=>trace.push("cleanup")}),
  onReady:async()=>trace.push("editor")});
 const file=d.nodes("input")[0];file.files=[{size:100,text:async()=>JSON.stringify(packet)}];
 await file.onchange();
 await d.button("CONNECT & UPLOAD IMPORT").onclick();
 assert.equal(ui.isReady(),true);
 assert.deepEqual(trace,["upload","readback","import-applied","cloud-load","editor","cleanup"]);
});

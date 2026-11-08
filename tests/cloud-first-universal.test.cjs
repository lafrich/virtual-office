const {test}=require("node:test"),assert=require("node:assert/strict");
const U=require("../shared/cloud-first-universal.js");
const a={app:"semesta",kind:"city",id:"jakarta-city",data:{format:"vl-city-draft-1",document:{objects:[]}}};
test("Universal roundtrip for multiple apps",async()=>{
 const b={app:"bangun",kind:"building",id:"warteg",data:{views:{}}};
 const f=await U.pack([a,b]);const parsed=await U.unpack(JSON.stringify(f));
 assert.equal(parsed.records.length,2);
});
test("Checksum rejects edited file",async()=>{
 const f=await U.pack([a]);f.records[0].data.document.objects.push({id:"x"});
 await assert.rejects(U.unpack(JSON.stringify(f)),/checksum/);
});
test("Manual import never applies without verified readback",async()=>{
 const f=await U.pack([a]);let applied=false;
 await assert.rejects(U.syncImported(JSON.stringify(f),{
  upload:async()=>({verified:true}),readback:async()=>({...a,data:{wrong:true}}),
  apply:async()=>{applied=true}
 }),/readback failed/);
 assert.equal(applied,false);
});
test("Manual import applies after verified upload and readback",async()=>{
 const f=await U.pack([a]);let applied=0;
 const out=await U.syncImported(JSON.stringify(f),{
  upload:async()=>({verified:true}),readback:async()=>a,apply:async()=>{applied++}
 });
 assert.equal(applied,1);assert.equal(out.count,1);
});
test("Cleanup deletes only verified and unchanged browser keys",async()=>{
 const f=await U.pack([a]),r={...f.records[0],verified:true};
 const map=new Map([["city","original"],["unrelated","keep"]]);
 const store={getItem:k=>map.get(k)??null,removeItem:k=>map.delete(k)};
 const result=U.cleanupSynced(store,[{...r,key:"city",value:"original"},
  {...r,key:"unrelated",value:"stale"}],[r]);
 assert.deepEqual(result.removed,["city"]);assert.equal(map.get("unrelated"),"keep");
});
test("No proof means no cleanup",async()=>{
 const f=await U.pack([a]),r={...f.records[0],key:"draft",value:"data"};
 const map=new Map([["draft","data"]]);
 const result=U.cleanupSynced({getItem:k=>map.get(k),removeItem:k=>map.delete(k)},[r],[]);
 assert.equal(result.removed.length,0);assert.equal(map.get("draft"),"data");
});
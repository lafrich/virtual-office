// Mock Google Drive API to exercise the production adapter without real user tokens.
const {test}=require("node:test"),assert=require("node:assert/strict");
const U=require("../shared/cloud-first-universal.js");
function setup(){
 const files=new Map();let seq=0;let failNext=false;let tokenFail=false;
 const mk=(data,metadata)=>({ok:true,json:async()=>data,text:async()=>typeof data==="string"?data:JSON.stringify(data)});
 const create=(name,mime,parent,body)=>{
  const id="drive-"+(++seq);
  const f={id,name,mimeType:mime,parents:[parent],version:"1",modifiedTime:new Date().toISOString(),body:body||""};
  files.set(id,f);return f;
 };
 global.window={
  MembangunUniversal:U,
  google:{accounts:{oauth2:{initTokenClient(opts){
   return {requestAccessToken(){if(tokenFail)opts.error_callback({message:"denied"});else opts.callback({access_token:"mock",expires_in:3600})}};
  }}}}
 };
 global.fetch=async(url,options={})=>{
  if(failNext){failNext=false;return{ok:false,status:503,json:async()=>({error:{message:"simulated outage"}})}}
  const u=new URL(url),path=u.pathname,method=options.method||"GET";
  if(method==="GET"&&path==="/drive/v3/files"){
   const query=u.searchParams.get("q")||"";
   const parent=(query.match(/'([^']+)' in parents/)||[])[1];
   const name=(query.match(/name = '([^']+)'/)||[])[1];
   const mime=(query.match(/mimeType = '([^']+)'/)||[])[1];
   const matching=[...files.values()].filter(f=>f.parents.includes(parent)&&(!name||f.name===name)&&(!mime||f.mimeType===mime));
   return mk({files:matching.map(({id,name,version,modifiedTime,mimeType})=>({id,name,version,modifiedTime,mimeType}))});
  }
  if(method==="POST"&&path==="/drive/v3/files"){
   const m=JSON.parse(options.body),f=create(m.name,m.mimeType,m.parents[0]);
   return mk({id:f.id});
  }
  if(method==="GET"&&/^\/drive\/v3\/files\/drive-\d+$/.test(path)){
   const f=files.get(path.split("/").pop());
   return f?mk(f.body):{ok:false,status:404,json:async()=>({})};
  }
  if(method==="POST"&&path==="/upload/drive/v3/files"){
   // Multipart: boundary separates metadata then complete JSON payload.
   const body=await options.body.text();
   const parts=body.split(/--cf_[a-z0-9]+/).filter(s=>s.includes("Content-Type:"));
   const meta=JSON.parse(parts[0].slice(parts[0].indexOf("\r\n\r\n")+4).trim());
   const data=parts[1].slice(parts[1].indexOf("\r\n\r\n")+4).trim();
   const f=create(meta.name,meta.mimeType,meta.parents[0],data);return mk({id:f.id});
  }
  if(method==="PATCH"&&/^\/upload\/drive\/v3\/files\/drive-\d+$/.test(path)){
   const f=files.get(path.split("/").pop());if(!f)return{ok:false,status:404,json:async()=>({})};
   f.body=options.body;f.version=String(Number(f.version)+1);
   f.modifiedTime=new Date().toISOString();return mk({id:f.id});
  }
  throw Error("Unexpected Drive request: "+method+" "+url);
 };
 delete require.cache[require.resolve("../shared/cloud-first-drive.js")];
 const Cloud=require("../shared/cloud-first-drive.js");
 return{Cloud,files,fail(){failNext=true},deny(){tokenFail=true}};
}
const asset={app:"semesta",kind:"city",id:"jakarta",data:{objects:[{id:"pohon"}],v:1}};
test("Drive first-boot starts empty and persists verified records",async()=>{
 const m=setup(),db=m.Cloud.create("semesta");
 await db.connect();assert.deepEqual((await db.loadAll()).records,[]);
 const ack=await db.upload(asset);assert.equal(ack.verified,true);
 assert.deepEqual(await db.readback(asset,ack),asset);
 const list=await db.loadAll();assert.equal(list.count,1);
 assert.deepEqual(list.records[0],asset);
 const exportRows=await db.exportRows();assert.deepEqual(exportRows,[asset]);
});
test("Drive survives a new session and allows safe updates after reading",async()=>{
 const m=setup(),first=m.Cloud.create("semesta");await first.connect();
 await first.upload(asset);
 const fresh=m.Cloud.create("semesta");await fresh.connect();
 await fresh.loadAll();const next={...asset,data:{objects:[{id:"pohon"},{id:"lampu"}],v:2}};
 const ack=await fresh.upload(next);
 assert.equal(ack.verified,true);assert.deepEqual(await first.readback(next,ack),next);
});
test("Drive rejects stale-device overwrites without silent last-writer-wins",async()=>{
 const m=setup(),a=m.Cloud.create("semesta"),b=m.Cloud.create("semesta");
 await a.connect();await b.connect();
 await a.upload(asset);await a.loadAll();await b.loadAll();
 await a.upload({...asset,data:{v:2}});
 await assert.rejects(b.upload({...asset,data:{v:3}}),/CLOUD CONFLICT/);
});
test("Interrupted upload never reports verified or changes the remote copy",async()=>{
 const m=setup(),db=m.Cloud.create("semesta");await db.connect();await db.upload(asset);
 const rowsBefore=(await db.loadAll()).records;
 m.fail();
 await assert.rejects(db.upload({...asset,data:{v:22}}),/503/);
 assert.deepEqual((await db.loadAll()).records,rowsBefore);
});
test("OAuth cancellation blocks entry before any Drive access",async()=>{
 const m=setup();m.deny();await assert.rejects(m.Cloud.create("semesta").connect(),/denied/);
});
test("Mixed universal imports can be verified across app folders",async()=>{
 const m=setup(),cloud=m.Cloud.create("semesta");await cloud.connect();
 const records=[asset,{app:"bangun",kind:"building",id:"warteg",data:{views:{},rig:1}}];
 const universal=await U.pack(records);
 let calls=0;
 const result=await U.syncImported(JSON.stringify(universal),{
  upload:r=>cloud.upload(r),readback:(r,ack)=>cloud.readback(r,ack),
  apply:async()=>{calls++}
 });
 assert.equal(result.count,2);assert.equal(calls,1);
 assert.equal((await cloud.loadAll()).count,1);
 const build=m.Cloud.create("bangun");await build.connect();assert.equal((await build.loadAll()).count,1);
});

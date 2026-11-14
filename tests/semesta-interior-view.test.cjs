'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const V=require('../world-builder/semesta-interior-view.js');
const DIR=path.join(__dirname,'..','world-builder','njh-play-interiors');
const catalog=JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8'));

function scenes(){
 return fs.readdirSync(DIR).filter(f=>f.endsWith('.interior-scene.json')).map(f=>{
  const sc=JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8'));
  return {file:f,scene:sc};
 });
}
function propHeight(assetId){
 const id=V.artId(assetId);
 const typ=(catalog.items||catalog)[id]||(catalog.items||catalog)[assetId];
 const view=typ&&(typ.sw||typ.se||Object.values(typ)[0]);
 const h=(view?.size||[64,64])[1];
 return V.spriteSize(1,h).h;
}
function propsFor(scene,origin){
 const o=origin||{x:240,z:0};
 return (scene.items||[]).map(it=>{
  const typ=(catalog.items||catalog)[V.artId(it.assetId)]||{};
  const view=typ.sw||typ.se||{};
  const foot=view.footprint||[1,1];
  const rot=Number(it.rotation)||0;
  let fw=foot[0]||1,fd=foot[1]||1;if(rot%180===90){const t=fw;fw=fd;fd=t;}
  return {id:it.assetId+'@'+it.c+','+it.r,assetId:it.assetId,
   x:o.x+Number(it.c||0)+fw/2,z:o.z+Number(it.r||0)+fd/2,h:propHeight(it.assetId)};
 });
}

test('sprite plane size is at least the PNG opaque height in world units',()=>{
 for(const [id,views] of Object.entries(catalog.items||catalog)){
  const view=views.sw||views.se||Object.values(views)[0];
  const file=path.join(DIR,'art',view.file);
  assert.equal(fs.existsSync(file),true,id+' art missing');
  const size=view.size;assert.ok(size&&size[1]>0,id+' has size');
  const plane=V.spriteSize(size[0],size[1]);
  assert.ok(plane.h+1e-9>=size[1]*V.PIXEL_WORLD*V.VERTICAL_COMP-1e-9,id+' plane shorter than art');
  assert.ok(plane.w+1e-9>=size[0]*V.PIXEL_WORLD-1e-9,id+' plane narrower than art');
 }
});

test('tight door camera (viewSize 8) clips back-wall kost furniture — the bug we guard against',()=>{
 const kost=scenes().find(s=>s.file.startsWith('njh_kos')).scene;
 const origin={x:240,z:0};
 const props=propsFor(kost,origin);
 const door={x:origin.x+4.5,y:0,z:origin.z+5.5};
 const clipped=V.clippedProps(props,door,8,1280/760);
 assert.ok(clipped.some(c=>c.id.startsWith('bed')||c.id.startsWith('wardrobe')),
  'regression: door/viewSize 8 must still be detected as clipping the bed/wardrobe');
 assert.ok(clipped.every(c=>c.reason==='frustum-top'||c.reason==='frustum'));
});

test('fitInteriorCamera frames every catalog interior, including tallest back-wall props',()=>{
 const origin={x:240,z:0};
 for(const {file,scene} of scenes()){
  const props=propsFor(scene,origin);
  const fit=V.fitInteriorCamera({
   origin,width:scene.width||8,depth:scene.depth||6,props,aspect:1280/760,pad:1.22,
   inset:V.playInset()
  });
  assert.equal(fit.clipped.length,0,file+' still clipped: '+(fit.clipped.map(c=>c.id).join(',')));
  const again=V.clippedProps(props,fit.focus,fit.viewSize,1280/760);
  assert.equal(again.length,0,file+' clipped at fitted view '+fit.viewSize);
  assert.ok(fit.viewSize>=8);
 }
});

test('iso cutaway never draws the near-side wall that would occlude props',()=>{
 const walls=V.farWalls(V.ISO_DIRECTION);
 assert.equal(walls.back,true);
 assert.equal(walls.left,true);
 assert.equal(walls.right,false,'+X+Z iso camera: right wall is near and must stay down');
 assert.equal(walls.front,false,'entrance wall stays open');
 const opp=V.farWalls({x:-1,y:1,z:-1});
 assert.equal(opp.right,true);assert.equal(opp.front,true);
 assert.equal(opp.left,false);assert.equal(opp.back,false);
});

test('no clipping-plane API is used; walls are a cutaway, not a clip volume',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','world-builder','njh-play-interiors.js'),'utf8');
 const shared=fs.readFileSync(path.join(__dirname,'..','world-builder','semesta-interior-view.js'),'utf8');
 assert.doesNotMatch(src,/clippingPlanes/);
 assert.doesNotMatch(shared,/clippingPlanes/);
 assert.match(src,/VLSemestaInteriorView/);
 assert.match(src,/farWalls/);
 assert.match(src,/fitInteriorCamera/);
});

test('Kharisma layout is the play warteg, Ellen warung remains as fallback',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','world-builder','index.html'),'utf8');
 const play=fs.readFileSync(path.join(__dirname,'..','world-builder','njh-play-interiors.js'),'utf8');
 assert.match(play,/njh_warteg_kharisma/);
 assert.match(play,/njh_warung_makan/);
 const k=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warteg_kharisma.interior-scene.json'),'utf8'));
 const e=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warung_makan.interior-scene.json'),'utf8'));
 assert.equal(k.name,'Warteg Kharisma Bahari');
 assert.equal(k.width,8);assert.equal(k.depth,6);
 assert.equal(k.entrance.c,3);assert.equal(k.entrance.r,5);
 assert.equal(k.items.length,15);
 assert.deepEqual(k.items.map(i=>i.assetId),[
  'shelf','shelf','fridge','stove','counter','counter','cashier','kitchen_sink',
  'table','table','chair','chair','chair','chair','npc_ibu_warteg']);
 assert.equal(e.items.length,13,'generic Ellen layout kept on disk as fallback');
 assert.match(html,/semesta-interior-view.js/);
});

const ROOT=path.join(__dirname,'..');
function viewOf(assetId){
 const typ=(catalog.items||catalog)[V.artId(assetId)]||(catalog.items||catalog)[assetId]||{};
 return typ.sw||typ.se||{};
}
function propsFromScene(scene,origin){
 const o=origin||{x:0,z:0};
 const w=scene.width||8,d=scene.depth||6;
 return (scene.items||[]).map((it,i)=>{
  const typ=(catalog.items||catalog)[V.artId(it.assetId)]||(catalog.items||catalog)[it.assetId]||{};
  const view=typ.sw||typ.se||{};
  let fw=numFoot(it,view)[0],fd=numFoot(it,view)[1];
  const snap=V.snapFootprint(it.c,it.r,fw,fd,w,d);
  const x=o.x+snap.c+snap.fw/2,z=o.z+snap.r+snap.fd/2;
  const size=view.size||estSize(snap.fw,snap.fd);
  const pivot=view.pivot||[size[0]/2,size[1]*0.8];
  const h=V.spriteSize(1,size[1]).h;
  return {id:(it.assetId||'prop')+'@'+snap.c+','+snap.r+'#'+i,assetId:it.assetId,
   x,z,c:snap.c,r:snap.r,fw:snap.fw,fd:snap.fd,footprint:[snap.fw,snap.fd],
   size,pivot,h,height:h};
 });
}
function numFoot(it,view){
 let fw=(view.footprint||[it.fw||it.w||1,it.fd||it.d||1])[0];
 let fd=(view.footprint||[it.fw||it.w||1,it.fd||it.d||1])[1];
 if(it.fw)fw=it.fw;if(it.fd)fd=it.fd;
 if((Number(it.rotation)||0)%180===90){const t=fw;fw=fd;fd=t;}
 return [fw,fd];
}
function estSize(fw,fd){return [Math.round(64*Math.max(1,fw)+5),Math.round(56*Math.max(1,Math.max(fw,fd))+24)];}

function indonesiaScenes(){
 const vm=require('node:vm');
 const code=fs.readFileSync(path.join(ROOT,'world-builder/bangun-ruang/indonesia-interior-templates.js'),'utf8');
 const sandbox={window:{}};
 vm.runInNewContext(code,sandbox);
 const pack=sandbox.window.VLIndonesiaInteriorPack;
 if(!pack)return [];
 return Object.entries(pack.templates).map(([id,t])=>{
  const width=(t.min&&t.min[0])||8,depth=(t.min&&t.min[1])||6;
  const items=(t.items||[]).map((row,i)=>{
   const assetId=row[0],u=Number(row[1])||0,v=Number(row[2])||0,rot=Number(row[3])||0;
   const typ=pack.types[assetId]||{};
   return {id:assetId+'-'+i,assetId,c:u*width,r:v*depth,fw:typ.w||1,fd:typ.d||1,rotation:rot};
  });
  return {file:'indonesia:'+id,source:'indonesia-interior-pack',scene:{id,name:t.label,width,depth,items,theme:t.theme,entrance:{c:Math.floor(width/2),r:depth-1}}};
 });
}
function kharismaTemplateScene(){
 const text=fs.readFileSync(path.join(ROOT,'world-builder/bangun-ruang/warteg-kharisma-template.js'),'utf8');
 const m=text.match(/const placements=\[([\s\S]*?)\];/);
 if(!m)return null;
 const items=[];
 const re=/\['([^']+)',\s*(\d+)\s*,\s*(\d+)(?:,\s*'[^']*'(?:,\s*'[^']*'(?:,\s*(\d+))?)?)?/g;
 let row;
 while((row=re.exec(m[1])))items.push({id:row[1]+'@'+row[2]+','+row[3],assetId:row[1],c:+row[2],r:+row[3],rotation:+(row[4]||0)});
 return {file:'bangun-ruang:warteg-kharisma-template',source:'warteg-kharisma-template',
  scene:{id:'warteg-kharisma-template',name:'Warteg Kharisma Bahari',width:8,depth:6,entrance:{c:3,r:5},items}};
}
function allRepoInteriorScenes(){
 const list=scenes(); // play interiors JSON
 const seen=new Set(list.map(s=>'json:'+s.file));
 const extra=indonesiaScenes();
 const k=kharismaTemplateScene();
 if(k)extra.unshift(k);
 for(const s of extra){
  const key=s.file;
  if(seen.has(key))continue;
  seen.add(key);list.push(s);
 }
 return list;
}

test('MUST policy: floor and far walls do not write depth over prop sprites',()=>{
 assert.equal(V.DRAW_POLICY.floor.depthWrite,false);
 assert.equal(V.DRAW_POLICY.walls.depthWrite,false);
 assert.equal(V.DRAW_POLICY.ground.depthWrite,false);
 const src=fs.readFileSync(path.join(ROOT,'world-builder','njh-play-interiors.js'),'utf8');
 assert.match(src,/depthWrite:false/);
 assert.match(src,/snapFootprint/);
 // wall materials explicitly drop depth writes
 assert.equal((src.match(/depthWrite:false/g)||[]).length>=3,true);
});

test('a depth-writing floor is the bug: it diagonally clips kost stove, shower and squat toilet',()=>{
 const kost=scenes().find(s=>s.file.startsWith('njh_kos')).scene;
 const origin={x:240,z:0};
 const props=propsFromScene(kost,origin);
 const bad={...V.DRAW_POLICY,floor:{...V.DRAW_POLICY.floor,depthWrite:true,y:V.FLOOR_Y}};
 const clipped=V.inspectPropClips({origin,width:8,depth:6,props,policy:bad});
 const hit=clipped.filter(c=>c.reasons.includes('floor-depth'));
 assert.ok(hit.some(c=>c.id.startsWith('squat_toilet')),'toilet must be detected as floor-clipped under the old policy');
 assert.ok(hit.some(c=>c.id.startsWith('shower')||c.id.startsWith('stove')||c.id.startsWith('sink')),
  'right-wall fixtures must be detected as floor-clipped under the old policy, got '+JSON.stringify(hit.map(c=>c.id)));
});

test('MUST: official policy leaves every repo interior scene with zero clipped props',()=>{
 const all=allRepoInteriorScenes();
 assert.ok(all.length>=60,'expected play interiors + Bangun Ruang / Indonesia templates, got '+all.length);
 const origin={x:0,z:0};
 const failures=[];
 for(const {file,scene} of all){
  const props=propsFromScene(scene,origin);
  const fit=V.fitInteriorCamera({
   origin,width:scene.width||8,depth:scene.depth||6,props,aspect:1280/800,pad:1.22,
   inset:V.playInset(1280/800)
  });
  const clips=V.inspectPropClips({
   origin,width:scene.width||8,depth:scene.depth||6,props,
   focus:fit.focus,viewSize:fit.viewSize,aspect:1280/800,policy:V.DRAW_POLICY
  });
  if(clips.length)failures.push(file+': '+clips.map(c=>c.id+' ['+c.reason+']').join('; '));
 }
 assert.equal(failures.length,0,failures.join('\n'));
});


test('MUST: official inspectChairTables flags the old warteg orphan and door-facing chairs',()=>{
 const broken={width:8,depth:6,entrance:{c:3,r:5},items:[
  {id:'t1',assetId:'table',c:1,r:3,rotation:0},
  {id:'t2',assetId:'table',c:4,r:3,rotation:0},
  {id:'c1',assetId:'chair',c:1,r:4,rotation:0},
  {id:'c2',assetId:'chair',c:2,r:4,rotation:0},
  {id:'c3',assetId:'chair',c:5,r:4,rotation:0},
  {id:'c4',assetId:'chair',c:7,r:4,rotation:0}
 ]};
 const hit=V.inspectChairTables(broken,{catalog});
 assert.equal(hit.ok,false);
 assert.ok(hit.issues.some(i=>i.reason==='orphan'&&(i.id==='c4'||i.c===7)),'orphan at (7,4) must be detected: '+JSON.stringify(hit.issues));
 assert.ok(hit.issues.some(i=>i.reason==='wrong-facing'),'door-facing chairs must be detected: '+JSON.stringify(hit.issues));
});

test('MUST: every repo interior scene has chairs adjacent to a table, facing it, with a clear path',()=>{
 const all=allRepoInteriorScenes();
 assert.ok(all.length>=60,'expected play interiors + Bangun Ruang / Indonesia templates, got '+all.length);
 const failures=[];
 for(const {file,scene} of all){
  const hit=V.inspectChairTables(scene,{catalog});
  if(!hit.ok)failures.push(file+': '+hit.issues.map(i=>(i.id||'?')+' ['+i.reason+'] @'+i.c+','+i.r+' rot='+i.rotation+(i.expected!=null?' expected='+i.expected:'')).join('; '));
 }
 assert.equal(failures.length,0,failures.join('\n'));
});

test('Kharisma and kost authored chairs are already paired (pairChairs is a no-op on them)',()=>{
 const kharisma=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warteg_kharisma.interior-scene.json'),'utf8'));
 const kost=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos.interior-scene.json'),'utf8'));
 for(const [name,scene] of [['warteg',kharisma],['kost',kost]]){
  const before=scene.items.filter(i=>i.assetId==='chair').map(i=>({id:i.id,c:i.c,r:i.r,rotation:i.rotation}));
  const after=V.pairChairs(scene,{catalog});
  const got=after.items.filter(i=>i.assetId==='chair').map(i=>({id:i.id,c:i.c,r:i.r,rotation:i.rotation}));
  assert.deepEqual(got,before,name+' chairs moved by pairChairs: '+JSON.stringify({before,got}));
  assert.equal(V.inspectChairTables(scene,{catalog}).ok,true,name+' inspect failed: '+JSON.stringify(V.inspectChairTables(scene,{catalog}).issues));
 }
 const chairs=kharisma.items.filter(i=>i.assetId==='chair');
 assert.ok(chairs.every(c=>!(c.c===7&&c.r===4)),'orphan must have been moved off (7,4)');
 assert.ok(chairs.every(c=>c.c!==3),'warteg door column 3 must stay clear');
 const tables=kharisma.items.filter(i=>i.assetId==='table'||i.assetId==='counter'||i.assetId==='cashier');
 assert.deepEqual(tables.map(t=>({id:t.assetId,c:t.c,r:t.r})),[
  {id:'counter',c:2,r:1},{id:'counter',c:4,r:1},{id:'cashier',c:5,r:2},
  {id:'table',c:1,r:3},{id:'table',c:4,r:3}
 ],'Kharisma tables/counters must not move');
 const ibu=kharisma.items.find(i=>i.id==='npc_ibu_warteg'||i.assetId==='npc_ibu_warteg');
 assert.ok(ibu,'npc_ibu_warteg must stand in the warteg scene');
 assert.equal(ibu.c,4);assert.equal(ibu.r,0);assert.equal(ibu.rotation,0);
 const kostChair=kost.items.find(i=>i.assetId==='chair');
 assert.equal(kostChair.c,1);assert.equal(kostChair.r,3);assert.equal(kostChair.rotation,90);
});

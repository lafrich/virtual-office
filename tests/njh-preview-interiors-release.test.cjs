'use strict';
// Release gate: audit the ACTUAL eleven playable NJH map-preview rooms,
// not only the secondary play-interiors catalog or generic Indonesian templates.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const View=require('../world-builder/semesta-interior-view.js');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-play-interiors/catalog.json'),'utf8'));
const base=path.join(root,'world-builder/njh-map-preview/interiors');
const READY=['njh_kos','njh_kos_noor','njh_kos_ichsan','njh_kos_cove_lobby',
 'njh_warung_makan','njh_wc_mandi_umum','njh_rumah_biasa',
 'njh_laundry','njh_bengkel','njh_warung_kopi','njh_minimarket'];
const k=(c,r)=>c+','+r;
function cells(item){
 const [w,d]=View.itemFootprint(item,catalog);
 return View.coveredTiles(item.c,item.r,w,d);
}
function releaseIssues(scene){
 const issues=[],occupied=new Map(),ids=new Set(),unblocked=new Set();
 const inBounds=(c,r)=>c>=0&&r>=0&&c<scene.width&&r<scene.depth;
 for(const item of scene.items||[]){
  if(ids.has(item.id))issues.push('duplicate id '+item.id);
  ids.add(item.id);
  if(!Number.isInteger(item.c)||!Number.isInteger(item.r))issues.push(item.id+' noninteger placement');
  if(![0,90,180,270].includes(((Number(item.rotation)||0)%360+360)%360))
   issues.push(item.id+' rotation must be multiple of 90');
  for(const tile of cells(item)){
   if(!inBounds(tile.c,tile.r))issues.push(item.id+' outside '+tile.key);
   if(item.kind==='npc'||item.blocking===false)continue;
   if(occupied.has(tile.key))issues.push(item.id+' overlaps '+occupied.get(tile.key)+' @'+tile.key);
   occupied.set(tile.key,item.id);
  }
 }
 const e=scene.entrance;
 if(!e||!inBounds(e.c,e.r))issues.push('invalid entrance');
 else if(occupied.has(k(e.c,e.r)))issues.push('entrance obstructed by '+occupied.get(k(e.c,e.r)));
 const curtains=(scene.doors||[]).filter(x=>['bathroom','stall'].includes(x.role));
 for(const d of curtains){
  if(!inBounds(d.c,d.r)||occupied.has(k(d.c,d.r)))issues.push('blocked curtain '+d.id);
  if(d.privacy!==true||d.walkable!==true)issues.push('privacy flag missing '+d.id);
 }
 if(e&&inBounds(e.c,e.r)&&!occupied.has(k(e.c,e.r))){
  const queue=[[e.c,e.r]];
  for(let i=0;i<queue.length;i++){
   const [c,r]=queue[i],key=k(c,r);
   if(!inBounds(c,r)||occupied.has(key)||unblocked.has(key))continue;
   unblocked.add(key);
   for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([c+dc,r+dr]);
  }
  for(const d of curtains)if(!unblocked.has(k(d.c,d.r)))issues.push('curtain unreachable '+d.id);
  // A walkable approach to each toilet/bath/shower, not merely a reachable entrance.
  for(const it of scene.items||[]){
   if(!['wc','squat_toilet','shower','bathtub','water_tub'].includes(it.assetId))continue;
   const possible=cells(it).some(tile=>[[1,0],[-1,0],[0,1],[0,-1]]
    .some(([dc,dr])=>unblocked.has(k(tile.c+dc,tile.r+dr))));
   if(!possible)issues.push('wet fixture unreachable '+it.id);
  }
 }
 const seating=View.inspectChairTables(scene,{catalog});
 for(const issue of seating.issues)issues.push('chair '+(issue.id||'?')+': '+issue.reason+' @'+issue.c+','+issue.r);
 // Long benches are furniture as well; they cannot be left stranded across the room
 // from every dining table. Waiting benches in a lobby/shop are intentionally exempt.
 const tables=(scene.items||[]).filter(it=>it.assetId==='dining_table');
 for(const bench of (scene.items||[]).filter(it=>it.assetId==='wooden_bench'&&tables.length)){
  const nearest=Math.min(...tables.flatMap(t=>cells(t).flatMap(a=>
   cells(bench).map(b=>Math.abs(a.c-b.c)+Math.abs(a.r-b.r)))));
  if(nearest!==1)issues.push('dining bench unpaired '+bench.id+' (edge='+nearest+')');
 }
 return issues;
}
test('every playable NJH map template has a real authored interior',()=>{
 const files=new Set(fs.readdirSync(base));
 for(const name of READY)assert.ok(files.has(name+'.interior-scene.json'),name+' missing');
});
for(const name of READY)test('release layout / '+name,()=>{
 const scene=JSON.parse(fs.readFileSync(path.join(base,name+'.interior-scene.json'),'utf8'));
 assert.equal(scene.id,name);
 const issues=releaseIssues(scene);
 assert.deepEqual(issues,[],name+' layout problems:\n'+issues.join('\n'));
});

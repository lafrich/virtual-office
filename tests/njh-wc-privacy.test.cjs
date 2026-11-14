'use strict';
// Guide: NJH-INTERIOR-LAYOUT-RULES-MANDATORY § L-WC-01...04 and L-CLR-01...04.
// Tests the REAL authored scenes, not a generated screen or schematic.
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const catalog=read('world-builder/njh-play-interiors/catalog.json').items;
const rooms=[
 'njh-map-preview/interiors/njh_kos',
 'njh-play-interiors/njh_kos',
 'njh-map-preview/interiors/njh_kos_ichsan',
 'njh-play-interiors/njh_kos_ichsan',
 'njh-map-preview/interiors/njh_kos_noor',
 'njh-play-interiors/njh_kos_noor',
 'njh-map-preview/interiors/njh_wc_mandi_umum',
 'njh-map-preview/interiors/njh_rumah_biasa'
];
const key=(c,r)=>c+','+r;
const cells=(item)=>{
 const size=catalog[item.assetId]?.sw?.footprint||item.footprint||[1,1];
 const rot=(Number(item.rotation)||0)%180;
 const [w,d]=rot===90?[size[1],size[0]]:size;
 const out=[];for(let c=item.c;c<item.c+w;c++)for(let r=item.r;r<item.r+d;r++)out.push([c,r]);
 return out;
};
function examine(p){
 const sc=read('world-builder/'+p+'.interior-scene.json'),used=new Map();
 for(const item of sc.items){
  for(const [c,r] of cells(item)){
   assert.ok(c>=0&&r>=0&&c<sc.width&&r<sc.depth,sc.id+' '+item.id+' out of bounds');
   assert.ok(!used.has(key(c,r)),sc.id+' collision '+item.id+' / '+used.get(key(c,r))+' at '+key(c,r));
   if(item.blocking!==false)used.set(key(c,r),item.id);
  }
 }
 const curtains=(sc.doors||[]).filter(d=>d.role==='bathroom'||d.role==='stall');
 for(const d of curtains){
  assert.equal(d.privacy,true,d.id+' must block visual line of sight');
  assert.equal(d.walkable,true,d.id+' must remain walkable');
  assert.ok(!used.has(key(d.c,d.r)),d.id+' curtain cannot overlap a wall or fixture');
 }
 // Walkable cells 4-connected from the exterior entrance, including curtain tiles.
 const seen=new Set(),queue=[[sc.entrance.c,sc.entrance.r]];
 for(let i=0;i<queue.length;i++){
  const [c,r]=queue[i],k=key(c,r);
  if(c<0||r<0||c>=sc.width||r>=sc.depth||seen.has(k)||used.has(k))continue;
  seen.add(k);for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([c+dc,r+dr]);
 }
 for(const d of curtains)assert.ok(seen.has(key(d.c,d.r)),d.id+' unreachable from entrance');
 for(const item of sc.items.filter(i=>['shower','squat_toilet','wc','bathtub','water_tub'].includes(i.assetId))){
  // Every wet fixture must have a reachable free approach tile.
  const around=cells(item).flatMap(([c,r])=>[[c+1,r],[c-1,r],[c,r+1],[c,r-1]]);
  assert.ok(around.some(([c,r])=>seen.has(key(c,r))),sc.id+' inaccessible wet fixture '+item.id);
  // The entrance must never directly see a toilet/tub, even diagonally.
  // Super-sample the line of sight through the same 1-tile partition grid.
  const barriers=new Set(sc.items.filter(i=>i.assetId==='sekat_wc')
   .flatMap(x=>cells(x).map(([c,r])=>key(c,r))));
  for(const d of curtains)barriers.add(key(d.c,d.r));
  const foot=catalog[item.assetId]?.sw?.footprint||[1,1];
  const tx=item.c+foot[0]/2,ty=item.r+foot[1]/2;
  const sx=sc.entrance.c+.5,sy=sc.entrance.r+.5;
  let hidden=false;
  for(let n=0;n<=1000;n++){
   const u=n/1000;
   if(barriers.has(key(Math.floor(sx+(tx-sx)*u),Math.floor(sy+(ty-sy)*u)))){
    hidden=true;break;
   }
  }
  assert.ok(hidden,sc.id+' entrance can see wet fixture '+item.id);
 }
 return {sc,used,seen,curtains};
}
for(const p of rooms){
 test(p+' blocks wet fixtures behind actual sekat and walkable curtain',()=>{
  const {sc,used,curtains}=examine(p);
  if(sc.id==='njh_wc_mandi_umum'){
   assert.equal(curtains.filter(d=>d.role==='stall').length,5,'three toilets and two bak bays');
   const wc=sc.items.filter(i=>i.assetId==='squat_toilet');
   assert.equal(wc.length,3);
   assert.equal(sc.items.filter(i=>i.assetId==='water_tub').length,2);
   assert.equal(sc.items.filter(i=>['shower','bathtub'].includes(i.assetId)).length,0);
   for(const c of [0,2,4]){
    assert.ok(wc.some(x=>x.c===c&&x.r===0&&x.rotation===0),'WC must face SW');
    assert.ok(curtains.some(x=>x.c===c&&x.r===1&&x.role==='stall'));
   }
   for(const c of [1,3,5])for(const r of [0,1])
    assert.equal(sc.items.find(x=>x.c===c&&x.r===r)?.assetId,'sekat_wc','separate WC stall');
  }else if(sc.id==='njh_rumah_biasa'){
   assert.equal(curtains.length,1);
   assert.deepEqual([curtains[0].c,curtains[0].r],[6,2]);
   const bed=sc.items.find(x=>x.assetId==='bed');
   assert.equal(bed.rotation,90,'west-facing bed headboard backs the west wall');
   const seat=sc.items.find(x=>x.assetId==='chair');
   const table=sc.items.find(x=>x.assetId==='dining_table');
   assert.equal(seat.rotation,0,'chair front points +r to table');
   assert.equal(seat.c,table.c);assert.equal(table.r,seat.r+1);
   for(const r of [0,1,2])
    assert.equal(sc.items.find(x=>x.c===5&&x.r===r)?.assetId,'sekat_wc');
   assert.equal(sc.items.find(x=>x.c===7&&x.r===2)?.assetId,'sekat_wc');
  }else{
   assert.equal(curtains.filter(d=>d.role==='bathroom').length,1);
   const compact=sc.width===8,edge=compact?5:6,front=compact?3:5;
   for(let r=0;r<=front;r++)
    assert.equal(sc.items.find(x=>x.c===edge&&x.r===r)?.assetId,'sekat_wc','solid side wall '+r);
   const opening=curtains[0];
   assert.equal(opening.c,compact?6:8);assert.equal(opening.r,front);
   assert.ok(!used.has(key(opening.c,opening.r)),'one free privacy entry');
   assert.equal(sc.items.filter(i=>i.assetId==='squat_toilet').length,1);
  }
 });
}
test('native play renderer draws solid sekat, privacy curtains and no bogus room action',()=>{
 const code=fs.readFileSync(path.join(root,'world-builder/njh-play-interiors.js'),'utf8');
 assert.match(code,/item.assetId==='sekat_wc'/);
 assert.match(code,/new THREE\.BoxGeometry\(dims\[0\],hi-lo,dims\[1\]\)/);
 assert.match(code,/d\.role==='bathroom'\|\|d\.role==='stall'/);
 assert.match(code,/new THREE\.PlaneGeometry\(\.94,2\.05\)/);
 assert.match(code,/if\(d\.role==='bathroom'\|\|d\.role==='stall'\)continue/);
});

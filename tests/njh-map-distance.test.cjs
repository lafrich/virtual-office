'use strict';
/* NJH slice 'Hobo -> Punya Kos': every core point pair <= map.maxCoreDistanceTiles (30, Euclidean),
 * points exactly as docs/NJH-MAP-DISTANCE-BRIEF.md (+ Manusia Silver). Data-only map package v2 (on live main). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {report,wartegDoor}=require('../tools/njh-map-distance-check.cjs');
const meta=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-map-preview/njh-map-meta.json'),'utf8'));
const city=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
const objects=city.record.document.objects;
const byId=Object.fromEntries(objects.map(o=>[o.id,o]));
const BRIEF_KEYS=['tenda','wc','warteg','pak_ogah','parkir','loak','dermaga','spot_mancing','pasar_ikan','siomay','kost'];

test('brief points and metric: the 11 core points of NJH-MAP-DISTANCE-BRIEF, limit 30',()=>{
 const r=report(meta,{briefOnly:true});
 const briefPath=path.join(root,'docs/NJH-MAP-DISTANCE-BRIEF.json');
 const keys=fs.existsSync(briefPath)?Object.keys(JSON.parse(fs.readFileSync(briefPath,'utf8')).points):BRIEF_KEYS;
 assert.deepEqual(Object.keys(r.points).sort(),keys.slice().sort());
 assert.equal(r.limit,30);
});

test('all core pairs (brief 11 + Manusia Silver) are within 30 tiles',()=>{
 const r=report(meta);
 assert.equal(Object.keys(r.points).length,12);
 assert.deepEqual(r.over,[],JSON.stringify(r.over));
 assert.ok(r.max.euclidean<=30,JSON.stringify(r.max));
});

test('moved points stay in sync with their world objects',()=>{
 const door=id=>meta.doors.find(d=>d.doorId===id);
 const it=id=>meta.interactables.find(i=>i.id===id);
 const warteg=wartegDoor(meta);
 assert.equal(warteg.objectId,'jakarta-v3-18446');
 for(const [d,oid] of [[door('njh_door_loak'),'njh-toko-loak'],[warteg,'jakarta-v3-18446']]){
  const o=byId[oid],[x0,x1,,z1]=d.footprintRect;
  assert.equal((x0+x1)/2,o.x,d.doorId+' footprint centre x');
  assert.equal(z1,d.doorPoint[1],d.doorId+' door on the front edge');
  assert.equal(d.usePoint[0],o.x,d.doorId+' use x'); assert.equal(d.usePoint[1],d.doorPoint[1]+0.5,d.doorId+' use z');
  assert.deepEqual(d.useTile,[Math.floor(d.usePoint[0]),Math.floor(d.usePoint[1])]);
 }
 const cart=byId['njh-lapak-siomay-batagor'];
 assert.equal(cart.rotation,180,'siomay cart faces the r=64 gang');
 assert.deepEqual(it('njh_siomay_batagor').usePoint,[cart.x,cart.z-1]);
 assert.deepEqual(it('njh_pasar_ikan').usePoint,[byId['jakarta-v3-4942'].x,+(byId['jakarta-v3-4942'].z+1.1).toFixed(2)]);
 const dock=byId['njh-dermaga-mancing'],anchor=byId['njh-dermaga-mancing-anchor'];
 assert.deepEqual([anchor.x,anchor.z],[dock.x,dock.z]);
 assert.deepEqual(it('njh_dermaga_mancing').usePoint,[-50.375,dock.z]);
 assert.deepEqual(it('njh_dermaga_mancing').waterSideTiles,[[-53,dock.z-1],[-53,dock.z]]);
 const pa=meta.pendingAssets.find(p=>p.id==='njh-dermaga-mancing');
 assert.deepEqual(pa.minCorner,{c:dock.x-0.5,r:dock.z-1});
 for(const [oid,aid] of [['njh-tiang-ogah','njh-tiang-ogah-anchor'],['njh-lapak-silver','njh-lapak-silver-anchor']]){
  assert.deepEqual([byId[aid].x,byId[aid].z],[byId[oid].x,byId[oid].z]);
  const p=meta.pendingAssets.find(p=>p.id===oid);
  assert.deepEqual(p.minCorner,{c:byId[oid].x-0.5,r:byId[oid].z-0.5});
 }
 const site=meta.gameplaySites.fishing_spot,spot=byId['njh-fishing-spot-kali-selatan'];
 assert.deepEqual([site.x,site.z],[spot.x,spot.z]);
 assert.deepEqual(site.usePoint,it('fishing_spot').usePoint);
});

test('fix a: the outdoor Makan Warteg point is a marker clear of the Warteg door (radii 2.5 + 2.2 never overlap)',()=>{
 const eat=byId['njh-warteg-makan-anchor'],d=wartegDoor(meta);
 assert.ok(eat&&eat.type==='marker'&&eat.collision===false,'eat anchor marker');
 assert.match(eat.name,/warteg/i);
 // semesta-life-play picks the first object whose name says Warteg for the 'warung' (eat) site.
 const first=objects.find(o=>/warteg/i.test([o.name,o.label,o.asset,o.subtype,...(o.tags||[])].filter(Boolean).join(' ')));
 assert.equal(first.id,'njh-warteg-makan-anchor');
 const gap=Math.hypot(eat.x-d.usePoint[0],eat.z-d.usePoint[1]);
 assert.ok(gap>2.5+2.2,'eat point '+gap.toFixed(2)+' tiles from the door');
 for(const other of meta.doors){
  if(other===d)continue;
  assert.ok(Math.hypot(eat.x-other.usePoint[0],eat.z-other.usePoint[1])>2.2,'eat point inside '+other.doorId+' enter radius');
 }
});

test('fix b: Kang Parkir stands clear of the Pasar Ikan stall and Ibu Pasar Ikan',()=>{
 const p=byId['ref-ambient-11'],s=byId['jakarta-v3-4942'];
 assert.ok(Math.hypot(p.x-s.x,p.z-s.z)>=5,'Kang Parkir '+Math.hypot(p.x-s.x,p.z-s.z).toFixed(2)+' tiles from the stall');
});

test('nothing was deleted: every moved object is still on the map',()=>{
 for(const id of ['njh-toko-loak','njh-sw2-h3','jakarta-v3-18446','njh-sw2-h4','jakarta-v3-4942','njh-lapak-siomay-batagor',
  'njh-dermaga-mancing','njh-dermaga-mancing-anchor','njh-npc-pak-ogah','njh-tiang-ogah','ref-ambient-9','njh-lapak-silver','ref-ambient-11','njh-atm-16','njh-atm-15'])
  assert.ok(byId[id],id);
});

'use strict';
/* NJH slice 'Hobo -> Punya Kos': every core point pair <= map.maxCoreDistanceTiles (30, Euclidean),
 * points exactly as docs/NJH-MAP-DISTANCE-BRIEF.md (+ Manusia Silver). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {report}=require('../tools/njh-map-distance-check.cjs');
const meta=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-map-preview/njh-map-meta.json'),'utf8'));
const city=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
const byId=Object.fromEntries(city.record.document.objects.map(o=>[o.id,o]));

test('brief source reproduces: same 11 points and metric as NJH-MAP-DISTANCE-BRIEF.json',()=>{
 const brief=JSON.parse(fs.readFileSync(path.join(root,'docs/NJH-MAP-DISTANCE-BRIEF.json'),'utf8'));
 const r=report(meta,{briefOnly:true});
 assert.deepEqual(Object.keys(r.points).sort(),Object.keys(brief.points).sort());
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
 for(const [did,oid] of [['njh_door_loak','njh-toko-loak'],['njh_door_warung_makan','jakarta-v3-18446'],['njh_door_wc_umum','njh-wc-umum']]){
  const d=door(did),o=byId[oid],[x0,x1,z0,z1]=d.footprintRect;
  assert.equal((x0+x1)/2,o.x,did+' footprint centre x');
  assert.equal(z1,d.doorPoint[1],did+' door on the front edge');
  assert.equal(d.usePoint[0],o.x,did+' use x'); assert.equal(d.usePoint[1],d.doorPoint[1]+0.5,did+' use z');
  assert.deepEqual(d.useTile,[Math.floor(d.usePoint[0]),Math.floor(d.usePoint[1])]);
 }
 assert.deepEqual(it('njh_siomay_batagor').usePoint,[byId['njh-lapak-siomay-batagor'].x,byId['njh-lapak-siomay-batagor'].z+1]);
 assert.deepEqual(it('njh_pasar_ikan').usePoint,[byId['jakarta-v3-4942'].x,+(byId['jakarta-v3-4942'].z+1.1).toFixed(2)]);
 const dock=byId['njh-dermaga-mancing'],anchor=byId['njh-dermaga-mancing-anchor'];
 assert.deepEqual([anchor.x,anchor.z],[dock.x,dock.z]);
 assert.deepEqual(it('njh_dermaga_mancing').usePoint,[-50.375,dock.z]);
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

test('nothing was deleted: every moved object is still on the map',()=>{
 for(const id of ['njh-toko-loak','njh-sw2-h3','jakarta-v3-18446','njh-sw2-h4','jakarta-v3-4942','njh-wc-umum','njh-lapak-siomay-batagor',
  'njh-dermaga-mancing','njh-npc-pak-ogah','njh-tiang-ogah','ref-ambient-9','njh-lapak-silver','ref-ambient-11','njh-atm-16','njh-atm-15'])
  assert.ok(byId[id],id);
});

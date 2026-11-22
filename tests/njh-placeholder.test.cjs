'use strict';
/* Bug 22 Nov 2026 "placeholder orang jelek lolos ke preview": no placed object on the NJH preview
 * map may draw a placeholder / procedural / pending human figure. See tools/njh-placeholder-check.cjs. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const {check,sigPixels,SIG_MIN,T514_WAITING_LGR}=require('../tools/njh-placeholder-check.cjs');
const CITY=path.join(root,'world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json');

test('NJH preview map: no placeholder human figure (P1-P4 all zero)',()=>{
 const r=check(CITY);
 assert.deepEqual(r.fails.map(f=>[f.rule,f.id,f.file||f.asset||'']),[]);
 assert.ok(r.scanned>=8,'tent art scanned');
});

test('Pecel Lele / Sate Madura tents carry no placeholder NPC figures in any view',()=>{
 for(const k of ['pecel','sate'])for(const d of ['sw','se','ne','nw']){
  const n=sigPixels(path.join(root,'world-builder/njh-map-preview/tents',k+'_'+d+'.png'));
  assert.ok(n<SIG_MIN,k+'_'+d+' placeholder pixels '+n);
 }
});

test('Lapak Barang Bekas no longer uses the stall with the baked-in seller',()=>{
 const raw=JSON.parse(fs.readFileSync(CITY,'utf8'));
 const o=raw.record.document.objects.find(o=>o.id==='njh-lapak-bekas');
 assert.equal(o.asset,'pipeline:lapak_aksesori');
 const meta=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-map-preview/njh-map-meta.json'),'utf8'));
 assert.equal(meta.interactables.find(i=>i.id==='njh_lapak_bekas').asset,'pipeline:lapak_aksesori');
});

test('checker fails on a procedural quest NPC that is not on the t514 list, and on known figure assets',()=>{
 const raw=JSON.parse(fs.readFileSync(CITY,'utf8'));
 const objs=raw.record.document.objects;
 objs.push({id:'probe-npc',type:'quest_npc',questId:'pak_ogah',x:-20,z:30});
 objs.find(o=>o.id==='njh-lapak-bekas').asset='pipeline:lapak_barang_bekas';
 const tmp=path.join(os.tmpdir(),'njh-placeholder-probe-'+process.pid+'.city.json');
 fs.writeFileSync(tmp,JSON.stringify(raw));
 try{
  const r=check(tmp);
  assert.ok(r.fails.some(f=>f.rule==='P4'&&f.id==='probe-npc'));
  assert.ok(r.fails.some(f=>f.rule==='P3'&&f.id==='njh-lapak-bekas'));
  for(const id of T514_WAITING_LGR)assert.ok(r.warns.some(w=>w.id===id),id+' listed as waiting for LGR');
 }finally{fs.rmSync(tmp,{force:true});}
});

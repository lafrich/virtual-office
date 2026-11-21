'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const PX=Math.SQRT2/64, PY=PX*2/Math.sqrt(3);
const r=v=>+v.toFixed(3);
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const city=JSON.parse(read('world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'));
const objects=city.record.document.objects;
const byId=Object.fromEntries(objects.map(o=>[o.id,o]));
const meta=JSON.parse(read('world-builder/njh-map-preview/njh-map-meta.json'));

test('approved swaps: prayer mat and siomay cart replace placeholders',()=>{
 const mat=byId['njh-penanda-doa'];
 assert.equal(mat.asset,'pipeline:id_mainkan_prayer_mat');
 assert.equal(mat.width,r(101*PX));
 assert.equal(mat.width,2.232);
 assert.equal(mat.height,3.674);
 assert.ok(!objects.some(o=>o.asset==='object:njh_penanda_doa'),'old penanda asset must not remain on the map');
 const cart=byId['njh-lapak-siomay-batagor'];
 assert.equal(cart.asset,'pipeline:id_mainkan_siomay_cart');
 assert.equal(cart.width,2.232);
 assert.equal(cart.height,3.674);
 assert.notEqual(cart.asset,'pipeline:lapak_tas');
 // backup of the 4 placeholder views exists; live folder is gone
 const bak=path.join(root,'world-builder/njh-map-preview/props/_backup-20261122/njh_penanda_doa');
 for(const dir of ['sw','se','ne','nw'])
  assert.ok(fs.existsSync(path.join(bak,'njh_penanda_doa_'+dir+'.png')),dir);
 assert.ok(!fs.existsSync(path.join(root,'world-builder/njh-map-preview/props/njh_penanda_doa/njh_penanda_doa_sw.png')));
 assert.equal(meta.assetKeyMapping['object:obj-njh-penanda-doa'],'pipeline:id_mainkan_prayer_mat');
 assert.ok(!(meta.pendingAssets||[]).some(row=>row.asset==='object:njh_penanda_doa'||row.id==='njh-penanda-doa'));
 const pray=meta.interactables.find(x=>x.objectId==='njh-penanda-doa');
 assert.equal(pray.asset,'pipeline:id_mainkan_prayer_mat');
 assert.deepEqual(pray.usePoint,[-11.5,24.5]);
 const siomay=meta.interactables.find(x=>x.objectId==='njh-lapak-siomay-batagor');
 assert.equal(siomay.asset,'pipeline:id_mainkan_siomay_cart');
 // preview/njh-map-distance: cart moved next to WC/Mandi Umum (30-tile core rule); use tile stays on the r=71 sidewalk
 assert.deepEqual(siomay.usePoint,[byId['njh-lapak-siomay-batagor'].x,byId['njh-lapak-siomay-batagor'].z+1]);
 assert.deepEqual(siomay.usePoint,[-45,71.5]);
});

test('vehicle catalog uses real PNG sizes and play art does not clamp to footprint',()=>{
 const sandbox={};
 new Function('window',read('world-builder/semesta-traffic-catalog.js'))(sandbox);
 const C=sandbox.VLSemestaCatalog;
 assert.equal(C.imagesPublished,true);
 for(const v of C.vehicles)assert.equal(v.published,true,v.id);
 const gojek=C.vehicle('gojek');
 assert.deepEqual(gojek.size,[60,87]);
 assert.deepEqual(gojek.pivot,[30,75]);
 const maxim=C.vehicle('maxim_pax');
 assert.deepEqual(maxim.size,[54,92]);
 assert.deepEqual(maxim.pivot,[27,80]);
 const sedan=C.vehicle('sedan_red');
 assert.deepEqual(sedan.size,[146,138]);
 assert.deepEqual(sedan.pivot,[73,100]);
 const taxi=C.vehicle('taxi_bluebird');
 assert.deepEqual(taxi.size,[152,148]);
 const art=read('world-builder/semesta-traffic-art.js');
 const graphic=art.slice(art.indexOf('function vehicleGraphic'),art.indexOf('const jobColor'));
 assert.ok(!graphic.includes('footprint[0]*.95')&&!graphic.includes('artFootprint[0]*.95'));
 assert.ok(graphic.includes('naturalWidth')||graphic.includes('naturalWidth*PX')||graphic.includes('imageWidth*PX'));
 assert.ok(graphic.includes('manifest-pivot'));
 assert.ok(!graphic.includes('wheelGround?.contact'));
 assert.ok(graphic.includes('mesh.visible=false'));
 assert.ok(graphic.includes('preloadVehicle'));
 assert.ok(!graphic.includes("size:spec.size,pivot:spec.pivot}]:[])"));
 assert.equal(byId.sedan.vehicleId,'sedan_red');
 assert.ok(!byId['njh-vehicle-angkot']);
 const prev=read('world-builder/njh-map-preview.js');
 assert.ok(prev.includes("VEHICLE_ID_ALIASES=Object.freeze({'njh-vehicle-angkot':'sedan'})"));
});

test('pending interiors toast Belum buka and never enter a fallback',()=>{
 const js=read('world-builder/njh-map-preview.js')+read('world-builder/njh-play-interiors.js')+read('world-builder/builder.js');
 assert.ok(js.includes("const BELUM_BUKA='Belum buka'"));
 assert.ok(js.includes("tell('Belum buka')")||js.includes("reason:closed.reason||'Belum buka'"));
 assert.ok(js.includes('if(r?.closed)'));
});

test('dailyWageCap is 150000 with a raised validator clamp',()=>{
 const schema=read('shared/gameplay-schema.js');
 assert.ok(schema.includes('dailyWageCap:150000')||schema.includes('dailyWageCap: 150000'));
 assert.ok(schema.includes('int(jobs.dailyWageCap,0,1000000,150000)'));
 const gp=JSON.parse(read('jiwa/gameplay.json'));
 assert.equal(gp.modules.jobs.dailyWageCap,150000);
 const eng=read('jiwa/foundation-engine.js');
 assert.ok(eng.includes('dailyWageCap:int(settings.dailyWageCap,0,1000000,150000)'));
});

test('Kang Parkir and Manusia Silver stand on walk surface, trees left door/use/spawn tiles',()=>{
 // preview/njh-map-distance moved both NPCs into the 30-tile core cluster (NJH Mart forecourt r=59,
 // Jl. Kebon Kacang west sidewalk). The densify tree fixes (kept over the balancing-side tree moves)
 // are proven by the layout checker: no door/use/spawn point blocked (R4), NPCs on sidewalk/plaza (R7).
 const cells=new Map(city.record.document.map.terrain.cells.map(c=>[c.c+','+c.r,c.type]));
 for(const id of ['ref-ambient-9','ref-ambient-11']){
  const o=byId[id];
  assert.ok(['sidewalk','plaza'].includes(cells.get(Math.floor(o.x)+','+Math.floor(o.z))),id+' on walk surface');
 }
 const {check}=require('./njh-map-layout-check.cjs');
 const r=check();
 assert.equal(r.counts.R4,0,JSON.stringify(r.issues.R4));
 assert.equal(r.counts.R7,0,JSON.stringify(r.issues.R7));
 for(const id of ['jakarta-green-v5-22249','jakarta-green-v5-22445','jakarta-green-v5-22447','jakarta-green-v5-22452','jakarta-green-v5-22589'])
  assert.ok(byId[id],id+' kept (moved, not deleted)');
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const VO=path.join(__dirname,'..');
const FIFTEEN=[
 'id200_transport_angkot_kota','id200_transport_ambulans_puskesmas',
 'id200_transport_bus_kota_kecil','id200_transport_elf_travel_antarkota',
 'id200_transport_mobil_angkut_sampah','id200_transport_pikap_galon_isi_ulang',
 'id200_transport_pikap_sayur_keliling','id200_transport_truk_material_bangunan',
 'id200_transport_truk_pasir_proyek','id200_transport_bajaj_oranye',
 'id200_transport_becak_kampung','id200_transport_bentor_roda_tiga',
 'id200_transport_delman_andong','id200_transport_sepeda_ontel_tua',
 'id200_transport_sepeda_tukang_roti'
];
const DIRS=['se','sw','ne','nw'];

test('Ellen 15 catalog vehicles are allowlisted with 4-dir PNGs and stay out of the retired motor path',()=>{
 const src=fs.readFileSync(path.join(VO,'world-builder/indonesia-assets.js'),'utf8');
 const g={};
 vm.runInNewContext(src,{window:g,fetch:async()=>({ok:false,status:404,json:async()=>({})}),console:{warn(){}}});
 const api=g.VLIndonesiaAssets;
 assert.equal(api.PREVIEW_REF,'preview/njh-sync-decisions-20261122');
 assert.equal(api.ALLOWED_TRANSPORT.size,15);
 for(const id of FIFTEEN){
  assert.equal(api.retired({id,file:'pipeline:'+id}),false,id+' should be allowed');
  assert.equal(api.valid({
   id,file:'pipeline:'+id,source:'pipeline-street',published:true,group:'prop',
   footprint:[2,1],variants:Object.fromEntries(DIRS.map(d=>[d,{
    file:'props/'+id+'_'+d+'.png',size:[128,96],pivot:[64,80]
   }]))
  }),true,id+' should pass valid()');
 }
 assert.equal(api.retired({id:'id200_transport_motor_matik_keluarga',file:'pipeline:id200_transport_motor_matik_keluarga'}),true);
 const cat=JSON.parse(fs.readFileSync(path.join(VO,'world-builder/ellen-preview-assets/street_buildings/ellen_vehicles_15_catalog.json'),'utf8'));
 assert.equal(cat.assets.length,15);
 for(const asset of cat.assets){
  assert.equal(asset.published,true);
  for(const d of DIRS){
   const rel=asset.variants[d].file;
   const png=path.join(VO,'world-builder/ellen-preview-assets/street_buildings',rel);
   assert.ok(fs.existsSync(png),'missing '+rel);
  }
 }
});

test('WC V4 is a new catalog id and does not overwrite the kampung toilet facade',()=>{
 const wc=path.join(VO,'world-builder/ellen-preview-assets/street_buildings/ellen_wc_v4_catalog.json');
 const cat=JSON.parse(fs.readFileSync(wc,'utf8'));
 assert.equal(cat.assets[0].id,'id200_publik_wc_umum_kumuh');
 assert.deepEqual(cat.assets[0].size,[296,254]);
 assert.deepEqual(cat.assets[0].pivot,[148,182]);
 assert.notEqual(cat.assets[0].id,'id200_publik_toilet_umum_kampung');
 for(const d of DIRS){
  assert.ok(fs.existsSync(path.join(VO,'world-builder/ellen-preview-assets/street_buildings',cat.assets[0].variants[d].file)));
 }
});

test('C1 park-bench and park-table use proposal canvas sizes and preview PNGs',()=>{
 const src=fs.readFileSync(path.join(VO,'world-builder/bangun-ruang/object-bridge.js'),'utf8');
 assert.match(src,/"park-bench":"104,89,52,70"/);
 assert.match(src,/"park-table":"108,68,54,43"/);
 assert.doesNotMatch(src,/"park-bench":"104,74,52,70"/);
 for(const id of ['park-bench','park-table']){
  for(const d of DIRS){
   assert.ok(fs.existsSync(path.join(VO,'world-builder/ellen-preview-assets/street_buildings/props',id+'_'+d+'.png')));
  }
 }
});

test('selokan map data and selokan_grill art are not part of this integration',()=>{
 const preview=fs.readFileSync(path.join(VO,'world-builder/njh-map-preview.js'),'utf8');
 assert.match(preview,/Does not edit drain\/selokan cell data/);
 assert.equal(fs.existsSync(path.join(VO,'world-builder/ellen-preview-assets/street_buildings/props/selokan_grill_sw.png')),false);
 const log=fs.readFileSync(path.join(VO,'world-builder/ellen-preview-assets/INTEGRATION-LOG.txt'),'utf8');
 assert.match(log,/SKIP selokan_grill/);
});

test('Bangun r1 templates are in the Indonesia pack with the source preset() requires',()=>{
 const src=fs.readFileSync(path.join(VO,'world-builder/bangun-ruang/indonesia-interior-templates.js'),'utf8');
 for(const id of ['id_tpl_rumah_biasa','id_tpl_warung_makan','id_tpl_wc_umum']){
  assert.ok(src.includes("id:'"+id+"'")||src.includes('id:"'+id+'"')||src.includes("id: '"+id+"'")||src.includes(id),id);
 }
 assert.match(src,/authoredFrom:'bangun-interior-templates-r1'/);
 assert.match(src,/source:'indonesia-interior-pack-v1'/);
});

test('LGR phase 1 tee_v4 / trousers_v4 strips are registered; phase 2 outfits are absent',()=>{
 const gen=fs.readFileSync(path.join(VO,'shared/genesis-player.js'),'utf8');
 assert.match(gen,/"tee_v4"/);
 assert.match(gen,/"trousers_v4"/);
 assert.doesNotMatch(gen,/daster|sarung|kemeja_v4|celana_pendek_v4/);
 const idx=JSON.parse(fs.readFileSync(path.join(VO,'world-builder/ellen-preview-assets/lgr-wear-phase1/index.json'),'utf8'));
 assert.ok(idx.items.includes('top/tee_v4'));
 assert.ok(idx.items.includes('pants/trousers_v4'));
});

test('preview cache-bust and service worker are unique for this asset checkpoint',()=>{
 const sw=fs.readFileSync(path.join(VO,'sw.js'),'utf8');
 assert.match(sw,/^\/\* sw v37 /);
 const html=fs.readFileSync(path.join(VO,'mainkan/index.html'),'utf8');
 assert.match(html,/\?v=njh-ellen-r7-20261122/);
 const wb=fs.readFileSync(path.join(VO,'world-builder/index.html'),'utf8');
 assert.match(wb,/indonesia-assets\.js\?v=njh-ellen-r7-20261122/);
 const hub=JSON.parse(fs.readFileSync(path.join(VO,'shared/hub-version.json'),'utf8'));
 assert.equal(hub.build,'hub-20261122-ellen-r7');
});

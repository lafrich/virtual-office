'use strict';
// NJH Mart Step-2 kit → editable Bangun Ruang types, without replacing upstream.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'world-builder/bangun-ruang/indonesia-interior-templates.js'),'utf8');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-play-interiors/catalog.json'),'utf8')).items;
const types={
 njh_rak_sembako:[2,1],njh_rak_bumbu_mi:[2,1],njh_rak_snack:[2,1],
 njh_chiller_segar:[2,1],njh_display_sayur_buah:[2,1],
 njh_keranjang_belanja:[1,1],njh_troli:[1,1],njh_papan_promo:[1,1],
 njh_counter_kasir:[2,1],njh_counter_kopi:[3,1],njh_mesin_kopi:[1,1]
};
function run(window){
 vm.runInNewContext(source,{window,Math,Number,Object,Array,Set,Map},{filename:'indonesia-interior-templates.js'});
 return window.VLIndonesiaInteriorPack;
}
test('upstream v1 pack is preserved while 11 official Mart types are merged',()=>{
 const original={version:1,types:{existing:{label:'Legacy fixture'}},templates:{legacy:{items:[]}},actions:{buy:{label:'Beli'}}};
 const pack=run({VLIndonesiaInteriorPack:original});
 assert.equal(pack.version,1);
 assert.equal(pack.njhMartVersion,1);
 assert.equal(pack.types.existing,original.types.existing);
 assert.equal(pack.templates,original.templates);
 for(const [id,dims] of Object.entries(types)){
  const type=pack.types[id];assert.ok(type,id+' registered');
  assert.deepEqual([type.w,type.d],dims,id+' footprint');
  assert.deepEqual(catalog[id].sw.footprint,dims,id+' sourced from official art');
  assert.ok(type.actions.length>0,id+' interactive action slots');
 }
});
test('a standalone local pack also exposes all Mart types',()=>{
 const pack=run({});
 for(const id of Object.keys(types))assert.ok(pack.types[id],id);
});
test('Mart four-view preview references the same existing files, not generated sprites',()=>{
 const src=fs.readFileSync(path.join(root,'world-builder/bangun-ruang/njh-interior-art-preview.js'),'utf8');
 assert.match(src,/MART_IDS=Object\.freeze/);
 assert.match(src,/njh-play-interiors\/catalog\.json|base\+'catalog\.json'/);
 assert.match(src,/CATALOG\[id\]=Object\.fromEntries/);
 for(const id of Object.keys(types)){
  assert.match(src,new RegExp('\\b'+id+'\\b'));
  for(const d of ['se','sw','ne','nw'])assert.ok(catalog[id][d]?.file,id+' '+d+' required');
 }
});

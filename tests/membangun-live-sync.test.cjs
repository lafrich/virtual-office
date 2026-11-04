'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder');
const code=fs.readFileSync(path.join(root,'bangun-ruang/semesta-bridge.js'),'utf8');
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
const views=()=>Object.fromEntries(['sw','se','ne','nw'].map(
 dir=>[dir,{url:png,size:[320,300],pivot:[160,245]}]));
const building=(id,name='Rumah')=>({
 id,name,format:'virtual-life-building-asset-v1',
 config:{w:3,d:3,collision:'yes'},views:views(),
 interactive:true,enterable:true,
 interior:{format:'virtual-life-interiors-v1',floors:[{entrance:{c:1,r:1},items:[]}]},
 interactions:['enter','sit'],actionSlots:[],
 entranceFacing:'sw'
});
function setup(){
 let saved=[];
 const window={VLAssetCatalog:[{file:'pipeline:house',source:'pipeline-street',label:'Existing'}]};
 const localStorage={getItem:key=>{
  assert.equal(key,'virtual-life-bangun-ruang-v1');
  return JSON.stringify(saved);
 }};
 vm.runInNewContext(code,{window,localStorage,console});
 return {window,write:a=>{saved=a}};
}
test('live refresh replaces prior versions instead of duplicating assets',()=>{
 const {window,write}=setup(),bridge=window.VLBuildingBridge;
 const a=building('br-rumah-1'),b=building('br-warung-2');
 assert.equal(bridge.count,0);
 write([a]);assert.equal(bridge.refresh().count,1);
 assert.equal(window.VLAssetCatalog.length,2);
 assert.deepEqual(Array.from(bridge.entries[0].footprint),[3,3]);
 assert.equal(bridge.entries[0].enterable,true);
 assert.equal(bridge.entries[0].actionSlots.length,0);
 a.name='Rumah Updated';a.config.w=5;a.views.se.pivot=[151,242];
 write([a,b]);assert.equal(bridge.refresh().count,2);
 assert.equal(bridge.entries[0].label,'Rumah Updated');
 assert.deepEqual(Array.from(bridge.entries[0].footprint),[5,3]);
 assert.equal(bridge.entries[0].variants.se.pivot[0],151);
 assert.equal(bridge.image('br-rumah-1','se'),png);
 assert.equal(window.VLAssetCatalog.filter(x=>x.file==='studio:br-rumah-1').length,1);
 write([b]);assert.equal(bridge.refresh().count,1);
 assert.equal(bridge.image('br-rumah-1'),null);
 assert.equal(window.VLAssetCatalog.length,2);
});
test('malformed asset updates never replace trusted source catalog',()=>{
 const {window,write}=setup();
 write([building('../invalid'),{...building('br-invalid'),views:{}}]);
 window.VLBuildingBridge.refresh();
 assert.equal(window.VLBuildingBridge.count,0);
 assert.equal(window.VLAssetCatalog[0].file,'pipeline:house');
});
test('Semesta refreshes building assets and instance metadata without replacing coordinates',()=>{
 const s=fs.readFileSync(path.join(root,'builder.js'),'utf8');
 assert.match(s,/function refreshBangunRuang\(/);
 assert.match(s,/e\.key===window\.VLBuildingBridge\?\.key/);
 assert.match(s,/assetByName\.clear\(\)/);
 assert.match(s,/renderAssetList\(\);(?:assetLibrary\?\.refresh\(\);)?saved\(\)/);
 assert.match(s,/const fields=\['width','height','collision'/);
 assert.ok(!s.includes('window.location.reload()'));
});
test('Bangun Ruang listens for character changes, refreshes only the saved library',()=>{
 const html=fs.readFileSync(path.join(root,'bangun-ruang/index.html'),'utf8');
 const scale=fs.readFileSync(path.join(root,'bangun-ruang/character-scale-preview.js'),'utf8');
 assert.ok(html.includes("event.key===KEY"));
 assert.ok(html.includes("scaleController?.refreshProfiles?.(false)"));
 assert.ok(html.includes('id="scaleSync"'));
 assert.ok(scale.includes('async function refreshProfiles(full=false)'));
});

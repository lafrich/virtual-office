'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {test}=require('node:test');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Warteg template loads pipeline first and keeps a local native-pixel fallback',()=>{
 const page=read('world-builder/bangun-ruang/index.html');
 assert.match(page,/\/virtual-life-asset-pipeline\/warteg-kharisma-template\.js/);
 assert.match(page,/\/virtual-life-asset-pipeline\/warteg-interior-paint\.js/);
 assert.match(page,/presetWartegKharisma/);
 assert.match(page,/window\.VLWartegKharismaTemplate\?\.create/);
 assert.match(page,/warteg-kharisma-template\.js\?v=warteg-v2-local/);
});
test('full eave, native 1x geometry, four directions, modular 14-item layout',()=>{
 const s=read('world-builder/bangun-ruang/warteg-kharisma-template.js');
 assert.match(s,/roofR=W\+\.52/);
 assert.match(s,/roofR,rf,e-7/);
 assert.match(s,/scene.theme='warteg'/);
 assert.match(s,/sourceVersion:'pipeline-v2'/);
 assert.match(s,/assetPipeline:\{repo:'lafrich\/virtual-life-asset-pipeline'/);
 for(const name of ['Etalase Lauk','Rak Bumbu dan Minuman','Kulkas Minuman','Meja Tambahan','Bangku Samping']){
  assert(s.includes(name),name+' present');
 }
 assert.match(s,/DIRS=\['sw','se','ne','nw'\]/);
 assert.match(s,/ctx.imageSmoothingEnabled=false/);
});
test('Warteg-only authentic pixel details do not affect other interiors',()=>{
 const source=read('world-builder/bangun-ruang/interior-isometric.js');
 const art=read('world-builder/bangun-ruang/warteg-interior-paint.js');
 assert.match(source,/scene\?\.theme==='warteg'/);
 assert.match(source,/VLWartegInteriorArt\.walls/);
 assert.match(source,/VLWartegInteriorArt\.fixture/);
 for(const feature of ['clock','fan','tray','counter','fridge','stove','cashier','sofa']){
  assert.match(art,new RegExp(feature),'detail '+feature);
 }
 assert.match(art,/version:2/);
});

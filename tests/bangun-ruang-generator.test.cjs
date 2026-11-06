/* Regression for Generate Building inside Bangun Ruang. No image AI or token. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const generator=require('../world-builder/bangun-ruang/procedural-generator.js');
const root=path.join(__dirname,'..');
test('recipes include houses, shops, offices, public landmarks and large buildings',()=>{
 for(const key of ['rumah','ruko','warung','kantor','hotel','mall','masjid'])
  assert.ok(generator.RECIPES[key],key);
});
test('same seed reproducibly generates the same editable geometry recipe',()=>{
 const left=generator.make('ruko',{seed:75,w:6,d:4,floors:3,interactive:true});
 const right=generator.make('ruko',{seed:75,w:6,d:4,floors:3,interactive:true});
 assert.deepEqual(left,right);
 assert.equal(left.recipe.renderer,'bangun-ruang-browser-v6b');
 assert.equal(left.config.w,6);
 assert.equal(left.config.d,4);
 assert.equal(left.config.floors,3);
 assert.equal(left.config.actions,'enter,buy');
 assert.equal(left.roomTemplate,'warung');
 assert.ok(['sw','se'].includes(left.config.front));
});
test('variation seed changes visual recipe while preserving origin',()=>{
 const a=generator.make('kantor',{seed:1}),b=generator.make('kantor',{seed:2});
 assert.equal(a.recipe.sourceId,b.recipe.sourceId);
 assert.notDeepEqual([a.config.wall,a.config.roof,a.config.windowStyle,a.config.balcony],
  [b.config.wall,b.config.roof,b.config.windowStyle,b.config.balcony]);
});
test('parametric dimensions stay within current Semesta and interior limits',()=>{
 const a=generator.make('hotel',{w:999,d:0,floors:99,seed:99});
 assert.equal(a.config.w,24);
 assert.equal(a.config.d,2);
 assert.equal(a.config.floors,12);
 assert.equal(a.config.collision,'yes');
 assert.equal(a.config.interactive,true);
 const b=generator.make('rumah',{interactive:false,wall:'pink',roof:'terracotta'});
 assert.equal(b.config.interactive,false);
 assert.equal(b.config.actions,'');
 assert.equal(b.config.wall,'pink');
 assert.equal(b.config.roof,'terracotta');
});
test('landmark uses native pipeline import rather than mislabelled generic geometry',()=>{
 const a=generator.make('masjid',{seed:22});
 assert.equal(a.nativeId,'masjid');
 assert.equal(a.recipe.renderer,'native-pipeline-source-copy');
 assert.equal(a.recipe.sourceId,'masjid');
});
test('generator mounted inside Bangun Ruang existing editor',()=>{
 const html=fs.readFileSync(path.join(root,'world-builder/bangun-ruang/index.html'),'utf8');
 assert.match(html,/id="openBuildingGenerator"/);
 assert.match(html,/procedural-generator\.js/);
 assert.match(html,/VLBangunGenerator\?\.mount/);
 assert.match(html,/apply\(result\.config\)/);
 assert.match(html,/interiorUi\?\.load/);
 assert.match(html,/applyInteriorTemplate/);
 assert.match(html,/generationRecipe:/);
 assert.match(html,/selectTab\(after===/);
});

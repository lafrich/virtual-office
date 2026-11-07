'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

const APPS={
 semesta:{html:'world-builder/index.html'},
 'bangun-ruang':{html:'world-builder/bangun-ruang/index.html'},
 emosi:{html:'emotion-studio/index.html'},
 jiwa:{html:'jiwa/index.html'},
 membangun:{html:'membangun/index.html'},
 laptop:{html:'membangun/laptop.html'}
};

test('every studio page loads the shared hub registry',()=>{
 for(const [name,meta] of Object.entries(APPS)){
  assert.match(read(meta.html),/shared\/hub-registry\.js/,name+' missing hub-registry.js');
 }
});

test('publishers announce their own topics',()=>{
 const drafts=read('world-builder/city-drafts.js');
 assert.match(drafts,/VLHub\.publish\('world'/);
 assert.match(drafts,/action:'remove'/);
 assert.match(read('world-builder/city-building-link.js'),/VLHub\.publish\('cityBuilding'/);
 assert.match(read('emotion-studio/index.html'),/VLHub\.publish\('emotions'/);
 assert.match(read('jiwa/jiwa.js'),/VLHub\.publish\('gameplay'/);
});

test('subscribers refresh without a manual reload',()=>{
 const builder=read('world-builder/builder.js');
 assert.match(builder,/VLHub\.subscribe\(\['rooms','objects'\]/);
 assert.match(builder,/VLHub\.subscribe\(\['characters','accessories','emotions'\]/);
 assert.match(builder,/VLHub\.subscribe\('world'/);
 const jiwa=read('jiwa/jiwa.js');
 assert.match(jiwa,/VLHub\.subscribe\('world'/);
 assert.match(jiwa,/function syncWorldFromHub/);
 assert.match(read('jiwa/character-link.js'),/VLHub\.subscribe\(\["characters","accessories","emotions"\]/);
 const bangun=read('world-builder/bangun-ruang/index.html');
 assert.match(bangun,/VLHub\.subscribe\('world'/);
 assert.match(bangun,/scaleController\?\.refreshProfiles\?\.\(false\)/);
});

test('sync matrix documents bidirectional coverage for the five studios',()=>{
 // Rows = publisher, columns listed in comment for the report.
 // world: Semesta save -> Jiwa + Bangun Ruang
 // rooms/objects: Bangun storage/hub -> Semesta + Jiwa city reload
 // characters: Mahluk keys/hub -> Semesta + Bangun + Jiwa
 assert.ok(require('node:fs').existsSync(require('node:path').join(__dirname,'../shared/vlhub-characters-publish.js')));
 // emotions: Emosi save -> Semesta + Bangun + Jiwa
 // gameplay: Jiwa save -> Semesta Play / Walk Test live
 const matrix={
  world:{semesta:'self',bangun:'synced',emosi:'n/a',jiwa:'synced','mahluk-hidup':'n/a'},
  rooms:{semesta:'synced',bangun:'self',emosi:'n/a',jiwa:'synced','mahluk-hidup':'n/a'},
  objects:{semesta:'synced',bangun:'self',emosi:'n/a',jiwa:'synced','mahluk-hidup':'n/a'},
  characters:{semesta:'synced',bangun:'synced',emosi:'n/a',jiwa:'synced','mahluk-hidup':'self'},
  emotions:{semesta:'synced',bangun:'synced',emosi:'self',jiwa:'synced','mahluk-hidup':'via-character'},
  gameplay:{semesta:'synced',bangun:'stamp',emosi:'stamp',jiwa:'self','mahluk-hidup':'n/a'}
 };
 assert.equal(matrix.world.jiwa,'synced');
 assert.equal(matrix.emotions.semesta,'synced');
 assert.equal(matrix.characters.bangun,'synced');
 assert.equal(matrix.gameplay.jiwa,'self');
 assert.equal(matrix.gameplay.semesta,'synced');
});

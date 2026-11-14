'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const playDir=path.join(root,'world-builder/njh-play-interiors');
const artDir=path.join(root,'world-builder/bangun-ruang/njh-interior-preview-art');
const play=JSON.parse(fs.readFileSync(path.join(playDir,'catalog.json'),'utf8')).items;
const art=JSON.parse(fs.readFileSync(path.join(artDir,'catalog.json'),'utf8')).items;
const ids=['water_tub','sekat_wc','fan','shoe_rack','bathtub','registration_desk'];
test('all 24 gameplay views reuse the existing authored NJH/Bangun Ruang PNGs verbatim',()=>{
 for(const id of ids)for(const d of ['sw','se','ne','nw']){
  const from=art[id]?.[d],actual=play[id]?.[d];
  assert.ok(from?.file,id+' '+d+' original source');
  assert.ok(actual?.file,id+' '+d+' existing source connected');
  assert.equal(path.resolve(playDir,actual.file),path.resolve(artDir,from.file));
  assert.equal(actual.sha256,from.sha256,'authored art hash unchanged');
  assert.deepEqual(actual.size,from.size,'source pixel dimensions untouched');
  assert.deepEqual(actual.pivot,from.pivot,'source ground-pivot untouched');
  assert.deepEqual(actual.footprint,from.footprint,'physics footprint stays authored');
  assert.ok(fs.existsSync(path.resolve(playDir,actual.file)),id+' '+d+' PNG must exist');
 }
});
test('missing-art fallback must not mask authored partitions with unrelated boxes',()=>{
 const source=fs.readFileSync(path.join(root,'world-builder/njh-play-interiors.js'),'utf8');
 assert.match(source,/if\(item.assetId==='sekat_wc'&&!img\)/);
 assert.match(source,/file.startsWith\('\.\.\/'\)\?\[base\+file\]/);
 assert.match(source,/const width=size\[0\]\*PIXEL_WORLD/);
 assert.match(source,/const height=size\[1\]\*PIXEL_WORLD\*VERTICAL_COMP/);
});

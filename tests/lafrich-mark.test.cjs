'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Hub=require('../shared/hub-registry.js');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

const PAGES=[
 ['membangun launcher','membangun/index.html'],
 ['mini laptop','membangun/laptop.html'],
 ['semesta','world-builder/index.html'],
 ['bangun ruang','world-builder/bangun-ruang/index.html'],
 ['emosi','emotion-studio/index.html'],
 ['jiwa','jiwa/index.html']
];

test('watermark lives in the shared module and is non-interactive',()=>{
 const src=read('shared/hub-registry.js');
 assert.match(src,/function installMark/);
 assert.match(src,/by Lafrich/);
 assert.match(src,/© Lafrich/);
 assert.match(src,/pointer-events:none/);
 assert.match(src,/safe-area-inset/);
 assert.match(src,/vl-lafrich-mark/);
 assert.match(src,/try\{installMark\(g\.document\);\}catch\{\}/);
});

test('each app page loads the shared module so the mark appears automatically',()=>{
 for(const [name,file] of PAGES){
  assert.match(read(file),/shared\/hub-registry\.js/,name+' should load hub-registry.js');
 }
 assert.match(read('world-builder/mahluk-hidup-bridge.js'),/installMark/);
 assert.match(read('jiwa/mechanics-panel.js'),/Play Test/);
});

test('installMark can be applied to a document used by Play Test pages',()=>{
 assert.equal(typeof Hub.installMark,'function');
});

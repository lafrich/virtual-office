'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Membangun is the entry point with all six canonical .EXE programs',()=>{
 const s=read('membangun/index.html');
 assert.ok(s.includes("const ids=['mahluk2','emotion','mahluk','bangun','semesta','jiwa'];"));
 for(const [id,name] of [
  ['mahluk2','MAHLUK HIDUP 2.0.EXE'],['emotion','EMOTION STUDIO.EXE'],['mahluk','MAHLUK HIDUP.EXE'],['bangun','BANGUN RUANG.EXE'],
  ['semesta','SEMESTA.EXE'],['jiwa','JIWA.EXE']
 ]){
  assert.ok(s.includes('data-app="'+id+'"'),'launcher missing '+id+' button');
  assert.ok(s.includes('data-art="'+id+'"'),'launcher missing '+id+' preview');
  assert.ok(s.includes(name),'launcher missing '+name+' label');
 }
 assert.ok(s.includes('https://lafrich.github.io/virtual-life-asset-pipeline/'));
  assert.ok(s.includes('https://lafrich.github.io/virtual-office/emotion-studio/'));
 assert.ok(s.includes('https://lafrich.github.io/virtual-office/world-builder/bangun-ruang/'));
 assert.ok(s.includes('https://lafrich.github.io/virtual-office/world-builder/'));
 assert.ok(s.includes('https://lafrich.github.io/virtual-office/jiwa/'));
 assert.ok(s.includes("requestedApp=new URLSearchParams(location.search).get('app')"));
 assert.ok(s.includes("let selected=ids.includes(requestedApp)?requestedApp:'mahluk2';"));
 assert.ok(s.includes("window.open(url,'_blank','noopener,noreferrer')"));
 assert.ok(s.includes("%ids.length"),'carousel navigation should use all apps');
});

test('desktop panels remain aligned and mobile launcher layout survives',()=>{
 const s=read('membangun/index.html');
 assert.ok(s.includes('@media (min-width:901px)'));
 assert.ok(s.includes('grid-template-columns:218px minmax(0,1fr) 236px'));
 assert.ok(s.includes('@media (min-width:701px) and (max-width:900px)'));
 assert.ok(s.includes('@media(max-width:700px)'));
 for(const id of ['mahluk2','emotion','mahluk','bangun','semesta','jiwa']){
  assert.ok(s.includes('data-app="'+id+'"'));
 }
});

test('Semesta and Bangun Ruang return through Membangun launcher',()=>{
 const semesta=read('world-builder/index.html');
 const bangun=read('world-builder/bangun-ruang/index.html');
 assert.ok(semesta.includes("location.href='../membangun/?app=semesta'"));
 assert.ok(semesta.includes("location.href='../membangun/?app=bangun'"));
 assert.ok(bangun.includes('href="../../membangun/?app=bangun"'));
 assert.ok(bangun.includes('href="../../membangun/?app=semesta"'));
});

test('JIWA reads saved Semesta city drafts and exposes city-object deep links',()=>{
 const jiwa=read('jiwa/index.html');
 const runtime=read('jiwa/jiwa.js');
 const semesta=read('world-builder/index.html');
 const bridge=read('world-builder/jiwa-link.js');
 assert.ok(jiwa.includes('<title>JIWA.EXE'));
 assert.ok(jiwa.includes('src="../world-builder/city-drafts.js"'));
 assert.ok(jiwa.includes('src="./jiwa.js"'));
 assert.ok(runtime.includes('window.VLCityDrafts.list()'));
 assert.ok(runtime.includes('window.VLCityDrafts.load(id)'));
 assert.ok(runtime.includes("const DB='jiwa-mechanics-v1'"));
 assert.ok(runtime.includes("params.get('object')"));
 assert.ok(semesta.includes('src="./jiwa-link.js'));
 assert.ok(bridge.includes("url.searchParams.set('city',city)"));
 assert.ok(bridge.includes("url.searchParams.set('object',id)"));
});

test('JIWA routes bypass the encrypted game service worker',()=>{
 const vm=require('node:vm');
 const handlers={};
 const scope='https://lafrich.github.io/virtual-office/';
 vm.runInNewContext(read('sw.js'),{
  self:{registration:{scope},addEventListener(type,handler){handlers[type]=handler;}},
  location:{origin:new URL(scope).origin},
  URL,
  importScripts(){},
  atob(){return ''},
  Uint8Array,console,Promise,setTimeout,clearTimeout
 },{filename:'sw.js'});
 assert.equal(typeof handlers.fetch,'function');
 for(const asset of ['jiwa/','jiwa/index.html','jiwa/jiwa.js','membangun/','world-builder/','emotion-studio/','emotion-studio/index.html']){
  let intercepted=false;
  handlers.fetch({
   request:{method:'GET',url:scope+asset,mode:'navigate'},
   respondWith(){intercepted=true;}
  });
  assert.equal(intercepted,false,asset+' should not require the encrypted game key');
 }
});

test('Emotion Studio uses native Male Base four-view head overlay without baking it into exports',()=>{
 const html=read('emotion-studio/index.html');
 for(const id of ['maleGuidePreview','showMaleGuide','maleGuideOpacity','pixelMaleOpacity','pixelOnion']){
  assert.ok(html.includes('id="'+id+'"'),'missing male overlay control '+id);
 }
 assert.match(html,/referenceImages:maleRefs/);
 assert.match(html,/ctx\.drawImage\(maleGuide,0,i\*112,64,112,0,0,64,112\)/);
 assert.match(html,/drawMalePreview\(\)/);
 assert.match(html,/MALE_BASE_HEAD_ATLAS/);
 const source=html.match(/const MALE_BASE_HEAD_ATLAS="data:image\/png;base64,([^"]+)"/);
 assert.ok(source,'original Human Male Base PNG should be embedded to avoid a cross-app dependency');
 const image=Buffer.from(source[1],'base64');
 assert.equal(image.readUInt32BE(16),64);
 assert.equal(image.readUInt32BE(20),448);
 assert.match(html,/function exportProject\(/);
 assert.match(html,/function exportPng\(/);
 assert.ok(!html.includes('loadUniversalAssets()'),'Emotion Studio must remain independent from Mahluk 2');
});

test('Emotion Studio Google Drive auth is separate from local save and uses drive.file only',()=>{
 const html=read('emotion-studio/index.html');
 const js=read('emotion-studio/drive-sync.js');
 for(const id of ['driveClientId','driveConfigure','driveConnect','driveRefresh','driveSave','driveFolder','save','deleteLocal'])
  assert.ok(html.includes('id="'+id+'"'),'Missing Drive/local control '+id);
 assert.ok(html.includes('src="./drive-sync.js?v=1"'));
 assert.ok(html.includes('https://accounts.google.com/gsi/client'));
 assert.ok(html.includes('await D.connect()'));
 assert.ok(html.includes('await D.loadAll('));
 assert.ok(html.includes('await D.save(entry,'));
 assert.ok(html.includes('await persistSaved(entry)'));
 assert.ok(js.includes('https://www.googleapis.com/auth/drive.file'));
 assert.ok(!js.includes('https://www.googleapis.com/auth/drive"'));
 assert.ok(js.includes('async function save(entry,opts={})'));
 assert.ok(js.includes('async function loadAll(onProgress)'));
 assert.ok(js.includes('async function ensureLibrary()'));
 assert.ok(js.includes('delete clean.template'));
 assert.ok(js.includes('https://www.googleapis.com/upload/drive/v3/files'));
 assert.ok(!html.includes('id="token"'),'Do not ask for GitHub token');
 assert.ok(!js.includes('localStorage.setItem(CLIENT_KEY,token)'),'OAuth access tokens must never persist');
 assert.doesNotThrow(()=>new (require('node:vm').Script)(js));
});

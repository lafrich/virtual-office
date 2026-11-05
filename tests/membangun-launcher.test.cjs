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
 for(const asset of ['jiwa/','jiwa/index.html','jiwa/jiwa.js','membangun/','world-builder/']){
  let intercepted=false;
  handlers.fetch({
   request:{method:'GET',url:scope+asset,mode:'navigate'},
   respondWith(){intercepted=true;}
  });
  assert.equal(intercepted,false,asset+' should not require the encrypted game key');
 }
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('root index is the NJH landing and no longer routes through the archive or office login',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/Namanya Juga Hidup/);
 assert.match(html,/>NJH</);
 assert.doesNotMatch(html,/location\.replace\('\.\/membangun\/'/);
 assert.match(html,/href="\.\/mainkan\/"/);
 assert.match(html,/href="\.\/world-builder\/"/);
 assert.match(html,/href="\.\/world-builder\/bangun-ruang\/"/);
 assert.match(html,/href="\.\/jiwa\/"/);
 assert.match(html,/href="\.\/membangun\/"/);
 assert.match(html,/href="\.\/emotion-studio\/"/);
 assert.match(html,/shared\/hub-registry\.js/);
 assert.doesNotMatch(html,/arsip\.html/);
 assert.doesNotMatch(html,/q\.has\('next'\)/);
 assert.doesNotMatch(html,/name="password"/);
 assert.match(html,/serviceWorker\.register\('\.\/sw\.js'/);
});

test('archive login page is gone',()=>{
 assert.equal(fs.existsSync('arsip.html'),false);
 assert.equal(fs.existsSync('data.enc'),false);
 assert.equal(fs.existsSync('game-core'),false);
 assert.equal(fs.existsSync('game-assets'),false);
 assert.equal(fs.existsSync('staging'),false);
});

test('Semesta asset vault ciphertext is kept',()=>{
 assert.equal(fs.existsSync('manifest.enc'),true);
 assert.equal(fs.existsSync('world-builder/virtual-life-vault.js'),true);
 const blobs=fs.readdirSync('b').filter(name=>name.endsWith('.enc'));
 assert.ok(blobs.length>0,'expected b/*.enc vault blobs');
});

test('service worker v7 no longer decrypts or redirects to arsip.html',()=>{
 const sw=fs.readFileSync('sw.js','utf8');
 assert.match(sw,/\/\* sw v\d+/);
 assert.doesNotMatch(sw,/arsip\.html/);
 assert.doesNotMatch(sw,/importScripts/);
 assert.doesNotMatch(sw,/office\.html/);
 assert.doesNotMatch(sw,/data\.enc/);
 assert.doesNotMatch(sw,/world-patches/);
 assert.doesNotMatch(sw,/onlineEnhanceHtml/);
 assert.doesNotMatch(sw,/assetbridge/);
 const handlers={};
 vm.runInNewContext(sw,{
  self:{registration:{scope:'https://lafrich.github.io/virtual-office/'},addEventListener(type,handler){handlers[type]=handler;}},
  location:{origin:'https://lafrich.github.io'},
  URL,importScripts(){},atob(){return ''},Uint8Array,console,Promise,setTimeout,clearTimeout
 },{filename:'sw.js'});
 assert.equal(typeof handlers.fetch,'function');
 assert.equal(typeof handlers.install,'function');
 assert.equal(typeof handlers.activate,'function');
 for(const asset of ['','index.html','arsip.html','membangun/','world-builder/','jiwa/','emotion-studio/']){
  let intercepted=false;
  handlers.fetch({
   request:{method:'GET',url:'https://lafrich.github.io/virtual-office/'+asset,mode:'navigate'},
   respondWith(){intercepted=true;}
  });
  assert.equal(intercepted,false,asset+' must pass through to the network');
 }
});

test('Membangun launcher keeps the new game title and no longer links to the archive',()=>{
 const html=fs.readFileSync('membangun/index.html','utf8');
 assert.match(html,/Namanya Juga Hidup: The Game — Membangun/);
 assert.doesNotMatch(html,/href="\.\.\/arsip\.html"/);
 assert.doesNotMatch(html,/Arsip: Virtual Life v15a/);
 assert.match(html,/serviceWorker\.register/);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

test('root index sends people to Membangun unless a game next= target is present',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/Namanya Juga Hidup: The Game/);
 assert.match(html,/q\.has\('next'\)\?'\.\/arsip\.html':'[\.]\/membangun\/'/);
 assert.match(html,/href="\.\/membangun\/"/);
 assert.match(html,/href="\.\/arsip\.html"/);
 assert.doesNotMatch(html,/name="password"/);
});

test('archive page is the previous login screen with relative game paths unchanged',()=>{
 const html=fs.readFileSync('arsip.html','utf8');
 assert.match(html,/<title>Arsip: Virtual Life v15a<\/title>/);
 assert.match(html,/Arsip: Virtual Life v15a — Log On/);
 assert.match(html,/register\('sw\.js'/);
 assert.match(html,/function next\(\)/);
 assert.match(html,/manifest\.enc/);
 assert.match(html,/office\.html/);
});

test('service worker v5 treats the archive as plaintext and unlocks via arsip.html',()=>{
 const sw=fs.readFileSync('sw.js','utf8');
 assert.match(sw,/sw v5/);
 assert.match(sw,/'arsip\.html'/);
 assert.match(sw,/SCOPE \+ 'arsip\.html\?next='/);
 assert.doesNotMatch(sw,/SCOPE \+ '\?next='/);
 const handlers={};
 vm.runInNewContext(sw,{
  self:{registration:{scope:'https://lafrich.github.io/virtual-office/'},addEventListener(type,handler){handlers[type]=handler;}},
  location:{origin:'https://lafrich.github.io'},
  URL,importScripts(){},atob(){return ''},Uint8Array,console,Promise,setTimeout,clearTimeout
 },{filename:'sw.js'});
 let intercepted=false;
 handlers.fetch({
  request:{method:'GET',url:'https://lafrich.github.io/virtual-office/arsip.html',mode:'navigate'},
  respondWith(){intercepted=true;}
 });
 assert.equal(intercepted,false,'arsip.html must not require the encrypted game key');
});

test('Membangun launcher shows the new game title and a link to the archive',()=>{
 const html=fs.readFileSync('membangun/index.html','utf8');
 assert.match(html,/Namanya Juga Hidup: The Game — Membangun/);
 assert.match(html,/href="\.\.\/arsip\.html"/);
 assert.match(html,/Arsip: Virtual Life v15a/);
});

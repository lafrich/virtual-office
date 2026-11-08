'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('mainkan/index.html');
const app=read('mainkan/app.js');
const launcher=read('membangun/index.html');
const semesta=read('world-builder/builder.js');
const semestaIndex=read('world-builder/index.html');
const playerCSS=read('world-builder/semesta-player.css');
test('mainkan client and Semesta player CSS parse',()=>{
 assert.doesNotThrow(()=>new vm.Script(app,{filename:'mainkan/app.js'}));
 assert.doesNotThrow(()=>new vm.Script(read('mainkan/config.js')));
});
test('mainkan onboarding and native Semesta iframe exist',()=>{
 for(const id of ['splashScreen','loginScreen','characterScreen','gameScreen','authForm','guestButton','characterForm','semestaFrame','worldLoading','exitGame','reloadWorld'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Windows 98|mainkan\.exe/i);
 assert.match(app,/world-builder\//);
 assert.match(app,/searchParams\.set\('player','1'\)/);
 assert.match(app,/mainkan:semesta-ready/);
 assert.doesNotMatch(app,/world\.json/);
 assert.doesNotMatch(app,/drawTerrain|drawObject|function blocked\(/);
});
test('login requires real server; browser never stores Mainkan passwords',()=>{
 assert.match(app,/authenticated!==true/);
 assert.match(app,/saved!==true/);
 assert.doesNotMatch(app,/(?:localStorage|sessionStorage)\s*\./);
});
test('Semesta has a native read-only player entry, real walk, life and 3D render',()=>{
 assert.match(semestaIndex,/semesta-player\.css/);
 assert.match(semestaIndex,/player'\)===\x271\x27/);
 assert.match(playerCSS,/semesta-player-mode/);
 assert.match(playerCSS,/#canvas-wrap/);
 assert.match(semesta,/const playerMode=/);
 assert.match(semesta,/if\(playerMode&&m!==\x27walk\x27\)return/);
 assert.match(semesta,/if\(playerMode\)return; \/\/ Preview/);
 assert.match(semesta,/setMode\(\x27walk\x27\)/);
 assert.match(semesta,/SemestaLifePlay\?\.start/);
 assert.match(semesta,/renderer\.render\(scene,camera\)/);
 assert.match(semesta,/mainkan:semesta-ready/);
});
test('Membangun opens the standalone player client',()=>{
 assert.match(launcher,/data-app="mainkan"/);
 assert.match(launcher,/data-art="mainkan"/);
 assert.match(launcher,/virtual-office\/mainkan\//);
});

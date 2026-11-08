'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(base,'mainkan/index.html'),'utf8');
const app=fs.readFileSync(path.join(base,'mainkan/app.js'),'utf8');
const launcher=fs.readFileSync(path.join(base,'membangun/index.html'),'utf8');
test('mainkan client JS and config parse',()=>{
  assert.doesNotThrow(()=>new vm.Script(app,{filename:'mainkan/app.js'}));
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path.join(base,'mainkan/config.js'),'utf8')));
});
test('mainkan screens and login/guest controls exist',()=>{
  for(const id of ['splashScreen','loginScreen','characterScreen','gameScreen','authForm','guestButton','characterForm','world','actionButton','exitGame'])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/Windows 98|mainkan\.exe/i);
});
test('mainkan does not invent an online login or browser save',()=>{
  assert.match(app,/authenticated!==true/);
  assert.match(app,/saved!==true/);
  assert.doesNotMatch(app,/(localStorage|sessionStorage)\s*\./);
});
test('mainkan reuses published Semesta world, pipeline and shared spawn rules',()=>{
  assert.match(html,/world-builder\/pipeline-catalog\.js/);
  assert.match(html,/shared\/spawn-respawn\.js/);
  assert.match(app,/world-builder\/world\.json/);
});
test('Membangun launcher opens the distinct player client',()=>{
  assert.match(launcher,/data-app="mainkan"/);
  assert.match(launcher,/data-art="mainkan"/);
  assert.match(launcher,/virtual-office\/mainkan\//);
});

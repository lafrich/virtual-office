'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('offline Mainkan static entry and controls are wired before gameplay',()=>{
 const html=read('mainkan/index.html'),app=read('mainkan/app.js');
 for(const id of ['welcomeContinue','welcomeGuest','offlineDownload','offlineSave','offlineLoad','offlineExport','offlineImport','offlineImportFile']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.ok(html.indexOf('offline-save.js')<html.indexOf('/app.js'));
 assert.match(app,/const offlineMode=/);
 assert.match(app,/OFF\?\.putCharacter\(characterDraft\)/);
 assert.match(app,/if\(offlineMode\)\{\s*if\(!OFF/);
 assert.match(app,/testPlayerId=offlineId/);
 assert.match(app,/function persistOffline/);
 assert.match(app,/stop\?\.\(\);/);
 assert.match(app,/OFF\.clear\(\)/);
 for(const file of ['mainkan/offline-save.js','mainkan/offline-ui.js','mainkan/offline-assets.js','sw.js'])
  assert.doesNotThrow(()=>new vm.Script(read(file),{filename:file}));
});
test('offline save controls call native Semesta hooks and never mock success',()=>{
 const ui=read('mainkan/offline-ui.js'),life=read('world-builder/semesta-life-play.js');
 for(const hook of ['saveSlot','loadSlot','persist'])
  assert.match(ui,new RegExp('\\.'+hook+'\\('));
 assert.match(ui,/\.hasSave\?\.\(/);
 assert.match(life,/paused:false/);
 assert.match(life,/loadState:next/);
 const sw=read('sw.js');
 assert.match(sw,/\/\* sw v49/);
 assert.match(sw,/NJH_PREFETCH/);
 assert.match(sw,/world-builder\/'/);
 assert.doesNotMatch(ui,/NJH98Mock|SIMULASI/);
});

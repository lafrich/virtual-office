'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const semesta=read('world-builder/index.html'),builder=read('world-builder/builder.js');
const mainkan=read('mainkan/index.html'),runtime=read('mainkan/game-hud.js');
const editor=read('mainkan/ui-editor.html'),editorJs=read('mainkan/ui-editor.js');
const HL=require('../shared/hud-layout.js');

test('Semesta has map authoring and pure exploration, but no game HUD editor',()=>{
 assert.doesNotMatch(semesta,/id="tabUIEditor"|id="semestaUIEditorPane"|semesta-ui-editor\.js/);
 assert.match(semesta,/id="walkMode" title="EXPLORE \/ WALK TEST/);
 assert.match(builder,/if\(!playerMode\)return null; \/\/ No game HUD in Semesta exploration/);
 assert.match(builder,/if\(!playerMode\)return walkRunning\?6\.5:4\.1/);
 assert.match(builder,/if\(playerMode\)window\.SemestaLifePlay\?\.start\?\.\(\)/);
 assert.match(builder,/if\(playerMode\)try\{beginSpawnRespawn\(first,'playStart'\)/);
 assert.match(builder,/else if\(playerMode&&e\.key\.toLowerCase\(\)==='e'&&mode==='walk'\)/);
});
test('Mainkan owns game UI editor and positions real visible controls, not duplicate Semesta chrome',()=>{
 assert.match(mainkan,/href="\.\/ui-editor\.html" id="openUIEditor"/);
 assert.match(mainkan,/shared\/hud-layout\.js/);
 assert.match(mainkan,/mainkan-hud-edit-20261108/);
 for(const [id,element] of Object.entries({gameWallet:'money',
  gamePhone:'hpButton',gameBag:'bagButton',gameAction:'action',gameRun:'run'})){
  assert.match(mainkan,new RegExp('id="'+id+'" data-hud-item="'+element+'"'));
 }
 assert.doesNotMatch(mainkan,/id="gameNeeds"/);
 assert.match(runtime,/viewport\.appendChild\(bar\)/);
 assert.match(runtime,/HL\.resolveSavedLayout\(null,localStorage\)/);
 assert.match(runtime,/getElementById\(id\)/);
 assert.match(runtime,/runEvent\('pointerdown'\)/);
 assert.match(runtime,/window\.MainkanHUDLayout=Object\.freeze/);
});
test('Mainkan HUD editor has live drag, resize, Desktop + Phone, grid and verified global Save',()=>{
 for(const id of ['uiProfile','hudStage','uiElement','uiAnchor','uiX','uiY','uiScale',
  'uiSave','uiResetProfile','uiRevert','uiShowGrid','uiSnap','uiGridSize',
  'uiCenterX','uiCenterY','uiCenterBoth'])assert.match(editor,new RegExp('id="'+id+'"'));
 assert.match(editorJs,/function down\(e,id\)/);
 assert.match(editorJs,/function move\(e\)/);
 assert.match(editorJs,/function positionSlot\(/);
 assert.match(editorJs,/function render\(/);
 assert.match(editorJs,/HL\.saveGlobalLayout\(draft,localStorage\)/);
 assert.match(editorJs,/root\.MainkanUIEditor=Object\.freeze/);
 assert.doesNotMatch(editorJs,/SemestaUIEditor|saveCity|saveDraftMenu/);
});
test('Global HUD data remains compatible with legacy saved layout, no city rewrite',()=>{
 const m=new Map(),storage={
  getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),
  get length(){return m.size;},key:i=>[...m.keys()][i]};
 const layout=HL.defaults();
 layout.desktop.action={anchor:'center-center',x:210,y:70,scale:1.3};
 layout.phone.hpButton={anchor:'bottom-right',x:46,y:31,scale:.8};
 const saved=HL.saveGlobalLayout(layout,storage);
 assert.equal(saved.ok,true);
 assert.equal(saved.scope,'global-game-ui');
 const recovered=HL.resolveSavedLayout('another-city',storage);
 assert.equal(recovered.scope,'global-game-ui');
 assert.deepEqual(recovered.layout,HL.normalize(layout));
 assert.equal(HL.normalizeSlot({anchor:'top-left',x:9000,y:-9000,scale:10}).x,4096);
});
test('Jiwa remains responsible for mechanic configuration, not HUD placement',()=>{
 const jiwa=read('jiwa/index.html');
 assert.doesNotMatch(jiwa,/data-tab="ui"|id="uiView"|ui-layout-editor\.js/);
 assert.match(builder,/SemestaLifePlay\.attach\(/);
 assert.match(builder,/SemestaLifePlay\?\.tick\?\.\(dt\)/);
});
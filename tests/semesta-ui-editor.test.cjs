'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const path=p=>fs.readFileSync(p,'utf8');
const HL=require('../shared/hud-layout.js'),G=require('../shared/gameplay-schema.js');
test('Semesta right inspector has one Edit UI tab and full editing controls',()=>{
 const html=path('world-builder/index.html'),css=path('world-builder/xp.css'),js=path('world-builder/semesta-ui-editor.js');
 for(const id of ['tabUIEditor','semestaUIEditorPane','suiElement','suiShowGrid','suiSnap','suiGridSize',
  'suiCenterX','suiCenterY','suiCenterBoth','suiAnchor','suiX','suiY','suiScale','suiSave','suiReset','suiCancel'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/semesta-ui-editor\.js/);
 assert.match(css,/#semestaUIOverlay/);
 assert.match(css,/#inspector\.sui-editing/);
 assert.match(js,/function pointerStart\(/);
 assert.match(js,/function pointerMove\(/);
 assert.match(js,/function changeSlot\(/);
 assert.match(js,/function relativeToSlot\(/);
 assert.match(js,/HL\.saveGlobalLayout\(draft,localStorage\)/);
 assert.match(js,/root\.SemestaPlay\?\.refreshHud\?\.\(\)/);
});
test('Game UI edits are global, preview-only until Save, unaffected by city draft',()=>{
 const builder=path('world-builder/builder.js'),editor=path('world-builder/semesta-ui-editor.js');
 assert.match(builder,/SemestaUIEditor\?\.previewLayout\?\.\(\)/);
 assert.match(builder,/HL\?\.resolveSavedLayout\?\.\(null,localStorage\)/);
 assert.match(builder,/refreshHud:syncPlayHud/);
 assert.match(editor,/function start\(\)/);
 assert.match(editor,/if\(!root\.SemestaLifePlay\?\.active\?\.\(\)\)/);
 assert.match(editor,/function save\(\)/);
 assert.match(editor,/function stop\(\)/);
 assert.match(editor,/draft=null;dirty=false/);
 assert.doesNotMatch(editor,/saveCity|cityId|saveDraftMenu/);
});
test('Jiwa does not have UI Editor tab, script or secondary Systems layout form',()=>{
 const index=path('jiwa/index.html'),jiwa=path('jiwa/jiwa.js'),systems=path('jiwa/mechanics-panel.js');
 assert.doesNotMatch(index,/data-tab="ui"/);
 assert.doesNotMatch(index,/id="uiView"/);
 assert.doesNotMatch(index,/ui-layout-editor\.js/);
 assert.doesNotMatch(systems,/card\('HUD LAYOUT'/);
 assert.doesNotMatch(jiwa,/\['map','systems','test','context','play','ui'\]/);
 for(const mode of ['map','systems','test','context','play'])assert.match(index,new RegExp('data-tab="'+mode+'"'));
});
test('The global HUD layout survives map changes and retains custom positions',()=>{
 const m=new Map(),storage={getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),
  key:i=>[...m.keys()][i]||null,get length(){return m.size}};
 const g=HL.defaults();g.desktop.money={anchor:'center-center',x:0,y:0,scale:1.1};
 const saved=HL.saveGlobalLayout(g,storage);
 assert.equal(saved.ok,true);
 for(const city of ['Jakarta City','Bandung City','__jiwa_global__','new-map']){
  const got=HL.resolveSavedLayout(city,storage);
  assert.equal(got.scope,'global-game-ui');
  assert.deepEqual(got.layout,g);
 }
 assert.equal(HL.normalizeSlot({x:2100,y:1500,scale:1.2,anchor:'top-left'}).x,2100);
 assert.equal(G.normalizeGameplay({modules:{hudLayout:g}}).modules.hudLayout.desktop.money.anchor,'center-center');
});

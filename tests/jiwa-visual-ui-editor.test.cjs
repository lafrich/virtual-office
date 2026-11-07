'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const HL=require('../shared/hud-layout.js');
const G=require('../shared/gameplay-schema.js');
const read=p=>fs.readFileSync(p,'utf8');
test('Jiwa UI Editor is a visible tab and uses canonical gameplay HUD module',()=>{
 const html=read('jiwa/index.html'),js=read('jiwa/ui-layout-editor.js'),jiwa=read('jiwa/jiwa.js');
 assert.match(html,/data-tab="ui"/);
 assert.match(html,/id="uiView"/);
 assert.match(html,/id="juiStage"/);
 assert.match(html,/id="juiSave"/);
 assert.match(html,/src="\.\/ui-layout-editor\.js/);
 assert.match(jiwa,/\['map','systems','test','context','play','ui'\]/);
 assert.match(jiwa,/jiwa:ui-layout:render/);
 assert.match(js,/HL\.normalize/);
 assert.match(js,/B\.setUILayout/);
 assert.match(js,/stage\.addEventListener\('pointerdown'/);
 assert.match(js,/stage\.addEventListener\('pointermove'/);
 assert.match(js,/stage\.addEventListener\('pointerup'/);
 assert.match(js,/B\.saveUILayout\?\.\(\)/);
 assert.doesNotMatch(js,/\.innerHTML\s*=\s*.*Nokia\.render/);
});
test('Desktop and phone have independent slots for Nokia, buttons and survival panel',()=>{
 const layout=HL.defaults();
 for(const profile of ['desktop','phone']){
  for(const id of ['lifePanel','money','hpButton','bagButton','phone','bag','action','run','needs','toast','dock'])
   assert.ok(layout[profile][id],profile+'/'+id+' must be editable');
 }
 assert.ok(layout.phone.action.scale<layout.desktop.action.scale);
 const a=HL.normalize({desktop:{hpButton:{anchor:'top-left',x:100,y:43,scale:1.2}}});
 assert.equal(a.desktop.hpButton.x,100);
 assert.notEqual(a.phone.hpButton.x,100);
 assert.equal(a.desktop.hpButton.scale,1.2);
});
test('UI Editor is global; city ID cannot change its saved layout',()=>{
 const jiwa=read('jiwa/jiwa.js'),builder=read('world-builder/builder.js');
 const ui=read('jiwa/ui-layout-editor.js');
 assert.match(jiwa,/getUILayout:\(\)=>gameUILayout\(\)/);
 assert.match(jiwa,/setUILayout:next=>editGameUILayout\(next\)/);
 assert.match(jiwa,/saveUILayout:\(\)=>saveGameUILayout\(\)/);
 assert.doesNotMatch(jiwa,/saveHudLayoutCache/);
 assert.match(builder,/HL\?\.resolveSavedLayout\?\.\(null,localStorage\)/);
 assert.match(builder,/key===window\.VLHudLayout\?\.GLOBAL_LAYOUT_KEY/);
 assert.match(builder,/addEventListener\('storage',e=>/);
 assert.match(ui,/B\.getUILayout\?\.\(\)/);
 assert.match(ui,/B\.saveUILayout\?\.\(\)/);
});
test('HUD uses real Nokia and preserves actual Action controls',()=>{
 const hud=read('shared/play-hud.js');
 assert.match(hud,/VLNokiaPlay/);
 assert.match(hud,/ptPhoneBtn/);
 assert.match(hud,/ptBagBtn/);
 assert.match(hud,/ptActionBtn/);
 const g=G.defaultGameplay();
 g.modules.hudLayout.desktop.hpButton.x=24;
 const n=G.normalizeGameplay(g);
 assert.equal(n.modules.hudLayout.desktop.hpButton.x,24);
 assert.ok(HL.SELECTORS.lifePanel.includes('#semestaLifePlayPanel'));
});

test('Grid and snapping tools are real controls and do not alter Semesta city assets',()=>{
 const html=read('jiwa/index.html'),js=read('jiwa/ui-layout-editor.js');
 for(const id of ['juiGrid','juiShowGrid','juiSnapGrid','juiGridSize','juiAlignHorizontal','juiAlignVertical','juiAlignBoth'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/snapCoord/);
 assert.match(js,/slotForRect/);
 assert.match(js,/s\.anchor=vertical\+'-'\+horizontal/);
 assert.match(js,/localStorage\.setItem\(GRID_PREF_KEY/);
 assert.match(js,/const targetX=snapCoord\(/);
 assert.match(js,/const targetY=snapCoord\(/);
});
test('Canonical center anchors stay centered at any viewport size',()=>{
 assert.ok(HL.ANCHORS.includes('top-center'));
 assert.ok(HL.ANCHORS.includes('center-right'));
 assert.ok(HL.ANCHORS.includes('center-center'));
 function fakeHost(w,h){return {clientWidth:w,clientHeight:h,ownerDocument:{defaultView:null},
  getBoundingClientRect:()=>({width:w,height:h,left:0,top:0})};}
 const el={offsetWidth:72,offsetHeight:72};
 for(const [w,h] of [[1280,720],[1920,1080],[390,844]]){
  const both=HL.placedRect(fakeHost(w,h),el,{anchor:'center-center',x:0,y:0,scale:1},{w:72,h:72});
  assert.equal(both.x+both.w/2,w/2);
  assert.equal(both.y+both.h/2,h/2);
  const x=HL.placedRect(fakeHost(w,h),el,{anchor:'bottom-center',x:0,y:10,scale:1},{w:72,h:72});
  assert.equal(x.x+x.w/2,w/2);
  assert.equal(x.y, h-72-10);
  const y=HL.placedRect(fakeHost(w,h),el,{anchor:'center-right',x:10,y:0,scale:1},{w:72,h:72});
  assert.equal(y.y+y.h/2,h/2);
  assert.equal(y.x,w-72-10);
 }
});
test('One global save applies unchanged to Jakarta, Bandung and any future city',()=>{
 const storeMap=new Map();
 const storage={getItem:k=>storeMap.get(k)||null,
  setItem:(k,v)=>storeMap.set(k,v),
  get length(){return storeMap.size;},
  key:i=>[...storeMap.keys()][i]||null};
 const old=HL.defaults();
 old.desktop.hpButton={scale:1,anchor:'top-left',x:73,y:41};
 storeMap.set('jiwa-hud-layout-city-v1:jakarta',JSON.stringify({layout:old,at:3000}));
 const recovered=HL.resolveSavedLayout('bandung',storage);
 assert.ok(recovered);
 assert.equal(recovered.layout.desktop.hpButton.x,73,'older city work must be recoverable');
 const layout=HL.normalize(recovered.layout);
 layout.desktop.hpButton={scale:1,anchor:'center-center',x:0,y:0};
 const saved=HL.saveGlobalLayout(layout,storage);
 assert.ok(saved.ok,saved.reason);
 for(const city of ['jakarta','bandung','__jiwa_global__','new_future_city']){
  const chosen=HL.resolveSavedLayout(city,storage);
  assert.equal(chosen.scope,'global-game-ui');
  assert.deepEqual(chosen.layout,layout);
 }
 const stale=HL.defaults();stale.desktop.hpButton.x=450;
 storeMap.set('jiwa-hud-layout-city-v1:jakarta',JSON.stringify({layout:stale,at:9000000000}));
 assert.equal(HL.resolveSavedLayout('jakarta',storage).layout.desktop.hpButton.x,0,
  'later city data must not override global game UI');
});

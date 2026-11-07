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
 assert.match(js,/B\.set\(g\)/);
 assert.match(js,/stage\.addEventListener\('pointerdown'/);
 assert.match(js,/stage\.addEventListener\('pointermove'/);
 assert.match(js,/stage\.addEventListener\('pointerup'/);
 assert.match(js,/document\.getElementById\('save'\)\?\.click\(\)/);
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
test('Jiwa saves per-city cache and Semesta reads matching city/global fallback',()=>{
 const jiwa=read('jiwa/jiwa.js'),builder=read('world-builder/builder.js');
 assert.match(jiwa,/HUD_LAYOUT_PREFIX='jiwa-hud-layout-city-v1:'/);
 assert.match(jiwa,/saveHudLayoutCache\(p\.cityId,p\.gameplay\)/);
 assert.match(jiwa,/saveHudLayoutCache\(state\.project\.cityId,state\.project\.gameplay\)/);
 assert.match(builder,/jiwa-hud-layout-city-v1:/);
 assert.match(builder,/activeDraftId\|\|'__jiwa_global__'/);
 assert.match(builder,/addEventListener\('storage',e=>/);
 assert.match(builder,/syncPlayHud\(\)/);
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

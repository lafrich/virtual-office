'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.UI_EDITOR_URL||'http://127.0.0.1:8091/virtual-office/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const ctx=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 await page.goto(base+'world-builder/',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.SemestaPlay&&window.SemestaUIEditor&&window.SemestaLifePlay,
  null,{timeout:90000});
 await page.waitForLoadState('load',{timeout:60000}).catch(()=>{});
 await page.evaluate(()=>window.VLQuickTutorial?.close?.());
 await page.locator('#tabUIEditor').click({timeout:25000});
 await page.waitForFunction(()=>window.SemestaUIEditor?.active?.()&&window.SemestaLifePlay?.active?.(),
  null,{timeout:25000});
 assert.ok(await page.locator('#semestaUIEditorPane').isVisible());
 assert.ok(await page.locator('#semestaUIOverlay').isVisible());
 assert.equal(await page.locator('#suiSnap').isChecked(),true);
 assert.equal(await page.locator('#suiShowGrid').isChecked(),true);
 const before=await page.evaluate(()=>({
  layout:window.SemestaUIEditor.previewLayout(),
  cityCount:window.SemestaPlay.playObjects().length,
  saved:localStorage.getItem(window.VLHudLayout.GLOBAL_LAYOUT_KEY)
 }));
 console.log('SEMESTA_UI_BEFORE',JSON.stringify({action:before.layout.desktop.action,
  cityCount:before.cityCount,hadSaved:!!before.saved}));
 await page.locator('#suiGridSize').selectOption('32');
 await page.locator('#suiElement').selectOption('action');
 const outline=page.locator('.sui-outline[data-sui-id="action"]');
 await outline.waitFor({state:'visible',timeout:15000});
 const o=await outline.boundingBox();assert.ok(o&&o.width>=20&&o.height>=20);
 await page.mouse.move(o.x+o.width/2,o.y+o.height/2);
 await page.mouse.down();await page.mouse.move(o.x+o.width/2-90,o.y+o.height/2-56,{steps:8});await page.mouse.up();
 const dragged=await page.evaluate(()=>window.SemestaUIEditor.previewLayout().desktop.action);
 assert.notDeepEqual(dragged,before.layout.desktop.action,'Direct drag must modify actual HUD layout preview');
 assert.equal(dragged.anchor,before.layout.desktop.action.anchor);
 const unsaved=await page.evaluate(()=>localStorage.getItem(window.VLHudLayout.GLOBAL_LAYOUT_KEY));
 assert.equal(unsaved,before.saved,'Drag must not persist until Save');
 await page.locator('#suiCenterBoth').click();
 const centered=await page.evaluate(()=>window.SemestaUIEditor.previewLayout().desktop.action);
 assert.equal(centered.anchor,'center-center');assert.equal(centered.x,0);assert.equal(centered.y,0);
 const actual=await page.evaluate(()=>{
  const a=document.getElementById('ptActionBtn').getBoundingClientRect();
  const h=document.getElementById('vlPlayHud').getBoundingClientRect();
  return {dx:a.left+a.width/2-(h.left+h.width/2),dy:a.top+a.height/2-(h.top+h.height/2),
   w:a.width,h:a.height,transform:document.getElementById('ptActionBtn').style.transform};
 });
 console.log('SEMESTA_UI_ACTUAL_AFTER_ALIGN',JSON.stringify({dragged,centered,actual}));
 assert.ok(Math.abs(actual.dx)<=5&&Math.abs(actual.dy)<=5,'Actual Action widget must center: '+JSON.stringify(actual));
 await page.locator('#suiSave').click();
 await page.waitForFunction(()=>document.getElementById('suiStatus')?.textContent?.includes('SAVED'),null,{timeout:10000});
 const saved=await page.evaluate(()=>{
  const raw=JSON.parse(localStorage.getItem(window.VLHudLayout.GLOBAL_LAYOUT_KEY)||'null');
  const layout=window.SemestaPlay.gameplay().modules.hudLayout;
  return {global:raw,live:layout.desktop.action,cityCount:window.SemestaPlay.playObjects().length};
 });
 assert.equal(saved.global.scope,'global-game-ui');
 assert.deepEqual(saved.global.layout.desktop.action,centered);
 assert.deepEqual(saved.live,centered);
 assert.equal(saved.cityCount,before.cityCount,'HUD edit must not change map assets');
 await page.locator('#suiElement').selectOption('money');
 await page.locator('#suiCenterX').click();
 const second=await page.evaluate(()=>window.SemestaUIEditor.previewLayout().desktop.money);
 assert.ok(second.anchor.endsWith('-center'),'Align X must change money horizontal anchor');
 await page.locator('#suiSave').click();
 await page.locator('#suiCancel').click();
 assert.equal(await page.locator('#semestaUIOverlay').isVisible(),false);
 assert.equal(await page.locator('#semestaUIEditorPane').isVisible(),false);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.SemestaPlay&&window.VLHudLayout,null,{timeout:90000});
 const reload=await page.evaluate(()=>{
  const g=window.SemestaPlay.gameplay(),HL=window.VLHudLayout;
  const saved=JSON.parse(localStorage.getItem(HL.GLOBAL_LAYOUT_KEY)||'null');
  const samples=['jakarta','bandung','__jiwa_global__','new_map'].map(id=>HL.resolveSavedLayout(id,localStorage).layout.desktop.action);
  return {live:g.modules.hudLayout.desktop.action,saved:saved.layout.desktop.action,samples};
 });
 assert.deepEqual(reload.live,centered,'Reload must preserve saved UI');
 for(const cityLayout of reload.samples)assert.deepEqual(cityLayout,centered,'All cities must use one UI');
 await page.goto(base+'jiwa/',{waitUntil:'domcontentloaded'});
 const jiwa=await page.evaluate(()=>({ui:!!document.getElementById('uiView'),
  editorTab:!!document.querySelector('[data-tab="ui"]'),
  secondaryHudCard:document.getElementById('mechanicsPanel')?.textContent?.includes('HUD LAYOUT')}));
 assert.equal(jiwa.ui,false);assert.equal(jiwa.editorTab,false);
 assert.equal(jiwa.secondaryHudCard||false,false);
 console.log('SEMESTA_GLOBAL_UI_EDITOR_E2E_PASS',JSON.stringify({dragged,centered,second,reload,jiwa,errors}));
 assert.ok(!errors.some(x=>/ReferenceError|SyntaxError|TypeError/i.test(x)),'Browser JS errors '+errors.join(' | '));
 await browser.close();
})().catch(e=>{console.error('SEMESTA_GLOBAL_UI_EDITOR_E2E_FAIL',e.stack||e);process.exit(1)});

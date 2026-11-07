'use strict';
// Browser E2E: actual Jiwa drag/resize/save, same-origin Semesta Play HUD.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.UI_EDITOR_URL||'http://127.0.0.1:8091/virtual-office/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:1400,height:900}});
 const jiwa=await context.newPage(),semesta=await context.newPage();
 const errors=[];
 for(const [key,page] of [['jiwa',jiwa],['semesta',semesta]]){
  page.on('pageerror',e=>errors.push(key+': '+String(e.message||e)));
 }
 await jiwa.goto(base+'jiwa/',{waitUntil:'domcontentloaded',timeout:90000});
 await semesta.goto(base+'world-builder/',{waitUntil:'domcontentloaded',timeout:90000});
 await jiwa.waitForFunction(()=>!!window.JiwaContextBridge?.project?.()&&!!window.JiwaGameplayBridge&&!!window.JiwaUIVisualEditor,null,{timeout:90000});
 await semesta.waitForFunction(()=>!!window.SemestaPlay&&!!window.VLHudLayout,null,{timeout:90000});
 await semesta.waitForLoadState('load',{timeout:60000}).catch(()=>{});
 await semesta.evaluate(()=>window.VLQuickTutorial?.close?.());
 await jiwa.locator('[data-tab="ui"]').click();
 await jiwa.locator('#juiNode_money').count().catch(()=>0);
 assert.equal(await jiwa.locator('#juiStage').count(),1);
 assert.equal(await jiwa.locator('#juiNodes .jui-node').count(),9); // excludes hidden Nokia and bag popups
 await jiwa.locator('#juiElements [data-jui-select="money"]').click();
 const before=await jiwa.evaluate(()=>{
  const g=window.JiwaGameplayBridge.get();
  return {city:window.JiwaContextBridge.project()?.cityId,desktop:g.modules.hudLayout.desktop.money,
   phone:g.modules.hudLayout.phone.money};
 });
 const money=jiwa.locator('.jui-node[data-id="money"]');
 await money.scrollIntoViewIfNeeded();
 const box=await money.boundingBox();
 assert.ok(box&&box.width>15,'Money HUD preview must be visible and draggable');
 await jiwa.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await jiwa.mouse.down();await jiwa.mouse.move(box.x+box.width/2-44,box.y+box.height/2-25,{steps:7});await jiwa.mouse.up();
 const after=await jiwa.evaluate(()=>window.JiwaGameplayBridge.get().modules.hudLayout.desktop.money);
 const debugDrag=await jiwa.evaluate(()=>({
  stage:document.getElementById('juiStage').getBoundingClientRect().toJSON(),
  node:document.querySelector('.jui-node[data-id="money"]')?.getBoundingClientRect().toJSON(),
  snap:document.getElementById('juiSnapGrid')?.checked,
  pointer:window.JiwaUIVisualEditor?.debug?.()||null
 }));
 console.log('JIWA_DRAG_TELEMETRY',JSON.stringify({before,after,debugDrag}));
 assert.notEqual(after.x,before.desktop.x,'drag in preview must change desktop money x offset');
 assert.equal(after.anchor,before.desktop.anchor);
 const phoneUnchanged=await jiwa.evaluate(()=>window.JiwaGameplayBridge.get().modules.hudLayout.phone.money.x);
 assert.equal(phoneUnchanged,before.phone.x,'desktop editing must not alter Phone profile');
 await jiwa.locator('#juiPhone').click();
 await jiwa.locator('#juiElements [data-jui-select="action"]').click();
 await jiwa.locator('#juiScale').evaluate(el=>{el.value='0.75';el.dispatchEvent(new Event('change',{bubbles:true}));});
 const scales=await jiwa.evaluate(()=>{
  const l=window.JiwaGameplayBridge.get().modules.hudLayout;
  return {desktop:l.desktop.action.scale,phone:l.phone.action.scale};
 });
 assert.equal(scales.phone,.75,'Phone Action scale must save from resize properties');
 assert.equal(scales.desktop,1,'Phone changes must not change desktop Action');
 await jiwa.locator('#juiSave').click();
 await jiwa.waitForFunction(()=>document.getElementById('dirtyState')?.textContent==='SAVED',null,{timeout:15000});
 const browserStorage=await semesta.evaluate(()=>{
  const raw=JSON.parse(localStorage.getItem('jiwa-hud-layout-city-v1:__jiwa_global__')||'null');
  const g=window.SemestaPlay?.gameplay?.();
  return {cache:raw?.layout?.desktop?.money,applied:g?.modules?.hudLayout?.desktop?.money};
 });
 assert.ok(browserStorage.cache,'Jiwa must save cross-app layout cache');
 assert.equal(browserStorage.applied.x,after.x,'Semesta must read same per-city layout');
 await semesta.locator('#walkMode').click({timeout:20000});
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.active?.(),null,{timeout:20000});
 const runtime=await semesta.evaluate(()=>{
  const money=document.getElementById('vs-money'),life=document.getElementById('semestaLifePlayPanel');
  const g=window.SemestaPlay.gameplay();
  return {moneyTransform:money?.style?.transform||'',moneyPos:money?.dataset?.hudPos||'',
   life:!!life,profile:g?.modules?.hudLayout?.desktop?.money,phoneAction:g?.modules?.hudLayout?.phone?.action};
 });
 console.log('JIWA_SEMESTA_UI_LAYOUT',JSON.stringify({before,after,scales,browserStorage,runtime,errors}));
 assert.ok(runtime.life,'Survival panel must still exist');
 assert.equal(runtime.moneyPos,'translated','Custom money position must apply to actual live HUD');
 assert.match(runtime.moneyTransform,/translate\(/);
 assert.equal(runtime.profile.x,after.x);
 assert.equal(runtime.phoneAction.scale,.75);
 fs.mkdirSync('screenshots',{recursive:true});
 await jiwa.screenshot({path:'screenshots/jiwa-visual-ui-editor.png'});
 await semesta.screenshot({path:'screenshots/semesta-edited-hud.png'});
 assert.equal(errors.filter(x=>/ReferenceError|SyntaxError|TypeError/.test(x)).length,0,'Page runtime errors '+JSON.stringify(errors));
 await browser.close();
 console.log('JIWA_VISUAL_UI_EDITOR_E2E_PASS');
})().catch(e=>{console.error('JIWA_VISUAL_UI_EDITOR_E2E_FAIL',e.stack||e);process.exit(1)});

'use strict';
/* Authoring-only HUD browser smoke. No gameplay character or Semesta editor is required. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.HUD_EDITOR_TEST_URL||'http://127.0.0.1:8091/virtual-office/mainkan/ui-editor.html';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>!!window.MainkanUIEditor?.active?.());
  assert.equal(await page.locator('#uiProfile').inputValue(),'desktop');
  await page.locator('#uiElement').selectOption('action');
  await page.locator('#uiCenterBoth').click();
  const before=await page.evaluate(()=>window.MainkanUIEditor.previewLayout().desktop.action);
  assert.equal(before.anchor,'center-center');
  const node=page.locator('.hud-chip[data-element="action"]');
  const bb=await node.boundingBox();assert.ok(bb&&bb.width>25);
  await page.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);
  await page.mouse.down();
  await page.mouse.move(bb.x+bb.width/2+80,bb.y+bb.height/2+32,{steps:6});
  await page.mouse.up();
  const moved=await page.evaluate(()=>window.MainkanUIEditor.previewLayout().desktop.action);
  assert.notDeepEqual([moved.x,moved.y],[before.x,before.y],'Desktop action must drag');
  assert.equal(await page.locator('#uiStatus').textContent().then(s=>s.includes('UNSAVED')),true);
  await page.locator('#uiProfile').selectOption('phone');
  await page.locator('#uiElement').selectOption('hpButton');
  await page.locator('#uiCenterBoth').click();
  await page.locator('#uiScale').fill('1.2');
  await page.locator('#uiScale').dispatchEvent('input');
  const phone=await page.evaluate(()=>window.MainkanUIEditor.previewLayout().phone.hpButton);
  assert.equal(phone.anchor,'center-center');assert.equal(phone.scale,1.2);
  await page.locator('#uiShowGrid').uncheck();
  assert.equal(await page.locator('#grid').isVisible(),false);
  await page.locator('#uiSave').click();
  assert.match(await page.locator('#uiStatus').textContent(),/SAVED/);
  const stored=await page.evaluate(()=>{
   const state=window.VLHudLayout.resolveSavedLayout(null,localStorage);
   return {scope:state.scope,desktop:state.layout.desktop.action,phone:state.layout.phone.hpButton};
  });
  assert.equal(stored.scope,'global-game-ui');
  assert.deepEqual(stored.desktop,moved);
  assert.deepEqual(stored.phone,phone);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.MainkanUIEditor?.active?.());
  const recovered=await page.evaluate(()=>window.MainkanUIEditor.previewLayout());
  assert.deepEqual(recovered.desktop.action,moved);
  assert.deepEqual(recovered.phone.hpButton,phone);
  assert.equal(await page.locator('#uiProfile').inputValue(),'desktop');
  assert.equal(await page.locator('a[href="./"]').count(),1);
  assert.ok(!errors.some(s=>/ReferenceError|TypeError|SyntaxError/i.test(s)),errors.join(' | '));
  console.log('MAIN KAN UI EDITOR OK: desktop drag, phone scale, saved global state and reload');
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exit(1);});
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.UI_EDITOR_URL||'http://127.0.0.1:8091/virtual-office/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const ctx=await browser.newContext({viewport:{width:1500,height:1000}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 await page.goto(base+'world-builder/',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>!!window.SemestaPlay&&!!window.SemestaLifePlay&&!!window.SemestaUIEditor,
  null,{timeout:90000});
 await page.waitForLoadState('load',{timeout:60000}).catch(()=>{});
 await page.evaluate(()=>window.VLQuickTutorial?.close?.());
 await page.locator('#tabUIEditor').click();
 await page.waitForFunction(()=>window.SemestaUIEditor?.active?.(),null,{timeout:20000});
 const before=await page.evaluate(()=>window.SemestaUIEditor.previewLayout());
 await page.locator('#semestaDevicePhone').click();
 await page.waitForFunction(()=>{
  const w=document.getElementById('semestaDeviceFrame')?.contentWindow;
  return !!w?.SemestaLifePlay?.active?.()&&w?.SemestaUIEditor?.previewLayout?.()?.phone&&
   window.SemestaUIEditor?.profile?.()==='phone';
 },null,{timeout:90000});
 assert.equal(await page.locator('#suiSelectedOnly').isChecked(),true);
 const childBefore=await page.evaluate(()=>{
  const frame=document.getElementById('semestaDeviceFrame');
  const inner=frame.contentWindow;
  return {profile:window.SemestaUIEditor.profile(),
   phoneLayout:inner.SemestaUIEditor.previewLayout().phone.action,
   outerLayout:window.SemestaUIEditor.previewLayout().phone.action,
   frame:frame.getBoundingClientRect().toJSON(),
   stageVisible:!document.getElementById('semestaDeviceStage').hidden};
 });
 console.log('PHONE_UI_FRAME_READY',JSON.stringify(childBefore));
 assert.equal(childBefore.profile,'phone');
 assert.deepEqual(childBefore.phoneLayout,childBefore.outerLayout);
 assert.equal(childBefore.stageVisible,true);
 // Crowded HUD: panel selector and focused-only overlay stay usable.
 await page.locator('#suiElement').selectOption('hpButton');
 const node=page.locator('.sui-outline[data-sui-id="hpButton"]');
 await node.waitFor({state:'visible',timeout:20000});
 assert.equal(await page.locator('.sui-outline[data-sui-id="action"]').isVisible(),false);
 const coord=await node.boundingBox();
 assert.ok(coord&&coord.width>=16&&coord.height>=16,
  'HP should have a selectable draggable outline in the PHONE iframe');
 await page.mouse.move(coord.x+coord.width/2,coord.y+coord.height/2);
 await page.mouse.down();
 await page.mouse.move(coord.x+coord.width/2-36,coord.y+coord.height/2-28,{steps:8});
 await page.mouse.up();
 const moved=await page.evaluate(()=>({
  phone:window.SemestaUIEditor.previewLayout().phone.hpButton,
  desktop:window.SemestaUIEditor.previewLayout().desktop.hpButton,
  iframe:document.getElementById('semestaDeviceFrame').contentWindow
   .SemestaUIEditor.previewLayout().phone.hpButton
 }));
 console.log('PHONE_UI_DRAGGED',JSON.stringify({old:before.phone.hpButton,moved}));
 assert.notDeepEqual(moved.phone,before.phone.hpButton,'Phone HUD drag must change Phone profile');
 assert.deepEqual(moved.desktop,before.desktop.hpButton,'Desktop profile must remain untouched');
 assert.deepEqual(moved.iframe,moved.phone,'Scaled iframe must show unsaved drag changes');
 await page.locator('#suiCenterBoth').click();
 const aligned=await page.evaluate(()=>{
  const inner=document.getElementById('semestaDeviceFrame').contentWindow;
  const btn=inner.document.getElementById('ptPhoneBtn')?.getBoundingClientRect();
  const h=inner.document.getElementById('vlPlayHud')?.getBoundingClientRect();
  const slot=window.SemestaUIEditor.previewLayout().phone.hpButton;
  return {slot,dx:btn.left+btn.width/2-(h.left+h.width/2),
   dy:btn.top+btn.height/2-(h.top+h.height/2)};
 });
 console.log('PHONE_UI_CENTERED',JSON.stringify(aligned));
 assert.equal(aligned.slot.anchor,'center-center');
 assert.equal(aligned.slot.x,0);assert.equal(aligned.slot.y,0);
 assert.ok(Math.abs(aligned.dx)<5&&Math.abs(aligned.dy)<5,
  'Actual child-frame HP button must center in phone viewport');
 // Selecting different overlapping widgets MUST NOT rely on clicking through them.
 await page.locator('#suiNext').click();
 assert.equal(await page.locator('#suiElement').inputValue(),'bagButton');
 await page.locator('#suiPrev').click();
 assert.equal(await page.locator('#suiElement').inputValue(),'hpButton');
 // Select a DIFFERENT HUD control by touching its live phone-frame geometry,
 // even though Selected Only hides all other outlines. Drag it in one gesture.
 const other=await page.evaluate(()=>{
  const g=window.SemestaUIEditor.frameGeometry('bagButton');
  const wrap=document.getElementById('canvas-wrap').getBoundingClientRect();
  return g?{x:wrap.left+g.x+g.w/2,y:wrap.top+g.y+g.h/2}:null;
 });
 assert.ok(other,'Bag button must be available for direct phone hit-testing');
 await page.mouse.move(other.x,other.y);
 await page.mouse.down();
 await page.mouse.move(other.x-22,other.y-34,{steps:7});
 await page.mouse.up();
 assert.equal(await page.locator('#suiElement').inputValue(),'bagButton',
  'Tapping a hidden outline must select the HUD button through the phone shield');
 const bagDragged=await page.evaluate(()=>window.SemestaUIEditor.previewLayout().phone.bagButton);
 assert.notDeepEqual(bagDragged,before.phone.bagButton,
  'Selecting and dragging directly must move the phone Bag button');
 await page.locator('#suiElement').selectOption('phone');
 await page.waitForFunction(()=>document.getElementById('semestaDeviceFrame').contentWindow
  .SemestaPlay?.hud?.()?.getOpenWindow?.()==='phone',null,{timeout:12000});
 await page.locator('.sui-outline[data-sui-id="phone"]').waitFor({state:'visible',timeout:12000});
 await page.locator('#suiScale').evaluate(el=>{
  el.value='0.8';el.dispatchEvent(new Event('input',{bubbles:true}));
 });
 const resized=await page.evaluate(()=>({
  parent:window.SemestaUIEditor.previewLayout().phone.phone.scale,
  child:document.getElementById('semestaDeviceFrame').contentWindow
   .SemestaUIEditor.previewLayout().phone.phone.scale
 }));
 assert.equal(resized.parent,.8);assert.equal(resized.child,.8);
 await page.locator('#suiElement').selectOption('bag');
 await page.waitForFunction(()=>document.getElementById('semestaDeviceFrame').contentWindow
  .SemestaPlay?.hud?.()?.getOpenWindow?.()==='bag',null,{timeout:12000});
 await page.locator('.sui-outline[data-sui-id="bag"]').waitFor({state:'visible',timeout:12000});
 // Hidden widgets should remain selectable by showing a position proxy.
 await page.locator('#suiElement').selectOption('needs');
 await page.locator('.sui-outline[data-sui-id="needs"]').waitFor({state:'visible',timeout:12000});
 await page.locator('#suiElement').selectOption('hpButton');
 await page.locator('#suiSave').click();
 await page.waitForFunction(()=>document.getElementById('suiStatus')?.textContent?.includes('SAVED'),null,{timeout:10000});
 const saved=await page.evaluate(()=>{
  const HL=window.VLHudLayout;
  return JSON.parse(localStorage.getItem(HL.GLOBAL_LAYOUT_KEY)||'null').layout;
 });
 assert.deepEqual(saved.phone.hpButton,aligned.slot);
 assert.deepEqual(saved.desktop.hpButton,before.desktop.hpButton);
 assert.equal(saved.phone.phone.scale,.8);
 await page.locator('#suiCancel').click();
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!!window.SemestaPlay&&!!window.VLHudLayout,null,{timeout:90000});
 const reload=await page.evaluate(()=>{
  const HL=window.VLHudLayout,g=window.SemestaPlay.gameplay();
  return {saved:HL.resolveSavedLayout('any_city',localStorage).layout.phone.hpButton,
   live:g.modules.hudLayout.phone.hpButton};
 });
 assert.deepEqual(reload.saved,aligned.slot);
 assert.deepEqual(reload.live,aligned.slot);
 assert.ok(!errors.some(x=>/ReferenceError|SyntaxError|TypeError/i.test(x)),
  'Uncaught JS exceptions: '+errors.join(' | ').slice(0,900));
 console.log('SEMESTA_PHONE_UI_EDITOR_E2E_PASS',JSON.stringify({moved,aligned,resized,reload,errors}));
 await browser.close();
})().catch(e=>{console.error('SEMESTA_PHONE_UI_EDITOR_E2E_FAIL',e.stack||e);process.exit(1)});

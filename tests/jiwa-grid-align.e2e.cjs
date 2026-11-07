'use strict';
// Real Chromium: grid placement, center anchors, Save and live Semesta viewport.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.UI_EDITOR_URL||'http://127.0.0.1:8091/virtual-office/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const ctx=await browser.newContext({viewport:{width:1600,height:900}});
 const jiwa=await ctx.newPage(),semesta=await ctx.newPage();
 const errors=[];
 jiwa.on('pageerror',e=>errors.push('Jiwa: '+e.message));
 semesta.on('pageerror',e=>errors.push('Semesta: '+e.message));
 await jiwa.goto(base+'jiwa/',{waitUntil:'domcontentloaded',timeout:90000});
 await semesta.goto(base+'world-builder/',{waitUntil:'domcontentloaded',timeout:90000});
 await jiwa.waitForFunction(()=>!!window.JiwaGameplayBridge&&!!window.JiwaUIVisualEditor&&!!window.JiwaContextBridge?.project?.(),null,{timeout:90000});
 await semesta.waitForFunction(()=>!!window.SemestaPlay&&!!window.VLPlayHud,null,{timeout:90000});
 await semesta.waitForLoadState('load',{timeout:60000}).catch(()=>{});
 await semesta.evaluate(()=>window.VLQuickTutorial?.close?.());
 await jiwa.locator('[data-tab="ui"]').click();
 await jiwa.locator('#juiDesktop').click();
 assert.equal(await jiwa.locator('#juiGrid').isVisible(),true);
 assert.equal(await jiwa.locator('#juiSnapGrid').isChecked(),true);
 await jiwa.locator('#juiGridSize').selectOption('32');
 const spacing=await jiwa.evaluate(()=>{
  const grid=document.getElementById('juiGrid');
  return {size:document.getElementById('juiGridSize').value,
   visible:!grid.hidden,backgroundSize:grid.style.backgroundSize};
 });
 assert.equal(spacing.size,'32');
 assert.ok(spacing.backgroundSize.includes('2.5%'),'32px in 1280 design points is 2.5%');
 await jiwa.locator('#juiElements [data-jui-select="hpButton"]').click();
 const node=jiwa.locator('#juiNodes .jui-node[data-id="hpButton"]');
 const nodeBox=await node.boundingBox();
 assert.ok(nodeBox);
 await jiwa.mouse.move(nodeBox.x+nodeBox.width/2,nodeBox.y+nodeBox.height/2);
 await jiwa.mouse.down();
 await jiwa.mouse.move(nodeBox.x+nodeBox.width/2-73,nodeBox.y+nodeBox.height/2-52,{steps:8});
 await jiwa.mouse.up();
 const snapped=await jiwa.evaluate(()=>{
  const s=window.JiwaGameplayBridge.get().modules.hudLayout.desktop.hpButton;
  const rect=document.querySelector('#juiNodes .jui-node[data-id="hpButton"]').getBoundingClientRect();
  const stage=document.getElementById('juiStage').getBoundingClientRect();
  const x=(rect.left-stage.left)/stage.width*1280,y=(rect.top-stage.top)/stage.height*720;
  return {slot:s,x,y};
 });
 assert.ok(Math.abs(snapped.x/32-Math.round(snapped.x/32))<.16,
  'Visible X position should snap to 32px grid: '+JSON.stringify(snapped));
 assert.ok(Math.abs(snapped.y/32-Math.round(snapped.y/32))<.16,
  'Visible Y position should snap to 32px grid: '+JSON.stringify(snapped));
 // A second drag mode must allow arbitrary non-grid coordinates.
 await jiwa.locator('#juiSnapGrid').uncheck();
 assert.equal(await jiwa.locator('#juiSnapGrid').isChecked(),false);
 await jiwa.locator('#juiAlignHorizontal').click();
 let xcenter=await jiwa.evaluate(()=>{
  const s=window.JiwaGameplayBridge.get().modules.hudLayout.desktop.hpButton;
  const n=document.querySelector('.jui-node[data-id="hpButton"]').getBoundingClientRect();
  const stage=document.getElementById('juiStage').getBoundingClientRect();
  return {anchor:s.anchor,x:s.x,delta:n.left+n.width/2-(stage.left+stage.width/2)};
 });
 assert.equal(xcenter.anchor,'bottom-center');assert.equal(xcenter.x,0);
 assert.ok(Math.abs(xcenter.delta)<4,'Preview must align selected HP button with screen center X');
 await jiwa.locator('#juiAlignVertical').click();
 let both=await jiwa.evaluate(()=>{
  const s=window.JiwaGameplayBridge.get().modules.hudLayout.desktop.hpButton;
  const n=document.querySelector('.jui-node[data-id="hpButton"]').getBoundingClientRect();
  const stage=document.getElementById('juiStage').getBoundingClientRect();
  return {anchor:s.anchor,x:s.x,y:s.y,dx:n.left+n.width/2-(stage.left+stage.width/2),
   dy:n.top+n.height/2-(stage.top+stage.height/2)};
 });
 assert.equal(both.anchor,'center-center');assert.equal(both.x,0);assert.equal(both.y,0);
 assert.ok(Math.abs(both.dx)<4&&Math.abs(both.dy)<4,'Preview must align both center axes');
 await jiwa.locator('#juiSave').click();
 await jiwa.waitForFunction(()=>document.getElementById('dirtyState')?.textContent==='SAVED',null,{timeout:15000});
 const applied=await semesta.evaluate(()=>{
  const g=window.SemestaPlay.gameplay();
  return {anchor:g.modules.hudLayout.desktop.hpButton.anchor,
   x:g.modules.hudLayout.desktop.hpButton.x,y:g.modules.hudLayout.desktop.hpButton.y};
 });
 assert.deepEqual(applied,{anchor:'center-center',x:0,y:0},'Semesta must read saved Jiwa layout');
 await semesta.locator('#walkMode').click({timeout:20000});
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.active?.(),null,{timeout:20000});
 const physical=await semesta.evaluate(()=>{
  window.SemestaPlay.hud().apply(window.SemestaPlay.gameplay());
  const b=document.getElementById('ptPhoneBtn').getBoundingClientRect();
  const host=document.getElementById('vlPlayHud').getBoundingClientRect();
  return {dx:b.left+b.width/2-(host.left+host.width/2),
   dy:b.top+b.height/2-(host.top+host.height/2),
   transform:document.getElementById('ptPhoneBtn').style.transform};
 });
 console.log('JIWA_GRID_ALIGN_SYNC',JSON.stringify({snapped,xcenter,both,applied,physical,errors}));
 assert.ok(Math.abs(physical.dx)<=5,'Semesta actual HP button must remain X centered: '+JSON.stringify(physical));
 assert.ok(Math.abs(physical.dy)<=5,'Semesta actual HP button must remain Y centered: '+JSON.stringify(physical));
 assert.equal(errors.filter(x=>/SyntaxError|ReferenceError|TypeError/.test(x)).length,0,'Runtime errors: '+errors.join(' | '));
 await browser.close();
 console.log('JIWA_GRID_ALIGN_SYNC_E2E_PASS');
})().catch(e=>{console.error('JIWA_GRID_ALIGN_SYNC_E2E_FAIL',e.stack||e);process.exit(1)});

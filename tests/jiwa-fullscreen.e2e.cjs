'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const base=process.env.UI_EDITOR_URL||'http://127.0.0.1:8091/virtual-office/';
 const errors=[];
 const desktop=await browser.newPage({viewport:{width:1920,height:1080}});
 desktop.on('pageerror',e=>errors.push('desktop:'+e.message));
 await desktop.goto(base+'jiwa/',{waitUntil:'domcontentloaded',timeout:90000});
 await desktop.waitForFunction(()=>!!window.JiwaContextBridge?.project?.()&&!!window.JiwaUIVisualEditor,null,{timeout:90000});
 const initial=await desktop.evaluate(()=>{
  const w=document.querySelector('.window').getBoundingClientRect();
  const workspace=document.querySelector('.workspace').getBoundingClientRect();
  const middle=document.querySelector('.middle').getBoundingClientRect();
  const tree=document.querySelector('.tree-panel').getBoundingClientRect();
  const inspect=document.querySelector('.panel.inspector').getBoundingClientRect();
  return {window:{width:w.width,height:w.height,left:w.left,top:w.top},
    workspace:{height:workspace.height,width:workspace.width},
    middle:middle.width,tree:tree.width,inspector:inspect.width,
    scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth};
 });
 console.log('JIWA_FULLSCREEN_DESKTOP',JSON.stringify(initial));
 assert.ok(Math.abs(initial.window.width-1920)<1&&Math.abs(initial.window.height-1080)<1,'Jiwa must use entire desktop viewport');
 assert.ok(initial.workspace.height>=940,'Workspace must fill below window XP chrome');
 assert.ok(initial.middle>=1000,'Main editing surface must expand on large screens');
 assert.ok(initial.tree>=200&&initial.inspector>=280,'Objects and inspector must remain usable');
 assert.ok(initial.scrollWidth<=1920&&initial.scrollHeight<=1080,'No document-level overflow');
 await desktop.locator('[data-tab="ui"]').click();
 const editor=await desktop.evaluate(()=>{
  const w=document.querySelector('.workspace').getBoundingClientRect();
  const middle=document.querySelector('.middle').getBoundingClientRect();
  const stage=document.querySelector('#juiStage').getBoundingClientRect();
  return {workspace:w.width,middle:middle.width,stage:stage.width,height:stage.height,
   treeHidden:getComputedStyle(document.querySelector('.tree-panel')).display==='none',
   inspectorHidden:getComputedStyle(document.querySelector('.panel.inspector')).display==='none'};
 });
 console.log('JIWA_UI_EDITOR_EXPANDED',JSON.stringify(editor));
 assert.ok(editor.treeHidden&&editor.inspectorHidden,'UI Editor must focus on full-width canvas');
 assert.ok(editor.middle>=1900,'Fullwidth Jiwa UI Editor must use available width');
 assert.ok(editor.stage>=850,'Preview must expand beyond old fixed 850px');
 assert.ok(Math.abs(editor.stage.width/editor.height-16/9)<0.035,'Preview must retain correct 16:9 aspect ratio');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>errors.push('mobile:'+e.message));
 await mobile.goto(base+'jiwa/',{waitUntil:'domcontentloaded',timeout:90000});
 await mobile.waitForFunction(()=>!!window.JiwaContextBridge?.project?.(),null,{timeout:90000});
 const mobileStart=await mobile.evaluate(()=>{
  const shell=document.querySelector('.window').getBoundingClientRect();
  const panes=[...document.querySelectorAll('.workspace>.panel,.workspace>.middle')].map(x=>({
   className:x.className,display:getComputedStyle(x).display
  }));
  return {width:shell.width,height:shell.height,panes,buttons:document.querySelectorAll('[data-jiwa-pane]').length,
   scrollWidth:document.documentElement.scrollWidth};
 });
 console.log('JIWA_FULLSCREEN_MOBILE',JSON.stringify(mobileStart));
 assert.ok(Math.abs(mobileStart.width-390)<1&&Math.abs(mobileStart.height-844)<1,'Mobile shell must fill viewport');
 assert.equal(mobileStart.buttons,3,'Mobile requires Workspace, Objects and Inspector tabs');
 assert.ok(mobileStart.panes.some(x=>x.className==='middle'&&x.display!=='none'),'Workspace initially visible');
 await mobile.locator('[data-jiwa-pane="objects"]').click();
 const objects=await mobile.evaluate(()=>({
  objects:getComputedStyle(document.querySelector('.tree-panel')).display,
  middle:getComputedStyle(document.querySelector('.middle')).display
 }));
 assert.notEqual(objects.objects,'none');assert.equal(objects.middle,'none');
 await mobile.locator('[data-jiwa-pane="inspector"]').click();
 const inspector=await mobile.evaluate(()=>({
  inspector:getComputedStyle(document.querySelector('.panel.inspector')).display,
  middle:getComputedStyle(document.querySelector('.middle')).display
 }));
 assert.notEqual(inspector.inspector,'none');assert.equal(inspector.middle,'none');
 await mobile.locator('[data-jiwa-pane="main"]').click();
 await mobile.locator('[data-tab="ui"]').click();
 const ui=await mobile.evaluate(()=>({
  middle:getComputedStyle(document.querySelector('.middle')).display,
  visible:!document.querySelector('#uiView').hidden,
  width:document.querySelector('#juiStage').getBoundingClientRect().width,
  shell:document.querySelector('.window').getBoundingClientRect().height
 }));
 assert.equal(ui.visible,true);assert.notEqual(ui.middle,'none');
 assert.ok(ui.width>0&&ui.width<=390,'UI Editor preview must fit narrow screen');
 assert.equal(errors.length,0,'Browser JavaScript errors: '+errors.join(';'));
 console.log('JIWA_FULLSCREEN_E2E_PASS',JSON.stringify({desktop:initial,uiEditor:editor,mobile:mobileStart,mobileUI:ui}));
 await browser.close();
})().catch(e=>{console.error('JIWA_FULLSCREEN_E2E_FAIL',e.stack||e);process.exit(1)});

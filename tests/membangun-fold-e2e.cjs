'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1040,height:830},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  const root='http://127.0.0.1:8080/';
  await page.goto(root+'virtual-office/membangun/laptop.html?app=semesta',{waitUntil:'domcontentloaded'});
  await page.evaluate((root)=>{
   const urls={
    mahluk:'virtual-life-asset-pipeline/site/index.html',
    emotion:'virtual-office/emotion-studio/',
    bangun:'virtual-office/world-builder/bangun-ruang/',
    semesta:'virtual-office/world-builder/',
    jiwa:'virtual-office/jiwa/'
   };
   for(const [id,path] of Object.entries(urls))localStorage.setItem('membangun-link-'+id,root+path);
  },root);
  await page.reload({waitUntil:'domcontentloaded'});
  const cases=[
   ['semesta','Semesta'],['mahluk','Mahluk'],['emotion','EMOSI'],
   ['bangun','Bangun'],['jiwa','JIWA']
  ];
  for(const [id,expected] of cases){
   await page.locator('#quickApps button[data-app="'+id+'"]').click();
   await page.waitForFunction(([id,expected])=>{
    const f=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none');
    const title=f?.contentDocument?.title||'';
    return f?.src.includes('/')&&title.toLowerCase().includes(expected.toLowerCase());
   },[id,expected],{timeout:30000});
   const title=await page.evaluate(()=>{
    const f=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none');
    return f.contentDocument.title;
   });
   console.log('LOADED_APP',id,title);
  }
  assert.equal(await page.locator('#frameWrap iframe').count(),5,'one persistent frame per app');
  await page.locator('#quickApps button[data-app=semesta]').click();
  assert.equal(await page.locator('#frameWrap iframe').count(),5,'switching back does not create duplicate frame');
  await page.setViewportSize({width:480,height:920});
  await page.locator('#rotate90').click();
  assert.equal(await page.locator('body').evaluate(x=>x.classList.contains('rotated')),true);
  // Keyboard and touchpad coexist, as on a physical mini laptop.
  assert.equal(await page.locator('#keyboardPage').isVisible(),true);
  assert.equal(await page.locator('#touchpad').isVisible(),true);
  assert.equal(await page.locator('#keyboard .key-row').count(),5);
  assert.equal(await page.locator('#leftClick,#rightClick').count(),2);
  const panelHeight=await page.locator('.control-area').evaluate(el=>el.offsetHeight);
  const keyboardHeight=await page.locator('#keyboardPage').evaluate(el=>el.offsetHeight);
  console.log('KEYBOARD_RATIO',keyboardHeight,panelHeight,(keyboardHeight/panelHeight).toFixed(2));
  assert.ok(keyboardHeight/panelHeight<.57,'Keyboard must leave room for touchpad');
  // User wants to move the whole clipped desktop image, NOT the app's inner tabs.
  const scrollState=await page.evaluate(()=>{
   const scroll=document.getElementById('screenScroll');
   const pad=document.getElementById('touchpad');
   const frame=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none');
   const before=scroll.scrollTop;
   const maxY=scroll.scrollHeight-scroll.clientHeight;
   function swipe(type,x){
    const touches=[1,2].map(i=>new Touch({identifier:i,target:pad,clientX:x+i*12,clientY:140}));
    pad.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:touches}));
   }
   swipe('touchstart',90);
   swipe('touchmove',140);
   swipe('touchmove',190);
   pad.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],targetTouches:[],changedTouches:[]}));
   const afterSwipe=scroll.scrollTop;
   const afterProgress=document.getElementById('screenProgress').textContent;
   pad.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY:90}));
   const afterWheel=scroll.scrollTop;
   document.getElementById('screenDown').click();
   const afterDown=scroll.scrollTop;
   document.getElementById('screenUp').click();
   const afterUp=scroll.scrollTop;
   return {before,maxY,afterSwipe,afterProgress,afterWheel,afterDown,afterUp,
       frameHeight:frame.style.height,scrollHeight:scroll.scrollHeight,clientHeight:scroll.clientHeight};
  });
  console.log('OUTER_SCREEN_PAN',scrollState);
  assert.ok(scrollState.maxY>100,'Virtual desktop image must exceed Fold display height');
  assert.ok(scrollState.afterSwipe>scrollState.before+50,'Two-finger pad scroll must move the desktop viewport');
  assert.ok(scrollState.afterWheel>scrollState.afterSwipe,'Wheel over touchpad must move desktop viewport');
  assert.ok(scrollState.afterDown>scrollState.afterWheel,'Down arrow moves screen image');
  assert.ok(scrollState.afterUp<scrollState.afterDown,'Up arrow moves screen image');
  assert.notEqual(scrollState.afterProgress,'FIT','Progress should indicate clipped screen');
  // Regression: pinch reaches Semesta's map CANVAS as a wheel zoom event.
  // It MUST NOT touch the outer laptop zoom, while two-finger pan still works.
  const pinchState=await page.evaluate(()=>{
   const pad=document.getElementById('touchpad');
   const scroll=document.getElementById('screenScroll');
   const zoomText=document.getElementById('zoomText');
   const doc=[...document.querySelectorAll('#frameWrap iframe')].find(f=>f.style.display!=='none').contentDocument;
   const canvas=doc.getElementById('world');
   if(!canvas)throw Error('Semesta map canvas #world missing');
   const programWheels=[];
   const capture=e=>programWheels.push({deltaY:e.deltaY,ctrlKey:e.ctrlKey,target:e.target.id});
   canvas.addEventListener('wheel',capture,{capture:true});
   const getZoom=()=>Number.parseInt(zoomText.textContent,10);
   const send=(type,a,b)=>{
    const touches=[new Touch({identifier:1,target:pad,clientX:a,clientY:120}),
                   new Touch({identifier:2,target:pad,clientX:b,clientY:120})];
    pad.dispatchEvent(new TouchEvent(type,{
      bubbles:true,cancelable:true,
      touches:type==='touchend'?[]:touches,
      targetTouches:type==='touchend'?[]:touches,
      changedTouches:touches
    }));
   };
   const original=getZoom(),beforePan=scroll.scrollTop;
   send('touchstart',100,200);send('touchmove',135,235);send('touchmove',165,265);
   send('touchend',165,265);
   const afterPan=getZoom(),scrolled=scroll.scrollTop-beforePan;
   const beforePinchScroll=scroll.scrollTop;
   send('touchstart',110,210);send('touchmove',90,230);send('touchmove',70,250);
   send('touchend',70,250);
   const afterOut=getZoom(),outWheels=programWheels.slice(),afterOutScroll=scroll.scrollTop;
   send('touchstart',70,250);send('touchmove',95,225);send('touchmove',120,200);
   send('touchend',120,200);
   canvas.removeEventListener('wheel',capture,true);
   return {original,afterPan,afterOut,afterIn:getZoom(),scrolled,
      beforePinchScroll,afterOutScroll,outWheels,
      inWheels:programWheels.slice(outWheels.length)};
  });
  console.log('PROGRAM_PINCH_AND_PAN',pinchState);
  assert.equal(pinchState.afterPan,pinchState.original,'Two-finger pan must not alter laptop zoom');
  assert.ok(pinchState.scrolled>10,'Two-finger swipe must still pan clipped desktop');
  assert.equal(pinchState.afterOut,pinchState.original,'Pinch-out must not zoom laptop page');
  assert.equal(pinchState.afterIn,pinchState.original,'Pinch-in must not zoom laptop page');
  assert.equal(pinchState.beforePinchScroll,pinchState.afterOutScroll,'Pinch must not scroll laptop page');
  assert.ok(pinchState.outWheels.length>0,'Pinch-out must reach Semesta canvas');
  assert.ok(pinchState.outWheels.every(w=>w.deltaY<0&&w.ctrlKey&&w.target==='world'),
     'Pinch-out must send Semesta zoom-in wheels');
  assert.ok(pinchState.inWheels.length>0,'Pinch-in must reach Semesta canvas');
  assert.ok(pinchState.inWheels.every(w=>w.deltaY>0&&w.ctrlKey&&w.target==='world'),
     'Pinch-in must send Semesta zoom-out wheels');

  // Single tap must be a left click. Two quick taps must be contextmenu only.
  const tapState=await page.evaluate(async()=>{
   const doc=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none').contentDocument;
   const pad=document.getElementById('touchpad');
   let left=0,right=0;
   const onLeft=()=>left++,onRight=e=>{e.preventDefault();right++};
   doc.addEventListener('click',onLeft,true);
   doc.addEventListener('contextmenu',onRight,true);
   const send=(type)=>{
    const t=new Touch({identifier:4,target:pad,clientX:110,clientY:100});
    pad.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,
      touches:type==='touchend'?[]:[t],targetTouches:type==='touchend'?[]:[t],changedTouches:[t]}));
   };
   send('touchstart');send('touchend');
   await new Promise(ok=>setTimeout(ok,85));
   send('touchstart');send('touchend');
   await new Promise(ok=>setTimeout(ok,410));
   const result={left,right};doc.removeEventListener('click',onLeft,true);doc.removeEventListener('contextmenu',onRight,true);return result;
  });
  console.log('DOUBLE_TAP_RIGHT',tapState);
  assert.equal(tapState.right,1,'Double tap should trigger one contextmenu event');
  assert.equal(tapState.left,0,'Double tap should not trigger a left click');
  // Dedicated mouse buttons must be adjacent, not at opposite sides of the pad.
  const buttonState=await page.evaluate(()=>{
   const left=document.getElementById('leftClick'),right=document.getElementById('rightClick');
   const sameGroup=left.parentNode===right.parentNode;
   const gap=right.offsetLeft-(left.offsetLeft+left.offsetWidth);
   const doc=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none').contentDocument;
   let clicks=0,contexts=0;
   const lc=()=>clicks++,rc=e=>{e.preventDefault();contexts++};
   doc.addEventListener('click',lc,true);
   doc.addEventListener('contextmenu',rc,true);
   left.click();right.click();
   doc.removeEventListener('click',lc,true);
   doc.removeEventListener('contextmenu',rc,true);
   return {sameGroup,gap,clicks,contexts};
  });
  console.log('ADJACENT_MOUSE_BUTTONS',buttonState);
  assert.equal(buttonState.sameGroup,true);
  assert.ok(buttonState.gap>=0&&buttonState.gap<=12,'Mouse buttons must be side by side');
  assert.equal(buttonState.clicks,1,'Left button should click inside the app');
  assert.equal(buttonState.contexts,1,'Right button should trigger context menu inside app');
  await page.screenshot({path:'membangun-laptop-rotated.png'});
  await page.screenshot({path:'membangun-laptop-keyboard.png'});
  console.log('APP_SWITCH_AND_ROTATE_OK');
  if(errors.filter(x=>/is not defined|Cannot read properties/.test(x)).length>3)throw Error('Runtime errors: '+errors.join('; ').slice(0,700));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

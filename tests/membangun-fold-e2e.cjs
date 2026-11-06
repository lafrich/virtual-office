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
  assert.equal(await page.locator('#leftClick,#rightClick').count(),0);
  const panelHeight=await page.locator('.control-area').evaluate(el=>el.offsetHeight);
  const keyboardHeight=await page.locator('#keyboardPage').evaluate(el=>el.offsetHeight);
  console.log('KEYBOARD_RATIO',keyboardHeight,panelHeight,(keyboardHeight/panelHeight).toFixed(2));
  assert.ok(keyboardHeight/panelHeight<.57,'Keyboard must leave room for touchpad');
  // Real two-touch swipe on the pad must scroll a panel inside the app iframe.
  const scrollState=await page.evaluate(async()=>{
   const doc=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none').contentDocument;
   const pad=document.querySelector('#touchpad');
   const cur=document.querySelector('#cursor');
   const transform=document.querySelector('#appFrame').style.transform;
   const k=Number.parseFloat(transform.replace('scale(','').replace(')',''))||1;
   const x=Number.parseFloat(cur.style.left)/k, y=Number.parseFloat(cur.style.top)/k;
   const box=doc.createElement('div');
   box.style.cssText='position:fixed;z-index:2147483647;left:'+(x-75)+'px;top:'+(y-65)+'px;width:150px;height:130px;overflow-y:auto;background:yellow';
   const inner=doc.createElement('div');inner.style.height='1800px';inner.textContent='scroll test';box.appendChild(inner);doc.body.appendChild(box);
   let wheelCount=0;box.addEventListener('wheel',()=>wheelCount++);
   let documentWheelCount=0;doc.addEventListener('wheel',()=>documentWheelCount++);
   const hit=doc.elementFromPoint(x,y);
   const metrics={k,x,y,bodyClientHeight:doc.body.clientHeight,innerHeight:doc.defaultView.innerHeight,
       frameHeight:document.querySelector('#appFrame').style.height,
       boxRect:{x:box.getBoundingClientRect().x,y:box.getBoundingClientRect().y,w:box.clientWidth,h:box.clientHeight},
       hit:hit?.tagName,hitId:hit?.id||'',hitClass:String(hit?.className||'').slice(0,80),
       bridgeText:document.getElementById('bridgeStatus').textContent,
       scrollableBox:box.scrollHeight>box.clientHeight};
   function event(type,yy){
    const touches=[1,2].map(i=>new Touch({identifier:i,target:pad,clientX:110+i*30,clientY:yy}));
    pad.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:touches}));
   }
   event('touchstart',180);event('touchmove',100);event('touchmove',65);
   pad.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],targetTouches:[],changedTouches:[]}));
   const result={scrollTop:box.scrollTop,wheelCount,documentWheelCount,metrics};box.remove();return result;
  });
  console.log('TWO_FINGER_SCROLL',scrollState);
  assert.ok(scrollState.scrollTop>0,'Two-finger touchpad swipe must scroll app panel');
  assert.ok(scrollState.wheelCount>0,'Wheel must be dispatched inside iframe');
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
  await page.screenshot({path:'membangun-laptop-rotated.png'});
  await page.screenshot({path:'membangun-laptop-keyboard.png'});
  console.log('APP_SWITCH_AND_ROTATE_OK');
  if(errors.filter(x=>/is not defined|Cannot read properties/.test(x)).length>3)throw Error('Runtime errors: '+errors.join('; ').slice(0,700));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

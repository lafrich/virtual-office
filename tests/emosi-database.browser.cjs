/* Browser smoke: new blank + fork + edit + save-as-new in Emosi.exe. */
'use strict';
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:980},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8091/virtual-office/emotion-studio/',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.EmosiDatabase&&
   document.querySelectorAll('#cards .emotion-card').length>0,null,{timeout:60000});
  assert.match(await page.title(),/EMOSI\.EXE/);
  assert.match(await page.locator('.titlebar .brand').textContent(),/EMOSI/);
  async function currentId(){
   const label=await page.locator('#entryId').textContent();
   return label.match(/ID \/ ([a-z0-9_-]+)/)?.[1];
  }
  async function exportPng(){
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:12000}),page.locator('#export').click()
   ]);
   return PNG.sync.read(fs.readFileSync(await download.path()));
  }
  const sourceId=await currentId();
  assert.ok(sourceId,'No initial source emotion ID');
  const sourcePng=await exportPng();
  assert.equal(sourcePng.height,448);
  await page.locator('#duplicateEmotion').click();
  await page.locator('#newEmotionDialog[open]').waitFor();
  await page.locator('#newEmotionName').fill('COPY TEST / SO HAPPY');
  await page.locator('#confirmCreate').click();
  await page.waitForFunction(()=>!document.getElementById('newEmotionDialog').open,null,{timeout:20000});
  const copyId=await currentId();
  assert.ok(copyId&&copyId!==sourceId,'Copy must have a different database ID');
  assert.equal(await page.locator('#name').inputValue(),'COPY TEST / SO HAPPY');
  const copyBefore=await exportPng();
  assert.equal(copyBefore.width,sourcePng.width);
  assert.ok(Buffer.from(copyBefore.data).equals(Buffer.from(sourcePng.data)),
   'Copy should contain identical four-view PNG pixels before edits');

  // Edit the copy only, with the cross-view sync disabled by default.
  await page.locator('#edit').click();
  await page.locator('#pixelOverlay:not([hidden])').waitFor();
  assert.equal(await page.locator('#pixelSync').isChecked(),false);
  await page.locator('#pixelOnion').uncheck();
  await page.locator('#pixelGrid').uncheck();
  await page.locator('#pixelColor').fill('#f70b21');
  await page.locator('[data-pixel-tool="pencil"]').click();
  const canvas=page.locator('#pixelCanvas');
  const rect=await canvas.boundingBox();
  assert.ok(rect);
  await page.mouse.click(rect.x+2.5*rect.width/64,rect.y+2.5*rect.height/112);
  await page.locator('#pixelApply').click();
  await page.waitForFunction(()=>document.getElementById('pixelOverlay').hidden,null,{timeout:20000});
  const changed=await exportPng();
  assert.notDeepEqual(Buffer.from(changed.data),Buffer.from(sourcePng.data));
  for(let d=1;d<4;d++){
   const off=d*112*64*4,span=112*64*4;
   assert.ok(Buffer.from(changed.data.slice(off,off+span))
    .equals(Buffer.from(sourcePng.data.slice(off,off+span))),
    'Editing copy SE should not modify direction '+d);
  }
  await page.locator('#save').click();
  await page.waitForFunction(()=>document.getElementById('dirty').textContent.includes('SAVED'),
   null,{timeout:20000});
  await page.locator('#reload').click();
  const names=await page.locator('#cards .emotion-card b').allTextContents();
  assert.ok(names.some(x=>x==='COPY TEST / SO HAPPY'),'Copied emotion not in library');
  assert.equal(await currentId(),copyId,'Reload should keep copied emotion selected');

  // Save as new from the already edited copy, retaining the existing copy.
  await page.locator('#saveAsNewTop').click();
  await page.locator('#newEmotionDialog[open]').waitFor();
  await page.locator('#newEmotionName').fill('COPY TEST / VARIANT 2');
  await page.locator('#confirmCreate').click();
  await page.waitForFunction(()=>!document.getElementById('newEmotionDialog').open,null,{timeout:30000});
  await page.waitForFunction(()=>document.getElementById('dirty').textContent.includes('SAVED'),
   null,{timeout:20000});
  const variantId=await currentId();
  assert.ok(variantId!==sourceId&&variantId!==copyId,'Save as New must allocate a third unique ID');
  const variantPng=await exportPng();
  assert.ok(Buffer.from(variantPng.data).equals(Buffer.from(changed.data)));
  await page.locator('#reload').click();
  const after=await page.locator('#cards .emotion-card b').allTextContents();
  assert.ok(after.includes('COPY TEST / VARIANT 2'),'Save-as-new record did not survive reload');
  assert.ok(after.includes('COPY TEST / SO HAPPY'),'Existing copy was overwritten');

  // Reopen the source and ensure the first saved template remains untouched.
  const sourceCards=page.locator('#cards .emotion-card');
  const sourceNames=await sourceCards.allTextContents();
  let found=false;
  for(let i=0;i<sourceNames.length;i++){
   await sourceCards.nth(i).click();
   if(await currentId()===sourceId){found=true;break}
  }
  assert.ok(found,'Source missing from database after fork');
  const originalAgain=await exportPng();
  assert.ok(Buffer.from(originalAgain.data).equals(Buffer.from(sourcePng.data)),
   'Editing the duplicate must never overwrite original pixels');

  // New blank is an independent 64x448 transparent database emotion.
  await page.locator('#new').click();
  const blankId=await currentId();
  assert.ok(![sourceId,copyId,variantId].includes(blankId));
  const blank=await exportPng();
  assert.equal(blank.width,64);assert.equal(blank.height,448);
  assert.ok(blank.data.every((byte,i)=>i%4!==3||byte===0),
   'New Blank must not start with pre-painted template pixels');

  await page.setViewportSize({width:390,height:820});
  await page.locator('.emotion-mobile-tabs [data-mobile-panel="library"]').click();
  assert.equal(await page.locator('.emotion-library').isVisible(),true);
  await page.locator('.emotion-mobile-tabs [data-mobile-panel="properties"]').click();
  assert.equal(await page.locator('.emotion-inspector').isVisible(),true);
  assert.equal(await page.locator('.emotion-library').isVisible(),false);
  await page.locator('.emotion-mobile-tabs [data-mobile-panel="preview"]').click();
  assert.equal(await page.locator('.emotion-main').isVisible(),true);
  if(errors.length)throw Error('Browser script exceptions: '+JSON.stringify(errors));
  console.log(JSON.stringify({result:'PASS',sourceId,copyId,variantId,blankId,
   sourceUntouched:true,copyPreserved:true,savedNew:true,blankTransparent:true,
   mobileTabs:'PASS',launcherName:'EMOSI.EXE'}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});

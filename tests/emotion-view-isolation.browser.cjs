/* Regression: painting/editing one Emotion Studio camera view must NOT affect others. */
'use strict';
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const W=64,H=112;
function pixel(png,dir,x,y){
 const start=((dir*H+y)*png.width+x)*4;
 return Array.from(png.data.subarray(start,start+4));
}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1590,height:1050},acceptDownloads:true});
  const faults=[];page.on('pageerror',e=>faults.push(e.message));
  await page.goto('http://127.0.0.1:8091/virtual-office/emotion-studio/?cloudLegacy=1',{
   waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>document.querySelectorAll('#timeline .frame-cell').length>0,
   null,{timeout:60000});
  await page.locator('#new').click();
  await page.locator('#edit').click();
  await page.locator('#pixelOverlay:not([hidden])').waitFor();
  const sync=page.locator('#pixelSync');
  const ref=page.locator('#pixelReferenceView');
  assert.equal(await sync.isChecked(),false,'Sync must be OFF for every opened frame');
  assert.equal(await ref.inputValue(),'off','Ghost overlay must be OFF by default');
  await page.locator('#pixelOnion').uncheck();
  await page.locator('#pixelGrid').uncheck();
  await page.locator('[data-pixel-tool="pencil"]').click();
  const canvas=page.locator('#pixelCanvas');
  async function mark(x,y,color){
   await page.locator('#pixelColor').fill(color);
   await canvas.scrollIntoViewIfNeeded();
   const box=await canvas.boundingBox();
   if(!box)throw Error('Missing pixel canvas');
   await page.mouse.click(box.x+(x+.5)*box.width/W,
    box.y+(y+.5)*box.height/H);
  }
  async function exportPNG(){
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:12000}),
    page.locator('#pixelExport').click()
   ]);
   return PNG.sync.read(fs.readFileSync(await download.path()));
  }
  await mark(6,19,'#ea1122'); // SE-only
  await page.locator('#pixelDirection').selectOption('sw');
  assert.equal(await sync.isChecked(),false,'Changing direction must protect old view');
  assert.equal(await ref.inputValue(),'off','Switching view must not add ghost source');
  await mark(9,23,'#11aa33'); // SW-only
  let png=await exportPNG();
  assert.deepEqual(pixel(png,0,6,19),[234,17,34,255]);
  assert.deepEqual(pixel(png,1,9,23),[17,170,51,255]);
  assert.equal(pixel(png,0,9,23)[3],0,'SW pencil changed SE!');
  assert.equal(pixel(png,1,6,19)[3],0,'SE pencil changed SW!');
  assert.equal(pixel(png,2,9,23)[3],0,'SW pencil changed NE!');
  assert.equal(pixel(png,3,9,23)[3],0,'SW pencil changed NW!');

  // Even an explicitly enabled Sync should not carry into a different view.
  await sync.check();
  await page.locator('#pixelDirection').selectOption('se');
  assert.equal(await sync.isChecked(),false,'Angle switch inherited dangerous sync state');
  await mark(11,25,'#2244ee'); // SE-only after toggling
  png=await exportPNG();
  assert.deepEqual(pixel(png,0,11,25),[34,68,238,255]);
  assert.equal(pixel(png,1,11,25)[3],0,'Cross-view brush state leaked');

  // Any edits in a new frame must also begin in isolated-view mode.
  await page.locator('#pixelApply').click();
  await page.waitForFunction(()=>document.getElementById('pixelOverlay').hidden);
  await page.locator('#duplicateFrame').click();
  await page.locator('#edit').click();
  assert.equal(await sync.isChecked(),false,'Duplicated frame retained sync from previous editor');
  assert.equal(await ref.inputValue(),'off','Duplicated frame opened with source ghost');
  if(faults.length)throw Error('Browser exceptions: '+JSON.stringify(faults));
  console.log(JSON.stringify({result:'PASS',isolatedSE:true,isolatedSW:true,
   reenterIsolated:true,duplicateIsolated:true,overlayDefault:'off',
   pixelFormat:[64,448],crossViewMutation:false}));
 }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1});

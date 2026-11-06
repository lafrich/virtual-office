/* Real-browser smoke for Emotion Studio copying RGBA selection SE→SW + mirror + move. */
'use strict';
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const fs=require('node:fs');
const assert=require('node:assert/strict');

const URL='http://127.0.0.1:8091/virtual-office/emotion-studio/';
const W=64,H=112;
function pixel(png,dir,x,y){
 const k=((y+H*dir)*png.width+x)*4;
 return [...png.data.subarray(k,k+4)];
}
function expectedInk(px){assert.deepEqual(px,[239,16,48,255]);}
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1590,height:1050},acceptDownloads:true});
  const faults=[];page.on('pageerror',e=>faults.push(e.message));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.MH2PlanePixelEditor&&
   document.querySelectorAll('#timeline .frame-cell').length>0,null,{timeout:60000});
  await page.locator('#new').click();
  await page.locator('#edit').click();
  await page.locator('#pixelOverlay:not([hidden])').waitFor();
  await page.locator('#pixelSync').uncheck();
  await page.locator('#pixelOnion').uncheck();
  await page.locator('#pixelGrid').uncheck();
  await page.locator('#pixelColor').fill('#ef1030');
  const canvas=page.locator('#pixelCanvas');
  await canvas.scrollIntoViewIfNeeded();
  async function point(x,y){
   const b=await canvas.boundingBox();
   if(!b)throw Error('Pixel canvas is not visible');
   return {x:b.x+(x+.5)*b.width/W,y:b.y+(y+.5)*b.height/H};
  }
  await page.locator('[data-pixel-tool="pencil"]').click();
  const painted=await point(5,15);
  await page.mouse.click(painted.x,painted.y);
  await page.locator('[data-pixel-tool="select"]').click();
  const start=await point(4,14),end=await point(7,17);
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(end.x,end.y,{steps:8});
  await page.mouse.up();
  await page.waitForFunction(()=>document.getElementById('pixelSelectionInfo')
   .textContent.includes('SELECTED 4×4'),null,{timeout:8000});
  await page.locator('#pixelCopyTarget').selectOption('sw');
  await page.locator('#pixelCopyAutoMirror').check();
  await page.locator('#pixelCopyToView').click();
  assert.equal(await page.locator('#pixelDirection').inputValue(),'sw');
  assert.match(await page.locator('#pixelClipboardInfo').textContent(),/4×4 PX/);
  async function downloaded(){
   const [d]=await Promise.all([page.waitForEvent('download',{timeout:12000}),
    page.locator('#pixelExport').click()]);
   return PNG.sync.read(fs.readFileSync(await d.path()));
  }
  let png=await downloaded();
  assert.equal(png.width,64);assert.equal(png.height,448);
  expectedInk(pixel(png,0,5,15)); // source untouched
  expectedInk(pixel(png,1,58,15)); // horizontal mirror of 5 in 64 px
  assert.equal(pixel(png,1,5,15)[3],0); // no whole-view replacement
  assert.equal(pixel(png,2,58,15)[3],0); // NE untouched
  assert.equal(pixel(png,3,58,15)[3],0); // NW untouched

  // Drag the floating paste to a new position without removing source pixels
  // or altering any view that was not targeted.
  const from=await point(58,15),to=await point(55,18);
  await page.mouse.move(from.x,from.y);await page.mouse.down();
  await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();
  png=await downloaded();
  expectedInk(pixel(png,0,5,15));
  expectedInk(pixel(png,1,55,18));
  assert.equal(pixel(png,1,58,15)[3],0);
  assert.equal(pixel(png,2,55,18)[3],0);
  await page.locator('#pixelApply').click();
  await page.waitForFunction(()=>document.getElementById('pixelOverlay').hidden,null,{timeout:20000});
  await page.locator('#save').click();
  await page.waitForFunction(()=>document.getElementById('dirty').textContent.includes('SAVED'),
   null,{timeout:20000});
  await page.locator('#reload').click();
  await page.locator('#edit').click();
  png=await downloaded();
  expectedInk(pixel(png,0,5,15));
  expectedInk(pixel(png,1,55,18));
  assert.equal(pixel(png,1,58,15)[3],0);
  if(faults.length)throw Error('Browser errors: '+JSON.stringify(faults));
  console.log(JSON.stringify({result:'PASS',source:'SE',target:'SW',mirrored:true,
   selection:[4,14,4,4],movedPaste:[55,18],unrelatedViews:'unchanged',
   savedAndReloaded:true,atlas:[64,448]}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});

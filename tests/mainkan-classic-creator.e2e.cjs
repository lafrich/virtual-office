'use strict';
/* Verifies classic Paint creator reintroduction from user's 2026-10-31 source bundle. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.MAINKAN_TEST_URL||'http://127.0.0.1:8091/virtual-office/mainkan/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 fs.mkdirSync('screenshots',{recursive:true});
 for(const [label,width,height] of [['desktop',1260,900],['mobile',390,780]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:label==='mobile',hasTouch:label==='mobile'});
  const errors=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:75000});
  await page.locator('#skipSplash').click({timeout:10000}).catch(()=>{});
  await page.locator('#welcomeGuest').click({timeout:10000});
  const title=page.locator('.cc-titlebar strong');
  assert.equal(await title.textContent(),'untitled - Character Creator');
  assert.equal(await page.locator('#ccTools .cc-tool-btn').count(),10,'All classic Paint tools required');
  assert.equal(await page.locator('#ccSwatches .cc-swatch-row').count(),5,'Five color palettes required');
  // Both approved Genesis bases expose their actual pixel-exact Custom Wear.
  assert.equal(await page.locator('#topStyle').inputValue(),'custom');
  assert.equal(await page.locator('#pantsStyle').inputValue(),'custom');
  assert.equal(await page.locator('#shoesStyle').inputValue(),'custom');
  // Short/Swept have deliberate 1x1 transparent back-hair files; they must
  // render with real front hair, without blanking the whole avatar.
  for(const [value,visibleText] of [['short','Short'],['swept','Short swept']]){
   await page.locator('#ccOptions').getByRole('button',{name:visibleText,exact:true}).click();
   assert.equal(await page.locator('#hairStyle').inputValue(),value);
   await page.waitForFunction(()=>{
    const el=document.getElementById('charPreview'),loading=document.getElementById('ccPreviewLoading'),
      changing=document.getElementById('ccPreviewUpdating'),gen=window.VLGenesisPlayer;
    const profile={base:document.querySelector('#characterChoices .choice.selected').dataset.character,
     appearance:{hairStyle:document.getElementById('hairStyle').value,
      topStyle:document.getElementById('topStyle').value,
      pantsStyle:document.getElementById('pantsStyle').value,
      shoesStyle:document.getElementById('shoesStyle').value}};
    const px=el.getContext('2d').getImageData(0,0,64,112).data;
    let opaque=0;for(let i=3;i<px.length;i+=4)if(px[i]>0)opaque++;
    return gen.imageStatus(profile).ready&&loading.hidden&&changing.hidden&&opaque>100;
   },null,{timeout:45000});
  }
  const custom=await page.evaluate(()=>{
   const selected=document.querySelector('#characterChoices .choice.selected').dataset.character;
   const profile={base:selected,appearance:{hairStyle:document.getElementById('hairStyle').value,
    topStyle:document.getElementById('topStyle').value,pantsStyle:document.getElementById('pantsStyle').value,
    shoesStyle:document.getElementById('shoesStyle').value}};
   const parts=window.VLGenesisPlayer.debug(profile);
   return {ready:window.VLGenesisPlayer.imageStatus(profile).ready,
    custom:parts.filter(p=>p.part.includes('/custom')).map(p=>({part:p.part,source:p.code,ready:p.ready}))};
  });
  assert.equal(custom.ready,true,'Genesis frame must be complete');
  assert.deepEqual(custom.custom.map(p=>p.part),['top/custom_back','shoes/custom','pants/custom','top/custom']);
  assert.ok(custom.custom.every(p=>p.source==='Genesis source'&&p.ready),
   'Approved custom layers must originate from Genesis actual source PNGs');
  console.log('[ok] Short/Swept + Genesis Custom Wear + no blank preview ('+label+')');

  await page.locator('#ccOptions .cc-choice-btn').filter({hasText:'Long curtain'}).click();
  assert.equal(await page.locator('#hairStyle').inputValue(),'long_curtain');
  await page.locator('#ccSwatches .cc-swatch').filter({has:page.locator('svg')}).count();
  await page.locator('#ccSwatches .cc-swatch[aria-label="Hair · Red"]').click();
  assert.equal(await page.locator('#hairColor').inputValue(),'red');
  await page.locator('#ccTools [data-tool=body]').click();
  await page.locator('#ccOptions .cc-choice-btn').filter({hasText:'Female'}).click();
  assert.equal(await page.locator('#characterChoices .choice.selected').getAttribute('data-character'),'genesis_female_nude');
  // Switching base must retain original Custom Wear but select female-specific
  // top/custom_f, pants/custom_f, shoes/custom_f, not reuse male sheets.
  await page.waitForFunction(()=>{
   const el=document.getElementById('ccPreviewUpdating');
   const p={base:'genesis_female_nude',appearance:{
    hairStyle:document.getElementById('hairStyle').value,
    topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}};
   return window.VLGenesisPlayer.imageStatus(p).ready&&el.hidden;
  },null,{timeout:45000});
  const femaleLayers=await page.evaluate(()=>{
   const layers=window.VLGenesisPlayer.debug({base:'genesis_female_nude',
    appearance:{hairStyle:'long_curtain',topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}});
   return layers.filter(x=>x.part.includes('/custom'));
  });
  assert.deepEqual(femaleLayers.map(x=>x.part),['top/custom_back','shoes/custom','pants/custom','top/custom']);
  assert.ok(femaleLayers.every(x=>x.ready&&x.code==='Genesis source'),
   'Female must use approved female custom atlas layers, not stock or male clothing');
  await page.locator('#ccDay').fill('11');
  await page.locator('#ccMonth').fill('01');
  await page.locator('#ccYear').fill('1994');
  assert.equal(await page.locator('#birthday').inputValue(),'1994-01-11');
  assert.equal(await page.locator('#zodiac').inputValue(),'Capricorn');
  const before=await page.locator('#previewDirection').textContent();
  await page.locator('#ccTools [data-tool=rotate]').click();
  const after=await page.locator('#previewDirection').textContent();
  assert.notEqual(after,before,'Rotate tool must change character direction');
  await page.locator('#ccMenu [data-menu=Edit]').click();
  await page.locator('#ccMenuPopup button').filter({hasText:'Random look'}).click();
  assert.equal(await page.locator('#ccMenuPopup').isHidden(),true);
  const position=await page.locator('#charPreview').boundingBox();
  assert.ok(position&&position.width>=35&&position.height>100,'Real character canvas must fit the Paint preview');
  assert.ok(position.x>=0&&position.x+position.width<=width+2,'Preview must not overflow the viewport');
  await page.screenshot({path:'screenshots/mainkan-classic-paint-'+label+'.png'});
  await page.locator('#playerName').fill('Player_Test');
  await page.locator('#ccCreate').click();
  await page.locator('#confirmScreen').waitFor({state:'visible',timeout:12000});
  assert.match(await page.locator('#confirmList').textContent(),/Capricorn/);
  assert.match(await page.locator('#confirmList').textContent(),/Player_Test/);
  assert.equal(errors.length,0,'Browser JS errors: '+errors.join(' | ').slice(0,600));
  await page.close();
 }
 await browser.close();
 console.log('MAINKAN_CLASSIC_PAINT_CREATOR_BROWSER_PASS');
})().catch(e=>{console.error('MAINKAN_CLASSIC_PAINT_CREATOR_BROWSER_FAIL',e.stack||e);process.exit(1)});

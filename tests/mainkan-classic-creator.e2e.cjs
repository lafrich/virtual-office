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
  // Genesis Nude retains its original Custom Wear source by default.
  // Black stock shoes are opt-in, with pants/shoe ordering guarded separately.
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

  // LGR-1 is now the shipping renderer. Old V6P layer debug URLs remain a
  // compatibility inspection surface, not the pixels used by the game.
  // Check REAL raster output in both genders and four native view directions.
  const nativeLGR=await page.evaluate(()=>window.VLGenesisPlayer.renderer().active==='lgr');
  if(nativeLGR){
   const proofHandle=await page.waitForFunction(()=>{
    const player=window.VLGenesisPlayer, dirs=['se','sw','ne','nw'];
    function render(gender,dir,shoes){
     const c=document.createElement('canvas');c.width=64;c.height=112;
     const p={base:'genesis_'+gender+'_nude',appearance:{
      skinTone:'light',hairStyle:'short',topStyle:'tee',pantsStyle:'trousers',shoesStyle:shoes,
      topColor:'white',pantsColor:'denim',shoesColor:'black'}};
     if(!player.directPreview(c,p,dir,'idle',0,'neutral',0))return null;
     const d=c.getContext('2d').getImageData(0,0,64,112).data;
     let opaque=0,hash=2166136261>>>0;
     for(let i=0;i<d.length;i+=4){
      if(d[i+3])opaque++;
      hash=Math.imul(hash^((d[i]<<24)|(d[i+1]<<16)|(d[i+2]<<8)|d[i+3]),16777619)>>>0;
     }
     return {opaque,hash};
    }
    const out=[];
    for(const gender of ['male','female']){
     for(const dir of dirs){
      const bare=render(gender,dir,'nude');
      const shod=dir==='se'||dir==='sw'?render(gender,dir,'shoes'):null;
      if(!bare||((dir==='se'||dir==='sw')&&!shod))return false;
      out.push({gender,dir,bare,shod});
     }
    }
    return out;
   },null,{timeout:90000});
   const proof=await proofHandle.jsonValue();
   assert.equal(proof.length,8,'LGR must render male/female in all four directions');
   assert.ok(proof.every(p=>p.bare.opaque>100),
    'LGR cannot mark an empty sprite as ready: '+JSON.stringify(proof));
   assert.ok(proof.filter(p=>p.shod).every(p=>p.shod.opaque>100&&p.shod.hash!==p.bare.hash),
    'LGR footwear must change actual native rendered pixels, not only a dropdown: '+JSON.stringify(proof));
   console.log('[ok] LGR native four-view, both genders and visible shoes ('+label+')');
  }else{
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
   'Approved custom top/pants layers must originate from Genesis actual source PNGs');
  await page.waitForFunction(()=>window.VLGenesisPlayer.imageStatus({
   base:'genesis_male_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'shoes'}
  }).ready,null,{timeout:45000});
  const maleShoes=await page.evaluate(()=>window.VLGenesisPlayer.debug({
   base:'genesis_male_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'shoes'}
  }));
  assert.ok(maleShoes.some(p=>p.part==='shoes/shoes'&&p.ready&&!p.error),
   'Optional native male Mahluk shoe sheet should be fully loaded');
  const order=maleShoes.map(x=>x.part);
  assert.ok(order.indexOf('pants/custom')<order.indexOf('shoes/shoes'),
   'Stock shoes must paint over custom pants to prevent flickering seams');
  // Verify the original barefoot slot is still explicitly selectable/editable.
  await page.locator('#ccTools [data-tool=shoes]').click();
  await page.locator('#ccOptions').getByRole('button',{name:/Genesis Custom Wear/}).click();
  await page.waitForFunction(()=>window.VLGenesisPlayer.imageStatus({
   base:'genesis_male_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}
  }).ready,null,{timeout:45000});
  const barefoot=await page.evaluate(()=>window.VLGenesisPlayer.debug({
   base:'genesis_male_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}
  }));
  assert.ok(barefoot.some(p=>p.part==='shoes/custom'&&p.code==='Genesis source'&&p.ready),
   'Original Genesis barefoot source must not be overwritten');
  await page.locator('#ccOptions').getByRole('button',{name:/Mahluk Shoes/}).click();
  assert.equal(await page.locator('#shoesStyle').inputValue(),'shoes');
  await page.locator('#ccOptions').getByRole('button',{name:/Genesis Custom Wear/}).click();
  assert.equal(await page.locator('#shoesStyle').inputValue(),'custom');
  await page.locator('#ccTools [data-tool=hair]').click();
  console.log('[ok] Short/Swept + native shoes + preserved Genesis source ('+label+')');

  await page.locator('#ccOptions .cc-choice-btn').filter({hasText:'Long curtain'}).click();
  assert.equal(await page.locator('#hairStyle').inputValue(),'long_curtain');
  await page.locator('#ccSwatches .cc-swatch').filter({has:page.locator('svg')}).count();
  await page.locator('#ccSwatches .cc-swatch[aria-label="Hair · Red"]').click();
  assert.equal(await page.locator('#hairColor').inputValue(),'red');
  await page.locator('#ccTools [data-tool=body]').click();
  await page.locator('#ccOptions .cc-choice-btn').filter({hasText:'Female'}).click();
  assert.equal(await page.locator('#characterChoices .choice.selected').getAttribute('data-character'),'genesis_female_nude');
  // Female retains original custom top/pants/feet; stock shoes are opt-in.
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
   'Female must use approved custom top/pants atlas layers');
  assert.equal(await page.locator('#shoesStyle').inputValue(),'custom');
  // Explicit stock shoe choice must not flicker during animation.
  await page.locator('#ccTools [data-tool=shoes]').click();
  await page.locator('#ccOptions').getByRole('button',{name:/Mahluk Shoes/}).click();
  await page.waitForFunction(()=>{
   const selected={base:'genesis_female_nude',appearance:{
    hairStyle:document.getElementById('hairStyle').value,
    topStyle:'custom',pantsStyle:'custom',shoesStyle:'shoes'}};
   return window.VLGenesisPlayer.imageStatus(selected).ready
    &&document.getElementById('ccPreviewUpdating').hidden;
  },null,{timeout:45000});
  const femaleShoes=await page.evaluate(()=>window.VLGenesisPlayer.debug({
   base:'genesis_female_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'shoes'}
  }));
  assert.ok(femaleShoes.some(p=>p.part==='shoes/shoes_f'&&p.ready&&!p.error),
   'Optional native female Mahluk footwear must be available');
  const orderFemale=femaleShoes.map(x=>x.part);
  assert.ok(orderFemale.indexOf('pants/custom')<orderFemale.indexOf('shoes/shoes_f'),
   'Female stock shoes must render after custom pants');
  // Verify the actual rendered feet, not just the dropdown and resource URL.
  const renderedShoes=await page.evaluate(()=>{
   const cv=document.getElementById('charPreview'),px=cv.getContext('2d').getImageData(0,0,64,112).data;
   let dark=0;for(let y=95;y<=101;y++)for(let x=20;x<=44;x++){
    const i=(y*64+x)*4;if(px[i+3]>200&&px[i]<100&&px[i+1]<100&&px[i+2]<110)dark++;
   }
   return dark;
  });
  assert.ok(renderedShoes>=15,
   'Female shoe pixels must render as dark footwear rather than nude skin: '+renderedShoes);
  // Compare actual composite pixel masks, not just resource paths. Real black
  // shoes must remain visible through all Idle/Walk frames and four directions.
  const frameCoverage=await page.evaluate(()=>{
   const player=window.VLGenesisPlayer;
   const base={base:'genesis_female_nude',appearance:{
    hairStyle:document.getElementById('hairStyle').value,
    topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}};
   const shoe={...base,appearance:{...base.appearance,shoesStyle:'shoes'}};
   const score=(profile,dir,action,frame)=>{
    const c=document.createElement('canvas');c.width=64;c.height=112;
    if(!player.directPreview(c,profile,dir,action,frame,'neutral',0))return -1;
    const d=c.getContext('2d').getImageData(0,0,64,112).data;
    let n=0;for(let y=90;y<=103;y++)for(let x=18;x<=46;x++){
     const i=(y*64+x)*4;
     if(d[i+3]>200&&d[i]<100&&d[i+1]<100&&d[i+2]<110)n++;
    }
    return n;
   };
   const out=[];
   for(const action of ['idle','walk'])for(const dir of ['se','sw','ne','nw'])
    for(let frame=0;frame<(action==='walk'?6:4);frame++){
     const actual=score(shoe,dir,action,frame);
     const natural=score(base,dir,action,frame);
     out.push({action,dir,frame,delta:actual-natural,actual,natural});
    }
   return out;
  });
  assert.ok(frameCoverage.every(r=>r.delta>=20),
   'Black shoes must stay visible in every pose/frame: '+JSON.stringify(frameCoverage.filter(r=>r.delta<20)));
  // Loading the source layer is asynchronous even though it is preserved.
  await page.waitForFunction(()=>window.VLGenesisPlayer.imageStatus({
   base:'genesis_female_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}
  }).ready,null,{timeout:45000});
  const originalFemale=await page.evaluate(()=>window.VLGenesisPlayer.debug({
   base:'genesis_female_nude',appearance:{topStyle:'custom',pantsStyle:'custom',shoesStyle:'custom'}
  }));
  assert.ok(originalFemale.some(p=>p.part==='shoes/custom'&&p.code==='Genesis source'&&p.ready),
   'Female original barefoot custom layer remains editable and gender-specific');
  await page.locator('#ccOptions').getByRole('button',{name:/Genesis Custom Wear/}).click();
  assert.equal(await page.locator('#shoesStyle').inputValue(),'custom');
  await page.locator('#ccTools [data-tool=hair]').click();
  }
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
  const geometry=await page.evaluate(()=>{
   const bounds=id=>{const r=document.querySelector(id).getBoundingClientRect();return {w:r.width,h:r.height,x:r.x,y:r.y}};
   return {window:bounds('.window'),workspace:bounds('.cc-canvas-frame'),
    paper:bounds('.cc-paper'),sprite:bounds('#charPreview'),
    paperPosition:getComputedStyle(document.querySelector('.cc-paper')).position};
  });
  assert.equal(geometry.paperPosition,'absolute','Paint paper must not collapse into a short relative-positioned strip');
  assert.ok(geometry.paper.h>=Math.min(180,geometry.workspace.h*.70),
   'White Paint work area must fill the preview height: '+JSON.stringify(geometry));
  assert.ok(geometry.paper.w>=geometry.workspace.w*.80,
   'White Paint work area must fill the preview width: '+JSON.stringify(geometry));
  if(label==='desktop'){
   assert.ok(geometry.window.w>=width*.85,'Desktop Paint window should fill browser width: '+JSON.stringify(geometry));
   assert.ok(geometry.sprite.h>=Math.min(230,geometry.paper.h*.70),
    'Desktop sprite must be visibly enlarged, not a tiny sprite at the top: '+JSON.stringify(geometry));
  }
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

'use strict';
/* Browser smoke: mainkan.exe renders the ORIGINAL Semesta WebGL and Jiwa gameplay.
 * CI serves virtual-office and virtual-life-asset-pipeline from a shared origin.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.MAINKAN_TEST_URL||'http://127.0.0.1:8091/virtual-office/mainkan/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('#skipSplash').click({timeout:15000}).catch(()=>{});
 await page.locator('#guestButton').click({timeout:15000});
 await page.locator('#playerName').fill('Semesta Tester');
 await page.locator('#zodiac').selectOption({label:'Capricorn'});
 const before=await page.evaluate(()=>localStorage.getItem('virtual-life-gpt-world-builder-pipeline-v3'));
 await page.locator('#characterForm button[type=submit]').click();
 await page.waitForFunction(()=>{
   const el=document.getElementById('semestaFrame');
   const win=el?.contentWindow;
   try{return !!win?.document?.documentElement?.dataset?.mainkanReady&&
    win.SemestaLifePlay?.active?.()===true&&document.getElementById('worldLoading').hidden;}
   catch{return false;}
 },null,{timeout:150000});
 const result=await page.evaluate(()=>{
  const win=document.getElementById('semestaFrame').contentWindow;
  const doc=win.document;
  const world=doc.getElementById('world');
  const hidden=id=>getComputedStyle(doc.getElementById(id)).display==='none';
  const active=doc.getElementById('walkMode')?.classList.contains('active');
  return {playerMode:doc.documentElement.classList.contains('semesta-player-mode'),
   webgl:!!world.getContext('webgl2')||!!world.getContext('webgl'),
   rendererSize:[world.width,world.height],
   nativeWorld:!!win.SemestaPlay,nativeLife:win.SemestaLifePlay.active(),
   nativePlayMode:active,hasNativeHUD:!!win.VLPlayHud,
   hiddenEditor: ['toolsPanel','assetsPanel','inspector','menubar','footer'].every(hidden),
   tutorialHidden:doc.getElementById('tutorialOverlay')?.hidden===true,
   currentCity:doc.getElementById('saveStatus')?.textContent,
   authoringStorage:win.localStorage.getItem('virtual-life-gpt-world-builder-pipeline-v3')};
 });
 const after=await page.evaluate(()=>localStorage.getItem('virtual-life-gpt-world-builder-pipeline-v3'));
 console.log('MAIN KAN ORIGINAL SEMESTA',JSON.stringify({...result,authoringStorage:undefined}));
 assert.equal(result.playerMode,true);
 assert.equal(result.nativeWorld,true);
 assert.equal(result.nativeLife,true);
 assert.equal(result.nativePlayMode,true);
 assert.equal(result.hasNativeHUD,true);
 assert.equal(result.hiddenEditor,true);
 assert.equal(result.tutorialHidden,true);
 assert.ok(result.rendererSize[0]>300&&result.rendererSize[1]>200,'Native Semesta canvas must have real viewport');
 assert.equal(after,before,'Player entry must not overwrite the authoring working city');
 assert.ok(!errors.some(e=>/SyntaxError|ReferenceError/i.test(e)),errors.slice(0,4).join(' | '));
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/mainkan-native-semesta.png',fullPage:true});
 await browser.close();
 console.log('MAINKAN_NATIVE_SEMESTA_BROWSER_PASS');
})().catch(e=>{console.error('MAINKAN_NATIVE_SEMESTA_BROWSER_FAIL',e.stack||e);process.exit(1)});

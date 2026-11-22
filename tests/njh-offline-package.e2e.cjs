'use strict';
/* Real playable offline smoke against the exact game files included in the Android APK.
 * It deliberately forbids ALL external network traffic.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ROOT='http://127.0.0.1:8097/virtual-office/mainkan/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1150,height:760}});
 const blocked=[],errors=[],missing=[];
 page.on('response',res=>{if(res.status()>=400)missing.push(res.status()+' '+res.url());});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1'&&url.port==='8097')
   await route.continue();
  else{
   blocked.push(route.request().url());
   await route.abort();
  }
 });
 try{
  await page.goto(ROOT,{waitUntil:'domcontentloaded',timeout:20000});
  await page.locator('#skipSplash').click({timeout:12000}).catch(()=>{});
  await page.locator('#welcomeGuest').click({timeout:15000});
  await page.locator('#characterScreen').waitFor({state:'visible',timeout:10000});
  await page.locator('#playerName').fill('Pemain Offline');
  await page.locator('#ccDay').fill('11');
  await page.locator('#ccMonth').fill('01');
  await page.locator('#ccYear').fill('1994');
  await page.waitForFunction(()=>document.getElementById('zodiac').value==='Capricorn',
    null,{timeout:10000});
  await page.locator('#ccCreate').click();
  await page.locator('#confirmScreen').waitFor({state:'visible',timeout:10000});
  await page.locator('#confirmGo').click();
  await page.locator('#tutorialScreen').waitFor({state:'visible',timeout:30000});
  await page.locator('#tutorialSkip').click();
  await page.locator('#gameScreen').waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>{
   const frame=document.getElementById('semestaFrame');
   return document.getElementById('worldLoading')?.hidden===true&&
    frame?.contentWindow?.SemestaLifePlay?.active?.()===true;
  },null,{timeout:90000});
  const profile=await page.evaluate(()=>({
   character:window.NJHOfflineSave.character(),
   onlineReady:document.getElementById('worldLoading')?.hidden,
   life:document.getElementById('semestaFrame').contentWindow.SemestaLifePlay.state(),
   url:document.getElementById('semestaFrame').getAttribute('src')
  }));
  assert.equal(profile.character.name,'Pemain Offline');
  assert.equal(profile.onlineReady,true);
  assert.ok(profile.life);
  // The visible in-game Win98 dock owns the menu entry.
  await page.locator('#njhDockMenu').click();
  await page.locator('#offlineSave').click();
  await page.waitForFunction(()=>document.getElementById('offlineActionStatus')?.textContent?.includes('Tersimpan'),
    null,{timeout:10000});
  await page.locator('#pauseExit').click();
  await page.locator('#welcomeContinue').click();
  await page.waitForFunction(()=>document.getElementById('worldLoading')?.hidden===true,
    null,{timeout:90000});
  console.log('NJH_OFFLINE_PLAYER_READY_AND_CONTINUE_PASS',JSON.stringify({
    name:profile.character.name,gameTime:profile.life.visualClock,blockedExternalRequests:blocked.length
  }));
  if(blocked.length)console.log('BLOCKED_EXTERNAL_URLS',JSON.stringify([...new Set(blocked)].slice(0,30)));
 }catch(error){
  fs.mkdirSync('screenshots',{recursive:true});
  await page.screenshot({path:'screenshots/njh-offline-package-failure.png',fullPage:true}).catch(()=>{});
  console.error('NJH_OFFLINE_PACKAGE_PLAYTEST_FAIL',error.message);
  console.error('REMOTE_REQUESTS',JSON.stringify([...new Set(blocked)].slice(0,30)));
  console.error('BROWSER_ERRORS',JSON.stringify(errors.slice(0,35)));
  console.error('MISSING_ASSET_REQUESTS',JSON.stringify(missing.slice(0,60)));
  process.exitCode=1;
 }finally{await browser.close();}
})();

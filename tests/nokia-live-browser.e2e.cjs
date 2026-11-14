'use strict';
/* Real Chromium proof that Mainkan's native Semesta player, Jiwa wallet
 * and original Nokia LCD share state. Never enter gameplay via city editor. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.MAINKAN_TEST_URL||'http://127.0.0.1:8091/virtual-office/mainkan/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1350,height:850}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 page.on('console',message=>{if(message.type()==='error'&&/unhandled|undefined|ReferenceError|SyntaxError/i.test(message.text()))errors.push(message.text())});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
 await page.locator('#skipSplash').click({timeout:15000}).catch(()=>{});
 await page.locator('#welcomeGuest').click({timeout:15000});
 await page.locator('#playerName').fill('Nokia Tester');
 await page.locator('#ccDay').fill('11');
 await page.locator('#ccMonth').fill('01');
 await page.locator('#ccYear').fill('1994');
 await page.locator('#ccYear').dispatchEvent('input');
 await page.locator('#characterForm button[type=submit]').click();
 await page.locator('#confirmGo').click({timeout:15000});
 // Tutorial is a three-page wizard: 'Mulai Main' stays hidden until
 // the last page. Wait for loading to finish, then follow its supported flow.
 await page.waitForFunction(()=>['tutorialScreen','gameScreen'].some(id=>{
  const e=document.getElementById(id);return e&&!e.hidden;
 }),null,{timeout:30000});
 if(await page.locator('#tutorialScreen').isVisible()){
  if(await page.locator('#tutorialSkip').isVisible())
   await page.locator('#tutorialSkip').click({timeout:10000});
  else{
   for(let i=0;i<3&&!(await page.locator('#tutorialDone').isVisible());i++)
    await page.locator('#tutorialScreen [data-howto="next"]').click({timeout:10000});
   await page.locator('#tutorialDone').click({timeout:10000});
  }
 }
 await page.locator('#gameScreen').waitFor({state:'visible',timeout:30000});
 await page.waitForFunction(()=>{
  const win=document.getElementById('semestaFrame')?.contentWindow;
  try{return !!win?.document?.documentElement?.dataset?.mainkanReady&&
    win.SemestaLifePlay?.active?.()===true&&document.getElementById('worldLoading').hidden;}
  catch{return false;}
 },null,{timeout:150000});
 const frame=await (await page.locator('#semestaFrame').elementHandle()).contentFrame();
 if(!frame)throw Error('Mainkan native Semesta frame unavailable');
 await frame.waitForFunction(()=>window.SemestaLifePlay?.active?.()&&
  window.VLPhoneEllen?.hasGameProvider?.(),null,{timeout:30000});
 const synced=await frame.evaluate(()=>{
  const life=window.SemestaLifePlay,phone=window.VLPhoneEllen;
  const live=phone.gameSnapshot(),city=life.sites();
  return {lifeActive:life.active(),wallet:life.state().wallet,nokiaWallet:live.wallet,
   siteCount:city.length,mapSiteCount:live.map.sites.length,
   matching:city.every(site=>{
    const m=live.map.sites.find(x=>x.id===site.id);
    return !!m&&m.x===site.x&&m.z===site.z;
   }),terrainCount:live.map.terrain.length,realSites:city.filter(n=>!n.placeholder).length,
   placeholderSites:city.filter(n=>n.placeholder).length};
 });
 console.log('LIVE_CITY_AND_PHONE',JSON.stringify(synced));
 assert.equal(synced.lifeActive,true);
 assert.equal(synced.wallet,synced.nokiaWallet,'Nokia must show Jiwa wallet');
 assert.equal(synced.siteCount,synced.mapSiteCount);
 assert.equal(synced.matching,true,'Nokia activity pins must use real gameplay action coordinates');
 assert.ok(synced.siteCount>=12,'Expected playable V1 activity sites');
 assert.ok(synced.terrainCount>0,'Nokia map should use real Semesta terrain rather than a fake grid');
 await page.locator('#gamePhone').click({timeout:10000});
 await frame.waitForFunction(()=>window.VLNokiaPlay?.isOpen?.(),null,{timeout:15000});
 const token=await frame.evaluate(()=>{
  const game=window.SemestaLifePlay;
  // Test-only fixture: user progress is never mutated outside this disposable
  // CI browser context. Ensure owned-room purchase eligibility.
  game.state().housing.room=true;
  const E=window.VLPhoneEllen;E.press('OK');E.press('1');
  const before=E.draw(),depth=E.depth(),wallet=E.gameSnapshot().wallet;
  return {depth,wallet,rgba:[...before.data]};
 });
 assert.equal(token.depth,3,'Nokia must navigate to Dompet within original handset');
 const trade=await frame.evaluate(()=>{
  const E=window.VLPhoneEllen;E.press('R');E.press('4');E.press('1');E.press('L');E.press('L');
  const game=window.SemestaLifePlay,live=E.gameSnapshot();
  return {wallet:game.state().wallet,nokiaWallet:live.wallet,token:game.state().powerTokens,
   ledger:live.transactions,stillOpen:window.VLNokiaPlay.isOpen(),depth:E.depth()};
 });
 console.log('REAL_NOKIA_PURCHASE',JSON.stringify(trade));
 assert.equal(trade.wallet,token.wallet-20000,'Nokia must debit the Jiwa price Rp20.000 for five token units');
 assert.equal(trade.nokiaWallet,trade.wallet,'Nokia and Jiwa balances must match after buying');
 assert.ok(trade.ledger.some(t=>t.action==='buy_token'&&t.delta===-20000),'Dompet must record the authoritative Rp20.000 token purchase');
 assert.equal(trade.stillOpen,true,'Nokia must remain open after game HUD refresh');
 assert.ok(trade.depth>=3,'Nokia must not reset to standby during purchase');
 const mapResult=await frame.evaluate(()=>{
  const E=window.VLPhoneEllen;
  for(let i=0;i<8&&E.depth()>2;i++)E.press('R');
  E.press('6');
  const before=E.draw(),start=E.gameSnapshot();
  const dest=start.map.sites.find(s=>Math.hypot(s.x-start.map.player.x,s.z-start.map.player.z)>4);
  if(!dest)throw Error('Missing distinct site for live Nokia map test');
  document.querySelector('#slpDestination').value=dest.id;
  document.querySelector('#slpTravel').click();
  const end=E.gameSnapshot(),after=E.draw();
  let pixelDelta=0;
  for(let i=0;i<before.data.length;i++)if(before.data[i]!==after.data[i])pixelDelta++;
  return {depth:E.depth(),start:{x:start.map.player.x,z:start.map.player.z},
   end:{x:end.map.player.x,z:end.map.player.z},dest,
   pixelDelta,terrainCount:end.map.terrain.length,stillOpen:window.VLNokiaPlay.isOpen()};
 });
 console.log('REAL_NOKIA_MAP',JSON.stringify(mapResult));
 assert.equal(mapResult.depth,3,'Nokia must be on its native Peta screen');
 assert.ok(Math.hypot(mapResult.start.x-mapResult.end.x,mapResult.start.z-mapResult.end.z)>4,
  'Real character world coordinates must change after teleport');
 assert.ok(Math.hypot(mapResult.end.x-mapResult.dest.x,mapResult.end.z-mapResult.dest.z)<.05,
  'Player marker in Nokia must follow actual Semesta teleport, not a demo position');
 assert.ok(mapResult.pixelDelta>0,'The actual Nokia LCD must visibly change when the player moves');
 assert.equal(mapResult.stillOpen,true);
 assert.ok(!errors.some(e=>/ReferenceError|SyntaxError|TypeError/i.test(e)),
  'Browser JS errors: '+errors.join(' | ').slice(0,800));
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/mainkan-nokia-jiwa-verified.png'});
 await browser.close();
 console.log('NOKIA_LIVE_E2E_PASS',JSON.stringify({wallet:trade.wallet,pins:synced.siteCount,
  terrain:synced.terrainCount,positionChanged:mapResult.pixelDelta>0}));
})().catch(e=>{console.error('NOKIA_LIVE_E2E_FAIL',e.stack||e);process.exit(1)});

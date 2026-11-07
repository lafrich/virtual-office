'use strict';
/* Real Chromium proof that Semesta's 3D actor, Jiwa wallet and the original
 * Nokia LCD share state. Run from repo-parent with a same-origin web server.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.SEMESTA_TEST_URL||'http://127.0.0.1:8091/virtual-office/world-builder/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1350,height:850}});
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e.stack||e)));
 page.on('console',message=>{if(message.type()==='error'&&/unhandled|undefined|ReferenceError|SyntaxError/i.test(message.text()))errors.push(message.text())});
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>!!window.SemestaPlay&&!!window.SemestaLifePlay&&!!window.VLPhoneEllen,
  null,{timeout:120000});
 // Onboarding opens on window.load, which may occur AFTER domcontentloaded
 // and our initial app-ready check. Close it deterministically in CI.
 await page.waitForLoadState('load',{timeout:30000}).catch(()=>{});
 await page.evaluate(()=>window.VLQuickTutorial?.close?.());
 await page.locator('#walkMode').click({timeout:20000});
 try{
  await page.waitForFunction(()=>window.SemestaLifePlay?.active?.()&&window.VLPhoneEllen?.hasGameProvider?.(),
   null,{timeout:20000});
 }catch(err){
  const debug=await page.evaluate(()=>({
   active:window.SemestaLifePlay?.active?.(),
   state:window.SemestaLifePlay?.state?.(),
   phoneProvider:window.VLPhoneEllen?.hasGameProvider?.(),
   HUDMounted:!!document.querySelector('#vlPlayHud'),
   walkButton:document.getElementById('walkMode')?.className,
   playHUD:document.documentElement.className,
   toast:document.getElementById('toast')?.textContent,
   actorCount:window.SemestaPlay?.playObjects?.().filter(x=>x.type==='avatar').length,
   lifeSites:window.SemestaLifePlay?.sites?.().length
  }));
  console.error('PLAY_MODE_DIAGNOSTICS',JSON.stringify({debug,pageErrors:errors.slice(0,16)}));
  fs.mkdirSync('screenshots',{recursive:true});
  await page.screenshot({path:'screenshots/nokia-play-mode-failure.png'});
  throw err;
 }
 const synced=await page.evaluate(()=>{
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
 await page.locator('#ptPhoneBtn').click({timeout:10000});
 await page.waitForFunction(()=>window.VLNokiaPlay?.isOpen?.(),null,{timeout:15000});
 const token=await page.evaluate(()=>{
  const game=window.SemestaLifePlay;
  // Test-only fixture: user progress is never mutated outside this disposable
  // CI browser context. Ensure owned-room purchase eligibility.
  game.state().housing.room=true;
  const E=window.VLPhoneEllen;E.press('OK');E.press('1');
  const before=E.draw(),depth=E.depth(),wallet=E.gameSnapshot().wallet;
  return {depth,wallet,rgba:[...before.data]};
 });
 assert.equal(token.depth,3,'Nokia must navigate to Dompet within original handset');
 const trade=await page.evaluate(()=>{
  const E=window.VLPhoneEllen;E.press('R');E.press('4');E.press('1');E.press('L');E.press('L');
  const game=window.SemestaLifePlay,live=E.gameSnapshot();
  return {wallet:game.state().wallet,nokiaWallet:live.wallet,token:game.state().powerTokens,
   ledger:live.transactions,stillOpen:window.VLNokiaPlay.isOpen(),depth:E.depth()};
 });
 console.log('REAL_NOKIA_PURCHASE',JSON.stringify(trade));
 assert.equal(trade.wallet,token.wallet-1000,'Original Nokia marketplace must debit Jiwa wallet');
 assert.equal(trade.nokiaWallet,trade.wallet,'Nokia and Jiwa balances must match after buying');
 assert.ok(trade.ledger.some(t=>t.action==='buy_token'&&t.delta===-1000),'Dompet must reflect real transaction');
 assert.equal(trade.stillOpen,true,'Nokia must remain open after game HUD refresh');
 assert.ok(trade.depth>=3,'Nokia must not reset to standby during purchase');
 const mapResult=await page.evaluate(()=>{
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
  return {depth:E.depth(),start:start.map.player,end:end.map.player,dest,
   pixelDelta,terrainCount:end.map.terrain.length,stillOpen:window.VLNokiaPlay.isOpen()};
 });
 console.log('REAL_NOKIA_MAP',JSON.stringify(mapResult));
 assert.equal(mapResult.depth,3,'Nokia must be on its native Peta screen');
 assert.ok(Math.hypot(mapResult.end.x-mapResult.dest.x,mapResult.end.z-mapResult.dest.z)<.05,
  'Player marker in Nokia must follow actual Semesta teleport, not a demo position');
 assert.ok(mapResult.pixelDelta>0,'The actual Nokia LCD must visibly change when the player moves');
 assert.equal(mapResult.stillOpen,true);
 assert.ok(!errors.some(e=>/ReferenceError|SyntaxError|TypeError/i.test(e)),
  'Browser JS errors: '+errors.join(' | ').slice(0,800));
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/semesta-nokia-jiwa-verified.png'});
 await browser.close();
 console.log('NOKIA_LIVE_E2E_PASS',JSON.stringify({wallet:trade.wallet,pins:synced.siteCount,
  terrain:synced.terrainCount,positionChanged:mapResult.pixelDelta>0}));
})().catch(e=>{console.error('NOKIA_LIVE_E2E_FAIL',e.stack||e);process.exit(1)});

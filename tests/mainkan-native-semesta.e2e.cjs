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
 await page.locator('#welcomeGuest').click({timeout:15000});
 await page.locator('#playerName').fill('Semesta Tester');
 await page.locator('#ccDay').fill('11');
 await page.locator('#ccMonth').fill('01');
 await page.locator('#ccYear').fill('1994');
 await page.locator('#ccYear').dispatchEvent('input');
 assert.equal(await page.locator('#zodiac').inputValue(),'Capricorn');
 const before=await page.evaluate(()=>localStorage.getItem('virtual-life-gpt-world-builder-pipeline-v3'));
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
 // Mainkan must control its own Genesis actor, not an authored Ichsan NPC.
 try{
 await page.waitForFunction(()=>{
  try{
   const win=document.getElementById('semestaFrame').contentWindow;
   const actor=win.SemestaPlay?.playerActor?.();
   return actor?.profile==='genesis_male_nude'&&win.SemestaPlay?.playerProfile?.()?.base==='genesis_male_nude'&&
    win.SemestaPlay?.playerActor?.()?.name==='Semesta Tester'&&
    win.SemestaPlay?.playerRigStatus?.()?.loaded===true;
  }catch{return false;}
 },null,{timeout:25000});
 }catch(error){
  const diag=await page.evaluate(()=>{
   const w=document.getElementById('semestaFrame').contentWindow;
   return {actor:w.SemestaPlay?.playerActor?.(),rig:w.SemestaPlay?.playerRigStatus?.(),
    profile:w.SemestaPlay?.playerProfile?.(),
    layers:w.VLGenesisPlayer?.debug?.(w.SemestaPlay?.playerProfile?.())||null,
    missed:performance.getEntriesByType('resource').filter(x=>/v6p/.test(x.name)).slice(-15).map(x=>x.name)};
  });
  console.log('GENESIS_PLAYER_DIAGNOSTICS',JSON.stringify(diag).slice(0,13000));
  throw error;
 }
 const genesis=await page.evaluate(()=>{
  const win=document.getElementById('semestaFrame').contentWindow;
  return {profile:win.SemestaPlay.playerProfile(),actor:win.SemestaPlay.playerActor(),
   rig:win.SemestaPlay.playerRigStatus(),faces:win.VLEmosiSource?.emotions?.length,
   faceSource:win.VLEmosiSource?.format};
 });
 assert.equal(genesis.profile.faceSource,'emosi.exe');
 assert.equal(genesis.actor.profile,'genesis_male_nude');
 assert.ok(genesis.faces>=18);
 assert.equal(genesis.faceSource,'mainkan-emosi-published-v1');
 assert.equal(genesis.rig.source,'genesis','Player geometry must be Genesis pixels');
 assert.equal(genesis.rig.visible,true,'Genesis mesh must remain visible in the player world');
 assert.ok(genesis.rig.opaquePixels>350,
  'Player CanvasTexture must contain an actual opaque LGR character, not just an empty loaded canvas');
 assert.ok(genesis.rig.visibleHeight>=60,
  'LGR character must be visibly tall next to NJH scenery');
 assert.notEqual(genesis.actor.profile,'ichsan');
 assert.equal(result.hasNativeHUD,true);
 assert.equal(result.hiddenEditor,true);
 assert.ok(await page.locator('#mainkanGameBar').isVisible());
 assert.equal(await page.evaluate(()=>document.getElementById('semestaFrame').contentWindow.document.getElementById('vs-hud').getBoundingClientRect().height),0,'Native HUD chrome hidden, source systems retained');
 assert.equal(result.tutorialHidden,true);
 assert.ok(result.rendererSize[0]>300&&result.rendererSize[1]>200,'Native Semesta canvas must have real viewport');
 const respawn=await page.evaluate(()=>{
  const win=document.getElementById('semestaFrame').contentWindow;
  const before=win.SemestaPlay.playerActor();
  const at=win.SemestaPlay.spawnRespawn.respawn({fainted:true});
  const after=win.SemestaPlay.playerActor();
  const emotion=win.SemestaPlay.setPlayerEmotion('happy',3);
  return {same:before?.id===after?.id,before:before?.profile,after:after?.profile,
   respawnOk:at?.ok===true,happyAvailable:emotion};
 });
 assert.equal(respawn.same,true,'Respawn must retain the same player instance');
 assert.equal(respawn.before,'genesis_male_nude');
 assert.equal(respawn.after,'genesis_male_nude');
 assert.equal(respawn.happyAvailable,true,'Emosi happy context must be selectable');
 // NJH98 uses a single context-sensitive AKSI button. Clicking it opens
 // the sliding icon bar, not an immediate click on the retired ptActionBtn.
 const actionBefore=await page.evaluate(()=>{
  const w=document.getElementById('semestaFrame').contentWindow;
  return w.SemestaLifePlay.nearbyActions().some(x=>x.id==='fart');
 });
 assert.equal(actionBefore,true,'Fart remains an always-offered context action');
 await page.locator('#gameAction').click();
 const bar=page.locator('#njhActBar');
 await bar.waitFor({state:'visible',timeout:10000});
 const options=await page.locator('#njhActBar [data-njh-act]').count();
 assert.ok(options>=1,'Single AKSI must expose contextual entries');
 const fart=page.locator('#njhActBar [data-njh-act="fart"]');
 assert.ok(await fart.isVisible(),'Fart must be offered inside the same AKSI bar');
 await fart.click();
 await bar.waitFor({state:'hidden',timeout:8000});
 // Hobo spawn intentionally conceals the actor during its authored
 // five-phase exit-tent animation. The gameplay is only VISIBLY ready after
 // its last frame; checking a loaded atlas alone misses this failure.
 await page.waitForFunction(()=>{
  const w=document.getElementById('semestaFrame')?.contentWindow;
  const r=w?.SemestaPlay?.playerRigStatus?.();
  return r?.loaded===true&&r.visible===true&&r.clipPlaying===false;
 },null,{timeout:30000});
 const readyPlayer=await page.evaluate(()=>{
  const w=document.getElementById('semestaFrame').contentWindow;
  return {rig:w.SemestaPlay.playerRigStatus(),spawn:w.VLSpawnHobo?.snapshot?.()||null,
   camera:w.VLNjhMapPreviewRuntime?.camera?.()||null};
 });
 console.log('VISIBLE_GENESIS_AFTER_SPAWN',JSON.stringify(readyPlayer));
 assert.equal(readyPlayer.rig.visible,true,'Genesis must become visible after tent intro');
 assert.equal(readyPlayer.rig.clipPlaying,false,'Tent exit must finish before gameplay visibility QA');
 assert.equal(readyPlayer.rig.screen.visible,true,'Genesis world position must project onto the playable viewport');
 assert.equal(readyPlayer.rig.editorOutline,false,
  'Mainkan must not draw the yellow Semesta editor BoxHelper around Genesis');
 assert.equal(readyPlayer.rig.editorGrid,false,
  'Mainkan must hide the full-screen isometric placement grid');
 assert.equal(readyPlayer.rig.editorMarkersVisible,0,
  'Mainkan must not render authored yellow logic-marker pins or floating exclamation points');
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/mainkan-world-genesis-visible.png',fullPage:true});
 // Mobile viewport QA must use the same real Genesis world, not a mock screenshot.
 // Preserve the original wide-screen editor/game settings after the check.
 for(const v of [{name:'mobile-portrait',w:390,h:844},{name:'mobile-landscape',w:844,h:390}]){
  await page.setViewportSize({width:v.w,height:v.h});
  await page.waitForTimeout(180);
  const mobile=await page.evaluate(()=>{
   const frame=document.getElementById('semestaFrame');
   const win=frame?.contentWindow,world=win?.document?.getElementById('world');
   const rig=win?.SemestaPlay?.playerRigStatus?.();
   const action=document.getElementById('gameAction');
   const rect=action?.getBoundingClientRect?.();
   return {ready:!!rig?.loaded,screenVisible:!!rig?.screen?.visible,
    editorGrid:rig?.editorGrid,editorOutline:rig?.editorOutline,
    canvasW:world?.width||0,canvasH:world?.height||0,
    actionVisible:!!rect&&rect.width>0&&rect.height>0&&rect.left>=-1&&rect.right<=innerWidth+1};
  });
  console.log('MAINKAN_MOBILE_VIEWPORT',v.name,JSON.stringify(mobile));
  assert.equal(mobile.ready,true,v.name+' Genesis not loaded');
  assert.equal(mobile.screenVisible,true,v.name+' player outside viewport');
  assert.equal(mobile.editorGrid,false,v.name+' editor grid visible');
  assert.equal(mobile.editorOutline,false,v.name+' editor selection visible');
  assert.ok(mobile.canvasW>=100&&mobile.canvasH>=100,v.name+' WebGL canvas collapsed');
  assert.equal(mobile.actionVisible,true,v.name+' AKSI button offscreen');
  await page.screenshot({path:'screenshots/mainkan-world-'+v.name+'.png',fullPage:true});
 }
 await page.setViewportSize({width:1280,height:800});
 await page.locator('#gamePhone').click();
 const phone=await page.evaluate(()=>document.getElementById('semestaFrame').contentWindow.VLNokiaPlay?.isOpen?.()||false);
 assert.equal(phone,true,'Mainkan Phone button must open native Semesta Nokia');
 assert.equal(after,before,'Player entry must not overwrite the authoring working city');
 assert.ok(!errors.some(e=>/SyntaxError|ReferenceError/i.test(e)),errors.slice(0,4).join(' | '));
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/mainkan-native-semesta.png',fullPage:true});
 // Regression: touch+portrait used to show an opaque full-screen
 // "Putar HP" alertdialog with no bypass; users with rotation lock were stuck.
 const mobileContext=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true
 });
 const mobilePage=await mobileContext.newPage();
 await mobilePage.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
 // Force the CSS presentation state without writing player state or requiring a login.
 await mobilePage.addStyleTag({content:'#gameScreen[hidden]{display:flex!important}'});
 await mobilePage.evaluate(()=>document.body.classList.add('njh-play'));
 const hint=await mobilePage.evaluate(()=>{
  const el=document.getElementById('njhRotate');
  const r=el.getBoundingClientRect(),hit=document.elementFromPoint(180,520);
  return {coarse:matchMedia('(pointer:coarse)').matches,
   portrait:matchMedia('(orientation:portrait)').matches,
   display:getComputedStyle(el).display,width:r.width,height:r.height,
   middleBlocked:el.contains(hit),role:el.getAttribute('role'),
   continueVisible:!!document.getElementById('njhRotateContinue')?.getClientRects().length};
 });
 assert.equal(hint.coarse,true,'mobile test must actually emulate a touch pointer');
 assert.equal(hint.portrait,true,'mobile test must actually emulate portrait');
 assert.equal(hint.display,'block','optional portrait hint should be visible until dismissed');
 assert.ok(hint.width<340&&hint.height<300,'portrait hint must never become a full-screen blocker');
 assert.equal(hint.middleBlocked,false,'world center must remain available to touch');
 assert.equal(hint.role,'status','rotation hint must no longer be a modal alertdialog');
 assert.equal(hint.continueVisible,true,'portrait users require a continue control');
 await mobilePage.locator('#njhRotateContinue').click();
 assert.equal(await mobilePage.locator('#njhRotate').evaluate(el=>getComputedStyle(el).display),
  'none','Continue must immediately uncover gameplay');
 await mobilePage.setViewportSize({width:844,height:390});
 await mobilePage.setViewportSize({width:390,height:844});
 assert.equal(await mobilePage.locator('#njhRotate').evaluate(el=>getComputedStyle(el).display),
  'none','dismissal must survive orientation changes in the same session');
 await mobileContext.close();
 await browser.close();
 console.log('MAINKAN_NATIVE_SEMESTA_BROWSER_PASS');
})().catch(e=>{console.error('MAINKAN_NATIVE_SEMESTA_BROWSER_FAIL',e.stack||e);process.exit(1)});

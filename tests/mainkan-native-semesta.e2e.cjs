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
 // Guest/NJH-only flow may skip the one-time tutorial entirely.
 // If it is shown, finish it normally; otherwise require visible gameplay.
 if(await page.locator('#tutorialScreen').isVisible())
  await page.locator('#tutorialDone').click({timeout:3000}).catch(()=>{});
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
 const actionBridge=await page.evaluate(()=>{
  const source=document.getElementById('semestaFrame').contentWindow.document.getElementById('ptActionBtn');
  window.__mainkanActionEvents=[];
  ['pointerdown','pointerup','click'].forEach(type=>source.addEventListener(type,()=>window.__mainkanActionEvents.push(type)));
  return !!source;
 });
 assert.equal(actionBridge,true);
 await page.locator('#gameAction').click();
 const events=await page.evaluate(()=>window.__mainkanActionEvents);
 assert.ok(events.includes('pointerdown')&&events.includes('pointerup')&&events.includes('click'),'Mainkan must bridge Action to native Jiwa input');
 await page.locator('#gamePhone').click();
 const phone=await page.evaluate(()=>document.getElementById('semestaFrame').contentWindow.VLNokiaPlay?.isOpen?.()||false);
 assert.equal(phone,true,'Mainkan Phone button must open native Semesta Nokia');
 assert.equal(after,before,'Player entry must not overwrite the authoring working city');
 assert.ok(!errors.some(e=>/SyntaxError|ReferenceError/i.test(e)),errors.slice(0,4).join(' | '));
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/mainkan-native-semesta.png',fullPage:true});
 await browser.close();
 console.log('MAINKAN_NATIVE_SEMESTA_BROWSER_PASS');
})().catch(e=>{console.error('MAINKAN_NATIVE_SEMESTA_BROWSER_FAIL',e.stack||e);process.exit(1)});

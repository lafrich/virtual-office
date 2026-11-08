'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.UI_EDITOR_URL||'http://127.0.0.1:8091/virtual-office/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',
  args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const context=await browser.newContext({viewport:{width:1530,height:960}});
 const jiwa=await context.newPage(),semesta=await context.newPage(),errors=[];
 for(const [name,page] of [['jiwa',jiwa],['semesta',semesta]])
  page.on('pageerror',e=>errors.push(name+': '+String(e.stack||e)));
 await jiwa.goto(base+'jiwa/?cloudLegacy=1',{waitUntil:'domcontentloaded',timeout:90000});
 await semesta.goto(base+'world-builder/?cloudLegacy=1',{waitUntil:'domcontentloaded',timeout:90000});
 await jiwa.waitForFunction(()=>!!window.JiwaActivityEditor&&!!window.JiwaActivities&&
  document.querySelectorAll('#activityList .activity-row').length>0,null,{timeout:90000});
 await semesta.waitForFunction(()=>!!window.SemestaPlay&&!!window.SemestaLifePlay,null,{timeout:90000});
 assert.equal(await jiwa.locator('[data-activity-tab]').count(),8);
 for(const category of ['energy','moral','immoral','exp','cooking','buying','punishment','money']){
  await jiwa.locator('[data-activity-tab="'+category+'"]').click();
  assert.ok((await jiwa.locator('#activityList .activity-row').count())>0);
 }
 const target=await semesta.evaluate(()=>{
  // Full metadata must match the actual runtime geometry, not a stripped
  // {id,type,asset} preview that can misclassify named Semesta entities.
  const all=window.SemestaPlay.worldDirectory();
  const match=all.find(o=>String(o.id||'').length>3&&String(o.id||'').length<80&&
   window.JiwaActivities.kindOf(o)==='object');
  return match||null;
 });
 assert.ok(target,'Semesta must have an actual object to mark in Entities');
 // Use the Semesta current working-copy ID as a saved draft, so Jiwa reads
 // the same physical object and game play matches the same city ID.
 const cityId='__semesta_working_copy__';
 await jiwa.evaluate(async({target,cityId})=>{
  await window.VLCityDrafts.save({id:cityId,name:'JIWA DIRECTORY E2E',
   document:{objects:[target],map:{}}});
 },{target,cityId});
 await jiwa.locator('#refresh').click();
 await jiwa.locator('#cityPicker').selectOption(cityId);
 await jiwa.waitForFunction(()=>window.JiwaContextBridge.city()?.id==='__semesta_working_copy__');
 // Initially, a placed object is NOT selectable in activities until
 // specifically marked in the Entities tab.
 await jiwa.locator('#activityList .activity-row').first().click();
 await jiwa.locator('#presetKeep').click();
 assert.equal(await jiwa.locator('#activityObject option').count(),1);
 await jiwa.locator('#activityOpenEntities').click();
 await jiwa.locator('[data-entity-kind="object"]').click();
 assert.equal(await jiwa.locator('#entityEditor .premise-tier').count(),3);
 await jiwa.locator('#worldKeep').click();
 assert.equal(await jiwa.locator('#worldOperation').inputValue(),'ambient');
 await jiwa.locator('#worldDirectoryRefresh').click();
 await jiwa.locator('#worldDirectorySearch').fill(target.id);
 await jiwa.locator('#worldDirectoryList input[type="checkbox"]').first().check();
 await jiwa.locator('#entitySave').click();
 const worldSaved=await jiwa.evaluate(()=>{
  const all=window.JiwaActivities.readLocal(localStorage);
  return all.worldEntities.find(r=>r.id==='wall_pee');
 });
 assert.equal(worldSaved.enabled,true);
 assert.equal(worldSaved.selectionMode,'directory');
 assert.ok(worldSaved.targets.some(x=>x.cityId===cityId&&x.objectId===target.id));
 await jiwa.locator('[data-activity-tab="money"]').click();
 await jiwa.locator('#activityList .activity-row').first().click();
 await jiwa.locator('#presetKeep').click();
 await jiwa.locator('#activityTargetKind').selectOption('object');
 await jiwa.locator('#activityObject').selectOption(target.id);
 await jiwa.locator('[data-activity-field="minExp"]').fill('0');
 await jiwa.locator('[data-activity-field="minExp"]').dispatchEvent('change');
 await jiwa.locator('[data-activity-field="moneyDelta"]').fill('7200');
 await jiwa.locator('[data-activity-field="moneyDelta"]').dispatchEvent('change');
 await jiwa.locator('#activityEnabled').check();
 await jiwa.locator('#activitySave').click();
 const saved=await jiwa.evaluate(()=>{
  const data=window.JiwaActivities.readLocal(localStorage);
  return {bank:data.activities.find(a=>a.id==='bank_teller'),
   registered:window.JiwaActivities.eligibleTargets(window.JiwaContextBridge.directoryEntities(),
    data.worldEntities,window.JiwaContextBridge.city().id)};
 });
 assert.equal(saved.bank.enabled,true);
 assert.equal(saved.bank.objectId,target.id);
 assert.equal(saved.bank.minExp,0);
 assert.equal(saved.bank.moneyDelta,7200);
 assert.equal(saved.registered.length,1);
 await semesta.waitForLoadState('load',{timeout:60000}).catch(()=>{});
 await semesta.evaluate(()=>window.VLQuickTutorial?.close?.());
 await semesta.locator('#walkMode').click({timeout:20000});
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.active?.(),null,{timeout:20000});
 await semesta.evaluate(()=>window.SemestaLifePlay.reload());
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.sites?.().some(s=>s.id==='act:bank_teller'),
  null,{timeout:30000}).catch(async error=>{
   const diagnostic=await semesta.evaluate(id=>{
    const catalog=window.JiwaActivities.readLocal(localStorage);
    const world=window.SemestaPlay.worldDirectory();
    const selection=catalog.activities.find(x=>x.id==='bank_teller');
    const rules=catalog.worldEntities;
    return {worldMatches:world.filter(o=>o.id===id),
     activity:selection,activeRules:rules.filter(r=>r.enabled),
     targetKind:window.JiwaActivities.kindOf(world.find(o=>o.id===id)),
     available:window.JiwaActivities.eligibleTargets(world,rules,'__semesta_working_copy__').map(x=>x.id),
     sites:window.SemestaLifePlay.sites().filter(x=>x.activityId||x.worldRuleId)};
   },target.id);
   throw Error(error.message+' / diagnostic: '+JSON.stringify(diagnostic).slice(0,3000));
  });
 const linked=await semesta.evaluate(()=>{
  const sites=window.SemestaLifePlay.sites();
  const a=sites.find(s=>s.id==='act:bank_teller');
  const ambient=sites.find(s=>s.id.startsWith('world:wall_pee:'));
  const map=window.VLPhoneEllen.gameSnapshot()?.map?.sites||[];
  return {a,ambient,mapActivity:map.some(s=>s.id==='act:bank_teller'),
   demoSites:sites.filter(s=>['job_silver','job_pak_ogah','warung','public_wc','tent','kost'].includes(s.id)).map(s=>s.id),
   ambientOnMap:map.some(s=>s.id.startsWith('world:wall_pee:'))};
 });
 assert.equal(linked.a.sourceId,target.id);
 assert.equal(linked.a.placeholder,false);
 assert.ok(linked.mapActivity,'marked activity appears on Nokia map');
 assert.ok(linked.ambient,'marked ambient asset appears as own interaction site');
 assert.equal(linked.ambient.sourceId,target.id);
 assert.equal(linked.ambientOnMap,false,'ambient actions do not become quest pins');
 // The same real object has a Money activity and an Immoral ambient action.
 // Both actions must appear at one physical location and be selectable.
 await semesta.locator('#slpContent details summary').first().click();
 await semesta.locator('#slpDestination').selectOption('act:bank_teller');
 await semesta.locator('#slpTravel').click();
 const siblings=await semesta.locator('#slpActions [data-life-action]').evaluateAll(buttons=>
  buttons.map(button=>button.dataset.lifeAction));
 assert.ok(siblings.includes('configured_activity'),siblings.join(','));
 assert.ok(siblings.includes('world_ambient'),siblings.join(','));
 const ambientResult=await semesta.evaluate(()=>window.SemestaLifePlay.runAction('world_ambient',{ruleId:'wall_pee'}));
 assert.equal(ambientResult.ok,true,ambientResult.reason);
 assert.deepEqual(linked.demoSites,[],'Published Jiwa authoring cannot coexist with legacy placeholder and job sites');
 await jiwa.locator('[data-activity-tab="cooking"]').click();
 const cooking=await jiwa.evaluate(()=>window.JiwaActivityEditor.get().activities.find(a=>a.id==='nasi_goreng'));
 assert.deepEqual(cooking.ingredients,['nasi','telur','minyak']);
 assert.equal(cooking.grantType,'inventory');
 assert.equal(await jiwa.locator('#activityDrivePush').count(),1);
 assert.equal(await jiwa.locator('#activityDrivePull').count(),1);
 assert.deepEqual(errors.filter(e=>/SyntaxError|ReferenceError|TypeError/i.test(e)),[],
  'Browser JS errors: '+errors.join(' | ').slice(0,900));
 console.log('JIWA_DIRECTORY_BROWSER_PASS',JSON.stringify({target:target.id,cityId,
  linked:linked.a.id,ambient:linked.ambient.id,errors}));
 await browser.close();
})().catch(e=>{console.error('JIWA_DIRECTORY_BROWSER_FAIL',e.stack||e);process.exit(1)});

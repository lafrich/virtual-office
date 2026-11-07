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
 await jiwa.goto(base+'jiwa/',{waitUntil:'domcontentloaded',timeout:90000});
 await semesta.goto(base+'world-builder/',{waitUntil:'domcontentloaded',timeout:90000});
 await jiwa.waitForFunction(()=>!!window.JiwaActivityEditor&&!!window.JiwaActivities&&
  document.querySelectorAll('#activityList .activity-row').length>0,null,{timeout:90000});
 await semesta.waitForFunction(()=>!!window.SemestaPlay&&!!window.SemestaLifePlay,null,{timeout:90000});
 const first=await jiwa.evaluate(()=>({
  tab:document.querySelector('.window')?.dataset.jiwaTab,
  categoryButtons:document.querySelectorAll('[data-activity-tab]').length,
  count:document.querySelectorAll('#activityList .activity-row').length,
  bank:window.JiwaActivities.readLocal(localStorage).activities.find(a=>a.id==='bank_teller')
 }));
 assert.equal(first.tab,'activities');
 assert.equal(first.categoryButtons,8);
 assert.ok(first.count>=3);
 assert.equal(first.bank.enabled,false,'Starter activities must be drafts');
 for(const category of ['energy','moral','immoral','exp','cooking','buying','punishment','money']){
  await jiwa.locator('[data-activity-tab="'+category+'"]').click();
  assert.ok((await jiwa.locator('#activityList .activity-row').count())>0,category+' must have starter activities');
 }
 const target=await semesta.evaluate(()=>{
  const all=window.SemestaPlay.playObjects();
  const match=all.find(x=>String(x.id||'').length>3&&String(x.id||'').length<80&&
   x.type!=='avatar');
  return match?{id:match.id,type:match.type,asset:match.asset}:null;
 });
 assert.ok(target,'Semesta must contain at least one placeable map object');
 await jiwa.locator('#activityList .activity-row').first().click();
 assert.equal(await jiwa.locator('#activityHeading').textContent().then(x=>x.includes('Money')),true);
 assert.equal(await jiwa.locator('.premise-tier').count(),3,'Tier choices precede activity detail');
 await jiwa.locator('#presetKeep').click();
 // A global editor can have no city loaded. Simulate a city object becoming
 // available in its binding dropdown without changing gameplay rules.
 await jiwa.locator('#activityObject').evaluate((el,id)=>{
  if(![...el.options].some(o=>o.value===id))el.add(new Option(id,id));
 },target.id);
 await jiwa.locator('#activityObject').selectOption(target.id);
 await jiwa.locator('[data-activity-field="minExp"]').fill('0');
 await jiwa.locator('[data-activity-field="minExp"]').dispatchEvent('change');
 await jiwa.locator('[data-activity-field="moneyDelta"]').fill('7200');
 await jiwa.locator('[data-activity-field="moneyDelta"]').dispatchEvent('change');
 await jiwa.locator('#activityEnabled').check();
 await jiwa.locator('#activitySave').click();
 const saved=await jiwa.evaluate(()=>{
  const d=window.JiwaActivities.readLocal(localStorage);
  return {count:d.activities.length,bank:d.activities.find(a=>a.id==='bank_teller'),
   key:!!localStorage.getItem(window.JiwaActivities.KEY)};
 });
 assert.equal(saved.key,true);
 assert.equal(saved.bank.enabled,true);
 assert.equal(saved.bank.minExp,0);
 assert.equal(saved.bank.moneyDelta,7200);
 await semesta.waitForLoadState('load',{timeout:60000}).catch(()=>{});
 await semesta.evaluate(()=>window.VLQuickTutorial?.close?.());
 await semesta.locator('#walkMode').click({timeout:20000});
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.active?.(),null,{timeout:20000});
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.sites?.().some(s=>s.id==='act:bank_teller'),
  null,{timeout:30000});
 const linked=await semesta.evaluate(()=>{
  const a=window.SemestaLifePlay.sites().find(s=>s.id==='act:bank_teller');
  const config=window.JiwaActivities.readLocal(localStorage);
  const world=window.SemestaPlay.playObjects().find(x=>x.id===a.sourceId);
  const provider=window.VLPhoneEllen.gameSnapshot();
  return {a,world,active:config.activities.find(x=>x.id==='bank_teller').enabled,
   mapQuest:provider?.map?.sites?.find(s=>s.id==='act:bank_teller')};
 });
 assert.ok(linked.world,'Must be linked to a real Semesta object');
 assert.equal(linked.a.placeholder,false);
 assert.equal(linked.a.activityId,'bank_teller');
 assert.ok(linked.mapQuest,'New activity must appear on live Nokia quest map');
 // Entity rules use the SAME tier wizard and can bind an actual Semesta object.
 await jiwa.locator('#entityTab').click();
 await jiwa.locator('[data-entity-kind="object"]').click();
 assert.equal(await jiwa.locator('.premise-tier').count(),3,'Object actions also use tier indicators');
 await jiwa.locator('#worldKeep').click();
 assert.equal(await jiwa.locator('#worldOperation').inputValue(),'ambient');
 await jiwa.locator('#worldMatchMode').selectOption('id');
 await jiwa.locator('#worldQuery').evaluate((el,id)=>{
  if(![...el.options].some(o=>o.value===id))el.add(new Option(id,id));
 },target.id);
 await jiwa.locator('#worldQuery').selectOption(target.id);
 await jiwa.locator('#worldEnabled').check();
 await jiwa.locator('#entitySave').click();
 const worldSaved=await jiwa.evaluate(()=>{
  const a=window.JiwaActivities.readLocal(localStorage);
  return a.worldEntities.find(r=>r.id==='wall_pee');
 });
 assert.equal(worldSaved.enabled,true,'Nonquest object rule must be saved');
 assert.equal(worldSaved.query,target.id);
 await semesta.waitForFunction(()=>window.SemestaLifePlay?.sites?.().some(s=>s.id==='world:wall_pee'),null,{timeout:30000});
 const ambient=await semesta.evaluate(()=>{
  const site=window.SemestaLifePlay.sites().find(x=>x.id==='world:wall_pee');
  const map=window.VLPhoneEllen.gameSnapshot()?.map?.sites||[];
  return {site,onNokia:map.some(x=>x.id==='world:wall_pee')};
 });
 assert.equal(ambient.site.placeholder,false);
 assert.equal(ambient.onNokia,false,'Ambient object actions must not appear as Nokia quests');
 await jiwa.locator('[data-activity-tab="cooking"]').click();
 const cooking=await jiwa.evaluate(()=>window.JiwaActivityEditor.get().activities.find(a=>a.id==='nasi_goreng'));
 assert.deepEqual(cooking.ingredients,['nasi','telur','minyak']);
 assert.equal(cooking.grantType,'inventory');
 assert.equal(await jiwa.locator('#activityDriveConnect').count(),1);
 assert.equal(await jiwa.locator('#activityDrivePush').count(),1);
 assert.equal(await jiwa.locator('#activityDrivePull').count(),1);
 assert.equal(errors.filter(e=>/SyntaxError|ReferenceError|TypeError/i.test(e)).length,0,
  'Browser JS error: '+errors.join(' | ').slice(0,900));
 console.log('JIWA_ACTIVITY_BROWSER_PASS',JSON.stringify({first:{tab:first.tab,categories:first.categoryButtons,items:first.count},
  saved:{id:saved.bank.id,money:saved.bank.moneyDelta,exp:saved.bank.minExp},
  linked:{site:linked.a.id,sourceId:linked.a.sourceId,icon:linked.mapQuest?.icon},errors}));
 await browser.close();
})().catch(e=>{console.error('JIWA_ACTIVITY_BROWSER_FAIL',e.stack||e);process.exit(1)});

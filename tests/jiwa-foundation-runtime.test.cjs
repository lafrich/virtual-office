'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../jiwa/foundation-engine.js');
const foundation=()=>F.defaultFoundation();
const fresh=()=>F.newTestState({wallet:6000,energy:80,fullness:70,hygiene:75,bladder:20,time:'08:00'},foundation());
const fire=(f,id,state,over={})=>F.execute(f,id,state,Object.assign({
 eventId:'e_'+id,verified:true,progressComplete:true,confirmed:true,witnessed:true,
 recipient:true,itemId:'botol',spawnId:'spot_a',jobInstanceId:'job_a',
 verifiedPrice:1200,roll:0.1,crossingId:'crossing_a',referralKey:'npc_demo'
},over));

test('presets include every core life-system without changing 8-slot bag',()=>{
 const f=foundation();
 for(const id of ['crossing','public_rest','eat','water','toilet','shower','sleep','basic_job',
  'scavenge','loak_sell','online_course','home_enter','home_spawn','hobo_spawn',
  'help_npc','charity','worship','theft','referral'])
  assert.ok(f.contexts.find(c=>c.id===id),id);
 assert.equal(f.settings.bagSlots,8);
 assert.equal(f.settings.dailyWageCap,6000);
 assert.equal(f.settings.dailyCourseXpCap,150);
 assert.equal(f.settings.socialEnabled,false);
});
test('crossing charge is once per event ID and not tied to movement frames',()=>{
 const f=foundation(),s=fresh(),r=fire(f,'crossing',s,{eventId:'cross_1'});
 assert.equal(r.ok,true);assert.equal(r.state.energy,78);
 const duplicate=fire(f,'crossing',r.state,{eventId:'cross_1'});
 assert.equal(duplicate.ok,false);assert.equal(duplicate.state.energy,78);
 const duplicateCrossing=fire(f,'crossing',r.state,{eventId:'crossing-new-event',crossingId:'crossing_a'});
 assert.equal(duplicateCrossing.ok,false);
});
test('zero money and zero energy player can recover',()=>{
 const s=fresh();s.wallet=0;s.energy=0;
 const r=fire(foundation(),'public_rest',s);
 assert.equal(r.ok,true);assert.equal(r.state.energy,15);
});
test('cannot get a free meal or create partial charged purchases',()=>{
 const s=fresh();s.wallet=0;
 const r=fire(foundation(),'eat',s);
 assert.equal(r.ok,false);assert.equal(r.state.fullness,s.fullness);assert.equal(r.state.wallet,0);
});
test('job requires verified progress and unique job instance, capped per day',()=>{
 const f=foundation(),s=fresh();
 assert.equal(fire(f,'basic_job',s,{progressComplete:false}).ok,false);
 let r=fire(f,'basic_job',s);
 assert.equal(r.ok,true);assert.equal(r.state.wallet,9000);
 assert.equal(fire(f,'basic_job',r.state,{eventId:'again',jobInstanceId:'job_a'}).ok,false);
 r=fire(f,'basic_job',r.state,{eventId:'next_job',jobInstanceId:'job_b'});
 assert.equal(r.ok,true);assert.equal(r.state.dailyWages,6000);
 assert.equal(fire(f,'basic_job',r.state,{eventId:'third_job',jobInstanceId:'job_c'}).ok,false);
 const tomorrow=F.nextDay(r.state);
 assert.equal(tomorrow.dailyWages,0);assert.equal(tomorrow.wallet,r.state.wallet);
 assert.equal(tomorrow.gameDay,2);
});
test('scavenging cannot bypass 8 slots and duplicate spawn claims',()=>{
 const f=foundation(),s=fresh(),loot=fire(f,'scavenge',s);
 assert.equal(loot.ok,true);assert.deepEqual(loot.state.inventory,['botol']);
 assert.equal(fire(f,'scavenge',loot.state,{eventId:'second',spawnId:'spot_a'}).ok,false);
 const full=fresh();full.inventory=Array.from({length:8},(_,i)=>'item_'+i);
 assert.equal(fire(f,'scavenge',full).ok,false);
});
test('loak sale needs real inventory and verified quote',()=>{
 const f=foundation(),s=fresh();
 assert.equal(fire(f,'loak_sell',s).ok,false);
 const loot=fire(f,'scavenge',s);
 const missingQuote=fire(f,'loak_sell',loot.state,{verifiedPrice:undefined});
 assert.equal(missingQuote.ok,false);assert.equal(missingQuote.state.inventory.length,1);
 const sold=fire(f,'loak_sell',loot.state,{eventId:'sale_1'});
 assert.equal(sold.ok,true);assert.equal(sold.state.wallet,7200);
 assert.equal(sold.state.inventory.length,0);
 assert.equal(fire(f,'loak_sell',sold.state,{eventId:'sale_2'}).ok,false);
});
test('housing access and homeless spawn are mutually exclusive',()=>{
 const f=foundation(),s=fresh();
 assert.equal(fire(f,'home_enter',s).ok,false);
 assert.equal(fire(f,'hobo_spawn',s).state.spawn,'hobo');
 s.homeAccess=true;
 assert.equal(fire(f,'home_enter',s).ok,true);
 assert.equal(fire(f,'home_spawn',s).state.spawn,'home');
 assert.equal(fire(f,'hobo_spawn',s).ok,false);
});
test('moral, spirituality, reputation, witnesses and charity remain distinct',()=>{
 const f=foundation(),s=fresh();
 const anonymous=fire(f,'charity',s,{witnessed:false,recipient:false});
 assert.equal(anonymous.ok,true);assert.equal(anonymous.state.wallet,5000);
 assert.equal(anonymous.state.moral,52);assert.equal(anonymous.state.reputation,50);
 const worship=fire(f,'worship',s);
 assert.equal(worship.state.spiritual,60);assert.equal(worship.state.moral,50);
 const secret=fire(f,'theft',s,{witnessed:false,recipient:false});
 assert.equal(secret.ok,true);assert.equal(secret.state.moral,42);
 assert.equal(secret.state.reputation,50);assert.equal(secret.state.memories.length,0);
});
test('referral is disabled until feature gate and skill/trust met',()=>{
 const f=foundation(),s=fresh();
 assert.equal(fire(f,'referral',s).ok,false);
 f.settings.socialEnabled=true;
 assert.equal(fire(f,'referral',s).ok,false);
 s.skill=80;s.trust=80;
 const r=fire(f,'referral',s);
 assert.equal(r.ok,true);assert.ok(r.state.offers.includes('event_crew'));
 const spam=fire(f,'referral',r.state,{eventId:'referral_repeat',referralKey:'npc_demo'});
 assert.equal(spam.ok,false);
});
test('user-authored context survives save normalization; malicious fields are dropped',()=>{
 const f=foundation();
 f.contexts.push({id:'custom_example',label:'Example',group:'Social',trigger:'CUSTOM_EVENT',
  target:'npc',description:'test',enabled:true,objectId:'',
  conditions:[{kind:'verified',value:'true'},{kind:'unsupported_kind',value:'x'}],
  effects:[{kind:'message',value:'hello'},{kind:'execute_script',value:'evil'}]});
 f.settings.bagSlots=999;f.settings.dailyCourseXpCap=999;
 const clean=F.normalizeFoundation(JSON.parse(JSON.stringify(f)));
 const c=clean.contexts.find(x=>x.id==='custom_example');
 assert.ok(c);assert.equal(c.trigger,'CUSTOM_EVENT');
 assert.equal(c.conditions.length,1);assert.equal(c.effects.length,1);
 assert.equal(clean.settings.bagSlots,8);assert.equal(clean.settings.dailyCourseXpCap,150);
});

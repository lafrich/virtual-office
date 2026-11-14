'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const E=require('../jiwa/life-economy.js');
const builder=fs.readFileSync('world-builder/builder.js','utf8');
const html=fs.readFileSync('world-builder/index.html','utf8');
const play=fs.readFileSync('world-builder/semesta-life-play.js','utf8');
const c=()=>E.defaults();
const fresh=()=>E.stateFrom({wallet:6000,energy:80,hygiene:75,bladder:20,moral:50},c());

test('Semesta loads V1 life runtime before builder module and hooks Action/HUD/movement',()=>{
 const lifeScript=html.indexOf('../jiwa/life-economy.js');
 const playScript=html.indexOf('./semesta-life-play.js');
 const builderScript=html.indexOf('./builder.js');
 assert.ok(lifeScript>0&&playScript>lifeScript&&builderScript>playScript);
 assert.match(html,/id="walkMode".*EXPLORE \/ WALK TEST/);
 assert.match(builder,/if\(playerMode\)window\.SemestaLifePlay\?\.start\?\.\(\)/);
 assert.match(builder,/SemestaLifePlay\.attach\(/);
 assert.match(builder,/SemestaLifePlay\?\.start\?\.\(/);
 assert.match(builder,/SemestaLifePlay\?\.stop\?\.\(/);
 assert.match(builder,/SemestaLifePlay\?\.tick\?\.\(dt\)/);
 assert.match(builder,/SemestaLifePlay\?\.handleAction\?\.\(\)/);
 assert.match(builder,/SemestaLifePlay\.money\(\)/);
 assert.match(builder,/SemestaLifePlay\.bag\(\)/);
 assert.match(builder,/life\.speedFactor\(\)/);
});
test('No assets? Placeholder actor and interaction markers exist only in test, never City Draft',()=>{
 assert.match(builder,/makeTemporaryLifePlayer\(\)/);
 assert.match(builder,/clearTemporaryLifePlayer\(\)/);
 assert.match(builder,/copy\.objects=copy\.objects\.filter\(o=>o\.id!=='__semesta_life_temporary_player__'\)/);
 assert.match(builder,/id:asNew\?null:activeDraftId,name,document:mapForPersist\(\)/);
 assert.doesNotMatch(play,/jiwa-play-temporary-interactions/); // activities only on Nokia map, not as floating 3D pins
 assert.match(play,/disposeMarkers\(\)/);
 assert.match(play,/fallbackSpawn\(\)/);
});
test('Jiwa data and persistent local play session keyed per saved city',()=>{
 assert.match(play,/jiwa-mechanics-v1/);
 assert.match(play,/semesta-life-play-v1:/);
 assert.match(play,/projectFromJiwa/);
 assert.match(play,/lifeEconomy/);
 assert.match(play,/localStorage\.setItem\(dataKey\(\)/);
 assert.match(play,/function cityId\(\)/);assert.match(play,/__working_copy__/);
});
test('Core flow: hobo edge spawn -> work and forage -> save -> buy room -> private needs -> home respawn',()=>{
 const conf=c();
 let player=fresh();
 let r=E.run(conf,player,'respawn',{roll:0,bounds:{minX:0,maxX:50,minZ:0,maxZ:50}});
 assert.ok(r.ok);assert.equal(r.state.spawn,'hobo');assert.match(r.state.spawnPosition.id,/hobo_tent/);
 player=r.state;
 const first=E.run(conf,player,'work');
 assert.ok(first.ok);assert.equal(first.state.wallet,8500);assert.equal(first.state.experience,7);
 const forage=E.run(conf,first.state,'scavenge');
 assert.ok(forage.ok);assert.equal(forage.state.inventory.length,1);
 const sold=E.run(conf,forage.state,'sell_loak',{itemId:forage.state.inventory[0]});
 assert.ok(sold.ok);assert.equal(sold.state.wallet,9500);
 const wealthy={...sold.state,wallet:1_000_000};
 const home=E.run(conf,wealthy,'buy_room',{roomSpawn:{id:'kost_unit',x:12,z:15,placeholder:true}});
 assert.ok(home.ok);assert.equal(home.state.homeAccess,true);
 assert.equal(E.run(conf,home.state,'buy_room').ok,false);
 const spawn=E.run(conf,home.state,'respawn',{roll:0});
 assert.ok(spawn.ok);assert.equal(spawn.state.spawn,'home');assert.equal(spawn.state.spawnPosition.id,'kost_unit');
 const bath=E.run(conf,spawn.state,'home_shower');
 assert.ok(bath.ok);assert.equal(bath.state.wallet,300000);assert.equal(bath.state.hygiene,100);
 const wc=E.run(conf,bath.state,'home_toilet');assert.ok(wc.ok);assert.equal(wc.state.bladder,0);
});
test('Fishing chances and buyer rules are executable, inventory proof prevents double-sale',()=>{
 const cfg=c(),s=fresh();
 const fishing=E.run(cfg,s,'fish',{spotId:'river',roll:.02});
 assert.ok(fishing.ok);const id=fishing.state.inventory[0];
 const refuse=E.run(cfg,fishing.state,'sell_fish',{itemId:id,buyerId:'pasar_ikan'});
 assert.equal(refuse.ok,false);assert.equal(refuse.state.wallet,fishing.state.wallet);
 const sell=E.run(cfg,fishing.state,'sell_fish',{itemId:id,buyerId:'siomay_batagor'});
 assert.equal(sell.ok,true);assert.equal(sell.state.wallet,s.wallet+450);
 assert.equal(E.run(cfg,sell.state,'sell_fish',{itemId:id,buyerId:'siomay_batagor'}).ok,false);
});
test('Faintness, public baths, charity, witnessed hansip, and release grace are simulated',()=>{
 const cfg=c(),p=fresh();p.energy=1;p.bladder=100;
 const exhausted=E.run(cfg,p,'walk',{units:1});
 assert.ok(exhausted.ok);assert.ok(exhausted.state.restMinutes>0);assert.equal(E.speedFactor(exhausted.state),0);
 const camp=E.run(cfg,fresh(),'public_shower',{facilityId:'wc_umum'});
 assert.ok(camp.ok);assert.equal(camp.state.wallet,5500);
 assert.equal(camp.state.hygiene,100);
 const bad=fresh();bad.moral=10;
 assert.equal(E.run(cfg,bad,'arrest',{witnessed:false}).ok,false);
 const caught=E.run(cfg,bad,'arrest',{witnessed:true});assert.ok(caught.ok);
 const done=E.run(cfg,caught.state,'community_service');assert.ok(done.ok);
 assert.equal(done.state.detained,false);assert.ok(done.state.arrestGraceMinutes>0);
 assert.equal(E.run(cfg,done.state,'arrest',{witnessed:true}).ok,false);
});
test('V2 gates stay locked while premium job needs hygiene threshold',()=>{
 const cfg=c();assert.equal(cfg.gates.socialV2,false);assert.equal(cfg.gates.satanicEvilRouteV2,false);
 const poor=fresh();poor.hygiene=20;
 assert.equal(E.run(cfg,poor,'work',{premium:true}).ok,false);
 const bath=E.run(cfg,poor,'public_shower',{facilityId:'wc_umum'});
 assert.ok(bath.ok);assert.ok(bath.state.hygiene>poor.hygiene);
 assert.equal(E.run(cfg,{...bath.state,hygiene:75},'work',{premium:true}).ok,true);
});

test('Passive survival makes time consequential even when player stands still',()=>{
 const cfg=c(),p=fresh();
 const after=E.run(cfg,p,'advance_time',{minutes:60});
 assert.ok(after.ok);
 assert.ok(after.state.energy<p.energy);
 assert.ok(after.state.bladder>p.bladder);
 assert.ok(after.state.fullness<p.fullness);
 assert.equal(E.run(cfg,p,'rest').ok,false); // no free energy button anywhere
});
test('Fainting blocks player movement until bed rest finishes, then restores energy',()=>{
 const cfg=c(),s={...fresh(),energy:1};
 const faint=E.run(cfg,s,'walk',{units:1});
 assert.ok(faint.ok);assert.equal(faint.state.restMinutes,cfg.settings.faintRestMinutes);
 assert.equal(E.speedFactor(faint.state),0);
 assert.equal(E.run(cfg,faint.state,'work').ok,false);
 const recovered=E.run(cfg,faint.state,'advance_time',{minutes:cfg.settings.faintRestMinutes});
 assert.ok(recovered.ok);assert.equal(recovered.state.restMinutes,0);
 assert.ok(recovered.state.energy>=cfg.settings.faintRecoveryEnergy);
 assert.ok(E.speedFactor(recovered.state)>0);
});
test('Kost provides item storage; hobo cannot use it and room inventory survives in-home transfer',()=>{
 const cfg=c(),initial=fresh();
 const loot=E.run(cfg,initial,'scavenge');assert.ok(loot.ok);
 const id=loot.state.inventory[0];assert.equal(E.run(cfg,loot.state,'store_home',{itemId:id}).ok,false);
 const owned=E.run(cfg,{...loot.state,wallet:1_000_000},'buy_room',{roomSpawn:{id:'kost',x:2,z:3}});
 assert.ok(owned.ok);
 const stored=E.run(cfg,owned.state,'store_home',{itemId:id});
 assert.ok(stored.ok);assert.equal(stored.state.homeStorage.length,1);assert.equal(stored.state.inventory.length,0);
 const taken=E.run(cfg,stored.state,'take_home',{itemId:id});
 assert.ok(taken.ok);assert.equal(taken.state.inventory[0],id);
});
test('Fruit can be eaten, goes bad in the bag, can be refrigerated with electric tokens',()=>{
 const cfg=c(),s={...fresh(),wallet:3_000_000};
 const picked=E.run(cfg,s,'catch_fruit');
 assert.ok(picked.ok);const id=picked.state.inventory[0];
 const edible=E.run(cfg,picked.state,'eat_item',{itemId:id});assert.ok(edible.ok);
 assert.equal(edible.state.inventory.length,0);
 const stale=E.run(cfg,picked.state,'advance_time',{minutes:130});
 assert.ok(stale.ok);
 assert.equal(E.run(cfg,stale.state,'eat_item',{itemId:id}).ok,false);
 const disposed=E.run(cfg,stale.state,'discard_item',{itemId:id});
 assert.ok(disposed.ok);assert.equal(disposed.state.inventory.length,0);
 const room=E.run(cfg,picked.state,'buy_room');
 const fridge=E.run(cfg,room.state,'buy_fridge');
 const token=E.run(cfg,fridge.state,'buy_token');
 const stored=E.run(cfg,token.state,'store_fridge',{itemId:id});assert.ok(stored.ok);
 const chilled=E.run(cfg,stored.state,'advance_time',{minutes:60});
 assert.ok(chilled.ok);assert.ok(chilled.state.itemMeta[id].expiresAt>stored.state.itemMeta[id].expiresAt);
 assert.ok(chilled.state.powerTokens<stored.state.powerTokens);
});
test('Faith changes only worship access, not baseline morality; atheist can help neighbors',()=>{
 const cfg=c();cfg.identity.religion='islam';
 const p=fresh();
 assert.equal(E.run(cfg,p,'worship',{placeReligion:'kristen'}).ok,false);
 assert.equal(E.run(cfg,p,'worship',{placeReligion:'islam'}).ok,true);
 const atheist={...p,identity:{religion:'ateis',zodiac:'gemini'},identityChosen:true};
 assert.equal(E.run(cfg,atheist,'worship',{placeReligion:'islam'}).ok,false);
 const help=E.run(cfg,atheist,'help');
 assert.ok(help.ok);assert.ok(help.state.moral>atheist.moral);
 assert.equal(help.state.identity.religion,'ateis');
 assert.equal(cfg.gates.satanicEvilRouteV2,false);
});
test('Play mode exposes real survival controls and no always-free rest',()=>{
 assert.match(play,/function openPhone\(\)/);
 assert.match(play,/function openBag\(\)/);
 assert.match(play,/function afterLifeTransition\(previous\)/);
 assert.match(play,/function tick\(dt\)/);
 assert.match(play,/const result=RULES\.run\(config,state,'advance_time'/);
 assert.match(play,/case|prayer_islam_b/);
 assert.match(builder,/onActionDown:ev/);
 assert.match(builder,/onPhone:\(\)=>/);
 assert.match(builder,/onBag:\(\)=>/);
});

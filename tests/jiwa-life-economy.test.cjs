'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../jiwa/life-economy.js');
const base=()=>E.stateFrom({wallet:12000,energy:100,inventory:[],moral:50},E.defaults());
test('sapu-sapu is most common; configured weights remain editable',()=>{
 const c=E.defaults();assert.ok(c.fish[0].weight>Math.max(...c.fish.slice(1).map(f=>f.weight)));
 assert.equal(E.weighted(c,0.01).id,'sapu_sapu');assert.equal(E.weighted(c,0.99).id,'mujair');
 c.fish[0].weight=0;assert.notEqual(E.weighted(c,0.01).id,'sapu_sapu');
});
test('sapu-sapu accepted at siomay, refused at fish market; no money/item dupes',()=>{
 const c=E.defaults(),caught=E.run(c,base(),'fish',{spotId:'river',roll:0.05});
 assert.equal(caught.ok,true);assert.equal(caught.state.inventory.length,1);
 const fishId=caught.state.inventory[0],money=caught.state.wallet;
 const bad=E.run(c,caught.state,'sell_fish',{itemId:fishId,buyerId:'pasar_ikan'});
 assert.equal(bad.ok,false);assert.equal(bad.state.wallet,money);assert.equal(bad.state.inventory.length,1);
 const sold=E.run(c,caught.state,'sell_fish',{itemId:fishId,buyerId:'siomay_batagor'});
 assert.equal(sold.ok,true);assert.equal(sold.state.wallet,money+450);
 assert.equal(sold.state.inventory.length,0);
 assert.equal(E.run(c,sold.state,'sell_fish',{itemId:fishId,buyerId:'siomay_batagor'}).ok,false);
});
test('normal fish accepted by both buyers',()=>{
 const c=E.defaults();
 for(const buyerId of Object.keys(E.BUYERS)){
  const caught=E.run(c,base(),'fish',{spotId:'river',roll:.65});
  assert.equal(caught.ok,true);assert.equal(caught.state.itemMeta[caught.state.inventory[0]].species,'lele');
  const sold=E.run(c,caught.state,'sell_fish',{itemId:caught.state.inventory[0],buyerId});
  assert.equal(sold.ok,true);assert.ok(sold.state.wallet>caught.state.wallet);
 }
});
test('bag capacity, fishing energy, spoilage and fridge electric token gates',()=>{
 const c=E.defaults(),b=base();b.inventory=Array.from({length:8},(_,i)=>'junk:'+i);
 assert.equal(E.run(c,b,'fish',{spotId:'river'}).ok,false);
 const poor=base();poor.energy=3;assert.equal(E.run(c,poor,'fish',{spotId:'river'}).ok,false);
 const caught=E.run(c,base(),'fish',{spotId:'river',roll:0.1});
 const stale=E.run(c,caught.state,'advance_time',{minutes:181});
 assert.equal(E.run(c,stale.state,'sell_fish',{itemId:stale.state.inventory[0],buyerId:'siomay_batagor'}).ok,false);
 const owner=base();owner.housing={room:true,fridge:true};
 const one=E.run(c,owner,'fish',{spotId:'river',roll:.1});
 assert.equal(E.run(c,one.state,'store_fridge',{itemId:one.state.inventory[0]}).ok,false);
 const powered=E.run(c,one.state,'buy_token');
 assert.equal(powered.ok,true);
 assert.equal(E.run(c,powered.state,'store_fridge',{itemId:powered.state.inventory[0]}).ok,true);
});
test('V2 routes locked; atheist worship denied while good deeds still increase moral',()=>{
 const c=E.defaults();c.identity.religion='ateis';c.gates={socialV2:true,satanicEvilRouteV2:true};
 const clean=E.normalize(c);assert.equal(clean.gates.socialV2,false);assert.equal(clean.gates.satanicEvilRouteV2,false);
 const current=base();
 assert.equal(E.run(clean,current,'worship',{placeReligion:'islam'}).ok,false);
 const helped=E.run(clean,current,'help');assert.equal(helped.ok,true);assert.equal(helped.state.moral,55);
 const blocked={...c,identity:{religion:'satanis'}};
 assert.notEqual(E.normalize(blocked).identity.religion,'satanis');
});
test('one-time room purchase, sleeping tradeoff and coffee bladder consequence',()=>{
 const s=base();s.wallet=40000;const c=E.defaults();
 const room=E.run(c,s,'buy_room');assert.equal(room.ok,true);
 assert.equal(E.run(c,room.state,'buy_room').ok,false);
 const coffee=E.run(c,room.state,'coffee');assert.ok(coffee.state.bladder>room.state.bladder);
 const sleep=E.run(c,coffee.state,'sleep');assert.ok(sleep.state.hygiene<coffee.state.hygiene);
});

test('hobo respawns at one of the peripheral tents and not a city center',()=>{
 const c=E.defaults(),s=base();
 const bounds={minX:0,maxX:100,minZ:0,maxZ:100};
 const west=E.run(c,s,'respawn',{bounds,roll:0.01});
 const east=E.run(c,s,'respawn',{bounds,roll:.3});
 assert.equal(west.ok,true);assert.equal(west.state.spawn,'hobo');
 assert.equal(west.state.spawnPosition.id,'hobo_tent_west');
 assert.equal(east.state.spawnPosition.id,'hobo_tent_east');
 assert.notDeepEqual(west.state.spawnPosition,east.state.spawnPosition);
 assert.equal(west.state.homeAccess,false);
 const explicit=E.run(c,s,'respawn',{tents:[{id:'tenda_pinggir',x:97,z:12}],bounds,roll:0.5});
 assert.equal(explicit.state.spawnPosition.id,'tenda_pinggir');
});
test('before kost: public shower, toilet, and lower-quality camp sleep; home facilities are locked',()=>{
 const c=E.defaults(),s=base();s.wallet=2000;s.energy=10;s.hygiene=10;s.bladder=90;
 assert.equal(E.run(c,s,'home_shower').ok,false);
 assert.equal(E.run(c,s,'home_toilet').ok,false);
 assert.equal(E.run(c,s,'public_shower').ok,false); // need location
 const bathing=E.run(c,s,'public_shower',{facilityId:'wc_umum_1'});
 assert.equal(bathing.ok,true);
 assert.equal(bathing.state.hygiene,45);assert.equal(bathing.state.wallet,1500);
 const wc=E.run(c,bathing.state,'public_toilet',{facilityId:'wc_umum_1'});
 assert.equal(wc.ok,true);
 assert.equal(wc.state.bladder,0);assert.equal(wc.state.hygiene,40);
 const rest=E.run(c,wc.state,'sleep');
 assert.equal(rest.ok,true);assert.equal(rest.state.energy,40);
 assert.equal(rest.state.hygiene,25);
});
test('one-time kost unlock gives private WC, better shower and owned-room respawn',()=>{
 const c=E.defaults(),s=base();s.wallet=50000;s.hygiene=10;s.bladder=90;s.energy=10;
 const room=E.run(c,s,'buy_room',{roomSpawn:{id:'kost_a',x:8,z:16}});
 assert.equal(room.ok,true);assert.equal(room.state.homeAccess,true);
 assert.equal(E.run(c,room.state,'buy_room').ok,false);
 const bathing=E.run(c,room.state,'home_shower');
 assert.equal(bathing.ok,true);
 assert.equal(bathing.state.hygiene,80);assert.equal(bathing.state.wallet,20000);
 const wc=E.run(c,bathing.state,'home_toilet');
 assert.equal(wc.state.bladder,0);assert.equal(wc.state.hygiene,80);
 const rested=E.run(c,wc.state,'sleep');
 assert.equal(rested.state.energy,75);
 const spawn=E.run(c,rested.state,'respawn',{roll:0.99,bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20}});
 assert.equal(spawn.ok,true);assert.equal(spawn.state.spawn,'home');
 assert.equal(spawn.state.spawnPosition.id,'kost_a');assert.equal(spawn.state.spawnPosition.x,8);
});

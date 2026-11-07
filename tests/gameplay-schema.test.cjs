'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const G=require('../shared/gameplay-schema.js');

test('defaults keep GTA-style HUD, Nokia HP, separate 8-slot bag, controller movement',()=>{
 const g=G.defaultGameplay();
 assert.equal(g.schema,'virtual-life-gameplay-v1');
 assert.equal(g.hud.oneWindowAtATime,true);
 assert.equal(g.hud.windowClose,'x_only');
 assert.equal(g.hud.noMinimapOnHUD,true);
 assert.equal(g.modules.phone.kind,'nokia');
 assert.deepEqual(G.enabledPhoneApps(g),['map','courses','bank']);
 assert.equal(g.modules.bag.slots,8);
 assert.equal(g.modules.bag.separateFromPhone,true);
 assert.equal(g.modules.movement.controllerOnly,true);
 assert.equal(g.modules.energy.todo,true);
 assert.equal(g.modules.traffic.todo,true);
 assert.equal(g.modules.loak.todo,true);
 assert.equal(g.modules.trafficLights.enabled,true);
 assert.equal(g.modules.trafficLights.cycleSeconds,32);
 assert.ok(g.modules.hudLayout.phone.action.scale<1);
 assert.equal(g.modules.hudLayout.desktop.action.scale,1);
});

test('normalize clamps bag slots, course cap, speeds and drops unknown fields',()=>{
 const g=G.normalizeGameplay({
  extra:'nope',
  modules:{
   bag:{slots:99,separateFromPhone:false},
   courses:{dailyXpCap:900},
   movement:{walkSpeed:9,runSpeed:0.2,controllerOnly:false},
   phone:{apps:{map:false,jobs:true}},
   energy:{enabled:true,lowEnergySlowFactor:4},
   loak:{enabled:true,sellPercent:0}
  }
 });
 assert.equal(g.modules.bag.slots,16);
 assert.equal(g.modules.bag.separateFromPhone,true);
 assert.equal(g.modules.courses.dailyXpCap,150);
 assert.equal(g.modules.movement.walkSpeed,4);
 assert.ok(g.modules.movement.runSpeed>=g.modules.movement.walkSpeed);
 assert.equal(g.modules.movement.controllerOnly,false);
 assert.equal(g.modules.phone.apps.map,false);
 assert.equal(g.modules.phone.apps.jobs,true);
 assert.equal(g.modules.phone.apps.courses,true);
 assert.equal(g.extra,undefined);
 assert.equal(g.modules.energy.lowEnergySlowFactor,1);
 assert.equal(g.modules.loak.sellPercent,1);
 assert.equal(G.normalizeGameplay({modules:{trafficLights:{cycleSeconds:8}}}).modules.trafficLights.cycleSeconds,12);
 assert.equal(G.normalizeGameplay({modules:{trafficLights:{enabled:false}}}).modules.trafficLights.enabled,false);
 assert.equal(G.normalizeGameplay({modules:{hudLayout:{phone:{run:{scale:8}}}}}).modules.hudLayout.phone.run.scale,1.5);
});

test('walkSpeedAt slows when energy preview is enabled',()=>{
 const g=G.normalizeGameplay({modules:{energy:{enabled:true},movement:{walkSpeed:2,runSpeed:3}}});
 assert.equal(G.walkSpeedAt(g,false,80),2);
 assert.ok(G.walkSpeedAt(g,false,0)<2);
 assert.ok(G.walkSpeedAt(g,true,80)>G.walkSpeedAt(g,false,80));
});
test('spawnRespawn module defaults and normalize stay generic',()=>{
 const g=G.defaultGameplay();
 assert.equal(g.modules.spawnRespawn.enabled,true);
 assert.equal(g.modules.spawnRespawn.exitTentAnimation,true);
 assert.equal(g.modules.spawnRespawn.previewOwnsRoom,false);
 assert.ok(g.modules.spawnRespawn.pool.length>=6);
 const n=G.normalizeGameplay({modules:{spawnRespawn:{exitTentAnimation:false,previewOwnsRoom:true,ichsanRoom:1,pool:[{x:1.25,z:2.5,facing:'nw'}]}}});
 assert.equal(n.modules.spawnRespawn.exitTentAnimation,false);
 assert.equal(n.modules.spawnRespawn.previewOwnsRoom,true);
 assert.equal(n.modules.spawnRespawn.pool[0].facing,'se');
 assert.equal(n.modules.spawnRespawn.ichsanRoom,undefined);
});

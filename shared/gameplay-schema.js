/* Gameplay.json schema for Namanya Juga Hidup: The Game.
 * Authoring/sandbox config only — not live account or worker state.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.JiwaGameplay=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const SCHEMA='virtual-life-gameplay-v1';
 const PROJECT_NAME='Namanya Juga Hidup: The Game';
 const PHONE_APPS=['map','jobs','courses','bank','messages','notifications'];
 const int=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback;};
 const num=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;};
 const flag=v=>v===true;
 function hudLayoutApi(){
  if(typeof globalThis!=='undefined'&&globalThis.VLHudLayout)return globalThis.VLHudLayout;
  if(typeof require==='function'){try{return require('./hud-layout.js');}catch(_e){}}
  return null;
 }
 function spawnApi(){
  if(typeof globalThis!=='undefined'&&globalThis.VLSpawnRespawn)return globalThis.VLSpawnRespawn;
  if(typeof require==='function'){try{return require('./spawn-respawn.js');}catch(_e){}}
  return null;
 }
 function defaultGameplay(){
  return {
   schema:SCHEMA,schemaVersion:1,project:{name:PROJECT_NAME},
   hud:{style:'gta_minimal',oneWindowAtATime:true,windowClose:'x_only',noExtraTopHUD:true,noMinimapOnHUD:true},
   modules:{
    phone:{enabled:true,kind:'nokia',apps:{map:true,jobs:false,courses:true,bank:true,messages:false,notifications:false}},
    action:{enabled:true,singleContextButton:true,defaultIdle:'fart'},
    bag:{enabled:true,separateFromPhone:true,slots:8},
    movement:{enabled:true,controllerOnly:true,walkSpeed:1.4,runSpeed:2.2},
    energy:{enabled:false,todo:true,zeroCanMove:true,lowEnergySlowFactor:0.35,crossingCost:0},
    jobs:{enabled:true,dailyWageCap:6000,viaProfessionNpcOnly:true},
    courses:{enabled:true,dailyXpCap:150},
    traffic:{enabled:false,todo:true,densityCycle:'shared_deterministic',busyRatio:0.6,quietRatio:0.3},
    loak:{enabled:false,todo:true,sellPercent:5},
    trafficLights:{enabled:true,cycleSeconds:32},
    spawnRespawn:spawnApi()?spawnApi().defaultModule():{enabled:true,exitTentAnimation:true,triggers:{playStart:true,spawnRequest:true,reconnect:true},previewOwnsRoom:false,ownedRoom:null,pool:[]},
    hudLayout:(hudLayoutApi()&&hudLayoutApi().defaults)?hudLayoutApi().defaults():{desktop:{},phone:{}}
   }
  };
 }
 function normalizeGameplay(raw){
  const base=defaultGameplay();
  if(!raw||typeof raw!=='object')return base;
  const hud=raw.hud&&typeof raw.hud==='object'?raw.hud:{};
  base.hud.oneWindowAtATime=hud.oneWindowAtATime!==false;
  base.hud.windowClose='x_only';
  base.hud.noExtraTopHUD=hud.noExtraTopHUD!==false;
  base.hud.noMinimapOnHUD=hud.noMinimapOnHUD!==false;
  const src=raw.modules&&typeof raw.modules==='object'?raw.modules:{};
  const phone=src.phone&&typeof src.phone==='object'?src.phone:{};
  const apps=phone.apps&&typeof phone.apps==='object'?phone.apps:{};
  base.modules.phone.enabled=phone.enabled!==false;
  base.modules.phone.kind='nokia';
  for(const id of PHONE_APPS)base.modules.phone.apps[id]=apps[id]===true||(apps[id]!==false&&base.modules.phone.apps[id]===true&&apps[id]!==false&&Object.prototype.hasOwnProperty.call(apps,id)?apps[id]===true:base.modules.phone.apps[id]);
  // Explicit merge: missing keys keep defaults; provided booleans win.
  for(const id of PHONE_APPS){
   if(Object.prototype.hasOwnProperty.call(apps,id))base.modules.phone.apps[id]=apps[id]===true;
  }
  const action=src.action&&typeof src.action==='object'?src.action:{};
  base.modules.action.enabled=action.enabled!==false;
  base.modules.action.singleContextButton=action.singleContextButton!==false;
  base.modules.action.defaultIdle=typeof action.defaultIdle==='string'?String(action.defaultIdle).slice(0,40):'fart';
  const bag=src.bag&&typeof src.bag==='object'?src.bag:{};
  base.modules.bag.enabled=bag.enabled!==false;
  base.modules.bag.separateFromPhone=true;
  base.modules.bag.slots=int(bag.slots,4,16,8);
  const move=src.movement&&typeof src.movement==='object'?src.movement:{};
  base.modules.movement.enabled=move.enabled!==false;
  base.modules.movement.controllerOnly=move.controllerOnly!==false;
  base.modules.movement.walkSpeed=num(move.walkSpeed,0.4,4,1.4);
  base.modules.movement.runSpeed=Math.max(base.modules.movement.walkSpeed,
   num(move.runSpeed,0.5,6,2.2));
  const energy=src.energy&&typeof src.energy==='object'?src.energy:{};
  base.modules.energy.enabled=energy.enabled===true;
  base.modules.energy.todo=base.modules.energy.enabled?false:true;
  base.modules.energy.zeroCanMove=energy.zeroCanMove!==false;
  base.modules.energy.lowEnergySlowFactor=num(energy.lowEnergySlowFactor,0.1,1,0.35);
  base.modules.energy.crossingCost=int(energy.crossingCost,0,20,0);
  const jobs=src.jobs&&typeof src.jobs==='object'?src.jobs:{};
  base.modules.jobs.enabled=jobs.enabled!==false;
  base.modules.jobs.dailyWageCap=int(jobs.dailyWageCap,0,100000,6000);
  base.modules.jobs.viaProfessionNpcOnly=jobs.viaProfessionNpcOnly!==false;
  const courses=src.courses&&typeof src.courses==='object'?src.courses:{};
  base.modules.courses.enabled=courses.enabled!==false;
  base.modules.courses.dailyXpCap=int(courses.dailyXpCap,0,150,150);
  const traffic=src.traffic&&typeof src.traffic==='object'?src.traffic:{};
  base.modules.traffic.enabled=traffic.enabled===true;
  base.modules.traffic.todo=base.modules.traffic.enabled?false:true;
  base.modules.traffic.densityCycle='shared_deterministic';
  base.modules.traffic.busyRatio=num(traffic.busyRatio,0,1,0.6);
  base.modules.traffic.quietRatio=num(traffic.quietRatio,0,1,0.3);
  const loak=src.loak&&typeof src.loak==='object'?src.loak:{};
  base.modules.loak.enabled=loak.enabled===true;
  base.modules.loak.todo=base.modules.loak.enabled?false:true;
  base.modules.loak.sellPercent=int(loak.sellPercent,1,100,5);
  const trafficLights=src.trafficLights&&typeof src.trafficLights==='object'?src.trafficLights:{};
  base.modules.trafficLights.enabled=trafficLights.enabled!==false;
  base.modules.trafficLights.cycleSeconds=int(trafficLights.cycleSeconds,12,120,32);
  const SR=spawnApi();
  if(SR&&typeof SR.normalizeModule==='function')base.modules.spawnRespawn=SR.normalizeModule(src.spawnRespawn);
  else base.modules.spawnRespawn=base.modules.spawnRespawn;
  const HL=hudLayoutApi();
  if(HL&&typeof HL.normalize==='function')base.modules.hudLayout=HL.normalize(src.hudLayout);
  else base.modules.hudLayout=src.hudLayout&&typeof src.hudLayout==='object'?src.hudLayout:{desktop:{},phone:{}};
  return base;
 }
 function enabledPhoneApps(gameplay){
  const g=normalizeGameplay(gameplay);
  return PHONE_APPS.filter(id=>g.modules.phone.enabled&&g.modules.phone.apps[id]);
 }
 function walkSpeedAt(gameplay,running,energy){
  const g=normalizeGameplay(gameplay),move=g.modules.movement;
  if(!move.enabled)return 0;
  let speed=running?move.runSpeed:move.walkSpeed;
  const en=g.modules.energy;
  if(en.enabled&&energy!=null){
   const e=Number(energy);
   if(Number.isFinite(e)&&e<=0)speed*=en.zeroCanMove?en.lowEnergySlowFactor:0;
   else if(Number.isFinite(e)&&e<20)speed*=0.6+0.4*(e/20);
  }
  return speed;
 }
 return Object.freeze({SCHEMA,PROJECT_NAME,PHONE_APPS,defaultGameplay,normalizeGameplay,enabledPhoneApps,walkSpeedAt});
});

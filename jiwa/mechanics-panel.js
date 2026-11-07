/* JIWA Mechanics panel + Play Test HUD for Namanya Juga Hidup: The Game.
 * Sandbox preview only: Nokia HP, Action, Bag, movement. No live accounts.
 */
(function(){
'use strict';
const PROJECT=(window.VLHub&&window.VLHub.PROJECT_NAME)||(window.JiwaGameplay&&window.JiwaGameplay.PROJECT_NAME)||'Namanya Juga Hidup: The Game';
const $=id=>document.getElementById(id);
const JG=window.JiwaGameplay;
let player={x:2,z:2},keys=Object.create(null),running=false,dirty=true,lastDraw=0,raf=0,spriteImg=null,spriteId='';
let hudEditProfile='phone';
function gp(){
 const bridge=window.JiwaGameplayBridge;
 const raw=bridge&&bridge.get?bridge.get():null;
 return JG?JG.normalizeGameplay(raw):raw||{};
}
function setGp(next){
 if(window.JiwaGameplayBridge&&window.JiwaGameplayBridge.set)window.JiwaGameplayBridge.set(next);
 renderPanel();renderHudChrome();dirty=true;
}
function patch(mutator){
 const next=JSON.parse(JSON.stringify(gp()));
 mutator(next);
 setGp(next);
}
function field(label,control){
 const wrap=document.createElement('label');
 wrap.textContent=label;
 wrap.append(control);
 return wrap;
}
function check(checked,on){
 const i=document.createElement('input');i.type='checkbox';i.checked=!!checked;
 i.addEventListener('change',()=>on(i.checked));
 return i;
}
function number(value,min,max,step,on){
 const i=document.createElement('input');i.type='number';i.value=value;i.min=min;i.max=max;i.step=step;
 i.addEventListener('change',()=>on(i.value));
 return i;
}
function renderPanel(){
 const root=$('mechanicsPanel');if(!root||!JG)return;
 const g=gp(),m=g.modules;
 root.replaceChildren();
 const intro=document.createElement('p');intro.className='subtle';
 intro.textContent=PROJECT+' · toggle modules used by Play Test. Stubs stay off until implemented.';
 root.append(intro);
 const grid=document.createElement('div');grid.className='mech-grid';
 function card(title,body,todo){
  const c=document.createElement('div');c.className='mech-mod'+(todo?' mech-todo':'');
  const h=document.createElement('h4');h.textContent=title;c.append(h);
  if(typeof body==='function')body(c);else c.append(body);
  grid.append(c);
 }
 card('NOKIA HP',c=>{
  const en=check(m.phone.enabled,v=>patch(g=>g.modules.phone.enabled=v));
  c.append(field('Enabled',en));
  for(const id of JG.PHONE_APPS){
   const box=check(m.phone.apps[id],v=>patch(g=>g.modules.phone.apps[id]=v));
   c.append(field(id.toUpperCase(),box));
  }
 });
 card('ACTION BUTTON',c=>{
  c.append(field('Enabled',check(m.action.enabled,v=>patch(g=>g.modules.action.enabled=v))));
  const note=document.createElement('p');note.className='subtle';
  note.textContent='Single contextual Action button. Not inside the phone.';
  c.append(note);
 });
 card('BAG',c=>{
  c.append(field('Enabled',check(m.bag.enabled,v=>patch(g=>g.modules.bag.enabled=v))));
  c.append(field('Slots (4–16)',number(m.bag.slots,4,16,1,v=>patch(g=>g.modules.bag.slots=v))));
  const note=document.createElement('p');note.className='subtle';
  note.textContent='Physical bag, separate from the Nokia HP.';
  c.append(note);
 });
 card('MOVEMENT',c=>{
  c.append(field('Enabled',check(m.movement.enabled,v=>patch(g=>g.modules.movement.enabled=v))));
  c.append(field('Controller only (no tap-to-move)',check(m.movement.controllerOnly,v=>patch(g=>g.modules.movement.controllerOnly=v))));
  c.append(field('Walk speed',number(m.movement.walkSpeed,0.4,4,0.1,v=>patch(g=>g.modules.movement.walkSpeed=v))));
  c.append(field('Run speed',number(m.movement.runSpeed,0.5,6,0.1,v=>patch(g=>g.modules.movement.runSpeed=v))));
 });
 card('ENERGY (TODO)',c=>{
  c.append(field('Preview params',check(m.energy.enabled,v=>patch(g=>g.modules.energy.enabled=v))));
  c.append(field('Zero energy can move',check(m.energy.zeroCanMove,v=>patch(g=>g.modules.energy.zeroCanMove=v))));
  c.append(field('Low-energy slow factor',number(m.energy.lowEnergySlowFactor,0.1,1,0.05,v=>patch(g=>g.modules.energy.lowEnergySlowFactor=v))));
  c.append(field('Crossing cost (preview)',number(m.energy.crossingCost,0,20,1,v=>patch(g=>g.modules.energy.crossingCost=v))));
 },true);
 card('JOBS / COURSES',c=>{
  c.append(field('Jobs enabled',check(m.jobs.enabled,v=>patch(g=>g.modules.jobs.enabled=v))));
  c.append(field('Daily wage cap (Rp)',number(m.jobs.dailyWageCap,0,100000,100,v=>patch(g=>g.modules.jobs.dailyWageCap=v))));
  c.append(field('Courses enabled',check(m.courses.enabled,v=>patch(g=>g.modules.courses.enabled=v))));
  c.append(field('Course XP cap / day',number(m.courses.dailyXpCap,0,150,5,v=>patch(g=>g.modules.courses.dailyXpCap=v))));
 });
 card('TRAFFIC / CROSSING (TODO)',c=>{
  c.append(field('Preview params',check(m.traffic.enabled,v=>patch(g=>g.modules.traffic.enabled=v))));
  c.append(field('Busy ratio',number(m.traffic.busyRatio,0,1,0.05,v=>patch(g=>g.modules.traffic.busyRatio=v))));
  c.append(field('Quiet ratio',number(m.traffic.quietRatio,0,1,0.05,v=>patch(g=>g.modules.traffic.quietRatio=v))));
 },true);
 card('TRAFFIC LIGHTS',c=>{
  const tl=m.trafficLights||{enabled:true,cycleSeconds:32};
  c.append(field('Enabled',check(tl.enabled!==false,v=>patch(g=>g.modules.trafficLights.enabled=v))));
  c.append(field('Cycle seconds',number(tl.cycleSeconds==null?32:tl.cycleSeconds,12,120,1,v=>patch(g=>g.modules.trafficLights.cycleSeconds=Number(v)))));
 });
 card('SPAWN & RESPAWN',c=>{
  const sr=m.spawnRespawn||{enabled:true,exitTentAnimation:true,triggers:{},pool:[],previewOwnsRoom:false,ownedRoom:null};
  const note=document.createElement('p');note.className='subtle';
  note.textContent='Generic for every player: no room uses a random roadside tent and the exit-tent clip. Owning a Cove room later switches spawn to that room.';
  c.append(note);
  c.append(field('Enabled',check(sr.enabled!==false,v=>patch(g=>g.modules.spawnRespawn.enabled=v))));
  c.append(field('Exit-tent animation',check(sr.exitTentAnimation!==false,v=>patch(g=>g.modules.spawnRespawn.exitTentAnimation=v))));
  c.append(field('Trigger: Play start / Walk Test',check((sr.triggers||{}).playStart!==false,v=>patch(g=>g.modules.spawnRespawn.triggers.playStart=v))));
  c.append(field('Trigger: SPAWN_REQUEST',check((sr.triggers||{}).spawnRequest!==false,v=>patch(g=>g.modules.spawnRespawn.triggers.spawnRequest=v))));
  c.append(field('Trigger: Reconnect / enter Play',check((sr.triggers||{}).reconnect!==false,v=>patch(g=>g.modules.spawnRespawn.triggers.reconnect=v))));
  c.append(field('Preview: this player owns a room',check(sr.previewOwnsRoom===true,v=>patch(g=>g.modules.spawnRespawn.previewOwnsRoom=v))));
  const room=sr.ownedRoom||{x:0,z:0,facing:'se'};
  c.append(field('Owned room X',number(room.x,-200,200,0.5,v=>patch(g=>{
   g.modules.spawnRespawn.ownedRoom=Object.assign({id:'owned-room',x:0,z:0,facing:'se'},g.modules.spawnRespawn.ownedRoom||{},{x:Number(v)});
  }))));
  c.append(field('Owned room Z',number(room.z,-200,200,0.5,v=>patch(g=>{
   g.modules.spawnRespawn.ownedRoom=Object.assign({id:'owned-room',x:0,z:0,facing:'se'},g.modules.spawnRespawn.ownedRoom||{},{z:Number(v)});
  }))));
  const hint=document.createElement('p');hint.className='subtle';
  hint.textContent='Tent pool (sidewalk / roadside only). Edit coordinates here or use a selected city object / a map marker named hobo tent.';
  c.append(hint);
  (sr.pool||[]).forEach((pt,idx)=>{
   const box=document.createElement('div');box.className='spawn-point';box.style.margin='6px 0';
   const title=document.createElement('strong');title.textContent=(pt.id||('p'+(idx+1)))+' · '+pt.facing;
   box.append(title);
   box.append(field('X',number(pt.x,-200,200,0.5,v=>patch(g=>{if(g.modules.spawnRespawn.pool[idx])g.modules.spawnRespawn.pool[idx].x=Number(v);}))));
   box.append(field('Z',number(pt.z,-200,200,0.5,v=>patch(g=>{if(g.modules.spawnRespawn.pool[idx])g.modules.spawnRespawn.pool[idx].z=Number(v);}))));
   const fac=document.createElement('select');
   ['se','sw'].forEach(f=>{const o=document.createElement('option');o.value=f;o.textContent=f.toUpperCase();if(f===pt.facing)o.selected=true;fac.append(o);});
   fac.onchange=()=>patch(g=>{if(g.modules.spawnRespawn.pool[idx])g.modules.spawnRespawn.pool[idx].facing=fac.value;});
   box.append(field('Facing',fac));
   const del=document.createElement('button');del.type='button';del.textContent='Remove';
   del.onclick=()=>patch(g=>{g.modules.spawnRespawn.pool=g.modules.spawnRespawn.pool.filter((_,i)=>i!==idx);});
   box.append(del);
   c.append(box);
  });
  const add=document.createElement('button');add.type='button';add.textContent='＋ Add tent point';
  add.onclick=()=>patch(g=>{
   const n=(g.modules.spawnRespawn.pool||[]).length+1;
   g.modules.spawnRespawn.pool=g.modules.spawnRespawn.pool.concat([{id:'roadside-'+n,x:0.5,z:41.5,facing:'se'}]);
  });
  c.append(add);
  const use=document.createElement('button');use.type='button';use.textContent='＋ Use selected object position';
  use.onclick=()=>{
   const list=objects();
   const sel=list.find(o=>o&&(o._selected||o.selected))||list[0];
   const bridge=window.JiwaGameplayBridge;
   const active=(bridge&&bridge.selected&&bridge.selected())||sel;
   if(!active||!Number.isFinite(Number(active.x))){alert('Select a city object on the World tab first.');return;}
   patch(g=>{
    const n=(g.modules.spawnRespawn.pool||[]).length+1;
    g.modules.spawnRespawn.pool=g.modules.spawnRespawn.pool.concat([{id:'map-'+n,x:Number(active.x),z:Number(active.z),facing:active.facing==='sw'?'sw':'se'}]);
   });
  };
  c.append(use);
 });
 card('TOKO LOAK (TODO)',c=>{
  c.append(field('Preview params',check(m.loak.enabled,v=>patch(g=>g.modules.loak.enabled=v))));
  c.append(field('Sell percent',number(m.loak.sellPercent,1,100,1,v=>patch(g=>g.modules.loak.sellPercent=v))));
 },true);
 root.append(grid);
 const exp=$('exportGameplay');
 if(exp&&!exp.dataset.bound){
  exp.dataset.bound='1';
  exp.onclick=()=>{
   const blob=new Blob([JSON.stringify(gp(),null,2)],{type:'application/json'});
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);
   a.download='gameplay.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
  };
 }
 const rst=$('resetGameplay');
 if(rst&&!rst.dataset.bound){
  rst.dataset.bound='1';
  rst.onclick=()=>{if(confirm('Reset gameplay modules to defaults?'))setGp(JG.defaultGameplay());};
 }
}
function ensureHud(){
 const root=$('playtestHud');if(!root)return null;
 if(root.dataset.ready)return root;
 if(!window.VLPlayHud)return null;
 window.VLPlayHud.mount(root,{
  mode:'stage',includeCanvas:true,getGameplay:gp,onAction:doAction,
  onRunChange:on=>{running=!!on;},
  getInventory:()=> (window.JiwaGameplayBridge&&window.JiwaGameplayBridge.inventory&&window.JiwaGameplayBridge.inventory())||
   (window.JiwaContextBridge&&window.JiwaContextBridge.sandbox&&window.JiwaContextBridge.sandbox()?.inventory)||[]
 });
 const canvas=$('playtestMap');
 canvas.addEventListener('pointerdown',ev=>{
  if(gp().modules.movement.controllerOnly)return;
  ev.preventDefault();
 });
 window.addEventListener('keydown',ev=>{
  if(!isTestTab())return;
  const k=ev.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){keys[k]=true;ev.preventDefault();}
  if(ev.key==='Shift')running=true;
 });
 window.addEventListener('keyup',ev=>{
  const k=ev.key.toLowerCase();
  if(k in keys)keys[k]=false;
  if(ev.key==='Shift')running=false;
 });
 if(!raf)raf=requestAnimationFrame(tick);
 return root;
}
function isTestTab(){
 const view=$('testView');
 return view&&!view.hidden;
}
function renderHudChrome(){
 ensureHud();
 if(window.VLPlayHud)window.VLPlayHud.apply(gp());
 dirty=true;
}
function doAction(){
 if(!gp().modules.action.enabled)return;
 if($('runSelected'))$('runSelected').click();
 else if(window.JiwaGameplayBridge&&window.JiwaGameplayBridge.runAction)window.JiwaGameplayBridge.runAction();
}
function iso(canvas,x,z,midX,midZ){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 return {x:w/2+((x-midX)-(z-midZ))*22,y:h/2+((x-midX)+(z-midZ))*11};
}
function objects(){
 const bridge=window.JiwaGameplayBridge;
 if(bridge&&bridge.entities)return bridge.entities()||[];
 return [];
}
function drawPlayfield(){
 const canvas=$('playtestMap');if(!canvas||!canvas.getContext)return;
 const ctx=canvas.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
 const rect=canvas.getBoundingClientRect();
 const w=Math.max(120,Math.round(rect.width)),h=Math.max(160,Math.round(rect.height||320));
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 }
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.imageSmoothingEnabled=false;
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#dce8ee';ctx.fillRect(0,0,w,h);
 const ents=objects();
 let midX=player.x,midZ=player.z;
 if(ents.length){
  let sx=0,sz=0;for(const o of ents){sx+=Number(o.x)||0;sz+=Number(o.z)||0;}
  midX=sx/ents.length;midZ=sz/ents.length;
 }
 // Ground tiles, then sprites sorted by depth (x+z) to avoid wrong overlaps / flicker.
 for(let gx=-8;gx<=8;gx++)for(let gz=-8;gz<=8;gz++){
  const p=iso(canvas,midX+gx,midZ+gz,midX,midZ);
  ctx.fillStyle=(gx+gz)%2===0?'#c9d9c4':'#d5e0cf';
  ctx.beginPath();ctx.moveTo(p.x,p.y-11);ctx.lineTo(p.x+22,p.y);ctx.lineTo(p.x,p.y+11);ctx.lineTo(p.x-22,p.y);ctx.closePath();ctx.fill();
 }
 const layer=ents.map(o=>({kind:'obj',x:Number(o.x)||0,z:Number(o.z)||0,o}))
  .concat([{kind:'player',x:player.x,z:player.z}]);
 layer.sort((a,b)=>(a.x+a.z)-(b.x+b.z));
 for(const item of layer){
  const p=iso(canvas,item.x,item.z,midX,midZ);
  if(item.kind==='player'){
   const rec=window.JiwaActorLink&&window.JiwaActorLink.record;
   if(rec&&rec.sprite&&spriteImg&&spriteId===rec.id){
    ctx.drawImage(spriteImg,0,(rec.row||4)*112,64,112,p.x-20,p.y-70,40,70);
   }else{
    ctx.fillStyle='#2c79bd';ctx.beginPath();ctx.ellipse(p.x,p.y-18,10,16,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#12344f';ctx.stroke();
   }
  }else{
   const building=item.o.layer==='structure'||item.o.type==='building'||item.o.type==='shop';
   ctx.fillStyle=building?'#d69c67':item.o.type==='vehicle'?'#e69e42':'#719a79';
   ctx.fillRect(p.x-8,p.y-(building?28:12),16,building?28:12);
  }
 }
 dirty=false;
}
function syncSprite(){
 const rec=window.JiwaActorLink&&window.JiwaActorLink.record;
 if(!rec||!rec.sprite){spriteImg=null;spriteId='';return;}
 if(spriteId===rec.id&&spriteImg)return;
 const img=new Image();img.onload=()=>{spriteImg=img;spriteId=rec.id;dirty=true;};
 try{img.src=new URL(rec.sprite,new URL('/virtual-life-asset-pipeline/',location.origin)).href;}
 catch{img.src=rec.sprite;}
}
function tick(now){
 raf=requestAnimationFrame(tick);
 const g=gp();
 if(!isTestTab()||!g.modules.movement.enabled)return;
 const dt=Math.min(0.05,(now-(lastDraw||now))/1000);
 lastDraw=now;
 let dx=0,dz=0;
 if(keys.arrowleft||keys.a)dx-=1;
 if(keys.arrowright||keys.d)dx+=1;
 if(keys.arrowup||keys.w)dz-=1;
 if(keys.arrowdown||keys.s)dz+=1;
 if(dx||dz){
  const len=Math.hypot(dx,dz)||1;
  const energy=window.JiwaContextBridge&&window.JiwaContextBridge.sandbox?window.JiwaContextBridge.sandbox().energy:80;
  const speed=JG.walkSpeedAt(g,running,energy);
  player.x+=dx/len*speed*dt*2.4;
  player.z+=dz/len*speed*dt*2.4;
  dirty=true;
 }
 if(now%200<20)syncSprite();
 if(dirty||now%500<20)drawPlayfield();
}
function boot(){
 ensureHud();renderPanel();renderHudChrome();dirty=true;drawPlayfield();
}
window.addEventListener('jiwa:gameplay',()=>{renderPanel();renderHudChrome();});
window.addEventListener('jiwa:context:render',()=>renderPanel());
window.addEventListener('jiwa:world-sync',()=>{dirty=true;});
document.querySelectorAll('[data-tab]').forEach(btn=>{
 btn.addEventListener('click',()=>{if(btn.dataset.tab==='test'){renderHudChrome();dirty=true;}if(btn.dataset.tab==='systems')renderPanel();});
});
if($('toTest'))$('toTest').addEventListener('click',()=>{renderHudChrome();dirty=true;});
if($('toSystems'))$('toSystems').addEventListener('click',renderPanel);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
window.JiwaMechanicsPanel=Object.freeze({render:boot,gameplay:gp,openWindow:()=>window.VLPlayHud&&window.VLPlayHud.getOpenWindow(),toggleWindow:n=>window.VLPlayHud&&window.VLPlayHud.toggleWindow(n),player});
})();

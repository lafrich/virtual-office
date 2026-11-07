/* Preview sandbox for Loak pickup, bag, and sell-to-Babeh.
 * Sell rule (v15a / t364u): catalog x sellScale (default 5%) x daily 0.8–1.2,
 * rounded to 10, min Rp 10. Tawar +5/+10/+15/+20% accepted 85/65/45/25%;
 * refusal applies a 5% penalty for the rest of the day. Once per item per day.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLLoakPlay=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
 'use strict';
 const KEY='virtual-life-loak-play-v1';
 const ROUND=10,MIN=10,REFUSE_PEN=0.05;
 const TAWAR=[[5,0.85],[10,0.65],[15,0.45],[20,0.25]];
 let state={inventory:[],money:0,dayKey:'',dailyMult:1,haggled:{},picked:{}};

 function gameplay(){
  if(root&&root.JiwaGameplay){
   try{
    if(root.VLPlayHud&&typeof root.VLPlayHud.current==='function')return root.JiwaGameplay.normalizeGameplay(root.VLPlayHud.current());
   }catch{}
   try{
    const key=(root.VLHub&&root.VLHub.GAMEPLAY_KEY)||'virtual-life-gameplay-v1';
    const raw=root.localStorage?JSON.parse(root.localStorage.getItem(key)||'null'):null;
    return root.JiwaGameplay.normalizeGameplay(raw);
   }catch{}
  }
  return null;
 }
 function loakOn(){
  const g=gameplay();
  return !!(g&&g.modules&&g.modules.loak&&g.modules.loak.enabled);
 }
 function sellScale(){
  const g=gameplay();
  const pct=g&&g.modules&&g.modules.loak?g.modules.loak.sellPercent:5;
  return (Number(pct)||5)/100;
 }
 function bagSlots(){
  const g=gameplay();
  return (g&&g.modules&&g.modules.bag&&g.modules.bag.slots)||8;
 }
 function dayKey(){
  const d=new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 }
 function hashDay(key){
  let h=2166136261;
  for(let i=0;i<key.length;i++){h^=key.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0)/4294967296;
 }
 function ensureDay(){
  const key=dayKey();
  if(state.dayKey!==key){
   state.dayKey=key;
   state.dailyMult=Math.round((0.8+hashDay(key)*0.4)*100)/100;
   state.haggled={};
  }
 }
 function load(){
  try{
   const raw=root&&root.localStorage&&root.localStorage.getItem(KEY);
   if(raw)state=Object.assign(state,JSON.parse(raw));
  }catch{}
  ensureDay();
 }
 function save(){
  try{root&&root.localStorage&&root.localStorage.setItem(KEY,JSON.stringify(state));}catch{}
 }
 function catalog(){return (root&&root.VLLoakV2)||{entries:[],types:[],typeOf:()=>null,spriteOf:()=>null};}
 function typeOf(id){return catalog().typeOf?catalog().typeOf(id):null;}
 function spriteOf(id){return catalog().spriteOf?catalog().spriteOf(id):null;}
 function usedSlots(){return state.inventory.length;}
 function stackOf(typeId){return state.inventory.find(x=>x.typeId===typeId);}
 function quote(typeId){
  ensureDay();
  const t=typeOf(typeId);
  if(!t)return null;
  const scale=sellScale();
  let unit=t.catalogPrice*scale*state.dailyMult;
  const hg=state.haggled[typeId];
  if(hg&&hg.accepted)unit*=1+hg.pct/100;
  else if(hg&&hg.pen)unit*=1-REFUSE_PEN;
  unit=Math.max(MIN,Math.round(unit/ROUND)*ROUND);
  return {typeId,name:t.name,catalog:t.catalogPrice,rarity:t.rarity,scale,mult:state.dailyMult,unit,
   haggled:!!(hg&&(hg.accepted||hg.pen)),accepted:!!(hg&&hg.accepted),tawar:TAWAR.slice()};
 }
 function pickup(spriteId){
  const spr=spriteOf(spriteId)||spriteOf(String(spriteId||'').split('/').pop().replace(/\.png$/,''));
  if(!spr)return {ok:false,reason:'Item tidak dikenal'};
  const typeId=spr.legacyType||spr.id;
  const existing=stackOf(typeId);
  if(existing){
   if(existing.qty>=5)return {ok:false,reason:'Tumpukan penuh (5)'};
   existing.qty+=1;
  }else{
   if(usedSlots()>=bagSlots())return {ok:false,reason:'Tas penuh'};
   state.inventory.push({typeId,spriteId:spr.id,name:spr.label,qty:1,icon:spr.iconUrl,rarity:spr.rarity,value:spr.value});
  }
  state.picked[spr.id]=(state.picked[spr.id]||0)+1;
  save();
  return {ok:true,typeId,name:spr.label,slots:usedSlots()};
 }
 function sell(typeId,qty){
  if(!loakOn())return {ok:false,reason:'Modul loak belum diaktifkan di Jiwa'};
  ensureDay();
  const stack=stackOf(typeId);
  if(!stack)return {ok:false,reason:'Barangnya tidak ada di tas'};
  const n=Math.min(stack.qty,Math.max(1,Number(qty)||stack.qty));
  const q=quote(typeId);
  const amount=q.unit*n;
  stack.qty-=n;
  if(stack.qty<=0)state.inventory=state.inventory.filter(x=>x.typeId!==typeId);
  state.money+=amount;
  save();
  return {ok:true,amount,unit:q.unit,qty:n,money:state.money,name:stack.name};
 }
 function haggle(typeId,pct){
  if(!loakOn())return {ok:false,reason:'Modul loak belum diaktifkan di Jiwa'};
  ensureDay();
  const row=TAWAR.find(t=>t[0]===+pct);
  if(!row)return {ok:false,reason:'bad'};
  if(state.haggled[typeId])return {ok:false,reason:'Sudah ditawar hari ini'};
  const stack=stackOf(typeId);
  if(!stack)return {ok:false,reason:'Barangnya tidak ada di tas'};
  const accepted=Math.random()<row[1];
  state.haggled[typeId]=accepted?{accepted:true,pct:row[0]}:{pen:true,pct:row[0]};
  save();
  const q=quote(typeId);
  return {ok:true,accepted,unit:q.unit,pct:row[0],chance:row[1]};
 }
 function bagLabels(){
  const slots=bagSlots(),out=[];
  for(const it of state.inventory){
   out.push((it.name||it.typeId)+(it.qty>1?(' ×'+it.qty):''));
  }
  while(out.length<slots)out.push('');
  return out.slice(0,slots);
 }
 function validateAnchors(){
  const rows=[];
  for(const e of (catalog().entries||[])){
   const issues=[];
   const size=e.size||[],pivot=e.pivot||[],anchor=e.pickupAnchor||[];
   if(size.length!==2||!size.every(Number.isFinite)||size[0]<1||size[1]<1)issues.push('bad_size');
   if(pivot.length!==2||pivot[0]<0||pivot[1]<0||pivot[0]>size[0]||pivot[1]>size[1])issues.push('pivot_oob');
   if(anchor.length===2&&(anchor[0]<0||anchor[1]<0||anchor[0]>size[0]||anchor[1]>size[1]))issues.push('anchor_oob');
   const fp=e.footprint;
   if(e.status==='new_review_only'){
    if(!Array.isArray(fp)||fp.length!==2||fp.some(x=>!(x>0)||x>4))issues.push('bad_footprint');
    else if(Math.abs(fp[0]-size[0]/64)>0.08||Math.abs(fp[1]-size[1]/64)>0.08)issues.push('footprint_not_size_over_64');
    if(anchor.length===2&&pivot.length===2&&(anchor[0]!==pivot[0]||anchor[1]!==pivot[1]))issues.push('anchor_differs_from_pivot');
   }
   if(issues.length)rows.push({id:e.legacyType,sprite:e.id,issues});
  }
  return {ok:rows.length===0,bad:rows,checked:(catalog().entries||[]).length};
 }
 function reset(){
  state={inventory:[],money:0,dayKey:'',dailyMult:1,haggled:{},picked:{}};
  ensureDay();save();
 }
 load();
 return {pickup,sell,haggle,quote,bagLabels,validateAnchors,reset,loakOn,sellScale,
  money:()=>state.money,inventory:()=>state.inventory.slice(),state:()=>{ensureDay();return {money:state.money,dailyMult:state.dailyMult,slots:usedSlots(),cap:bagSlots()};},
  TAWAR,ROUND,MIN};
});

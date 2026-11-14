/* Namanya Juga Hidup — the Game · Step 2 UI (SIMULASI placeholder)
 * Cooking, kulkas/storage, minimarket, fishing, kost electricity token.
 * Real SemestaLifePlay / SemestaPlay hooks win; otherwise njh98:mock:step2@*.
 * Hook names follow Baymax (inventory/moveItem, recipes/cook + mainkan:cook-done,
 * shop/buy, fishStart/fishInput + mainkan:fish-result, token/topupToken).
 * Catalog: Gerak minimarket kit (window.NJH98Catalog). Anim ids used as labels only:
 * cook, cook_stir, eat, fishing_cast, fishing_wait, hand_over, pick_up, use_storage.
 */
(function(){
'use strict';
const N=window.NJH98,C=window.NJH98Catalog;if(!N||!C)return;
const $=id=>document.getElementById(id);
const {rp,esc}=N;
const P='njh98:mock:step2:';
const SIM='<span class="njh-sim" title="Data simulasi UI sampai logic asli tersedia">SIMULASI</span>';
const hook=name=>{try{const L=N.life(),S=N.sp();const o=L&&typeof L[name]==='function'?L[name].bind(L):(S&&typeof S[name]==='function'?S[name].bind(S):null);return o;}catch{return null;}};
const fired=n=>{try{window.NJH98Mock?.mockFired?.();}catch{} /* recorded below */ hookFired.add(n);};
const hookFired=new Set();
const pid=()=>{try{return N.life()?.playerId?.()||'';}catch{return '';}};
const pk=k=>k+'@'+(pid()||'guest');
const ls={get(k,d){try{const v=localStorage.getItem(P+pk(k));return v==null?d:JSON.parse(v);}catch{return d;}},
 set(k,v){try{localStorage.setItem(P+pk(k),JSON.stringify(v));}catch{}}};
const st=()=>N.lifeState()||{};
const CAT=C.categories||{};
const ITEMS=new Map((C.items||[]).map(i=>[i.id,i]));
const FISH=C.fish||[];
const RECIPES=C.recipes||[];
const SHOP_IDS=new Set(C.shopItemIds||[]);
const BAG_SLOTS=8,STORE_SLOTS=24;
const CFG={packPrice:20000,packUnits:5,drainPerDay:1,drainPerCook:1};
let forceKind=null; // QA / screenshot: 'stove'|'fridge'|'storage'|'fish'|'minimarket'
const TOKEN_ITEM={id:'token_listrik',label:'Token listrik (5 unit)',category:'token',price:CFG.packPrice,unit:'paket',spoilMinutes:null,storeIn:['bag'],source:['minimarket'],approximate:false};

function itemOf(id){return ITEMS.get(id)||(id===TOKEN_ITEM.id?TOKEN_ITEM:null);}
function labelOf(id){return itemOf(id)?.label||FISH.find(f=>f.id===id)?.label||id;}
function catLabel(c){return c==='token'?'Token':(CAT[c]||c||'Lainnya');}

/* ---------- mock state ---------- */
function uid(){return 'mock:'+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);}
function defaultInv(){
 return {bag:[
   {uid:uid(),itemId:'telur'},{uid:uid(),itemId:'telur'},{uid:uid(),itemId:'minyak'},
   {uid:uid(),itemId:'mi_instan'},{uid:uid(),itemId:'nasi'},{uid:uid(),itemId:'kopi'},{uid:uid(),itemId:'susu'}
  ],fridge:[{uid:uid(),itemId:'sayur'}],storage:[{uid:uid(),itemId:'gula'}]};
}
function invState(){
 let v=ls.get('inv',null);
 if(!v||typeof v!=='object'){v=defaultInv();ls.set('inv',v);}
 const norm=list=>(Array.isArray(list)?list:[]).flatMap(x=>{
  const n=Math.max(1,Number(x.qty)||1);const id=x.itemId||x.id;const out=[];
  for(let i=0;i<n;i++)out.push({uid:x.uid&&i===0?x.uid:uid(),itemId:id});
  return out;
 });
 v.bag=norm(v.bag);v.fridge=norm(v.fridge);v.storage=norm(v.storage);
 return v;
}
function saveInv(v){ls.set('inv',v);}
function knownSet(){
 let k=ls.get('known',null);
 if(!k){k=RECIPES.filter(r=>r.unlock?.mode==='start'||r.unlock?.knownAtStart).map(r=>r.id);ls.set('known',k);}
 return new Set(k);
}
function learn(id){const k=[...knownSet()];if(!k.includes(id)){k.push(id);ls.set('known',k);}return k;}
function tokenState(){
 const s=st();
 let t=ls.get('token',null);
 if(!t||typeof t!=='object'){
  const units=Number.isFinite(Number(s.powerTokens))?Number(s.powerTokens):CFG.packUnits;
  t={units,lastDay:null,fridgeOn:true,hasRoom:!!(s.housing?.room)};
  ls.set('token',t);
 }
 return t;
}
function saveToken(t){ls.set('token',t);}
function mwallet(){try{return window.NJH98Mock?.mockWallet;}catch{return null;}}
function mockCash(){const w=mwallet();return w?w.get():50000;}
function spendMock(n){const w=mwallet();if(!w)return {ok:false,reason:'Dompet simulasi belum siap.'};if(w.get()<n)return {ok:false,reason:'Uang tidak cukup.'};w.add(-n);return {ok:true,wallet:w.get()};}

function rowOf(raw){
 const itemId=raw.itemId||raw.species||raw.id;
 const it=itemOf(itemId)||FISH.find(f=>f.id===itemId)||{id:itemId,label:itemId,category:'other'};
 const isFish=it.category==='fish'||FISH.some(f=>f.id===itemId);
 const isDish=it.category==='dish';
 return {
  uid:raw.uid||raw.id||uid(),itemId,label:it.label||labelOf(itemId),
  category:it.category||(isFish?'fish':'other'),icon:it.icon||null,
  quality:raw.quality||(isDish?'biasa':null),
  storeIn:it.storeIn||['bag'],minutesLeft:it.spoilMinutes??null,spoiled:!!raw.spoiled,
  inFridge:!!raw.inFridge,edible:isDish||['snack','drink','fresh'].includes(it.category),
  sellPrice:it.sellPrice??it.price??null,mock:true
 };
}
function listOf(container){const inv=invState();return (inv[container==='storage'?'storage':container==='fridge'?'fridge':'bag']||[]).map(rowOf);}
function callHook(name,args){
 const f=hook(name);if(!f)return null;
 try{return f.apply(null,args);}catch(err){return {ok:false,reason:String(err.message||err)};}
}

/* ---------- hooks (real first; shapes = docs/HOOKS-STEP2.md) ---------- */
const LOCK_TOKEN='Token listrik habis. Isi token dulu (Rp20.000 / 5 unit).';
const COOK_TOKEN='Token listrik habis.';
const LABELS={bag:'Tas',fridge:'Kulkas',storage:'Lemari'};
const SLOTS={bag:BAG_SLOTS,fridge:STORE_SLOTS,storage:STORE_SLOTS};

function inventory(container='bag'){
 const real=callHook('inventory',[container]);
 if(real&&typeof real==='object'&&!Array.isArray(real)&&('items' in real||'ok' in real))return real;
 fired('inventory');
 container=['bag','fridge','storage'].includes(container)?container:'bag';
 const tok=token();
 const items=listOf(container);
 const locked=container!=='bag'&&tok.empty;
 return {ok:!locked,container,label:LABELS[container],slots:SLOTS[container],used:items.length,free:Math.max(0,SLOTS[container]-items.length),
  items,locked,reason:locked?LOCK_TOKEN:undefined,mock:true};
}
function bagItems(){return inventory('bag').items||[];}
function bagCount(){return bagItems().length;}
function findNeed(items,need){
 if(need.id)return items.filter(x=>x.itemId===need.id||x.uid===need.id).length;
 if(need.category)return items.filter(x=>x.category===need.category||(need.category==='fish'&&FISH.some(f=>f.id===x.itemId))).length;
 return 0;
}
function parseMove(from,to,itemId,qty){
 if(from&&typeof from==='object'&&!Array.isArray(from))return {from:from.from,to:from.to,itemId:from.itemId,qty:from.qty??1};
 return {from,to,itemId,qty:qty??1};
}
function moveItem(from,to,itemId,qty){
 const a=parseMove(from,to,itemId,qty);
 const real=callHook('moveItem',[a.from,a.to,a.itemId,a.qty??1]);
 if(real&&typeof real==='object'&&'ok' in real)return real;
 fired('moveItem');
 from=a.from;to=a.to;itemId=a.itemId;qty=Math.max(1,Number(a.qty)||1);
 if(!['bag','fridge','storage'].includes(from)||!['bag','fridge','storage'].includes(to)||from===to)
  return {ok:false,reason:'Tujuan tidak sah.'};
 if((from==='fridge'&&to==='storage')||(from==='storage'&&to==='fridge'))return {ok:false,reason:'Pindah lewat Tas dulu.'};
 const tok=token();
 if((from!=='bag'||to!=='bag')&&tok.empty)return {ok:false,locked:true,reason:LOCK_TOKEN};
 const inv=invState();
 const src=inv[from==='storage'?'storage':from],dst=inv[to==='storage'?'storage':to];
 const moved=[];
 for(let n=0;n<qty;n++){
  const i=src.findIndex(x=>(x.uid===itemId||x.itemId===itemId)&&!moved.includes(x.uid));
  if(i<0)break;
  const row=src[i];
  const it=rowOf(row);
  if(to!=='bag'&&Array.isArray(it.storeIn)&&it.storeIn.length&&!it.storeIn.includes(to)&&!it.storeIn.includes(to==='storage'?'storage':'fridge'))
   return {ok:false,reason:to==='storage'?'Barang basah simpan di kulkas.':'Barang kering simpan di lemari.'};
  if(to==='bag'&&bagCount()+moved.length>=BAG_SLOTS)return {ok:false,reason:'Tas penuh.'};
  if(to==='fridge'&&dst.length+moved.length>=STORE_SLOTS)return {ok:false,reason:'Kulkas penuh.'};
  if(to==='storage'&&dst.length+moved.length>=STORE_SLOTS)return {ok:false,reason:'Penyimpanan kost penuh.'};
  src.splice(i,1);dst.push({uid:row.uid||uid(),itemId:row.itemId,inFridge:to==='fridge'});
  moved.push(row.uid);
 }
 if(!moved.length)return {ok:false,reason:'Barang tidak ada.'};
 saveInv(inv);
 return {ok:true,from,to,moved,pose:'use_storage',mock:true};
}
function eatItem(id){
 const real=callHook('eatItem',[id]);
 if(real&&typeof real==='object'&&'ok' in real)return real;
 fired('eatItem');
 const inv=invState();
 const i=inv.bag.findIndex(x=>x.uid===id||x.itemId===id);
 if(i<0)return {ok:false,reason:'Barang tidak ada di Tas.'};
 const it=rowOf(inv.bag[i]);
 if(!it.edible)return {ok:false,reason:it.category==='fish'?'Ikan mentah harus dimasak dahulu.':'Bahan mentah, masak dulu.'};
 inv.bag.splice(i,1);saveInv(inv);
 const rec=RECIPES.find(r=>r.outputItem===it.itemId||r.id===it.itemId);
 const effects=rec?.statEffectsEat||{fullness:8,energy:4};
 return {ok:true,itemId:it.itemId,label:it.label,quality:it.quality,effects,pose:'eat',mock:true};
}

function recipeView(r,items){
 const known=knownSet().has(r.id);
 const ingredients=known?(r.ingredients||[]).map(n=>{
  const qty=n.qty||1,have=findNeed(items,n);
  const label=n.id?labelOf(n.id):(n.category==='fish'?'Ikan apa saja':catLabel(n.category));
  return {id:n.id,category:n.category,qty,label,have};
 }):[];
 const missing=known?ingredients.filter(n=>n.have<n.qty).map(n=>n.id||n.category):[];
 return {id:r.id,label:known?(r.outputLabel||r.label):'???',known,
  ingredients,outputItem:r.outputItem,outputLabel:r.outputLabel||r.label,
  durationMinutes:r.durationMinutes,statEffectsEat:r.statEffectsEat||{},minExp:r.minExp||0,
  unlock:r.unlock||{mode:'experiment'},actionAsset:r.actionAsset||'cook',
  canCook:known&&!missing.length,missing};
}
function recipes(){
 const real=callHook('recipes',[]);
 if(Array.isArray(real)&&real.length)return real;
 fired('recipes');
 return RECIPES.map(r=>recipeView(r,bagItems()));
}
function takeFromBag(inv,need){
 const bag=inv.bag;let left=need.qty||1;const taken=[];
 const ok=id=>{
  if(need.id)return id===need.id;
  if(need.category==='fish')return FISH.some(f=>f.id===id)||itemOf(id)?.category==='fish';
  return itemOf(id)?.category===need.category;
 };
 for(let i=0;i<bag.length&&left>0;i++){
  if(!ok(bag[i].itemId))continue;
  taken.push(bag[i].uid||bag[i].itemId);bag.splice(i,1);i--;left--;
 }
 return left===0?taken:null;
}
function cook(input){
 const real=callHook('cook',[input]);
 if(real&&typeof real==='object'&&'ok' in real){if(real.ok)emit('mainkan:cook-done',real);return real;}
 fired('cook');
 const tok=token();if(tok.empty)return {ok:false,reason:COOK_TOKEN};
 let recipeId=null,ings=null;
 if(typeof input==='string')recipeId=input;
 else if(Array.isArray(input))ings=input;
 else if(input&&typeof input==='object'){recipeId=input.recipeId||input.activityId;ings=input.ingredients;}
 const rec=recipeId?RECIPES.find(r=>r.id===recipeId):null;
 if(!rec)return {ok:false,reason:'Resep tidak dikenal.'};
 if(!knownSet().has(rec.id))return {ok:false,reason:'Resep belum terbuka.'};
 const view=recipeView(rec,bagItems());
 if(!view.canCook)return {ok:false,reason:'Bahan kurang: '+(view.missing||[]).map(id=>labelOf(id)||id).join(', ')+'.'};
 const inv=invState();const consumed=[];
 for(const n of rec.ingredients){const got=takeFromBag(inv,n);if(!got)return {ok:false,reason:'Bahan kurang.'};consumed.push(...got);}
 if(inv.bag.length>=BAG_SLOTS)return {ok:false,reason:'Tas penuh (8 slot).'};
 const outUid=uid();
 inv.bag.push({uid:outUid,itemId:rec.outputItem,quality:'biasa'});
 saveInv(inv);
 const t=tokenState();const was=t.units;t.units=Math.max(0,(t.units||0)-1);saveToken(t);paintToken();
 if(was>0&&t.units===0)emit('mainkan:token',{units:0,empty:true});
 const out={ok:true,recipeId:rec.id,result:{uid:outUid,itemId:rec.outputItem,label:rec.outputLabel,quality:'biasa',statEffectsEat:rec.statEffectsEat||{}},
  learnedRecipe:null,consumed,minutes:rec.durationMinutes,tokenUsed:1,pose:rec.actionAsset||'cook',mock:true};
 emit('mainkan:cook-done',out);return out;
}

function shopList(siteId='minimarket'){
 const real=callHook('shopList',[siteId]);
 if(real&&typeof real==='object'&&('items' in real||'ok' in real))return real;
 fired('shopList');
 const items=[...[...SHOP_IDS].map(id=>itemOf(id)).filter(Boolean),TOKEN_ITEM].map(it=>({
  itemId:it.id,label:it.label,category:it.category,price:it.price,unit:it.unit||'pcs',
  icon:it.icon||null,approximate:!!it.approximate,storeIn:it.storeIn||['bag'],shelf:it.category
 }));
 return {ok:true,siteId:siteId||'minimarket',label:'NJH Mart',inside:true,near:true,wallet:mockCash(),bagFree:Math.max(0,BAG_SLOTS-bagCount()),items,mock:true};
}
function shop(siteId){return shopList(siteId);} // not in contract; thin alias for older drafts
function buy(itemId,qty){
 const cart=itemId&&typeof itemId==='object'?(itemId.cart||itemId.items||(itemId.itemId?[{itemId:itemId.itemId,qty:itemId.qty||1}]:null)):null;
 const real=cart? (callHook('buy',[{cart}])||callHook('checkoutCart',[{cart}])) : callHook('buy',[itemId,qty??1]);
 if(real&&typeof real==='object'&&'ok' in real){if(real.ok)emit('mainkan:shop-receipt',real);return real;}
 fired('buy');
 const lines=(cart||[{itemId,qty:qty??1}]).map(l=>({itemId:l.itemId,qty:Math.max(1,Math.min(8,Number(l.qty)||1))}));
 const inv=invState();const added=[];const recLines=[];let total=0;
 for(const l of lines){
  if(l.itemId===TOKEN_ITEM.id){const t=topupToken(CFG.packUnits*l.qty);if(!t.ok)return t;recLines.push({itemId:l.itemId,label:TOKEN_ITEM.label,qty:l.qty,price:CFG.packPrice,subtotal:CFG.packPrice*l.qty});total+=CFG.packPrice*l.qty;continue;}
  const it=itemOf(l.itemId);if(!it||!SHOP_IDS.has(l.itemId))return {ok:false,reason:'Barang tidak dijual di sini.'};
  recLines.push({itemId:l.itemId,label:it.label,qty:l.qty,price:it.price,subtotal:it.price*l.qty});total+=it.price*l.qty;
 }
 if(bagCount()+lines.filter(l=>l.itemId!==TOKEN_ITEM.id).reduce((n,l)=>n+l.qty,0)>BAG_SLOTS)return {ok:false,reason:'Tas penuh (8 slot).'};
 const before=mockCash();const pay=spendMock(total);if(!pay.ok)return {ok:false,reason:'Uang tidak cukup.'};
 for(const l of lines){
  if(l.itemId===TOKEN_ITEM.id)continue;
  for(let i=0;i<l.qty;i++){const u=uid();inv.bag.push({uid:u,itemId:l.itemId});added.push(u);}
 }
 saveInv(inv);
 const out={ok:true,receipt:{lines:recLines,total,walletBefore:before,walletAfter:pay.wallet},added,pose:'hand_over',mock:true};
 emit('mainkan:shop-receipt',out);return out;
}
function checkoutCart(args){return buy(args);}

function fishSpots(){
 const real=callHook('fishSpots',[]);
 if(Array.isArray(real))return real;
 fired('fishSpots');
 return [{id:'njh-dermaga-mancing-anchor',label:'Dermaga Mancing',x:null,z:null,source:'temporary'}];
}
function fishStart(spotId){
 if(spotId&&typeof spotId==='object')spotId=spotId.spotId;
 const real=callHook('fishStart',[spotId]);
 if(real&&typeof real==='object'&&'ok' in real)return real;
 fired('fishStart');
 if(bagCount()>=BAG_SLOTS)return {ok:false,reason:'Tas penuh (8 slot).'};
 const energy=Number(st().energy);if(Number.isFinite(energy)&&energy<8)return {ok:false,reason:'Energi tidak cukup untuk mancing.'};
 const sessionId='fs_'+Date.now().toString(36);
 const sess={sessionId,spotId:spotId||'njh-dermaga-mancing-anchor',energyCost:8,phase:'cast',t:Date.now()};
 ls.set('fish',sess);
 return {ok:true,sessionId,spotId:sess.spotId,energyCost:8,phase:'cast',pose:'fishing_cast',mock:true};
}
function pickFish(){
 const pool=FISH.filter(f=>f.weight>0);
 const tot=pool.reduce((n,f)=>n+f.weight,0)||1;let r=Math.random()*tot;
 for(const f of pool){r-=f.weight;if(r<=0)return f;}
 return pool[0]||FISH[0];
}
function addFish(f){
 const inv=invState();if(bagCount()>=BAG_SLOTS)return null;
 const u=uid();inv.bag.push({uid:u,itemId:f.id});saveInv(inv);return u;
}
function fishInput(action,value){
 if(action&&typeof action==='object'){value=action.value;action=action.phase||action.action;}
 const real=callHook('fishInput',[action,value]);
 if(real&&typeof real==='object'&&'ok' in real){if(real.done)emit('mainkan:fish-result',real);return real;}
 fired('fishInput');
 const sess=ls.get('fish',null);
 if(!sess)return {ok:false,reason:'Sesi mancing tidak ada.'};
 if(action==='cancel'){ls.set('fish',null);const miss={ok:true,done:true,gotAway:true,reason:'Batal',mock:true};emit('mainkan:fish-result',miss);return miss;}
 const acc=Number.isFinite(Number(value))?Number(value):0.5;
 if(action==='cast'){sess.phase='wait';ls.set('fish',sess);return {ok:true,phase:'wait',pose:'fishing_wait',mock:true};}
 if(action==='wait'){const bite=true;sess.phase=bite?'strike':'wait';ls.set('fish',sess);return {ok:true,phase:sess.phase,bite,strikeWindowMs:900,mock:true};}
 const hit=acc>=0.35&&acc<=0.8;
 if(!hit){ls.set('fish',null);const miss={ok:false,done:true,gotAway:true,reason:'Ikan kabur.',mock:true};emit('mainkan:fish-result',miss);return miss;}
 if(action==='reel'||action==='strike'){
  const fish=pickFish();ls.set('fish',null);
  const u=addFish(fish);
  if(!u){const full={ok:false,done:true,gotAway:false,fishId:fish.id,label:fish.label,rarity:fish.rarity,reason:'Tas penuh (8 slot).',mock:true};emit('mainkan:fish-result',full);return full;}
  const ok={ok:true,done:true,fishId:fish.id,label:fish.label,rarity:fish.rarity,rarityTier:fish.rarity,gotAway:false,uid:u,mock:true};
  emit('mainkan:fish-result',ok);return ok;
 }
 return {ok:true,phase:sess.phase,mock:true};
}

function token(){
 const real=callHook('token',[]);
 if(real&&typeof real==='object'&&('units' in real||'ok' in real))return real;
 fired('token');
 const t=tokenState();
 const units=Math.max(0,Number(t.units)||0);
 const drainPerHour=0.25+(t.fridgeOn?1:0);
 const minutesLeft=drainPerHour>0&&units>0?Math.round(units/drainPerHour*60):0;
 return {ok:true,units,drainPerHour,empty:units===0,minutesLeft,price:CFG.packPrice,unitsPerPack:CFG.packUnits,
  fridgeCooling:!!t.fridgeOn&&units>0,hasRoom:!!(st().housing?.room||t.hasRoom),mock:true};
}
function topupToken(units){
 if(units&&typeof units==='object')units=units.units??((units.qty||1)*CFG.packUnits);
 units=Number(units);if(!Number.isFinite(units)||units<=0)units=CFG.packUnits;
 const real=callHook('topupToken',[units]);
 if(real&&typeof real==='object'&&'ok' in real){if(real.ok){paintToken();emit('mainkan:token',{units:real.units,empty:real.units===0});}return real;}
 const buyTok=hook('runAction');
 if(buyTok){try{const r=buyTok('buy_token',{});if(r&&r.ok){paintToken();return r;}}catch{}}
 fired('topupToken');
 const packs=Math.ceil(units/CFG.packUnits);
 const cost=CFG.packPrice*packs;const added=CFG.packUnits*packs;
 const pay=spendMock(cost);if(!pay.ok)return {ok:false,reason:'Uang tidak cukup.'};
 const t=tokenState();t.units=(t.units||0)+added;saveToken(t);paintToken();
 const out={ok:true,units:t.units,added,packs,paid:cost,mock:true};
 emit('mainkan:token',{units:t.units,empty:false});
 return out;
}
function setToken(n){
 const t=tokenState();const was=t.units;t.units=Math.max(0,Number(n)||0);saveToken(t);paintToken();
 if(was>0&&t.units===0)emit('mainkan:token',{units:0,empty:true});
 return token();
}

function emit(name,detail){try{document.dispatchEvent(new CustomEvent(name,{detail}));try{window.parent?.postMessage({type:name,detail},'*');}catch{}}catch{}}

/* ---------- nearby + action bar (ids from HOOKS-STEP2.md) ---------- */
const SHOP_IDS_DOOR=/minimarket|supermarket|njh_minimarket|njh_door_minimarket|njh.?mart|swalayan/i;
const FISH_IDS=/mancing|dermaga|fishing|^fish$|pier/i;
function nearKind(){
 if(forceKind)return forceKind;
 try{
  const indoor=document.body.classList.contains('njh-indoor');
  const room=$('njhRoom');
  if(indoor&&room){
   const me=room.querySelector('.njh-me');const x=me&&Number((me.getAttribute('style')||'').match(/--x:(\\d+)/)?.[1]);
   const y=me&&Number((me.getAttribute('style')||'').match(/--y:(\\d+)/)?.[1]);
   const spots=window.NJH98Mock?.furnitureSpots?.(st())||[];
   const f=spots.find(s=>Number.isFinite(x)&&x>=s.x-1&&x<=s.x+s.w&&y>=s.y-1&&y<=s.y+s.h);
   if(f?.id==='stove')return 'stove';
   if(f?.id==='fridge')return 'fridge';
   if(f?.id==='wardrobe')return 'storage';
   if(indoor)return 'kost';
  }
 }catch{}
 const me=N.playerPos?.();if(!me)return null;
 const near=list=>{
  for(const o of list||[]){
   if(!Number.isFinite(o?.x)&&!Number.isFinite(o?.z))continue;
   const r=Math.hypot((o.x||0)-me.x,(o.z||0)-me.z);
   if(r<=6)return o;
  }
  return null;
 };
 const blob=o=>[o.id,o.name,o.label,o.type,o.kind,o.siteId,o.objectId,o.doorId].join(' ');
 try{
  const dir=(N.sp()?.worldDirectory?.()||[]).concat(N.doorList?.()||[]);
  let sites=[];try{sites=N.life()?.sites?.()||[];}catch{}
  const all=dir.concat(sites);
  const shop=near(all.filter(o=>SHOP_IDS_DOOR.test(blob(o))));if(shop)return 'minimarket';
  const fish=near(all.filter(o=>FISH_IDS.test(blob(o))));if(fish)return 'fish';
 }catch{}
 return null;
}
function realHas(id){
 try{const f=hook('nearbyActions');if(!f)return false;return (f()||[]).some(a=>String(a.id||a.action)===id);}catch{return false;}
}
function actions(){
 if(N.current()!=='gameScreen')return [];
 const kind=nearKind();if(!kind)return [];
 const tok=token();const off=!!tok.empty;const out=[];
 const add=(id,label,opts={})=>{if(realHas(id))return;out.push({id,label,mock:true,contextual:true,...opts});};
 if(kind==='stove')add('cook_menu','Masak',off?{disabled:true,hint:COOK_TOKEN}:{hint:'Butuh kompor dan bahan'});
 if(kind==='fridge')add('open_fridge','Kulkas',off?{disabled:true,hint:LOCK_TOKEN}:{hint:'Simpan / ambil bahan'});
 if(kind==='storage')add('open_storage','Lemari',off?{disabled:true,hint:LOCK_TOKEN}:{hint:'Simpan / ambil bahan'});
 if(kind==='fish')add('fish_start','Mancing',{hint:'Lempar pancing, tekan AKSI'});
 if(kind==='minimarket')add('shop_minimarket','Belanja',{hint:'Minimarket'});
 if((kind==='stove'||kind==='fridge'||kind==='storage'||kind==='kost')&&tok.units<=2)
  add('topup_token','Isi Token',{hint:'5 unit '+rp(tok.price||CFG.packPrice)});
 if(out.length)fired('step2Actions');
 return out;
}
function run(id){
 if(id==='cook_menu'||id==='cook'){if(token().empty)return COOK_TOKEN;openCook();return '';}
 if(id==='open_fridge'){if(token().empty)return LOCK_TOKEN;openStorage('fridge');return '';}
 if(id==='open_storage'){if(token().empty)return LOCK_TOKEN;openStorage('storage');return '';}
 if(id==='fish_start'||id==='fish'){openFish();return '';}
 if(id==='shop_minimarket'||id==='shop'){openShop();return '';}
 if(id==='topup_token'){openToken();return '';}
 return null;
}

/* ---------- windows (placeholder, Win98) ---------- */
function win(id,title,html,cls){return window.NJH98Mock?/* use same helper via DOM */openWin(id,title,html,cls):null;}
function openWin(id,title,html,cls){
 // reuse mock win by temporarily constructing like njh98-mock win()
 const inGame=N.current()==='gameScreen';
 let w=$(id);
 const parent=inGame?$('njhHud'):document.getElementById('njhDlg')||$('njhHud');
 if(!w){w=document.createElement('section');w.id=id;w.setAttribute('role','dialog');w.innerHTML='<header class="w98-title"><span></span><button type="button" data-close aria-label="Tutup">×</button></header><div class="w98-body"></div>';}
 if(parent&&w.parentElement!==parent)parent.append(w);
 w.className='w98 njh-win '+(cls||'');
 w.querySelector('.w98-title span').innerHTML=title+' '+SIM;
 w.querySelector('.w98-body').innerHTML=html;
 N.closeWindows();N.closeCtx();w.hidden=false;
 setTimeout(()=>(w.querySelector('[data-focus]')||w.querySelector('.btn.primary')||w.querySelector('[data-close]'))?.focus(),0);
 return w;
}
function fx(e){const s=e?.statEffectsEat||e||{};const bits=[];if(s.fullness)bits.push('Kenyang '+(s.fullness>0?'+':'')+s.fullness);if(s.energy)bits.push('Energi '+(s.energy>0?'+':'')+s.energy);if(s.moral)bits.push('Moral '+(s.moral>0?'+':'')+s.moral);return bits.join(' · ')||'—';}

function openCook(){
 const all=recipes();
 const list=all.filter(r=>r.known);
 const hidden=all.length-list.length;
 const tok=token();
 const empty=!!tok.empty;
 const rows=list.map(r=>{
  const ings=(r.ingredients||[]).map(n=>'<span class="'+(n.have>=n.qty?'ok':'miss')+'">'+esc(n.label||n.id||n.category)+' '+(n.have||0)+'/'+(n.qty||1)+'</span>').join(' ');
  const dis=(!r.canCook||empty)?' disabled':'';
  const why=empty?COOK_TOKEN:(!r.canCook?'Bahan kurang':'');
  return '<li class="njh-s2-row'+(r.canCook&&!empty?'':' dim')+'" data-rid="'+esc(r.id)+'">'+
   '<div class="njh-s2-main"><b>'+esc(r.outputLabel||r.label)+'</b><small>'+ings+'</small><small>'+r.durationMinutes+' mnt · '+esc(fx(r))+'</small></div>'+
   '<button type="button" class="btn compact" data-cook="'+esc(r.id)+'"'+dis+' title="'+why+'">Masak</button></li>';
 }).join('');
 const more=hidden?'<li class="njh-s2-row locked"><b>???</b><small>'+hidden+' resep belum terbuka</small></li>':'';
 const html='<p class="micro">Dekat kompor. Bahan di Tas. Token: <b>'+tok.units+'</b>.'+(empty?' '+esc(COOK_TOKEN):'')+' '+SIM+'</p>'+
  '<ul class="njh-s2-list">'+rows+more+'</ul>'+
  '<div class="w98-well micro" id="njhCookMsg">Pilih resep. Animasi: cook / cook_stir (PLACEHOLDER).</div>'+
  '<div class="njh-row"><button type="button" class="btn primary" data-close>Tutup</button></div>';
 const w=openWin('njhCook','Masak.exe',html,'njh-s2win');
 w.onclick=e=>{
  const b=e.target.closest('[data-cook]');if(!b)return;
  doCook(b.getAttribute('data-cook'));
 };
}
function doCook(recipeId){
 const rec=RECIPES.find(r=>r.id===recipeId);const msg=$('njhCookMsg');
 const view=(recipes()||[]).find(x=>x.id===recipeId);
 const tok=token();
 if(!rec){if(msg)msg.textContent='Resep tidak ada.';return;}
 if(tok.empty){if(msg)msg.textContent=COOK_TOKEN;return;}
 if(!view?.canCook){if(msg)msg.textContent='Bahan kurang.';return;}
 const anim=rec.actionAsset||'cook';
 if(msg)msg.textContent='Memasak… animasi: '+anim+' (PLACEHOLDER)';
 const bar=msg?.parentElement?.querySelector('.njh-s2-prog')||document.createElement('div');
 bar.className='njh-bar njh-bar-lg njh-s2-prog';bar.innerHTML='<i></i>';msg?.before(bar);
 const fill=bar.querySelector('i');const t0=performance.now(),dur=Math.min(1800,400+rec.durationMinutes*30);
 const step=now=>{const p=Math.min(1,(now-t0)/dur);fill.style.width=(p*100)+'%';if(p<1)requestAnimationFrame(step);else finish();};
 const finish=()=>{
  const r=cook({recipeId});
  bar.remove();
  if(!r.ok){if(msg)msg.textContent=r.reason||'Gagal.';openCook();return;}
  const fxT=fx(r.result);
  openWin('njhCook','Hasil Masak','<p><b>'+esc(r.result.label)+'</b> · kualitas '+esc(r.result.quality||'biasa')+'</p>'+
   '<p class="micro">Efek makan: '+esc(fxT)+'. Masuk Tas. Animasi: '+(r.pose||'cook')+' (PLACEHOLDER). '+SIM+'</p>'+
   '<div class="njh-row"><button type="button" class="btn primary" data-close>Ke Tas</button></div>','njh-s2win njh-small');
 };
 requestAnimationFrame(step);
}

function openStorage(kind){
 const inv=inventory(kind);
 if(inv.locked||token().empty){
  const reason=inv.reason||LOCK_TOKEN;
  N.toast(reason);openWin('njhStore',kind==='fridge'?'Kulkas.exe':'Lemari.exe',
   '<p>'+esc(reason)+'</p><p class="micro">Storage, kulkas, dan masak tidak bisa dipakai sampai token diisi. '+SIM+'</p>'+
   '<div class="njh-row"><button type="button" class="btn primary" data-close>OK</button></div>','njh-s2win njh-small');return;}
 const title=kind==='fridge'?'Kulkas.exe':'Lemari.exe';
 const paint=()=>{
  const left=inventory(kind),bag=inventory('bag');
  const leftItems=left.items||[],bagItems=bag.items||[];
  const slot=(it,side)=>it
   ?'<button type="button" class="njh-slot'+(sel?.side===side&&sel?.uid===it.uid?' on':'')+'" data-side="'+side+'" data-id="'+esc(it.uid)+'" title="'+esc(it.label)+'">'+esc(it.label)+'</button>'
   :'<div class="njh-slot empty" aria-hidden="true"></div>';
  const grid=(list,side,n)=>Array.from({length:n},(_,i)=>slot(list[i],side)).join('');
  const html='<p class="micro">'+(kind==='fridge'?'Makanan basah / ikan.':'Bahan kering.')+' Pilih barang, lalu Pindah. Animasi: use_storage (PLACEHOLDER). '+SIM+'</p>'+
   '<div class="njh-s2-cols"><fieldset class="njh-group"><legend>'+(left.label||'Kontainer')+' · '+(left.used||0)+'/'+(left.slots||STORE_SLOTS)+'</legend><div class="njh-slots njh-s2-slots">'+grid(leftItems,kind,Math.max(8,Math.min(STORE_SLOTS,(leftItems.length)+4)))+'</div></fieldset>'+
   '<fieldset class="njh-group"><legend>Tas · '+(bag.used||0)+'/'+BAG_SLOTS+'</legend><div class="njh-slots njh-s2-slots">'+grid(bagItems,'bag',BAG_SLOTS)+'</div></fieldset></div>'+
   '<div class="w98-well micro" id="njhStoreMsg">'+(sel?esc(sel.label):'Pilih barang.')+'</div>'+
   '<div class="njh-row"><button type="button" class="btn" id="njhStoreMove" disabled>Pindah</button><button type="button" class="btn primary" data-close>Tutup</button></div>';
  const w=$('njhStore')&&!$('njhStore').hidden?$('njhStore'):openWin('njhStore',title,html,'njh-s2win njh-storewin');
  if($('njhStore')){w.querySelector('.w98-title span').innerHTML=title+' '+SIM;w.querySelector('.w98-body').innerHTML=html;}
  w.querySelectorAll('.njh-slot[data-id]').forEach(b=>{
   const list=b.dataset.side==='bag'?bagItems:leftItems;const it=list.find(x=>x.uid===b.dataset.id);b._it=it;
   b.onclick=()=>{sel={side:b.dataset.side,uid:it.uid,itemId:it.itemId,label:it.label};paint();};
  });
  const mv=$('njhStoreMove');if(mv){mv.disabled=!sel;mv.onclick=()=>{
   if(!sel)return;
   const from=sel.side,to=from==='bag'?kind:'bag';
   const r=moveItem({from,to,itemId:sel.uid,qty:1});
   $('njhStoreMsg').textContent=r.ok?'Dipindah. (SIMULASI)':(r.reason||'Gagal.');
   sel=null;paint();
  };}
 };
 let sel=null;paint();
}

let shopCat='staple';
function openShop(){
 const data=shopList();
 const cats=[];
 for(const it of data.items||[]){if(!cats.some(c=>c.id===it.category))cats.push({id:it.category,label:catLabel(it.category)});}
 if(!cats.some(c=>c.id===shopCat))shopCat=cats[0]?.id||'staple';
 const tok=token();
 const paint=()=>{
  const data=shopList();
  const cats=[];
  for(const it of data.items||[]){if(!cats.some(c=>c.id===it.category))cats.push({id:it.category,label:catLabel(it.category)});}
  const items=(data.items||[]).filter(it=>it.category===shopCat);
  const tabs=cats.map(c=>'<button type="button" role="tab" aria-selected="'+(c.id===shopCat)+'" data-scat="'+esc(c.id)+'">'+esc(c.label)+'</button>').join('');
  const rows=items.map(it=>{
   const approx=it.approximate?' <i class="micro">perkiraan</i>':'';
   return '<li class="njh-s2-row"><div class="njh-s2-main"><b>'+esc(it.label)+'</b><small>'+rp(it.price)+(it.unit?' / '+esc(it.unit):'')+approx+'</small></div>'+
    '<label class="njh-qty">Qty <input type="number" min="1" max="8" value="1" data-qty="'+esc(it.itemId)+'"></label>'+
    '<button type="button" class="btn compact" data-buy="'+esc(it.itemId)+'">Beli</button></li>';
  }).join('')||'<li class="micro">Tidak ada barang di kategori ini.</li>';
  const html='<p class="micro">NJH Mart. Harga masuk Tas. Dompet '+rp(data.wallet??mockCash())+' · Token '+tok.units+'. '+SIM+'</p>'+
   '<div class="njh-tabs" role="tablist">'+tabs+'</div>'+
   '<ul class="njh-s2-list">'+rows+'</ul>'+
   '<div class="w98-well micro" id="njhShop2Msg">Pilih jumlah, lalu Beli.</div>'+
   '<div class="njh-row"><button type="button" class="btn primary" data-close>Tutup</button></div>';
  const w=$('njhShop2')&&!$('njhShop2').hidden?$('njhShop2'):openWin('njhShop2','Minimarket.exe',html,'njh-s2win njh-shop2win');
  if($('njhShop2')){w.querySelector('.w98-title span').innerHTML='Minimarket.exe '+SIM;w.querySelector('.w98-body').innerHTML=html;}
  w.querySelectorAll('[data-scat]').forEach(b=>b.onclick=()=>{shopCat=b.dataset.scat;paint();});
  w.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
   const id=b.getAttribute('data-buy');const qty=Math.max(1,Number(w.querySelector('[data-qty="'+id+'"]')?.value)||1);
   const r=buy(id,qty);
   const msg=$('njhShop2Msg');
   if(r.ok){const total=r.receipt?.total, after=r.receipt?.walletAfter??mockCash();
    msg.textContent=(id===TOKEN_ITEM.id?('Token +'+(CFG.packUnits*qty)+'. '):('Masuk Tas · '+rp(total||0)+'. '))+'(SIMULASI) · sisa '+rp(after);}
   else msg.textContent=r.reason||'Gagal.';
   paintToken();
  });
 };
 paint();
}

let fishSess=null,fishRaf=0,fishPos=0,fishDir=1;
function openFish(){
 const start=fishStart();
 if(!start.ok){N.toast(start.reason||'Tidak bisa mancing.');return;}
 fishSess=start;fishPos=0;fishDir=1;
 const html='<p class="micro">Tekan <b>AKSI</b> / <kbd>E</kbd> saat jarum di zona hijau. Animasi: fishing_cast / fishing_wait (PLACEHOLDER). '+SIM+'</p>'+
  '<div class="njh-fishbar" id="njhFishBar" role="meter" aria-label="Waktu mancing"><i class="zone"></i><em class="needle" id="njhFishNeedle"></em></div>'+
  '<div class="w98-well micro" id="njhFishMsg">Lempar pancing…</div>'+
  '<div class="njh-row"><button type="button" class="btn" id="njhFishCancel" data-close>Batal</button></div>';
 const w=openWin('njhFish','Mancing.exe',html,'njh-s2win njh-small');
 w.querySelector('#njhFishCancel')?.addEventListener('click',()=>{stopFish('cancel');});
 const loop=()=>{
  if(!fishSess)return;
  fishPos+=fishDir*0.012;if(fishPos>=1){fishPos=1;fishDir=-1;}if(fishPos<=0){fishPos=0;fishDir=1;}
  const n=$('njhFishNeedle');if(n)n.style.left=(fishPos*100)+'%';
  fishRaf=requestAnimationFrame(loop);
 };
 fishRaf=requestAnimationFrame(loop);
}
function stopFish(phase){
 if(!fishSess)return;
 if(fishRaf)cancelAnimationFrame(fishRaf);fishRaf=0;
 const r=fishInput(phase,fishPos);
 fishSess=null;
 const box=$('njhFishMsg');
 if(phase==='cancel'){if($('njhFish'))$('njhFish').hidden=true;return;}
 if(r.ok&&r.label){
  openWin('njhFish','Hasil Mancing','<p>Dapat <b>'+esc(r.label)+'</b> <small>('+esc(r.rarity||'')+')</small></p>'+
   '<p class="micro">Masuk Tas. Bisa dimasak di kompor (resep ikan). '+SIM+'</p>'+
   '<div class="njh-row"><button type="button" class="btn primary" data-close>Ke Tas</button></div>','njh-s2win njh-small');
 }else{
  if(box)box.textContent=r.reason||'Ikan kabur.';
  setTimeout(()=>{if($('njhFish'))$('njhFish').hidden=true;},1200);
 }
}
function onAksiFish(e){
 if(!fishSess)return;
 if($('njhFish')?.hidden)return;
 e.preventDefault();e.stopPropagation();
 stopFish('strike');
}
document.addEventListener('keydown',e=>{if(e.key==='e'||e.key==='E')onAksiFish(e);},true);
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('#gameAction'))onAksiFish(e);},true);

function paintToken(){
 const t=token();
 const out=$('njhTokenOut'),fill=$('njhTokenFill'),meter=$('njhTokenMeter');
 const cap=(t.unitsPerPack||CFG.packUnits)*2;
 if(out)out.textContent=t.units+' u';
 if(fill)fill.style.width=Math.max(0,Math.min(100,(t.units/cap)*100))+'%';
 if(meter){meter.classList.toggle('empty',!!t.empty);meter.title='Token listrik kost: '+t.units+' unit. Isi '+(t.unitsPerPack||5)+' unit '+rp(t.price||CFG.packPrice)+(t.mock?' (SIMULASI)':'');}
 const kost=$('njhTokenKost');if(kost)kost.textContent='Token '+t.units;
}
function tokenHTML(){
 const t=token();
 const cap=(t.unitsPerPack||CFG.packUnits)*2;
 return '<fieldset class="njh-group"><legend>Token listrik kost'+(t.mock?' '+SIM:'')+'</legend>'+
  '<div class="njh-need"><label>Token</label><div class="njh-bar" role="meter" aria-valuenow="'+t.units+'"><i style="width:'+Math.max(0,Math.min(100,(t.units/cap)*100))+'%"></i></div><output>'+t.units+' u</output></div>'+
  '<p class="micro">Isi '+(t.unitsPerPack||5)+' unit '+rp(t.price||CFG.packPrice)+'. Drain '+t.drainPerHour+' unit/jam game'+(t.minutesLeft?' · sisa ~'+t.minutesLeft+' mnt':'')+'.'+(t.empty?' <b>'+esc(LOCK_TOKEN)+'</b>':'')+' Isi dari Nokia atau Minimarket.</p>'+
  '<div class="njh-row"><button type="button" class="btn" id="njhTokenBuy">Isi Token '+rp(t.price||CFG.packPrice)+'</button></div></fieldset>';
}
function bindTokenBuy(root){
 root?.querySelector('#njhTokenBuy')?.addEventListener('click',()=>{
  const r=topupToken(5);
  N.toast(r.ok?('Token +'+(r.added||5)+' · bayar '+rp(r.paid||CFG.packPrice)+' (SIMULASI)'):(r.reason||'Gagal'));
  paintToken();
  try{window.NJH98.paintStatus?.();}catch{}
 });
}

function isShopDoor(id){return SHOP_IDS_DOOR.test(String(id||''));}
function tick(){paintToken();}
function openToken(){
 const w=openWin('njhTokenWin','Token.exe',tokenHTML()+'<div class="njh-row"><button type="button" class="btn primary" data-close>Tutup</button></div>','njh-s2win njh-small');
 bindTokenBuy(w);return w;
}
function busy(){return !!fishSess;}

window.NJH98Step2=Object.freeze({
 inventory,moveItem,eatItem,recipes,cook,shopList,shop,buy,checkoutCart,fishSpots,fishStart,fishInput,token,topupToken,
 actions,run,openCook,openStorage,openShop,openFish,openToken,
 forceNear:k=>{forceKind=k||null;if(fishSess)stopFish('cancel');return nearKind();},
 setToken,paintToken,tokenHTML,bindTokenBuy,isShopDoor,tick,busy,
 hookFired:()=>[...hookFired].sort(),
 CFG
});
paintToken();
})();

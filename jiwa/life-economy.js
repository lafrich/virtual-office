/* JIWA Life Economy V1 — editable fishing, market acceptance, and survival sandbox.
 * No production gameplay writes; one-off ownership purchases, no recurring rent.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.JiwaLifeEconomy=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const PREMISES=(typeof module!=='undefined'&&module.exports)?
 require('./interaction-rules.js'):window.JiwaPremises;
const COOKING=(()=>{
 try{if(typeof module!=='undefined'&&module.exports)return require('./njh-cooking-catalog.js');}catch(_e){}
 const g=typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null;
 return (g&&g.JiwaCookingCatalog)||{items:[],recipes:[],fish:[]};
})();
const RELIGIONS=['islam','kristen','katolik','hindu','buddha','konghucu','agnostik','ateis','satanis'];
const ZODIACS=['capricorn','aquarius','pisces','aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius'];
const BUYERS={siomay_batagor:'Bang Siomay / Batagor',pasar_ikan:'Pasar Ikan'};
const copy=x=>JSON.parse(JSON.stringify(x));
const number=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):fallback;};
const FISH=[
 {id:'sapu_sapu',label:'Ikan Sapu-sapu',weight:60,spoilMinutes:180,buyers:{siomay_batagor:450,pasar_ikan:null}},
 {id:'lele',label:'Ikan Lele',weight:20,spoilMinutes:180,buyers:{siomay_batagor:1600,pasar_ikan:2100}},
 {id:'nila',label:'Ikan Nila',weight:12,spoilMinutes:180,buyers:{siomay_batagor:1900,pasar_ikan:2500}},
 {id:'mujair',label:'Ikan Mujair',weight:8,spoilMinutes:180,buyers:{siomay_batagor:1400,pasar_ikan:2000}}
];
const FURNITURE=[
 {id:'bed',label:'Kasur',price:1500000},
 {id:'chair',label:'Kursi',price:350000},
 {id:'stove',label:'Kompor',price:850000},
 {id:'wardrobe',label:'Lemari',price:1000000}
];
const JOBS=[
 {id:'manusia_silver',label:'Manusia Silver',wage:1600,energyCost:12,hygieneCost:8,minutes:25,exp:7,minHygiene:0},
 {id:'pak_ogah',label:'Pak Ogah',wage:2500,energyCost:10,hygieneCost:4,minutes:20,exp:7,minHygiene:0},
 {id:'kang_parkir',label:'Kang Parkir',wage:2100,energyCost:8,hygieneCost:3,minutes:18,exp:6,minHygiene:0},
 {id:'kantor_premium',label:'Kerja Premium',wage:4500,energyCost:12,hygieneCost:2,minutes:28,exp:8,minHygiene:70}
];
function defaults(){return {
 version:1,identity:{religion:'islam',zodiac:'capricorn'},
 gates:{friendsV2:false,socialV2:false,satanicEvilRouteV2:false},
 settings:{bagSlots:8,homeStorageSlots:24,fishEnergy:8,fishMinutes:12,
 coffeePrice:5000,teaPrice:3000,streetFoodPrice:2500,wartegMealPrice:12000,
 roomPrice:700000,fridgePrice:2000000,tokenPrice:20000,tokenUnits:5,fridgeCoolingMultiplier:2,
 faintRestMinutes:30,arrestMoralThreshold:15,
 publicShowerFee:500,publicShowerRecovery:35,homeShowerRecovery:70,
 publicToiletPenalty:5,hoboSleepRecovery:30,homeSleepRecovery:65,
 passiveEnergyMinutes:60,passiveBladderMinutes:20,passiveHygieneMinutes:90,
 passiveFullnessMinutes:35,faintRecoveryEnergy:25,tokenDurationMinutes:60,
 // Step 2: kost base electricity load, game minutes per token unit (240 = 0.25 unit/hour, perkiraan).
 tokenBaseDrainMinutes:240,
 realSecondsPerGameMinute:8,seatRestEnergy:3},
 fish:copy(FISH),jobs:copy(JOBS),activities:[],worldEntities:[],
 cooking:cookingDefaults()
};}
// Step 2 (NJH): minimarket items, recipes and extra fish from jiwa/njh-cooking-catalog.js.
// Prices may be overridden per item id in config.cooking.prices {itemId:Rp}.
// Kost electricity token sold at the minimarket. Not a bag item: buying it tops up powerTokens.
// Price/units follow settings.tokenPrice / tokenUnits (synced in normalize).
const TOKEN_ITEM=Object.freeze({id:'token_listrik',label:'Token listrik (5 unit)',category:'token',price:20000,unit:'paket',
 spoilMinutes:null,storeIn:[],source:['supermarket'],species:'token',approximate:false,icon:null,tokenUnits:5});
function cookingDefaults(){
 const items=copy(COOKING.items||[]);if(!items.some(i=>i.id===TOKEN_ITEM.id))items.push(copy(TOKEN_ITEM));
 return {items,recipes:copy(COOKING.recipes||[]),fish:copy(COOKING.fish||[]),
  shop:copy(COOKING.shop||{}),iconBase:COOKING.iconBase||'',prices:{}};
}
function normalizeCooking(src){
 const base=cookingDefaults(),prices=src&&src.prices&&typeof src.prices==='object'?src.prices:{};
 for(const it of base.items){
  if(Object.prototype.hasOwnProperty.call(prices,it.id)){const v=Number(prices[it.id]);if(Number.isFinite(v)&&v>=0)it.price=Math.round(v);}
 }
 base.prices=Object.fromEntries(Object.entries(prices).filter(([k,v])=>/^[a-z0-9_]{1,64}$/.test(k)&&Number.isFinite(Number(v))));
 return base;
}
function normalize(raw){
 const base=defaults(),source=raw&&typeof raw==='object'?raw:{},s=source.settings||{};
 const PRICE_KEYS={coffeePrice:1,teaPrice:1,streetFoodPrice:1,wartegMealPrice:1,roomPrice:1,fridgePrice:1,tokenPrice:1,publicShowerFee:1};
 for(const key of Object.keys(base.settings)){
   if(key==='bagSlots'||key==='homeStorageSlots')continue;
   const cap=PRICE_KEYS[key]?1e9:100000;
   base.settings[key]=number(s[key],key==='arrestMoralThreshold'?0:1,cap,base.settings[key]);
 }
 base.settings.arrestMoralThreshold=number(s.arrestMoralThreshold,0,50,15);
 const identity=source.identity||{};
 if(RELIGIONS.includes(identity.religion)&&identity.religion!=='satanis')base.identity.religion=identity.religion;
 if(ZODIACS.includes(identity.zodiac))base.identity.zodiac=identity.zodiac;
 const provided=new Map((Array.isArray(source.fish)?source.fish:[]).filter(v=>v&&v.id).map(v=>[v.id,v]));
 base.fish=FISH.map(d=>{
  const p=provided.get(d.id)||{},buyers={};
  for(const id of Object.keys(BUYERS)){
   const value=p.buyers&&Object.prototype.hasOwnProperty.call(p.buyers,id)?p.buyers[id]:d.buyers[id];
   buyers[id]=value===null||value===''?null:number(value,0,1000000,d.buyers[id]||0);
  }
  return {id:d.id,label:d.label,weight:number(p.weight,0,10000,d.weight),
   spoilMinutes:number(p.spoilMinutes,1,100000,d.spoilMinutes),buyers};
 });
 if(!base.fish.some(f=>f.weight>0))base.fish=copy(FISH);
 base.cooking=normalizeCooking(source.cooking);
 {const tk=base.cooking.items.find(i=>i.id===TOKEN_ITEM.id);if(tk){tk.price=base.settings.tokenPrice;tk.tokenUnits=base.settings.tokenUnits;tk.label='Token listrik ('+base.settings.tokenUnits+' unit)';}}
 const incomingJobs=new Map((Array.isArray(source.jobs)?source.jobs:[]).filter(j=>j&&j.id).map(j=>[j.id,j]));
 base.jobs=JOBS.map(d=>{
  const next=incomingJobs.get(d.id)||{};
  return {id:d.id,label:d.label,wage:number(next.wage,0,1000000,d.wage),
   energyCost:number(next.energyCost,0,100,d.energyCost),
   hygieneCost:number(next.hygieneCost,0,100,d.hygieneCost),
   minutes:number(next.minutes,1,100000,d.minutes),exp:number(next.exp,0,100,d.exp),
   minHygiene:number(next.minHygiene,0,100,d.minHygiene)};
 });
 // Editable activity catalog is global and stored separately from legacy
 // wages/jobs. Only published enabled activities can be executed by Semesta.
 base.worldEntities=(Array.isArray(source.worldEntities)?source.worldEntities:[]).slice(0,300)
  .map(PREMISES.worldRule).filter(r=>r.enabled===true);
 base.activities=(Array.isArray(source.activities)?source.activities:[]).slice(0,300)
  .filter(a=>a&&/^[a-z0-9_-]{1,64}$/.test(a.id)&&a.enabled===true)
  .map(a=>({
   ...a,tier:PREMISES.cfg(a.category,a.tier||PREMISES.infer(a.category,a)).tier.id,
   minExp:number(a.minExp,0,100,0),
   minEnergy:number(a.minEnergy,0,100,0),
   minHygiene:number(a.minHygiene,0,100,0),
   durationMinutes:number(a.durationMinutes,1,4320,20),
   moneyDelta:number(a.moneyDelta,-1e9,1e9,0),
   grantType:['none','inventory','furniture','room','prop'].includes(a.grantType)?a.grantType:'none',
   riskPercent:number(a.riskPercent,0,100,0),
   detentionMinutes:number(a.detentionMinutes,0,4320,0),
   statEffects:Object.fromEntries(['energy','fullness','hygiene','bladder','moral','experience']
    .map(k=>[k,number(a.statEffects?.[k],-100,100,0)])),
   ingredients:(Array.isArray(a.ingredients)?a.ingredients:[]).slice(0,12)
  }));
 return base;
}
function stateFrom(existing,config){
 const s=copy(existing||{}),c=normalize(config);
 s.inventory=Array.isArray(s.inventory)?s.inventory:[];
 s.transactions=Array.isArray(s.transactions)?s.transactions.slice(-40).filter(t=>t&&Number.isFinite(Number(t.delta))).map(t=>{
  const day=Number.isFinite(Number(t.day))?Math.max(1,Math.floor(Number(t.day))):Math.floor(Math.max(0,Number(t.minute)||0)/1440)+1;
  return t.day===day?t:Object.assign({},t,{day});
 }):[];
 s.homeStorage=Array.isArray(s.homeStorage)?s.homeStorage:[];
 s.itemMeta=s.itemMeta&&typeof s.itemMeta==='object'?s.itemMeta:{};
 s.fridge=Array.isArray(s.fridge)?s.fridge:[];
 s.housing=s.housing&&typeof s.housing==='object'?s.housing:{room:false,fridge:false};
 s.homeAccess=s.housing.room===true;
 s.spawnPosition=s.spawnPosition&&Number.isFinite(Number(s.spawnPosition.x))&&Number.isFinite(Number(s.spawnPosition.z))?s.spawnPosition:null;
 s.elapsedMinutes=number(s.elapsedMinutes,0,1e9,0);
 s.itemSequence=number(s.itemSequence,0,1e9,0);
 s.powerTokens=number(s.powerTokens,0,1e9,0);
 s.tokenUseMinutes=number(s.tokenUseMinutes,0,1e9,0);
 s.tokenBaseMinutes=number(s.tokenBaseMinutes,0,1e9,0);
 s.faintCount=number(s.faintCount,0,1e9,0);
 s.furniture=Array.isArray(s.furniture)?s.furniture:[];
 s.detained=s.detained===true;
 s.arrestGraceMinutes=number(s.arrestGraceMinutes,0,100000,0);
 s.luckClaims=number(s.luckClaims,0,1e9,0);
 s.luckCooldownUntil=number(s.luckCooldownUntil,0,1e9,0);
 s.restMinutes=number(s.restMinutes,0,1e9,0);
 s.detentionMinutes=number(s.detentionMinutes,0,1e9,0);
 for(const [k,def] of Object.entries({wallet:6000,energy:80,hygiene:75,bladder:20,fullness:70,moral:50,experience:0})){
  s[k]=number(s[k],0,k==='wallet'?1e9:100,def);
 }
 s.actionCounts=s.actionCounts&&typeof s.actionCounts==='object'?s.actionCounts:{};
 s.quests=s.quests&&typeof s.quests==='object'?s.quests:{};
 s.messages=Array.isArray(s.messages)?s.messages.slice(0,40):[];
 s.dayReports=s.dayReports&&typeof s.dayReports==='object'?s.dayReports:{};
 s.lastFartAt=Number.isFinite(Number(s.lastFartAt))?Number(s.lastFartAt):-999;
 s.identity=s.identityChosen===true?{...c.identity,...(s.identity&&typeof s.identity==='object'?s.identity:{})}:copy(c.identity);
 if(!RELIGIONS.includes(s.identity.religion)||s.identity.religion==='satanis')s.identity.religion=c.identity.religion;
 if(!ZODIACS.includes(s.identity.zodiac))s.identity.zodiac=c.identity.zodiac;
 return s;
}
function weighted(config,roll){
 const fish=normalize(config).fish,total=fish.reduce((v,f)=>v+f.weight,0);
 let remaining=Math.max(0,Math.min(.999999999,Number.isFinite(Number(roll))?Number(roll):Math.random()))*total;
 for(const f of fish){remaining-=f.weight;if(remaining<0)return f;}
 return fish[fish.length-1];
}
// Legacy FISH (4, used by the instant 'fish' roll) plus catalog fish (Gerak 19; the first 4 identical).
function allFish(c){
 const out=(c.fish||[]).slice(),seen=new Set(out.map(f=>f.id));
 for(const f of (c.cooking?.fish||[]))if(!seen.has(f.id)){seen.add(f.id);out.push(f);}
 return out;
}
function itemDef(c,id){return (c.cooking?.items||[]).find(x=>x.id===id)||null;}
function activeItem(config,s,id){
 const meta=s.itemMeta[id];
 if(!meta)return {ok:false,reason:'Item tidak ditemukan'};
 const c=config&&config.cooking&&Array.isArray(config.fish)?config:normalize(config);
 const fish=allFish(c).find(f=>f.id===meta.species);
 const item=fish?null:itemDef(c,meta.species);
 if(!fish&&!item&&meta.species!=='buah')return {ok:false,reason:'Barang tidak termasuk makanan segar'};
 const limit=meta.expiresAt;
 return {ok:true,fish,item,meta,spoiled:s.elapsedMinutes>=limit};
}
function speedFactor(s){
 return s.detained||s.restMinutes>0||s.detentionMinutes>0||s.energy<=0?0:(s.energy>=30?1:.28+.72*s.energy/30);
}
function doAction(config,previous,action,args={}){
 const c=normalize(config),s=stateFrom(previous,c),setting=c.settings,changes=[];
 const beforeWallet=s.wallet;
 const out={}; // step-2 extra result fields (receipt, dish, catch...)
 const reject=reason=>({ok:false,reason,state:copy(previous||s),changes:[]});
 const stat=(k,v)=>{s[k]=Math.max(0,Math.min(100,s[k]+v));changes.push(k+' '+(v>=0?'+':'')+v);};
 const clock=m=>{
  m=number(m,0,100000,0);if(m===0)return;
  const before=s.elapsedMinutes,wasFaint=s.restMinutes>0;
  if(s.housing.fridge&&s.fridge.length&&s.powerTokens>0){
   const powered=Math.min(m,Math.max(0,s.powerTokens*setting.tokenDurationMinutes-s.tokenUseMinutes));
   for(const id of s.fridge){const meta=s.itemMeta[id];if(meta)meta.expiresAt+=powered*setting.fridgeCoolingMultiplier;}
   s.tokenUseMinutes+=powered;
   while(s.tokenUseMinutes>=setting.tokenDurationMinutes&&s.powerTokens>0){
    s.powerTokens--;s.tokenUseMinutes-=setting.tokenDurationMinutes;
   }
   if(s.powerTokens===0&&powered<m)changes.push('Token listrik habis: kulkas berhenti mendinginkan');
  }
  // Step 2: the kost draws a base load on game time (lamp/fan), on top of fridge cooling.
  if(s.housing.room&&s.powerTokens>0&&setting.tokenBaseDrainMinutes>0){
   s.tokenBaseMinutes+=m;
   while(s.tokenBaseMinutes>=setting.tokenBaseDrainMinutes&&s.powerTokens>0){
    s.powerTokens--;s.tokenBaseMinutes-=setting.tokenBaseDrainMinutes;
   }
   if(s.powerTokens===0){s.tokenBaseMinutes=0;changes.push('Token listrik habis: kulkas, lemari dan kompor mati');}
  }
  s.elapsedMinutes+=m;
  s.restMinutes=Math.max(0,s.restMinutes-m);
  s.detentionMinutes=Math.max(0,s.detentionMinutes-m);
  s.arrestGraceMinutes=Math.max(0,s.arrestGraceMinutes-m);
  const count=rate=>Math.floor(s.elapsedMinutes/rate)-Math.floor(before/rate);
  const energyUse=wasFaint?0:count(setting.passiveEnergyMinutes);
  const hygieneUse=count(setting.passiveHygieneMinutes);
  const bladderGain=count(setting.passiveBladderMinutes);
  const fullnessUse=count(setting.passiveFullnessMinutes);
  if(energyUse)s.energy=Math.max(0,s.energy-energyUse);
  if(hygieneUse)s.hygiene=Math.max(0,s.hygiene-hygieneUse);
  if(bladderGain)s.bladder=Math.min(100,s.bladder+bladderGain*3);
  if(fullnessUse)s.fullness=Math.max(0,s.fullness-fullnessUse*2);
  if(s.fullness===0&&!wasFaint)s.energy=Math.max(0,s.energy-1);
  if(wasFaint&&s.restMinutes===0){
   s.energy=Math.max(s.energy,setting.faintRecoveryEnergy);
   changes.push('BED REST SELESAI · energi pulih '+s.energy);
  }
  changes.push('waktu +'+m+'m');
 };
 const spend=amount=>{if(s.wallet<amount)return false;s.wallet-=amount;changes.push('uang -Rp'+amount);return true;};
 const add=(type,label,minutes)=>{if(s.inventory.length>=setting.bagSlots)return null;
  const id='life:'+type+':'+(++s.itemSequence);
  s.inventory.push(id);s.itemMeta[id]={species:type,label,expiresAt:s.elapsedMinutes+minutes,inFridge:false};
  changes.push('dapat '+label);return id;};
 const NEVER=1e8; // non-perishable items (spoilMinutes null)
 const keepMinutes=def=>def&&Number.isFinite(Number(def.spoilMinutes))&&Number(def.spoilMinutes)>0?Number(def.spoilMinutes):NEVER;
 const containers={bag:{list:s.inventory,slots:setting.bagSlots,label:'Tas'},
  fridge:{list:s.fridge,slots:setting.homeStorageSlots,label:'Kulkas'},
  storage:{list:s.homeStorage,slots:setting.homeStorageSlots,label:'Lemari'}};
 const powerGate=box=>{
  if(box==='bag')return null;
  if(!s.housing.room)return 'Perlu kost dahulu.';
  if(box==='fridge'&&!s.housing.fridge)return 'Belum punya kulkas.';
  if(s.powerTokens<=0)return 'Token listrik habis. Isi token dulu (Rp'+setting.tokenPrice.toLocaleString('id-ID')+' / '+setting.tokenUnits+' unit).';
  return null;
 };
 if(!['advance_time','rest','respawn'].includes(action)&&(s.restMinutes>0||s.detentionMinutes>0))
  return reject('Masih bed rest / menjalani hukuman. Majukan waktu terlebih dahulu.');
 if(s.detained&&!['fine','community_service','advance_time'].includes(action))return reject('Ditahan hansip: bayar denda atau bersihkan gorong-gorong.');
 switch(action){
 case 'world_interaction': {
  const rule=c.worldEntities.find(v=>v.id===String(args.ruleId||''));
  if(!rule||rule.operation!=='ambient')return reject('Interaksi objek belum diaktifkan.');
  const staged={category:rule.category,tier:rule.tier,moneyDelta:rule.moneyDelta,
   durationMinutes:rule.durationMinutes,minExp:rule.minExp,
   riskPercent:rule.riskPercent,statEffects:rule.statEffects,ingredients:[]};
  const invalid=PREMISES.violations(staged);
  if(invalid.length)return reject('Aturan '+rule.label+' tidak sesuai level: '+invalid[0].key);
  if(s.experience<rule.minExp)return reject('Perlu EXP '+rule.minExp);
  if(s.wallet<Math.max(0,-rule.moneyDelta))return reject('Uang tidak cukup');
  if(rule.moneyDelta<0)spend(-rule.moneyDelta);
  else if(rule.moneyDelta>0){s.wallet+=rule.moneyDelta;changes.push('uang +Rp'+rule.moneyDelta);}
  clock(rule.durationMinutes);
  for(const [key,amount] of Object.entries(rule.statEffects||{}))if(amount)stat(key,amount);
  if(rule.riskPercent>0){
   const roll=Number.isFinite(Number(args.riskRoll))?Number(args.riskRoll):Math.random();
   if(roll<rule.riskPercent/100){
    s.detained=true;s.detentionMinutes=Math.max(s.detentionMinutes,60);
    changes.push('tertangkap akibat '+rule.label);
   }
  }
  changes.push('aksi objek: '+rule.label);break;
 }
 case 'world_ambient': {
  const rule=c.worldEntities.find(r=>r.id===String(args.ruleId||'')&&r.operation==='ambient');
  if(!rule)return reject('Interaksi objek belum diaktifkan di Jiwa.');
  const invalid=PREMISES.violations({...rule,ingredients:[]});
  if(invalid.length)return reject('Aturan '+rule.label+' tidak sesuai batas tier: '+invalid[0].key);
  if(s.experience<rule.minExp)return reject('Perlu EXP '+rule.minExp);
  if(s.wallet<Math.max(0,-rule.moneyDelta))return reject('Uang tidak cukup');
  if(rule.moneyDelta<0)spend(-rule.moneyDelta);
  else if(rule.moneyDelta>0){s.wallet+=rule.moneyDelta;changes.push('uang +Rp'+rule.moneyDelta);}
  clock(rule.durationMinutes);
  for(const [key,amount] of Object.entries(rule.statEffects||{}))if(amount)stat(key,amount);
  if(rule.riskPercent>0){
   const roll=Number.isFinite(Number(args.riskRoll))?Number(args.riskRoll):Math.random();
   if(roll<rule.riskPercent/100){
    s.detained=true;s.detentionMinutes=Math.max(s.detentionMinutes,60);
    changes.push('tertangkap akibat '+rule.label);
   }
  }
  changes.push('aksi objek: '+rule.label);break;
 }
 case 'configured_activity': {
  const id=String(args.activityId||'');
  const a=c.activities.find(v=>v.id===id);
  if(!a)return reject('Aktivitas belum diaktifkan dalam Jiwa.');
  const failures=PREMISES.violations(a);
  if(failures.length){
   const f=failures[0];return reject('Tier '+a.tier+' membatasi '+f.key+' pada '+f.min+'–'+f.max+'. Perbaiki di Jiwa.');
  }
  if(s.experience<a.minExp)return reject('Perlu EXP '+a.minExp+' (sekarang '+s.experience+').');
  if(s.energy<a.minEnergy)return reject('Energi belum memenuhi syarat '+a.minEnergy+'.');
  if(s.hygiene<a.minHygiene)return reject('Kebersihan belum memenuhi syarat '+a.minHygiene+'.');
  const cost=Math.max(0,-a.moneyDelta);
  if(s.wallet<cost)return reject('Uang tidak cukup untuk aktivitas ini.');
  const parts=[];
  for(const ingredient of a.ingredients||[]){
   const id=s.inventory.find(i=>i===ingredient||s.itemMeta?.[i]?.species===ingredient);
   if(!id||parts.includes(id))return reject('Bahan belum lengkap: '+ingredient);
   parts.push(id);
  }
  if(a.outputItem&&['none','inventory','prop'].includes(a.grantType)&&
     s.inventory.length-parts.length>=setting.bagSlots)
   return reject('Tas penuh untuk hasil aktivitas.');
  if(a.grantType==='room'&&s.housing.room)return reject('Akses kost sudah dimiliki.');
  if(a.grantType==='furniture'&&(!s.housing.room||!a.outputItem))
   return reject('Perlu kost dan ID furnitur sebelum membeli.');
  if(a.grantType==='furniture'&&s.furniture.includes(a.outputItem))
   return reject('Furnitur sudah dimiliki.');
  if(parts.length){
   for(const id of parts){s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];}
   changes.push('bahan terpakai: '+a.ingredients.join(', '));
  }
  if(a.moneyDelta<0)spend(-a.moneyDelta);
  else if(a.moneyDelta>0){s.wallet=Math.min(1e9,s.wallet+a.moneyDelta);changes.push('uang +Rp'+a.moneyDelta);}
  clock(a.durationMinutes);
  for(const k of ['energy','fullness','hygiene','bladder','moral','experience']){
   const diff=a.statEffects[k]||0;if(diff)stat(k,diff);
  }
  if(a.grantType==='room'){
   s.housing.room=true;s.homeAccess=true;
   if(args.roomSpawn&&Number.isFinite(Number(args.roomSpawn.x))&&Number.isFinite(Number(args.roomSpawn.z)))
    s.housing.roomPosition={...args.roomSpawn};
   changes.push('akses kost aktif');
  }else if(a.grantType==='furniture'){
   s.furniture.push(a.outputItem);changes.push('furnitur '+a.outputItem+' dimiliki');
  }else if(a.outputItem&&['none','inventory','prop'].includes(a.grantType)){
   add(a.outputItem,a.outputLabel||a.outputItem,999999);
  }
  // Optional consequences for immoral choices or explicitly configured jail.
  // Roll supplied for deterministic tests; normal gameplay uses Math.random.
  const roll=Number.isFinite(Number(args.riskRoll))?Math.max(0,Math.min(1,Number(args.riskRoll))):Math.random();
  if(a.riskPercent>0&&roll<a.riskPercent/100){
   s.detained=true;
   s.detentionMinutes=Math.max(s.detentionMinutes,a.detentionMinutes||60);
   changes.push('tertangkap · hukuman '+s.detentionMinutes+' menit');
  }else if(a.category==='punishment'&&a.detentionMinutes>0){
   s.detentionMinutes=Math.max(s.detentionMinutes,a.detentionMinutes);
   changes.push('menjalani hukuman '+a.detentionMinutes+' menit');
  }
  changes.push('aktivitas '+String(a.label||a.id).slice(0,96));
  break;
 }
 case 'set_identity':{
  const religion=String(args.religion||'');
  const zodiac=String(args.zodiac||'');
  if(religion&&(!RELIGIONS.includes(religion)||religion==='satanis'))
   return reject('Pilihan agama tidak tersedia di V1.');
  if(zodiac&&!ZODIACS.includes(zodiac))return reject('Zodiak tidak dikenal.');
  if(!religion&&!zodiac)return reject('Pilih agama atau zodiak.');
  if(religion){s.identity.religion=religion;changes.push('agama '+religion);}
  if(zodiac){s.identity.zodiac=zodiac;changes.push('zodiak '+zodiac);}
  s.identityChosen=true;break;
 }
 case 'walk': {
  const units=number(args.units,1,20,1);
  stat('energy',-units);clock(units);break;
 }
 case 'scavenge': {
  if(s.inventory.length>=setting.bagSlots)return reject('Tas penuh.');
  if(s.energy<4)return reject('Energi tidak cukup untuk mulung.');
  clock(8);stat('energy',-4);
  add('barang_bekas','Barang bekas',999999);break;
 }
 case 'sell_loak':{
  const id=String(args.itemId||'');
  if(!s.inventory.includes(id))return reject('Barang tidak ada di tas.');
  const meta=s.itemMeta[id];
  if(!meta||meta.species!=='barang_bekas')return reject('Toko Loak hanya menerima barang bekas pada tes ini.');
  s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];
  s.wallet+=1000;changes.push('jual barang bekas +Rp1000');break;
 }
 case 'buy_furniture':{
  if(!s.housing.room)return reject('Beli akses kost sebelum membeli furnitur.');
  const id=String(args.itemId||'').slice(0,48);
  const product=FURNITURE.find(x=>x.id===id);
  if(!product)return reject('Jenis furnitur belum tersedia.');
  if(s.furniture.includes(id))return reject('Furnitur ini sudah dibeli.');
  if(!spend(product.price))return reject('Uang tidak cukup.');
  s.furniture.push(id);changes.push('furnitur '+id+' masuk ke kost');break;
 }
 case 'cook':{
  if(!s.housing.room||!s.furniture.includes('stove'))return reject('Masak membutuhkan kost dan kompor.');
  if(s.powerTokens<1)return reject('Token listrik habis.');
  const id=String(args.itemId||'');
  if(!s.inventory.includes(id))return reject('Bahan makanan tidak ada di tas.');
  const info=activeItem(c,s,id);if(!info.ok||!info.fish||info.spoiled)return reject('Ikan sudah busuk / tidak bisa dimasak.');
  clock(20);s.powerTokens-=1;
  s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];
  stat('energy',18);stat('fullness',40);stat('bladder',10);
  changes.push('masak dan makan '+info.fish.label);break;
 }
 case 'luck_find':{
  if(s.elapsedMinutes<s.luckCooldownUntil)return reject('Belum ada kesempatan rezeki baru.');
  const roll=Number.isFinite(Number(args.roll))?Math.max(0,Math.min(1,Number(args.roll))):Math.random();
  s.luckClaims++;s.luckCooldownUntil=s.elapsedMinutes+40;
  const threshold=Math.min(.35,.05+s.moral/1000*2);
  if(roll<threshold){s.wallet+=500;changes.push('rezeki tak terduga +Rp500');}
  else if(s.moral<25&&roll>.85){
   const loss=Math.min(200,s.wallet);s.wallet-=loss;s.hygiene=Math.max(0,s.hygiene-3);
   changes.push('NASIB BURUK · uang -Rp'+loss+' · kebersihan -3');
  }else changes.push('tidak menemukan rezeki');
  break;
 }
 case 'arrest':{
  if(s.moral>=setting.arrestMoralThreshold)return reject('Tidak ada alasan penahanan.');
  if(!args.witnessed)return reject('Tidak ada hansip yang melihat.');
  if(s.detained)return reject('Sudah ditahan.');
  if(s.arrestGraceMinutes>0)return reject('Masih masa tenggang setelah hukuman.');
  s.detained=true;changes.push('hansip menangkap pemain');break;
 }
 case 'respawn':{
  if(s.housing.room){
   const room=args.roomSpawn&&Number.isFinite(Number(args.roomSpawn.x))&&Number.isFinite(Number(args.roomSpawn.z))?args.roomSpawn:null;
   const saved=s.housing.roomPosition;
   const valid=room||saved;
   if(!valid)return reject('Kost aktif, tetapi titik kamar belum terhubung. Hubungkan lokasi kost atau placeholder sandbox.');
   s.spawn='home';s.spawnPosition={x:Number(valid.x),z:Number(valid.z),id:String(valid.id||'owned_room').slice(0,90),placeholder:valid.placeholder===true};
   changes.push('respawn di kost '+s.spawnPosition.id);
  }else{
   const raw=(Array.isArray(args.tents)?args.tents:[]).filter(p=>p&&Number.isFinite(Number(p.x))&&Number.isFinite(Number(p.z))).slice(0,200);
   const b=args.bounds||{minX:-20,maxX:20,minZ:-20,maxZ:20};
   const minX=number(b.minX,-1e6,1e6,-20),maxX=Math.max(minX+8,number(b.maxX,-1e6,1e6,20));
   const minZ=number(b.minZ,-1e6,1e6,-20),maxZ=Math.max(minZ+8,number(b.maxZ,-1e6,1e6,20));
   const pad=3,midX=(minX+maxX)/2,midZ=(minZ+maxZ)/2;
   const pool=raw.length?raw:[
    {id:'hobo_tent_west',x:minX+pad,z:midZ,placeholder:true},
    {id:'hobo_tent_east',x:maxX-pad,z:midZ,placeholder:true},
    {id:'hobo_tent_north',x:midX,z:minZ+pad,placeholder:true},
    {id:'hobo_tent_south',x:midX,z:maxZ-pad,placeholder:true}
   ];
   const roll=Number.isFinite(Number(args.roll))?Math.max(0,Math.min(.999999,Number(args.roll))):Math.random();
   const tent=pool[Math.floor(roll*pool.length)];
   s.spawn='hobo';s.spawnPosition={id:String(tent.id||'hobo_tent').slice(0,90),x:Number(tent.x),z:Number(tent.z),placeholder:tent.placeholder===true};
   changes.push('hobo respawn di '+s.spawnPosition.id+(s.spawnPosition.placeholder?' (placeholder)':''));
  }
  break;
 }
 case 'fish': {
  if(!args.spotId)return reject('Perlu titik mancing di perairan.');
  if(s.inventory.length>=setting.bagSlots)return reject('Tas penuh (8 slot).');
  if(s.energy<setting.fishEnergy)return reject('Energi tidak cukup untuk mancing.');
  const f=weighted(c,args.roll);
  clock(setting.fishMinutes);stat('energy',-setting.fishEnergy);
  add(f.id,f.label,f.spoilMinutes);
  changes.push('hasil mancing di '+String(args.spotId).slice(0,60));
  break;
 }
 case 'store_home':{
  if(!s.housing.room)return reject('Perlu akses kost untuk menyimpan barang.');
  const id=String(args.itemId||'');
  if(!s.inventory.includes(id))return reject('Barang tidak ada di tas.');
  if(s.homeStorage.length>=setting.homeStorageSlots)return reject('Penyimpanan kost penuh.');
  s.inventory.splice(s.inventory.indexOf(id),1);s.homeStorage.push(id);
  changes.push('simpan barang di kost');break;
 }
 case 'take_home':{
  if(!s.housing.room)return reject('Perlu akses kost.');
  const id=String(args.itemId||'');
  if(!s.homeStorage.includes(id))return reject('Barang tidak ada di penyimpanan kost.');
  if(s.inventory.length>=setting.bagSlots)return reject('Tas penuh.');
  s.homeStorage.splice(s.homeStorage.indexOf(id),1);s.inventory.push(id);
  changes.push('ambil barang dari kost');break;
 }
 case 'eat_item':{
  const id=String(args.itemId||'');
  if(!s.inventory.includes(id))return reject('Makanan tidak ada di tas.');
  const info=activeItem(c,s,id);
  if(!info.ok)return reject(info.reason);
  if(info.spoiled)return reject('Makanan sudah busuk. Buang dari tas.');
  if(info.meta.species!=='buah'){
   if(info.fish)return reject('Ikan mentah harus dimasak dahulu.');
   const def=info.item,rec=(c.cooking?.recipes||[]).find(r=>r.outputItem===info.meta.species);
   const eff=def?.category==='dish'||rec?(rec?.statEffectsEat||def?.statEffects):def?.statEffects;
   if(!eff)return reject('Bahan mentah, masak dulu.');
   const mult={sempurna:1.5,bagus:1.2}[info.meta.quality]||1;
   s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];clock(def?.category==='drink'?3:10);
   const effects={};
   for(const k of ['fullness','energy','moral','hygiene','bladder'])if(eff[k]){const v=Math.round(eff[k]*(eff[k]>0?mult:1));stat(k,v);effects[k]=v;}
   out.effects=effects;out.quality=info.meta.quality||null;out.itemId=info.meta.species;out.label=info.meta.label;
   out.pose=['snack','drink'].includes(def?.category)?'eat_snack':'eat';
   changes.push('makan '+info.meta.label);break;
  }
  s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];
  clock(5);stat('energy',8);stat('fullness',20);stat('bladder',5);
  changes.push('makan buah dari tas');break;
 }
 case 'discard_item':{
  const id=String(args.itemId||'');
  if(!s.inventory.includes(id))return reject('Barang tidak ada di tas.');
  const label=s.itemMeta[id]?.label||'barang';
  s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];
  changes.push('buang '+label);break;
 }
 case 'sell_fish': {
  const id=String(args.itemId||''),buyer=String(args.buyerId||'');
  if(!Object.prototype.hasOwnProperty.call(BUYERS,buyer))return reject('Pembeli belum ada.');
  if(!s.inventory.includes(id))return reject('Ikan tidak ada di tas.');
  const info=activeItem(c,s,id);
  if(!info.ok||!info.fish)return reject('Hanya ikan yang bisa dijual ke pembeli ini.');
  if(info.spoiled)return reject('Ikan sudah busuk; pembeli menolak.');
  const price=info.fish.buyers[buyer];
  if(price===null)return reject(BUYERS[buyer]+' tidak menerima '+info.fish.label+'.');
  if(price<0)return reject('Harga tidak valid.');
  s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];
  s.wallet+=price;changes.push('jual '+info.fish.label+' ke '+BUYERS[buyer]+' +Rp'+price);
  break;
 }
 case 'catch_fruit': {
  if(s.inventory.length>=setting.bagSlots)return reject('Tas penuh.');
  if(s.energy<7)return reject('Energi kurang untuk memanjat.');
  clock(8);stat('energy',-7);add('buah','Buah pohon',120);break;
 }
 case 'advance_time':clock(args.minutes??30);break;
 case 'rest':{
  if(s.restMinutes>0){clock(args.minutes??15);break;}
  if(!args.seatId)return reject('Energi hanya pulih dari makan, kopi atau tidur. Duduk perlu kursi/bangku.');
  clock(12);stat('energy',setting.seatRestEnergy);break;
 }
 case 'eat': {
  const warteg=args.place==='warteg'||args.buyerId==='warteg'||args.warteg===true;
  const fallback=warteg?setting.wartegMealPrice:setting.streetFoodPrice;
  const mealPrice=Number.isFinite(Number(args.price))?Math.max(0,Math.round(Number(args.price))):fallback;
  if(!spend(mealPrice))return reject('Uang tidak cukup.');
  clock(10);stat('energy',12);stat('fullness',30);stat('bladder',12);break;
 }
 case 'coffee': {
  if(!spend(setting.coffeePrice))return reject('Uang tidak cukup.');
  clock(5);stat('energy',20);stat('bladder',25);break;
 }
 case 'tea': {
  if(!spend(setting.teaPrice))return reject('Uang tidak cukup.');
  clock(5);stat('energy',8);stat('fullness',8);stat('bladder',18);break;
 }
 case 'sleep':{
  if(s.restMinutes>0)return reject('Sedang bed rest akibat pingsan. Lanjutkan waktu istirahat.');
  const beforeSleepEnergy=s.energy;
  clock(60);s.energy=beforeSleepEnergy;
  stat('energy',s.housing.room?setting.homeSleepRecovery:setting.hoboSleepRecovery);
  stat('hygiene',s.housing.room?-8:-15);
  changes.push(s.housing.room?'tidur di kost':'tidur di tenda pinggiran kota');break;
 }
 case 'shower':case 'public_shower':case 'home_shower':{
   const home=action==='home_shower'||(action==='shower'&&s.housing.room);
   if(home&&!s.housing.room)return reject('Mandi di kost hanya untuk pemilik akses kamar.');
   if(!home&&!args.facilityId)return reject('Cari lokasi mandi umum di kota.');
   if(!home&&!spend(setting.publicShowerFee))return reject('Uang tidak cukup untuk mandi umum.');
   clock(15);stat('hygiene',home?setting.homeShowerRecovery:setting.publicShowerRecovery);
   changes.push(home?'mandi di kost':'mandi di WC umum');break;
 }
 case 'toilet':case 'public_toilet':case 'home_toilet':{
   const home=action==='home_toilet'||(action==='toilet'&&s.housing.room);
   if(home&&!s.housing.room)return reject('WC kost hanya untuk pemilik akses kamar.');
   if(!home&&!args.facilityId)return reject('Cari WC umum dahulu.');
   clock(4);stat('bladder',-100);
   if(!home)stat('hygiene',-setting.publicToiletPenalty);
   changes.push(home?'WC kost pribadi':'WC umum');break;
 }
 case 'wall_pee':{
  // Aligned to jiwa/interaction-rules.js wall_pee: moral -5, bladder -70, hygiene -5, 3 menit.
  clock(3);stat('bladder',-70);stat('hygiene',-5);stat('moral',-5);
  changes.push('pipis di tembok (moral -5)');break;
 }
 case 'pee_outside':
  return reject('Pipis sembarangan dihapus. Dekati tembok untuk pipis (wall_pee).');
 case 'fart':{
  const wait=1; // 1 menit game (~60 detik waktu game)
  if(s.elapsedMinutes-s.lastFartAt<wait)return reject('Tunggu sebentar sebelum kentut lagi.');
  const witnessed=args.witnessed===true||args.nearNpc===true||Number(args.nearby)>0;
  s.lastFartAt=s.elapsedMinutes;
  if(witnessed){stat('moral',-3);changes.push('kentut di dekat orang (moral -3)');}
  else changes.push('kentut (tidak ada yang dengar)');
  break;
 }
 case 'talk':{
  clock(2);changes.push('ngobrol');break;
 }
 case 'work': {
  const jobId=String(args.jobId||'');
  const job=jobId?c.jobs.find(j=>j.id===jobId):null;
  if(jobId&&!job)return reject('Jenis pekerjaan tidak dikenal di Jiwa.');
  const required=job?.minHygiene??(args.premium?70:0),energy=job?.energyCost??10;
  const wage=job?.wage??(args.premium?4500:2500);
  const duration=job?.minutes??30,exp=job?.exp??7;
  if(s.energy<energy)return reject('Energi tidak cukup untuk bekerja.');
  if(s.hygiene<required)return reject('Pekerjaan ini membutuhkan kebersihan '+required+'.');
  clock(Math.max(5,Math.round(duration/(1+s.experience/100))));
  stat('energy',-energy);
  if(job?.hygieneCost)stat('hygiene',-job.hygieneCost);
  s.wallet+=wage;s.experience=Math.min(100,s.experience+exp);
  changes.push('kerja '+(job?.label||(args.premium?'Premium':'Reguler'))+' · upah +Rp'+wage+' · EXP +'+exp);
  break;
 }
 case 'course':clock(25);s.experience=Math.min(100,s.experience+12);changes.push('EXP +12');break;
 case 'charity': {
  if(!spend(1000))return reject('Uang tidak cukup untuk sedekah.');
  stat('moral',5);break;
 }
 case 'help':clock(15);stat('energy',-5);stat('moral',5);break;
 case 'worship': {
  if(['ateis','agnostik'].includes(s.identity.religion))return reject('Karakter tidak memilih ibadah agama; moral bisa dinaikkan lewat perbuatan baik.');
  if(!args.placeReligion)return reject('Ibadah harus dilakukan di tempat ibadah yang sesuai.');
  if(args.placeReligion!==s.identity.religion)return reject('Tempat ibadah tidak sesuai pilihan agama.');
  clock(15);stat('moral',5);break;
 }
 case 'buy_room': {
  if(s.housing.room)return reject('Kost sudah dimiliki / diakses.');
  if(!spend(setting.roomPrice))return reject('Uang tidak cukup.');
  s.housing.room=true;s.homeAccess=true;
  const room=args.roomSpawn;
  if(room&&Number.isFinite(Number(room.x))&&Number.isFinite(Number(room.z)))
   s.housing.roomPosition={x:Number(room.x),z:Number(room.z),id:String(room.id||'sandbox_kost').slice(0,90),placeholder:room.placeholder===true};
  changes.push('kost aktif selamanya (tanpa sewa berkala)');break;
 }
 case 'buy_fridge': {
  if(!s.housing.room)return reject('Perlu kost dahulu.');
  if(s.housing.fridge)return reject('Kulkas sudah dibeli.');
  if(!spend(setting.fridgePrice))return reject('Uang tidak cukup.');
  s.housing.fridge=true;changes.push('kulkas dibeli sekali');break;
 }
 case 'buy_token': {
  if(!s.housing.room)return reject('Perlu kost dahulu.');
  if(!spend(setting.tokenPrice))return reject('Uang tidak cukup.');
  s.powerTokens+=setting.tokenUnits;changes.push('token listrik +'+setting.tokenUnits);break;
 }
 case 'store_fridge': {
  const id=String(args.itemId||'');
  if(!s.housing.fridge)return reject('Belum punya kulkas.');
  if(s.powerTokens<=0)return reject('Token listrik habis.');
  if(!s.inventory.includes(id))return reject('Item tidak ada di tas.');
  const info=activeItem(c,s,id);if(!info.ok||info.spoiled)return reject('Barang tidak bisa disimpan karena sudah busuk.');
  s.inventory.splice(s.inventory.indexOf(id),1);s.fridge.push(id);
  info.meta.inFridge=true;changes.push('masuk kulkas; pendinginan mengonsumsi token sepanjang waktu');break;
 }
 case 'take_fridge': {
  const id=String(args.itemId||'');
  if(!s.fridge.includes(id))return reject('Barang tidak ada di kulkas.');
  if(s.inventory.length>=setting.bagSlots)return reject('Tas penuh.');
  s.fridge.splice(s.fridge.indexOf(id),1);s.inventory.push(id);
  if(s.itemMeta[id])s.itemMeta[id].inFridge=false;
  changes.push('ambil dari kulkas');break;
 }

 /* ===== Step 2 (NJH): minimarket, containers, dishes, fishing catch, token top-up ===== */
 case 'shop_buy': {
  const cart=(Array.isArray(args.cart)?args.cart:[{itemId:args.itemId,qty:args.qty}]).slice(0,20);
  const lines=[];let count=0,total=0;
  for(const row of cart){
   const id=String(row&&row.itemId||''),qty=number(row&&row.qty,1,20,1);
   const def=itemDef(c,id);
   if(!def||!(def.source||[]).includes('supermarket')||!(def.price>0))return reject('Barang tidak dijual di sini.');
   const line=lines.find(l=>l.itemId===id);
   if(line){line.qty+=qty;line.subtotal=line.qty*line.price;}
   else lines.push({itemId:id,label:def.label,qty,price:def.price,subtotal:qty*def.price});
   count+=qty;total+=qty*def.price;
  }
  if(!lines.length)return reject('Keranjang kosong.');
  const tokenLine=lines.find(l=>l.itemId===TOKEN_ITEM.id);
  if(tokenLine){if(!s.housing.room)return reject('Token listrik hanya untuk penghuni kost.');count-=tokenLine.qty;}
  if(s.inventory.length+count>setting.bagSlots)return reject('Tas penuh ('+setting.bagSlots+' slot).');
  if(s.wallet<total)return reject('Uang tidak cukup.');
  const walletBefore=s.wallet;spend(total);clock(2);
  const added=[];
  for(const l of lines){
   if(l.itemId===TOKEN_ITEM.id){const u=l.qty*setting.tokenUnits;s.powerTokens+=u;out.tokenAdded=(out.tokenAdded||0)+u;changes.push('token listrik +'+u);continue;}
   const def=itemDef(c,l.itemId);for(let i=0;i<l.qty;i++)added.push(add(l.itemId,def.label,keepMinutes(def)));
  }
  out.receipt={lines,total,walletBefore,walletAfter:s.wallet};out.added=added;
  break;
 }
 case 'move_item': {
  const from=String(args.from||''),to=String(args.to||'');
  if(!containers[from]||!containers[to]||from===to)return reject('Wadah tidak valid.');
  if(from!=='bag'&&to!=='bag')return reject('Pindahkan lewat Tas dulu.');
  const gate=powerGate(from)||powerGate(to);if(gate)return reject(gate);
  const src=containers[from],dst=containers[to];
  const want=String(args.itemId||''),qty=number(args.qty,1,24,1);
  let uids=src.list.includes(want)?[want]:src.list.filter(id=>s.itemMeta[id]?.species===want)
   .sort((a,b)=>(s.itemMeta[a].expiresAt||0)-(s.itemMeta[b].expiresAt||0)).slice(0,qty);
  if(!uids.length)return reject('Barang tidak ada di '+src.label+'.');
  if(dst.list.length+uids.length>dst.slots)return reject(dst.label+' penuh.');
  for(const id of uids){
   const meta=s.itemMeta[id]||{},def=itemDef(c,meta.species),fish=allFish(c).some(f=>f.id===meta.species);
   const storeIn=def?.storeIn||(fish||meta.species==='buah'?['bag','fridge']:['bag','storage']);
   if(to!=='bag'&&!storeIn.includes(to))return reject(to==='fridge'?'Barang kering simpan di lemari.':'Barang basah simpan di kulkas.');
   if(to==='fridge'&&s.elapsedMinutes>=(meta.expiresAt||0))return reject('Barang sudah busuk, tidak bisa masuk kulkas.');
  }
  for(const id of uids){src.list.splice(src.list.indexOf(id),1);dst.list.push(id);if(s.itemMeta[id])s.itemMeta[id].inFridge=to==='fridge';}
  clock(1);changes.push(uids.length+' barang '+src.label+' → '+dst.label);out.moved=uids;
  break;
 }
 case 'cook_dish': {
  if(!s.housing.room)return reject('Masak membutuhkan kost.');
  if(args.stoveOk!==true&&!s.furniture.includes('stove'))return reject('Dekati kompor dahulu.');
  if(s.powerTokens<1)return reject('Token listrik habis.');
  const recipes=c.cooking?.recipes||[];
  const known=new Set([...(Array.isArray(s.knownRecipes)?s.knownRecipes:[]),...recipes.filter(r=>r.unlock?.knownAtStart||r.unlock?.mode==='start').map(r=>r.id)]);
  const fishIds=new Set(allFish(c).map(f=>f.id));
  const fits=(need,sp)=>need.id?need.id===sp:(need.category==='fish'?fishIds.has(sp):itemDef(c,sp)?.category===need.category);
  const needs=r=>(r.ingredients||[]).map(n=>typeof n==='string'?{id:n,qty:1}:{id:n.id,category:n.category,qty:number(n.qty,1,12,1)});
  // Assign concrete bag items to every need; exact=true means no item may be left over.
  const assign=(r,pool,exact)=>{
   const left=pool.slice().sort((a,b)=>(s.itemMeta[a].expiresAt||0)-(s.itemMeta[b].expiresAt||0)),used=[];
   const ordered=needs(r).sort((a,b)=>(a.id?0:1)-(b.id?0:1)); // exact ids before wildcards
   for(const n of ordered)for(let k=0;k<n.qty;k++){
    const i=left.findIndex(id=>fits(n,s.itemMeta[id]?.species));
    if(i<0)return null;used.push(left.splice(i,1)[0]);
   }
   if(exact&&left.length)return null;
   return used;
  };
  const bag=s.inventory.filter(id=>s.itemMeta[id]);
  let recipe=null,used=null;
  if(args.recipeId){
   recipe=recipes.find(r=>r.id===String(args.recipeId));
   if(!recipe)return reject('Resep tidak ada.');
   if(!known.has(recipe.id))return reject('Resep belum dikenal. Coba eksperimen bahan.');
   used=assign(recipe,bag,false);
   if(!used)return reject('Bahan kurang di Tas.');
  }else{
   const picked=(Array.isArray(args.ingredients)?args.ingredients:[]).map(String);
   if(!picked.length)return reject('Pilih bahan dari Tas.');
   const pool=[];
   for(const p of picked){
    const id=bag.includes(p)&&!pool.includes(p)?p:bag.find(x=>s.itemMeta[x].species===p&&!pool.includes(x));
    if(!id)return reject('Bahan tidak ada di Tas.');pool.push(id);
   }
   for(const r of recipes){const u=assign(r,pool,true);if(u){recipe=r;used=u;break;}}
   if(!recipe){out.failed=true;return Object.assign(reject('Kombinasi bahan belum jadi masakan.'),{failed:true});}
  }
  if(used.some(id=>s.elapsedMinutes>=(s.itemMeta[id].expiresAt||0)))return reject('Ada bahan yang sudah busuk.');
  const costE=-Math.min(0,number(recipe.statEffectsCook?.energy,-100,100,0));
  if(s.energy<costE)return reject('Energi tidak cukup untuk masak.');
  const fresh=used.every(id=>{const m=s.itemMeta[id],def=itemDef(c,m.species),f=allFish(c).find(x=>x.id===m.species);
   const life=Number(def?.spoilMinutes||f?.spoilMinutes||0);if(!life)return true;return (m.expiresAt-s.elapsedMinutes)/life>=0.5;});
  const minExp=number(recipe.minExp,0,100,0);
  const quality=s.experience>=minExp+30&&fresh?'sempurna':s.experience>=minExp+10?'bagus':'biasa';
  const learned=!known.has(recipe.id);
  if(s.inventory.length-used.length>=setting.bagSlots)return reject('Tas penuh.');
  for(const id of used){s.inventory.splice(s.inventory.indexOf(id),1);delete s.itemMeta[id];}
  clock(number(recipe.durationMinutes,1,600,20));s.powerTokens=Math.max(0,s.powerTokens-1);
  for(const [k,v] of Object.entries(recipe.statEffectsCook||{}))if(['energy','fullness','hygiene','bladder','moral','experience'].includes(k)&&v)stat(k,number(v,-100,100,0));
  const outDef=itemDef(c,recipe.outputItem);
  const label=recipe.outputLabel||outDef?.label||recipe.outputItem;
  const uid=add(recipe.outputItem,label,keepMinutes(outDef)||NEVER);
  s.itemMeta[uid].quality=quality;s.itemMeta[uid].recipeId=recipe.id;
  if(learned){s.knownRecipes=[...(Array.isArray(s.knownRecipes)?s.knownRecipes:[]),recipe.id];changes.push('resep baru: '+label);}
  out.recipeId=recipe.id;out.consumed=used;out.minutes=number(recipe.durationMinutes,1,600,20);out.tokenUsed=1;
  out.result={uid,itemId:recipe.outputItem,label,quality,statEffectsEat:copy(recipe.statEffectsEat||{})};
  out.learnedRecipe=learned?{id:recipe.id,label}:null;
  out.pose=recipe.actionAsset||'cook';
  break;
 }
 case 'fish_catch': {
  if(s.energy<setting.fishEnergy)return reject('Energi tidak cukup untuk mancing.');
  const gotAway=args.gotAway===true;
  if(!gotAway&&s.inventory.length>=setting.bagSlots)return reject('Tas penuh ('+setting.bagSlots+' slot).');
  clock(setting.fishMinutes);stat('energy',-setting.fishEnergy);
  if(gotAway){changes.push('ikan kabur');out.gotAway=true;break;}
  const f=allFish(c).find(x=>x.id===String(args.fishId||''));
  if(!f)return reject('Ikan tidak dikenal.');
  out.uid=add(f.id,f.label,number(f.spoilMinutes,1,100000,180));out.fishId=f.id;out.label=f.label;
  out.rarity=f.rarity||'umum';out.rarityTier=f.rarityTier||'common';out.gotAway=false;
  changes.push('hasil mancing di '+String(args.spotId||'dermaga').slice(0,60));
  break;
 }
 case 'topup_token': {
  if(!s.housing.room)return reject('Perlu kost dahulu.');
  const packs=Math.max(1,Math.ceil(number(args.units,1,1000,setting.tokenUnits)/setting.tokenUnits));
  const price=packs*setting.tokenPrice;
  if(!spend(price))return reject('Uang tidak cukup.');
  s.powerTokens+=packs*setting.tokenUnits;
  out.packs=packs;out.paid=price;out.added=packs*setting.tokenUnits;
  changes.push('token listrik +'+out.added);break;
 }
 case 'fine':{
  if(!s.detained)return reject('Belum ditahan hansip.');
  if(!spend(2000))return reject('Uang tidak cukup untuk denda.');
  s.detained=false;s.arrestGraceMinutes=60;stat('moral',5);changes.push('denda lunas, bebas');break;
 }
 case 'community_service':{
  if(!s.detained)return reject('Belum ditahan hansip.');
  clock(45);s.detained=false;s.arrestGraceMinutes=60;stat('energy',-15);stat('moral',10);changes.push('kerja sosial membersihkan gorong-gorong; bebas');break;
 }
 case 'quest_reward': {
  const amount=Math.max(0,Math.round(Number(args.amount||args.reward||0)));
  s.wallet+=amount;changes.push('hadiah quest +Rp'+amount);break;
 }
 default:return reject('Aksi belum didukung: '+String(action));
 }
 if(s.bladder>=100&&action!=='toilet'&&action!=='public_toilet'&&action!=='home_toilet'){
  s.bladder=0;s.hygiene=Math.max(0,s.hygiene-20);s.moral=Math.max(0,s.moral-5);
  changes.push('KENCING DI CELANA · hygiene -20 · moral -5');
 }
 if(s.energy<=0&&s.restMinutes===0&&!['rest','respawn'].includes(action)){
  s.restMinutes=setting.faintRestMinutes;s.faintCount++;
  changes.push('PINGSAN · bed rest '+s.restMinutes+'m');
 }
 const delta=s.wallet-beforeWallet;
 s.actionCounts=s.actionCounts&&typeof s.actionCounts==='object'?s.actionCounts:{};
 s.actionCounts[action]=(s.actionCounts[action]||0)+1;
 if(action==='work'&&delta>0)s.actionCounts.workEarn=(s.actionCounts.workEarn||0)+delta;
 if(delta!==0){
  const names={world_interaction:(c.worldEntities.find(v=>v.id===args.ruleId)?.label||'Interaksi Objek'),configured_activity:(c.activities.find(a=>a.id===args.activityId)?.label||'Aktivitas Jiwa'),sell_fish:'Jual ikan',sell_loak:'Jual barang bekas',buy_room:'Akses kost',
   buy_furniture:'Beli furnitur',buy_fridge:'Beli kulkas',buy_token:'Token listrik',
   work:'Upah kerja',public_shower:'Mandi umum',shower:'Mandi',eat:'Makan warung',
   coffee:'Beli kopi',tea:'Beli es teh',wall_pee:'Pipis di tembok',fart:'Kentut',talk:'Ngobrol',charity:'Sedekah',fine:'Denda hansip',luck_find:'Rezeki / nasib',
   quest_reward:'Hadiah quest'};
  const label=action==='work'&&args.jobId?
   (c.jobs.find(j=>j.id===args.jobId)?.label||'Upah kerja'):
   action==='buy_furniture'?
   (FURNITURE.find(x=>x.id===String(args.itemId))?.label||'Furnitur'):
   names[action]||action.replace(/_/g,' ');
  const day=Number.isFinite(Number(args.day))?Math.max(1,Math.floor(Number(args.day))):Math.floor(Math.max(0,s.elapsedMinutes)/1440)+1;
  s.transactions.push({id:'txn:'+s.elapsedMinutes+':'+(s.transactions.length+1),
   action,label,delta,balance:s.wallet,minute:s.elapsedMinutes,day});
  s.transactions=s.transactions.slice(-40);
 }
 return Object.assign({ok:true,state:s,changes,action},out);
}
return Object.freeze({RELIGIONS,ZODIACS,BUYERS,FISH,JOBS,FURNITURE,COOKING,allFish,itemDef,defaults,normalize,stateFrom,weighted,activeItem,speedFactor,run:doAction});
});

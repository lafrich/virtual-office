/* JIWA Life Economy V1 — editable fishing, market acceptance, and survival sandbox.
 * No production gameplay writes; one-off ownership purchases, no recurring rent.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.JiwaLifeEconomy=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
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
 {id:'bed',label:'Kasur',price:6000},
 {id:'chair',label:'Kursi',price:1500},
 {id:'stove',label:'Kompor',price:4500},
 {id:'wardrobe',label:'Lemari',price:3500}
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
 settings:{bagSlots:8,homeStorageSlots:24,fishEnergy:8,fishMinutes:12,coffeePrice:2000,roomPrice:30000,
 fridgePrice:8000,tokenPrice:1000,tokenUnits:5,fridgeCoolingMultiplier:2,
 faintRestMinutes:30,arrestMoralThreshold:15,
 publicShowerFee:500,publicShowerRecovery:35,homeShowerRecovery:70,
 publicToiletPenalty:5,hoboSleepRecovery:30,homeSleepRecovery:65,
 passiveEnergyMinutes:60,passiveBladderMinutes:20,passiveHygieneMinutes:90,
 passiveFullnessMinutes:35,faintRecoveryEnergy:25,tokenDurationMinutes:60,
 realSecondsPerGameMinute:8,seatRestEnergy:3},
 fish:copy(FISH),jobs:copy(JOBS),activities:[]
};}
function normalize(raw){
 const base=defaults(),source=raw&&typeof raw==='object'?raw:{},s=source.settings||{};
 for(const key of Object.keys(base.settings)){
   if(key==='bagSlots'||key==='homeStorageSlots')continue;
   base.settings[key]=number(s[key],key==='arrestMoralThreshold'?0:1,100000,base.settings[key]);
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
 base.activities=(Array.isArray(source.activities)?source.activities:[]).slice(0,300)
  .filter(a=>a&&/^[a-z0-9_-]{1,64}$/.test(a.id)&&a.enabled===true)
  .map(a=>({
   ...a, minExp:number(a.minExp,0,100000,0),
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
 s.transactions=Array.isArray(s.transactions)?s.transactions.slice(-40).filter(t=>t&&Number.isFinite(Number(t.delta))):[];
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
function activeItem(config,s,id){
 const meta=s.itemMeta[id];
 if(!meta)return {ok:false,reason:'Item tidak ditemukan'};
 const fish=normalize(config).fish.find(f=>f.id===meta.species);
 if(!fish&&meta.species!=='buah')return {ok:false,reason:'Barang tidak termasuk makanan segar'};
 const limit=meta.expiresAt;
 return {ok:true,fish,meta,spoiled:s.elapsedMinutes>=limit};
}
function speedFactor(s){
 return s.detained||s.restMinutes>0||s.detentionMinutes>0||s.energy<=0?0:(s.energy>=30?1:.28+.72*s.energy/30);
}
function doAction(config,previous,action,args={}){
 const c=normalize(config),s=stateFrom(previous,c),setting=c.settings,changes=[];
 const beforeWallet=s.wallet;
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
 if(!['advance_time','rest','respawn'].includes(action)&&(s.restMinutes>0||s.detentionMinutes>0))
  return reject('Masih bed rest / menjalani hukuman. Majukan waktu terlebih dahulu.');
 if(s.detained&&!['fine','community_service','advance_time'].includes(action))return reject('Ditahan hansip: bayar denda atau bersihkan gorong-gorong.');
 switch(action){
 case 'configured_activity': {
  const id=String(args.activityId||'');
  const a=c.activities.find(v=>v.id===id);
  if(!a)return reject('Aktivitas belum diaktifkan dalam Jiwa.');
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
  if(info.meta.species!=='buah')return reject('Ikan mentah harus dimasak dahulu.');
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
  if(!spend(2500))return reject('Uang tidak cukup.');
  clock(10);stat('energy',12);stat('fullness',30);stat('bladder',12);break;
 }
 case 'coffee': {
  if(!spend(setting.coffeePrice))return reject('Uang tidak cukup.');
  clock(5);stat('energy',20);stat('bladder',25);break;
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
 case 'pee_outside':clock(3);stat('bladder',-100);stat('hygiene',-20);stat('moral',-10);changes.push('pipis sembarangan berisiko ketahuan');break;
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
 case 'fine':{
  if(!s.detained)return reject('Belum ditahan hansip.');
  if(!spend(2000))return reject('Uang tidak cukup untuk denda.');
  s.detained=false;s.arrestGraceMinutes=60;stat('moral',5);changes.push('denda lunas, bebas');break;
 }
 case 'community_service':{
  if(!s.detained)return reject('Belum ditahan hansip.');
  clock(45);s.detained=false;s.arrestGraceMinutes=60;stat('energy',-15);stat('moral',10);changes.push('kerja sosial membersihkan gorong-gorong; bebas');break;
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
 if(delta!==0){
  const names={configured_activity:(c.activities.find(a=>a.id===args.activityId)?.label||'Aktivitas Jiwa'),sell_fish:'Jual ikan',sell_loak:'Jual barang bekas',buy_room:'Akses kost',
   buy_furniture:'Beli furnitur',buy_fridge:'Beli kulkas',buy_token:'Token listrik',
   work:'Upah kerja',public_shower:'Mandi umum',shower:'Mandi',eat:'Makan warung',
   coffee:'Beli kopi',charity:'Sedekah',fine:'Denda hansip',luck_find:'Rezeki / nasib'};
  const label=action==='work'&&args.jobId?
   (c.jobs.find(j=>j.id===args.jobId)?.label||'Upah kerja'):
   action==='buy_furniture'?
   (FURNITURE.find(x=>x.id===String(args.itemId))?.label||'Furnitur'):
   names[action]||action.replace(/_/g,' ');
  s.transactions.push({id:'txn:'+s.elapsedMinutes+':'+(s.transactions.length+1),
   action,label,delta,balance:s.wallet,minute:s.elapsedMinutes});
  s.transactions=s.transactions.slice(-40);
 }
 return {ok:true,state:s,changes,action};
}
return Object.freeze({RELIGIONS,ZODIACS,BUYERS,FISH,JOBS,FURNITURE,defaults,normalize,stateFrom,weighted,activeItem,speedFactor,run:doAction});
});

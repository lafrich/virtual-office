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
function defaults(){return {
 version:1,identity:{religion:'islam',zodiac:'capricorn'},
 gates:{friendsV2:false,socialV2:false,satanicEvilRouteV2:false},
 settings:{bagSlots:8,fishEnergy:8,fishMinutes:12,coffeePrice:2000,roomPrice:30000,
 fridgePrice:8000,tokenPrice:1000,tokenUnits:5,fridgeExtraMinutes:600,
 faintRestMinutes:30,arrestMoralThreshold:15},
 fish:copy(FISH)
};}
function normalize(raw){
 const base=defaults(),source=raw&&typeof raw==='object'?raw:{},s=source.settings||{};
 for(const key of Object.keys(base.settings)){
   if(key==='bagSlots')continue;
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
 return base;
}
function stateFrom(existing,config){
 const s=copy(existing||{}),c=normalize(config);
 s.inventory=Array.isArray(s.inventory)?s.inventory:[];
 s.itemMeta=s.itemMeta&&typeof s.itemMeta==='object'?s.itemMeta:{};
 s.fridge=Array.isArray(s.fridge)?s.fridge:[];
 s.housing=s.housing&&typeof s.housing==='object'?s.housing:{room:false,fridge:false};
 s.elapsedMinutes=number(s.elapsedMinutes,0,1e9,0);
 s.itemSequence=number(s.itemSequence,0,1e9,0);
 s.powerTokens=number(s.powerTokens,0,1e9,0);
 s.restMinutes=number(s.restMinutes,0,1e9,0);
 s.detentionMinutes=number(s.detentionMinutes,0,1e9,0);
 for(const [k,def] of Object.entries({wallet:6000,energy:80,hygiene:75,bladder:20,fullness:70,moral:50,experience:0})){
  s[k]=number(s[k],0,k==='wallet'?1e9:100,def);
 }
 s.identity=copy(c.identity);
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
 if(!fish)return {ok:false,reason:'Jenis ikan tidak dikenal'};
 const limit=meta.expiresAt+(meta.inFridge?normalize(config).settings.fridgeExtraMinutes:0);
 return {ok:true,fish,meta,spoiled:s.elapsedMinutes>=limit};
}
function speedFactor(s){
 return s.restMinutes>0||s.detentionMinutes>0||s.energy<=0?0:(s.energy>=30?1:.28+.72*s.energy/30);
}
function doAction(config,previous,action,args={}){
 const c=normalize(config),s=stateFrom(previous,c),setting=c.settings,changes=[];
 const reject=reason=>({ok:false,reason,state:copy(previous||s),changes:[]});
 const stat=(k,v)=>{s[k]=Math.max(0,Math.min(100,s[k]+v));changes.push(k+' '+(v>=0?'+':'')+v);};
 const clock=m=>{m=number(m,0,100000,0);s.elapsedMinutes+=m;s.restMinutes=Math.max(0,s.restMinutes-m);
  s.detentionMinutes=Math.max(0,s.detentionMinutes-m);changes.push('waktu +'+m+'m');};
 const spend=amount=>{if(s.wallet<amount)return false;s.wallet-=amount;changes.push('uang -Rp'+amount);return true;};
 const add=(type,label,minutes)=>{if(s.inventory.length>=setting.bagSlots)return null;
  const id='life:'+type+':'+(++s.itemSequence);
  s.inventory.push(id);s.itemMeta[id]={species:type,label,expiresAt:s.elapsedMinutes+minutes,inFridge:false};
  changes.push('dapat '+label);return id;};
 if(!['advance_time','rest'].includes(action)&&(s.restMinutes>0||s.detentionMinutes>0))
  return reject('Masih bed rest / menjalani hukuman. Majukan waktu terlebih dahulu.');
 switch(action){
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
 case 'sell_fish': {
  const id=String(args.itemId||''),buyer=String(args.buyerId||'');
  if(!Object.prototype.hasOwnProperty.call(BUYERS,buyer))return reject('Pembeli belum ada.');
  if(!s.inventory.includes(id))return reject('Ikan tidak ada di tas.');
  const info=activeItem(c,s,id);
  if(!info.ok)return reject(info.reason);
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
 case 'rest':clock(args.minutes??15);stat('energy',15);break;
 case 'eat': {
  if(!spend(2500))return reject('Uang tidak cukup.');
  clock(10);stat('energy',12);stat('fullness',30);stat('bladder',12);break;
 }
 case 'coffee': {
  if(!spend(setting.coffeePrice))return reject('Uang tidak cukup.');
  clock(5);stat('energy',20);stat('bladder',25);break;
 }
 case 'sleep':clock(60);stat('energy',65);stat('hygiene',-12);break;
 case 'shower':clock(15);stat('hygiene',60);break;
 case 'toilet':clock(4);stat('bladder',-100);break;
 case 'pee_outside':clock(3);stat('bladder',-100);stat('hygiene',-20);stat('moral',-10);break;
 case 'work': {
  if(s.energy<10)return reject('Energi tidak cukup untuk bekerja.');
  if(args.premium&&s.hygiene<70)return reject('Pekerjaan premium membutuhkan kebersihan 70.');
  clock(Math.max(5,Math.round(30/(1+s.experience/100))));
  stat('energy',-10);s.wallet+=args.premium?4500:2500;
  s.experience=Math.min(100,s.experience+7);
  changes.push('upah +Rp'+(args.premium?4500:2500));break;
 }
 case 'course':clock(25);s.experience=Math.min(100,s.experience+12);changes.push('EXP +12');break;
 case 'charity': {
  if(!spend(1000))return reject('Uang tidak cukup untuk sedekah.');
  stat('moral',5);break;
 }
 case 'help':clock(15);stat('energy',-5);stat('moral',5);break;
 case 'worship': {
  if(['ateis','agnostik'].includes(c.identity.religion))return reject('Karakter tidak memilih ibadah agama; moral bisa dinaikkan lewat perbuatan baik.');
  if(args.placeReligion&&args.placeReligion!==c.identity.religion)return reject('Tempat ibadah tidak sesuai pilihan agama.');
  clock(15);stat('moral',5);break;
 }
 case 'buy_room': {
  if(s.housing.room)return reject('Kost sudah dimiliki / diakses.');
  if(!spend(setting.roomPrice))return reject('Uang tidak cukup.');
  s.housing.room=true;changes.push('kost aktif selamanya (tanpa sewa berkala)');break;
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
  s.powerTokens-=1;
  s.inventory.splice(s.inventory.indexOf(id),1);s.fridge.push(id);
  info.meta.inFridge=true;changes.push('masuk kulkas; token -1');break;
 }
 case 'take_fridge': {
  const id=String(args.itemId||'');
  if(!s.fridge.includes(id))return reject('Barang tidak ada di kulkas.');
  if(s.inventory.length>=setting.bagSlots)return reject('Tas penuh.');
  s.fridge.splice(s.fridge.indexOf(id),1);s.inventory.push(id);changes.push('ambil dari kulkas');break;
 }
 case 'fine':{
  if(s.moral>=setting.arrestMoralThreshold)return reject('Tidak ada perkara aktif.');
  if(!spend(2000))return reject('Uang tidak cukup untuk denda.');
  stat('moral',5);break;
 }
 case 'community_service':{
  if(s.moral>=setting.arrestMoralThreshold)return reject('Tidak ada perkara aktif.');
  clock(45);stat('energy',-15);stat('moral',10);changes.push('kerja sosial membersihkan gorong-gorong');break;
 }
 default:return reject('Aksi belum didukung: '+String(action));
 }
 if(s.energy<=0&&!['advance_time','rest'].includes(action)){
  s.restMinutes=setting.faintRestMinutes;changes.push('PINGSAN · bed rest '+s.restMinutes+'m');
 }
 return {ok:true,state:s,changes,action};
}
return Object.freeze({RELIGIONS,ZODIACS,BUYERS,FISH,defaults,normalize,stateFrom,weighted,activeItem,speedFactor,run:doAction});
});

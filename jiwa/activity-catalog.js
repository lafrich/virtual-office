/* JIWA global activity premise + balancing schema. Browser + Node. */
(function(root,factory){const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.JiwaActivities=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const KEY='jiwa-activities-global-v1',FORMAT='jiwa-activity-catalog-v1';
const PREMISES=(typeof module!=='undefined'&&module.exports)?
 require('./interaction-rules.js'):window.JiwaPremises;
const CATEGORIES=[
 {id:'money',icon:'wallet',emoji:'💰',label:'Money',hint:'Kerja, mulung, jual beli'},
 {id:'energy',icon:'zap',emoji:'⚡',label:'Energy',hint:'Kopi, makan, tidur, snack'},
 {id:'moral',icon:'heart-handshake',emoji:'🤲',label:'Moral',hint:'Ibadah, kerja sukarela, membantu'},
 {id:'immoral',icon:'alert-triangle',emoji:'😈',label:'Immoral',hint:'Pelanggaran dan konsekuensi'},
 {id:'exp',icon:'graduation-cap',emoji:'📚',label:'EXP',hint:'Course, buku, kampus'},
 {id:'cooking',icon:'chef-hat',emoji:'🍳',label:'Cooking',hint:'Resep dan bahan kombinasi'},
 {id:'buying',icon:'shopping-cart',emoji:'🛒',label:'Buying',hint:'Furnitur, kost, props'},
 {id:'punishment',icon:'scale',emoji:'⚖️',label:'Punishment',hint:'Kerja sosial dan penjara'}
];
const CATEGORY_IDS=CATEGORIES.map(c=>c.id);
const STAT_KEYS=['energy','fullness','hygiene','bladder','moral','experience'];
const clone=x=>JSON.parse(JSON.stringify(x));
const num=(v,min,max,d=0)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.round(n))):d};
const str=(v,max=180)=>String(v??'').replace(/[<>]/g,'').trim().slice(0,max);
const slug=v=>str(v,80).toLowerCase().replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,64);
const STAT_ZERO=()=>Object.fromEntries(STAT_KEYS.map(k=>[k,0]));
function activity(raw={}){
 const id=slug(raw.id)||'activity';
 const category=CATEGORY_IDS.includes(raw.category)?raw.category:'money';
 const stats=raw.statEffects||{},required=raw.requirements||{};
 return {
  id,category,tier:PREMISES?.cfg(category,raw.tier||PREMISES.infer(category,raw)).tier.id||'sepele',
  label:str(raw.label||'Aktivitas baru',96),
  premise:str(raw.premise||'Apa yang sedang dialami karakter?',600),
  steps:str(raw.steps||'Dekati lokasi → tekan Action → lakukan aktivitas → terima hasil.',850),
  buildingQuery:str(raw.buildingQuery,110),objectId:str(raw.objectId,110),
  actionAsset:str(raw.actionAsset,110),actionSource:'mahluk-hidup',
  minExp:num(raw.minExp,0,100000,0),
  minEnergy:num(raw.minEnergy,0,100,0),
  minHygiene:num(raw.minHygiene,0,100,0),
  durationMinutes:num(raw.durationMinutes,1,4320,20),
  moneyDelta:num(raw.moneyDelta,-1e9,1e9,0),
  statEffects:Object.fromEntries(STAT_KEYS.map(k=>[k,num(stats[k],-100,100,0)])),
  ingredients:(Array.isArray(raw.ingredients)?raw.ingredients:[]).map(v=>slug(v)).filter(Boolean).slice(0,12),
  outputItem:slug(raw.outputItem),
  outputLabel:str(raw.outputLabel,80),
  grantType:['none','inventory','furniture','room','prop'].includes(raw.grantType)?raw.grantType:'none',
  riskPercent:num(raw.riskPercent,0,100,0),
  detentionMinutes:num(raw.detentionMinutes,0,4320,0),
  punishment:str(raw.punishment,90),
  // Explicit opt-in. Unbound activities remain drafts and cannot be triggered.
  enabled:raw.enabled===true,
  notes:str(raw.notes,400)
 };
}
function seed(){
 const examples=[
 ['money','bank_teller','Kerja di Bank','Karakter melamar sebagai teller bank. Ia harus tampil rapi, datang ke bank, dan menjalankan shift sebelum menerima upah.','bank','work_bank_counter',40,45,4800,{energy:-18,hygiene:-4,experience:8}],
 ['money','mulung','Mulung dan jual barang bekas','Cari botol atau kardus, isi tas, lalu jual ke pengepul.','toko loak','scavenge_pickup',0,8,1000,{energy:-5,hygiene:-9,experience:2}],
 ['money','jualan_makanan','Jual masakan','Masak di rumah, bawa hasil masakan, lalu jual dari lapak.','warung','sell_food_stall',10,30,3500,{energy:-12,experience:4}],
 ['energy','minum_kopi','Beli kopi','Mampir ke warung kopi, bayar segelas, lalu lanjut beraktivitas.','kopi','drink_coffee',0,8,-2000,{energy:18,bladder:8}],
 ['energy','makan_warteg','Makan','Beli makanan yang cukup mengenyangkan di warteg.','warteg','eat',0,15,-12000,{fullness:38,energy:5}],
 ['energy','tidur','Tidur','Pulang ke kost atau tenda lalu tidur untuk memulihkan energi.','kost','sleep',0,240,0,{energy:65,fullness:-10}],
 ['energy','snack','Beli snack','Camilan cepat di minimarket saat sedang bekerja.','minimarket','eat_snack',0,5,-4000,{fullness:15}],
 ['moral','ibadah','Ibadah','Datangi tempat ibadah yang sesuai karakter.','tempat ibadah','pray',0,20,0,{moral:8,energy:-3}],
 ['moral','sukarela','Kerja sukarela','Bantu membersihkan lingkungan tanpa imbalan uang.','balai warga','clean_community',0,45,0,{moral:9,energy:-12,experience:2}],
 ['moral','bantu_npc','Bantu NPC','Tolong NPC yang membutuhkan bantuan tanpa meminta uang.','npc','help_npc',0,18,0,{moral:6,energy:-5}],
 ['immoral','pipis_sembarangan','Kencing sembarangan','Karakter membuang air kecil di tempat umum dan berisiko ditegur.','tembok','pee_wall',0,3,0,{bladder:-70,moral:-8,hygiene:-7}],
 ['immoral','mencuri','Mencuri','Ambil barang milik orang tanpa izin; konsekuensinya harus diproses sistem hukuman.','toko','steal',20,10,2500,{moral:-20,energy:-4}],
 ['immoral','kabur_shift','Kabur dari kerja','Tinggalkan pekerjaan sebelum shift selesai; reputasi dan penghasilan berkurang.','kantor','leave_shift',0,5,-1000,{moral:-10,experience:-5}],
 ['exp','online_course','Course online','Belajar dari Nokia untuk meningkatkan kemampuan dan kesempatan kerja.','kursus','online_learning',0,35,-1000,{experience:12,energy:-4}],
 ['exp','baca_buku','Baca buku','Baca buku di rumah atau perpustakaan untuk menaikkan EXP.','perpustakaan','read_book',0,30,0,{experience:6,energy:-2}],
 ['exp','selundup_kelas','Menyelundup di kelas kampus','Masuk kelas kampus tanpa terdaftar, mendapatkan ilmu tetapi berisiko diusir.','kampus','sit_class',5,50,0,{experience:8,moral:-3,energy:-5}],
 ['cooking','nasi_goreng','Masak nasi goreng','Gabungkan nasi, telur, dan minyak di kompor untuk membuat nasi goreng.','kompor','cook_stir',0,25,0,{energy:-7,experience:3}],
 ['cooking','kopi_susu','Racik kopi susu','Campurkan kopi, susu, dan gula menjadi minuman siap jual.','kompor','mix_drink',0,12,0,{energy:-2,experience:2}],
 ['buying','beli_kost','Beli akses kost','Cari kamar kosong lalu bayar harga kost untuk akses ruang pribadi.','kost','buy_room',0,10,-30000,{}],
 ['buying','beli_furnitur','Beli furnitur','Beli barang di toko dan tempatkan di kamar melalui Bangun Ruang.','toko furnitur','buy_item',0,10,-6000,{}],
 ['buying','beli_props','Beli props','Kunjungi toko untuk membeli props yang bisa dipakai karakter.','toko props','buy_prop',0,8,-3500,{}],
 ['punishment','kerja_sosial','Kerja sosial','Karakter harus membersihkan jalan sebagai hukuman pelanggaran.','pos hansip','community_service',0,60,0,{moral:6,energy:-18}],
 ['punishment','penjara','Penjara','Karakter menjalani tahanan yang dipicu pelanggaran dan keputusan aparat.','kantor polisi','jail_idle',0,180,0,{energy:-15,moral:-5}]
 ];
 const entries=examples.map(([category,id,label,premise,buildingQuery,actionAsset,minExp,durationMinutes,moneyDelta,statEffects])=>
  activity({category,id,label,premise,buildingQuery,actionAsset,minExp,durationMinutes,moneyDelta,statEffects,
   steps:'1. Pastikan syarat terpenuhi → 2. Dekati '+buildingQuery+' → 3. Jalankan animasi '+actionAsset+' → 4. Terima efek.'}));
 const recipe=entries.find(x=>x.id==='nasi_goreng');recipe.ingredients=['nasi','telur','minyak'];recipe.outputItem='nasi_goreng';recipe.outputLabel='Nasi Goreng';recipe.grantType='inventory';
 const drink=entries.find(x=>x.id==='kopi_susu');drink.ingredients=['kopi','susu','gula'];drink.outputItem='kopi_susu';drink.outputLabel='Kopi Susu';
 drink.grantType='inventory';
 const bed=entries.find(x=>x.id==='beli_kost');bed.grantType='room';
 const furn=entries.find(x=>x.id==='beli_furnitur');furn.grantType='furniture';furn.outputItem='bed';furn.outputLabel='Kasur';
 const props=entries.find(x=>x.id==='beli_props');props.grantType='prop';props.outputItem='payung';props.outputLabel='Payung';
 const steal=entries.find(x=>x.id==='mencuri');steal.riskPercent=30;steal.detentionMinutes=60;
 const prison=entries.find(x=>x.id==='penjara');prison.detentionMinutes=180;prison.punishment='penjara';

 return {id:'global-game-activities',format:FORMAT,version:2,updatedAt:null,activities:entries,
   worldEntities:PREMISES.seedWorld()};
}
function normalize(raw){
 const source=raw&&typeof raw==='object'?raw:{};
 const existing=Array.isArray(source.activities)?source.activities:seed().activities;
 const seen=new Set(),activities=[];
 for(const r of existing.slice(0,300)){
  const a=activity(r);if(seen.has(a.id))continue;seen.add(a.id);activities.push(a);
 }
 const seenEntities=new Set(),worldEntities=[];
 for(const item of (Array.isArray(source.worldEntities)?source.worldEntities:PREMISES.seedWorld()).slice(0,300)){
  const rule=PREMISES.worldRule(item);if(seenEntities.has(rule.id))continue;
  seenEntities.add(rule.id);worldEntities.push(rule);
 }
 return {id:'global-game-activities',format:FORMAT,version:2,
  updatedAt:typeof source.updatedAt==='string'?source.updatedAt:null,
  activities,worldEntities};
}
function readLocal(storage){
 try{const raw=JSON.parse(storage?.getItem(KEY)||'null');return normalize(raw||seed());}
 catch{return seed();}
}
function saveLocal(raw,storage){
 const cfg=normalize(raw);cfg.updatedAt=new Date().toISOString();
 for(const a of cfg.activities){
  const fails=PREMISES.violations(a);
  if(fails.length){
   const f=fails[0];throw Error(a.label+': tier '+a.tier+' membatasi '+f.key+' pada '+f.min+'–'+f.max+'. Naikkan tier atau ubah nilainya.');
  }
 }
 for(const r of cfg.worldEntities){
  if(!r.enabled||r.operation!=='ambient')continue;
  const fails=PREMISES.violations(r);
  if(fails.length){
   const f=fails[0];throw Error(r.label+': tier '+r.tier+' membatasi '+f.key+' pada '+f.min+'–'+f.max);
  }
 }
 if(!storage?.setItem)throw Error('Storage tidak tersedia');
 storage.setItem(KEY,JSON.stringify(cfg));
 const check=readLocal(storage);
 if(check.updatedAt!==cfg.updatedAt||check.activities.length!==cfg.activities.length||check.worldEntities.length!==cfg.worldEntities.length)
  throw Error('Gagal memverifikasi hasil save aktivitas');
 return cfg;
}
function matchBuilding(entry,objects){
 const a=activity(entry),needle=a.buildingQuery.toLowerCase();
 if(!needle&&!a.objectId)return null;
 return (objects||[]).find(o=>{
  if(a.objectId&&String(o.id)===a.objectId)return true;
  if(!needle)return false;
  return [o.id,o.name,o.label,o.asset,o.assetId,o.subtype,...(o.tags||[])].filter(Boolean).join(' ').toLowerCase().includes(needle);
 })||null;
}
function validation(a,objects=[]){
 const errors=[];
 if(!a?.label)errors.push('Nama aktivitas wajib diisi');
 if(!a?.buildingQuery&&!a?.objectId)errors.push('Pilih bangunan/asset target');
 if(!a?.actionAsset)errors.push('Pilih Action Asset Mahluk Hidup');
 if(!matchBuilding(a,objects))errors.push('Bangunan belum ditemukan di map aktif');
 const limit=PREMISES.violations(a);
 for(const f of limit)errors.push('Tier '+a.tier+' membatasi '+f.key+' ke '+f.min+'–'+f.max+' (sekarang '+f.value+')');
 return errors;
}
return Object.freeze({KEY,FORMAT,CATEGORIES,STAT_KEYS,STAT_ZERO,PREMISES,activity,seed,normalize,readLocal,saveLocal,matchBuilding,validation});
});

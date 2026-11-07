/* Jiwa premise rules: deterministic tiers, caps and world bindings. Shared by
 * editor, Semesta gameplay and Node tests. Pure data; no implicit map writes. */
(function(root,factory){const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.JiwaPremises=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
const CATEGORY={
 money:{label:'Pekerjaan / Uang',metric:'moneyDelta',tiers:[
  {id:'sepele',label:'Sepele',range:[0,3000],duration:[1,30],exp:[0,19],money:[0,3000],defaultValue:1200,defaultDuration:12,defaultExp:0},
  {id:'menengah',label:'Menengah',range:[3001,10000],duration:[15,120],exp:[0,59],money:[3001,10000],defaultValue:5500,defaultDuration:50,defaultExp:25},
  {id:'prestige',label:'Prestige',range:[10001,100000],duration:[60,480],exp:[40,100000],money:[10001,100000],defaultValue:20000,defaultDuration:180,defaultExp:70}
 ]},
 energy:{label:'Kebutuhan Energi',metric:'statEffects.energy',tiers:[
  {id:'sepele',label:'Ringan',range:[0,24],duration:[1,60],exp:[0,100000],money:[-25000,0],defaultValue:12,defaultDuration:8,defaultMoney:-1500},
  {id:'menengah',label:'Standar',range:[25,65],duration:[10,260],exp:[0,100000],money:[-25000,0],defaultValue:42,defaultDuration:35,defaultMoney:-6000},
  {id:'prestige',label:'Intensif',range:[66,100],duration:[20,480],exp:[0,100000],money:[-150000,0],defaultValue:85,defaultDuration:120,defaultMoney:-35000}
 ]},
 moral:{label:'Kebaikan / Kontribusi',metric:'statEffects.moral',tiers:[
  {id:'sepele',label:'Kecil',range:[0,6],duration:[1,35],exp:[0,100000],money:[-2000,0],defaultValue:4,defaultDuration:12},
  {id:'menengah',label:'Sosial',range:[7,15],duration:[10,150],exp:[0,100000],money:[-10000,0],defaultValue:10,defaultDuration:45},
  {id:'prestige',label:'Pengabdian',range:[16,50],duration:[30,480],exp:[0,100000],money:[-50000,0],defaultValue:25,defaultDuration:160}
 ]},
 immoral:{label:'Pelanggaran / Risiko',metric:'statEffects.moral',tiers:[
  {id:'sepele',label:'Ringan',range:[-8,-1],duration:[1,35],exp:[0,100000],money:[-2000,3000],risk:[0,25],defaultValue:-5,defaultDuration:5,defaultRisk:10},
  {id:'menengah',label:'Serius',range:[-20,-9],duration:[5,120],exp:[0,100000],money:[-10000,15000],risk:[0,60],defaultValue:-14,defaultDuration:20,defaultRisk:30},
  {id:'prestige',label:'Berat',range:[-100,-21],duration:[15,480],exp:[0,100000],money:[-100000,50000],risk:[0,100],defaultValue:-35,defaultDuration:80,defaultRisk:70}
 ]},
 exp:{label:'Pendidikan / Keterampilan',metric:'statEffects.experience',tiers:[
  {id:'sepele',label:'Pemula',range:[0,6],duration:[1,35],exp:[0,100000],money:[-2000,0],defaultValue:4,defaultDuration:20},
  {id:'menengah',label:'Menengah',range:[7,16],duration:[15,150],exp:[0,100000],money:[-12000,0],defaultValue:11,defaultDuration:50},
  {id:'prestige',label:'Mahir',range:[17,60],duration:[45,480],exp:[0,100000],money:[-100000,0],defaultValue:27,defaultDuration:180}
 ]},
 cooking:{label:'Masakan / Resep',metric:'ingredients.length',tiers:[
  {id:'sepele',label:'Rumahan',range:[0,2],duration:[1,20],exp:[0,100000],money:[-2000,0],defaultValue:2,defaultDuration:10},
  {id:'menengah',label:'Warung',range:[3,4],duration:[12,90],exp:[0,100000],money:[-12000,0],defaultValue:3,defaultDuration:25},
  {id:'prestige',label:'Profesional',range:[5,12],duration:[25,240],exp:[0,100000],money:[-60000,0],defaultValue:6,defaultDuration:75}
 ]},
 buying:{label:'Belanja / Aset',metric:'moneyDelta',tiers:[
  {id:'sepele',label:'Murah',range:[-5000,0],duration:[1,30],exp:[0,100000],money:[-5000,0],defaultValue:-2500,defaultDuration:6},
  {id:'menengah',label:'Standar',range:[-50000,-5001],duration:[5,90],exp:[0,100000],money:[-50000,-5001],defaultValue:-20000,defaultDuration:12},
  {id:'prestige',label:'Premium',range:[-1000000,-50001],duration:[10,300],exp:[0,100000],money:[-1000000,-50001],defaultValue:-150000,defaultDuration:30}
 ]},
 punishment:{label:'Hukuman / Konsekuensi',metric:'durationMinutes',tiers:[
  {id:'sepele',label:'Ringan',range:[1,30],duration:[1,30],exp:[0,100000],money:[-2000,0],defaultValue:12,defaultDuration:12},
  {id:'menengah',label:'Sedang',range:[31,120],duration:[31,120],exp:[0,100000],money:[-10000,0],defaultValue:70,defaultDuration:70},
  {id:'prestige',label:'Berat',range:[121,4320],duration:[121,4320],exp:[0,100000],money:[-100000,0],defaultValue:180,defaultDuration:180}
 ]}
};
const TIERS=['sepele','menengah','prestige'];
function cfg(category,tier){const c=CATEGORY[category]||CATEGORY.money;
 return {category:category in CATEGORY?category:'money',metric:c.metric,label:c.label,
  tier:c.tiers.find(t=>t.id===tier)||c.tiers[0]};}
function valueAt(item,path){if(path==='ingredients.length')return (item?.ingredients||[]).length;
 if(path.startsWith('statEffects.'))return Number(item?.statEffects?.[path.slice(12)])||0;
 return Number(item?.[path])||0;}
function infer(category,item){
 const c=CATEGORY[category]||CATEGORY.money,v=valueAt(item,c.metric);
 const matched=c.tiers.find(t=>v>=t.range[0]&&v<=t.range[1]);
 return matched?.id||'sepele';
}
function preset(category,tier){
 const {metric,tier:t}=cfg(category,tier),e={tier:t.id,
  minExp:t.defaultExp||0,minEnergy:0,minHygiene:0,
  durationMinutes:t.defaultDuration,moneyDelta:t.defaultMoney||0,
  statEffects:{energy:0,fullness:0,hygiene:0,bladder:0,moral:0,experience:0},
  riskPercent:t.defaultRisk||0,detentionMinutes:0,ingredients:[]};
 if(metric==='moneyDelta')e.moneyDelta=t.defaultValue;
 else if(metric==='durationMinutes')e.durationMinutes=t.defaultDuration;
 else if(metric==='ingredients.length')e.ingredients=Array.from({length:t.defaultValue},(_,i)=>'bahan_'+(i+1));
 else if(metric.startsWith('statEffects.'))e.statEffects[metric.slice(12)]=t.defaultValue;
 return e;
}
function bounds(category,tier){
 const {metric,tier:t}=cfg(category,tier);
 return {tier:t.id,metric,primary:t.range,durationMinutes:t.duration,
  minExp:t.exp,moneyDelta:t.money,riskPercent:t.risk||[0,100],
  detentionMinutes:[0,4320]};
}
function violations(item){
 const c=cfg(item?.category,item?.tier||infer(item?.category,item)),b=bounds(c.category,c.tier.id);
 const failures=[];
 for(const [key,range] of [
  [b.metric,b.primary],['durationMinutes',b.durationMinutes],
  ['minExp',b.minExp],['moneyDelta',b.moneyDelta],['riskPercent',b.riskPercent]
 ]){
  if(failures.some(x=>x.key===key))continue;
  const value=valueAt(item,key);
  if(!Number.isFinite(value)||value<range[0]||value>range[1])
   failures.push({key,value,min:range[0],max:range[1]});
 }
 return failures;
}
function matchWorld(rule,objects,cityId){
 if(!rule)return null;
 // Manual directory selections take precedence: marking is per saved city
 // and never silently expands to unrelated buildings/NPCs with the same name.
 if(Array.isArray(rule.targets)&&rule.targets.length){
  if(!cityId)return null;
  const ids=new Set(rule.targets.filter(x=>x.cityId===String(cityId)).map(x=>String(x.objectId)));
  return (objects||[]).find(o=>o&&ids.has(String(o.id)))||null;
 }
 const query=String(rule.query||'').trim().toLowerCase(),mode=rule.matchMode||'name';
 if(!query)return null;
 return (objects||[]).find(obj=>{
  if(!obj)return false;
  const name=String(obj.name||obj.label||obj.subtype||'').toLowerCase();
  const asset=String(obj.asset||obj.assetId||'').toLowerCase();
  if(mode==='id')return String(obj.id||'').toLowerCase()===query;
  if(mode==='asset')return asset===query;
  if(mode==='type')return String(obj.type||'').toLowerCase()===query;
  return name.includes(query)||asset.includes(query);
 })||null;
}
const ENTITIES=['building','npc','object'];
const OPERATIONS=['enter','npc_quest','ambient','none'];
const MATCH_MODES=['name','asset','type','id'];
function worldRule(data={}){
 const str=(v,n=120)=>String(v||'').trim().slice(0,n);
 const slug=v=>str(v,64).toLowerCase().replace(/[^a-z0-9_-]/g,'_');
 const kind=ENTITIES.includes(data.kind)?data.kind:'object';
 const op=OPERATIONS.includes(data.operation)?data.operation:
  kind==='building'?'enter':kind==='npc'?'npc_quest':'ambient';
 const seen=new Set(),targets=[];
 for(const entry of (Array.isArray(data.targets)?data.targets:[]).slice(0,2500)){
  const cityId=str(entry?.cityId,110),objectId=str(entry?.objectId||entry?.id,110);
  if(!cityId||!objectId||seen.has(cityId+'::'+objectId))continue;
  seen.add(cityId+'::'+objectId);targets.push({cityId,objectId});
 }
 return {id:slug(data.id)||'world_rule',label:str(data.label||'Interaksi Baru'),
  kind,operation:op,enabled:data.enabled===true,
  matchMode:MATCH_MODES.includes(data.matchMode)?data.matchMode:'name',
  query:str(data.query),targets,activityId:slug(data.activityId),
  actionAsset:str(data.actionAsset,100),description:str(data.description,300),
  tier:TIERS.includes(data.tier)?data.tier:'sepele',
  category:Object.hasOwn(CATEGORY,data.category)?data.category:
   op==='ambient'?'immoral':'moral',
  durationMinutes:Math.max(1,Math.min(4320,Math.round(Number(data.durationMinutes)||5))),
  moneyDelta:Math.max(-1e9,Math.min(1e9,Math.round(Number(data.moneyDelta)||0))),
  statEffects:Object.fromEntries(['energy','fullness','hygiene','bladder','moral','experience']
   .map(k=>[k,Math.max(-100,Math.min(100,Math.round(Number(data.statEffects?.[k])||0)))])),
  enterable:data.enterable===true,riskPercent:Math.max(0,Math.min(100,Math.round(Number(data.riskPercent)||0))),
  minExp:Math.max(0,Math.min(100000,Math.round(Number(data.minExp)||0)))};
}
function seedWorld(){
 return [
  worldRule({id:'building_enter',label:'Masuk Gedung',kind:'building',operation:'enter',
   matchMode:'name',query:'kantor',enterable:true,category:'moral',description:'Masuk gedung dengan interior yang sudah dibangun di Bangun Ruang'}),
  worldRule({id:'npc_quest',label:'NPC Memberi Quest',kind:'npc',operation:'npc_quest',
   matchMode:'name',query:'Pak Ogah',activityId:'bantu_npc',description:'NPC memberikan aktivitas yang terhubung dengan Jiwa'}),
  worldRule({id:'wall_pee',label:'Pipis di Tembok',kind:'object',operation:'ambient',matchMode:'name',
   query:'tembok',tier:'sepele',category:'immoral',actionAsset:'pee_wall',durationMinutes:3,
   statEffects:{moral:-5,bladder:-70,hygiene:-5},description:'Aksi non-quest, tidak membuat pin quest'}),
  worldRule({id:'wall_vandal',label:'Vandalisme Dinding',kind:'object',operation:'ambient',
   matchMode:'name',query:'tembok',tier:'menengah',category:'immoral',actionAsset:'vandal_wall',
   durationMinutes:15,statEffects:{moral:-14,energy:-5},riskPercent:30,
   description:'Aksi non-quest yang bisa memicu konsekuensi'})
 ];
}
return Object.freeze({CATEGORY,TIERS,cfg,infer,preset,bounds,violations,
 matchWorld,worldRule,seedWorld,ENTITIES,OPERATIONS,MATCH_MODES});
});

/* NJH balancing loader (slice-1.0). The ONLY place slice numbers come from is
 * content/balancing.json. This file maps table keys onto the runtime shapes
 * (Jiwa life-economy settings/jobs/fish, quest table, clock rate). It holds no
 * tuning numbers itself; if the JSON is missing every getter returns null and
 * the game keeps its old code defaults.
 * Browser: loaded synchronously from ../content/balancing.json next to this
 * script (cache-busted with this script's ?v=). Node: read from disk.
 */
(function(root,factory){
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.NJHBalancing=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
'use strict';
const FILE='content/balancing.json';
let doc=null,loadError=null,sourceUrl=null;
function scriptUrl(){
 try{
  const cs=root&&root.document&&root.document.currentScript;
  if(cs&&cs.src&&/njh-balancing\.js/.test(cs.src))return cs.src;
  const list=root&&root.document?root.document.getElementsByTagName('script'):[];
  for(const s of list)if(s.src&&/\/shared\/njh-balancing\.js/.test(s.src))return s.src;
 }catch(_e){}
 return null;
}
const SCRIPT_URL=scriptUrl();
function readDoc(){
 if(doc||loadError)return doc;
 try{
  if(root&&root.__NJH_BALANCING_DOC__&&typeof root.__NJH_BALANCING_DOC__==='object'){doc=root.__NJH_BALANCING_DOC__;sourceUrl='inline';return doc;}
  if(typeof module!=='undefined'&&module.exports&&typeof require==='function'&&typeof process!=='undefined'&&process.versions&&process.versions.node){
   const fs=require('fs'),path=require('path');
   const file=path.join(__dirname,'..',FILE);
   doc=JSON.parse(fs.readFileSync(file,'utf8'));sourceUrl=file;return doc;
  }
  if(root&&typeof root.XMLHttpRequest==='function'){
   const base=SCRIPT_URL||(root.location&&root.location.href)||'';
   const v=(()=>{try{return new URL(SCRIPT_URL).searchParams.get('v')||'';}catch(_e){return '';}})();
   const url=new URL((SCRIPT_URL?'../':'/')+FILE+(v?'?v='+encodeURIComponent(v):''),base).href;
   const xhr=new root.XMLHttpRequest();
   xhr.open('GET',url,false); // synchronous on purpose: settings must exist before life-economy/daynight start
   xhr.send(null);
   if(xhr.status>=200&&xhr.status<300){doc=JSON.parse(xhr.responseText);sourceUrl=url;return doc;}
   throw Error('HTTP '+xhr.status+' '+url);
  }
 }catch(e){loadError=e;try{root&&root.console&&root.console.warn('[NJHBalancing] '+FILE+' not loaded: '+(e&&e.message||e));}catch(_e){}}
 return doc;
}
function ok(){return !!readDoc()&&Array.isArray(doc.params);}
let paramMap=null;
function params(){
 if(paramMap)return paramMap;
 paramMap=new Map();
 if(ok())for(const p of doc.params)if(p&&p.key)paramMap.set(p.key,p.value);
 return paramMap;
}
function has(key){return params().has(key);}
function value(key,fallback){const m=params();return m.has(key)?m.get(key):fallback;}
function num(key){const v=value(key,undefined);const n=Number(v);return v===null||v===undefined||v===''||!Number.isFinite(n)?undefined:n;}
function hhmm(key){const v=value(key,undefined);const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||''));return m?Number(m[1])*60+Number(m[2]):undefined;}
function rp(n){return 'Rp'+Number(n||0).toLocaleString('id-ID');}
/* Table key -> Jiwa life-economy settings key. Negative table deltas are
 * stored as positive costs where the engine subtracts (cost:true). */
const SETTINGS_MAP=Object.freeze([
 ['clock.realSecondsPerGameMinute','realSecondsPerGameMinute'],
 ['start.wallet','startWallet'],['start.energy','startEnergy'],['start.fullness','startFullness'],
 ['start.hygiene','startHygiene'],['start.bladder','startBladder'],['start.moral','startMoral'],
 ['start.bagSlots','bagSlots'],
 ['kos.price','roomPrice'],
 ['jobs.dailyWageCap','dailyWageCap'],
 ['needs.passiveEnergyMinutes','passiveEnergyMinutes'],['needs.passiveFullnessMinutes','passiveFullnessMinutes'],
 ['needs.passiveBladderMinutes','passiveBladderMinutes'],['needs.passiveHygieneMinutes','passiveHygieneMinutes'],
 ['needs.fullnessZeroEnergyDrain','fullnessZeroEnergyDrain'],
 ['needs.bladderAccident.hygiene','bladderAccidentHygiene',true],['needs.bladderAccident.moral','bladderAccidentMoral',true],
 ['food.warteg.price','wartegMealPrice'],['food.warteg.fullness','wartegFullness'],['food.warteg.energy','wartegEnergy'],['food.warteg.bladder','wartegBladder'],
 ['food.gorengan.price','streetFoodPrice'],['food.gorengan.fullness','streetFoodFullness'],['food.gorengan.energy','streetFoodEnergy'],['food.gorengan.bladder','streetFoodBladder'],
 ['food.coffee.price','coffeePrice'],['food.coffee.energy','coffeeEnergy'],['food.coffee.bladder','coffeeBladder'],
 ['food.fruit.fullness','fruitFullness'],['food.fruit.energy','fruitEnergy'],['food.fruit.pickEnergy','fruitPickEnergy'],['food.fruit.pickMinutes','fruitPickMinutes'],
 ['facility.publicToilet.price','publicToiletPrice'],['facility.publicToilet.hygienePenalty','publicToiletPenalty'],['facility.publicToilet.minutes','toiletMinutes'],
 ['facility.publicShower.price','publicShowerFee'],['facility.publicShower.hygiene','publicShowerRecovery'],['facility.publicShower.minutes','showerMinutes'],
 ['facility.wallPee.moral','wallPeeMoral',true],
 ['sleep.actionMinutes','sleepMinutes'],
 ['sleep.tent.energy','hoboSleepRecovery'],['sleep.tent.hygiene','hoboSleepHygieneCost',true],
 ['sleep.kosBed.energy','homeSleepRecovery'],['sleep.kosBed.hygiene','homeSleepHygieneCost',true],
 ['sleep.benchRest.energy','seatRestEnergy'],
 ['faint.restMinutes','faintRestMinutes'],['faint.recoveryEnergy','faintRecoveryEnergy'],
 ['faint.moneyLossPct','faintMoneyLossPct'],['faint.moneyLossMax','faintMoneyLossMax'],
 ['scavenge.minutes','scavengeMinutes'],['scavenge.energy','scavengeEnergy'],['scavenge.sellLoakPrice','loakPrice'],
 ['fish.minutes','fishMinutes'],['fish.energy','fishEnergy'],
 ['help.minutes','helpMinutes'],['help.energy','helpEnergy',true],['help.moral','helpMoral']
]);
const JOB_FIELDS=Object.freeze(['minutes','wage','energyCost','hygieneCost','exp','minHygiene']);
function lifeSettings(){
 if(!ok())return null;
 const s={};
 for(const [key,name,cost] of SETTINGS_MAP){
  let n=num(key);if(n===undefined)continue;
  if(cost)n=Math.abs(n);
  s[name]=n;
 }
 if(value('kos.guestRoomIncludesStove',false)===true)s.roomIncludesStove=1;
 const scope=value('jobs.dailyWageCapScope',undefined);
 if(scope==='global'||scope==='per_job')s.dailyWageCapGlobal=scope==='global'?1:0;
 const day=hhmm('clock.dayStartTime');if(day!==undefined)s.dayStartMinute=day;
 const start=hhmm('clock.newGameStartTime');if(start!==undefined)s.newGameStartMinute=start;
 return s;
}
function jobs(){
 if(!ok())return null;
 const ids=new Set();
 for(const k of params().keys()){const m=/^jobs\.([a-z_]+)\.([a-zA-Z]+)$/.exec(k);if(m&&m[1]!=='dailyWageCap')ids.add(m[1]);}
 const out=[];
 for(const id of ids){
  const row={id};
  for(const f of JOB_FIELDS){const n=num('jobs.'+id+'.'+f);if(n!==undefined)row[f]=n;}
  const en=value('jobs.'+id+'.enabled',undefined);if(typeof en==='boolean')row.enabled=en;
  if(Object.keys(row).length>1)out.push(row);
 }
 return out;
}
function fish(){
 if(!ok())return null;
 const weights={};
 const w=String(value('fish.weights','')||'');
 for(const part of w.split('/')){const m=/([a-z_]+)\s+(\d+(?:\.\d+)?)/.exec(part.trim());if(m)weights[m[1]]=Number(m[2]);}
 const ids=new Set(Object.keys(weights));
 for(const k of params().keys()){const m=/^fish\.price\.([a-z_]+)\./.exec(k);if(m)ids.add(m[1]);}
 const spoil=num('fish.spoilMinutes');
 return [...ids].map(id=>{
  const row={id,buyers:{}};
  if(weights[id]!==undefined)row.weight=weights[id];
  if(spoil!==undefined)row.spoilMinutes=spoil;
  for(const [buyer,key] of [['siomay_batagor','siomay'],['pasar_ikan','pasar']]){
   if(has('fish.price.'+id+'.'+key)){const v=value('fish.price.'+id+'.'+key);row.buyers[buyer]=v===null?null:Number(v);}
  }
  return row;
 });
}
/* Raw config for JiwaLifeEconomy.normalize(); balancing wins over Jiwa/local. */
function lifeEconomy(){
 if(!ok())return null;
 return {settings:lifeSettings(),jobs:jobs(),fish:fish()};
}
function applyToLifeConfig(raw){
 const b=lifeEconomy();
 const base=raw&&typeof raw==='object'?raw:{};
 if(!b)return base;
 const byId=list=>new Map((Array.isArray(list)?list:[]).filter(x=>x&&x.id).map(x=>[x.id,x]));
 const mergeList=(cur,over)=>{
  const m=byId(cur);
  for(const o of over){const prev=m.get(o.id)||{};const next=Object.assign({},prev,o);
   if(o.buyers)next.buyers=Object.assign({},prev.buyers||{},o.buyers);m.set(o.id,next);}
  return [...m.values()];
 };
 return Object.assign({},base,{
  settings:Object.assign({},base.settings||{},b.settings),
  jobs:mergeList(base.jobs,b.jobs),
  fish:mergeList(base.fish,b.fish)
 });
}
function fill(text,q){
 return String(text||'').replace(/\{([a-zA-Z0-9_.]+)\}/g,(all,key)=>{
  if(key==='target')return q.kind==='earn'?rp(q.target):String(q.target);
  if(!has(key))return all;
  const p=doc.params.find(r=>r.key===key);const v=value(key);
  return p&&p.unit==='Rp'?rp(v):String(v);
 });
}
function quests(){
 if(!ok()||!Array.isArray(doc.quests))return null;
 return doc.quests.map(q=>{
  const reward=num('quest.'+q.id+'.reward');
  const row=Object.assign({},q,{reward:reward===undefined?0:reward});
  row.act=Array.isArray(q.act)?q.act.slice():q.act?[q.act]:undefined;
  row.title=fill(q.title,row);row.text=fill(q.text,row);row.goal=fill(q.goal,row);
  row.chain=true;
  return Object.freeze(row);
 });
}
function clock(){
 if(!ok())return null;
 return {realSecondsPerGameMinute:num('clock.realSecondsPerGameMinute'),
  gameMinutesPerDay:num('clock.gameMinutesPerDay'),
  newGameStartMinute:hhmm('clock.newGameStartTime'),dayStartMinute:hhmm('clock.dayStartTime')};
}
/* Real ms to hold AKSI for a session that advances `gameMinutes` on the clock. */
function holdMs(gameMinutes){
 const r=num('clock.realSecondsPerGameMinute');
 return r===undefined?null:Math.round(Math.max(0,Number(gameMinutes)||0)*r*1000);
}
function list(key){const v=value(key,null);return Array.isArray(v)?v.slice():[];}
function lockedTemplates(){return list('doors.sliceLocked');}
function coffeeAt(){return value('shop.coffeeAt',null);}
function info(){
 readDoc();
 return {loaded:ok(),version:doc&&doc.version||null,revision:doc&&doc.contentRevision||null,
  source:sourceUrl,error:loadError?String(loadError.message||loadError):null,params:params().size};
}
return Object.freeze({FILE,SETTINGS_MAP,info,ok,has,value,num,params:()=>new Map(params()),
 lifeSettings,jobs,fish,lifeEconomy,applyToLifeConfig,quests,clock,holdMs,lockedTemplates,coffeeAt,rp,
 _reset:()=>{doc=null;loadError=null;paramMap=null;sourceUrl=null;}});
});

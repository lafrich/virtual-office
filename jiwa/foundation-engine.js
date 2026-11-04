/* JIWA Foundation v2: data-only contextual rules and isolated sandbox. No production game writes. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.JiwaFoundation=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const VERSION=2;
 const GROUPS=['Survival','Economy','Progression','Housing','Morality','Social'];
 const CONDS=['verified','progress_complete','wallet_min','energy_min','inventory_free','has_item','home_access','no_home','social_enabled','skill_min','trust_min','intent_confirmed'];
 const EFFECTS=['wallet_delta','stat_fullness','stat_energy','stat_hygiene','stat_bladder','wage','work_xp','course_xp','pickup','sell_item','moral_delta','trust_delta','reputation_delta','spiritual_delta','memory','set_spawn','offer_unlock','message'];
 const PRESETS=[
  ['crossing','Menyeberang jalan','Survival','CROSSING_COMPLETED','road_crossing','Biaya energi sekali setelah selesai menyeberang.',[['verified',true]],[['stat_energy',-2]]],
  ['public_rest','Istirahat di tempat umum','Survival','REST_COMPLETE','public_rest','Recovery dasar agar homeless tidak softlock.',[['verified',true]],[['stat_energy',15]]],
  ['eat','Makan di warteg','Survival','EAT_COMPLETE','food_vendor','Makan berbayar menambah kenyang.',[['verified',true],['wallet_min',2500]],[['wallet_delta',-2500],['stat_fullness',40]]],
  ['water','Minum air gratis','Survival','DRINK_COMPLETE','water_source','Sumber air gratis; tidak menambah uang atau kenyang.',[['verified',true]],[['stat_bladder',5]]],
  ['toilet','Gunakan toilet','Survival','TOILET_COMPLETE','toilet','Buang air di WC tanpa denda kebersihan.',[['verified',true]],[['stat_bladder',-100]]],
  ['shower','Mandi','Survival','SHOWER_COMPLETE','shower','Pulihkan hygiene melalui fasilitas yang boleh diakses.',[['verified',true]],[['stat_hygiene',70]]],
  ['sleep','Tidur','Survival','SLEEP_COMPLETE','bed','Energi pulih setelah istirahat yang sah.',[['verified',true]],[['stat_energy',25]]],
  ['basic_job','Kerja harian','Economy','JOB_COMPLETE','job_npc','Gaji dibatasi kuota per game-day, progress harus diverifikasi.',[['verified',true],['progress_complete',true],['energy_min',8]],[['wage',3000],['stat_energy',-8],['work_xp',10]]],
  ['scavenge','Memulung barang','Economy','SCAVENGE_COMPLETE','scavenge_spot','Barang unik masuk tas maksimum 8 slot.',[['verified',true],['inventory_free',1]],[['pickup','@event.itemId'],['stat_energy',-2]]],
  ['loak_sell','Jual di Toko Loak','Economy','LOAK_SELL_COMPLETE','loak_vendor','Jual hanya item yang dimiliki, gunakan penawaran server.',[['verified',true],['has_item','@event.itemId']],[['sell_item','@event.itemId']]]],
  ['online_course','Kursus di HP','Progression','COURSE_COMPLETE','phone_course','XP kursus maksimum 150 per game-day.',[['verified',true],['progress_complete',true]],[['course_xp',30],['stat_energy',-3]]],
  ['home_enter','Akses kamar Cove','Housing','ROOM_ENTER','cove_room','Hanya penghuni dengan hak akses aktif yang bisa masuk.',[['verified',true],['home_access',true]],[['message','Akses kamar diterima']]], 
  ['home_spawn','Spawn di kamar','Housing','SPAWN_REQUEST','cove_room','Spawn kamar hanya saat kepemilikan/sewa valid.',[['verified',true],['home_access',true]],[['set_spawn','home']]],
  ['hobo_spawn','Homeless respawn','Housing','SPAWN_REQUEST','public_spawn','Fallback aman saat belum punya kamar.',[['verified',true],['no_home',true]],[['set_spawn','hobo']]],
  ['help_npc','Membantu warga','Morality','HELP_NPC_COMPLETE','npc','Kebaikan mengubah moral dan trust saksi/penerima.',[['verified',true],['energy_min',5]],[['stat_energy',-5],['moral_delta',3],['trust_delta',8],['memory','helped_npc']]],
  ['charity','Beramal','Morality','DONATION_COMPLETE','donation_box','Saldo benar-benar berkurang; reputasi publik tidak otomatis naik.',[['verified',true],['wallet_min',1000]],[['wallet_delta',-1000],['moral_delta',2]]],
  ['worship','Ibadah','Morality','WORSHIP_COMPLETE','worship_place','Aktivitas spiritual/mood, tidak otomatis menambah moral.',[['verified',true]],[['spiritual_delta',10]]],
  ['theft','Mengambil barang milik orang','Morality','THEFT_COMPLETE','owned_item','Aksi disengaja; reputasi hanya berubah jika diketahui saksi.',[['verified',true],['intent_confirmed',true],['inventory_free',1]],[['pickup','@event.itemId'],['moral_delta',-8],['reputation_delta',-10],['memory','theft_witnessed']]],
  ['referral','Kesempatan dari koneksi','Social','REFERRAL_OFFER','npc','Locked sampai social aktif; skill + trust + luck hanya membuka tawaran.',[['verified',true],['social_enabled',true],['skill_min',30],['trust_min',60]],[['offer_unlock','event_crew']]] 
 ];
 const copy=o=>JSON.parse(JSON.stringify(o));
 const int=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback;};
 const txt=(v,max)=>String(v==null?'':v).slice(0,max);
 function defaultFoundation(){
  return {version:VERSION,settings:{bagSlots:8,dailyWageCap:6000,dailyCourseXpCap:150,socialEnabled:false,baseLuck:50,needsOfflineDecay:false},
   contexts:PRESETS.map(p=>({id:p[0],label:p[1],group:p[2],trigger:p[3],target:p[4],description:p[5],enabled:true,
    conditions:p[6].map(v=>({kind:v[0],value:String(v[1])})),effects:p[7].map(v=>({kind:v[0],value:String(v[1])})),objectId:''}))};
 }
 function normalizeFoundation(raw){
  const base=defaultFoundation(),settings=raw&&raw.settings||{},entries=Array.isArray(raw&&raw.contexts)?raw.contexts:[];
  base.settings={
   bagSlots:8, // preserve the established 8-slot v15a bag.
   dailyWageCap:int(settings.dailyWageCap,0,100000,6000),
   dailyCourseXpCap:int(settings.dailyCourseXpCap,0,150,150),
   socialEnabled:settings.socialEnabled===true,
   baseLuck:int(settings.baseLuck,0,100,50),
   needsOfflineDecay:false
  };
  const byId=new Map(base.contexts.map(v=>[v.id,v]));
  for(const item of entries.slice(0,100)){
   if(!item||typeof item.id!=='string'||!byId.has(item.id))continue;
   const current=byId.get(item.id);
   const cleanRows=(rows,allow)=>Array.isArray(rows)?rows.slice(0,20).filter(v=>v&&allow.includes(v.kind)).map(v=>({kind:v.kind,value:txt(v.value,120)})):[];
   current.label=txt(item.label||current.label,70);
   current.description=txt(item.description||current.description,300);
   current.enabled=item.enabled!==false;
   current.target=txt(item.target||current.target,80);
   current.objectId=txt(item.objectId||'',150);
   current.conditions=cleanRows(item.conditions,CONDS);
   current.effects=cleanRows(item.effects,EFFECTS);
  }
  return base;
 }
 function newTestState(systems,foundation){
  const s=systems||{};
  return {wallet:int(s.wallet,0,1e9,6000),fullness:int(s.fullness,0,100,70),
   energy:int(s.energy,0,100,80),hygiene:int(s.hygiene,0,100,75),bladder:int(s.bladder,0,100,20),time:s.time||'08:00',
   inventory:[],quests:[],moral:50,spiritual:50,reputation:50,trust:20,skill:0,workXP:0,
   gameDay:1,dailyWages:0,dailyCourseXP:0,homeAccess:false,spawn:'hobo',offers:[],memories:[],
   claimedSpawns:[],completedJobs:[],seenEvents:[],donationsToday:0,foundationVersion:VERSION};
 }
 function conditionCheck(c,s,settings,payload){
  const n=Number(c.value);
  switch(c.kind){
   case 'verified':return payload.verified===true;
   case 'progress_complete':return payload.progressComplete===true;
   case 'wallet_min':return s.wallet>=n;
   case 'energy_min':return s.energy>=n;
   case 'inventory_free':return s.inventory.length+Math.max(1,n)<=settings.bagSlots;
   case 'has_item':return s.inventory.includes(c.value==='@event.itemId'?payload.itemId:c.value);
   case 'home_access':return s.homeAccess===true;
   case 'no_home':return s.homeAccess!==true;
   case 'social_enabled':return settings.socialEnabled===true;
   case 'skill_min':return s.skill>=n;
   case 'trust_min':return s.trust>=n;
   case 'intent_confirmed':return payload.confirmed===true;
   default:return false;
  }
 }
 function describeBlock(c){
  const why={verified:'needs verified completion',progress_complete:'progress not finished',
   wallet_min:'not enough money',energy_min:'not enough energy',inventory_free:'bag full',
   has_item:'item not owned',home_access:'no room permission',no_home:'already housed',
   social_enabled:'social module still locked',skill_min:'skill too low',
   trust_min:'NPC trust too low',intent_confirmed:'confirmation required'};
  return why[c.kind]||c.kind;
 }
 function execute(foundation,id,previous,payload){
  const f=normalizeFoundation(foundation),ctx=f.contexts.find(x=>x.id===id);
  if(!ctx||!ctx.enabled)return {ok:false,reason:'Context unavailable',state:copy(previous)};
  const ev=Object.assign({},payload||{});
  if(typeof ev.eventId!=='string'||!ev.eventId.trim())return {ok:false,reason:'Missing unique event ID',state:copy(previous)};
  if(previous.seenEvents&&previous.seenEvents.includes(ev.eventId))return {ok:false,reason:'Duplicate event rejected',state:copy(previous)};
  const s=copy(previous),settings=f.settings;
  // Engine guardrails are NOT removable by editing conditions.
  const sensitive=['basic_job','scavenge','loak_sell','charity','theft','help_npc','referral','home_enter','home_spawn','hobo_spawn','online_course'];
  if(sensitive.includes(id)&&ev.verified!==true)return {ok:false,reason:'Event not server-verified',state:copy(previous)};
  if(id==='basic_job'&&ev.progressComplete!==true)return {ok:false,reason:'Work progress not complete',state:copy(previous)};
  if(id==='online_course'&&ev.progressComplete!==true)return {ok:false,reason:'Course not complete',state:copy(previous)};
  if(id==='theft'&&ev.confirmed!==true)return {ok:false,reason:'Risky action not confirmed',state:copy(previous)};
  if(id==='referral'&&!settings.socialEnabled)return {ok:false,reason:'Social feature locked',state:copy(previous)};
  if((id==='home_enter'||id==='home_spawn')&&s.homeAccess!==true)return {ok:false,reason:'Room access denied',state:copy(previous)};
  if(id==='hobo_spawn'&&s.homeAccess===true)return {ok:false,reason:'Owned room available: no homeless respawn',state:copy(previous)};
  if(id==='scavenge'||id==='theft'){
   if(!ev.itemId)return {ok:false,reason:'Item ID required',state:copy(previous)};
   if(s.inventory.length>=settings.bagSlots)return {ok:false,reason:'Bag is full',state:copy(previous)};
  }
  if(id==='scavenge'){
   if(!ev.spawnId)return {ok:false,reason:'Spawn ID required',state:copy(previous)};
   if(s.claimedSpawns.includes(ev.spawnId))return {ok:false,reason:'Loot already claimed',state:copy(previous)};
  }
  if(id==='loak_sell'&&(!ev.itemId||!s.inventory.includes(ev.itemId)))return {ok:false,reason:'Cannot sell item not owned',state:copy(previous)};
  if(id==='basic_job'&&(!ev.jobInstanceId||s.completedJobs.includes(ev.jobInstanceId)))return {ok:false,reason:'Job already paid or job instance missing',state:copy(previous)};
  if(id==='referral'&&(s.skill<30||s.trust<60))return {ok:false,reason:'Referral prerequisites unmet',state:copy(previous)};
  const failed=ctx.conditions.find(c=>!conditionCheck(c,s,settings,ev));
  if(failed)return {ok:false,reason:describeBlock(failed),state:copy(previous)};
  const changes=[];
  function reject(reason){return {ok:false,reason,state:copy(previous)};}
  for(const e of ctx.effects){
   const n=Number(e.value),num=Number.isFinite(n)?n:0,stat=e.kind.startsWith('stat_')?e.kind.slice(5):'';
   if(e.kind==='wallet_delta'){
    if(num<0&&s.wallet<-num)return reject('Insufficient wallet balance');
    s.wallet=Math.max(0,s.wallet+num);changes.push('wallet '+num);
   }else if(['fullness','energy','hygiene','bladder'].includes(stat)){
    s[stat]=Math.min(100,Math.max(0,s[stat]+num));changes.push(stat+' '+num);
   }else if(e.kind==='wage'){
    const amount=Math.max(0,num);
    if(s.dailyWages+amount>settings.dailyWageCap)return reject('Daily wage quota reached');
    s.wallet+=amount;s.dailyWages+=amount;changes.push('wage +'+amount);
   }else if(e.kind==='work_xp'){
    s.workXP+=Math.max(0,num);changes.push('work XP +'+num);
   }else if(e.kind==='course_xp'){
    if(s.dailyCourseXP+num>settings.dailyCourseXpCap)return reject('Course XP cap reached');
    s.dailyCourseXP+=Math.max(0,num);s.skill+=Math.max(0,num);changes.push('course XP +'+num);
   }else if(e.kind==='pickup'){
    const item=e.value==='@event.itemId'?ev.itemId:e.value;
    if(!item||s.inventory.length>=settings.bagSlots)return reject('Item missing or inventory full');
    s.inventory.push(item);changes.push('picked '+item);
   }else if(e.kind==='sell_item'){
    const item=e.value==='@event.itemId'?ev.itemId:e.value;
    const idx=s.inventory.indexOf(item);
    if(idx<0)return reject('Cannot sell unowned item');
    const price=Number(ev.verifiedPrice);
    if(!Number.isFinite(price)||price<0||price>1000000)return reject('Missing valid verified sale quote');
    s.inventory.splice(idx,1);s.wallet+=Math.round(price);changes.push('sold '+item+' for '+price);
   }else if(['moral_delta','trust_delta','reputation_delta','spiritual_delta'].includes(e.kind)){
    const k=e.kind.split('_')[0];
    if(k==='reputation'&&ev.witnessed!==true){changes.push('reputation unchanged (no witness)');continue;}
    if(k==='trust'&&ev.witnessed!==true&&ev.recipient!==true){changes.push('trust unchanged (not witnessed)');continue;}
    const adj=(k==='moral'&&id==='charity'&&s.donationsToday>=2)?0:num;
    s[k]=Math.max(0,Math.min(100,(s[k]||0)+adj));changes.push(k+' '+adj);
   }else if(e.kind==='memory'){
    if(ev.witnessed===true||ev.recipient===true){
     s.memories.push({eventId:ev.eventId,kind:txt(e.value,60),source:ev.source||'observed',confidence:ev.witnessed?1:0.8});
     changes.push('NPC memory recorded');
    }else changes.push('no witness: no NPC memory');
   }else if(e.kind==='set_spawn'){
    if(e.value==='home'&&!s.homeAccess)return reject('Not authorized to spawn at Cove');
    s.spawn=e.value==='home'?'home':'hobo';changes.push('spawn '+s.spawn);
   }else if(e.kind==='offer_unlock'){
    const effective=Math.min(100,Math.max(0,settings.baseLuck+(s.moral-50)*0.2));
    const chance=Math.min(0.65,Math.max(0.05,0.2+(effective-50)*0.002));
    const roll=Number(ev.roll);
    if(!Number.isFinite(roll)||roll<0||roll>=1)return reject('Valid server RNG roll required');
    if(roll<chance&&!s.offers.includes(e.value)){s.offers.push(txt(e.value,80));changes.push('Offer unlocked: '+e.value);}
    else changes.push('No offer this encounter (chance '+Math.round(chance*100)+'%)');
   }else if(e.kind==='message'){changes.push(txt(e.value,120));}
  }
  if(id==='scavenge')s.claimedSpawns.push(ev.spawnId);
  if(id==='basic_job')s.completedJobs.push(ev.jobInstanceId);
  if(id==='charity')s.donationsToday++;
  s.seenEvents.push(ev.eventId);
  return {ok:true,state:s,changes,contextId:id};
 }
 function nextDay(previous){
  const s=copy(previous);s.gameDay=(Number(s.gameDay)||1)+1;
  s.dailyWages=0;s.dailyCourseXP=0;s.donationsToday=0;
  return s;
 }
 return Object.freeze({VERSION,GROUPS,CONDS,EFFECTS,PRESETS,defaultFoundation,normalizeFoundation,newTestState,execute,nextDay});
});
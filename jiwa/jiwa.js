/* JIWA.EXE · mechanics authoring companion for Semesta.
   All rules are data-only, no eval or production account/multiplayer writes.
   Map object IDs resolve against the original same-origin City Draft. */
(function(){
'use strict';
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const DB='jiwa-mechanics-v1',TABLE='projects',FALLBACK='jiwa-local-project:',CHANGE='jiwa-project-change';
const ACTIVE='virtual-life-active-city-draft';
const GLOBAL_CITY='__jiwa_global__';
const params=new URLSearchParams(location.search);
const KINDS=['wallet_min','stat_min','stat_max','has_item','quest_active','time_start','time_end'];
const EFFECTS=['wallet_delta','stat_fullness','stat_energy','stat_hygiene','stat_bladder','inventory_add','quest_start','quest_complete','message','animation'];
const TRIGGERS=['interact','enter','proximity','job_complete','time'];
const STAT=['fullness','energy','hygiene','bladder'];
const JF=window.JiwaFoundation;
const oldCharacter=o=>['avatar','npc','pedestrian','crowd','quest_npc'].includes(o?.type)||
 o?.layer==='character';
const visibleEntities=()=>window.VLCharacterReferenceReset?.active===true?
 state.entities.filter(o=>!oldCharacter(o)):state.entities;
const defaults=()=>({wallet:6000,time:'08:00',fullness:70,energy:80,hygiene:75,bladder:20});
const rule=(id,label,animation,conditions,effects,trigger='interact')=>({id,label,animation,enabled:true,trigger,conditions,effects});
const c=(kind,value)=>({kind,value:String(value)}),e=(kind,value)=>({kind,value:String(value)});
const TEMPLATES={
  generic:{label:'General Interaction',rules:[rule('interact','Interact','idle',[],[e('message','Interaction completed')])]},
  food:{label:'Food Vendor / Warteg',rules:[rule('buy_food','Beli makanan','eat',[c('wallet_min',2500)],[e('wallet_delta',-2500),e('stat_fullness',40),e('message','Makanan dibeli')])]},
  shop:{label:'Shop / Retail',rules:[rule('buy_item','Beli barang','talk',[c('wallet_min',1000)],[e('wallet_delta',-1000),e('inventory_add','item_01'),e('message','Barang dibeli')])]},
  bed:{label:'Bed / Sleep',rules:[rule('sleep','Tidur','sleep',[],[e('stat_energy',25),e('message','Energi pulih')])]},
  seat:{label:'Seat / Bench',rules:[rule('sit','Duduk','sit',[],[e('stat_energy',2)])]},
  toilet:{label:'Toilet / WC',rules:[rule('use_toilet','Gunakan toilet','toilet_sit',[],[e('stat_bladder',-100),e('message','Sudah lega')])]},
  bath:{label:'Bath / Shower',rules:[rule('bathe','Mandi','bath',[],[e('stat_hygiene',70)])]},
  job:{label:'Quest / Job NPC',rules:[
    rule('accept_job','Ambil pekerjaan','talk',[],[e('quest_start','street_job'),e('message','Pekerjaan dimulai')]),
    rule('complete_job','Selesaikan pekerjaan','work',[c('quest_active','street_job')],[e('quest_complete','street_job'),e('wallet_delta',3000),e('message','Pekerjaan selesai')],'job_complete')
  ]},
  transport:{label:'Transport / Vehicle',rules:[rule('board','Naik kendaraan','ride',[c('wallet_min',1000)],[e('wallet_delta',-1000),e('message','Tiket dibayar')])]},
  building:{label:'Enterable Building',rules:[rule('enter','Masuk bangunan','walk',[],[e('message','Entrance activated')],'enter')]}
};
const state={cities:[],record:null,project:null,entities:[],selected:null,action:0,dirty:false,tab:'map',test:null,testLines:[],zoom:1,panX:0,panY:0,midX:0,midZ:0,points:[],drag:null,selectedCategory:'',suppress:false};
function allTemplates(){return {...TEMPLATES,...(state.project?.templates||{})};}
function collectEntities(record){
 const base=record?.document?.objects||[],all=base.slice();
 for(const building of base){
  const floors=building?.interior?.floors||[];
  for(let fi=0;fi<floors.length;fi++){
   const f=floors[fi],items=Array.isArray(f?.items)?f.items:[];
   for(const item of items){
    if(!item?.id)continue;
    const floor=Number(f.floor)||fi+1;
    all.push({id:building.id+'::floor'+floor+'::'+item.id,
      name:objectName(building)+' / F'+floor+' / '+(item.assetId||'Furniture'),
      type:'interior',layer:'interior',subtype:item.assetId||'interior_item',
      asset:item.assetId||'',parentId:building.id,floor,actionId:item.actionId,
      x:(Number(building.x)||0)+((Number(item.c)||0)*.15),
      z:(Number(building.z)||0)+((Number(item.r)||0)*.15),
      interactions:[item.actionId||'interact'],source:'bangun-ruang-interior'});
   }
  }
 }
 return all;
}
function notice(msg){$('notice').textContent=msg;}
function markDirty(){state.dirty=true;$('dirtyState').textContent='● UNSAVED';$('dirtyState').style.color='#a34d00';}
function markSaved(){state.dirty=false;$('dirtyState').textContent='SAVED';$('dirtyState').style.color='';}
function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,Number(n)||0));}
function safeNum(x,lo=-1e8,hi=1e8){const n=Number(x);return Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):0;}
function cleanWord(x,max=100){return String(x==null?'':x).slice(0,max);}
function objectName(o){return cleanWord(o?.name||o?.label||o?.subtype||o?.asset||o?.type||'Object',80);}
function category(o){
 const s=[o?.type,o?.subtype,o?.asset,o?.name,Array.isArray(o?.interactions)?o.interactions.join(' '):''].join(' ').toLowerCase();
 if(o.type==='quest_npc'||/\bpak_ogah\b|\bkang_parkir\b|quest_npc/.test(s))return 'NPC & Jobs';
 if(o.type==='vehicle'||/gojek|transjakarta|motorcycle|bus_|taxi_/.test(s))return 'Vehicles';
 if(o.type==='marker')return 'Logic Markers';
 if(o.type==='npc'||o.type==='pedestrian'||o.type==='crowd'||o.type==='avatar'||o.layer==='character')return 'Characters & Crowd';
 if(o.layer==='structure'||o.type==='building'||o.type==='shop'||/rumah|warteg|kantor|ruko|hotel|indomaret|mall/.test(s))return 'Buildings';
 if(o.layer==='vegetation'||/pohon|tree|plant/.test(s))return 'Vegetation';
 return 'Props & Interior';
}
function templateFor(o){
 const s=[o?.type,o?.name,o?.subtype,o?.asset,Array.isArray(o?.interactions)?o.interactions.join(' '):''].join(' ').toLowerCase();
 if(o.type==='quest_npc')return 'job';
 if(o.type==='vehicle')return 'transport';
 if(/toilet|wc\b|kloset/.test(s))return 'toilet';
 if(/bathtub|bath|shower|mandi/.test(s))return 'bath';
 if(/bed|kasur|sleep/.test(s))return 'bed';
 if(/chair|seat|bench|sofa|bangku|duduk/.test(s))return 'seat';
 if(/warteg|warung|food|restaurant|kafe|cafe/.test(s))return 'food';
 if(/shop|toko|mart|indomaret/.test(s))return 'shop';
 if(o.layer==='structure'||o.type==='building'||o.type==='shop'||o.enterable)return 'building';
 return 'generic';
}
function fromTemplate(key){return clone((allTemplates()[key]||TEMPLATES.generic).rules);}
function binding(o){return state.project?.bindings?.[o.id]||null;}
function currentTemplate(o){return binding(o)?.template||templateFor(o);}
function rules(o){return binding(o)?.rules||fromTemplate(currentTemplate(o));}
function ensureBinding(){const o=selectedObject();if(!o)return null;if(!state.project.bindings[o.id])state.project.bindings[o.id]={template:templateFor(o),rules:fromTemplate(templateFor(o))};return state.project.bindings[o.id];}
function selectedObject(){return visibleEntities().find(o=>o.id===state.selected)||null;}
function newProject(id){return {version:2,cityId:id,updatedAt:null,systems:defaults(),bindings:{},templates:{},foundation:JF.defaultFoundation()};}
function dbOpen(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(TABLE))r.result.createObjectStore(TABLE,{keyPath:'cityId'});};r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);});}
async function dbOperation(op,val){
 const db=await dbOpen();return new Promise((resolve,reject)=>{const t=db.transaction(TABLE,op==='get'?'readonly':'readwrite'),r=t.objectStore(TABLE)[op](val);r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);t.oncomplete=()=>db.close();});
}
async function readProject(id){
 try{const p=await dbOperation('get',id);if(p)return p;}catch(err){console.warn('Jiwa IndexedDB read fallback',err);}
 try{const p=localStorage.getItem(FALLBACK+id);return p?JSON.parse(p):newProject(id);}catch{return newProject(id);}
}
async function writeProject(p){
 try{await dbOperation('put',p);return 'IndexedDB';}catch(err){console.warn('Jiwa IndexedDB save fallback',err);localStorage.setItem(FALLBACK+p.cityId,JSON.stringify(p));return 'localStorage';}
}
function validateProject(input,cityId){
 if(!input||input.cityId!==cityId||!input.bindings||typeof input.bindings!=='object'||Array.isArray(input.bindings))throw Error('Mechanics project does not match this city');
 const result=newProject(cityId),sys=input.systems||{};
 for(const key of ['wallet','fullness','energy','hygiene','bladder'])result.systems[key]=key==='wallet'?safeNum(sys[key]??result.systems[key],0,1e9):clamp(sys[key]??result.systems[key]);
 if(/^\d\d:\d\d$/.test(sys.time||''))result.systems.time=sys.time;
 const cleanRules=arr=>(Array.isArray(arr)?arr:[]).slice(0,80).map((r,i)=>({
  id:cleanWord(r?.id||'action_'+i,90),label:cleanWord(r?.label||'Action',70),
  enabled:r?.enabled!==false,trigger:TRIGGERS.includes(r?.trigger)?r.trigger:'interact',
  animation:cleanWord(r?.animation,80),
  conditions:(Array.isArray(r?.conditions)?r.conditions:[]).filter(x=>KINDS.includes(x?.kind)).slice(0,30).map(x=>({kind:x.kind,value:cleanWord(x.value,120)})),
  effects:(Array.isArray(r?.effects)?r.effects:[]).filter(x=>EFFECTS.includes(x?.kind)).slice(0,30).map(x=>({kind:x.kind,value:cleanWord(x.value,120)}))
 }));
 for(const [key,t] of Object.entries(input.templates||{}).slice(0,100)){
  if(!/^custom_[a-z0-9_]{1,48}$/.test(key)||!t)continue;
  result.templates[key]={label:cleanWord(t.label||'Custom Template',80),rules:cleanRules(t.rules)};
 }
 const ids=new Set(state.entities.map(o=>o.id));
 for(const [id,b] of Object.entries(input.bindings).slice(0,5000)){
  if(!ids.has(id)||!b||!Array.isArray(b.rules))continue;
  result.bindings[id]={template:(TEMPLATES[b.template]||result.templates[b.template])?b.template:'generic',rules:cleanRules(b.rules)};
 }
 result.foundation=JF.normalizeFoundation(input.foundation);
 return result;
}
async function save(){
 if(!state.project)return notice('No city selected');
 try{const p=validateProject(state.project,state.record.id);p.updatedAt=new Date().toISOString();const where=await writeProject(p);state.project=p;markSaved();notice('Rules saved · '+where+' · city unchanged');try{localStorage.setItem(CHANGE,JSON.stringify({cityId:p.cityId,at:p.updatedAt}));}catch{}}
 catch(e){notice('SAVE FAILED: '+e.message);}
}
async function listCities(){
 try{
  const savedCities=await window.VLCityDrafts.list();
  state.cities=[{id:GLOBAL_CITY,name:'GLOBAL FOUNDATION',objectCount:0},...savedCities];
  const picker=$('cityPicker'),previous=picker.value;
  picker.replaceChildren();
  if(!savedCities.length)notice('No city draft yet · edit the Global Foundation, or save a city in Semesta.');
  for(const row of state.cities)picker.add(new Option(row.name+' · '+row.objectCount+' objects',row.id));
  let wanted=params.get('city')||previous||localStorage.getItem(ACTIVE)||state.cities[0].id;
  if(!state.cities.some(x=>x.id===wanted))wanted=state.cities[0].id;
  picker.value=wanted;await loadCity(wanted);
 }catch(e){emptyCity('Unable to load Semesta drafts: '+e.message);}
}
function emptyCity(message){state.record=null;state.project=null;state.entities=[];state.selected=null;$('tree').replaceChildren();$('objCount').textContent='0';$('noSelection').hidden=false;$('objectInspector').hidden=true;notice(message);draw();}
async function loadCity(id){
 if(!id)return emptyCity('Select a Semesta city first.');
 try{
  const record=id===GLOBAL_CITY?{id:GLOBAL_CITY,name:'GLOBAL FOUNDATION',document:{objects:[],map:{}}}:await window.VLCityDrafts.load(id);
  if(!Array.isArray(record.document?.objects))throw Error('Invalid city document');
  state.record=record;state.entities=collectEntities(record);
  const raw=await readProject(id);
  if(id!==GLOBAL_CITY&&!raw.updatedAt){
   // New city copies the globally authored foundation, then becomes independent.
   const shared=await readProject(GLOBAL_CITY);
   if(shared.updatedAt&&shared.foundation)raw.foundation=clone(shared.foundation);
  }
  state.project=validateProject({...newProject(id),...raw,cityId:id},id);
  const shown=visibleEntities();
  state.selected=(params.get('city')===id&&params.get('object')&&shown.some(o=>o.id===params.get('object')))?params.get('object'):(state.selected&&shown.some(o=>o.id===state.selected)?state.selected:shown[0]?.id||null);
  state.action=0;markSaved();renderTree();renderInspector();renderSystems();resetTest();fitMap();$('objCount').textContent=String(visibleEntities().length);
  window.dispatchEvent(new Event('jiwa:context:render'));
  $('mapInfo').textContent=record.name+' · '+state.entities.length+' OBJECTS';
  notice('City loaded: '+record.name+' · edit mechanics only, placement read-only');
 }catch(e){emptyCity('Load failed: '+e.message);}
}
function renderTree(){
 const root=$('tree');root.replaceChildren();const rows=visibleEntities(),search=$('objectSearch').value.trim().toLowerCase();const groups=new Map();
 for(const o of rows){const cat=category(o);if(search&&!(objectName(o)+' '+(o.asset||'')+' '+o.id+' '+cat).toLowerCase().includes(search))continue;if(!groups.has(cat))groups.set(cat,[]);groups.get(cat).push(o);}
 let shown=0;
 for(const [cat,items] of groups){
  const d=document.createElement('details');d.open=true;const summary=document.createElement('summary');summary.textContent=cat+' ('+items.length+')';d.append(summary);
  for(const o of items.slice(0,400)){const b=document.createElement('button');b.className='object'+(o.id===state.selected?' active':'');b.type='button';b.textContent=objectName(o);b.title=o.id;b.addEventListener('click',()=>selectObject(o.id,true));d.append(b);shown++;}
  if(items.length>400){const hint=document.createElement('div');hint.className='empty';hint.textContent='Showing first 400 — filter to find more';d.append(hint);}
  root.append(d);
 }
 if(!shown){const el=document.createElement('div');el.className='empty';el.textContent=search?'No matching objects.':state.record?.id===GLOBAL_CITY?'Global core contexts: no map required. Choose a saved city to bind individual objects.':'No placed objects in city.';root.append(el);}
}
function selectObject(id,focus=false){state.selected=id;state.action=0;if(focus){const o=selectedObject();if(o){const p=iso(Number(o.x)||0,Number(o.z)||0);state.panX+=canvas.clientWidth/2-p.x;state.panY+=canvas.clientHeight/2-p.y;}}renderTree();renderInspector();draw();}
function renderInspector(){
 const o=selectedObject();$('noSelection').hidden=!!o;$('objectInspector').hidden=!o;
 if(!o){$('inspectorState').textContent='NO SELECTION';return;}
 $('inspectorState').textContent=category(o).toUpperCase().slice(0,20);
 $('selectedName').textContent=objectName(o);$('selectedMeta').textContent='ID: '+o.id+' · '+category(o)+' · C '+(o.x??0)+' / R '+(o.z??0);
 const chooser=$('template');chooser.replaceChildren();
 for(const [key,t] of Object.entries(allTemplates()))chooser.add(new Option(t.label,key));
 chooser.value=currentTemplate(o);
 const group=$('actions');group.replaceChildren();const rs=rules(o);
 rs.forEach((r,i)=>{const btn=document.createElement('button');btn.className=i===state.action?'active':'';btn.textContent=(r.enabled?'▶ ':'Ⅱ ')+(r.label||'Action');btn.type='button';btn.addEventListener('click',()=>{state.action=i;renderInspector();});group.append(btn);});
 $('ruleEditor').hidden=!rs.length;
 if(!rs.length)return;
 if(state.action>=rs.length)state.action=rs.length-1;
 const r=rs[state.action];
 $('enabled').checked=r.enabled!==false;$('ruleLabel').value=r.label||'';
 $('trigger').value=TRIGGERS.includes(r.trigger)?r.trigger:'interact';
 $('animation').value=r.animation||'';
 renderRulesRows('conditions',r.conditions||[],KINDS);
 renderRulesRows('effects',r.effects||[],EFFECTS);
}
function renderRulesRows(target,rows,choices){
 const elem=$(target);elem.replaceChildren();
 for(let i=0;i<rows.length;i++){
  const row=document.createElement('div');row.className='rule-row';const top=document.createElement('div');top.className='row';
  const sel=document.createElement('select');sel.setAttribute('aria-label',target+' type');
  for(const k of choices)sel.add(new Option(k.replaceAll('_',' ').toUpperCase(),k));
  sel.value=rows[i].kind;
  sel.addEventListener('change',()=>{const r=editedRule();if(!r)return;r[target][i].kind=sel.value;markDirty();});
  const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+target+' row');remove.addEventListener('click',()=>{const r=editedRule();if(!r)return;r[target].splice(i,1);markDirty();renderInspector();});
  top.append(sel,remove);
  const inp=document.createElement('input');inp.value=rows[i].value??'';inp.placeholder=target==='conditions'?'Required value':'Effect amount / ID / message';
  inp.setAttribute('aria-label',target+' value');
  inp.addEventListener('input',()=>{const r=editedRule();if(!r)return;r[target][i].value=cleanWord(inp.value,120);markDirty();});
  row.append(top,inp);elem.append(row);
 }
}
function editedRule(){const bind=ensureBinding();return bind?.rules?.[state.action]||null;}
function addRow(target,kind){const r=editedRule();if(!r||r[target].length>=30)return;r[target].push({kind,value:target==='conditions'?'0':'1'});markDirty();renderInspector();}
function saveCurrentAsTemplate(){
 const o=selectedObject();if(!o)return;
 const label=prompt('Nama template mekanik baru:','Custom '+objectName(o));if(!label||!label.trim())return;
 const id='custom_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
 state.project.templates[id]={label:cleanWord(label.trim(),80),rules:clone(rules(o))};
 state.project.bindings[o.id]={template:id,rules:fromTemplate(id)};
 state.action=0;markDirty();renderInspector();renderSystems();notice('Template created · apply to another object from the Template selector');
}
function renderSystems(){
 if(!state.project)return;
 for(const [k,v] of Object.entries(state.project.systems)){const input=$('sys-'+k);if(input)input.value=v;}
 const bound=Object.keys(state.project.bindings).length;
 $('registryInfo').textContent=Object.keys(allTemplates()).length+' reusable templates · '+bound+' object overrides · '+state.entities.length+' Semesta objects · '+(state.project.foundation?.contexts?.length||0)+' foundational contexts';
}
function tab(which){
 state.tab=which;
 for(const b of document.querySelectorAll('[data-tab]'))b.classList.toggle('active',b.dataset.tab===which);
 for(const name of ['map','systems','test','context'])$(name+'View').hidden=which!==name;
 if(which==='map')resizeCanvas();
 if(which==='systems')renderSystems();
 if(which==='test')renderTest();
 if(which==='context')window.dispatchEvent(new Event('jiwa:context:render'));
}
function resetTest(){
 const s=state.project?.systems||defaults();state.test=JF.newTestState(s,state.project?.foundation);state.testLines=['Sandbox reset · player wallet Rp '+Number(s.wallet||0).toLocaleString('id-ID')];
 renderTest();
}
function logTest(message){state.testLines.unshift(new Date().toLocaleTimeString('id-ID')+'  '+message);state.testLines=state.testLines.slice(0,55);renderTest();}
function renderTest(){
 if(!state.test)return;
 $('testStats').replaceChildren();
 for(const key of ['wallet','fullness','energy','hygiene','bladder']){
  const t=document.createElement('div');t.className='stat';const label=document.createElement('strong');label.textContent=key.toUpperCase();
  const val=document.createElement('div');val.textContent=key==='wallet'?'Rp '+Number(state.test[key]).toLocaleString('id-ID'):Math.round(state.test[key])+'/100';t.append(label,val);
  if(key!=='wallet'){const bar=document.createElement('div');bar.className='bar';const fill=document.createElement('div');fill.className='fill';fill.style.width=clamp(state.test[key])+'%';bar.append(fill);t.append(bar);}
  $('testStats').append(t);
 }
 const more=document.createElement('div');more.className='stat';more.style.gridColumn='1 / -1';more.textContent='DAY '+(state.test.gameDay||1)+' · MORAL '+(state.test.moral??50)+' · TRUST '+(state.test.trust??20)+' · SPIRITUAL '+(state.test.spiritual??50)+' · REPUTATION '+(state.test.reputation??50)+' · SKILL '+(state.test.skill??0)+' · DAILY WAGE Rp '+(state.test.dailyWages??0)+' · COURSE XP '+(state.test.dailyCourseXP??0);$('testStats').append(more);
 const inventory=document.createElement('div');inventory.className='subtle';inventory.style.gridColumn='1 / -1';inventory.textContent='BAG ('+state.test.inventory.length+'/8): '+(state.test.inventory.join(', ')||'empty')+' · QUESTS: '+(state.test.quests.join(', ')||'none')+' · SPAWN: '+(state.test.spawn||'hobo')+' · OFFERS: '+(state.test.offers||[]).join(', ');$('testStats').append(inventory);
 $('testLog').textContent=state.testLines.join('\n');
}
function passes(condition,s){
 const val=condition.value, n=Number(val);
 switch(condition.kind){
  case 'wallet_min':return s.wallet>=n;
  case 'stat_min':{const x=String(val).split(':');return STAT.includes(x[0])?s[x[0]]>=Number(x[1]):false;}
  case 'stat_max':{const x=String(val).split(':');return STAT.includes(x[0])?s[x[0]]<=Number(x[1]):false;}
  case 'has_item':return s.inventory.includes(String(val));
  case 'quest_active':return s.quests.includes(String(val));
  case 'time_start':return s.time>=String(val);
  case 'time_end':return s.time<=String(val);
  default:return false;
 }
}
function runAction(){
 const o=selectedObject(),r=o?rules(o)[state.action]:null;
 if(!o||!r)return logTest('Select object and action first.');
 if(!r.enabled)return logTest('BLOCKED · '+r.label+' is disabled');
 const fail=(r.conditions||[]).find(x=>!passes(x,state.test));
 if(fail)return logTest('BLOCKED · '+r.label+' · condition '+fail.kind+' ('+fail.value+')');
 const s=state.test,changes=[],effects=r.effects||[];
 // Legacy object-rule sandbox uses the same economy and inventory invariants as Context v2.
 // Preflight before applying ANY effect to avoid half-paid / half-granted transactions.
 const totalCost=effects.filter(x=>x.kind==='wallet_delta'&&Number(x.value)<0).reduce((n,x)=>n+Number(x.value),0);
 if(s.wallet+totalCost<0)return logTest('BLOCKED · Insufficient wallet for atomic purchase');
 const adds=effects.filter(x=>x.kind==='inventory_add').map(x=>String(x.value||'')).filter(Boolean);
 const maxBag=state.project.foundation?.settings?.bagSlots||8;
 if(s.inventory.length+adds.length>maxBag||adds.some(id=>s.inventory.includes(id)))
  return logTest('BLOCKED · Bag full or duplicate inventory item');
 const wage=r.trigger==='job_complete'?effects.filter(x=>x.kind==='wallet_delta'&&Number(x.value)>0).reduce((n,x)=>n+Number(x.value),0):0;
 if(wage>0&&(s.dailyWages||0)+wage>(state.project.foundation?.settings?.dailyWageCap||6000))
  return logTest('BLOCKED · Daily wage quota reached');
 for(const effect of effects){
  const n=Number(effect.value);
  if(effect.kind==='wallet_delta'){s.wallet=Math.max(0,s.wallet+safeNum(n,-1e8,1e8));changes.push('wallet '+n);}
  else if(effect.kind.startsWith('stat_')){const field=effect.kind.slice(5);if(STAT.includes(field)){s[field]=clamp(s[field]+safeNum(n,-100,100));changes.push(field+' '+n);}}
  else if(effect.kind==='inventory_add'){if(effect.value&&!s.inventory.includes(effect.value))s.inventory.push(effect.value);changes.push('item '+effect.value);}
  else if(effect.kind==='quest_start'){if(effect.value&&!s.quests.includes(effect.value))s.quests.push(effect.value);changes.push('quest '+effect.value);}
  else if(effect.kind==='quest_complete'){s.quests=s.quests.filter(x=>x!==effect.value);changes.push('quest completed '+effect.value);}
  else if(effect.kind==='message')changes.push(effect.value);
  else if(effect.kind==='animation')changes.push('animation '+effect.value+' (preview log)');
 }
 if(wage>0)s.dailyWages=(s.dailyWages||0)+wage;
 if(r.animation)changes.unshift('animation '+r.animation+' (preview log)');
 logTest('OK · '+objectName(o)+' / '+r.label+' → '+(changes.join(' · ')||'No effects'));
 tab('test');
}
const canvas=$('map'),ctx=canvas.getContext('2d');
const iso=(x,z)=>({x:canvas.clientWidth/2+state.panX+((x-state.midX)-(z-state.midZ))*25*state.zoom,
 y:canvas.clientHeight/2+state.panY+((x-state.midX)+(z-state.midZ))*12.5*state.zoom});
function diamond(x,z,type){
 const p=iso(x+.5,z+.5),w=25*state.zoom,h=12.5*state.zoom;
 const color={grass:'#b9cba9',road:'#969da1',sidewalk:'#d0d0c9',water:'#88bdcf',plaza:'#d7cfc0',soil:'#bcad8b'}[type]||'#bacdbb';
 ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(p.x+w,p.y);ctx.lineTo(p.x,p.y+h);ctx.lineTo(p.x-w,p.y);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#758d9745';ctx.lineWidth=1;ctx.stroke();
}
function colorFor(cat){return {'Buildings':'#d69c67','NPC & Jobs':'#9a63b5','Characters & Crowd':'#2c79bd','Vehicles':'#e69e42','Props & Interior':'#719a79','Vegetation':'#5c9a65','Logic Markers':'#f3ce46'}[cat]||'#888';}
function drawObject(o){
 const cat=category(o),p=iso(Number(o.x)||0,Number(o.z)||0),sel=o.id===state.selected;
 const s=state.zoom,building=cat==='Buildings',vehicle=cat==='Vehicles';
 const r=(building?15:vehicle?10:8)*Math.max(.7,Math.min(1.6,s));
 if(building){
  const h=Math.max(12,Math.min(53,(Number(o.height)||2)*7))*Math.max(.6,s);
  ctx.fillStyle='#795b48';ctx.beginPath();ctx.moveTo(p.x-r,p.y-3);ctx.lineTo(p.x,p.y+r*.42);ctx.lineTo(p.x,p.y+r*.42-h);ctx.lineTo(p.x-r,p.y-3-h);ctx.fill();
  ctx.fillStyle=colorFor(cat);ctx.beginPath();ctx.moveTo(p.x,p.y+r*.42);ctx.lineTo(p.x+r,p.y-3);ctx.lineTo(p.x+r,p.y-3-h);ctx.lineTo(p.x,p.y+r*.42-h);ctx.fill();
  ctx.fillStyle='#efcc9d';ctx.beginPath();ctx.moveTo(p.x-r,p.y-3-h);ctx.lineTo(p.x,p.y-r*.7-h);ctx.lineTo(p.x+r,p.y-3-h);ctx.lineTo(p.x,p.y+r*.42-h);ctx.closePath();ctx.fill();
 }else if(cat==='Logic Markers'){
  ctx.fillStyle=colorFor(cat);ctx.beginPath();ctx.moveTo(p.x,p.y-r);ctx.lineTo(p.x+r*.7,p.y);ctx.lineTo(p.x,p.y+r);ctx.lineTo(p.x-r*.7,p.y);ctx.closePath();ctx.fill();ctx.strokeStyle='#705824';ctx.stroke();
 }else{
  ctx.fillStyle=colorFor(cat);ctx.beginPath();ctx.ellipse(p.x,p.y-r*.6,r*.74,r,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4c6873';ctx.stroke();
 }
 if(sel){
  ctx.strokeStyle='#1254cc';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.x,p.y+3,r+8,r*.48+5,0,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='#1d3e70';ctx.font='bold 11px Tahoma';ctx.textAlign='center';ctx.fillText(objectName(o).slice(0,32),p.x,p.y-(building?57:23)*Math.max(.65,s));
 }
 state.points.push({id:o.id,x:p.x,y:p.y-(building?8:0),r:Math.max(17,r+9)});
}
function resizeCanvas(){
 if(state.tab!=='map')return;
 const dpr=Math.min(2,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect();
 if(rect.width<10||rect.height<10)return;
 canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();
}
function draw(){
 if(!canvas||!ctx||!canvas.clientWidth)return;
 const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);ctx.fillStyle='#dfedf1';ctx.fillRect(0,0,w,h);
 state.points=[];
 if(!state.record){ctx.fillStyle='#587487';ctx.textAlign='center';ctx.fillText('Save a City Draft in Semesta to begin.',w/2,h/2);return;}
 const objects=visibleEntities(),terrain=state.record.document.map?.terrain?.cells||[];
 // Draw a bounded, non-editable 2:1 ground reference. The underlying city is not changed.
 const vis=24/Math.max(.45,state.zoom),sx=Math.round(state.midX-vis/2),sz=Math.round(state.midZ-vis/2);
 if(terrain.length){
  const rows=terrain.length>18000?terrain.filter(t=>Math.abs(t.c-state.midX)<vis*2&&Math.abs(t.r-state.midZ)<vis*2).slice(0,3500):terrain;
  rows.forEach(t=>{const p=iso(Number(t.c)||0,Number(t.r)||0);if(p.x>-65&&p.x<w+65&&p.y>-40&&p.y<h+40)diamond(Number(t.c)||0,Number(t.r)||0,t.type);});
 }else{
  for(let x=sx;x<sx+vis&&x<sx+85;x++)for(let z=sz;z<sz+vis&&z<sz+85;z++){const p=iso(x,z);if(p.x>-30&&p.x<w+30&&p.y>-20&&p.y<h+20)diamond(x,z,'grass');}
 }
 const sorted=objects.slice().sort((a,b)=>((Number(a.x)||0)+(Number(a.z)||0))-((Number(b.x)||0)+(Number(b.z)||0)));
 for(const o of sorted){const p=iso(Number(o.x)||0,Number(o.z)||0);if(p.x>-70&&p.x<w+70&&p.y>-80&&p.y<h+80)drawObject(o);}
 ctx.fillStyle='#536f80';ctx.font='10px Tahoma';ctx.textAlign='left';ctx.fillText('2:1 ISO · '+objects.length+' objects · read-only placement',10,20);
}
function fitMap(){
 const arr=state.entities;
 if(!arr.length){state.midX=0;state.midZ=0;state.zoom=1;state.panX=state.panY=0;resizeCanvas();return;}
 let minX=Infinity,minZ=Infinity,maxX=-Infinity,maxZ=-Infinity;
 for(const o of arr){const x=Number(o.x)||0,z=Number(o.z)||0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);}
 state.midX=(minX+maxX)/2;state.midZ=(minZ+maxZ)/2;state.panX=state.panY=0;
 const span=Math.max(8,maxX-minX+maxZ-minZ),w=canvas.clientWidth||600,h=canvas.clientHeight||450;
 state.zoom=clamp(Math.min(w/(span*25+100),h/(span*13+90)),.25,2.5);resizeCanvas();
}
function zoom(factor){state.zoom=clamp(state.zoom*factor,.2,5);draw();}
canvas.addEventListener('pointerdown',ev=>{state.drag={x:ev.clientX,y:ev.clientY,startX:state.panX,startY:state.panY,moved:false};canvas.setPointerCapture(ev.pointerId);});
canvas.addEventListener('pointermove',ev=>{const d=state.drag;if(!d)return;const dx=ev.clientX-d.x,dy=ev.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>5)d.moved=true;if(d.moved){state.panX=d.startX+dx;state.panY=d.startY+dy;draw();}});
canvas.addEventListener('pointerup',ev=>{const d=state.drag;state.drag=null;if(!d||d.moved)return;const box=canvas.getBoundingClientRect(),x=ev.clientX-box.left,y=ev.clientY-box.top;let best=null;
 for(const p of state.points){const dist=Math.hypot(x-p.x,y-p.y);if(dist<p.r&&(best===null||dist<best.dist))best={dist,id:p.id};}
 if(best)selectObject(best.id,false);
});
canvas.addEventListener('wheel',ev=>{ev.preventDefault();zoom(ev.deltaY>0?.88:1.13);},{passive:false});
window.addEventListener('resize',resizeCanvas);
if('ResizeObserver' in window)new ResizeObserver(()=>resizeCanvas()).observe(canvas.parentElement);
$('fit').onclick=fitMap;$('zoomIn').onclick=()=>zoom(1.2);$('zoomOut').onclick=()=>zoom(.83);
$('cityPicker').addEventListener('change',async ev=>{if(state.dirty&&!confirm('Discard unsaved Jiwa changes?')){ev.target.value=state.record.id;return;}await loadCity(ev.target.value);});
$('refresh').onclick=async()=>{if(state.dirty&&!confirm('Discard unsaved Jiwa changes and reload?'))return;await listCities();};
$('objectSearch').addEventListener('input',renderTree);
$('save').onclick=save;
$('toSystems').onclick=()=>tab('systems');$('toTest').onclick=()=>tab('test');
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>tab(b.dataset.tab);
$('template').onchange=ev=>{const o=selectedObject();if(!o)return;const key=ev.target.value;if(!confirm('Replace this object actions with '+allTemplates()[key].label+' template?')){renderInspector();return;}state.project.bindings[o.id]={template:key,rules:fromTemplate(key)};state.action=0;markDirty();renderInspector();renderSystems();};
$('addRule').onclick=()=>{const b=ensureBinding();if(!b||b.rules.length>=80)return;b.rules.push(rule('action_'+Date.now().toString(36),'New Action','idle',[],[e('message','Action triggered')]));state.action=b.rules.length-1;markDirty();renderInspector();};
$('saveTemplate').onclick=saveCurrentAsTemplate;
$('resetBinding').onclick=()=>{const o=selectedObject();if(!o||!confirm('Reset object mechanics to category template?'))return;delete state.project.bindings[o.id];state.action=0;markDirty();renderInspector();renderSystems();};
$('deleteRule').onclick=()=>{const b=ensureBinding();if(!b||!confirm('Delete this action from object?'))return;b.rules.splice(state.action,1);state.action=Math.max(0,state.action-1);markDirty();renderInspector();};
$('addCondition').onclick=()=>addRow('conditions','wallet_min');$('addEffect').onclick=()=>addRow('effects','message');
$('enabled').onchange=ev=>{const r=editedRule();if(r){r.enabled=ev.target.checked;markDirty();renderInspector();}};
$('ruleLabel').oninput=ev=>{const r=editedRule();if(r){r.label=cleanWord(ev.target.value,70);markDirty();}};
$('trigger').onchange=ev=>{const r=editedRule();if(r){r.trigger=ev.target.value;markDirty();}};
$('animation').oninput=ev=>{const r=editedRule();if(r){r.animation=cleanWord(ev.target.value,80);markDirty();}};
/* Shared Male/Female pose registry is a naming reference only.
 * Existing saved Jiwa rules and legacy NPC sprites are never auto-rewritten.
 * Normalize newly typed GAME verbs only when the user finishes editing.
 */
$('animation').onchange=ev=>{
 const r=editedRule(),shared=window.VLHumanGameplayRig;
 if(!r||!shared?.actionId)return;
 const typed=cleanWord(ev.target.value,80);
 const canonical=shared.actionId(typed);
 if(canonical&&canonical!==typed){
  r.animation=canonical;ev.target.value=canonical;markDirty();
  notice('Mahluk Hidup action ID: '+canonical.toUpperCase()+' / animation preview only');
 }
};
$('testThis').onclick=runAction;$('runSelected').onclick=runAction;$('resetTest').onclick=resetTest;
for(const key of ['wallet','time','fullness','energy','hygiene','bladder'])$('sys-'+key).addEventListener('change',ev=>{
 if(!state.project)return;state.project.systems[key]=key==='time'?ev.target.value:key==='wallet'?safeNum(ev.target.value,0,1e9):clamp(ev.target.value);markDirty();renderSystems();resetTest();
});
$('export').onclick=()=>{
 if(!state.project)return notice('No project to export');
 const copy=clone(state.project);copy.exportedAt=new Date().toISOString();
 const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='jiwa-'+state.record.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Exported mechanics JSON (city geometry not included)');
};
$('import').onclick=()=>$('importFile').click();
$('importFile').onchange=async ev=>{
 const f=ev.target.files?.[0];ev.target.value='';if(!f||!state.record)return;if(f.size>2e6)return notice('Import file too large (>2MB)');
 try{const parsed=JSON.parse(await f.text());const incoming=validateProject(parsed,state.record.id);if(!confirm('Replace Jiwa mechanics for this city with imported project?'))return;state.project=incoming;state.action=0;markDirty();renderInspector();renderSystems();resetTest();notice('Imported project. Click SAVE RULES to persist.');}catch(e){notice('Import rejected: '+e.message);}
};
window.JiwaContextBridge=Object.freeze({
 project:()=>state.project,
 selectedObject:()=>{const o=selectedObject();return o?{id:o.id,name:objectName(o),type:o.type||''}:null;},
 changed:()=>{if(!state.project)return;markDirty();renderSystems();},
 test:(id,payload)=>{
  if(!state.project||!state.test)return {ok:false,reason:'Choose saved Semesta city first'};
  const result=JF.execute(state.project.foundation,id,state.test,payload);
  if(result.ok)state.test=result.state;
  logTest((result.ok?'OK · ':'BLOCKED · ')+id+' · '+(result.ok?result.changes.join(' · '):result.reason));
  tab('test');return result;
 },
 sandbox:()=>state.test,
 nextDay:()=>{if(!state.test)return;state.test=JF.nextDay(state.test);logTest('New game day '+state.test.gameDay+' · daily quotas reset');tab('test');},
 reset:resetTest,
 navigate:tab
});
window.addEventListener('beforeunload',ev=>{if(state.dirty){ev.preventDefault();ev.returnValue='';}});
window.addEventListener('storage',ev=>{if(ev.key===CHANGE&&!state.dirty){notice('Mechanics changed in another tab. Click REFRESH to reload.');}});
window.addEventListener('focus',()=>{if(!state.dirty&&state.record)notice('JIWA ready · '+state.record.name);});
listCities();
})();
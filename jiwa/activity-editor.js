/* JIWA.EXE - icon-first activity designer. One global gameplay registry. */
(function(root){
'use strict';
const A=root.JiwaActivities,B=()=>root.JiwaContextBridge,D=()=>root.MembangunCloudDrive;
const $=id=>document.getElementById(id);
if(!A||!$('activityView'))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=x=>JSON.parse(JSON.stringify(x));
let draft=A.readLocal(localStorage),category='money',selected='bank_teller',dirty=false,cloudFile=null,remoteLoaded=false,busy=false;
let stage='preset',creating=false,chosenTier='menengah';
const current=()=>draft.activities.find(a=>a.id===selected)||draft.activities.find(a=>a.category===category)||null;
const selectedEntity=()=>B()?.selectedObject?.();
const entities=()=>B()?.entities?.()||[];
function notify(text,ok=false){
 const el=$('activityStatus');if(el){el.textContent=text;el.dataset.ok=ok?'true':'false';}
}
const setDirty=()=>{dirty=true;notify('UNSAVED · Tekan SAVE GAME RULES agar Semesta membaca perubahan.');};
function chooseCategory(id){
 if(!A.CATEGORIES.some(c=>c.id===id))return;
 category=id;selected=draft.activities.find(a=>a.category===id)?.id||null;creating=false;stage='preset';chosenTier=current()?.tier||'sepele';render();
}
function choose(id){if(!draft.activities.some(a=>a.id===id))return;selected=id;category=current().category;creating=false;stage='preset';chosenTier=current().tier;render();}
function list(){
 const list=$('activityList');if(!list)return;
 list.replaceChildren();
 const items=draft.activities.filter(a=>a.category===category);
 $('activityCount').textContent=items.length+' activities';
 for(const a of items){
  const btn=document.createElement('button');
  btn.type='button';btn.className='activity-row'+(a.id===selected?' selected':'');
  const t=document.createElement('b');t.textContent=a.label;
  const info=document.createElement('span');info.textContent=(a.enabled?'● LIVE':'○ DRAFT')+' · '+a.tier.toUpperCase()+' · '+(a.buildingQuery||'Belum ada bangunan');
  btn.append(t,info);btn.onclick=()=>choose(a.id);list.append(btn);
 }
 const tabs=document.querySelectorAll('[data-activity-tab]');
 tabs.forEach(tab=>{
  const on=tab.dataset.activityTab===category;tab.classList.toggle('active',on);
  tab.setAttribute('aria-pressed',String(on));
  const n=draft.activities.filter(a=>a.category===tab.dataset.activityTab).length;
  tab.title=(A.CATEGORIES.find(c=>c.id===tab.dataset.activityTab)?.hint||'')+' · '+n+' aktivitas';
 });
}
function presetStep(){
 const area=$('activityEditor'),a=current(),P=A.PREMISES,config=P.CATEGORY[category];
 if(!area||!config)return;
 const format=(v,metric)=>metric==='moneyDelta'?'Rp'+Number(v).toLocaleString('id-ID'):
  metric==='ingredients.length'?v+' bahan':metric==='durationMinutes'?v+' menit':v+' poin';
 const currentTier=P.cfg(category,chosenTier).tier;
 area.innerHTML='<div class="activity-head"><strong>01 · PILIH TEMPLATE PREMISE</strong><span class="activity-state draft">ALGORITHM RULES</span></div>'+
  '<p class="activity-help">Semua sistem memakai level yang sama: tier → angka default → batas maksimum. Pilih template terlebih dahulu, lalu atur detail.</p>'+
  (creating?'<label>Nama aktivitas baru<input id="presetNewName" value="Aktivitas Baru" maxlength="96" placeholder="Contoh: Kerja di Bank"></label>':
    '<div class="activity-global">Mengedit: <b>'+esc(a?.label||'')+'</b> · Tier tersimpan: '+esc(a?.tier||'sepele')+'</div>')+
  '<div class="premise-tiers">'+config.tiers.map(t=>'<button type="button" data-tier="'+t.id+'" class="premise-tier'+(chosenTier===t.id?' selected':'')+'">'+
    '<strong>'+esc(t.label.toUpperCase())+'</strong><span>'+esc(config.metric)+': '+
     format(t.range[0],config.metric)+' – '+format(t.range[1],config.metric)+'</span>'+
    '<small>Durasi '+t.duration[0]+'–'+t.duration[1]+' menit · Syarat EXP '+t.exp[0]+'–'+t.exp[1]+'</small></button>').join('')+'</div>'+
  '<div class="premise-preview"><b>DEFAULT: '+esc(currentTier.label)+'</b> · Durasi '+currentTier.defaultDuration+
   ' menit · '+esc(config.metric)+' default '+format(currentTier.defaultValue,config.metric)+
   ' · Upah/biaya '+Number(currentTier.defaultMoney??(config.metric==='moneyDelta'?currentTier.defaultValue:0)).toLocaleString('id-ID')+
   '<br><b>Custom hanya di dalam range tier.</b> Melebihi batas? Pilih tier berikutnya.</div>'+
  '<div class="premise-stage-actions">'+(creating?'':'<button id="presetKeep" type="button">LANJUT TANPA RESET</button>')+
   '<button id="presetContinue" type="button" class="primary">'+(creating?'BUAT & LANJUT':'APPLY TEMPLATE & DETAIL')+' ▶</button></div>';
 for(const button of area.querySelectorAll('[data-tier]'))
  button.onclick=()=>{chosenTier=button.dataset.tier;presetStep();};
 const proceed=keep=>{
  if(creating){
   const label=area.querySelector('#presetNewName')?.value.trim()||'Aktivitas Baru';
   const rootId=label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,50)||'aktivitas';
   let id=rootId,n=2;while(draft.activities.some(x=>x.id===id))id=rootId+'_'+n++;
   const defaults=P.preset(category,chosenTier);
   draft.activities.push(A.activity({...defaults,id,label,category,enabled:false,
    premise:'Karakter melakukan '+label.toLowerCase()+' sebagai bagian dari kehidupannya.'}));
   selected=id;creating=false;setDirty();
  }else if(!keep){
   const index=draft.activities.findIndex(x=>x.id===selected),old=draft.activities[index];
   if(old){const defaults=P.preset(category,chosenTier);
    draft.activities[index]=A.activity({...old,...defaults,statEffects:defaults.statEffects});
    setDirty();
   }
  }
  stage='details';render();
 };
 area.querySelector('#presetKeep')?.addEventListener('click',()=>proceed(true));
 area.querySelector('#presetContinue').onclick=()=>proceed(false);
}
function editor(){
 const area=$('activityEditor'),a=current();
 if(!area)return;
 if(stage==='preset')return presetStep();
 if(!a){area.innerHTML='<div class="activity-empty">Belum ada aktivitas. Klik ＋ ADD ACTIVITY untuk membuat satu.</div>';return;}
 const currentObjects=entities().slice(0,1500);
 const bounds=A.PREMISES.bounds(category,a.tier);
 const actions=[...new Set([a.actionAsset,...draft.activities.map(x=>x.actionAsset),
  'idle','walk','work','talk','sit','sleep','eat','drink_coffee','pee_wall','vandal_wall','pray','read_book','cook_stir'])].filter(Boolean);
 const placeChoices=[...new Set([a.buildingQuery,...currentObjects.map(x=>x.name||x.asset||x.subtype).filter(Boolean)])];
 const status=A.validation(a,currentObjects);
 const options=currentObjects.map(o=>'<option value="'+esc(o.id)+'"'+(a.objectId===o.id?' selected':'')+'>'+esc(o.name||o.id)+'</option>').join('');
 const input=(title,key,type='text',min='',max='')=>{
  const cap=key==='durationMinutes'?bounds.durationMinutes:key==='minExp'?bounds.minExp:
   key==='moneyDelta'?bounds.moneyDelta:key==='riskPercent'?bounds.riskPercent:null;
  if(cap){min=cap[0];max=cap[1];}
  return '<label>'+title+(cap?' <small>tier '+min+'–'+max+'</small>':'')+
   '<input data-activity-field="'+key+'" type="'+type+'"'+
    (min!==''?' min="'+min+'"':'')+(max!==''?' max="'+max+'"':'')+
   ' value="'+esc(a[key])+'"></label>';
 };
 const areaField=(title,key)=>'<label>'+title+'<textarea data-activity-field="'+key+'" rows="3">'+esc(a[key])+'</textarea></label>';
 area.innerHTML='<div class="entity-preset-steps"><strong>02 · DETAIL</strong>'+
  '<span>PREMISE TIER: '+esc(A.PREMISES.cfg(category,a.tier).tier.label)+
  ' · Nilai dibatasi algoritma</span><button id="activityChangeTier" type="button">↶ TEMPLATE</button></div>'+
  '<div class="activity-head"><div><strong>'+esc(a.label)+'</strong><small>ID: '+esc(a.id)+'</small></div>'+
  '<span class="activity-state '+(a.enabled?'ready':'draft')+'">'+(a.enabled?'LIVE / ACTIVE':'DRAFT / INACTIVE')+'</span></div>'+
  '<div class="activity-switch"><label><input id="activityEnabled" type="checkbox" '+(a.enabled?'checked':'')+'> Enable in Semesta (hanya jika bangunan ada)</label>'+
  '<small>Draft aman; gameplay asli tidak berubah sebelum disimpan dan diaktifkan.</small></div>'+
  '<div class="activity-fieldset"><h4>01 · PREMISE & FLOW</h4>'+
  input('Nama aktivitas','label')+
  areaField('Premis cerita: mengapa karakter melakukannya?','premise')+
  '<label>Pola interaksi<select data-activity-field="flowPattern">'+
  ['tap','hold','talk','buy','sell','collect','enter','craft'].map(v=>
   '<option value="'+v+'"'+(a.flowPattern===v?' selected':'')+'>'+v.toUpperCase()+'</option>').join('')+
  '</select></label>'+
  areaField('Urutan interaksi (player → lokasi → Action → hasil)','steps')+'</div>'+
  '<div class="activity-fieldset"><h4>02 · WORLD BINDING</h4>'+
  '<label>Jenis gedung/asset Semesta<select data-activity-field="buildingQuery">'+
  '<option value="">— Pilih dari city preview —</option>'+placeChoices.map(v=>
  '<option value="'+esc(v)+'"'+(a.buildingQuery===v?' selected':'')+'>'+esc(v)+'</option>').join('')+
  '</select></label>'+
  '<label>Bind object spesifik di city yang sedang dipreview<select id="activityObject"><option value="">— Query bangunan berlaku lintas map —</option>'+options+'</select></label>'+
  '<label>Action asset Mahluk Hidup<select data-activity-field="actionAsset">'+
  '<option value="">— Pilih action —</option>'+actions.map(v=>
  '<option value="'+esc(v)+'"'+(a.actionAsset===v?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'+
  '<p class="activity-help">Binding berdasarkan nama/tag asset dapat digunakan di berbagai kota. ID object spesifik hanya cocok di map yang memuat object itu. Action asset adalah referensi ke database Mahluk Hidup; playback otomatis memerlukan integrasi animation registry.</p>'+
  '<div class="activity-validate">'+(status.length?status.map(t=>'<span>⚠ '+esc(t)+'</span>').join(''):'✓ Semua field binding terisi dan target ditemukan di city preview')+'</div></div>'+
  '<div class="activity-fieldset"><h4>03 · REQUIREMENTS & TIMING</h4><div class="activity-pair">'+
  input('Minimum EXP','minExp','number',0,100000)+input('Durasi (menit in-game)','durationMinutes','number',1,4320)+
  input('Minimum energi','minEnergy','number',0,100)+input('Minimum hygiene','minHygiene','number',0,100)+'</div></div>'+
  '<div class="activity-fieldset"><h4>04 · REWARD / PENALTY</h4>'+
  input('Uang (Rp): + upah / − biaya','moneyDelta','number',-1000000000,1000000000)+
  '<div class="activity-pair">'+A.STAT_KEYS.map(k=>{
   const limit=bounds.metric==='statEffects.'+k?bounds.primary:[-100,100];
   return '<label>'+esc(k.toUpperCase())+' Δ <small>('+limit[0]+'–'+limit[1]+')</small>'+
    '<input data-activity-stat="'+k+'" type="number" min="'+limit[0]+'" max="'+limit[1]+'" value="'+a.statEffects[k]+'"></label>';
  }).join('')+'</div></div>'+
  '<div class="activity-fieldset"><h4>05 · ITEMS & OUTCOME</h4>'+
  '<label>Kombinasi bahan (ID, dipisah koma)'+
  (category==='cooking'?' · tier '+bounds.primary[0]+'–'+bounds.primary[1]+' bahan':'')+
  '<input id="activityIngredients" value="'+esc(a.ingredients.join(', '))+'" placeholder="nasi, telur, minyak"></label>'+
  '<label>Hasil aktivitas<select id="activityGrantType">'+
  ['none','inventory','furniture','room','prop'].map(x=>'<option value="'+x+'"'+(a.grantType===x?' selected':'')+'>'+esc(x.toUpperCase())+'</option>').join('')+'</select></label>'+
  input('Output item ID (opsional)','outputItem')+
  input('Output nama item (opsional)','outputLabel')+
  input('Konsekuensi / punishment reference','punishment')+
  '<div class="activity-pair">'+input('Risiko tertangkap (%)','riskPercent','number',0,100)+
  input('Waktu hukuman / penjara (menit)','detentionMinutes','number',0,4320)+'</div>'+
  areaField('Catatan desain / status asset','notes')+'</div>'+
  '<div class="activity-bottom"><button id="activityDuplicate" type="button">⧉ DUPLICATE</button>'+
  '<button id="activityDelete" type="button">🗑 DELETE</button>'+
  '<button id="activityPreview" type="button">▶ PREVIEW FLOW</button></div>';
 $('activityChangeTier').onclick=()=>{chosenTier=current().tier;stage='preset';render();};
 // Each field resolves the latest activity by stable ID. Replacing a
 // normalized object must not invalidate the other field handlers.
 const update=(patch,redraw=false)=>{
  const index=draft.activities.findIndex(row=>row.id===selected);
  if(index<0)return;
  const prev=draft.activities[index];
  draft.activities[index]=A.activity({...prev,...patch});
  setDirty();
  if(redraw)render();else renderValidation();
 };
 area.querySelectorAll('[data-activity-field]').forEach(el=>el.addEventListener('change',()=>{
  const key=el.dataset.activityField,raw=el.type==='number'?Number(el.value):el.value;
  update({[key]:raw},key==='label'||key==='buildingQuery');
 }));
 area.querySelectorAll('[data-activity-stat]').forEach(el=>el.addEventListener('change',()=>{
  const prev=current();update({statEffects:{...prev.statEffects,[el.dataset.activityStat]:Number(el.value)}});
 }));
 $('activityEnabled').onchange=e=>update({enabled:e.target.checked},true);
 $('activityObject').onchange=e=>update({objectId:e.target.value},true);
 $('activityGrantType').onchange=e=>update({grantType:e.target.value});
 $('activityIngredients').onchange=e=>update({ingredients:e.target.value.split(',').map(s=>s.trim()).filter(Boolean)});
 $('activityDuplicate').onclick=()=>{
  const n=copy(current());let id=n.id+'_copy',i=2;while(draft.activities.some(x=>x.id===id))id=n.id+'_copy_'+i++;
  n.id=id;n.label+=' (Copy)';n.enabled=false;draft.activities.push(A.activity(n));selected=id;setDirty();render();
 };
 $('activityDelete').onclick=()=>{
  const row=current();
  if(!confirm('Hapus '+row.label+' dari katalog global?'))return;
  draft.activities=draft.activities.filter(x=>x.id!==row.id);
  selected=draft.activities.find(x=>x.category===category)?.id||null;setDirty();render();
 };
 $('activityPreview').onclick=()=>{
  const row=current(),e=A.validation(row,entities());
  notify('PREVIEW · '+row.steps+' · '+(e.length?'Binding: '+e.join('; '):'Target ditemukan')+
   ' · Rp '+row.moneyDelta+' · EXP '+row.statEffects.experience);
 };
}
function renderValidation(){
 const a=current(),el=$('activityEditor')?.querySelector('.activity-validate');
 if(!a||!el)return;
 const errors=A.validation(a,entities());
 el.textContent=errors.length?'⚠ '+errors.join(' · '):'✓ Target bangunan ditemukan di city preview';
}
function render(){
 list();editor();const cat=A.CATEGORIES.find(x=>x.id===category);
 $('activityHeading').textContent=(cat?.emoji||'')+' '+(cat?.label||'Activity');
 $('activitySubheading').textContent=cat?.hint||'';
 $('activityGlobalNotice').textContent='GLOBAL · Satu katalog aktivitas untuk semua map Semesta · Preview city: '+(B()?.city?.()?.name||'Global');
}
function add(){creating=true;stage='preset';chosenTier='sepele';render();}
function save(){
 try{draft=A.saveLocal(draft,localStorage);dirty=false;
  root.VLHub?.publish?.('gameplay',{scope:'global-activities',at:draft.updatedAt});
  notify('SAVED LOCAL ✓ '+draft.activities.length+' aktivitas · Semesta membaca katalog ini saat Play Mode / refresh.',true);
 }catch(e){notify('SAVE FAILED · '+e.message);}
}
async function connect(){
 const cloud=D();if(!cloud)throw Error('Drive client belum dimuat');
 if(!cloud.connected())await cloud.connect();
 const files=await cloud.list('jiwa','activities');
 const nextFile=files.find(f=>f.name==='activities--global-game-activities.json')||null;
 if(!cloudFile||cloudFile.id!==nextFile?.id||cloudFile.modifiedTime!==nextFile?.modifiedTime)
  remoteLoaded=false;
 cloudFile=nextFile;
 notify('DRIVE CONNECTED ✓ '+(cloudFile?'Ada katalog di Drive. Tekan LOAD DRIVE untuk menariknya.':'Belum ada katalog di Drive.')+
  ' · Sync Drive tidak otomatis menimpa file lokal.',true);
 return cloud;
}
async function upload(){
 if(busy)return;busy=true;
 try{
  if(dirty)save();
  const cloud=await connect();
  if(cloudFile&&!remoteLoaded)throw Error('Katalog Drive sudah ada. Klik LOAD DRIVE dahulu untuk membandingkan dan menghindari overwrite.');
  const updated=await cloud.save('jiwa','activities',draft,cloudFile);
  cloudFile=updated.file;remoteLoaded=true;
  notify('DRIVE SYNC SUCCESS ✓ Membangun/Jiwa/activities--global-game-activities.json · '+new Date().toLocaleTimeString('id-ID'),true);
 }catch(e){notify('DRIVE SYNC FAILED · '+e.message);}
 finally{busy=false;}
}
async function download(){
 if(busy)return;busy=true;
 try{
  const cloud=await connect();
  if(!cloudFile)throw Error('Belum ada katalog Jiwa di Drive.');
  if(dirty&&!confirm('Ada editan lokal belum tersimpan. Tetap muat dari Drive?'))return;
  const payload=await cloud.load(cloudFile);
  if(!confirm('Replace katalog aktivitas lokal dengan versi Drive?'))return;
  draft=A.saveLocal(payload.record,localStorage);selected=draft.activities[0]?.id||null;
  category=draft.activities[0]?.category||'money';dirty=false;remoteLoaded=true;render();
  root.VLHub?.publish?.('gameplay',{scope:'global-activities',source:'drive',at:draft.updatedAt});
  notify('LOAD DRIVE ✓ '+draft.activities.length+' aktivitas telah disinkronkan ke Semesta lokal.',true);
 }catch(e){notify('LOAD DRIVE FAILED · '+e.message);}
 finally{busy=false;}
}
function initialize(){
 const tabs=document.querySelectorAll('[data-activity-tab]');
 for(const tab of tabs)tab.addEventListener('click',()=>{
  chooseCategory(tab.dataset.activityTab);
  B()?.navigate?.('activities');
 });
 $('activityAdd').onclick=add;
 $('activitySave').onclick=save;
 $('activityDriveConnect').onclick=()=>void connect().catch(e=>notify('DRIVE ERROR · '+e.message));
 $('activityDrivePush').onclick=()=>void upload();
 $('activityDrivePull').onclick=()=>void download();
 $('activityAdvanced').onclick=()=>{
  const advanced=$('jiwaAdvancedTabs');
  advanced.hidden=!advanced.hidden;
  $('activityAdvanced').setAttribute('aria-expanded',String(!advanced.hidden));
 };
 root.addEventListener('jiwa:activity:render',render);
 root.addEventListener('jiwa:world-sync',render);
 root.addEventListener('beforeunload',ev=>{if(dirty){ev.preventDefault();ev.returnValue='';}});
 render();
 B()?.navigate?.('activities');
}
root.JiwaActivityEditor=Object.freeze({render,chooseCategory,save,get:()=>A.normalize(draft),
 setWorldRules:next=>{draft.worldEntities=(Array.isArray(next)?next:[]).map(A.PREMISES.worldRule);
  setDirty();return true;},
 dirty:()=>dirty});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
})(window);

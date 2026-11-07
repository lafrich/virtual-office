/* Jiwa World Entities: define real Buildings, NPC quests & nonquest objects.
 * Shares the single global catalog and premise ranges with the 8 activity tabs. */
(function(root){
'use strict';
const A=root.JiwaActivities,P=root.JiwaPremises,$=id=>document.getElementById(id);
if(!A||!P||!$('entitiesView'))return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let kind='building',id='building_enter',phase='preset',pending=false,chosenTier='sepele';
let pendingCategory='moral',error='';
const catalog=()=>root.JiwaActivityEditor?.get?.()||A.seed();
const records=()=>catalog().worldEntities||[];
const entities=()=>root.JiwaContextBridge?.directoryEntities?.()||root.JiwaContextBridge?.entities?.()||[];
const city=()=>root.JiwaContextBridge?.city?.()||null;
const selected=()=>records().find(x=>x.id===id)||records().find(x=>x.kind===kind)||null;
const status=(s,success=false)=>{const el=$('entityStatus');el.textContent=s;el.dataset.ok=success?'true':'false';};
function kindSelect(value){
 kind=value;const next=records().find(x=>x.kind===value);
 id=next?.id||'';chosenTier=next?.tier||'sepele';pendingCategory=next?.category||(kind==='object'?'immoral':'moral');
 phase='preset';pending=false;render();
}
function select(value){const row=records().find(x=>x.id===value);if(!row)return;
 id=value;kind=row.kind;chosenTier=row.tier;pendingCategory=row.category;phase='preset';pending=false;render();}
function update(patch){
 const all=records(),idx=all.findIndex(x=>x.id===id);if(idx<0)return;
 const next=P.worldRule({...all[idx],...patch});
 if(next.operation==='ambient'){
  const invalid=P.violations(next);
  if(invalid.length){
   const f=invalid[0];status('DI LUAR BATAS TIER · '+f.key+' '+f.value+' (izin '+f.min+'–'+f.max+')');return false;
  }
 }
 all[idx]=next;
 root.JiwaActivityEditor.setWorldRules(all);
 status('UNSAVED · Save World Rules untuk dipakai Semesta.');
 return true;
}
function ruleList(){
 $('entityCount').textContent=records().filter(r=>r.kind===kind).length+' rules';
 const el=$('entityList');el.replaceChildren();
 for(const rule of records().filter(r=>r.kind===kind)){
  const b=document.createElement('button');b.type='button';
  b.className='activity-row'+(rule.id===id?' selected':'');
  const title=document.createElement('b');title.textContent=rule.label;
  const marked=(rule.targets||[]).filter(t=>t.cityId===city()?.id).length;
  const live=rule.enabled&&rule.selectionMode==='directory'&&marked>0;
  const details=document.createElement('span');details.textContent=
   (live?'● LIVE':rule.enabled?'○ NO CITY TARGET':'○ DRAFT')+
   ' · '+rule.operation+' · '+marked+' marked here';
  b.append(title,details);b.onclick=()=>select(rule.id);el.append(b);
 }
 for(const b of document.querySelectorAll('[data-entity-kind]')){
  const yes=b.dataset.entityKind===kind;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));
 }
 $('entityTab').classList.toggle('active',!$('entitiesView').hidden);
}
function presetForm(){
 const area=$('entityEditor'),row=selected(),c=P.CATEGORY[pendingCategory],tier=P.cfg(pendingCategory,chosenTier).tier;
 if(!c)return;
 area.innerHTML='<div class="activity-head"><strong>01 · DEFINISI & TEMPLATE</strong><span class="activity-state draft">WORLD RULES</span></div>'+
  '<label>Jenis Entitas<select id="worldKind">'+P.ENTITIES.map(k=>'<option value="'+k+'"'+(kind===k?' selected':'')+'>'+k.toUpperCase()+'</option>').join('')+'</select></label>'+
  '<label>Jenis indikator (dipakai algoritma)<select id="worldCategory">'+
   A.CATEGORIES.map(c=>'<option value="'+c.id+'"'+(pendingCategory===c.id?' selected':'')+'>'+c.emoji+' '+c.label+'</option>').join('')+'</select></label>'+
  '<p class="activity-help">'+(pending?'Membuat rule baru untuk semua kota.':'Mengedit: '+esc(row?.label||'')+
   ' · Tier sekarang '+esc(row?.tier||'sepele'))+'</p>'+
  '<div class="premise-tiers">'+c.tiers.map(t=>'<button type="button" data-entity-tier="'+t.id+'" class="premise-tier'+(chosenTier===t.id?' selected':'')+'"><strong>'+esc(t.label)+'</strong>'+
   '<span>'+esc(c.metric)+': '+t.range[0]+' – '+t.range[1]+'</span><small>Durasi '+t.duration[0]+'–'+t.duration[1]+' menit · EXP '+t.exp[0]+'–'+t.exp[1]+'</small></button>').join('')+'</div>'+
  '<div class="premise-preview">Default '+esc(tier.label)+': '+tier.defaultDuration+' menit · Angka efek dibatasi tier. Untuk building entry atau NPC quest, efek diatur oleh tujuan atau aktivitas yang terhubung.</div>'+
  '<div class="premise-stage-actions">'+(!pending?'<button id="worldKeep">LANJUT TANPA RESET</button>':'')+
  '<button id="worldContinue" class="primary">'+(pending?'BUAT RULE & DETAIL':'PAKAI TEMPLATE & DETAIL')+' ▶</button></div>';
 $('worldKind').onchange=e=>kindSelect(e.target.value);
 $('worldCategory').onchange=e=>{pendingCategory=e.target.value;chosenTier='sepele';presetForm();};
 area.querySelectorAll('[data-entity-tier]').forEach(b=>b.onclick=()=>{chosenTier=b.dataset.entityTier;presetForm();});
 const next=keep=>{
  const defaults=P.preset(pendingCategory,chosenTier);
  if(pending){
   const all=records(),rootId=kind+'_interaction_';
   let n=all.length+1,rid=rootId+n;while(all.some(x=>x.id===rid))rid=rootId+(++n);
   const operation=kind==='building'?'enter':kind==='npc'?'npc_quest':'ambient';
   const rule=P.worldRule({...defaults,id:rid,label:kind==='building'?'Masuk Bangunan':
    kind==='npc'?'NPC Memberi Quest':'Interaksi Objek',kind,operation,
    category:pendingCategory,enabled:false,enterable:kind==='building'});
   all.push(rule);root.JiwaActivityEditor.setWorldRules(all);id=rid;pending=false;
  }else if(!keep){
   const all=records(),i=all.findIndex(x=>x.id===id);
   if(i>=0)all[i]=P.worldRule({...all[i],...defaults,category:pendingCategory,tier:chosenTier,statEffects:defaults.statEffects});
   root.JiwaActivityEditor.setWorldRules(all);
  }
  phase='detail';render();
 };
 area.querySelector('#worldKeep')?.addEventListener('click',()=>next(true));
 $('worldContinue').onclick=()=>next(false);
}
// Mark individual placed Semesta directory entries. One world rule may be
// attached to multiple object IDs; these references remain scoped to the city.
function renderDirectoryPanel(){
 const list=$('worldDirectoryList'),counter=$('worldDirectoryCount'),rule=selected(),activeCity=city();
 if(!list||!counter||!rule)return;
 const cityId=activeCity?.id||'',term=String($('worldDirectorySearch')?.value||'').trim().toLowerCase();
 const all=entities().filter(o=>o?.id&&A.kindOf(o)===rule.kind);
 const marked=new Set((rule.targets||[]).filter(x=>x.cityId===cityId).map(x=>x.objectId));
 const matches=all.filter(o=>!term||[o.id,o.name,o.label,o.type,o.asset,o.assetId,o.subtype]
  .filter(Boolean).join(' ').toLowerCase().includes(term));
 const showing=matches.slice(0,300);
 counter.textContent=activeCity?.id==='__jiwa_global__'?'Pilih city Semesta dahulu':
  marked.size+' ditandai · '+all.length+' '+rule.kind.toUpperCase()+
  ' ditemukan di '+(activeCity?.name||'city')+(rule.enabled?' · RULE ENABLED':' · RULE DISABLED');
 list.replaceChildren();
 if(!activeCity||cityId==='__jiwa_global__'||!all.length){
  list.textContent=cityId==='__jiwa_global__'?'Pilih city tersimpan melalui CITY di atas.':
   'Tidak ada '+rule.kind+' di directory city ini. Save city di Semesta lalu REFRESH SYNC.';
  return;
 }
 if(!showing.length){list.textContent='Tidak ada hasil pencarian.';return;}
 const mark=(rows,enabled)=>{
  const targetMap=new Map((selected()?.targets||[]).map(x=>[x.cityId+'::'+x.objectId,x]));
  for(const o of rows){
   const key=cityId+'::'+o.id;
   if(enabled)targetMap.set(key,{cityId,objectId:String(o.id)});
   else targetMap.delete(key);
  }
  if(update({targets:[...targetMap.values()],selectionMode:'directory',
   enabled:targetMap.size>0&&(enabled||selected().enabled)})){
   $('worldEnabled').checked=selected().enabled;
   const match=P.matchWorld(selected(),entities().filter(o=>A.kindOf(o)===selected().kind),cityId);
   $('worldBindingStatus').textContent=match?'✓ Match objek nyata: '+(match.name||match.asset||match.id):
    '⚠ Belum ada directory yang ditandai di city ini.';
   renderDirectoryPanel();ruleList();
  }
 };
 for(const o of showing){
  const line=document.createElement('label');line.className='activity-directory-row';
  const check=document.createElement('input');check.type='checkbox';check.checked=marked.has(String(o.id));
  check.onchange=()=>mark([o],check.checked);
  const content=document.createElement('span');
  const name=document.createElement('b');name.textContent=o.name||o.label||o.asset||o.id;
  const detail=document.createElement('small');
  detail.textContent='ID: '+o.id+' · '+(o.type||o.layer||o.subtype||'asset');
  content.append(name,detail);line.append(check,content);list.append(line);
 }
 const limit=document.createElement('div');limit.className='activity-help';
 limit.textContent='Menampilkan '+showing.length+' dari '+matches.length+
  ' hasil. Mark akan mengaktifkan rule. Tekan SAVE WORLD RULES setelah memilih.';
 list.append(limit);
 $('worldDirectoryMarkAll').onclick=()=>mark(showing,true);
 $('worldDirectoryUnmarkAll').onclick=()=>mark(showing,false);
}
function detailForm(){
 const area=$('entityEditor'),r=selected();
 if(!r){area.innerHTML='<div class="activity-empty">Pilih atau buat World Entity rule.</div>';return;}
 const matches=entities().filter(o=>A.kindOf(o)===r.kind);
 const match=r.selectionMode==='directory'?P.matchWorld(r,matches,city()?.id):null;
 const available=!!match;
 const allActions=[...new Set([r.actionAsset,...catalog().activities.map(a=>a.actionAsset),
  'idle','talk','pee_wall','vandal_wall','graffiti','knock_door','sit','walk','help_npc'])].filter(Boolean);
 const options=(arr,value,labelFn=x=>x)=>arr.map(v=>'<option value="'+esc(v)+'"'+(v===value?' selected':'')+'>'+esc(labelFn(v))+'</option>').join('');
 const bounds=P.bounds(r.category,r.tier);
 const field=(name,key,limits)=>{
  const [min,max]=limits||[0,100];
  return '<label>'+esc(name)+' <small>tier '+min+'–'+max+'</small>'+
   '<input type="number" data-world-field="'+key+'" value="'+r[key]+'" min="'+min+'" max="'+max+'"></label>';
 };
 area.innerHTML='<div class="entity-preset-steps"><strong>02 · DETAIL ENTITY</strong><span>'+esc(r.kind.toUpperCase())+
  ' · '+esc(r.tier.toUpperCase())+'</span><button type="button" id="worldChangeTier">↶ TEMPLATE</button></div>'+
  '<div class="activity-head"><div><strong>'+esc(r.label)+'</strong><small>'+esc(r.id)+'</small></div>'+
  '<span class="activity-state '+(r.enabled&&available?'ready':'draft')+'">'+
   (r.enabled&&available?'LIVE IN THIS CITY':r.enabled?'NO CITY TARGET':'DRAFT')+'</span></div>'+
  '<div class="activity-switch"><label><input id="worldEnabled" type="checkbox"'+(r.enabled?' checked':'')+'> Enable di game</label>'+
   '<small>Rule aktif di Play Mode hanya ketika ID objek sudah di-marking di kota ini.</small></div>'+
  '<div class="activity-fieldset"><h4>01 · IDENTITAS RULE</h4>'+
  '<label>Nama rule<input id="worldLabel" value="'+esc(r.label)+'"></label>'+
  '<label>Jenis entitas<select id="worldEntityType">'+options(P.ENTITIES,r.kind,x=>x.toUpperCase())+'</select></label>'+
  '<p class="activity-help">Tentukan target lewat directory Semesta di bawah, bukan pencocokan nama/aset. Data query legacy tetap tersimpan untuk migrasi tetapi tidak dipakai Play Mode.</p>'+
  '<p id="worldBindingStatus" class="activity-validate">'+(available?
    '✓ ID ditandai: '+esc(match.name||match.asset||match.id):
    '⚠ Belum ada ID terpilih di kota ini; tidak muncul di gameplay.')+'</p></div>'+
  '<div class="activity-fieldset"><h4>02 · DIRECTORY SEMESTA / MARK INTERAKTIF</h4>'+
  '<p class="activity-help">Pilih beberapa ID dari directory city yang boleh memakai rule ini. Marking disimpan per city dan mengaktifkan rule; jika semua di-unmark, tidak ada fallback otomatis ke nama umum.</p>'+
  '<div class="activity-pair"><label>Cari Directory<input id="worldDirectorySearch" type="search" placeholder="Cari nama / ID / asset..."></label>'+
  '<button id="worldDirectoryRefresh" type="button">↻ REFRESH SYNC SEMESTA</button></div>'+
  '<p id="worldDirectoryCount" class="activity-help"></p>'+
  '<div class="activity-pair"><button type="button" id="worldDirectoryMarkAll">✓ MARK HASIL TAMPIL</button>'+
  '<button type="button" id="worldDirectoryUnmarkAll">− UNMARK HASIL TAMPIL</button></div>'+
  '<div id="worldDirectoryList" class="activity-directory-list"></div></div>'+
  '<div class="activity-fieldset"><h4>03 · OPERATION & FLOW</h4>'+
  '<label>Jenis interaksi<select id="worldOperation">'+options(
    r.kind==='building'?['enter','ambient','none']:
    r.kind==='npc'?['npc_quest','ambient','none']:['ambient','none'],r.operation,
    x=>({enter:'🚪 Masuk Interior',npc_quest:'❗ NPC Quest',ambient:'◉ Aksi Tanpa Quest',none:'Tidak ada interaksi'}[x]))+'</select></label>'+
  (r.kind==='building'?'<label><input id="worldEnterable" type="checkbox"'+(r.enterable?' checked':'')+
   '> Boleh dimasuki jika interior Bangun Ruang tersedia</label>':'')+
  (r.operation==='npc_quest'?'<label>Quest terkait (aktivitas aktif Jiwa)<select id="worldActivity">'+
    '<option value="">— Pilih aktivitas —</option>'+options(catalog().activities.map(a=>a.id),r.activityId,
    id=>catalog().activities.find(a=>a.id===id)?.label||id)+'</select></label>':'')+
  '<label>Action Asset Mahluk Hidup<select id="worldAction"><option value="">— No animation —</option>'+
   options(allActions,r.actionAsset)+'</select></label>'+
  '<label>Premis/deskripsi<textarea id="worldDescription" rows="3">'+esc(r.description)+'</textarea></label>'+
  '<p class="activity-help">Action ID adalah referensi Mahluk Hidup; aset animasi harus tersedia untuk playback. Entity NPC quest muncul sebagai quest, objek ambient tidak menjadi pin quest.</p></div>'+
  (r.operation==='ambient'?'<div class="activity-fieldset"><h4>03 · EFEK NON-QUEST / TIER LIMITS</h4>'+
   '<div class="activity-pair">'+field('Durasi (menit)','durationMinutes',bounds.durationMinutes)+
   field('Minimum EXP','minExp',bounds.minExp)+
   field('Uang Δ','moneyDelta',bounds.moneyDelta)+
   field('Risiko (%)','riskPercent',bounds.riskPercent)+'</div>'+
   '<div class="activity-pair">'+Object.keys(r.statEffects).map(key=>{
    const range=bounds.metric==='statEffects.'+key?bounds.primary:[-100,100];
    return '<label>'+key.toUpperCase()+' Δ <small>'+range[0]+'–'+range[1]+'</small>'+
     '<input data-world-stat="'+key+'" type="number" min="'+range[0]+'" max="'+range[1]+'" value="'+r.statEffects[key]+'"></label>';
   }).join('')+'</div></div>':'')+
  '<div class="activity-bottom"><button id="worldDuplicate">⧉ DUPLICATE</button><button id="worldDelete">🗑 DELETE</button></div>';
 const patch=(payload,redraw=false)=>{
  if(update(payload)&&redraw)render();
 };
 $('worldChangeTier').onclick=()=>{chosenTier=selected().tier;pendingCategory=selected().category;phase='preset';render();};
 $('worldEnabled').onchange=e=>{
  if(e.target.checked&&(r.selectionMode!=='directory'||!(r.targets||[]).length)){
   e.target.checked=false;
   status('PILIH DIRECTORY DAHULU · Mark minimal satu objek dari Semesta.');
   return;
  }
  patch({enabled:e.target.checked},true);
 };
 $('worldLabel').onchange=e=>patch({label:e.target.value},true);
 $('worldEntityType').onchange=e=>{
  const k=e.target.value;
  patch({kind:k,operation:k==='building'?'enter':k==='npc'?'npc_quest':'ambient',
   enterable:k==='building',targets:[],enabled:false,selectionMode:'directory'},true);
  kind=k;
 };
 $('worldOperation').onchange=e=>patch({operation:e.target.value},true);
 if($('worldEnterable'))$('worldEnterable').onchange=e=>patch({enterable:e.target.checked});
 if($('worldActivity'))$('worldActivity').onchange=e=>patch({activityId:e.target.value});
 $('worldAction').onchange=e=>patch({actionAsset:e.target.value});
 $('worldDescription').onchange=e=>patch({description:e.target.value});
 $('worldDirectorySearch').oninput=renderDirectoryPanel;
 $('worldDirectoryRefresh').onclick=async()=>{
  try{
   const result=await root.JiwaContextBridge?.refreshDirectory?.();
   render();status('DIRECTORY REFRESHED ✓ '+result.count+' objek dari '+result.name+'. Marking yang sudah dibuat tidak dihapus.',true);
  }catch(e){status('REFRESH FAILED · '+e.message);}
 };
 renderDirectoryPanel();
 for(const el of area.querySelectorAll('[data-world-field]')){
  el.onchange=e=>{
   const key=e.target.dataset.worldField,n=Number(e.target.value);
   if(!Number.isFinite(n)||n<Number(el.min)||n>Number(el.max)){
    status('TIDAK BISA · '+key+' harus dalam batas tier '+el.min+'–'+el.max);el.value=selected()[key];return;
   }
   patch({[key]:n});
  };
 }
 for(const el of area.querySelectorAll('[data-world-stat]'))el.onchange=e=>{
  const key=e.target.dataset.worldStat,n=Number(e.target.value);
  if(!Number.isFinite(n)||n<Number(el.min)||n>Number(el.max)){
   status('TIDAK BISA · '+key+' dibatasi '+el.min+'–'+el.max);el.value=selected().statEffects[key];return;
  }
  patch({statEffects:{...selected().statEffects,[key]:n}});
 };
 $('worldDuplicate').onclick=()=>{
  const all=records(),src=selected();let n=2,key=src.id+'_copy';
  while(all.some(x=>x.id===key))key=src.id+'_copy_'+n++;
  all.push(P.worldRule({...src,id:key,label:src.label+' Copy',enabled:false}));
  root.JiwaActivityEditor.setWorldRules(all);id=key;phase='preset';render();
 };
 $('worldDelete').onclick=()=>{
  if(!confirm('Delete world rule '+selected().label+'?'))return;
  const all=records().filter(x=>x.id!==id);root.JiwaActivityEditor.setWorldRules(all);
  id=all.find(x=>x.kind===kind)?.id||'';phase='preset';render();
 };
}
function render(){
 const r=selected();
 if(r&&!pending){id=r.id;chosenTier=r.tier;pendingCategory=r.category;}
 ruleList();
 if(phase==='preset')presetForm();else detailForm();
}
function init(){
 for(const button of document.querySelectorAll('[data-entity-kind]'))
  button.onclick=()=>kindSelect(button.dataset.entityKind);
 $('entityTab').onclick=()=>{
  root.JiwaContextBridge?.navigate?.('entities');render();
 };
 $('entityNew').onclick=()=>{
  pending=true;phase='preset';chosenTier='sepele';
  pendingCategory=kind==='object'?'immoral':'moral';render();
 };
 $('entitySave').onclick=()=>{
  try{
   root.JiwaActivityEditor?.save?.();
   if(root.JiwaActivityEditor?.dirty?.())status('SAVE FAILED · Periksa tier rules di Activity Editor.');
   else status('GLOBAL WORLD RULES ✓ Tersimpan, dibaca Semesta untuk semua kota.',true);
  }catch(e){status('SAVE FAILED · '+e.message);}
 };
 root.addEventListener('jiwa:entity:render',render);
 root.addEventListener('jiwa:world-sync',render);
 render();
}
root.JiwaEntityEditor=Object.freeze({render,select,kindSelect});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);

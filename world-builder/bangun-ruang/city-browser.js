/* Bangun Ruang · Saved Cities browser (Semesta IndexedDB City Drafts).
 * List cities, inspect every placed building and edit an instance independently.
 */
(function(g){
'use strict';
function mount(api){
 const drafts=g.VLCityDrafts,link=g.VLSemestaCityBuildings;
 const panel=document.querySelector('.panel.left'),toggle=document.getElementById('savedToggle');
 if(!drafts||!link||!panel||!toggle)return null;
 const $=id=>document.getElementById(id);
 const css=document.createElement('style');
 css.textContent='.br-city-tabs{display:flex;gap:5px;padding:9px;background:#d0d1d1;border-bottom:2px solid #8b9bb1}.br-city-tabs button{flex:1;font-weight:bold;font-size:11px;padding:9px 3px}.br-city-pane{display:flex;flex-direction:column;gap:9px;min-height:0;flex:1;overflow:auto;padding:10px;background:#eeeee9}.br-city-pane label{font-size:11px;font-weight:bold;color:#34536a}.br-city-pane select,.br-city-pane input{width:100%;margin-top:5px}.br-city-note{font-size:11px;color:#596b7c;line-height:1.5}.br-city-summary{padding:9px;background:#fff;border:1px solid #bac8d6;font:11px/1.6 Tahoma;white-space:pre-line}.br-city-list{display:flex;flex-direction:column;gap:6px;overflow:auto;min-height:110px;flex:1}.br-city-row{padding:9px;text-align:left;border:1px solid #aebfce;background:linear-gradient(#fff,#edf3f9);display:flex;flex-direction:column;gap:5px}.br-city-row strong{font-size:12px}.br-city-row small{font-size:10px;color:#597187;overflow-wrap:anywhere}.br-city-row.active{background:#cbdfff;border-color:#1b60b1}.br-city-actions{display:flex;gap:6px}.br-city-actions button{flex:1}.br-city-target{padding:9px;border:1px solid #7ea3ca;background:#dbeaff;font-size:11px;line-height:1.5}';
 document.head.append(css);
 const content=document.createElement('div');
 content.id='buildingLibraryContent';
 content.style.display='contents';
 for(const element of [...panel.children])content.appendChild(element);
 const tabs=document.createElement('div');
 tabs.className='br-city-tabs';
 tabs.innerHTML='<button type="button" id="brAssetsTab" class="active" aria-selected="true">▤ ASSETS</button><button type="button" id="brCitiesTab" aria-selected="false">▦ KOTA SEMESTA</button>';
 const cityPane=document.createElement('div');
 cityPane.className='br-city-pane';cityPane.hidden=true;
 cityPane.style.display='none';
 cityPane.innerHTML='<div class="br-city-actions"><button type="button" id="brCityRefresh">↻ Refresh Cities</button><a class="button" href="../../membangun/?app=semesta" title="Open Semesta">◈ Semesta</a></div><label for="brCitySelect">SAVED CITIES<select id="brCitySelect" aria-label="Select saved city"></select></label><div id="brCitySummary" class="br-city-summary" role="status">Loading cities…</div><label for="brBuildingSearch">BUILDINGS IN CITY<input id="brBuildingSearch" type="search" placeholder="Find a building…"></label><div id="brCityBuildingList" class="br-city-list"></div><div id="brCityTarget" class="br-city-target" hidden></div><button type="button" id="brCitySave" class="primary" disabled>💾 SAVE & REPLACE IN SEMESTA</button><p class="br-city-note">Edit satu bangunan tanpa mengubah posisi atau objek lain. Kota disimpan di browser yang sama. Untuk kota baru, gunakan Save City di Semesta terlebih dulu.</p>';
 panel.append(tabs,content,cityPane);
 let cities=[],record=null,target=null,tab='assets',saving=Promise.resolve();
 const catalog=()=>[
  ...(Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[]),
  ...api.getSaved().map(a=>({file:'studio:'+a.id,source:'custom-building',label:a.name,
   footprint:a.footprint,group:'kampung'}))
 ];
 const findSpec=o=>catalog().find(s=>s.file===o.asset);
 const fmt=p=>Number.isFinite(Number(p))?Math.round(Number(p)*100)/100:'?';
 const report=message=>{$('brCitySummary').textContent=message;api.status(message);};
 const uid=()=>('br-city-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9)).slice(0,65);
 function setTab(next){
  tab=next;
  const isCity=next==='cities';
  content.style.display=isCity?'none':'contents';
  cityPane.hidden=!isCity;
  cityPane.style.display=isCity?'flex':'none';
  $('brAssetsTab').classList.toggle('active',!isCity);
  $('brCitiesTab').classList.toggle('active',isCity);
  $('brAssetsTab').setAttribute('aria-selected',String(!isCity));
  $('brCitiesTab').setAttribute('aria-selected',String(isCity));
  if(!isCity){target=null;$('brCitySave').disabled=true;}
  else void refresh();
 }
 async function refresh(selectCity){
  try{
   cities=await drafts.list();
   const picker=$('brCitySelect'),chosen=selectCity||picker.value||target?.cityId||localStorage.getItem(link.ACTIVE_KEY);
   picker.replaceChildren();
   for(const d of cities){
    const opt=document.createElement('option');opt.value=d.id;
    opt.textContent=d.name+' · '+d.objectCount+' objects';picker.append(opt);
   }
   if(!cities.length){
    record=null;target=null;$('brCitySave').disabled=true;
    $('brCitySummary').textContent='Belum ada kota tersimpan. Buka Semesta → Save City.';
    $('brCityBuildingList').replaceChildren();
    $('brCityTarget').hidden=true;
    return;
   }
   picker.value=cities.some(x=>x.id===chosen)?chosen:cities[0].id;
   await loadCity();
  }catch(e){report('⚠ Tidak bisa membaca City Draft: '+e.message);}
 }
 async function loadCity(){
  const id=$('brCitySelect').value;
  if(!id)return;
  try{record=await drafts.load(id);}
  catch(e){report('⚠ Gagal membuka kota: '+e.message);return;}
  if(target?.cityId!==id)target=null;
  const buildings=link.inventory(record.document,catalog());
  const count=new Map();
  for(const o of buildings){const spec=findSpec(o);const label=spec?.label||o.name||'Building';
   count.set(label,(count.get(label)||0)+1);}
  const types=[...count].sort((a,b)=>b[1]-a[1]).map(([label,num])=>label+' ×'+num).join(' · ');
  $('brCitySummary').textContent=record.name+'\n'+buildings.length+' bangunan / '+record.document.objects.length+' total objects\n'+
   (types||'No buildings yet')+'\nLast saved: '+new Date(record.updatedAt).toLocaleString('id-ID');
  draw(buildings);
 }
 function draw(buildings=link.inventory(record?.document,catalog())){
  const q=$('brBuildingSearch').value.trim().toLowerCase();
  const list=$('brCityBuildingList');list.replaceChildren();
  const matches=buildings.filter(o=>(o.name+' '+(findSpec(o)?.label||'')+' '+(o.asset||'')+' '+o.id).toLowerCase().includes(q));
  for(const o of matches){
   const spec=findSpec(o),btn=document.createElement('button');
   btn.type='button';btn.className='br-city-row'+(target?.objectId===o.id&&target.cityId===record?.id?' active':'');
   const name=document.createElement('strong');name.textContent=o.name||spec?.label||'Unnamed Building';
   const info=document.createElement('small');
   info.textContent=(spec?.label||o.type)+' · '+(o.asset||o.type)+' · c:'+fmt(o.x)+' r:'+fmt(o.z);
   const hint=document.createElement('small');hint.textContent=target?.objectId===o.id?'✓ OPEN IN EDITOR':'↗ Open / Edit this building';
   btn.append(name,info,hint);
   btn.onclick=()=>open(o);
   list.append(btn);
  }
  if(!matches.length){
   const hint=document.createElement('p');hint.className='br-city-note';
   hint.textContent=buildings.length?'No matching buildings':'Kota ini belum punya bangunan.';
   list.append(hint);
  }
  $('brCitySave').disabled=!target;
  $('brCityTarget').hidden=!target;
 }
 function open(obj){
  if(!record)return;
  const spec=findSpec(obj),ref=String(obj.asset||''),oldId=ref.startsWith('studio:')?ref.slice(7):'';
  const fromSaved=api.getSaved().find(a=>a.id===oldId);
  target={cityId:record.id,cityName:record.name,objectId:obj.id,sourceName:obj.name};
  if(fromSaved){
   // Fork a shared saved prefab on first city edit, making this instance
   // independent of other instances using the same studio asset.
   const own=fromSaved.cityBinding?.cityId===record.id&&fromSaved.cityBinding?.objectId===obj.id;
   const asset=JSON.parse(JSON.stringify(fromSaved));
   if(!own){asset.id=uid();asset.name=String(obj.name||asset.name).slice(0,60);
    asset.config={...asset.config,name:asset.name};}
   asset.cityBinding={cityId:record.id,objectId:obj.id};
   api.openAsset(asset);
  }else{
   // The original pipeline PNG is read-only. Its Semesta metadata is the
   // editable starting point; other original instances stay untouched.
   const candidates=g.VLSemestaBuildingSpecs?.all||[];
   const base=candidates.find(s=>s.id===ref)||candidates.find(s=>s.id===obj.subtype)||
    candidates.reduce((best,s)=>{
     const fp=spec?.footprint||[obj.w||3,obj.d||3],distance=Math.abs(s.footprint[0]-fp[0])+Math.abs(s.footprint[1]-fp[1]);
     return !best||distance<best.distance?{spec:s,distance}:best;
    },null)?.spec;
   const footprint=spec?.footprint||[obj.w||base?.footprint?.[0]||3,obj.d||base?.footprint?.[1]||3];
   api.openPrefab(obj,base?.id||'semesta:small',footprint);
  }
  const box=$('brCityTarget');
  box.textContent='EDITING: '+obj.name+'\nCity: '+record.name+' · Instance '+obj.id+
   '\nSave & Replace untuk memperbarui bangunan ini saja di Semesta.';
  box.hidden=false;
  $('brCitySave').disabled=false;
  draw();
  api.status('Opened '+obj.name+' from '+record.name+' · save to replace this instance');
  if(matchMedia('(max-width:640px)').matches){
   $('app').classList.remove('show-library');toggle.textContent='▣ Show Saved Buildings';
   toggle.setAttribute('aria-expanded','false');
   document.querySelector('.center')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
 }
 async function commit(editTarget,asset){
  const latest=await drafts.load(editTarget.cityId);
  if(!latest.document.objects.some(o=>o.id===editTarget.objectId))
   throw Error('Building was deleted in Semesta. No city changes applied.');
  const document=link.updateDocument(latest.document,editTarget.objectId,asset);
  await drafts.save({id:latest.id,name:latest.name,document});
  link.patchWorkingCopy(latest.id,editTarget.objectId,asset);
  link.publishSignal(latest.id,editTarget.objectId,asset.id);
  if(tab==='cities'&&$('brCitySelect').value===latest.id)await refresh(latest.id);
  api.status('✓ '+asset.name+' replaced in City Draft '+latest.name+' · Semesta updated');
 }
 function afterSave(asset){
  if(!target)return Promise.resolve(false);
  const snapshot={...target};
  saving=saving.catch(()=>{}).then(()=>commit(snapshot,asset)).then(()=>true).catch(e=>{
   api.status('⚠ Asset saved, but city replacement FAILED: '+e.message);
   return false;
  });
  return saving;
 }
 $('brAssetsTab').onclick=()=>setTab('assets');
 $('brCitiesTab').onclick=()=>setTab('cities');
 $('brCityRefresh').onclick=()=>void refresh();
 $('brCitySelect').onchange=()=>void loadCity();
 $('brBuildingSearch').oninput=()=>draw();
 $('brCitySave').onclick=()=>api.saveAsset();
 const shortcut=document.createElement('button');
 shortcut.id='openCitiesShortcut';shortcut.type='button';shortcut.textContent='▦ Kota Semesta';
 shortcut.style.cssText='margin:0 12px 8px;align-self:stretch';
 toggle.insertAdjacentElement('afterend',shortcut);
 shortcut.onclick=()=>{
  setTab('cities');
  if(matchMedia('(max-width:640px)').matches&&!$('app').classList.contains('show-library'))toggle.click();
  panel.scrollIntoView({behavior:'smooth',block:'nearest'});
 };
 g.addEventListener('focus',()=>{if(tab==='cities')void refresh();});
 function clearTarget(){
  target=null;$('brCitySave').disabled=true;$('brCityTarget').hidden=true;
  if(record)draw();
 }
 return {afterSave,activeTarget:()=>target,clearTarget,setTab,refresh};
}
g.VLBangunCityBrowser=Object.freeze({mount});
})(window);

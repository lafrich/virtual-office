/* Semesta.EXE Asset Library: gallery + detail + non-destructive Edit in Bangun Ruang. */
(function(g){
'use strict';
const DIR=['sw','se','ne','nw'],BUILD=new Set(['jalan','kampung','loak']);
const CATS={all:'ALL ASSETS',building:'BANGUNAN',street:'ATRIBUT KOTA',vegetation:'TANAMAN',
 interior:'INTERIOR',vehicle:'KENDARAAN',character:'KARAKTER',custom:'CUSTOM'};
function category(spec){
 if(spec?.source==='custom-building'||(spec?.source==='bangun-object'&&!spec.builtIn))return 'custom';
 if(spec?.source==='pipeline-vegetation'||spec?.objectCategory==='plant')return 'vegetation';
 if(spec?.source==='bangun-object')return spec.objectCategory==='furniture'?'interior':'street';
 if(spec?.source==='pipeline-street')return BUILD.has(spec.group)?'building':'street';
 if(spec?.source==='gpt-original')return ['Interior','Office'].includes(spec.group)?'interior':'street';
 return ['Interior','Office'].includes(spec?.group)?'interior':'street';
}
function canEdit(spec){
 return !!spec&&spec.published!==false&&spec.source!=='gpt-original'&&
  ['pipeline-street','pipeline-vegetation','custom-building','bangun-object'].includes(spec.source);
}
function route(spec){
 if(!canEdit(spec))return null;
 const id=String(spec.file||'');
 if(!/^(?:pipeline|vegetation|studio|object):[a-z0-9_-]{2,90}$/i.test(id))return null;
 return './bangun-ruang/?sourceAsset='+encodeURIComponent(id);
}
function entries(catalog,vehicles=[],characters=[]){
 const items=(catalog||[]).filter(s=>s?.id&&s?.file).map(s=>({
  ...s,kind:'sprite',category:category(s),editTarget:route(s)
 }));
 for(const v of vehicles||[])if(v?.id)items.push({
  id:v.id,file:'vehicle:'+v.id,label:v.label||v.id,source:'vehicle',
  category:'vehicle',kind:'vehicle',footprint:v.footprint||null,published:true,editTarget:null
 });
 for(const p of characters||[])if(p?.id)items.push({
  id:p.id,file:'character:'+p.id,label:p.name||p.label||p.id,source:'character',
  category:'character',kind:'character',published:true,editTarget:null
 });
 return items;
}
function mount(options={}){
 const opener=document.getElementById('openAssetLibrary');if(!opener)return null;
 let selected=null,view='sw',query='',filter='all',all=[];
 const dlg=document.createElement('dialog');dlg.id='semestaAssetLibrary';
 dlg.setAttribute('aria-label','Semesta Asset Library');
 dlg.innerHTML=[
 '<div class="sal-title"><span aria-hidden="true">▦</span><strong>ASSET LIBRARY.EXE</strong><span>SEMESTA / GALERI</span><button id="salClose" type="button" aria-label="Tutup galeri">×</button></div>',
 '<div class="sal-toolbar"><input id="salSearch" type="search" placeholder="Cari nama, kategori, sumber..." aria-label="Cari aset">',
 '<select id="salCategory" aria-label="Kategori aset">',
 ...Object.entries(CATS).map(([k,v])=>'<option value="'+k+'">'+v+'</option>'),
 '</select><span id="salCount" class="sal-count">0 ASSETS</span></div>',
 '<div class="sal-body"><div class="sal-gallery" id="salGallery" role="list"></div><section class="sal-detail" aria-label="Detail aset">',
 '<div class="sal-hero" id="salHero"></div><h2 id="salName">Pilih aset</h2><div id="salSource" class="sal-source"></div>',
 '<div class="sal-views" id="salViews" aria-label="Sudut tampilan"></div><dl id="salData" class="sal-data"></dl>',
 '<p id="salDescription" class="sal-description"></p>',
 '<div class="sal-actions"><button id="salPlace" class="sal-primary" type="button">＋ Place in Semesta</button>',
 '<button id="salEdit" type="button">✎ Edit in Bangun Ruang</button></div>',
 '<small class="sal-help">Save di Bangun Ruang membuat aset baru pada browser ini; original tidak diubah. Export package untuk backup / pindah perangkat.</small>',
 '</section></div>'
 ].join('');
 document.body.append(dlg);
 const $=id=>dlg.querySelector('#'+id);
 const names={'pipeline-street':'VIRTUAL LIFE / PIXEL PIPELINE',
  'pipeline-vegetation':'VIRTUAL LIFE / VEGETATION',
  'custom-building':'BANGUN RUANG / CUSTOM BUILDING','bangun-object':'BANGUN RUANG / PIXEL CREATOR',
  'gpt-original':'VIRTUAL LIFE / ORIGINAL','vehicle':'MAHLUK HIDUP / VEHICLE',
  'character':'MAHLUK HIDUP / CHARACTER'};
 function imgUrl(s,side='sw'){
  if(!s)return null;
  if(s.kind==='vehicle')return options.vehicleImage?.(s.id)||null;
  if(s.kind==='character')return options.characterImage?.(s.id)||null;
  if(s.source==='pipeline-street'){
   const v=s.variants?.[side]||s.variants?.sw||s.variants?.se;
   return v?.file?'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/street_buildings/'+v.file:null;
  }
  if(s.source==='pipeline-vegetation')
   return s.relativeFile?'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/vegetation_kebonsirih/'+s.relativeFile:null;
  if(s.source==='custom-building')return g.VLBuildingBridge?.image(s.id,side)||null;
  if(s.source==='bangun-object')return g.VLBangunObjects?.image(s.id,side)||null;
  return options.thumbnail?.(s)||null;
 }
 const glyph=s=>({building:'▥',street:'♧',vegetation:'♣',interior:'▤',
  vehicle:'▰',character:'◉',custom:'✎'})[s?.category]||'▦';
 function showImage(host,url,s){
  host.replaceChildren();
  if(!url){const a=document.createElement('span');a.textContent=glyph(s);host.append(a);return;}
  const i=document.createElement('img');i.alt=s.label||'Asset';i.loading='lazy';i.decoding='async';
  i.onerror=()=>{i.remove();const fallback=document.createElement('span');fallback.textContent=glyph(s);host.append(fallback);};
  i.src=url;host.append(i);
 }
 function datum(name,value){
  const a=document.createElement('dt'),b=document.createElement('dd');
  a.textContent=name;b.textContent=value;$('salData').append(a,b);
 }
 function detail(){
  $('salData').replaceChildren();$('salViews').replaceChildren();
  if(!selected){
   $('salName').textContent='Pilih aset';$('salSource').textContent='';
   $('salDescription').textContent='';showImage($('salHero'),null,null);
   $('salPlace').disabled=true;$('salEdit').disabled=true;return;
  }
  const s=selected,variants=s.variants||{},available=DIR.filter(v=>!!variants[v]);
  $('salName').textContent=s.label||s.id;
  $('salSource').textContent=names[s.source]||s.source||'SEMESTA ASSET';
  if(available.length){
   if(!available.includes(view))view=available[0];
   for(const v of available){
    const b=document.createElement('button');b.type='button';b.textContent=v.toUpperCase();
    b.setAttribute('aria-pressed',String(view===v));
    b.onclick=()=>{view=v;detail();};$('salViews').append(b);
   }
  }else view='sw';
  showImage($('salHero'),imgUrl(s,view),s);
  datum('ID',s.id);datum('Kategori',CATS[s.category]||'ASSET');
  if(s.footprint?.length)datum('Footprint',s.footprint.join(' × ')+' tile');
  if(variants[view]?.size)datum('Sprite',variants[view].size.join(' × ')+' px');
  if(variants[view]?.pivot)datum('Pivot',variants[view].pivot.join(', ')+' px');
  datum('Sudut',available.length?available.map(x=>x.toUpperCase()).join(' / '):'Native / single');
  datum('Collision',s.collision===false?'No':s.collision===true?'Yes':'Managed');
  datum('Sumber',s.source||'—');
  const custom=s.source==='custom-building'||(s.source==='bangun-object'&&!s.builtIn);
  $('salDescription').textContent=s.description||s.note||
   (custom?'Aset modifikasi dari Bangun Ruang, tersimpan di browser ini.':
    s.published===false?'Artwork belum dipublikasikan; metadata saja.':
    'Aset native isometrik Semesta. Buka di Bangun Ruang untuk membuat salinan baru yang bisa dimodifikasi.');
  $('salPlace').disabled=s.kind!=='sprite'||s.published===false;
  $('salEdit').disabled=!s.editTarget;
  $('salEdit').title=s.editTarget?'Buat salinan di Bangun Ruang':'Editor aset ini tidak tersedia di Bangun Ruang';
  $('salGallery').querySelectorAll('button[data-file]').forEach(b=>
   b.setAttribute('aria-pressed',String(b.dataset.file===s.file)));
 }
 function draw(){
  all=entries(options.catalog?.()||[],options.vehicles?.()||[],options.characters?.()||[]);
  const found=all.filter(s=>(filter==='all'||filter===s.category)&&
   (s.label+' '+s.id+' '+s.source+' '+(s.group||'')).toLowerCase().includes(query));
  $('salCount').textContent=found.length+' / '+all.length+' ASSETS';
  $('salGallery').replaceChildren();
  for(const s of found){
   const b=document.createElement('button');b.type='button';b.className='sal-card';
   b.setAttribute('role','listitem');b.dataset.file=s.file;
   b.setAttribute('aria-pressed',String(selected?.file===s.file));
   const t=document.createElement('span');t.className='sal-thumb';showImage(t,imgUrl(s),s);
   const title=document.createElement('b');title.textContent=s.label;
   const tiny=document.createElement('small');tiny.textContent=CATS[s.category]||'ASSET';
   b.append(t,title,tiny);b.onclick=()=>{selected=s;view='sw';detail();};$('salGallery').append(b);
  }
  if(!found.length){const note=document.createElement('p');note.className='sal-empty';
   note.textContent='Tidak ada aset untuk filter ini.';$('salGallery').append(note);}
  if(selected)selected=all.find(s=>s.file===selected.file)||null;
  if(!selected&&found.length)selected=found[0];
  detail();
 }
 $('salClose').onclick=()=>dlg.close();
 $('salSearch').oninput=e=>{query=e.target.value.trim().toLowerCase();draw();};
 $('salCategory').onchange=e=>{filter=e.target.value;selected=null;draw();};
 $('salPlace').onclick=()=>{if(selected?.kind==='sprite'&&options.place?.(selected))dlg.close();};
 $('salEdit').onclick=()=>{
  if(!selected?.editTarget)return;
  const link=document.createElement('a');link.href=selected.editTarget;
  link.target='_blank';link.rel='noopener';link.click();
 };
 opener.onclick=()=>{draw();if(!dlg.open)dlg.showModal();};
 return Object.freeze({open(){opener.click();},refresh(){if(dlg.open)draw();},
  get count(){return all.length;}});
}
g.VLSemestaAssetLibrary=Object.freeze({mount,category,canEdit,route,entries,CATS});
})(typeof window!=='undefined'?window:globalThis);

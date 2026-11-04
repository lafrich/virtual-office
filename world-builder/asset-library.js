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
/* Gallery health gate: never show a card until its actual artwork has loaded
 * and decoded. A published manifest alone is NOT proof of a working image.
 * This only filters the gallery; saved cities/source files are never deleted.
 */
const imageChecks=new Map();
function validGeometry(meta){
 if(!meta||!Array.isArray(meta.size)||!Array.isArray(meta.pivot)||
    meta.size.length!==2||meta.pivot.length!==2)return false;
 const [w,h]=meta.size,[px,py]=meta.pivot;
 return [w,h,px,py].every(Number.isFinite)&&
  w>0&&h>0&&w<=8192&&h<=8192&&px>=0&&py>=0&&px<=w&&py<=h;
}
function checkImage(url,geometry=null){
 if(typeof url!=='string'||!url||
    !/^(?:https:\/\/|data:image\/(?:png|webp|jpeg|gif);base64,|blob:https?:\/\/)/i.test(url))
  return Promise.resolve(false);
 const key=url+(geometry?'|'+geometry.size.join('x'):'');
 if(imageChecks.has(key))return imageChecks.get(key);
 const done=new Promise(resolve=>{
  const img=new Image();
  if(/^https:\/\//i.test(url))img.crossOrigin='anonymous';
  let ended=false;
  const settle=valid=>{if(ended)return;ended=true;clearTimeout(timeout);img.onload=null;img.onerror=null;resolve(valid);};
  const timeout=setTimeout(()=>settle(false),15000);
  img.onerror=()=>settle(false);
  img.onload=()=>{
   const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
   if(w<1||h<1||w>8192||h>8192){settle(false);return;}
   if(geometry?.size&&(w!==geometry.size[0]||h!==geometry.size[1])){
    settle(false);return;
   }
   // Detect PNGs that decode but contain no visible pixels.
   try{
    const c=document.createElement('canvas');c.width=128;c.height=128;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    if(!ctx){settle(true);return;}
    ctx.clearRect(0,0,128,128);ctx.imageSmoothingEnabled=true;
    ctx.drawImage(img,0,0,128,128);
    const pixels=ctx.getImageData(0,0,128,128).data;
    let visible=false;
    for(let i=3;i<pixels.length;i+=4)if(pixels[i]>2){visible=true;break;}
    settle(visible);
   }catch(error){
    // A browser may prohibit pixel reads on images from other hosts.
    // A successfully decoded nonzero image still has a real thumbnail.
    settle(true);
   }
  };
  img.src=url;
 });
 imageChecks.set(key,done);
 return done;
}
async function assetHealthy(spec,imageUrl){
 if(!spec?.id||!spec?.file||spec.published===false)return false;
 if(spec.source==='pipeline-street'){
  const v=spec.variants||{},dirs=DIR.filter(d=>Object.prototype.hasOwnProperty.call(v,d));
  if(!dirs.length)return false;
  for(const dir of dirs){
   if(!validGeometry(v[dir])||!/^((kampung|jalan_besar|props)\/)[a-z0-9_-]+_(sw|se|ne|nw)\.png$/i.test(v[dir].file||''))
    return false;
  }
  // Every DECLARED facing must be real to avoid broken gallery detail views.
  const checks=await Promise.all(dirs.map(d=>checkImage(imageUrl(spec,d),v[d])));
  return checks.every(Boolean);
 }
 if(spec.source==='pipeline-vegetation'){
  if(!/^trees\/[a-z0-9_-]+\.png$/i.test(spec.relativeFile||'')||!validGeometry(spec))return false;
  return checkImage(imageUrl(spec,'sw'),spec);
 }
 if(spec.source==='custom-building'||spec.source==='bangun-object'){
  const variants=spec.variants||{},dirs=DIR.filter(d=>Object.hasOwn(variants,d));
  if(!dirs.length)return false;
  return (await Promise.all(dirs.map(d=>checkImage(imageUrl(spec,d))))).every(Boolean);
 }
 // Vehicles, characters and non-pipeline assets must have a genuine image.
 return checkImage(imageUrl(spec,'sw'));
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
  i.onerror=()=>{i.remove();if(s?.file)invalidate(s.file);};
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
 let scanRevision=0,hiddenAssets=0,blocked=new Set();
 function invalidate(file){
  blocked.add(file);
  if(dlg.open)void draw();
 }
 async function draw(){
  const revision=++scanRevision;
  const candidates=entries(options.catalog?.()||[],options.vehicles?.()||[],options.characters?.()||[]);
  const gallery=$('salGallery');
  gallery.replaceChildren();
  const progress=document.createElement('p');progress.className='sal-empty';
  progress.textContent='Checking asset images…';gallery.append(progress);
  $('salCount').textContent='CHECKING '+candidates.length+' ASSETS';
  const healthy=new Array(candidates.length).fill(false);
  let cursor=0,completed=0;
  // Bound concurrent decoding to keep editor responsive and prevent
  // a flood of images from exhausting browser memory.
  await Promise.all(Array.from({length:Math.min(10,candidates.length)},async()=>{
   while(cursor<candidates.length){
    const at=cursor++,asset=candidates[at];
    let ok=false;
    try{if(!blocked.has(asset.file))ok=await assetHealthy(asset,imgUrl);}catch{}
    healthy[at]=ok;completed++;
    if(revision===scanRevision&&completed%12===0)
     progress.textContent='Checking real thumbnails '+completed+' / '+candidates.length+'…';
   }
  }));
  if(revision!==scanRevision)return;
  all=candidates.filter((_,i)=>healthy[i]);
  hiddenAssets=candidates.length-all.length;
  const found=all.filter(s=>(filter==='all'||filter===s.category)&&
   (String(s.label||'')+' '+s.id+' '+s.source+' '+(s.group||'')).toLowerCase().includes(query));
  $('salCount').textContent=found.length+' / '+all.length+' VALID · '+hiddenAssets+' HIDDEN';
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
   note.textContent=all.length?'Tidak ada aset valid untuk filter ini.':'Tidak ada thumbnail valid yang bisa dimuat. Periksa jaringan lalu buka kembali Asset Library.';$('salGallery').append(note);}
  if(selected)selected=found.find(s=>s.file===selected.file)||null;
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
 opener.onclick=()=>{if(!dlg.open)dlg.showModal();void draw();};
 return Object.freeze({open(){opener.click();},refresh(){if(dlg.open)void draw();},
  get count(){return all.length;},get hidden(){return hiddenAssets;}});
}
g.VLSemestaAssetLibrary=Object.freeze({mount,category,canEdit,route,entries,CATS,assetHealthy,validGeometry,checkImage});
})(typeof window!=='undefined'?window:globalThis);

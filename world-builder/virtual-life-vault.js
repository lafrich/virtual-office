/* Semesta / Virtual Life encrypted asset vault.
 * Decrypts only inside the owner's browser, from the original same-origin
 * AES-GCM manifest and blobs. Never embeds or stores the account password.
 */
(function(g){
'use strict';
const ROOT=new URL('../',document.currentScript.src).href;
const SALT='v0gxcoUSEnII/SXnXArV9Q==';
const ITER=600000;
const IMAGE=/\.(?:png|webp|gif|jpe?g)$/i;
const PATH=/^(?!\/)(?!.*(?:^|\/)\.\.?\/)[a-zA-Z0-9_.\/-]{1,240}$/;
const $=id=>document.getElementById(id);
let manifest=null,key=null,entries=[],selected='',imageURLs=new Map(),images=new Map(),generation=0;
let matchStats={};
const enc=new TextEncoder(),dec=new TextDecoder();
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
function cleanPath(path){return typeof path==='string'&&PATH.test(path)&&IMAGE.test(path);}
function allowed(path){return !!manifest&&cleanPath(path)&&Object.hasOwn(manifest,path);}
async function aes(buf,rawKey){
 const bytes=new Uint8Array(buf);
 if(bytes.length<29)throw Error('Encrypted file is incomplete');
 return crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.subarray(0,12)},rawKey,bytes.subarray(12));
}
async function derive(password){
 const base=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(SALT),iterations:ITER,hash:'SHA-256'},
  base,{name:'AES-GCM',length:256},false,['decrypt']);
}
async function existingKey(){
 try{
  const k=sessionStorage.getItem('vo_key');
  if(!k)return null;
  return await crypto.subtle.importKey('raw',b64(k),{name:'AES-GCM'},false,['decrypt']);
 }catch{return null;}
}
async function manifestBytes(){
 const res=await fetch(new URL('manifest.enc',ROOT),{cache:'no-store',credentials:'same-origin'});
 if(!res.ok)throw Error('Manifest cannot be downloaded (HTTP '+res.status+')');
 return res.arrayBuffer();
}
function buildEntries(man){
 if(!man||typeof man!=='object'||!man.files||typeof man.files!=='object')
  throw Error('Virtual Life manifest format is not supported');
 const files={};
 for(const [path,data] of Object.entries(man.files)){
  if(!cleanPath(path)||!Array.isArray(data)||typeof data[0]!=='string'||
    !/^[a-f0-9]{32}\.enc$/i.test(data[0])||
    !/^image\/(png|webp|jpeg|gif)/i.test(data[1]||''))continue;
  files[path]=data;
 }
 manifest=files;
 entries=Object.keys(files).sort((a,b)=>a.localeCompare(b));
 return entries.length;
}
async function unlock(password){
 const encrypted=await manifestBytes();
 const options=[];
 const session=await existingKey();if(session)options.push(session);
 if(password)options.push(await derive(password));
 if(!options.length)throw Error('Buka Virtual Life dulu, atau masukkan password akun yang valid');
 let last=null;
 for(const candidate of options){
  try{
   const raw=await aes(encrypted,candidate),data=JSON.parse(dec.decode(raw));
   const count=buildEntries(data);
   key=candidate;generation++;
   g.dispatchEvent(new CustomEvent('semesta-vault-unlocked',{detail:{count}}));
   return count;
  }catch(e){last=e;}
 }
 throw Error('Password / sesi tidak cocok dengan kunci asset Virtual Life'+(last?.name==='OperationError'?'':' (atau file belum tersedia)'));
}
function status(){return {unlocked:!!key,count:entries.length,matches:matchStats};}
function list(filter=''){
 const q=String(filter).trim().toLowerCase();
 return entries.filter(p=>!q||p.toLowerCase().includes(q));
}
async function getURL(path){
 if(!allowed(path)||!key)throw Error('Unlock Virtual Life Assets first');
 if(imageURLs.has(path))return imageURLs.get(path);
 const currentGeneration=generation,currentKey=key;
 const [name,mime]=manifest[path];
 const res=await fetch(new URL('b/'+name,ROOT),{cache:'default',credentials:'same-origin'});
 if(!res.ok)throw Error('Encrypted asset failed to download: '+res.status);
 const plaintext=await aes(await res.arrayBuffer(),currentKey);
 if(currentGeneration!==generation||!key)throw Error('Asset vault is locked');
 const blob=new Blob([plaintext],{type:mime});
 const url=URL.createObjectURL(blob);
 imageURLs.set(path,url);return url;
}
async function getImage(path){
 if(images.has(path))return images.get(path);
 const promise=(async()=>{
  const url=await getURL(path);
  return new Promise((resolve,reject)=>{
   const img=new Image();img.decoding='async';
   img.onload=()=>resolve(img);
   img.onerror=()=>reject(Error('Not a usable image'));
   img.src=url;
  });
 })();
 images.set(path,promise);
 try{return await promise;}catch(err){images.delete(path);throw err;}
}
function lock(){
 generation++;
 for(const url of imageURLs.values())URL.revokeObjectURL(url);
 imageURLs.clear();images.clear();manifest=null;key=null;entries=[];selected='';matchStats={};
 g.dispatchEvent(new Event('semesta-vault-locked'));
}
function stem(path){return path.split('/').pop().replace(/\.(png|jpe?g|webp|gif)$/i,'').toLowerCase();}
const alias={
 bus_transjakarta:['transjakarta','bus_tj','trans_jakarta'],taxi_bluebird:['bluebird','taxi'],
 sedan_red:['sedan_red','sedan_merah'],sedan_teal:['sedan_teal','sedan_toska'],
 hatchback_orange:['hatchback_orange'],mpv_silver:['mpv_silver'],van_cream:['van_cream'],
 gojek:['gojek','ojol_hijau','ojol'],gojek_pax:['gojek_pax','gojek_penumpang'],
 maxim:['maxim'],maxim_pax:['maxim_pax'],sma_triple:['sma_triple','motor_bertiga'],
 manusia_silver:['manusia_silver','silverman','human_silver'],
 pak_ogah:['pak_ogah','pakogah'],kang_parkir:['kang_parkir','juru_parkir'],
 babeh_pemilik:['babeh_pemilik','babeh_loak','babeh'],
 babeh_jam:['babeh_jam'],babeh_tas:['babeh_tas']
};
function automaticMatch(id){
 const tags=alias[id]||[id],paths=[];
 for(const p of entries){
  const name=stem(p),full=p.toLowerCase();
  let score=0;
  for(const tag of tags){
   if(name===tag||name===tag+'_se'||name===tag+'_sw')score=Math.max(score,100+tag.length);
   else if(name.startsWith(tag+'_'))score=Math.max(score,75+tag.length);
   else if(name.includes(tag))score=Math.max(score,48+tag.length);
   else if(full.includes('/'+tag+'/'))score=Math.max(score,24+tag.length);
  }
  // Explicit separate passenger sets must not silently replace driver-only assets.
  if(id==='gojek'&&/pax|penumpang/.test(name))score=0;
  if(id==='maxim'&&/pax|penumpang/.test(name))score=0;
  if((id==='gojek_pax'||id==='maxim_pax')&&!/pax|penumpang/.test(name))score=0;
  if(score>0)paths.push({path:p,score});
 }
 paths.sort((a,b)=>b.score-a.score||a.path.length-b.path.length);
 return paths[0]?.score>=55?paths[0].path:null;
}
function matches(){
 const result={};
 for(const record of g.VLSemestaCatalog?.vehicles||[])result[record.id]=automaticMatch(record.id);
 for(const record of g.VLSemestaCatalog?.questNPCs||[])result[record.id]=automaticMatch(record.id);
 matchStats=result;return result;
}
const api={status,list,unlock,lock,allowed,getImage,getURL,matches,automaticMatch};
g.VLAssetVault=Object.freeze(api);

const button=$('openVirtualAssets'),dialog=$('virtualAssetDialog'),password=$('virtualAssetPassword');
const counter=$('virtualAssetCount'),results=$('virtualAssetList'),preview=$('virtualAssetPreview');
const hint=$('virtualAssetStatus'),search=$('virtualAssetSearch');
function hintText(text,isError=false){hint.textContent=text;hint.classList.toggle('vault-error',isError);}
function renderList(){
 if(!key)return;
 const items=list(search.value).slice(0,160);
 counter.textContent=items.length+' shown / '+entries.length+' original image files';
 results.replaceChildren();
 for(const path of items){
  const opt=document.createElement('button');opt.type='button';
  opt.className='vault-entry';opt.textContent=path.split('/').pop();
  opt.title=path;opt.setAttribute('aria-label','Select original '+path);
  if(path===selected)opt.classList.add('active');
  opt.onclick=()=>select(path);results.append(opt);
 }
 if(!items.length)hintText('Tidak ada asset PNG yang cocok.');
}
async function select(path){
 selected=path;renderList();
 preview.replaceChildren();
 const placeholder=document.createElement('span');placeholder.textContent='Loading original...';
 preview.append(placeholder);
 hintText(path);
 try{
  const img=await getImage(path);
  if(selected!==path)return;
  preview.replaceChildren();
  const frame=document.createElement('img');frame.src=img.src;frame.alt=path;
  frame.style.imageRendering='pixelated';preview.append(frame);
  hintText(path+' · '+img.naturalWidth+' × '+img.naturalHeight+' px');
 }catch(e){hintText('Gagal membaca original: '+e.message,true);}
}
async function open(){
 dialog.hidden=false;
 hintText(key?'Asset Vault unlocked. Pilih sprite.':'Mengecek sesi Virtual Life yang sudah terbuka...');
 if(key){renderList();return;}
 try{
  if(await existingKey()){
   const count=await unlock('');
   const found=Object.values(matches()).filter(Boolean).length;
   hintText('Sesi Virtual Life ditemukan. '+count+' gambar siap dibuka; '+found+' nama kendaraan/NPC cocok.');
   renderList();return;
  }
 }catch{}
 hintText('Silakan login ke Virtual Life atau masukkan password akun di sini.');
}
function close(){dialog.hidden=true;password.value='';}
button.onclick=open;
$('closeVirtualAssetDialog').onclick=close;
$('virtualAssetCancel').onclick=close;
dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
g.addEventListener('keydown',e=>{if(!dialog.hidden&&e.key==='Escape')close();});
$('virtualAssetUnlock').onclick=async()=>{
 const btn=$('virtualAssetUnlock');btn.disabled=true;
 hintText('Memeriksa manifest terenkripsi...');
 try{
  const count=await unlock(password.value);
  password.value='';
  const map=matches(),found=Object.entries(map).filter(([,v])=>v).length;
  hintText('Akses berhasil. '+count+' gambar terdeteksi; '+found+' tipe kendaraan/NPC cocok berdasarkan nama file. Tidak ada asset publik yang dibuat.');
  renderList();
 }catch(e){hintText(e.message,true);}
 finally{btn.disabled=false;password.value='';}
};
$('virtualAssetLock').onclick=()=>{lock();results.replaceChildren();preview.replaceChildren();counter.textContent='Locked';hintText('Asset Vault dikunci');};
search.oninput=renderList;
$('virtualAssetApply').onclick=()=>{
 if(!allowed(selected)){hintText('Pilih gambar asli dulu',true);return;}
 g.dispatchEvent(new CustomEvent('semesta-vault-apply',{detail:{path:selected}}));close();
};
$('virtualAssetPlace').onclick=()=>{
 if(!allowed(selected)){hintText('Pilih gambar asli dulu',true);return;}
 const category=$('virtualAssetCategory').value;
 g.dispatchEvent(new CustomEvent('semesta-vault-place',{detail:{path:selected,category}}));close();
};
$('virtualAssetAutoMatch').onclick=()=>{
 if(!key){hintText('Unlock dulu',true);return;}
 const map=matches(),found=Object.entries(map).filter(([,v])=>v).length;
 g.dispatchEvent(new CustomEvent('semesta-vault-autolink',{detail:{map}}));
 hintText('Mencocokkan '+found+' tipe dengan file sumber. Cocok hanya jika nama asset ditemukan; sisanya tetap preview.');
};
})(window);

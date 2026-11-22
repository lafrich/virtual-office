/* NJH offline controls use the native SemestaLifePlay hooks, not mock data. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const S=root.NJHOfflineSave;
if(!S)return;
const qs=new URLSearchParams(root.location.search);
if(qs.get('onlineTest')==='1'||qs.get('flowPreview')==='1')return;
function life(){
 try{return $('semestaFrame')?.contentWindow?.SemestaLifePlay||null;}catch{return null;}
}
function status(t){const el=$('offlineActionStatus');if(el)el.textContent=t;}
function persist(){
 try{const a=life();if(a?.active?.())a.persist();return true;}catch(e){status('Autosave gagal: '+e.message);return false;}
}
$('offlineSave')?.addEventListener('click',()=>{
 const a=life();if(!a?.active?.()){status('Dunia belum siap untuk disimpan.');return;}
 try{
  a.persist();
  const result=a.saveSlot('manual_1');
  status(result?.ok?'Tersimpan pada Slot 1 · Hari '+(result.meta?.day||'?'):
   'Simpan gagal: '+(result?.reason||'tidak tersedia'));
 }catch(e){status('Simpan gagal: '+e.message);}
});
$('offlineLoad')?.addEventListener('click',()=>{
 const a=life();if(!a?.active?.()){status('Dunia belum siap untuk dimuat.');return;}
 if(!a.hasSave?.('manual_1')){status('Slot 1 masih kosong.');return;}
 if(!root.confirm('Muat Slot 1? Progres setelah save manual terakhir akan diganti.'))return;
 try{
  const result=a.loadSlot('manual_1');
  status(result?.ok?'Slot 1 berhasil dimuat.':'Muat gagal: '+(result?.reason||'slot kosong'));
 }catch(e){status('Muat gagal: '+e.message);}
});
$('offlineExport')?.addEventListener('click',()=>{
 if(!persist())return;
 try{
  const data=S.makeBackup();
  const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='NJH-offline-save.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Backup JSON dibuat. Simpan file di tempat yang aman.');
 }catch(e){status('Ekspor gagal: '+e.message);}
});
$('offlineImport')?.addEventListener('click',()=>$('offlineImportFile')?.click());
$('offlineImportFile')?.addEventListener('change',async event=>{
 const file=event.target.files?.[0];event.target.value='';if(!file)return;
 if(file.size>4*1024*1024){status('Backup terlalu besar (maksimal 4 MB).');return;}
 try{
  const raw=await file.text();S.validate(raw);
  if(!root.confirm('Impor backup akan mengganti progres offline pada perangkat ini. Lanjutkan?'))return;
  try{life()?.stop?.();}catch{}
  $('semestaFrame')?.removeAttribute('src');
  S.restoreBackup(raw);
  root.location.reload();
 }catch(e){status('Impor gagal: '+e.message);}
});
root.NJHOfflineUI=Object.freeze({persist});
})(window);

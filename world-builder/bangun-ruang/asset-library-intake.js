/* Edit-copy intake for Semesta Asset Library -> Bangun Ruang.
 * Source ID only in URL. The source files remain read-only; saving creates
 * a new custom asset in existing Bangun Ruang browser storage.
 */
(function(g){
'use strict';
const allowed=/^(?:pipeline|vegetation|studio|object):[a-z0-9_-]{2,90}$/i;
const buildings=new Set(['jalan','kampung','loak']);
function getSpec(file){
 return (g.VLAssetCatalog||[]).find(s=>s?.file===file)||null;
}
function status(message){
 const el=document.getElementById('status');
 if(el)el.textContent='● '+message;
}
async function open(file){
 if(!allowed.test(file))throw Error('ID aset tidak dikenal.');
 if(file.startsWith('studio:')){
  const id=file.slice(7);
  const asset=g.VLBangunEditorIntake?.getSaved?.(id);
  if(!asset)throw Error('Aset custom tidak ada di browser ini.');
  return g.VLBangunEditorIntake.custom(asset);
 }
 let spec=getSpec(file);
 if(!spec&&file.startsWith('pipeline:id_')&&g.VLIndonesiaAssets?.load){
  const result=await g.VLIndonesiaAssets.load();
  if(!result?.loaded)throw Error('Katalog Indonesia belum bisa diambil dari pipeline.');
  spec=getSpec(file);
 }
 if(!spec)throw Error('Aset tidak ditemukan di katalog Bangun Ruang: '+file);
 if(spec.published===false)throw Error('Artwork aset belum dipublikasikan.');
 if(spec.source==='pipeline-street'&&buildings.has(spec.group))
  return g.VLBangunEditorIntake.building(spec);
 if(['pipeline-street','pipeline-vegetation','bangun-object'].includes(spec.source)){
  if(!g.VLPixelCreator?.openSource)throw Error('Pixel Creator belum siap.');
  return g.VLPixelCreator.openSource(spec);
 }
 throw Error('Aset ini perlu editor khusus di luar Bangun Ruang.');
}
async function start(){
 const id=new URLSearchParams(g.location.search).get('sourceAsset');
 if(!id)return;
 status('Loading source asset into new editable copy…');
 try{await open(id);}
 catch(err){console.error('Asset Library intake',err);status('Gagal membuka source asset: '+(err.message||String(err)));}
}
g.VLAssetLibraryIntake=Object.freeze({open,getSpec});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else void start();
})(window);

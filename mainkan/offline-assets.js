/* On-demand NJH game resource download.
 * Core static HTML/JS/CSS and CDN Three.js are cached explicitly. Dynamic
 * sprites cache when requested during online gameplay; don't falsely claim
 * complete offline asset coverage before an offline smoke test.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const btn=$('offlineDownload'),status=$('offlineDownloadStatus');
if(!btn||!status)return;
function note(s){status.textContent=s;}
const base=new URL('../',root.location.href);
const vendor=[
 'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js',
 'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.core.js'
];
const paths=['mainkan/','world-builder/','content/balancing.json',
 'mainkan/offline-save.js','mainkan/offline-ui.js','mainkan/offline-assets.js',
 'world-builder/semesta-life-play.js','world-builder/builder.js'];
function allowed(u){
 return u.origin===root.location.origin||
  (u.protocol==='https:'&&['cdn.jsdelivr.net','unpkg.com','raw.githubusercontent.com'].includes(u.hostname));
}
function add(set,href,source){
 if(!href||href.startsWith('data:')||href.startsWith('blob:'))return;
 try{const u=new URL(href,source);if(allowed(u))set.add(u.href);}catch{}
}
async function list(){
 const set=new Set(vendor);
 paths.forEach(p=>add(set,p,base));
 for(const page of ['mainkan/index.html','world-builder/index.html']){
  const url=new URL(page,base);
  add(set,url.href,base);
  const response=await fetch(url.href,{cache:'no-store'});
  if(!response.ok)throw Error('Tidak bisa membaca '+page+' ('+response.status+')');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  doc.querySelectorAll('script[src],link[rel="stylesheet"][href],img[src]').forEach(n=>{
   add(set,n.getAttribute('src')||n.getAttribute('href'),url);
  });
 }
 // Stylesheets can reference additional small UI sprites.
 for(const href of [...set].filter(s=>/\.css(?:\?|$)/i.test(s)).slice(0,30)){
  try{
   const response=await fetch(href);
   if(!response.ok)continue;
   const css=await response.text();
   for(const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))add(set,m[1],href);
  }catch{}
 }
 return [...set].slice(0,350);
}
async function start(){
 if(!('serviceWorker' in navigator)||!('caches' in root)){
  note('Browser ini tidak mendukung cache offline. Gunakan versi aplikasi terpasang.');return;
 }
 btn.disabled=true;
 try{
  const registration=await navigator.serviceWorker.register(new URL('sw.js',base),{
   scope:base.href,updateViaCache:'none'
  });
  await navigator.serviceWorker.ready;
  const worker=registration.active;
  if(!worker)throw Error('Service Worker belum aktif.');
  const files=await list();
  note('Menyiapkan '+files.length+' file inti...');
  const channel=new MessageChannel();
  await new Promise((resolve,reject)=>{
   let settled=false;
   channel.port1.onmessage=e=>{
    const m=e.data||{};
    if(m.type==='progress')note('Mengunduh file inti '+m.done+'/'+m.total+(m.failed?' · '+m.failed+' gagal':''));
    if(m.type==='complete'){
     settled=true;
     if(m.failed)note('File inti '+(m.done-m.failed)+'/'+m.total+' tersedia. '+m.failed+' gagal; perlu koneksi untuk melengkapinya.');
     else note('File inti tersimpan ('+m.done+'). Mainkan sekali saat online untuk meng-cache sprite dan aset dinamis.');
     resolve();
    }
   };
   channel.port1.onmessageerror=()=>{if(!settled)reject(Error('Respons cache tidak dapat dibaca.'));};
   worker.postMessage({type:'NJH_PREFETCH',urls:files},[channel.port2]);
  });
 }catch(e){note('Persiapan offline gagal: '+e.message);}
 finally{btn.disabled=false;}
}
btn.addEventListener('click',start);
// Install worker without downloading the full asset pack until the player opts in.
if('serviceWorker' in navigator){
 navigator.serviceWorker.register(new URL('sw.js',base),{scope:base.href,updateViaCache:'none'})
  .catch(()=>note('Service Worker belum tersedia. File belum dapat disimpan untuk offline.'));
}
})(window);

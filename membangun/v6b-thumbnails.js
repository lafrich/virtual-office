/* Native V6B launcher previews only.
 * Never rasterize procedural 96x96 mock sprites and call them pipeline art.
 * Valid inputs are published frame-based PNG/GIF assets from the pipeline.
 * Unauthored categories keep the launcher icon until genuine files exist.
 */
(function(){
'use strict';
const BASE='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/';
const WALK=BASE+'assets/npc_aladdin_sane/preview/walk_se_4x.gif';
const EMOTION=BASE+'site/emotion-studio/preview-stock/emotion-mw4xixfu-kqnhg6.emotion.json';
function targets(id){return [...document.querySelectorAll('.file[data-app="'+id+'"] .file-thumb, .art[data-art="'+id+'"]')]}
function install(id,url,label){
 targets(id).forEach(node=>{
  const image=new Image();image.className='v6b-native-preview';image.alt=label;image.decoding='async';
  image.onload=()=>{node.replaceChildren(image);node.classList.add('v6b-native-asset')};
  image.onerror=()=>{};image.src=url;
 });
}
function init(){
 install('mahluk',WALK,'Native V6B walking character, SE view');
 // The original emotion bundle uses a 64x112 x four-directions atlas;
 // it is displayed as a real authored preview, not synthesized face art.
 fetch(EMOTION).then(r=>{if(!r.ok)throw Error('Emotion source unavailable');return r.json()})
 .then(record=>{
  const png=record.entries?.[0]?.png;
  if(typeof png!=='string'||!png.startsWith('data:image/png;base64,'))return;
  targets('emotion').forEach(node=>{
   const wrap=document.createElement('div');wrap.className='v6b-emotion-crop';
   const img=new Image();img.alt='Original authored emotion atlas — SE';img.decoding='async';
   img.onload=()=>{wrap.appendChild(img);node.replaceChildren(wrap);node.classList.add('v6b-native-asset')};
   img.src=png;
  });
 }).catch(()=>{});
 // Semesta globe and Jiwa ghost: generator presently has no approved
 // animated frames. Retain existing artwork until authored via V6B.
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

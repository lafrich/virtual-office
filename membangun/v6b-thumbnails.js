/* Membangun thumbnails. Source character frames always come from the real V6B atlas.
 * Character GIF dark backgrounds are intentionally not used.
 */
(function(){
'use strict';
const ROOT='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/';
const CHARACTER=ROOT+'assets/npc_aladdin_sane/sprites/aladdin_sane_v6b_sheet.png';
const SILVER='https://lafrich.github.io/virtual-life-asset-pipeline/launcher-assets/manusia_silver_idle_4views_4x.gif';
const ids=['mahluk','semesta','jiwa'];
const canvases=new Map();
function nodes(id){return [...document.querySelectorAll('.file[data-app="'+id+'"] .file-thumb, .art[data-art="'+id+'"]')]}
function imgLoad(src){return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
function spriteCanvas(id,label){
 const list=[];
 nodes(id).forEach(node=>{
  const canvas=document.createElement('canvas');
  canvas.width=64;canvas.height=112;canvas.className='v6b-native-frame';
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label);
  node.replaceChildren(canvas);node.classList.add('v6b-native-asset');
  list.push(canvas.getContext('2d'));
 });canvases.set(id,list);return list;
}
function nativeCharacter(){
 imgLoad(CHARACTER).then(sheet=>{
  const contexts=spriteCanvas('mahluk','Native V6B character walking, transparent');
  let last=-1;
  function tick(t){
   const frame=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.floor(t/130)%6;
   if(frame!==last){for(const c of contexts){c.clearRect(0,0,64,112);c.imageSmoothingEnabled=false;c.drawImage(sheet,frame*64,0,64,112,0,0,64,112)}last=frame;}
   if(!document.hidden)requestAnimationFrame(tick);else setTimeout(()=>requestAnimationFrame(tick),500);
  }requestAnimationFrame(tick);
 }).catch(()=>{/* Preserve original icon when native PNG unavailable. */});
}
function globe(){
 // Finite globe palette and crisp pixel-grid geometry. Surface scrolls
 // underneath a fixed sphere mask to depict axial rotation, not a spinning icon.
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="Bumi berputar" shape-rendering="crispEdges">
 <defs><clipPath id="mb-globe-clip"><circle cx="60" cy="55" r="42"/></clipPath></defs>
 <ellipse cx="60" cy="105" rx="34" ry="5" fill="#334860" opacity=".2"/>
 <circle cx="60" cy="55" r="43" fill="#2e668b"/>
 <circle cx="60" cy="54" r="40" fill="#3AA6F2"/>
 <g clip-path="url(#mb-globe-clip)">
 <g class="mb-globe-lands" fill="#35C46A">
 <path d="M-54 29h29v7h10v9h-8v10h-15v13h-9l-9-16zM-22 78h18v9h-8v19h-9l-6-17z"/>
 <path d="M8 32h22v8h12v8h-8v9H19v-6H5zM24 64h14v12h8v13h-9v10H25l-7-17z"/>
 <path d="M55 23h24v9h13v9H74v11H61v-8H49zM77 67h21v12H87v16H75l-5-16z"/>
 <path d="M111 37h24v9h13v12h-14v9h-17l-11-11zM132 79h22v14h-11v12h-16z"/>
 <path d="M165 29h29v7h10v9h-8v10h-15v13h-9l-9-16zM187 78h18v9h-8v19h-9l-6-17z"/>
 </g><path d="M25 25h20v5H25zM63 78h22v4H63z" fill="#9DE5F5" opacity=".55"/>
 </g><path d="M20 54c0-19 9-33 23-39" fill="none" stroke="#A4D9F2" stroke-width="5" opacity=".65"/>
 </svg>`;
 nodes('semesta').forEach(node=>{const host=document.createElement('div');host.className='mb-globe';host.innerHTML=svg;node.replaceChildren(host)});
}
function silver(){
 // Only use an authored V6B Manusia Silver GIF if it really loads.
 // Fallback is clearly a silver-character preview, not an invented GIF.
 nodes('jiwa').forEach(node=>{
  const img=new Image();img.alt='Manusia Silver V6B';img.className='v6b-silver-image';
  img.onload=()=>node.replaceChildren(img);
  img.onerror=()=>{node.setAttribute('title','Native Manusia Silver preview belum tersedia dari build pipeline');};
  img.src=SILVER;
 });
}
function start(){nativeCharacter();globe();silver()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
/* Bangun Ruang pixel-object creator. Standalone editor; does not mutate
 * architectural sprite pixels or multiplayer assets. */
(function(g){
'use strict';
if(g.VLPixelCreator?.open)return; // prevent duplicate dialogs during retry
const bridge=g.VLBangunObjects;
if(!bridge){console.warn('Pixel Creator: object bridge not ready');return;}
const byId=id=>document.getElementById(id),DIR=['sw','se','ne','nw'],W=96,H=144;
const palettes=['#344657','#535969','#788197','#A7B2C4','#C7CFDC','#F4EBDA','#D4C8AE','#9B866F','#6B4F3A','#B48455','#F2A066','#C9692F','#86E59A','#4FB36B','#22894A','#1A6A3A','#BFD8E4','#3F7FE0','#F2B530','#EE4D72'];
let opened=false,objectId=null,preservedWorldHeight=null,view='sw',tool='pencil',pixel='#535969',painting=false,canvas={},undo={},redo={};
const GRID_STORAGE='virtual-life-pixel-creator-guide-v1';
let gridEnabled=true,gridStep=8,referenceEnabled=true,referenceProfile='ichsan';
try{
 const settings=JSON.parse(localStorage.getItem(GRID_STORAGE)||'null');
 if(settings&&typeof settings==='object'){
  gridEnabled=settings.grid!==false;
  if([1,4,8,16].includes(settings.step))gridStep=settings.step;
  referenceEnabled=settings.reference!==false;
  if(typeof settings.profile==='string'&&/^[a-z0-9_-]{1,50}$/.test(settings.profile))referenceProfile=settings.profile;
 }
}catch{}
const characterCache=new Map();
const css=`
#objectPixelDialog{width:min(1180px,98vw);max-width:1180px;max-height:94dvh;border:1px solid #3863a3;border-radius:5px;background:#f3f5f8;padding:0;color:#253b56;box-shadow:0 22px 65px #101f3c77}
#objectPixelDialog::backdrop{background:#0a1b4088}
#objectPixelDialog *{box-sizing:border-box}
#objectPixelDialog header{display:flex;align-items:center;gap:10px;background:linear-gradient(#2765c1,#1451a3);color:white;padding:10px 14px;font:12px Tahoma}
#objectPixelDialog header strong{flex:1;letter-spacing:.5px}
#objectPixelDialog .opc-layout{display:grid;grid-template-columns:210px minmax(290px,1fr) 290px;min-height:560px;max-height:calc(94dvh - 45px)}
#objectPixelDialog .opc-sidebar,#objectPixelDialog .opc-inspector{padding:12px;overflow:auto;min-width:0;background:#f5f6f6}
#objectPixelDialog .opc-sidebar{border-right:1px solid #b8c4d0}
#objectPixelDialog .opc-inspector{border-left:1px solid #b8c4d0}
#objectPixelDialog .opc-stage{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;padding:12px;overflow:auto;background:#e4eaf2}
#objectPixelDialog label{font:600 11px Tahoma;display:block;margin:8px 0 4px}
#objectPixelDialog input,#objectPixelDialog select{width:100%;background:white;border:1px solid #9badbd;border-radius:2px;padding:7px;color:#273a50;font:12px Tahoma}
#objectPixelDialog button{border:1px solid #99a9bb;border-radius:2px;background:linear-gradient(#fff,#e5e8ed);color:#203952;padding:7px 9px;min-height:30px;font:11px Tahoma;cursor:pointer}
#objectPixelDialog button.active{background:#cde4ff;border-color:#1d68c3;font-weight:bold}
#objectPixelDialog button.primary{background:linear-gradient(#458de2,#1a5ab6);color:white;border-color:#1a4c97;font-weight:bold}
#objectPixelDialog .opc-buttons{display:flex;flex-wrap:wrap;gap:5px}
#objectPixelDialog .opc-pixelstage{display:grid;place-items:center;min-height:365px;width:min(100%,480px);padding:14px;overflow:auto;background:repeating-conic-gradient(#fff 0 25%,#d5dfe9 0 50%) 50%/18px 18px;box-shadow:inset 0 0 0 1px #b6c8d9}
#objectPixelDialog #opcCanvas{display:block;width:384px;height:576px;max-width:100%;max-height:65vh;image-rendering:pixelated;touch-action:none;cursor:crosshair;border:1px solid #758ca5}
#objectPixelDialog .opc-asset{display:flex;align-items:center;gap:8px;width:100%;text-align:left;margin-bottom:4px}
#objectPixelDialog .opc-asset img{width:48px;height:48px;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 50%/10px 10px}
#objectPixelDialog .opc-asset small{display:block;color:#6b7d90;margin-top:3px}
#objectPixelDialog .opc-guide{padding:10px;background:#e5effc;border:1px solid #b9d0ed;font:11px/1.6 Tahoma}
#objectPixelDialog .opc-guide strong{display:block}
#objectPixelDialog .opc-palette{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:9px 0}
#objectPixelDialog .opc-palette button{min-height:25px;padding:0;border-radius:0}
#objectPixelDialog .opc-status{font:11px/1.4 Tahoma;color:#496684;margin:6px 0;min-height:18px}
#objectPixelDialog .opc-meta{font:10px/1.6 Tahoma;color:#556f8a}
@media(max-width:850px){#objectPixelDialog .opc-layout{grid-template-columns:160px 1fr;overflow:auto}#objectPixelDialog .opc-inspector{grid-column:1/-1;border-left:0;border-top:1px solid #b8c4d0}#objectPixelDialog .opc-stage{min-height:520px}}
@media(max-width:550px){#objectPixelDialog .opc-layout{display:flex;flex-direction:column}#objectPixelDialog .opc-sidebar{order:3;max-height:200px}#objectPixelDialog .opc-stage{order:1;min-height:410px}#objectPixelDialog .opc-inspector{order:2}#objectPixelDialog #opcCanvas{width:260px;height:390px}}

/* Identical Windows XP chrome to Bangun Ruang, Mahluk Hidup and Semesta. */
#objectPixelDialog{width:min(1280px,98vw);max-width:1280px;max-height:94dvh;border:2px solid #fefefe;outline:2px solid #292929;border-radius:0;background:#c9c8c4;color:#151515;font-family:Tahoma,"MS Sans Serif",Verdana,sans-serif;box-shadow:4px 6px 0 #0008,12px 18px 0 #06193644}
#objectPixelDialog header{min-height:44px;background:linear-gradient(90deg,#042777 0%,#0755b5 64%,#2c88dd 100%);border-bottom:2px solid #0c2267;color:#fff;padding:8px 11px;letter-spacing:0;text-shadow:1px 1px #001f64}
#objectPixelDialog header strong{font:bold 13px Tahoma,sans-serif}
#objectPixelDialog header span{font:10px "Courier New",monospace;color:#e7f0ff;white-space:nowrap}
#objectPixelDialog #opcClose{min-width:27px;min-height:25px;background:#db4d35;color:#fff;border:2px solid;border-color:#f4bcae #8d261b #8d261b #f4bcae;font:bold 19px/1 Tahoma;box-shadow:1px 1px #14244a;padding:0}
#objectPixelDialog .opc-layout{grid-template-columns:190px minmax(0,1fr) 280px;min-height:520px;max-height:calc(94dvh - 45px)}
#objectPixelDialog .opc-sidebar,#objectPixelDialog .opc-inspector{background:#d2d0cb;padding:10px}
#objectPixelDialog .opc-sidebar{border-right:2px solid #7e7c77}
#objectPixelDialog .opc-inspector{border-left:2px solid #86837e}
#objectPixelDialog .opc-stage{background:#b8b6b1;padding:9px 10px;gap:8px}
#objectPixelDialog label{font:bold 10px "Courier New",monospace;letter-spacing:.02em;color:#37332e;margin-top:10px}
#objectPixelDialog input,#objectPixelDialog select{background:#fff;border:2px inset #a6a39d;border-radius:0;box-shadow:none;color:#151515;min-width:0}
#objectPixelDialog button{border:2px solid;border-color:#fff #888782 #888782 #fff;background:#d7d5d0;color:#141414;border-radius:0;box-shadow:none;font-weight:700;min-height:30px;padding:6px 8px}
#objectPixelDialog button:hover{background:#b7cef9}
#objectPixelDialog button.active,#objectPixelDialog button:active{background:#aac2f8;border-color:#737270 #f1f1f1 #f1f1f1 #737270}
#objectPixelDialog button.primary{background:#b6c9f1;color:#142b59;border-color:#fff #6177a8 #6177a8 #fff}
#objectPixelDialog button.primary:hover{background:#9fbdf8}
#objectPixelDialog .opc-pixelstage{display:block;width:100%;min-height:0;max-width:none;padding:9px;background:#f8f6f0;border:2px inset #8b8883;box-shadow:none}
#objectPixelDialog .opc-canvas-row{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:10px;width:100%;max-width:650px;margin:0 auto;align-items:start}
#objectPixelDialog .opc-canvas-row.no-reference{grid-template-columns:minmax(0,1fr);max-width:410px}
#objectPixelDialog .opc-artcolumn,#objectPixelDialog .opc-reference-column{min-width:0}
#objectPixelDialog .opc-canvas-frame,#objectPixelDialog .opc-character-frame{position:relative;width:100%;border:2px solid #78756e;background:repeating-conic-gradient(#e7e6e1 0 25%,#fff 0 50%) 50%/16px 16px}
#objectPixelDialog #opcCanvas,#objectPixelDialog #opcCharacterCanvas{display:block;width:100%;height:auto;max-height:none;image-rendering:pixelated;border:0;touch-action:none}
#objectPixelDialog #opcGridOverlay{position:absolute;inset:0;pointer-events:none;z-index:2;opacity:.85}
#objectPixelDialog .opc-ground-guide{position:absolute;left:0;right:0;top:94.444%;border-top:1px dashed #b76712;opacity:.8;pointer-events:none;z-index:3}
#objectPixelDialog .opc-ref-caption{display:block;margin-top:6px;font:10px/1.5 "Courier New",monospace;color:#3d3a35;text-align:center}
#objectPixelDialog .opc-ref-info{margin:7px 0 0;text-align:center;font:10px/1.4 "Courier New",monospace;color:#333}
#objectPixelDialog .opc-char-tools{width:100%;display:flex;align-items:center;justify-content:space-between;gap:5px;flex-wrap:wrap;padding:6px 7px;background:#cdcbc6;border:1px solid #918e87}
#objectPixelDialog .opc-char-tools select{width:auto;max-width:170px;font:11px Tahoma;padding:4px;min-height:28px}
#objectPixelDialog .opc-char-tools .opc-tool-label{font:bold 10px "Courier New",monospace;color:#35312a}
#objectPixelDialog .opc-guide{background:#e5e3df;border:2px inset #a29f99;color:#45423d;padding:9px}
#objectPixelDialog .opc-guide strong{color:#142b59}
#objectPixelDialog .opc-asset{border:2px solid #98989c;background:#e8e5ec;box-shadow:inset 1px 1px #fff,2px 2px #a6a2a4;margin-bottom:5px}
#objectPixelDialog .opc-asset small{color:#5a5a57}
#objectPixelDialog .opc-palette button{border:1px solid #8e8b85;min-height:25px}
#objectPixelDialog .opc-status{background:#d7d4ce;border:1px solid #918e87;align-self:stretch;padding:6px;color:#333;font:10px/1.45 "Courier New",monospace}
#objectPixelDialog .opc-meta{color:#55514b;font:10px/1.55 Tahoma}
#objectPixelDialog .opc-tools-row{flex:none;width:100%;justify-content:center;background:#cdcbc6;padding:6px;border:1px solid #918e87}
@media(max-width:850px){
 #objectPixelDialog .opc-layout{grid-template-columns:155px minmax(0,1fr);overflow:auto}
 #objectPixelDialog .opc-inspector{grid-column:1/-1;border-left:0;border-top:2px solid #86837e}
 #objectPixelDialog .opc-stage{min-height:0}
}
@media(max-width:550px){
 #objectPixelDialog .opc-layout{display:flex;flex-direction:column}
 #objectPixelDialog .opc-stage{order:1;min-height:0}
 #objectPixelDialog .opc-inspector{order:2}
 #objectPixelDialog .opc-sidebar{order:3;max-height:240px}
 #objectPixelDialog #opcCanvas{width:100%;height:auto}
 #objectPixelDialog header span{display:none}
 #objectPixelDialog .opc-char-tools{gap:4px}
 #objectPixelDialog .opc-char-tools button{padding:5px 6px;min-height:29px}
}

`;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
const button=byId('openObjectPixelCreator')||document.createElement('button');
if(!button.isConnected){
 button.id='openObjectPixelCreator';button.type='button';button.textContent='✎ Pixel Creator';
 const nav=document.querySelector('#app > nav');
 if(nav)nav.insertBefore(button,byId('exportBtn')||null);
}
button.title='Create a new pixel object for placement in Semesta';
const dlg=document.createElement('dialog');dlg.id='objectPixelDialog';
dlg.innerHTML=`
<header><strong>✎ PIXEL CREATOR — BANGUN RUANG</strong><span>V6B / 2:1 ISO / 4 VIEWS</span><button type="button" id="opcClose" aria-label="Close pixel creator">×</button></header>
<div class="opc-layout">
 <aside class="opc-sidebar"><button type="button" id="opcNew" class="primary" style="width:100%">＋ NEW OBJECT</button>
  <label for="opcFilter">LIBRARY / CATEGORY</label>
  <select id="opcFilter"><option value="all">All objects</option><option value="plant">Tanaman</option><option value="lamp">Lampu</option><option value="furniture">Furnitur</option><option value="street">Street</option><option value="decor">Dekorasi</option></select>
  <label>YOUR OBJECTS</label><div id="opcLibrary"></div>
  <label>BUILT-IN TEMPLATES</label><div id="opcTemplates"></div>
 </aside>
 <section class="opc-stage"><div class="opc-buttons" id="opcViews" aria-label="Native directional views">
  <button type="button" data-view="sw" class="active">SW</button><button type="button" data-view="se">SE</button><button type="button" data-view="ne">NE</button><button type="button" data-view="nw">NW</button>
 </div>
 <div class="opc-buttons opc-tools-row" id="opcTools"><button type="button" data-tool="pencil" class="active">✎ Pencil</button><button type="button" data-tool="erase">⌫ Erase</button><button type="button" data-tool="fill">▨ Fill</button><button type="button" data-tool="picker">◉ Picker</button></div>
 <div class="opc-char-tools" aria-label="Pixel art guides">
  <span class="opc-tool-label">VIEW / GUIDE</span>
  <button id="opcGridToggle" type="button" aria-pressed="true">▦ Grid ON</button>
  <select id="opcGridSize" aria-label="Grid spacing"><option value="1">1 px</option><option value="4">4 px</option><option value="8" selected>8 px</option><option value="16">16 px</option></select>
  <button id="opcRefToggle" type="button" aria-pressed="true">♟ Character ON</button>
  <select id="opcReferenceProfile" aria-label="Character reference"><option value="ichsan">Ichsan</option><option value="theodore">Theodore</option><option value="noor">Noor</option></select>
 </div>
 <div class="opc-pixelstage">
  <div id="opcCanvasRow" class="opc-canvas-row">
   <div class="opc-artcolumn"><div class="opc-canvas-frame">
    <canvas id="opcCanvas" width="${W}" height="${H}" aria-label="Draw pixel object with mouse or touch"></canvas>
    <div id="opcGridOverlay" aria-hidden="true"></div><div class="opc-ground-guide" aria-hidden="true"></div>
   </div><span class="opc-ref-caption">OBJECT · 96×144 px</span></div>
   <div id="opcReferencePanel" class="opc-reference-column">
    <div class="opc-character-frame"><canvas id="opcCharacterCanvas" width="64" height="${H}" aria-label="Mahluk Hidup character proportion reference"></canvas>
    </div></div>
    <span class="opc-ref-caption">KARAKTER · REFERENSI VISUAL</span>
   </div>
  </div>
  <p id="opcReferenceInfo" class="opc-ref-info">Referensi tampilan saja · bukan patokan ukuran placement</p>
 </div>
 <div class="opc-buttons"><button type="button" id="opcUndo">↶ Undo</button><button type="button" id="opcRedo">↷ Redo</button><button type="button" id="opcMirror">⇋ Flip current</button><button type="button" id="opcCopyViews">▣ Copy to 4 views</button><button type="button" id="opcClear">✕ Clear view</button></div>
 <div id="opcStatus" class="opc-status" role="status"></div>
 </section>
 <aside class="opc-inspector">
  <label for="opcName">OBJECT NAME</label><input id="opcName" maxlength="80" placeholder="e.g. Lampu Taman Biru" value="Untitled Object">
  <label for="opcDescription">DESCRIPTION</label><textarea id="opcDescription" maxlength="600" rows="3" placeholder="Keterangan aset / fungsi di kota..." style="width:100%;resize:vertical;padding:7px;border:1px solid #9badbd"></textarea>
  <label for="opcCategory">CATEGORY</label><select id="opcCategory">
    <option value="plant">🌱 Tanaman / Vegetation</option><option value="lamp">💡 Lampu / Lighting</option>
    <option value="furniture">▣ Furnitur / Interior</option><option value="street">▤ Street Object</option><option value="decor">✳ Dekorasi</option>
  </select>
  <div id="opcGuide" class="opc-guide"></div>
  <label>FOOTPRINT / TILES</label><div class="opc-buttons"><input id="opcWidth" type="number" min=".25" max="12" step=".25" value="1" aria-label="Footprint width" style="width:49%"><input id="opcDepth" type="number" min=".25" max="12" step=".25" value="1" aria-label="Footprint depth" style="width:49%"></div>
  <label for="opcCollision">COLLISION</label><select id="opcCollision"><option value="false">Walk-through / no collision</option><option value="true">Solid / blocks walking</option></select>
  <label for="opcColor">PIXEL COLOR</label><div class="opc-buttons"><input id="opcColor" type="color" value="#535969" style="width:55px;height:33px;padding:2px"><span id="opcColorText" class="opc-meta" style="align-self:center">#535969</span></div>
  <div id="opcPalette" class="opc-palette"></div>
  <p class="opc-meta"><b>PIXEL ART GUIDE:</b> Grid hanya untuk menggambar. Karakter di samping adalah referensi tampilan, bukan pengukur rasio atau ukuran placement. Gambar SW, SE, NE, NW secara terpisah; footprint untuk collision.</p>
  <label for="opcPng">IMPORT PNG TO CURRENT VIEW</label><input id="opcPng" type="file" accept="image/png">
  <div class="opc-buttons" style="margin-top:12px"><button type="button" id="opcExportPng">↓ PNG View</button><button type="button" id="opcExport">↓ Export JSON</button><button type="button" id="opcImport">↑ Import JSON</button><input type="file" id="opcImportFile" accept="application/json,.json" hidden></div>
  <div class="opc-buttons" style="margin-top:10px"><button type="button" id="opcSave" class="primary">💾 SAVE TO SEMESTA</button><button type="button" id="opcGoSemesta">◈ Open Semesta</button><button type="button" id="opcDelete">✕ Delete</button></div>
 </aside>
</div>`;
document.body.append(dlg);
const $=id=>byId(id),status=s=>{$('opcStatus').textContent=s;};
const blank=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
function fresh(){
 canvas=Object.fromEntries(DIR.map(d=>[d,blank()]));undo=Object.fromEntries(DIR.map(d=>[d,[]]));redo=Object.fromEntries(DIR.map(d=>[d,[]]));
 objectId=null;preservedWorldHeight=null;view='sw';tool='pencil';
 $('opcName').value='Untitled Object';$('opcDescription').value='';$('opcCategory').value='decor';
 categoryChanged();show();status('New object · draw all four directions, then Save to Semesta.');
}
function show(){
 const cv=$('opcCanvas'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);
 ctx.drawImage(canvas[view],0,0);
 $('opcViews').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 $('opcTools').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
 updateGuides(false);

}
function rememberGuides(){
 try{localStorage.setItem(GRID_STORAGE,JSON.stringify({grid:gridEnabled,step:gridStep,reference:referenceEnabled,profile:referenceProfile}));}catch{}
}
function updateGuides(shouldRenderCharacter=true){
 const layer=$('opcGridOverlay'),grid=$('opcGridToggle'),ref=$('opcRefToggle'),panel=$('opcReferencePanel');
 if(!layer||!grid||!ref||!panel)return;
 grid.textContent=gridEnabled?'▦ Grid ON':'▦ Grid OFF';
 grid.classList.toggle('active',gridEnabled);grid.setAttribute('aria-pressed',String(gridEnabled));
 $('opcGridSize').value=String(gridStep);$('opcGridSize').disabled=!gridEnabled;
 layer.hidden=!gridEnabled;layer.style.display=gridEnabled?'block':'none';
 layer.style.backgroundImage=gridEnabled?
  'linear-gradient(to right,rgba(26,66,135,.35) 1px, transparent 1px),linear-gradient(to bottom,rgba(26,66,135,.35) 1px, transparent 1px)':'none';
 layer.style.backgroundSize=(gridStep/W*100)+'% '+(gridStep/H*100)+'%';
 ref.textContent=referenceEnabled?'♟ Character ON':'♟ Character OFF';
 ref.classList.toggle('active',referenceEnabled);ref.setAttribute('aria-pressed',String(referenceEnabled));
 panel.hidden=!referenceEnabled;panel.style.display=referenceEnabled?'block':'none';
 $('opcCanvasRow').classList.toggle('no-reference',!referenceEnabled);
 $('opcReferenceProfile').value=referenceProfile;
 $('opcReferenceProfile').disabled=!referenceEnabled;
 if(shouldRenderCharacter)renderCharacter();
}
function drawCharacterPlaceholder(ctx,profile){
 // Fallback when the actual Mahluk Hidup sprite is offline or inaccessible.
 const yy=H-8,mid=32;
 ctx.fillStyle='#354e80';ctx.fillRect(mid-10,yy-46,20,31);
 ctx.fillStyle='#142f65';ctx.fillRect(mid-11,yy-15,9,18);ctx.fillRect(mid+2,yy-15,9,18);
 ctx.fillStyle='#e6bd9c';ctx.fillRect(mid-9,yy-69,18,22);
 ctx.fillStyle='#202e3c';ctx.fillRect(mid-11,yy-72,22,8);
 ctx.fillStyle='#253448';ctx.font='bold 7px monospace';ctx.textAlign='center';
 ctx.fillText('PREVIEW',mid,17);
}
function renderCharacter(){
 const cv=$('opcCharacterCanvas');if(!cv)return;
 const ctx=cv.getContext('2d');ctx.clearRect(0,0,64,H);ctx.imageSmoothingEnabled=false;
 if(!referenceEnabled)return;
 const rig=g.VLCharacterRig;
 const spec=rig?.resolve?.(referenceProfile,'idle',false);
 const url=spec?.url||g.VLPipelineAssets?.character?.(referenceProfile);
 const DIRS=rig?.DIR||['se','sw','ne','nw'];
 const index=Math.max(0,DIRS.indexOf(view));
 const authoredRow=Number(spec?.row);
 const row=(Number.isFinite(authoredRow)?authoredRow:4)+index;
 // 64x112 native sprite; foot pivot y=100, same 136px floor as object editor.
 const y=H-8-(rig?.FRAME?.pivotY||100);
 const info=$('opcReferenceInfo');
 const draw=entry=>{
  if(!referenceEnabled||referenceProfile!==entry.profile||view!==entry.view)return;
  ctx.clearRect(0,0,64,H);ctx.imageSmoothingEnabled=false;
  try{ctx.drawImage(entry.image,0,row*112,64,112,0,y,64,112);
   info.textContent='Preview '+referenceProfile.toUpperCase()+' · bukan ukuran placement';
  }catch{drawCharacterPlaceholder(ctx,referenceProfile);info.textContent='Referensi karakter · gambar tidak tersedia · bukan patokan ukuran placement';}
 };
 if(!url){drawCharacterPlaceholder(ctx,referenceProfile);info.textContent='Referensi karakter · sumber belum tersedia · bukan patokan ukuran placement';return;}
 let entry=characterCache.get(url);
 if(!entry){
  const image=new Image();if(!url.startsWith('data:'))image.crossOrigin='anonymous';
  entry={image,ready:false,error:false,profile:referenceProfile,view};
  characterCache.set(url,entry);
  image.onload=()=>{entry.ready=true;renderCharacter();};
  image.onerror=()=>{entry.error=true;renderCharacter();};
  image.src=url;
 }
 if(entry.ready&&entry.image.naturalWidth>=64&&entry.image.naturalHeight>=(row+1)*112){
  draw({...entry,profile:referenceProfile,view});
 }else{
  drawCharacterPlaceholder(ctx,referenceProfile);
  info.textContent=entry.error?'Referensi karakter · sumber tidak tersedia · bukan patokan ukuran placement':'Memuat referensi karakter… · bukan patokan ukuran placement';
 }
}
function snapshot(){
 const s=canvas[view].toDataURL('image/png');undo[view].push(s);if(undo[view].length>25)undo[view].shift();redo[view].length=0;
}
function restore(s){if(!s)return;const img=new Image();img.onload=()=>{const c=canvas[view].getContext('2d');c.clearRect(0,0,W,H);c.drawImage(img,0,0,W,H);show();};img.src=s;}
function download(blob,name){
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function trim(cv){
 const data=cv.getContext('2d').getImageData(0,0,W,H).data;
 let x0=W,y0=H,x1=0,y1=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(data[(y*W+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x0>W-1)throw new Error('Canvas kosong pada salah satu arah. Gambar atau Copy to 4 Views dahulu.');
 const pivot=[W/2,H-8];x0=Math.max(0,Math.min(x0,pivot[0])-2);y0=Math.max(0,Math.min(y0,pivot[1])-2);
 x1=Math.min(W-1,Math.max(x1,pivot[0])+2);y1=Math.min(H-1,Math.max(y1,pivot[1])+2);
 const w=x1-x0+1,h=y1-y0+1,c=document.createElement('canvas');c.width=w;c.height=h;
 c.getContext('2d').drawImage(cv,x0,y0,w,h,0,0,w,h);
 return {url:c.toDataURL('image/png'),size:[w,h],pivot:[pivot[0]-x0,pivot[1]-y0]};
}
function payload(){
 return {id:objectId||'obj-'+Math.random().toString(36).slice(2,12),
  name:$('opcName').value.trim().slice(0,80),description:$('opcDescription').value.trim().slice(0,600),category:$('opcCategory').value,
  footprint:[Number($('opcWidth').value),Number($('opcDepth').value)],
  collision:$('opcCollision').value==='true',
  ...(preservedWorldHeight!==null?{worldHeight:preservedWorldHeight}:{}),
  views:Object.fromEntries(DIR.map(d=>[d,trim(canvas[d])])),version:2
 };
}
function categoryChanged(){
 const cat=bridge.categories[$('opcCategory').value]||bridge.categories.decor;
 $('opcGuide').replaceChildren();const strong=document.createElement('strong');strong.textContent=cat.label+' / '+cat.group;
 const p=document.createElement('span');p.textContent=cat.guide;$('opcGuide').append(strong,p);
 if(!objectId){$('opcWidth').value=cat.defaultFootprint[0];$('opcDepth').value=cat.defaultFootprint[1];$('opcCollision').value=String(cat.collision);
  }
}
function loadImg(url,target,callback){
 const img=new Image();if(/^https:\/\//.test(url))img.crossOrigin='anonymous';img.onload=()=>{
  const c=target.getContext('2d');c.clearRect(0,0,W,H);
  // Source stays pixel-exact unless wider than the editable canvas.
  const factor=Math.min(1,W/img.width,(H-8)/img.height);
  const w=Math.max(1,Math.round(img.width*factor)),h=Math.max(1,Math.round(img.height*factor));
  c.imageSmoothingEnabled=false;c.drawImage(img,0,0,img.width,img.height,Math.floor((W-w)/2),H-8-h,w,h);
  if(callback)callback();
 };img.onerror=()=>status('Cannot load PNG');img.src=url;
}
function editRow(row,isBuiltin=false){
 fresh();objectId=isBuiltin?null:row.id;
 const native=(g.VLAssetCatalog||[]).find(spec=>spec.source==='bangun-object'&&spec.id===row.id);
 const h=Number(row.worldHeight??native?.worldHeight);
 preservedWorldHeight=Number.isFinite(h)&&h>=.3&&h<=24?h:null;
 $('opcName').value=isBuiltin?row.name+' Custom':row.name;
 $('opcDescription').value=row.description||'';
 $('opcCategory').value=row.category;
 categoryChanged();
 $('opcWidth').value=row.footprint[0];$('opcDepth').value=row.footprint[1];$('opcCollision').value=String(row.collision!==false);
 for(const d of DIR){
  const url=isBuiltin?bridge.image(row.id,d):row.views[d]?.url;
  if(url)loadImg(url,canvas[d],show);
 }
 status(isBuiltin?'Template '+row.name+' loaded · save a custom copy':'Editing '+row.name+' · Save to Semesta to update');
}
function library(){
 const filter=$('opcFilter').value,holder=$('opcLibrary'),templates=$('opcTemplates');holder.replaceChildren();templates.replaceChildren();
 const add=(row,builtin,target)=>{
  if(filter!=='all'&&row.category!==filter)return;
  const b=document.createElement('button');b.type='button';b.className='opc-asset';
  const img=document.createElement('img');img.alt='';img.src=builtin?bridge.image(row.id,'sw'):row.views?.sw?.url||'';
  const desc=document.createElement('span');desc.textContent=row.name;
  const small=document.createElement('small');small.textContent=bridge.categories[row.category]?.label||'Custom';desc.append(small);b.append(img,desc);
  b.onclick=()=>editRow(row,builtin);target.append(b);
 };
 for(const row of bridge.read().filter(bridge.valid))add(row,false,holder);
 for(const row of bridge.builtins)add(row,true,templates);
 if(!holder.children.length)holder.textContent='No saved custom objects.';
}
function coord(e){
 const r=$('opcCanvas').getBoundingClientRect();
 return [Math.max(0,Math.min(W-1,Math.floor((e.clientX-r.left)/r.width*W))),
  Math.max(0,Math.min(H-1,Math.floor((e.clientY-r.top)/r.height*H)))];
}
function paintAt(e){
 const [x,y]=coord(e),ctx=canvas[view].getContext('2d');
 if(tool==='picker'){const a=ctx.getImageData(x,y,1,1).data;
  if(a[3]){pixel='#'+Array.from(a.slice(0,3)).map(n=>n.toString(16).padStart(2,'0')).join('');$('opcColor').value=pixel;$('opcColorText').textContent=pixel;}return;
 }
 if(tool==='fill'){
  const data=ctx.getImageData(0,0,W,H),a=data.data,start=(y*W+x)*4,old=[...a.slice(start,start+4)];
  const val=tool==='erase'?[0,0,0,0]:[parseInt(pixel.slice(1,3),16),parseInt(pixel.slice(3,5),16),parseInt(pixel.slice(5,7),16),255];
  if(old.every((n,i)=>n===val[i]))return;
  const stack=[y*W+x],seen=new Uint8Array(W*H);
  while(stack.length){
   const i=stack.pop();if(i<0||i>=W*H||seen[i])continue;seen[i]=1;
   const p=i*4;if(!old.every((n,j)=>a[p+j]===n))continue;
   for(let k=0;k<4;k++)a[p+k]=val[k];
   const cx=i%W,cy=(i-cx)/W;
   if(cx>0)stack.push(i-1);if(cx<W-1)stack.push(i+1);
   if(cy>0)stack.push(i-W);if(cy<H-1)stack.push(i+W);
  }ctx.putImageData(data,0,0);
 }else if(tool==='erase')ctx.clearRect(x,y,1,1);
 else{ctx.fillStyle=pixel;ctx.fillRect(x,y,1,1);}
 show();
}
$('opcCanvas').addEventListener('pointerdown',e=>{
 if(!canvas[view])return;e.preventDefault();snapshot();painting=true;$('opcCanvas').setPointerCapture(e.pointerId);paintAt(e);
});
$('opcCanvas').addEventListener('pointermove',e=>{if(!painting||tool==='fill'||tool==='picker')return;paintAt(e);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('opcCanvas').addEventListener(ev,()=>painting=false);
$('opcViews').onclick=e=>{const b=e.target.closest('button[data-view]');if(b){view=b.dataset.view;show();renderCharacter();}};
$('opcGridToggle').onclick=()=>{gridEnabled=!gridEnabled;rememberGuides();updateGuides();};
$('opcGridSize').onchange=()=>{const n=Number($('opcGridSize').value);if(![1,4,8,16].includes(n))return;gridStep=n;rememberGuides();updateGuides(false);};
$('opcRefToggle').onclick=()=>{referenceEnabled=!referenceEnabled;rememberGuides();updateGuides();};
$('opcReferenceProfile').onchange=()=>{referenceProfile=$('opcReferenceProfile').value;rememberGuides();renderCharacter();};
$('opcTools').onclick=e=>{const b=e.target.closest('button[data-tool]');if(b){tool=b.dataset.tool;show();}};
$('opcColor').oninput=()=>{pixel=$('opcColor').value;$('opcColorText').textContent=pixel;};
for(const color of palettes){
 const b=document.createElement('button');b.type='button';b.style.background=color;b.title=color;
 b.onclick=()=>{pixel=color;$('opcColor').value=pixel;$('opcColorText').textContent=pixel;};
 $('opcPalette').append(b);
}
$('opcUndo').onclick=()=>{const s=undo[view].pop();if(s){redo[view].push(canvas[view].toDataURL('image/png'));restore(s);}};
$('opcRedo').onclick=()=>{const s=redo[view].pop();if(s){undo[view].push(canvas[view].toDataURL('image/png'));restore(s);}};
$('opcMirror').onclick=()=>{
 snapshot();const c=canvas[view],copy=document.createElement('canvas');copy.width=W;copy.height=H;copy.getContext('2d').drawImage(c,0,0);
 const ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(W,0);ctx.scale(-1,1);ctx.drawImage(copy,0,0);ctx.restore();show();
};
$('opcCopyViews').onclick=()=>{for(const d of DIR)if(d!==view){undo[d].push(canvas[d].toDataURL('image/png'));const ctx=canvas[d].getContext('2d');ctx.clearRect(0,0,W,H);ctx.drawImage(canvas[view],0,0);}show();status('Copied current view to SW / SE / NE / NW. Edit silhouettes per direction for best results.');};
$('opcClear').onclick=()=>{if(confirm('Clear pixels in '+view.toUpperCase()+'?')){snapshot();canvas[view].getContext('2d').clearRect(0,0,W,H);show();}};
$('opcCategory').onchange=categoryChanged;
$('opcNew').onclick=fresh;$('opcFilter').onchange=library;
$('opcClose').onclick=()=>dlg.close();
$('opcSave').onclick=()=>{
 try{const row=payload(),stat=bridge.save(row);objectId=row.id;library();
  status('✓ '+row.name+' saved · Semesta / '+bridge.categories[row.category].group+' · '+stat.custom+' custom objects');
 }catch(err){status('Save failed: '+err.message);}
};
$('opcDelete').onclick=()=>{
 if(!objectId){status('The current object has not been saved.');return;}
 if(!confirm('Delete this custom object from Bangun Ruang library? Existing placed Semesta instances may lose the sprite.'))return;
 bridge.remove(objectId);fresh();library();status('Custom object deleted.');
};
$('opcExportPng').onclick=()=>{canvas[view].toBlob(blob=>blob&&download(blob,($('opcName').value||'object').replace(/[^a-z0-9_-]+/gi,'-')+'-'+view+'.png'),'image/png');};
$('opcExport').onclick=()=>{try{const row=payload();download(new Blob([JSON.stringify({format:'virtual-life-pixel-object-v1',object:row},null,2)],{type:'application/json'}),row.name.replace(/[^a-z0-9_-]+/gi,'-')+'.json');status('4-view JSON exported. Import this package in another browser before loading its Semesta city draft.');}catch(err){status(err.message);}};
$('opcImport').onclick=()=>$('opcImportFile').click();
$('opcImportFile').onchange=async e=>{
 try{const f=e.target.files?.[0];if(!f)return;if(f.size>1500000)throw new Error('JSON file is too large.');
  const data=JSON.parse(await f.text()),row=data?.format==='virtual-life-pixel-object-v1'?data.object:null;
  if(!bridge.valid(row))throw new Error('Invalid pixel object package');
  row.id='obj-'+Math.random().toString(36).slice(2,12);bridge.save(row);library();editRow(row);status(row.name+' imported and saved to Semesta');
 }catch(err){status('Import failed: '+err.message);}e.target.value='';
};
$('opcPng').onchange=e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>1200000||file.type!=='image/png'){status('Use a PNG under 1.2 MB');e.target.value='';return;}
 snapshot();const url=URL.createObjectURL(file);
 loadImg(url,canvas[view],()=>{show();URL.revokeObjectURL(url);status('PNG imported to '+view.toUpperCase()+' · transparent pixels preserved');});
 e.target.value='';
};
$('opcGoSemesta').onclick=()=>{window.location.href='../';};
function open(){
 if(!opened){fresh();library();opened=true;}else{library();show();}
 if(!dlg.open)dlg.showModal();
 updateGuides();
}
if(!button.hasAttribute('onclick'))button.addEventListener('click',open);
const sidebar=byId('openObjectCreatorShelf');
if(sidebar&&!sidebar.hasAttribute('onclick'))sidebar.addEventListener('click',open);
g.VLPixelCreator=Object.freeze({open});
})(window);

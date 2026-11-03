/* Bangun Ruang pixel-object creator. Standalone editor; does not mutate
 * architectural sprite pixels or multiplayer assets. */
(function(g){
'use strict';
const bridge=g.VLBangunObjects;
if(!bridge)return;
const byId=id=>document.getElementById(id),DIR=['sw','se','ne','nw'],W=96,H=144;
const palettes=['#344657','#535969','#788197','#A7B2C4','#C7CFDC','#F4EBDA','#D4C8AE','#9B866F','#6B4F3A','#B48455','#F2A066','#C9692F','#86E59A','#4FB36B','#22894A','#1A6A3A','#BFD8E4','#3F7FE0','#F2B530','#EE4D72'];
let opened=false,objectId=null,view='sw',tool='pencil',pixel='#535969',painting=false,canvas={},undo={},redo={};
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
`;
const style=document.createElement('style');style.textContent=css;document.head.append(style);
const button=document.createElement('button');
button.id='openObjectPixelCreator';button.type='button';button.textContent='✎ Pixel Creator';
button.title='Create a new pixel object for placement in Semesta';
const nav=document.querySelector('#app > nav');
if(nav){const exportBtn=byId('exportBtn');nav.insertBefore(button,exportBtn||nav.lastChild);}
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
 <div class="opc-buttons" id="opcTools"><button type="button" data-tool="pencil" class="active">✎ Pencil</button><button type="button" data-tool="erase">⌫ Erase</button><button type="button" data-tool="fill">▨ Fill</button><button type="button" data-tool="picker">◉ Picker</button></div>
 <div class="opc-pixelstage"><canvas id="opcCanvas" width="${W}" height="${H}" aria-label="Draw pixel object with mouse or touch"></canvas></div>
 <div class="opc-buttons"><button type="button" id="opcUndo">↶ Undo</button><button type="button" id="opcRedo">↷ Redo</button><button type="button" id="opcMirror">⇋ Flip current</button><button type="button" id="opcCopyViews">▣ Copy to 4 views</button><button type="button" id="opcClear">✕ Clear view</button></div>
 <div id="opcStatus" class="opc-status" role="status"></div>
 </section>
 <aside class="opc-inspector">
  <label for="opcName">OBJECT NAME</label><input id="opcName" maxlength="80" placeholder="e.g. Lampu Taman Biru" value="Untitled Object">
  <label for="opcCategory">CATEGORY</label><select id="opcCategory">
    <option value="plant">🌱 Tanaman / Vegetation</option><option value="lamp">💡 Lampu / Lighting</option>
    <option value="furniture">▣ Furnitur / Interior</option><option value="street">▤ Street Object</option><option value="decor">✳ Dekorasi</option>
  </select>
  <div id="opcGuide" class="opc-guide"></div>
  <label>FOOTPRINT / TILES</label><div class="opc-buttons"><input id="opcWidth" type="number" min=".25" max="12" step=".25" value="1" aria-label="Footprint width" style="width:49%"><input id="opcDepth" type="number" min=".25" max="12" step=".25" value="1" aria-label="Footprint depth" style="width:49%"></div>
  <label for="opcCollision">COLLISION</label><select id="opcCollision"><option value="false">Walk-through / no collision</option><option value="true">Solid / blocks walking</option></select>
  <label for="opcColor">PIXEL COLOR</label><div class="opc-buttons"><input id="opcColor" type="color" value="#535969" style="width:55px;height:33px;padding:2px"><span id="opcColorText" class="opc-meta" style="align-self:center">#535969</span></div>
  <div id="opcPalette" class="opc-palette"></div>
  <p class="opc-meta"><b>GUIDE SCALE:</b> Native isometric 2:1 (64×32 px per tile). Work on transparent PNG, with solid flat-shaded colors and 1-pixel edges. Sprite ground pivot: bottom center of the canvas. Draw SW, SE, NE, NW separately—not runtime-rotated.</p>
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
 objectId=null;view='sw';tool='pencil';
 $('opcName').value='Untitled Object';$('opcCategory').value='decor';
 categoryChanged();show();status('New object · draw all four directions, then Save to Semesta.');
}
function show(){
 const cv=$('opcCanvas'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);
 ctx.drawImage(canvas[view],0,0);
 $('opcViews').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 $('opcTools').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));
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
  name:$('opcName').value.trim().slice(0,80),category:$('opcCategory').value,
  footprint:[Number($('opcWidth').value),Number($('opcDepth').value)],
  collision:$('opcCollision').value==='true',views:Object.fromEntries(DIR.map(d=>[d,trim(canvas[d])])),version:1
 };
}
function categoryChanged(){
 const cat=bridge.categories[$('opcCategory').value]||bridge.categories.decor;
 $('opcGuide').replaceChildren();const strong=document.createElement('strong');strong.textContent=cat.label+' / '+cat.group;
 const p=document.createElement('span');p.textContent=cat.guide;$('opcGuide').append(strong,p);
 if(!objectId){$('opcWidth').value=cat.defaultFootprint[0];$('opcDepth').value=cat.defaultFootprint[1];$('opcCollision').value=String(cat.collision);}
}
function loadImg(url,target,callback){
 const img=new Image();img.onload=()=>{
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
 $('opcName').value=isBuiltin?row.name+' Custom':row.name;
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
$('opcViews').onclick=e=>{const b=e.target.closest('button[data-view]');if(b){view=b.dataset.view;show();}};
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
function open(){if(!opened){fresh();library();opened=true;}else{library();show();}dlg.showModal();}
button.onclick=open;
if(byId('openObjectCreatorShelf'))byId('openObjectCreatorShelf').onclick=open;
g.VLPixelCreator=Object.freeze({open});
})(window);

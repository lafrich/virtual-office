/* Bangun Ruang > Semesta: placeable isometric furniture and custom pixel objects.
 * Artwork is created from Bangun Ruang's own pixel renderer, NOT extracted from
 * unpublished original sprites. The same-origin user library is exportable.
 */
(function(g){
'use strict';
const KEY='virtual-life-bangun-objects-v1', DIR=['sw','se','ne','nw'];
const PIXEL_WORLD=Math.SQRT2/64, VERTICAL_COMP=2/Math.sqrt(3);
const CHARACTER_HEIGHT=72*PIXEL_WORLD*VERTICAL_COMP; // Actual visible Mahluk Hidup body, not 112px sprite frame
const DEFAULT_HEIGHT=Object.freeze({plant:5.5,lamp:4.7,furniture:1.5,street:1.4,decor:1.6});
const BUILTIN_WORLD_HEIGHT=Object.freeze({'small-tree':5.5,'potted-plant':1.3,
 'park-lamp':4.7,'park-bench':1.3,'park-table':1.25,'trash-bin':1.15});
function placementDimensions(row,dim,pivot,isBuiltIn){
 const naturalHeight=dim[1]*PIXEL_WORLD*VERTICAL_COMP;
 const authoredHeight=Number(row.worldHeight);
 const useWorldHeight=(row.worldHeight!==undefined&&row.worldHeight!==null&&Number.isFinite(authoredHeight)&&authoredHeight>=.3&&authoredHeight<=24)||
  (isBuiltIn&&Object.prototype.hasOwnProperty.call(BUILTIN_WORLD_HEIGHT,row.id));
 if(!useWorldHeight)return {width:dim[0]*PIXEL_WORLD,height:naturalHeight};
 // Height is measured from ground pivot to TOP, not the frame's transparent lower padding.
 const visibleWorldHeight=isBuiltIn?BUILTIN_WORLD_HEIGHT[row.id]:authoredHeight;
 const planeHeight=visibleWorldHeight*dim[1]/Math.max(1,pivot[1]);
 return {width:planeHeight*dim[0]/dim[1]/VERTICAL_COMP,height:planeHeight};
}

const CATEGORY={
 plant:{label:'Tanaman',group:'Vegetation',layer:'vegetation',defaultFootprint:[1,1],collision:false,guide:'Tanaman: kanopi lebih lebar dari batang; pivot tepat pada dasar pot/batang. Cocok di rumput atau trotoar.'},
 lamp:{label:'Lampu',group:'Street / Lighting',layer:'prop',defaultFootprint:[1,1],collision:false,guide:'Lampu: tiang ramping, cahaya cukup digambar sebagai pixel solid. Jangan gunakan glow blur; pivot pada kaki tiang.'},
 furniture:{label:'Furnitur',group:'Interior',layer:'interior',defaultFootprint:[1,1],collision:true,guide:'Kursi, meja, toilet: gunakan perspektif isometric 2:1; tentukan footprint 1–2 tile dan letak kontak karakter.'},
 street:{label:'Objek Jalan',group:'Street / Props',layer:'prop',defaultFootprint:[1,1],collision:true,guide:'Bangku, tempat sampah, signage: gambar alas/tapak serta arah depan-belakang yang konsisten.'},
 decor:{label:'Dekorasi',group:'Decorations',layer:'prop',defaultFootprint:[1,1],collision:false,guide:'Dekorasi: pastikan area transparan di luar siluet. Hindari outline hitam, gradient, smoothing, dan bayangan blur.'}
};
const cache=new Map();
const BUILTIN_DIMENSIONS=Object.freeze({
 "furniture-wc":"69,77,34,56|69,66,34,45|69,66,34,45|69,77,34,56",
 "furniture-shower":"69,84,34,63|69,84,34,63|69,72,34,51|69,83,34,62",
 "furniture-bathtub":"101,78,50,49|101,74,50,45|101,74,50,45|101,74,50,45",
 "furniture-sink":"69,69,34,48|69,64,34,43|69,64,34,43|69,68,34,47",
 "furniture-bed":"133,103,66,66|133,89,66,52|133,89,66,52|133,103,66,66",
 "furniture-wardrobe":"101,107,50,78",
 "furniture-chair":"69,76,34,55|69,67,34,46|69,67,34,46|69,76,34,55",
 "furniture-sofa":"101,93,50,64|101,83,50,54|101,83,50,54|101,93,50,64",
 "furniture-table":"101,83,50,54",
 "furniture-desk":"101,94,50,65|101,88,50,59|101,83,50,54|101,83,50,54",
 "furniture-office_chair":"69,76,34,55|69,67,34,46|69,67,34,46|69,76,34,55",
 "furniture-computer":"69,79,34,58|69,69,34,48|69,69,34,48|69,79,34,58",
 "furniture-stove":"69,67,34,46",
 "furniture-fridge":"69,93,34,72",
 "furniture-kitchen_sink":"69,69,34,48|69,64,34,43|69,64,34,43|69,68,34,47",
 "furniture-cashier":"101,83,50,54|101,83,50,54|101,87,50,58|101,90,50,61",
 "furniture-shelf":"101,102,50,73|101,103,50,74|101,103,50,74|101,102,50,73",
 "furniture-counter":"101,85,50,56|101,83,50,54|101,83,50,54|101,85,50,56",
 "park-bench":"104,74,52,70",
 "park-lamp":"34,139,17,135",
 "park-table":"108,47,54,43",
 "trash-bin":"50,53,25,49",
 "potted-plant":"64,79,32,75",
 "small-tree":"71,119,34,115|68,119,34,115|71,119,34,115|68,119,34,115"
});
function dimensions(id,dir){
 const vals=BUILTIN_DIMENSIONS[id];if(!vals)return {size:[64,96],pivot:[32,88]};
 const parts=vals.split('|'),n=parts[Math.max(0,DIR.indexOf(dir))]||parts[0];
 const [w,h,x,y]=n.split(',').map(Number);
 return {size:[w,h],pivot:[x,y]};
}

const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||a));
function canvas(w,h){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;return [cv,ctx];}
function cut(cv,pivot){
 const x=cv.getContext('2d'),{width:w,height:h}=cv,arr=x.getImageData(0,0,w,h).data;
 let left=w,top=h,right=0,bottom=0;
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(arr[(y*w+xx)*4+3]){
  left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(left>right)return null;
 // Include the physical floor pivot even if transparent.
 left=clamp(Math.floor(Math.min(left,pivot[0])-3),0,w-1);
 top=clamp(Math.floor(Math.min(top,pivot[1])-3),0,h-1);
 right=clamp(Math.ceil(Math.max(right,pivot[0])+3),0,w-1);
 bottom=clamp(Math.ceil(Math.max(bottom,pivot[1])+3),0,h-1);
 const width=right-left+1,height=bottom-top+1,[out,ctx]=canvas(width,height);
 ctx.drawImage(cv,left,top,width,height,0,0,width,height);
 return {url:out.toDataURL('image/png'),size:[width,height],pivot:[pivot[0]-left,pivot[1]-top]};
}
const fixtures=Object.entries(g.VLBuildingInterior?.types||{}).map(([id,def])=>({
 id:'furniture-'+id,name:def.label,category:'furniture',kind:'fixture',fixture:id,
 footprint:[def.w,def.d],collision:true,interactions:def.actions||[]
}));
const outdoor=[
 ['park-bench','Bangku Taman','street',[2,1],'bench',true,['sit']],
 ['park-lamp','Lampu Taman','lamp',[1,1],'lamp',false,[]],
 ['park-table','Meja Taman','street',[2,2],'table',true,[]],
 ['trash-bin','Tong Sampah','street',[1,1],'trash',true,[]],
 ['potted-plant','Tanaman Pot','plant',[1,1],'plant',false,[]],
 ['small-tree','Pohon Kecil','plant',[2,2],'tree',true,[]]
].map(([id,name,category,footprint,kind,collision,interactions])=>({id,name,category,footprint,kind,collision,interactions}));
const builtins=Object.freeze([...fixtures,...outdoor]);
function drawOutdoor(row,dir){
 const tall=row.kind==='tree'?122:row.kind==='lamp'?142:row.kind==='plant'?82:82;
 const wide=row.kind==='bench'||row.kind==='table'?108:row.kind==='tree'?102:64;
 const [cv,c]=canvas(wide,tall),R=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const mid=wide/2,base=tall-7,flip=['se','nw'].includes(dir)?-1:1;
 if(row.kind==='lamp'){
  R('#535969',mid-4,base-110,8,110);R('#788197',mid-5,base-110,3,110);
  R('#344657',mid-14,base-115,28,6);R('#E5B647',mid-10,base-134,20,19);
  R('#F4EBDA',mid-6,base-132,12,11);R('#344657',mid-13,base-138,26,5);
  R('#535969',mid-12,base-6,24,6);
 }else if(row.kind==='bench'||row.kind==='table'){
  R('#535969',mid-37,base-27,6,23);R('#535969',mid+31,base-27,6,23);
  R('#6B4F3A',mid-48,base-30,96,10);R('#B48455',mid-48,base-34,96,8);
  if(row.kind==='bench'){
   R('#6B4F3A',mid-49,base-67,98,28);R('#B48455',mid-47,base-65,94,7);
   R('#C99A5C',mid-47,base-53,94,8);R('#C99A5C',mid-47,base-42,94,5);
  }else{R('#D4C8AE',mid-53,base-35,106,5);R('#B48455',mid-51,base-40,102,7);}
 }else if(row.kind==='trash'){
  R('#535969',mid-18,base-43,36,42);R('#788197',mid-16,base-40,32,30);
  R('#344657',mid-22,base-46,44,7);R('#A7B2C4',mid-12,base-38,5,24);
 }else{
  const pot=row.kind==='plant';
  if(!pot){R('#6B4F3A',mid-7,base-64,14,61);R('#9A6A3E',mid-7,base-61,4,56);}
  else{R('#9A6A3E',mid-19,base-29,38,28);R('#C9692F',mid-16,base-26,32,23);R('#6B4F3A',mid-22,base-32,44,6);}
  const cy=pot?base-53:base-87;
  R('#1A6A3A',mid-18,cy-19,36,39);
  R('#22894A',mid-31,cy-6,62,23);
  R('#4FB36B',mid-21,cy-24,41,21);
  R('#86E59A',mid-8,cy-26,19,13);
  R('#22894A',mid+flip*19,cy-4,15,13);
 }
 return cut(cv,[Math.floor(mid),base]);
}
function drawFixture(row,dir){
 const iso=g.VLInteriorIso;
 if(!iso?.drawFurniture||!iso?.bounds||!iso?.point)return null;
 const geo=iso.bounds({width:7,depth:7});
 const [cv,ctx]=canvas(geo.width,geo.height);
 const rotation=DIR.indexOf(dir)*90,item={id:'preview',assetId:row.fixture,c:2,r:2,rotation};
 iso.drawFurniture(ctx,geo,item,false);
 const [fw,fd]=rotation%180?[row.footprint[1],row.footprint[0]]:row.footprint;
 // Pivot is where this object touches the ground in Semesta.
 const pivot=iso.point(geo,2+fw/2,2+fd/2,0);
 return cut(cv,pivot);
}
function imageForBuiltin(id,dir){
 const key=id+'|'+dir;
 if(!cache.has(key)){
  const row=builtins.find(b=>b.id===id);
  if(!row)return null;
  cache.set(key,row.kind==='fixture'?drawFixture(row,dir):drawOutdoor(row,dir));
 }
 return cache.get(key)||null;
}
function read(){
 try{
  const v=JSON.parse(localStorage.getItem(KEY)||'[]');
  return Array.isArray(v)?v.slice(0,60):[];
 }catch{return [];}
}
function valid(row){
 if(!row||typeof row.id!=='string'||!/^obj-[a-z0-9-]{3,66}$/.test(row.id)||!CATEGORY[row.category])return false;
 if(typeof row.name!=='string'||!row.name.trim()||row.name.length>80)return false;
 if(!Array.isArray(row.footprint)||row.footprint.length!==2||
  row.footprint.some(x=>!Number.isFinite(Number(x))||x<.25||x>12))return false;
 // Optional for old authored objects. New Pixel Creator versions store their
 // real Semesta placement height, independent of sprite resolution.
 if(row.worldHeight!==undefined&&row.worldHeight!==null&&
  (!Number.isFinite(Number(row.worldHeight))||Number(row.worldHeight)<.3||Number(row.worldHeight)>24))return false;
 if(!row.views||!DIR.every(d=>{
  const v=row.views[d];
  return !!v&&Array.isArray(v.size)&&v.size.length===2&&v.size.every(n=>Number.isInteger(n)&&n>=1&&n<=256)&&
   Array.isArray(v.pivot)&&v.pivot.length===2&&v.pivot.every((n,i)=>Number.isFinite(n)&&n>=0&&n<=v.size[i])&&
   typeof v.url==='string'&&v.url.length<300000&&/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(v.url);
 }))return false;
 return true;
}
function specs(){
 const results=[];
 for(const row of builtins)results.push(makeSpec(row,true));
 for(const row of read())if(valid(row))results.push(makeSpec(row,false));
 return results;
}
function makeSpec(row,isBuiltIn){
 const id=isBuiltIn?row.id:row.id;
 const view=isBuiltIn?dimensions(id,'sw'):row.views.sw;
 const dim=view?.size||[64,96],pivot=view?.pivot||[32,90],category=CATEGORY[row.category];
 const placement=placementDimensions(row,dim,pivot,isBuiltIn);
 return Object.freeze({
 id,file:'object:'+id,label:row.name,group:category.group,source:'bangun-object',
 description:String(row.description||'').slice(0,600),
 objectCategory:row.category,layer:category.layer,published:true,builtIn:isBuiltIn,
 collision:row.collision!==false,footprint:row.footprint.slice(),size:dim,pivot,
 width:placement.width,height:placement.height,
 worldHeight:placement.height*(pivot[1]/dim[1]), // Visible height above shared foot pivot
 characterHeight:CHARACTER_HEIGHT,
 interactions:row.interactions||[],blocking:row.collision===false?'no':'yes',
 variants:Object.fromEntries(DIR.map(d=>[d,{size:(isBuiltIn?dimensions(id,d):row.views[d])?.size||dim,
  pivot:(isBuiltIn?dimensions(id,d):row.views[d])?.pivot||pivot}]))
 });
}
function image(id,dir='sw'){
 const direction=DIR.includes(dir)?dir:'sw';
 const built=builtins.find(x=>x.id===id);
 if(built)return imageForBuiltin(id,direction)?.url||null;
 const custom=read().find(x=>x.id===id&&valid(x));
 return custom?.views?.[direction]?.url||null;
}
function refresh(){
 const base=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog.filter(x=>x?.source!=='bangun-object'):[];
 const available=specs();
 g.VLAssetCatalog=Object.freeze([...base,...available]);
 return {count:available.length,builtIn:builtins.length,custom:available.length-builtins.length};
}
const api=Object.freeze({key:KEY,categories:CATEGORY,builtins,read,valid,refresh,image,
 characterWorldHeight:CHARACTER_HEIGHT,defaultWorldHeight:DEFAULT_HEIGHT,
 save(row){
  if(!valid(row))throw new Error('Objek tidak valid: isi 4 arah PNG, kategori dan footprint.');
  const list=read().filter(x=>x.id!==row.id);
  if(list.length>=60)throw new Error('Batas 60 custom objects. Hapus atau ekspor beberapa objek.');
  list.push(row);localStorage.setItem(KEY,JSON.stringify(list));
  return refresh();
 },
 remove(id){
  localStorage.setItem(KEY,JSON.stringify(read().filter(x=>x.id!==id)));
  return refresh();
 }
});
g.VLBangunObjects=api;
refresh();
})(window);

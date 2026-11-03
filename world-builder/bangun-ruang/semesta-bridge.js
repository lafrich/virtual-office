/* Bangun Ruang -> Semesta: same-origin local asset catalog.
 * No production-game writes. Images are saved by the building studio and
 * resolved as pixel-perfect transparent PNG data URLs at runtime.
 */
(function(g){
'use strict';
const KEY='virtual-life-bangun-ruang-v1';
const MAX=75;
const byId=new Map(),entries=[];
let list=[];
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'[]');
 if(Array.isArray(raw))list=raw.slice(0,MAX);
}catch(err){console.warn('Bangun Ruang catalog inaccessible',err);}
for(const a of list){
 if(!a||!/^br-[a-z0-9-]{1,72}$/.test(a.id||'')||!a.views||!a.config)continue;
 const w=Number(a.config.w),d=Number(a.config.d);
 if(!Number.isInteger(w)||!Number.isInteger(d)||w<2||d<2||w>12||d>12)continue;
 const variants={};
 for(const dir of ['sw','se','ne','nw']){
  const v=a.views[dir],s=v?.size,p=v?.pivot;
  if(!v||!/^data:image\/png;base64,/.test(v.url||'')||
     !Array.isArray(s)||!Array.isArray(p)||
     s.length!==2||p.length!==2||s.some(x=>!Number.isFinite(x)||x<1||x>2048))continue;
  variants[dir]={file:'local:'+a.id+'_'+dir+'.png',size:s,pivot:p};
 }
 if(!Object.keys(variants).length)continue;
 const canonical=variants.sw||Object.values(variants)[0];
 const spec=Object.freeze({
  id:a.id,file:'studio:'+a.id,label:String(a.name||'Building').slice(0,80),
  group:'kampung',source:'custom-building',published:true,
  footprint:[w,d],size:canonical.size,pivot:canonical.pivot,
  width:canonical.size[0]/50,height:canonical.size[1]/50,
  collision:a.config.collision!=='no',variants:Object.freeze(variants)
 });
 byId.set(a.id,a);entries.push(spec);
}
const base=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
g.VLAssetCatalog=Object.freeze([...base,...entries]);
g.VLBuildingBridge=Object.freeze({
 key:KEY,entries:Object.freeze(entries),
 image(id,dir='sw'){
  const a=byId.get(id),v=a?.views?.[dir]||a?.views?.sw;
  return v?.url||null;
 },
 count:entries.length
});
})(window);

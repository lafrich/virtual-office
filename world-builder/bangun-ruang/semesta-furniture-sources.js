/* Semesta furniture -> Bangun Ruang interior catalog.
 * Reuses native four-view PNGs saved by Pixel Creator; never substitutes
 * a generic sprite for an unavailable/unpublished original. */
(function(g){
'use strict';
const DIR=['sw','se','ne','nw'];
const STORE='virtual-life-bangun-objects-v1';
const PREFIX='semesta-furniture:';
let sources=new Map();
function validImage(src){
 return typeof src==='string'&&src.length<5000000&&
  (/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(src)||
   /^https:\/\/[a-z0-9.-]+\/[a-z0-9/%_.?=&-]+$/i.test(src));
}
function dimensions(row){
 const fp=row?.footprint||[1,1];
 return [Math.max(1,Math.min(12,Math.ceil(Number(fp[0])||1))),
  Math.max(1,Math.min(12,Math.ceil(Number(fp[1])||1)))];
}
function refresh(){
 const result=new Map();
 function take(row,views,source){
  if(!row||typeof row.id!=='string'||!views||result.has(PREFIX+row.id))return;
  if(!DIR.every(d=>validImage(views[d]?.url)))return;
  const [w,d]=dimensions(row);
  const prepared=Object.fromEntries(DIR.map(dir=>{
   const v=views[dir];
   const size=Array.isArray(v.size)?v.size:[64,96],pivot=Array.isArray(v.pivot)?v.pivot:[32,88];
   return [dir,{url:v.url,size:[Number(size[0])||64,Number(size[1])||96],
    pivot:[Number(pivot[0])||32,Number(pivot[1])||88]}];
  }));
  result.set(PREFIX+row.id,{
   id:PREFIX+row.id,sourceId:row.id,
   label:String(row.name||row.label||row.id).slice(0,80),
   category:'SEMESTA / FURNITUR',w,d,
   interactions:Array.isArray(row.interactions)?row.interactions.slice(0,12):[],
   views:prepared,source
  });
 }
 // User-authored Pixel Creator furniture is stored on this same Pages origin.
 // Do not read/generate PNGs from unrelated browser or encrypted game files.
 try{
  const stored=JSON.parse(g.localStorage?.getItem(STORE)||'[]');
  if(Array.isArray(stored))for(const row of stored){
   if(row?.category==='furniture'&&/^obj-[a-z0-9-]{3,66}$/.test(row.id))
    take(row,row.views,'pixel-creator');
  }
 }catch(e){console.warn('Semesta furniture storage unavailable',e)}
 // Four-view native review sprites can be used as static furniture if the
 // published review manifest is loaded. Missing preview data is not faked.
 for(const row of g.VLBangunObjects?.builtins||[]){
  if(row?.kind!=='grok-native'||row.category!=='furniture')continue;
  take(row,row.grok?.views,'grok-review');
 }
 sources=result;
 return [...sources.values()];
}
function all(){return [...sources.values()]}
function get(id){return sources.get(id)||null}
g.VLSemestaFurnitureSources=Object.freeze({PREFIX,STORE,DIR,refresh,all,get});
refresh();
})(window);

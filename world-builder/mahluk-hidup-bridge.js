/* Mahluk Hidup -> Semesta: published 4-way pixel characters and same-origin
 * local Character Storage, read only. Does not write source art or gameplay.
 * Pages share the origin https://lafrich.github.io; paths are separate.
 */
(function(g){
'use strict';
const BASE=new URL('/virtual-life-asset-pipeline/',location.origin);
// Fail closed if the reset policy has not loaded yet. No legacy sprites
// become playable accidentally; saved city and character data stays intact.
const reset=()=>g.VLCharacterReferenceReset||{active:false,filter:rows=>rows||[],visible:()=>true};
const CHAR_KEY='virtual-life-character-storage-v1';
const V2_KEY='mahluk-2-library-v1';
const EQUIP_KEY='virtual-life-accessory-equipment-v1';
const ART_KEY='virtual-life-accessories-v1';
const DIR=['se','sw','ne','nw'];
const BASES=['astrofrich_base','human_male_base','human_female_base'];
const SAFE_ID=/^[a-z0-9_-]{1,90}$/;
const ASSET=/^media\/[a-z0-9_.-]+\.png$/i;
const DATA=/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/;
const SLOTS=['bag','shoes','pants','shirt','hair','helmet'];
let entries=new Map(),customs=new Map(),equipment={},accessories=new Map();
let build='',loaded=false,lastError='',lastSync=0,gameplayRig=null;
const read=(key,def)=>{try{return JSON.parse(localStorage.getItem(key))??def}catch{return def}};
function parseCatalog(json){
 if(!Array.isArray(json?.characters))throw Error('Invalid Mahluk Hidup character catalog');
 const next=new Map();
 for(const raw of (reset().active?reset().filter(json.characters):json.characters)){
  if(!raw||!SAFE_ID.test(raw.id)||/^(?:legacy_)?otis$/.test(raw.id))continue;
  if(typeof raw.sheet!=='string'||!ASSET.test(raw.sheet))continue;
  const motions=Array.isArray(raw.motions)?raw.motions.filter(m=>
   m&&SAFE_ID.test(m.id)&&m.available===true&&Number.isInteger(m.frames)&&
   m.frames>=1&&m.frames<=40&&(!m.sheet||ASSET.test(m.sheet))&&
   Number.isInteger(m.row)&&m.row>=0&&m.row<=43):[];
  // Native v6b characters author transparent face overlays, while
  // legacy Theodore/Gfunk/Yerbies author full-body expression atlases.
  // Both are same-actor facial sources and must survive catalog filtering.
  const expressions=Array.isArray(raw.expressions)?raw.expressions.filter(e=>
   e&&SAFE_ID.test(e.id)&&(ASSET.test(e.overlay||'')||ASSET.test(e.sheet||'')))
   .map(e=>({id:e.id,label:String(e.label||e.id).slice(0,64),
    ...(ASSET.test(e.sheet||'')?{sheet:e.sheet}:{}),
    ...(ASSET.test(e.overlay||'')?{overlay:e.overlay}:{})})): [];
  // Preserve only canonical native V6B lying row metadata; padded legacy
  // atlases are not allowed to advertise an unrendered pose.
  const row_starts=raw.row_starts?.lie===36?{lie:36}:{};
  const entry={id:raw.id,name:String(raw.name||raw.id).slice(0,90),
   sheet:raw.sheet,motions,expressions,row_starts,baseId:raw.id,
   category:raw.template_category||'npc',template_category:raw.template_category||null,
   template:raw.template===true,
   gender:['male','female'].includes(raw.gender)?raw.gender:null,
   bodyType:['male','female'].includes(raw.bodyType)?raw.bodyType:
    ['male','female'].includes(raw.gender)?raw.gender:null,
   skinTone:typeof raw.skinTone==='string'?raw.skinTone:null,
   status:raw.asset_status||'published',custom:false};
  next.set(entry.id,entry);
 }
 if(!next.size&&!reset().active)throw Error('No published Mahluk Hidup characters');
 return next;
}
function localSync(){
 const nextCustoms=new Map(),nextAccessories=new Map();
 const rows=read(CHAR_KEY,[]);
 const stored=read(ART_KEY,[]);
 const worn=read(EQUIP_KEY,{});
 if(Array.isArray(stored)){
  for(const raw of stored.slice(0,100)){
   if(!raw||!SAFE_ID.test(raw.id)||!SLOTS.includes(raw.category)||
      !BASES.includes(raw.template_base||'astrofrich_base'))continue;
   const frames={},back_frames={};
   for(const dir of DIR){
    const url=raw.frames?.[dir],rear=raw.back_frames?.[dir];
    if(typeof url==='string'&&url.length<100000&&DATA.test(url))frames[dir]=url;
    if(typeof rear==='string'&&rear.length<100000&&DATA.test(rear))back_frames[dir]=rear;
   }
   const nativeRear=raw.category==='hair'&&DIR.every(d=>!!back_frames[d]);
   if(DIR.every(d=>!!frames[d]))nextAccessories.set(raw.id,{
    id:raw.id,category:raw.category,baseId:raw.template_base||'astrofrich_base',
    frames,...(nativeRear?{back_frames}:{})
   });
  }
 }
 if(Array.isArray(rows)){
  for(const r of rows.slice(0,60)){
   if(!r||!/^custom_(astro|human)_[a-z0-9-]+$/.test(r.id||'')||
    !BASES.includes(r.base)||!entries.has(r.base))continue;
   const parent=entries.get(r.base);
   nextCustoms.set(r.id,{...parent,id:r.id,name:String(r.name||r.id).slice(0,40),
    baseId:r.base,category:parent.category,template:false,custom:true,
    bodyType:parent.bodyType||parent.gender||null,
    skinTone:['base','light','medium','tan','deep','dark'].includes(r.skinTone)?
     r.skinTone:'base'});
  }
 }
 // Mahluk Hidup 2.0 publishes pixel-perfect 4-direction 2.5D cutout
 // composites, plus independent plane transforms in the authored project.
 // These actors live alongside (not over) all historical V6B profiles.
 const v2=read(V2_KEY,[]);
 if(Array.isArray(v2))for(const row of v2.slice(-30)){
  if(!row||row.format!=="mahluk-2-character-v1"||
     !/^mh2_[a-z0-9]+$/.test(row.id)||typeof row.name!=="string"||
     typeof row.sprite!=="string"||!DATA.test(row.sprite)||row.sprite.length>1250000)continue;
  const clips={};
  if(row.clips&&typeof row.clips==="object")for(const [id,c] of Object.entries(row.clips)){
   if(!/^(idle|walk|talk|sit|lie|custom)$/.test(id)||!c||
      !Number.isInteger(c.frames)||c.frames<1||c.frames>48||
      typeof c.sheet!=="string"||!DATA.test(c.sheet)||c.sheet.length>1250000)continue;
   clips[id]={url:c.sheet,frames:c.frames,
     frame_ms:Array.isArray(c.frame_ms)?c.frame_ms.slice(0,c.frames):[],loop:c.loop!==false};
  }
  if(!clips.idle)clips.idle={url:row.sprite,frames:1,frame_ms:[240],loop:true};
  nextCustoms.set(row.id,{id:row.id,name:row.name.slice(0,60),
   baseId:row.template_base==="human_female_base"?"human_female_base":"human_male_base",
   category:"human",template_category:"human",template:false,custom:true,
   bodyType:row.base==="female"?"female":"male",gender:row.base==="female"?"female":"male",
   v2:true,v2Sheet:row.sprite,v2Clips:clips,
   // Keep the same canonical root identity across Semesta / Bangun Ruang.
   // Jiwa can consume the V6B bone identity; EMOSI.EXE continues owning
   // face RGBA frames. These metadata are read-only here.
   v2RigSystem:row.rigSystem==='v6b'?'v6b':'modular-v2',
   v2FacelessBase:['male','female'].includes(row.facelessBase)?row.facelessBase:null,
   v2EmotionPlane:typeof row.emotionPlane?.asset==='string'?{
    asset:row.emotionPlane.asset,
    placement:row.emotionPlane.placement||null
   }:null,
   v2EditableBones:row.facelessBase?[
    'head','neck','torso','pelvis',
    'shoulder_l','elbow_l','wrist_l','shoulder_r','elbow_r','wrist_r',
    'hip_l','knee_l','ankle_l','hip_r','knee_r','ankle_r'
   ]:null,
   motions:Object.entries(clips).map(([id,c])=>({id,frames:c.frames,available:true,
    frame_ms:c.frame_ms,source:"mahluk2"})),
   expressions:[],sheet:"media/human-male-base-sheet.png"});
 }
 const nextEquip={};
 if(worn&&typeof worn==='object'){
  for(const [actor,slots] of Object.entries(worn)){
   if(!SAFE_ID.test(actor)||(!entries.has(actor)&&!nextCustoms.has(actor)))continue;
   const base=nextCustoms.get(actor)?.baseId||entries.get(actor)?.baseId;
   const picked={};
   for(const slot of SLOTS){
    const acc=nextAccessories.get(slots?.[slot]);
    if(acc&&acc.baseId===base&&acc.category===slot)picked[slot]=acc;
   }
   if(Object.keys(picked).length)nextEquip[actor]=picked;
  }
 }
 customs=nextCustoms;accessories=nextAccessories;equipment=nextEquip;
 lastSync=Date.now();
 return {characters:customs.size,accessories:accessories.size};
}
async function load(){
 // Never load unapproved remote URLs: the Pages path is fixed to own source.
 const ctrl=new AbortController();
 // Always retain the previous successful catalog when a refresh fails.
 try{
  const res=await fetch(new URL('catalog.json',BASE),{cache:'no-store',signal:ctrl.signal});
  if(!res.ok)throw Error('Mahluk Hidup catalog HTTP '+res.status);
  const json=await res.json();
  const parsed=parseCatalog(json);
  // Reference rig is Male/Female only; NPC sprite data is never replaced.
  const baseline=reset().active?null:g.VLHumanGameplayRig?.compile?.([...parsed.values()])||null;
  entries=parsed;gameplayRig=baseline;build=String(json.build_version||'').slice(0,25);
  loaded=true;lastError='';
 }catch(e){lastError=String(e.message||e);}
 const local=localSync();
 return {loaded,total:entries.size,custom:local.characters,accessories:local.accessories,error:lastError};
}
function get(id){return reset().active&&!reset().visible(id)?null:customs.get(id)||entries.get(id)||null}
function list(){return [...entries.values(),...customs.values()].filter(x=>!reset().active||reset().visible(x.id))}
function url(path){if(reset().active||!ASSET.test(path))return null;
 const link=new URL(path,BASE);if(build)link.searchParams.set('build',build);
 return link.href;
}
function motions(id){return get(id)?.motions||[]}
function available(id,motion){return motions(id).find(m=>m.id===motion)||null}
function gameplayAction(id,action,fixture){
 if(reset().active&&!reset().visible(id))return null;
 return gameplayRig?.forActor(get(id),action,fixture)||null;
}
function equipmentFor(id){return equipment[id]||{}}
function has(id){return !!get(id)}
function actionSceneFor(fixture,action){
 if(reset().active)return null;
 return g.VLActionScenes?.forPlacement?.(fixture,action)||null;
}
function questProfile(id){
 if(has(id))return id;
 if(has('legacy_'+id))return 'legacy_'+id;
 return null;
}
g.VLMahlukHidup=Object.freeze({
 load,localSync,get,list,url,motions,available,gameplayAction,
 equipmentFor,actionSceneFor,questProfile,has,
 get referenceReset(){return reset().active},get referenceMessage(){return reset().message||'MENUNGGU RIG BARU'},
 get gameplayRigReady(){return !!gameplayRig?.ready},
 get buildVersion(){return build},get ready(){return loaded},
 get error(){return lastError},get baseUrl(){return BASE.href},
 DIR,FRAME:Object.freeze({w:64,h:112,pivotX:32,pivotY:100})
});
})(window);

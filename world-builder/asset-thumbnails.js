/* Semesta asset browser thumbnails.
 * Source URLs are derived from catalog entries already used by 3D placement.
 * Never guesses unpublished artwork or substitutes another asset's picture.
 * No map edits: browsing, hovering and view changes are presentation-only.
 */
(function(g){
'use strict';
const raw='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/';
const cachedVehicles=new Map();
const terrainNames={road:'road_asphalt',sidewalk:'sidewalk',grass:'grass',
 water:'water',plaza:'plaza',soil:'soil'};
const symbols={indonesia:'▥',terrain:'▦',custom:'⌂',building:'▥',street:'♧',
 vegetation:'♣',interior:'▤',character:'◉',vehicles:'▰',
 people:'♙',quest:'⚑',logic:'◇'};
const labels={indonesia:'INDONESIA',terrain:'TERRAIN',custom:'BUILDING',building:'BUILDING',
 street:'STREET',vegetation:'VEGETATION',interior:'INTERIOR',
 character:'CHARACTER',vehicles:'VEHICLE',people:'NPC',quest:'QUEST',logic:'LOGIC'};
function validUrl(url){
 if(typeof url!=='string'||!url)return null;
 // Generated data URLs from the game's own canvas, local custom sprites
 // and canonical HTTPS URLs only. Never use untrusted HTML or scripting URLs.
 if(/^data:image\/(?:png|webp|jpeg|gif);base64,[a-z0-9+/=]+$/i.test(url))return url;
 if(/^blob:https?:\/\//i.test(url))return url;
 try{const parsed=new URL(url,g.location?.href||'https://lafrich.github.io/');
  return ['https:','http:'].includes(parsed.protocol)?parsed.href:null;
 }catch{return null;}
}
function fallbackIcon(category){return symbols[category]||'◇';}
function sourceFor(spec,env=g){
 if(!spec||spec.published===false)return null;
 const id=String(spec.id||'');
 if(spec.source==='pipeline-street'){
  const view=spec.variants?.sw||spec.variants?.se||spec.variants?.ne||spec.variants?.nw;
  return validUrl(view?.file?raw+'assets/street_buildings/'+view.file:null);
 }
 if(spec.source==='pipeline-vegetation'){
  return validUrl(spec.relativeFile?raw+'assets/vegetation_kebonsirih/'+spec.relativeFile:null);
 }
 if(spec.source==='custom-building')return validUrl(env.VLBuildingBridge?.image(id,'sw'));
 if(spec.source==='bangun-object')return validUrl(env.VLBangunObjects?.image(id,'sw'));
 // GPT original art is protected by its own source vault; never request it
 // unless the user has explicitly unlocked that vault.
 return null;
}
function vehicleUrl(id,env=g){
 // Same image and orientation as vehicleGraphic uses in the actual scene.
 // Do not memoize old previews: a live native PNG can replace a fallback
 // after the underlying placement texture finishes loading.
 try{return validUrl(env.VLSemestaArt?.vehiclePreview?.(id,'se'))||null;}catch{return null;}
}
function footprint(spec){
 if(!spec)return '';
 const fp=spec.footprint||spec.editorFootprint;
 if(!Array.isArray(fp)||fp.length<2)return '';
 const format=n=>Number.isInteger(+n)?String(n):String(+Number(n).toFixed(1));
 return Number.isFinite(+fp[0])&&Number.isFinite(+fp[1])?
   format(fp[0])+'×'+format(fp[1])+' tiles':'';
}
function describe(entry,byName,env=g){
 const tag=String(entry?.tag||''),category=entry?.category||'street';
 let spec=null,src=null;
 if(tag.startsWith('sprite:')){
  spec=byName?.get(tag.slice(7))||null;
  src=sourceFor(spec,env);
 }else if(tag.startsWith('terrain:')){
  const name=terrainNames[tag.slice(8)];
  src=name?validUrl(env.VLKebonSirihStyle?.tileUrl(name)):null;
 }else if(tag.startsWith('vehicle:')){
  const id=tag.slice(8);
  spec=env.VLSemestaCatalog?.vehicle(id)||null;
  src=vehicleUrl(id,env);
 }else if(tag.startsWith('character:')||tag.startsWith('pedestrian:')||
  tag.startsWith('quest-character:')){
  const id=tag.split(':').slice(1).join(':');
  src=env.VLCharacterRig?.characterPreview?.(id,'sw')||null;
 }else if(tag.startsWith('quest:')){
  src=validUrl(env.VLSemestaArt?.questPreview?.(tag.slice(6)))||null;
 }else if(tag==='avatar'||tag==='npc'){
  src=env.VLCharacterRig?.characterPreview?.(tag==='avatar'?'ichsan':'noor','sw')||null;
 }
 const fp=footprint(spec),kind=labels[category]||category.toUpperCase();
 const unavailable=spec?.published===false;
 return Object.freeze({
  url:unavailable?null:src,
  fallback:fallbackIcon(category),
  category:kind,
  footprint:fp,
  title:entry?.title||spec?.label||'Asset',
  source:unavailable?'PREVIEW ONLY':spec?.source==='pipeline-street'||
    spec?.source==='pipeline-vegetation'?'PIXEL PIPELINE':
    spec?.source==='bangun-object'||spec?.source==='custom-building'?'BANGUN RUANG':
    category==='terrain'?'CITY MATERIAL':tag.startsWith('vehicle:')?'MAHLUK HIDUP':
    entry?.label||'ASSET',
  status:unavailable?'unpublished':'available'
 });
}
g.VLAssetThumbnails=Object.freeze({describe,sourceFor,footprint,fallbackIcon,terrainNames});
})(typeof window!=='undefined'?window:globalThis);

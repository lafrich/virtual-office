/* Structured, data-only map authoring model.
 * No gameplay execution, persistence beyond local drafts, or AI side effects.
 * Supports v1 map import without losing original unknown object metadata.
 */
(function(g){
'use strict';
const TYPES=['spawn','entrance','interaction','patrol','trigger'];
const LAYERS=['structure','prop','vegetation','interior','character','marker'];
const clone=v=>JSON.parse(JSON.stringify(v));
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9-_]/g,'-').slice(0,60);
const text=s=>String(s||'').slice(0,500);
const names=v=>Array.isArray(v)?v.map(text).filter(Boolean).slice(0,20):
 String(v||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,20);
function defaults(item,catalog,style){
 const kind=style.category(item,catalog);
 const spec=item.type==='sprite'?catalog.get(item.asset):null;
 const layer=item.type==='marker'?'marker':kind==='actor'?'character':
  ['tree'].includes(kind)||spec?.source==='pipeline-vegetation'?'vegetation':
  kind==='building'?'structure':spec?.group==='Interior'||spec?.group==='Office'?'interior':'prop';
 const subtype=item.type==='marker'?(item.markerKind||'interaction'):
  spec?.id||spec?.label||kind;
 const interactions=kind==='bench'?['sit']:kind==='trash'?['dispose']:
  kind==='building'?['enter']:item.type==='marker'?['activate']:[];
 return {layer,subtype:String(subtype).slice(0,60),tags:[],interactions,
  capacity:kind==='bench'?2:1,entranceFacing:'', // Only manually confirmed doors become entrance anchors.
  markerKind:item.type==='marker'?'interaction':'',
  blocking:item.collision===false?'no':'auto',notes:''};
}
function normalize(obj,catalog,style){
 const d=defaults(obj,catalog,style);
 obj.layer=LAYERS.includes(obj.layer)?obj.layer:d.layer;
 obj.subtype=text(obj.subtype||d.subtype).slice(0,60);
 obj.tags=names(obj.tags);
 obj.interactions=names(obj.interactions||d.interactions);
 obj.capacity=Math.max(0,Math.min(1000,Math.floor(Number(obj.capacity??d.capacity)||0)));
 obj.entranceFacing=['sw','se','ne','nw'].includes(obj.entranceFacing)?obj.entranceFacing:d.entranceFacing;
 obj.markerKind=obj.type==='marker'?(TYPES.includes(obj.markerKind)?obj.markerKind:'interaction'):'';
 obj.blocking=['yes','no','auto'].includes(obj.blocking)?obj.blocking:d.blocking;
 obj.notes=text(obj.notes||'');
 if(obj.type==='marker'){obj.rotation=0;obj.scale=1;obj.collision=false;}
 if(obj.blocking==='yes')obj.collision=true;
 if(obj.blocking==='no')obj.collision=false;
 return obj;
}
function enrich(map,catalog,style){
 const doc=clone(map);
 doc.format='virtual-life-world-builder-v1';
 doc.version=6;
 doc.schema='virtual-life-ai-map-v3';
 doc.map={...doc.map,projection:{type:'iso-2:1',tilePixels:[64,32],characterFramePixels:[64,112],characterPivotPixels:[32,100],
  groundCoordinates:'c/r',heightAxis:'y',directions:['sw','se','ne','nw']},
  unbounded:true,terrainRendering:'camera-windowed',logicStatus:'authoring-only',
  exportsInclude:['terrain','roadTopology','sidewalk','water','buildings','props','vegetation','actors','markers','interactions','entrances','footprints']};
 if(g.VLMapTerrain){
  const t=g.VLMapTerrain.normalize(doc.map.terrain||g.VLMapTerrain.seeded(doc.map.worldBounds,doc.map.road),doc.map.unbounded?null:doc.map.worldBounds);
  t.cells=g.VLMapTerrain.exported(t).map(cell=>({
   ...cell,walkable:!['water','road'].includes(cell.type),driveable:cell.type==='road',
   buildable:['grass','soil','plaza'].includes(cell.type)
  }));
  doc.map.terrain=t;
 }
 doc.objects=doc.objects.map(o=>{
  normalize(o,catalog,style);
  const spec=o.type==='sprite'?catalog.get(o.asset):null;
  o.assetSource=o.type==='sprite'?(spec?.source||'unknown'):o.type==='marker'?'editor-marker':o.type==='building'||o.type==='shop'?'builder-placeholder':o.type==='avatar'||o.type==='npc'?'virtual-life-v6b':'editor-tool';
  o.assetPublished=o.type==='sprite'?spec?.source==='gpt-original'||spec?.published===true:o.type==='building'||o.type==='shop'?false:!['tree','bench','lamp','box'].includes(o.type);
  const fp=style.footprint(o,catalog);
  o.footprint={w:Math.round(fp[0]*100)/100,d:Math.round(fp[1]*100)/100};
  o.interactionHooks=o.interactions.map(name=>({id:slug(name),kind:'proposed',enabled:false}));
  if(o.entranceFacing)o.entrance={facing:o.entranceFacing,localOffset:{c:0,r:o.footprint.d/2}};
  else delete o.entrance;
  return o;
 });
 return doc;
}
function validate(map,catalog,style){
 const errors=[];
 if(!Array.isArray(map?.objects)){errors.push('Missing objects array');return errors;}
 if(map.map?.terrain&&(!Array.isArray(map.map.terrain.cells)||map.map.terrain.cells.length>12000))errors.push('Invalid terrain tiles');
 const seen=new Set();
 for(const o of map.objects){
  if(!o.id||seen.has(o.id))errors.push('Duplicate/missing ID '+o.id);
  seen.add(o.id);
  if(!Number.isFinite(o.x)||!Number.isFinite(o.z))errors.push('Invalid position '+o.id);
  if(o.type==='sprite'&&!catalog.has(o.asset))errors.push('Unknown asset '+o.id);
  if(o.type==='marker'&&!TYPES.includes(o.markerKind))errors.push('Unknown marker '+o.id);
 }
 return errors;
}
g.VLMapSchema=Object.freeze({normalize,enrich,validate,defaults,markerTypes:TYPES,layers:LAYERS});
})(window);

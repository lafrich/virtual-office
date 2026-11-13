/* Semesta · non-destructive vertical placement (authoring only).
 * World Y is actual elevation; editor level is a 3.2 world-unit authoring grid.
 * The ground stays at zero. Surfaces are snapped once, not parented.
 */
(function(g){
'use strict';
const STEP=3.2, MIN_Y=-20, MAX_Y=45, MAX_LEVEL=12, EPS=.025;
const finite=(n,otherwise=0)=>Number.isFinite(Number(n))?Number(n):otherwise;
const clamp=(n,min=MIN_Y,max=MAX_Y)=>Math.max(min,Math.min(max,finite(n)));
const round=n=>Math.round(n*100)/100;
const movingType=t=>['vehicle','pedestrian','crowd','quest_npc'].includes(t);
const levelHeight=level=>round(Math.min(MAX_LEVEL,Math.max(0,Math.floor(finite(level))))*STEP);
function physicalHeight(o,catalog,style){
 if(!o)return 0;
 const kind=style.category(o,catalog);
 const spec=o.type==='sprite'?catalog?.get(o.asset):null;
 const scale=Math.max(.1,finite(o.scale,1));
 let h;
 if(kind==='building')h=finite(o.h??spec?.physicalHeight??spec?.height??o.height,STEP);
 else if(kind==='table')h=1.25;
 else if(kind==='bench')h=.75;
 else if(o.type==='box'||kind==='trash')h=1;
 else if(kind==='actor')h=1.8;
 else if(kind==='tree')h=finite(spec?.height??o.height,5);
 else if(kind==='lamp')h=4;
 else if(kind==='vehicle')h=2.2;
 else h=finite(o.h??spec?.physicalHeight??spec?.height??o.height,1.5);
 return Math.max(.2,Math.min(80,h*scale));
}
function top(o,catalog,style){
 return round(finite(o.y)+physicalHeight(o,catalog,style));
}
function supports(o,catalog,style){
 if(!o||o.type==='marker'||movingType(o.type))return false;
 const kind=style.category(o,catalog);
 return kind==='building'||kind==='table'||o.type==='box'||
  /(?:platform|rooftop|roof|meja|table|shelf|rak|panggung)/i.test(String(o.subtype||''));
}
function verticalOverlap(a,b,catalog,style){
 const ay=finite(a.y),by=finite(b.y);
 return ay<by+physicalHeight(b,catalog,style)-EPS &&
        ay+physicalHeight(a,catalog,style)>by+EPS;
}
function pointOnPlane(ray,height){
 const dy=finite(ray?.direction?.y);
 if(Math.abs(dy)<.00001)return null;
 const y=clamp(height);
 const distance=(y-finite(ray.origin.y))/dy;
 if(distance<0)return null;
 return {x:ray.origin.x+ray.direction.x*distance,
         z:ray.origin.z+ray.direction.z*distance,
         y,distance};
}
function insideFootprint(point,o,catalog,style){
 const [w,d]=style.footprint(o,catalog);
 return Math.abs(point.x-finite(o.x))<=w/2+.00001 &&
        Math.abs(point.z-finite(o.z))<=d/2+.00001;
}
function surfaceAtRay(ray,objects,catalog,style,ignoreId){
 let chosen=null;
 for(const o of objects||[]){
  if(o.id===ignoreId||!supports(o,catalog,style))continue;
  const surfaceY=top(o,catalog,style);
  if(surfaceY<MIN_Y||surfaceY>MAX_Y)continue;
  const hit=pointOnPlane(ray,surfaceY);
  if(!hit||!insideFootprint(hit,o,catalog,style))continue;
  if(!chosen||hit.distance<chosen.distance)chosen={...hit,supportId:o.id};
 }
 const ground=pointOnPlane(ray,0);
 if(ground&&(!chosen||ground.distance<chosen.distance))return {...ground,supportId:null};
 return chosen||ground;
}
function surfaceBelow(x,z,objects,catalog,style,ignoreId){
 const point={x:finite(x),z:finite(z)};
 let chosen={y:0,supportId:null};
 for(const o of objects||[]){
  if(o.id===ignoreId||!supports(o,catalog,style)||!insideFootprint(point,o,catalog,style))continue;
  const surfaceY=top(o,catalog,style);
  if(surfaceY<=MAX_Y&&surfaceY>chosen.y)chosen={y:surfaceY,supportId:o.id};
 }
 return chosen;
}
function selection(o){
 if(!o||Math.abs(finite(o.y))<EPS)return 'land';
 if(o.elevationMode==='surface')return 'surface';
 if(o.elevationMode==='level'){
  const n=Math.round(finite(o.elevationLevel,finite(o.y)/STEP));
  if(n>=1&&n<=MAX_LEVEL&&Math.abs(finite(o.y)-levelHeight(n))<EPS)return 'level:'+n;
 }
 return 'custom';
}
function desiredHeight(value,customY=0){
 if(/^level:\d+$/.test(String(value)))return levelHeight(Number(String(value).slice(6)));
 return value==='land'?0:clamp(customY);
}
function apply(o,value,customY,objects,catalog,style,point){
 if(movingType(o.type)){
  o.y=0;o.elevationMode='land';o.elevationLevel=0;return o;
 }
 if(value==='surface'){
  const candidate=point&&Number.isFinite(Number(point.y))?
   {y:clamp(point.y),supportId:point.supportId||null}:
   surfaceBelow(o.x,o.z,objects,catalog,style,o.id);
  o.y=candidate.y;
  o.elevationMode=candidate.supportId?'surface':'land';
  o.elevationLevel=0;
 }else if(/^level:\d+$/.test(String(value))){
  o.elevationLevel=Math.max(0,Math.min(MAX_LEVEL,Number(String(value).slice(6))));
  o.y=levelHeight(o.elevationLevel);
  o.elevationMode='level';
 }else{
  o.y=desiredHeight(value,customY);
  o.elevationMode=value==='land'?'land':'custom';
  o.elevationLevel=0;
 }
 return o;
}
g.VLSemestaElevation=Object.freeze({
 STEP,MIN_Y,MAX_Y,MAX_LEVEL,levelHeight,physicalHeight,top,supports,
 verticalOverlap,pointOnPlane,surfaceAtRay,surfaceBelow,selection,desiredHeight,apply,movingType
});
})(window);

/* Semesta Vehicle Visual Placement
 * Visual sprite tuning only. Offsets do not steer vehicles or alter
 * street occupancy, collision, queue length or authored spawn coordinates.
 */
(function(g){
'use strict';
const SCALE_MIN=.45,SCALE_MAX=2.5,OFFSET_MIN=-3,OFFSET_MAX=3;
const finite=(v,fallback)=>v===null||v===undefined||v===''?fallback:
  (Number.isFinite(Number(v))?Number(v):fallback);
const bounded=(v,lo,hi,fallback)=>Math.round(
 Math.max(lo,Math.min(hi,finite(v,fallback)))*100)/100;
function scale(v){return bounded(v,SCALE_MIN,SCALE_MAX,1);}
function offset(v){
 const d=v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 return {x:bounded(d.x,OFFSET_MIN,OFFSET_MAX,0),
  y:bounded(d.y,OFFSET_MIN,OFFSET_MAX,0),
  z:bounded(d.z,OFFSET_MIN,OFFSET_MAX,0)};
}
function normalize(record){
 if(!record||record.type!=='vehicle')return record;
 record.scale=scale(record.scale);
 record.visualOffset=offset(record.visualOffset);
 return record;
}
function apply(group,record){
 if(!group||!group.position)return;
 const v=offset(record?.visualOffset),s=scale(record?.scale);
 // Root.scale is used for sprite size. Compensate so offsets remain in
 // world tile units and the ground-pivot correction is never overwritten.
 group.position.set(v.x/s,v.y/s,v.z/s);
}
g.VLSemestaVehiclePlacement=Object.freeze({
 SCALE_MIN,SCALE_MAX,OFFSET_MIN,OFFSET_MAX,scale,offset,normalize,apply
});
})(window);

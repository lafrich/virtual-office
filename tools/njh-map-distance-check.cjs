#!/usr/bin/env node
'use strict';
/* NJH core-point distance check (slice 'Hobo -> Punya Kos').
 * Rule: map.maxCoreDistanceTiles (content/balancing.json, 30), straight-line (Euclidean) tiles,
 * same metric and point sources as docs/NJH-MAP-DISTANCE-BRIEF.md (New Bot, 22 Nov 2026).
 * Points come from world-builder/njh-map-preview/njh-map-meta.json:
 *   tenda        interactables[njh_tenda_hobo].usePoint
 *   wc           doors[njh_door_wc_umum].usePoint   (WC / Mandi Umum: one building, one door)
 *   warteg       the Warteg door usePoint: doors[] entry on objectId jakarta-v3-18446 (live meta id
 *                njh_door_warung_makan; the runtime opens the official njh_warteg_kharisma room) or a door
 *                with id njh_warteg_kharisma / njh_door_warteg_kharisma if the meta is renamed later
 *   pak_ogah     interactables[njh_pak_ogah].usePoint
 *   parkir       interactables[njh_kang_parkir].usePoint
 *   loak         doors[njh_door_loak].usePoint
 *   dermaga      interactables[njh_dermaga_mancing].usePoint
 *   spot_mancing gameplaySites.fishing_spot.usePoint
 *   pasar_ikan   interactables[njh_pasar_ikan].usePoint
 *   siomay       interactables[njh_siomay_batagor].usePoint
 *   kost         homes[0].homeSpawn (= doors[njh_door_kos_cove_lobby].usePoint)
 *   silver       interactables[njh_manusia_silver].usePoint   (extra, asked by Ellen's task; not in the brief)
 * CLI: node tools/njh-map-distance-check.cjs [meta.json] [--json] [--brief-only]
 * Exit 1 when any pair is over the limit.
 */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const args=process.argv.slice(2);
const metaPath=args.find(a=>!a.startsWith('--'))||path.join(ROOT,'world-builder/njh-map-preview/njh-map-meta.json');
// Limit: map.maxCoreDistanceTiles in content/balancing.json (balancing package) when present,
// else the brief's value (30). Live main has no content/balancing.json yet.
let limit=30,limitSource='default (brief: map.maxCoreDistanceTiles = 30)';
try{
 const bal=JSON.parse(fs.readFileSync(path.join(ROOT,'content/balancing.json'),'utf8'));
 const p=(bal.params||[]).find(x=>x.key==='map.maxCoreDistanceTiles');
 if(p&&Number.isFinite(Number(p.value))){limit=Number(p.value);limitSource='content/balancing.json';}
}catch(e){}
const WARTEG_DOOR_IDS=['njh_warteg_kharisma','njh_door_warteg_kharisma','njh_door_warung_makan'];
const WARTEG_OBJECT='jakarta-v3-18446';
function wartegDoor(meta){
 const ds=meta.doors||[];
 const d=WARTEG_DOOR_IDS.map(id=>ds.find(x=>x.doorId===id)).find(Boolean)||ds.find(x=>x.objectId===WARTEG_OBJECT);
 if(!d||!Array.isArray(d.usePoint))throw new Error('missing Warteg door');
 return d;
}
function points(meta,{briefOnly=false}={}){
 const it=id=>{const x=(meta.interactables||[]).find(i=>i.id===id);if(!x||!Array.isArray(x.usePoint))throw new Error('missing interactable '+id);return x.usePoint;};
 const door=id=>{const x=(meta.doors||[]).find(d=>d.doorId===id);if(!x||!Array.isArray(x.usePoint))throw new Error('missing door '+id);return x.usePoint;};
 const P={
  tenda:it('njh_tenda_hobo'),wc:door('njh_door_wc_umum'),warteg:wartegDoor(meta).usePoint,
  pak_ogah:it('njh_pak_ogah'),parkir:it('njh_kang_parkir'),loak:door('njh_door_loak'),
  dermaga:it('njh_dermaga_mancing'),spot_mancing:meta.gameplaySites.fishing_spot.usePoint,
  pasar_ikan:it('njh_pasar_ikan'),siomay:it('njh_siomay_batagor'),kost:meta.homes[0].homeSpawn
 };
 if(!briefOnly)P.silver=it('njh_manusia_silver');
 const out={};for(const [k,v] of Object.entries(P))out[k]={x:Number(v[0]),z:Number(v[1])};
 return out;
}
function pairs(P){
 const ks=Object.keys(P),out=[];
 for(let i=0;i<ks.length;i++)for(let j=i+1;j<ks.length;j++){
  const a=P[ks[i]],b=P[ks[j]];
  out.push({a:ks[i],b:ks[j],euclidean:Math.round(Math.hypot(a.x-b.x,a.z-b.z)*100)/100,manhattan:Math.round((Math.abs(a.x-b.x)+Math.abs(a.z-b.z))*100)/100});
 }
 return out.sort((p,q)=>q.euclidean-p.euclidean);
}
function report(meta,opts={}){
 const P=points(meta,opts),pr=pairs(P);
 return {limit,limitSource,points:P,pairs:pr,over:pr.filter(p=>p.euclidean>limit),max:pr[0]};
}
module.exports={points,pairs,report,wartegDoor,limit};
if(require.main===module){
 const meta=JSON.parse(fs.readFileSync(metaPath,'utf8'));
 const r=report(meta,{briefOnly:args.includes('--brief-only')});
 if(args.includes('--json')){console.log(JSON.stringify(r,null,1));}
 else{
  const ks=Object.keys(r.points);
  console.log('meta',path.relative(process.cwd(),metaPath),'limit',r.limit,'tiles (Euclidean;',r.limitSource+')');
  for(const k of ks)console.log('  '+k.padEnd(13),r.points[k].x,r.points[k].z);
  const d=(a,b)=>Math.hypot(r.points[a].x-r.points[b].x,r.points[a].z-r.points[b].z);
  console.log('\n'+''.padEnd(13)+ks.map(k=>k.slice(0,7).padStart(8)).join(''));
  for(const a of ks)console.log(a.padEnd(13)+ks.map(b=>{if(a===b)return '      - ';const v=d(a,b);return (v>r.limit?'*':' ')+v.toFixed(1).padStart(7);}).join(''));
  console.log('\nmax',r.max.a+'-'+r.max.b,r.max.euclidean,'| pairs over',r.limit+':',r.over.length);
  for(const p of r.over)console.log('  OVER',p.a,p.b,p.euclidean);
 }
 process.exit(r.over.length?1:0);
}

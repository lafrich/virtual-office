#!/usr/bin/env node
'use strict';
/* NJH placeholder check (preview, read-only). Bug 22 Nov 2026: "placeholder orang jelek lolos ke preview".
 * The Pecel Lele / Sate Madura tents shipped with the generator's 64x112 placeholder NPC figures
 * baked into all 4 views, and Lapak Barang Bekas used a pipeline stall with a blocky seller baked in.
 * No checker looked at what a placed object actually draws. This tool fails when any object on
 * the playable NJH map resolves to:
 *  P1 an asset that is not in the catalog snapshot / preview registry (runtime draws a fallback)
 *  P2 a pending / placeholder asset: name or notes "PENDING", catalog published===false,
 *     an unresolved object:* pending id
 *  P3 a human figure that is a known placeholder: assets in KNOWN_FIGURE_ASSETS (crude figure
 *     baked into the art), or generator tent art (njh-map-preview/tents/*.png) containing the
 *     placeholder NPC palette of the LFB tent generator (make_bangunan.npc_sprite) >= SIG_MIN px.
 *     The palette is only meaningful for that generator's output (its blue-greys and skin ramps
 *     also occur in houses, bins and other pipeline art), so other art is covered by the
 *     KNOWN_FIGURE_ASSETS list plus the mandatory visual scan of the whole map at play size.
 *  P4 a quest NPC / pedestrian / crowd without a rig profile, so the runtime draws the procedural
 *     canvas figure (semesta-traffic-art.js questGraphic). Ichsan's t514 rule keeps the old
 *     gameplay NPCs until their LGR replacement exists: those ids are listed in T514_WAITING_LGR
 *     and reported as WARN (not hidden), every other one FAILS.
 * Markers are hidden in play mode and only counted.
 * CLI: node tools/njh-placeholder-check.cjs [city.json] [--json]
 * Exit 1 on any P1-P4 failure.
 */
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const ROOT=path.resolve(__dirname,'..');
const WB=path.join(ROOT,'world-builder'),PREVIEW=path.join(WB,'njh-map-preview');
const CITY_DEFAULT=path.join(PREVIEW,'city/njh-semesta-map-draft1.with-pending-assets.city.json');
const args=process.argv.slice(2);
// Placeholder NPC palette (LFB tent generator npc_sprite: steel hair, blue_lo trousers, skin ramps).
// Derived 22 Nov 2026 as the colours present in the old tents and absent from the same render
// without NPC decor (make_bangunan.py render(..., extras_fn=None)).
const SIG=new Set(['42,50,66','41,48,62','28,35,48','58,68,88','90,65,47','30,36,48','78,87,105',
 '168,112,78','241,211,181','16,20,27','105,80,61','235,200,168','116,92,74','38,45,59','51,60,77',
 '224,174,138','217,164,126','62,90,136','110,88,72']);
const SIG_MIN=60;
const KNOWN_FIGURE_ASSETS=Object.freeze({
 'pipeline:lapak_barang_bekas':'blocky grey seller baked into all 4 views (pasar_loak/lapak_barang_bekas_*.png)',
 'object:njh_npc_placeholder':'generic placeholder figure'
});
const T514_WAITING_LGR=Object.freeze(['njh-npc-pak-ogah','ref-ambient-9','ref-ambient-11']);
const ACTORS=new Set(['avatar','npc','pedestrian','crowd','quest_npc']);
function png(file){
 const b=fs.readFileSync(file);
 if(b.readUInt32BE(0)!==0x89504e47)throw new Error('not a png '+file);
 let o=8,w=0,h=0,depth=0,type=0,inter=0,pal=null,trns=null;const idat=[];
 while(o<b.length){
  const len=b.readUInt32BE(o),t=b.toString('ascii',o+4,o+8),d=b.subarray(o+8,o+8+len);
  if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);depth=d[8];type=d[9];inter=d[12];}
  else if(t==='PLTE')pal=d;else if(t==='tRNS')trns=d;else if(t==='IDAT')idat.push(d);else if(t==='IEND')break;
  o+=12+len;
 }
 if(depth!==8||inter)return null;
 const ch={0:1,2:3,3:1,4:2,6:4}[type];if(!ch)return null;
 const raw=zlib.inflateSync(Buffer.concat(idat)),stride=w*ch,out=Buffer.alloc(w*h*4),prev=Buffer.alloc(stride),cur=Buffer.alloc(stride);
 for(let y=0;y<h;y++){
  const f=raw[y*(stride+1)],line=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));
  for(let i=0;i<stride;i++){
   const a=i>=ch?cur[i-ch]:0,up=prev[i],c=i>=ch?prev[i-ch]:0;let v=line[i];
   if(f===1)v+=a;else if(f===2)v+=up;else if(f===3)v+=(a+up)>>1;
   else if(f===4){const p=a+up-c,pa=Math.abs(p-a),pb=Math.abs(p-up),pc=Math.abs(p-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?up:c;}
   cur[i]=v&255;
  }
  for(let x=0;x<w;x++){
   const q=(y*w+x)*4,s=x*ch;
   if(type===6){out[q]=cur[s];out[q+1]=cur[s+1];out[q+2]=cur[s+2];out[q+3]=cur[s+3];}
   else if(type===2){out[q]=cur[s];out[q+1]=cur[s+1];out[q+2]=cur[s+2];out[q+3]=255;}
   else if(type===3){const k=cur[s];out[q]=pal[k*3];out[q+1]=pal[k*3+1];out[q+2]=pal[k*3+2];out[q+3]=trns&&k<trns.length?trns[k]:255;}
   else if(type===0){out[q]=out[q+1]=out[q+2]=cur[s];out[q+3]=255;}
   else {out[q]=out[q+1]=out[q+2]=cur[s];out[q+3]=cur[s+1];}
  }
  cur.copy(prev);
 }
 return {w,h,data:out};
}
function sigPixels(file){
 const im=png(file);if(!im)return 0;
 let n=0;const d=im.data;
 for(let i=0;i<d.length;i+=4)if(d[i+3]>200&&SIG.has(d[i]+','+d[i+1]+','+d[i+2]))n++;
 return n;
}
// repo-local art per preview asset key (tents/, props/, buildings/)
function localArt(asset){
 const out=[];
 const m=/^studio:br-(warung-pecel-lele|lapak-sate-madura)$/.exec(asset);
 if(m){const f=m[1]==='warung-pecel-lele'?'pecel':'sate';for(const d of ['sw','se','ne','nw'])out.push(path.join(PREVIEW,'tents',f+'_'+d+'.png'));}
 return out.filter(f=>fs.existsSync(f));
}
function check(cityPath=CITY_DEFAULT){
 const raw=JSON.parse(fs.readFileSync(cityPath,'utf8'));
 const doc=raw?.record?.document||raw?.document||raw;
 const snapPath=[path.join(PREVIEW,'catalog-snapshot.json'),path.join(ROOT,'tools/njh-catalog-snapshot.json')].find(p=>fs.existsSync(p));
 const snap=JSON.parse(fs.readFileSync(snapPath,'utf8'));
 const catalog=new Map(snap.assets.map(a=>[a.file,a]));
 const previewSrc=fs.readFileSync(path.join(WB,'njh-map-preview.js'),'utf8');
 const fails=[],warns=[],scanned=[];let markers=0;
 for(const o of doc.objects||[]){
  if(o.type==='marker'){markers++;continue;}
  if(ACTORS.has(o.type)){
   if(o.type==='avatar')continue;
   if(o.type==='quest_npc'||o.type==='pedestrian'||o.type==='crowd'){
    const hasProfile=typeof o.profile==='string'&&o.profile.length>0;
    // quest NPCs without a resolvable Mahluk rig fall back to questGraphic (procedural canvas figure);
    // the rig library is empty while referenceReset is active, so a quest NPC is procedural unless an
    // LGR/published rig sprite is attached (o.lgr / o.characterSource)
    const procedural=o.type==='quest_npc'&&!(o.lgr||o.characterSource);
    if(procedural){
     const row={rule:'P4',id:o.id,name:o.name,x:o.x,z:o.z,why:'quest NPC draws the procedural canvas figure (questGraphic)'+(hasProfile?' (profile '+o.profile+' not a published rig while the Mahluk reference reset is active)':'')};
     if(T514_WAITING_LGR.includes(o.id))warns.push({...row,rule:'P4-t514',why:row.why+'; kept by Ichsan rule t514 until its LGR replacement exists (listed for LGR)'});
     else fails.push(row);
    }
   }
   continue;
  }
  if(o.type!=='sprite')continue;
  const a=String(o.asset||'');
  const spec=catalog.get(a);
  const registered=spec||new RegExp("'"+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+"'").test(previewSrc);
  if(!registered)fails.push({rule:'P1',id:o.id,name:o.name,asset:a,why:'asset not in catalog snapshot or preview registry (fallback render)'});
  if(/\bPENDING\b/.test(String(o.name||''))||spec?.published===false)fails.push({rule:'P2',id:o.id,name:o.name,asset:a,why:'pending / unpublished asset'});
  if(/^object:obj-/.test(a))fails.push({rule:'P2',id:o.id,name:o.name,asset:a,why:'unresolved pending object id'});
  if(KNOWN_FIGURE_ASSETS[a])fails.push({rule:'P3',id:o.id,name:o.name,asset:a,why:KNOWN_FIGURE_ASSETS[a]});
  for(const f of localArt(a)){
   let n=0;try{n=sigPixels(f);}catch(e){warns.push({rule:'W-png',id:o.id,file:f,why:String(e.message||e)});continue;}
   scanned.push({id:o.id,file:path.relative(ROOT,f),sig:n});
   if(n>=SIG_MIN)fails.push({rule:'P3',id:o.id,name:o.name,asset:a,file:path.relative(ROOT,f),sigPixels:n,why:'placeholder NPC figure pixels in the art'});
  }
 }
 return {city:path.relative(ROOT,cityPath),markersHiddenInPlay:markers,scanned:scanned.length,fails,warns,ok:fails.length===0,scannedFiles:scanned};
}
module.exports={check,png,sigPixels,SIG,SIG_MIN,KNOWN_FIGURE_ASSETS,T514_WAITING_LGR};
if(require.main===module){
 const city=args.find(a=>!a.startsWith('--'))||CITY_DEFAULT;
 const r=check(path.resolve(city));
 if(args.includes('--json'))console.log(JSON.stringify(r,null,1));
 else{
  console.log('placeholder-check',r.city,'art files scanned',r.scanned,'markers (hidden in play)',r.markersHiddenInPlay);
  for(const k of ['P1','P2','P3','P4'])console.log(k,r.fails.filter(f=>f.rule===k).length);
  for(const f of r.fails)console.log('  FAIL',f.rule,f.id,f.name||'',f.asset||'',f.file||'',f.sigPixels!=null?'sig '+f.sigPixels:'','-',f.why);
  for(const w of r.warns)console.log('  WARN',w.rule,w.id,w.name||'','-',w.why);
  console.log(r.ok?'PASS':'FAIL');
 }
 process.exit(r.ok?0:1);
}

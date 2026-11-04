/* Semesta · authored pixel-preview renderer.
 * Upstream cars and job-NPC PNGs are not published in this repository.
 * These temporary sprites are intentionally distinct from canonical assets.
 */
(function(g){
'use strict';
const cache=new Map();
const PX=Math.SQRT2/64, VCOMP=2/Math.sqrt(3);
const palette=g.VLSemestaCatalog?.palette||{};
const wheelGround=g.VLSemestaWheelGround;
// Mahluk Hidup published street sprites: real transparent PNGs are preferred
// over Semesta previews, with a safe preview fallback while source deploys.
const SOURCE=new URL('/virtual-life-asset-pipeline/assets/street_vehicles/',location.origin);
const originalCache=new Map(),missingOriginals=new Set(),pendingOriginals=new Map();
const validPath=/^(?:cars|riders)\/[a-z0-9_-]+_(?:se|sw|ne|nw)\.png$/;
// These are the true v3 Mahluk Hidup rider dimensions/pivots, not the
// 80x116 legacy placeholders. Never rescale a 54x92 rider into an 80x116 box.
const RIDER_V3={
 gojek:{size:[60,87],pivot:[30,75]},
 gojek_pax:{size:[54,92],pivot:[27,80]},
 maxim:{size:[54,87],pivot:[27,75]},
 maxim_pax:{size:[54,92],pivot:[27,80]},
 sma_triple:{size:[66,96],pivot:[33,82]}
};
const originalKey=(id,dir,frame=0)=>id+':'+dir+(frame?':'+frame:'');
function sourceURL(spec,dir,variant='v3',frame=0){
 const v3=RIDER_V3[spec?.id];
 if(v3&&variant==='v3'&&['se','sw','ne','nw'].includes(dir))
  return new URL('riders_v3/frames/'+spec.id+'_'+dir+'_f'+frame+'.png',SOURCE).href;
 const path=spec?.views?.[dir];
 return typeof path==='string'&&validPath.test(path)?new URL(path,SOURCE).href:null;
}
function sourcePublished(id){return originalCache.has(originalKey(id,'se'));}
function originalCount(){return [...new Set([...originalCache.keys()].map(k=>k.split(':')[0]))].length;}
function retrySources(){missingOriginals.clear();}
function requestOriginal(THREE,spec,dir,frame=0){
 frame=RIDER_V3[spec.id]?Math.max(0,Math.min(3,frame|0)):0;
 const key=originalKey(spec.id,dir,frame),known=originalCache.get(key);
 if(known)return Promise.resolve(known);
 if(missingOriginals.has(key))return Promise.resolve(null);
 if(pendingOriginals.has(key))return pendingOriginals.get(key);
 const v3=RIDER_V3[spec.id];
 const candidates=v3?[
  {url:sourceURL(spec,dir,'v3',frame),size:v3.size,pivot:v3.pivot},
  ...(frame===0?[{url:sourceURL(spec,dir,'legacy'),size:spec.size,pivot:spec.pivot}]:[])
 ]:[{url:sourceURL(spec,dir,'legacy'),size:spec.size,pivot:spec.pivot}];
 const task=new Promise(resolve=>{
   let index=0;
   function next(){
     const source=candidates[index++];
     if(!source){missingOriginals.add(key);resolve(null);return;}
     if(!source.url){next();return;}
     const img=new Image();img.decoding='async';
     img.onload=()=>{
       if(img.naturalWidth!==source.size[0]||img.naturalHeight!==source.size[1]){
         next();return;
       }
       const tex=new THREE.Texture(img);
       tex.userData={pivotRatio:source.pivot[1]/source.size[1]};
       tex.colorSpace=THREE.SRGBColorSpace;
       tex.minFilter=tex.magFilter=THREE.NearestFilter;
       tex.generateMipmaps=false;tex.needsUpdate=true;
       originalCache.set(key,tex);
       if(dir==='se'&&typeof g.dispatchEvent==='function'&&typeof CustomEvent!=='undefined')
         g.dispatchEvent(new CustomEvent('semesta-vehicle-source-loaded',{detail:{id:spec.id}}));
       resolve(tex);
     };
     img.onerror=next;
     img.src=source.url;
   }
   next();
 }).finally(()=>pendingOriginals.delete(key));
 pendingOriginals.set(key,task);return task;
}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function line(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(c,color,pts){c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.closePath();c.fill();}
function shade(hex,factor){const n=parseInt(String(hex).replace('#',''),16);const f=x=>Math.min(255,Math.max(0,Math.round(x*factor)));return '#'+[n>>16&255,n>>8&255,n&255].map(x=>f(x).toString(16).padStart(2,'0')).join('');}
// Exact-size motor preview for the Mahluk Hidup source while original PNGs load.
// Unlike the old two-head generic proxy, this keeps 1 / 2 / 3 riders distinct.
function riderPreview(id,face){
 const triple=id==='sma_triple',pax=id==='gojek_pax'||id==='maxim_pax';
 const w=triple?88:80,h=triple?120:116;
 const c=canvas(w,h),q=c.getContext('2d');q.imageSmoothingEnabled=false;
 const green=id.startsWith('gojek'),yellow=id.startsWith('maxim');
 const bike=triple?'#4664bd':green?'#299661':'#e2b645';
 if(face==='ne'||face==='nw'){q.translate(w,0);q.scale(-1,1);}
 // Opaque pixel silhouette and flat translucent contact, never blurry shadow.
 line(q,'#18243136',12,h-11,w-23,3);
 for(const x of [21,w-19]){
  q.fillStyle='#222d3c';q.beginPath();q.arc(x,h-21,9,0,Math.PI*2);q.fill();
  q.fillStyle='#b3bbc4';q.beginPath();q.arc(x,h-21,4,0,Math.PI*2);q.fill();
 }
 poly(q,'#253444',[[15,h-31],[29,h-50],[w-22,h-50],[w-12,h-29],[w-29,h-21],[29,h-24]]);
 poly(q,shade(bike,.72),[[21,h-46],[43,h-55],[w-19,h-49],[w-18,h-35],[40,h-30],[23,h-35]]);
 poly(q,bike,[[24,h-46],[46,h-57],[w-19,h-50],[w-27,h-41],[39,h-37]]);
 line(q,'#202d38',w-20,h-78,4,25);line(q,'#202d38',w-25,h-79,15,4);
 line(q,'#28323b',27,h-58,w-48,5);
 const riders=triple?[
  {x:21,y:39,coat:'#e0e5ec',helmet:'#e8ebf0'},
  {x:42,y:34,coat:'#a8b7c9',helmet:'#273c51'},
  {x:62,y:29,coat:'#e2e7ef',helmet:'#f0f1f4'}
 ]:pax?[
  {x:36,y:38,coat:green?'#7894aa':'#a34e57',helmet:green?'#2eb45d':'#edc94f'},
  {x:60,y:31,coat:green?'#2eb45d':'#d4b43e',helmet:green?'#37ca67':'#eac94f'}
 ]:[{x:58,y:31,coat:green?'#2eb45d':'#d4b43e',helmet:green?'#37ca67':'#eac94f'}];
 // Rear silhouettes are drawn first, then the driver. Heads remain separated.
 for(const rider of riders){
  const x=rider.x,y=rider.y;
  poly(q,shade(rider.coat,.69),[[x-8,y+14],[x+4,y+12],[x+10,y+23],[x+7,y+43],[x-10,y+43],[x-11,y+26]]);
  line(q,rider.coat,x-6,y+17,11,22);
  line(q,'#2d3b48',x-7,y+39,5,19);line(q,'#2d3b48',x+1,y+39,5,19);
  q.fillStyle='#c89578';q.beginPath();q.arc(x,y+5,7,0,Math.PI*2);q.fill();
  poly(q,shade(rider.helmet,.80),[[x-8,y+3],[x-7,y-3],[x-2,y-7],[x+5,y-6],[x+8,y],[x+8,y+3]]);
  line(q,shade(rider.helmet,.65),x-3,y+1,12,3);
  line(q,rider.coat,x+6,y+22,6,5);
 }
 if(green&&!pax){line(q,'#d54d47',20,h-72,11,24);line(q,'#e57c64',20,h-72,11,4);}
 return c;
}
function vehicleCanvas(id,face='se'){
 if(/^(?:gojek|gojek_pax|maxim|maxim_pax|sma_triple)$/.test(id))return riderPreview(id,face);
 const src=canvas(160,108),q=src.getContext('2d');q.imageSmoothingEnabled=false;
 const bus=id.includes('bus'),motor=/gojek|maxim|sma/.test(id);
 const color=palette[id]||'#8d9fae';
 // Pixel art is horizontally reflected for opposite cardinal direction.
 if(face==='nw'||face==='ne'){q.translate(160,0);q.scale(-1,1);}
 // Vehicle sprites do not draw their own shadows: the simplified world
 // contact-shadow pass is for characters/NPCs only.
 if(motor){
  // Two-wheel scooter + rider; keep deliberately simplified as a draft.
  poly(q,'#2a3947',[[46,77],[106,74],[111,84],[82,91],[54,87]]);
  for(const x of [52,102]){
   q.fillStyle='#273039';q.beginPath();q.arc(x,88,10,0,Math.PI*2);q.fill();
   q.fillStyle='#b1b7bb';q.beginPath();q.arc(x,88,4,0,Math.PI*2);q.fill();
  }
  poly(q,shade(color,.75),[[57,72],[77,61],[103,61],[98,76],[72,84]]);
  poly(q,shade(color,1.05),[[62,70],[80,62],[92,63],[84,74]]);
  line(q,'#252c39',98,46,5,19);line(q,'#252c39',95,46,13,4);
  const jacket=shade(color,1.05);
  poly(q,jacket,[[64,41],[77,36],[88,42],[87,64],[68,68]]);
  line(q,'#333a45',67,64,9,17);line(q,'#333a45',80,64,9,17);
  q.fillStyle='#c49b79';q.beginPath();q.ellipse(77,31,10,11,0,0,Math.PI*2);q.fill();
  poly(q,shade(color,.72),[[65,26],[73,19],[84,20],[89,28],[87,31],[64,30]]);
  line(q,'#263341',65,31,25,3);
  line(q,jacket,83,47,20,7);
  if(id.includes('pax')||id==='sma_triple'){
   line(q,'#bd9986',49,37,15,20);line(q,'#bd9986',47,34,17,4);
   q.fillStyle='#d4a88a';q.beginPath();q.arc(54,31,8,0,Math.PI*2);q.fill();
  }
 }else{
  const minX=bus?10:26,maxX=bus?150:134,lowY=bus?76:81,roofY=bus?29:47;
  // Four dark wheels, approximate 3/4 ISO view.
  for(const [x,y] of [[minX+26,83],[maxX-28,87]]){
   q.fillStyle='#27323c';q.beginPath();q.ellipse(x,y,11,13,0,0,Math.PI*2);q.fill();
   q.fillStyle='#96a1ab';q.beginPath();q.ellipse(x,y,5,7,0,0,Math.PI*2);q.fill();
  }
  poly(q,shade(color,.73),[[minX,69],[minX+19,48],[maxX-8,49],[maxX,67],[maxX-6,84],[minX+20,87]]);
  poly(q,color,[[minX,69],[minX+18,73],[maxX,70],[maxX-10,54],[minX+19,53]]);
  poly(q,shade(color,1.11),[[minX+15,52],[minX+36,roofY],[maxX-35,roofY],
    [maxX-10,54],[maxX-42,59],[minX+19,62]]);
  poly(q,'#41657b',[[minX+34,roofY+5],[maxX-39,roofY+5],[maxX-21,54],[minX+21,57]]);
  if(bus){
   for(let k=0;k<6;k++){
    line(q,'#d7e0ea',minX+34+k*16,roofY+5,3,17);
    line(q,'#2c547b',minX+37+k*16,roofY+5,11,18);
   }
   line(q,'#eee7e0',minX+5,66,maxX-minX-9,6);
   line(q,'#2d3d4a',minX+10,71,60,3);
  }else{
   line(q,'#ebf1ed',minX+7,70,11,4);
   line(q,'#d54f47',maxX-12,66,6,4);
  }
  if(id==='taxi_bluebird')line(q,'#e2edee',75,43,17,5);
 }
 const final=canvas(160,108),ctx=final.getContext('2d');ctx.imageSmoothingEnabled=false;
 ctx.drawImage(src,0,0);
 return final;
}
/* The Asset Library must display the exact SAME pixels as vehicleGraphic.
 * Prefer the actual source texture if placement has loaded it; otherwise use
 * the same authored fallback canvas (never synthesize a second vehicle art).
 * Crop transparent padding only for the UI, not for gameplay ground/pivots.
 */
const vehiclePreviewCache=new Map();
function trimPreview(source){
 const w=source.width,h=source.height;
 const q=source.getContext('2d',{willReadFrequently:true});
 const data=q.getImageData(0,0,w,h).data;
 let x0=w,y0=h,x1=-1,y1=-1;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(data[(y*w+x)*4+3]<12)continue;
  if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
 }
 if(x1<x0||y1<y0)return null;
 const p=3;
 x0=Math.max(0,x0-p);y0=Math.max(0,y0-p);
 x1=Math.min(w-1,x1+p);y1=Math.min(h-1,y1+p);
 const out=canvas(x1-x0+1,y1-y0+1);
 const c=out.getContext('2d');c.imageSmoothingEnabled=false;
 c.drawImage(source,x0,y0,out.width,out.height,0,0,out.width,out.height);
 return out.toDataURL('image/png');
}
function vehiclePreview(id,dir='se'){
 const side=['se','sw','ne','nw'].includes(dir)?dir:'se';
 const original=originalCache.get(originalKey(id,side,0));
 const image=original?.image;
 if(image?.naturalWidth>0&&image?.naturalHeight>0&&image.src)return image.src;
 const key=id+':'+side;
 if(vehiclePreviewCache.has(key))return vehiclePreviewCache.get(key);
 let url=null;
 try{url=trimPreview(vehicleCanvas(id,side));}catch{}
 if(url)vehiclePreviewCache.set(key,url);
 return url;
}

function texture(THREE,id,dir){
 const key=id+':'+dir;
 if(cache.has(key))return cache.get(key);
 const c=vehicleCanvas(id,dir);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
 cache.set(key,tex);return tex;
}
function vehicleGraphic(THREE,record){
 const spec=g.VLSemestaCatalog.vehicle(record.vehicleId)||g.VLSemestaCatalog.vehicles[0];
 const scale=record.scale||1;
 const visualScale=Number(spec.editorArtScale)||1;
 const editorFootprint=spec.editorFootprint||spec.footprint||[2.9,1];
 const w=Math.max(.7,Math.min(spec.size[0]*PX*visualScale,editorFootprint[0]*.95));
 // Alpha-56 artwork shadow must never write depth or sink into road.
 // Native tyres stay opaque and depth-test against actual 3D objects.
 const mat=new THREE.MeshBasicMaterial({map:texture(THREE,spec.id,'se'),transparent:false,
  alphaTest:.55,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
 // IMPORTANT: preview image dimensions are 160×108, while the original
 // Vehicle Pipeline images are often 146×138 or 272×256. Reusing the source
 // sheet's plane height for the preview distorted cars and planted their
 // lower pixels below asphalt. Compute the actual plane from the active art.
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,1),mat);
 const sourcePivot=spec.pivot[1]/spec.size[1];
 function setGroundPivot(original=false){
  const image=mat.map?.image;
  const imageWidth=Number(image?.naturalWidth||image?.width)||160;
  const imageHeight=Number(image?.naturalHeight||image?.height)||108;
  // Frame proportions follow the ACTUAL image, not the unrelated source
  // atlas dimensions. Footprint/traffic/route scale remain untouched.
  let height=w*(imageHeight/imageWidth)*VCOMP;
  if(spec.group==='motor'&&!original)height=Math.max(1.45,height);
  // Pipeline pivot is the FLOOR FOOTPRINT CENTRE and may have visible
  // near-side wheels beneath it. Ground the true opaque tyre silhouette,
  // for BOTH canvas previews and loaded HTMLImageElements.
  const fallback=original===true?(mat.map?.userData?.pivotRatio??sourcePivot):
   (original==='fitted'?sourcePivot:.935);
  const contact=wheelGround?.contact(image,fallback)||
   {ratio:fallback,row:null,source:'authored-fallback'};
  if(mesh.geometry)mesh.geometry.dispose();
  mesh.geometry=new THREE.PlaneGeometry(w,height);
  mesh.position.y=wheelGround?.pivotHeight(height,contact.ratio)??height*(contact.ratio-.5)+.027;
  mesh.userData.groundClearance=wheelGround?.GROUND_CLEARANCE??.027;
  mesh.userData.sourcePivotUsed=original===true;
  mesh.userData.effectiveImageSize=[imageWidth,imageHeight];
  mesh.userData.groundPivot=contact.ratio;
  mesh.userData.groundContactSource=contact.source;
  mesh.userData.groundContactRow=contact.row;
 }
 setGroundPivot(false);
 mesh.userData.semestaVehicle=true;mesh.userData.assetPublished=false;
 mesh.userData.catalogId=spec.id;
 let direction='se',displayedFrame=0,disposed=false;
 const allowOriginal=!record.assetPath;
 function show(dir,frame=0){
   frame=RIDER_V3[spec.id]?frame:0;
   displayedFrame=frame;
   const key=originalKey(spec.id,dir,frame);
   const baseKey=originalKey(spec.id,dir,0);
   const base=allowOriginal&&originalCache.get(baseKey);
   const ready=allowOriginal&&(originalCache.get(key)||base);
   mat.map=ready||texture(THREE,spec.id,dir);mat.needsUpdate=true;
   setGroundPivot(!!ready);
   mesh.userData.assetPublished=!!ready;
   if(!ready&&allowOriginal&&frame>0){
     requestOriginal(THREE,spec,dir,0).then(actual=>{
       if(disposed||direction!==dir||displayedFrame!==frame||!actual)return;
       mat.map=actual;mat.needsUpdate=true;mesh.userData.assetPublished=true;
       setGroundPivot(true);
     });
   }
   if(allowOriginal && !originalCache.has(key))requestOriginal(THREE,spec,dir,frame).then(actual=>{
     if(disposed||direction!==dir||displayedFrame!==frame||!actual)return;
     mat.map=actual;mat.needsUpdate=true;mesh.userData.assetPublished=true;
     setGroundPivot(true);
   });
 }
 show('se');
 return {mesh,setGroundPivot,update(dir,camera,root){
   if(!spec.views?.[dir])dir='se';
   // Four real Mahluk Hidup rider frames cycle every 120ms; cars stay static.
   const frame=RIDER_V3[spec.id]?Math.floor(Date.now()/120)%4:0;
   if(dir!==direction||frame!==displayedFrame){direction=dir;show(dir,frame);}
   if(camera)mesh.rotation.y=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z)-root.rotation.y;
 },dispose(){disposed=true;mat.dispose();mesh.geometry.dispose();}};
}
const jobColor={
 manusia_silver:['#aeb9c8','#e0e5ec','#8d9aaa','#9e8062'],
 pak_ogah:['#af8465','#d1a58b','#f8eacb','#d6a752'],
 kang_parkir:['#b88b70','#d5a28b','#ee9a40','#263442'],
 babeh_pemilik:['#c89a79','#e6bb9a','#f6efe2','#35646b'],
 babeh_jam:['#ba876c','#e5b395','#6c936b','#a99876'],
 babeh_tas:['#9c735e','#cb997f','#be655b','#343c46']
};
function questDraw(ctx,role,phase,action){
 const skin=(jobColor[role]||jobColor.pak_ogah);
 const [base,high,shirt,pants]=skin;
 ctx.clearRect(0,0,64,112);ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#15213136';ctx.beginPath();ctx.ellipse(32,101,13,3,0,0,Math.PI*2);ctx.fill();
 const bob=action==='statue'?0:(phase===1?-1:phase===3?1:0),head=25+bob;
 // Feet and torso preserve v6b 64x112 bounding frame and pivot.
 line(ctx,shade(pants,.70),25,77+bob,6,20);line(ctx,shade(pants,.75),34,77+bob,6,20);
 line(ctx,'#30343a',23,96+bob,10,4);line(ctx,'#30343a',33,96+bob,11,4);
 line(ctx,shade(shirt,.7),21,45+bob,22,36);
 line(ctx,shirt,24,47+bob,17,31);
 if(role==='manusia_silver'){line(ctx,'#7c899d',22,72+bob,21,9);line(ctx,shade(high,.84),25,49+bob,15,14);}
 const lift=(action==='wave'&&phase%4===1)||action==='statue'?14:2;
 line(ctx,skin[0],15,49+bob-lift/2,6,24);
 line(ctx,skin[1],43,49+bob-lift/2,6,24);
 if(action==='offer'||action==='whistle'){
   line(ctx,base,44,53+bob,10,6);
   if(action==='offer'&&phase%4>=2)line(ctx,'#dac46c',50,49+bob,8,5);
 }
 if(action==='wave'&&phase%4!==0){
  line(ctx,high,48,38+bob,5,20);line(ctx,high,44,35+bob,12,5);
  if(role==='pak_ogah')line(ctx,'#dfb545',54,27+bob,4,14);
 }
 ctx.fillStyle=base;ctx.beginPath();ctx.ellipse(32,head+6,12,14,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=high;ctx.beginPath();ctx.ellipse(29,head+3,7,8,0,0,Math.PI*2);ctx.fill();
 line(ctx,'#30323a',27,30+bob,3,2);line(ctx,'#30323a',36,30+bob,3,2);
 if(role==='pak_ogah'){
   line(ctx,'#e8e4d8',19,16+bob,26,8);line(ctx,'#c9d0d3',23,12+bob,18,8);
 }else if(role==='kang_parkir'){
   line(ctx,'#2f363f',20,16+bob,24,7);line(ctx,'#f8f2dc',20,52+bob,24,4);
   line(ctx,'#4e4d45',30,53+bob,3,7);
 }else if(role.startsWith('babeh_')){
   line(ctx,'#2a3545',20,17+bob,24,7);
   if(role==='babeh_tas')line(ctx,'#9a7562',20,17+bob,24,3);
 }else if(role==='manusia_silver'){
   line(ctx,'#c5d3df',22,14+bob,19,6);
 }
}
const questPreviewCache=new Map();
function questPreview(role){
 if(questPreviewCache.has(role))return questPreviewCache.get(role);
 const c=canvas(64,112),ctx=c.getContext('2d');
 questDraw(ctx,role,0,'idle');
 const url=trimPreview(c);
 if(url)questPreviewCache.set(role,url);
 return url;
}

function questGraphic(THREE,record){
 const role=g.VLSemestaCatalog.quest(record.questId)?.id||'pak_ogah';
 const c=canvas(64,112),ctx=c.getContext('2d');
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
 const w=Math.SQRT2,h=112*PX*VCOMP;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:false,alphaTest:.16,depthWrite:true,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
 mesh.position.y=h*(100/112-.5);
 let time=0,prev=-1;
 return {mesh,step(dt,camera,root,action){
   time+=dt;
   const phase=Math.floor(time/.33)%4;
   if(phase!==prev){questDraw(ctx,role,phase,action||'idle');tex.needsUpdate=true;prev=phase;}
   mesh.rotation.y=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z)-root.rotation.y;
 },dispose(){mesh.geometry.dispose();mat.dispose();tex.dispose();}};
}
g.VLSemestaArt=Object.freeze({sourcePublished,originalCount,retrySources,vehicleGraphic,questGraphic,vehicleCanvas,vehiclePreview,questPreview});
})(window);

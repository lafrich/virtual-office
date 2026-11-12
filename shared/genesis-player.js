/* Genesis Player renderer: only two approved Genesis sources + face pixels from Emosi.exe.
 * Mahluk Hidup custom body layers remain untouched and are never written to browser storage.
 * Adapt native V6P palette mapping/canonical rows for gameplay without forking physics.
 */
(function(root,factory){"use strict";const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.VLGenesisPlayer=api;})(typeof window!=="undefined"?window:null,function(root){
"use strict";
const SOURCE=root?.VLGenesisSource;
const EMOSI=root?.VLEmosiSource;
const V=root?.V6PCompositor;
// Appearance options (identical to the retired V6P customizer lists) so the
// LGR path needs no V6P runtime.
const OPT=Object.freeze({
 hair:["none","short","swept","mid_curtain","mid","wavy","wavy_curtain","long","long_curtain"],
 hairColor:["black","navy","brown","chestnut","blonde","red","white","pink"],
 skin:["porcelain","light","tan","medium","brown","deep"],
 top:["nude","tee","tee_long","tee_graphic","shirt","shirt_tie","cardigan","cardigan_dots","custom"],
 topColor:["charcoal","white","navy","red","green","mustard","sky","pink"],
 pants:["nude","trousers","trousers_ripped","baggy","baggy_ripped","custom"],
 pantsColor:["slate","night","denim","khaki","olive","grey"],
 shoes:["nude","shoes","sneakers","boots","hightops","custom"],
 shoesColor:["walnut","black","white","red","navy","tan"],
 glasses:["none","round","square"],facial:["none","mustache","stubble","both"]});
const IDs=Object.freeze(["genesis_male_nude","genesis_female_nude"]);
const DIRS=Object.freeze(["se","sw","ne","nw"]);
const ROWS=Object.freeze({walk:0,idle:4,talk:8,sit:12,sit_type:16,sleep:20,tired:24,swim:28,float:32,lie:36,perch:40});
const FRAMES=Object.freeze({walk:6,idle:4,talk:4,sit:4,sit_type:4,sleep:4,tired:4,swim:6,float:4,lie:4,perch:4});
const CDN="/virtual-life-asset-pipeline/media/v6p/";
const assets=new Map(),pixels=new Map();
// ── LGR-1 character runtime (default) ───────────────────────────────────────
// Official LGR-1 base + baked outfits + hair + keyframe motions + Emosi face,
// rasterised by the pipeline's LGR runtime (joint fill on). Instant rollback to
// the old V6P sheets: open any page with ?renderer=v6p (remembered on this
// device; ?renderer=lgr switches back), or set DEFAULT_RENDERER below.
const DEFAULT_RENDERER="lgr";
const RENDERER=!V?"lgr":(()=>{try{const q=new URLSearchParams(root.location.search).get("renderer");
 if(q==="v6p"||q==="lgr")root.localStorage.setItem("vl-character-renderer",q);
 const v=root.localStorage.getItem("vl-character-renderer");return v==="v6p"||v==="lgr"?v:DEFAULT_RENDERER}catch{return DEFAULT_RENDERER}})();
const LGR_SCRIPTS=["lafrich-puppet-core.js","lafrich-puppet-renderer.js","lgr1-raster.js","lgr1-motion.js","lgr-skin.js","lgr-wear.js","lgr-actor.js","lgr-db.js","lgr-game.js"]
 .map(f=>"/virtual-life-asset-pipeline/"+f+"?v=pakaian-v2");
const lgr={wanted:RENDERER==="lgr"&&!!root?.document,ready:false,error:null,promise:null};
function loadLGR(){
 if(!lgr.wanted)return null;
 if(lgr.promise)return lgr.promise;
 lgr.promise=(async()=>{
  for(const src of LGR_SCRIPTS){
   const name=src.split("/").pop().split("?")[0];
   if(name==="lgr-game.js"&&root.LGRGame)continue;
   await new Promise((resolve,reject)=>{const el=root.document.createElement("script");el.src=src;el.onload=resolve;
    el.onerror=()=>reject(Error("LGR runtime "+name+" missing"));root.document.head.appendChild(el)});
  }
  await root.LGRGame.load();lgr.ready=true;
 })().catch(e=>{lgr.error=e;console.warn("LGR runtime failed; using V6P sheets",e);});
 return lgr.promise;
}
const useLGR=()=>lgr.wanted&&lgr.ready&&!lgr.error;
const lgrPending=()=>lgr.wanted&&!lgr.ready&&!lgr.error;
if(lgr.wanted)loadLGR();
function lgrProfile(p){return {gender:p.gender==="female"?"female":"male",appearance:p.appearance}}
function normalizeProfile(input){
 if(!input||!IDs.includes(input.base))throw Error("Genesis base harus Male atau Female");
 if(!SOURCE?.bases?.[input.base])throw Error("Genesis asset belum tersedia");
 const gender=SOURCE.bases[input.base].gender;
 // Genesis assets already contain their own original pixel-exact Custom Wear.
 // Use the source appearance as the default instead of silently putting stock
 // clothes over its custom sheets.
 const sourceLook=SOURCE.bases[input.base].appearance||{};
 const defaults={hairStyle:sourceLook.hair||"none",hairColor:sourceLook.hairColor||"black",
  skinTone:sourceLook.skin||"light",topStyle:"custom",topColor:sourceLook.topColor||"white",
  pantsStyle:"custom",pantsColor:sourceLook.pantsColor||"slate",
  // Genesis Nude must open with its own immutable Custom Wear barefoot sheet.
  // Native Mahluk black shoes remain opt-in, not silently worn over a nude base.
  shoesStyle:"custom",shoesColor:sourceLook.shoesColor||"black",
  glasses:"none",facialHair:"none"};
 const fields={
  hairStyle:"hair",hairColor:"hairColor",skinTone:"skin",topStyle:"top",topColor:"topColor",
  pantsStyle:"pants",pantsColor:"pantsColor",shoesStyle:"shoes",shoesColor:"shoesColor",
  glasses:"glasses",facialHair:"facial"};
 const opt=V?.OPT||OPT;
 const appearance={};
 for(const [key,vc] of Object.entries(fields)){
  const value=input.appearance?.[key]||defaults[key];
  appearance[key]=(Array.isArray(opt[vc])&&opt[vc].includes(value))?value:defaults[key];
 }
 // Player appearance is never allowed to change base or install built-in facial sprites.
 const name=typeof input.name==="string"?input.name.trim().slice(0,24):"Player";
 const birth=typeof input.birthday==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(input.birthday)?input.birthday:null;
 const zodiac=typeof input.zodiac==="string"?input.zodiac.slice(0,16):"";
 return {format:"mainkan-player-genesis-v1",base:input.base,gender,name:name||"Player",birthday:birth,zodiac,appearance,
  faceSource:"emosi.exe",faceId:"universal-neutral",emotion:"neutral"};
}
function dataFor(part,profile){
 const base=SOURCE?.bases?.[profile.base];
 const f=profile.gender==="female"?"_f":"";
 const key=part+f;
 if(base?.parts?.[key])return base.parts[key];
 if(part==="shoes/underlay"&&base?.parts?.["shoes/shoes_f"])return base.parts["shoes/shoes_f"];
 return null;
}
function lookupImage(url){
 if(!url)return null;
 let value=assets.get(url);
 if(!value){
  const img=new Image();value={img,ready:false,error:false};
  assets.set(url,value);
  if(!url.startsWith("data:"))img.crossOrigin="anonymous";
  img.onload=()=>{
   value.ready=img.naturalWidth>=64&&img.naturalHeight>=112;
   value.error=!value.ready; // A 1×1 PNG is not a playable frame.
  };
  img.onerror=()=>{value.error=true;};
  img.src=url;
 }
 return value;
}
function path(part,profile){
 const custom=dataFor(part,profile);
 return custom||CDN+part+".png";
}
function canvas(){const c=document.createElement("canvas");c.width=64;c.height=112;return c;}
function compositedPixel(part,profile,action,dir,frame){
 const imageUrl=path(part,profile);
 const im=lookupImage(imageUrl);
 if(!im?.ready)return null;
 const srcAction=Object.hasOwn(ROWS,action)?action:"idle";
 const f=Math.min(frame,FRAMES[srcAction]-1);
 const sy=(ROWS[srcAction]+DIRS.indexOf(dir))*112;
 const sx=f*64;
 if(im.img.naturalWidth<sx+64||im.img.naturalHeight<sy+112)return null;
 const isCustom=!!dataFor(part,profile);
 const ap=profile.appearance;
 const paletteKey=[ap.hairColor,ap.skinTone,ap.topColor,ap.pantsColor,ap.shoesColor].join("-");
 const key=profile.base+"|"+part+"|"+paletteKey+"|"+srcAction+"|"+dir+"|"+f;
 if(pixels.has(key))return pixels.get(key);
 const cv=canvas(),g=cv.getContext("2d",{willReadFrequently:!isCustom});g.imageSmoothingEnabled=false;
 g.drawImage(im.img,sx,sy,64,112,0,0,64,112);
 if(!isCustom&&V?.keysToDisplay){
  const colors={body:profile.gender,gender:profile.gender,hair:ap.hairStyle,hairColor:ap.hairColor,
   skin:ap.skinTone,top:ap.topStyle,topColor:ap.topColor,pants:ap.pantsStyle,pantsColor:ap.pantsColor,
   shoes:ap.shoesStyle,shoesColor:ap.shoesColor,glasses:ap.glasses,facial:ap.facialHair,face:"blank"};
  try{const p=V.keysToDisplay(g.getImageData(0,0,64,112),colors);
   g.putImageData(new ImageData(p.data,64,112),0,0);}catch(e){console.warn("Genesis native V6P palette",e);}
 }
 if(pixels.size>3200)pixels.clear();
 pixels.set(key,cv);return cv;
}
function listParts(profile){
 const f=profile.gender==="female"?"_f":"",a=profile.appearance;
 const hair=a.hairStyle==="none"?null:"hair/"+a.hairStyle;
 const parts=[];
 // short_back.png and swept_back.png are intentionally transparent 1×1
 // placeholders. Front sheets are real atlases. Requiring the blank backs
 // previously made the *entire character* disappear for Short/Swept.
 if(hair&&!["short","swept"].includes(a.hairStyle))parts.push(hair+"_back");
 parts.push("base/body"+f);
 if(a.topStyle==="custom")parts.push("top/custom_back");
 else if(a.topStyle!=="nude")parts.push("top/"+a.topStyle+"_back"+f);
 // Only mixed Genesis Custom Wear pants + selected stock shoes needs the
 // shoe last; native Custom Wear shoes and ordinary outfits retain their
 // approved ordering. Prevent black shoe edges being covered by pants on
 // different Walk/Sit frames while preserving the original nude source art.
 const shoeLast=a.pantsStyle==="custom"&&a.shoesStyle!=="custom";
 const shoePart=a.shoesStyle==="custom"?"shoes/custom":
  (a.shoesStyle!=="nude"?"shoes/"+a.shoesStyle+f:null);
 const pantsPart=a.pantsStyle==="custom"?"pants/custom":
  (a.pantsStyle!=="nude"?"pants/"+a.pantsStyle+f:null);
 if(!shoeLast&&shoePart)parts.push(shoePart);
 if(pantsPart)parts.push(pantsPart);
 if(shoeLast&&shoePart)parts.push(shoePart);
 if(["boots","hightops"].includes(a.shoesStyle))parts.push("shoes/"+a.shoesStyle+"_over"+f);
 if(a.topStyle==="custom")parts.push("top/custom");
 else if(a.topStyle!=="nude")parts.push("top/"+a.topStyle+f);
 // Mahluk body_front is a valid transparent 1×1 placeholder: skip it.
 // The face layer itself is strictly sourced from Emosi.exe.
 if(a.facialHair!=="none")parts.push("facial/"+a.facialHair);
 if(hair)parts.push(hair+"_front");
 if(a.glasses!=="none")parts.push("glasses/"+a.glasses);
 parts.push("base/shadow","base/fx");
 return parts;
}
function resolvePart(part,profile){
 // Genesis custom parts are exact backing-art from Mahluk's earlier workspace.
 // The bare "shoes/underlay" carries an independent female layer in that backup.
 if(part==="top/custom_back"||part==="top/custom"||part==="pants/custom"||part==="shoes/custom")return path(part,profile);
 return CDN+part+".png";
}
function expressionFor(name){
 if(!EMOSI)return null;
 const key=EMOSI.contexts?.[name]||EMOSI.contexts?.neutral;
 return EMOSI.emotions?.find(e=>e.id===key)||null;
}
function imageStatus(input,emotion="neutral",dir="se"){
 const profile=normalizeProfile(input);
 if(lgrPending())return {ready:false,loaded:0,total:2,pending:2,errors:[],renderer:"lgr"};
 // Mainkan intentionally ships no V6P compositor. Surface a real LGR load
 // failure instead of reporting V6P PNG progress for 90 seconds indefinitely.
 if(lgr.error&&!V)return {ready:false,loaded:0,total:2,pending:0,
  errors:["LGR-1 gagal: "+String(lgr.error.message||lgr.error)],renderer:"lgr"};
 if(useLGR()){
  const face=(dir==="se"||dir==="sw")?lookupImage((expressionFor(emotion)||expressionFor("neutral"))?.png):null;
  const faceOk=!face||face.ready,faceErr=face&&face.error;
  return {ready:faceOk,loaded:faceOk?2:1,total:2,pending:faceOk?0:1,errors:faceErr?["emosi.exe/"+emotion]:[],renderer:"lgr"};
 }
 const names=listParts(profile);
 const items=names.map(part=>({part,image:lookupImage(resolvePart(part,profile))}));
 if(dir==="se"||dir==="sw"){
  const face=expressionFor(emotion)||expressionFor("neutral");
  items.push({part:"emosi.exe/"+(face?.id||"missing"),image:lookupImage(face?.png)});
 }
 const failures=items.filter(x=>!x.image||x.image.error).map(x=>x.part);
 return {ready:items.every(x=>x.image?.ready),loaded:items.filter(x=>x.image?.ready).length,
  total:items.length,pending:items.filter(x=>x.image&&!x.image.ready&&!x.image.error).length,
  errors:failures};
}
function drawLGR(ctx,norm,d,action,emotion,tick,actionTime){
 const e=expressionFor(emotion)||expressionFor("neutral");
 const face=(d==="se"||d==="sw")?lookupImage(e?.png):null;
 if(face&&!face.ready)return false;
 const faceFrame=Math.floor(Math.max(0,tick)*Math.max(1,e?.fps||6))%Math.max(1,e?.frames||1);
 const c=root.LGRGame.frame(lgrProfile(norm),d,action,actionTime??tick,face?face.img:null,faceFrame);
 if(!c)return false;
 const work=canvas(),g=work.getContext("2d",{alpha:true});g.imageSmoothingEnabled=false;
 g.drawImage(c,0,0);
 // ground shadow (pixel ellipse under the feet, anchor 32,101), under the body
 g.save();g.globalCompositeOperation="destination-over";g.fillStyle="rgba(20,24,32,0.28)";
 for(const [dy,hw] of [[-2,6],[-1,9],[0,11],[1,9],[2,6]])g.fillRect(32-hw,101+dy,hw*2,1);g.restore();
 ctx.clearRect(0,0,64,112);ctx.drawImage(work,0,0);
 return true;
}
function draw(ctx,profile,dir="se",action="idle",frame=0,emotion="neutral",tick=0,actionTime=null){
 const norm=normalizeProfile(profile);
 if(lgrPending())return false;
 if(useLGR())return drawLGR(ctx,norm,DIRS.includes(dir)?dir:"se",action,emotion,tick,actionTime);
 if(!V)return false; // V6P sheets not loaded on the LGR-only (Mainkan) path
 const d=DIRS.includes(dir)?dir:"se",a=Object.hasOwn(ROWS,action)?action:"idle";
 const f=Math.max(0,Math.min(FRAMES[a]-1,Math.floor(frame)||0));
 const status=imageStatus(norm,emotion,d);
 // Keep the LAST complete picture during async loading. Never clear the visible
 // canvas, and never commit a partially assembled frame or missing face.
 if(!status.ready)return false;
 const work=canvas(),g=work.getContext("2d",{alpha:true});g.imageSmoothingEnabled=false;
 const parts=listParts(norm);
 const shade=part=>compositedPixel(part,norm,a,d,f);
 // imageStatus only confirms that a PNG loaded; it does not verify this exact
 // atlas cell exists. Never swap a partially drawn frame during action changes.
 const cells=parts.map(part=>shade(part));
 if(cells.some(cell=>!cell))return false;
 for(const cell of cells.slice(0,-2))g.drawImage(cell,0,0);
 // Emosi.exe is the ONLY facial source.
 const e=expressionFor(emotion)||expressionFor("neutral");
 const face=lookupImage(e?.png);
 if(face?.ready&&(d==="se"||d==="sw")){
  const faceFrame=Math.floor(Math.max(0,tick)*Math.max(1,e?.fps||6))%Math.max(1,e?.frames||1);
  g.drawImage(face.img,faceFrame*64,DIRS.indexOf(d)*112,64,112,0,0,64,112);
 }
 const shadow=cells[cells.length-2],fx=cells[cells.length-1];
 g.save();g.globalCompositeOperation="destination-over";g.drawImage(shadow,0,0);g.restore();
 g.drawImage(fx,0,0);
 // Atomic swap: a fully rendered canvas is committed in one operation.
 ctx.clearRect(0,0,64,112);ctx.drawImage(work,0,0);
 return true;
}
function directPreview(canvasElement,profile,dir,action,frame,emotion,tick){
 try{const ctx=canvasElement?.getContext?.("2d");return !!ctx&&draw(ctx,profile,dir,action,frame,emotion,tick);}
 catch(error){console.warn("Genesis preview error",error);return false;}
}
function createRig(THREE,input){
 const profile=normalizeProfile(input);
 const cv=canvas(),ctx=cv.getContext("2d",{alpha:true});ctx.imageSmoothingEnabled=false;
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
 const mat=new THREE.MeshBasicMaterial({map:tex,transparent:false,alphaTest:.45,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
 const pixelWorld=Math.SQRT2/64,h=112*pixelWorld/(Math.sqrt(3)/2),w=64*pixelWorld;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
 // Small ground clearance keeps soles above undulating Semesta terrain
 // without changing the original Genesis 32,100 pivot or walking footprint.
 mesh.position.y=h*(100/112-.5)+0.025;
 mesh.userData.characterBillboard=true;mesh.userData.characterSource="genesis";
 mesh.userData.nativeFrame={w:64,h:112,pivotX:32,pivotY:100};
 const state={profile,loaded:false,failed:false,direction:"se",moving:false,pose:null,emotion:"neutral",time:0};
 let previous="",sceneTime=0,lastAction="idle",emotionUntil=0;
 let lastLGR=null,lgrTime=0;
 const DIRSPEED={walk:0.14,idle:0.24,talk:0.22,sit:0.24,sleep:0.32};
 function setMoving(dx,dz,active){
  state.moving=!!active;if(active){
   state.pose=null;
   const next=Math.abs(dx)>=Math.abs(dz)?(dx>=0?"se":"nw"):(dz>=0?"sw":"ne");
   state.direction=next;
  }
 }
 function setPose(p){state.pose=p||null;state.moving=false;}
 function setDirection(d){if(DIRS.includes(d))state.direction=d;}
 function setProfile(){/* Player actor is bound to its approved Genesis profile for this session. */}
 function setEmotion(value,duration=0){
  if(!EMOSI?.contexts?.[value])return false;
  state.emotion=value;emotionUntil=duration>0?sceneTime+duration:0;previous="";return true;
 }
 function applyContext(data){
  if(!data||emotionUntil>sceneTime)return;
  const energy=Number(data.energy??data.needs?.energy);
  const mood=String(data.emotion||data.mood||"").toLowerCase();
  if(EMOSI?.contexts?.[mood])state.emotion=mood;
  else if(Number.isFinite(energy)&&energy<17)state.emotion="sleepy";
  else if(state.emotion==="sleepy")state.emotion="neutral";
 }
 function step(dt,camera,position){
  const delta=Math.min(.1,Math.max(0,dt||0));sceneTime+=delta;
  if(emotionUntil>0&&sceneTime>emotionUntil){emotionUntil=0;state.emotion="neutral";}
  const requested=state.pose||((state.moving)?"walk":"idle");
  // Native Genesis contains 44 action rows. Unknown Jiwa actions fall back to
  // a valid pose, but never swap character identity or use Ichsan art.
  const mapping={rest:"sleep",sleep_bed_right:"lie",sleep_bed_left:"lie",toilet:"sit",pee:"sit",work:"sit_type",study:"sit_type",cook:"sit_type",bathe:"swim"};
  const action=ROWS[requested]!==undefined?requested:(mapping[requested]||"idle");
  if(lastAction!==action){state.time=0;lastAction=action;}
  state.time+=delta;
  const count=FRAMES[action]||4,speed=DIRSPEED[action]||.24;
  const frame=Math.floor(state.time/speed)%count;
  const lgrOn=useLGR(),lgrAction=lgrOn?requested:action;
  if(lgrOn&&lastLGR!==requested){lastLGR=requested;lgrTime=0;}
  lgrTime+=delta;
  const key=lgrOn?["lgr",requested,state.direction,Math.floor(lgrTime*20),state.emotion,Math.floor(sceneTime*6),profile.base].join("|")
   :[action,state.direction,frame,state.emotion,Math.floor(sceneTime*6),profile.base].join("|");
  if(key!==previous){
   const complete=draw(ctx,profile,state.direction,lgrAction,frame,state.emotion,sceneTime,lgrOn?lgrTime:null);
   // Once the first frame was painted, a transient asset fetch can never
   // make the mesh transparent. Only a fully composed frame replaces it.
   if(complete){state.loaded=true;state.failed=false;tex.needsUpdate=true;previous=key;}
   else state.failed=imageStatus(profile,state.emotion,state.direction).errors.length>0;
  }
  const yaw=camera?Math.atan2(camera.position.x-(position?.x||0),camera.position.z-(position?.z||0)):mesh.rotation.y||0;
  mesh.rotation.set(0,yaw,0);
 }
 return {mesh,state,setMoving,setPose,setDirection,setProfile,setCharacter:setProfile,setEmotion,applyContext,step,
  refresh(){previous="";},
  dispose(){mesh.geometry.dispose();mat.dispose();tex.dispose();}};
}
function debug(profile){
 const p=normalizeProfile(profile);
 return listParts(p).map(part=>{
  const url=resolvePart(part,p),asset=lookupImage(url);
  return {part,ready:!!asset?.ready,error:!!asset?.error,code:url.startsWith("data:")?"Genesis source":url,
   naturalWidth:asset?.img?.naturalWidth||0,naturalHeight:asset?.img?.naturalHeight||0};
 });
}
function renderer(){return {wanted:RENDERER,active:useLGR()?"lgr":(lgrPending()?"lgr-loading":"v6p"),error:lgr.error?String(lgr.error.message||lgr.error):null,lgr:root?.LGRGame?.status?.()||null}}
return Object.freeze({IDs,normalizeProfile,draw,directPreview,createRig,expressionFor,imageStatus,debug,renderer,loadLGR});
});

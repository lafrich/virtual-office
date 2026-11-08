/* Genesis Player renderer: only two approved Genesis sources + face pixels from Emosi.exe.
 * Mahluk Hidup custom body layers remain untouched and are never written to browser storage.
 * Adapt native V6P palette mapping/canonical rows for gameplay without forking physics.
 */
(function(root,factory){"use strict";const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.VLGenesisPlayer=api;})(typeof window!=="undefined"?window:null,function(root){
"use strict";
const SOURCE=root?.VLGenesisSource;
const EMOSI=root?.VLEmosiSource;
const V=root?.V6PCompositor;
const IDs=Object.freeze(["genesis_male_nude","genesis_female_nude"]);
const DIRS=Object.freeze(["se","sw","ne","nw"]);
const ROWS=Object.freeze({walk:0,idle:4,talk:8,sit:12,sit_type:16,sleep:20,tired:24,swim:28,float:32,lie:36,perch:40});
const FRAMES=Object.freeze({walk:6,idle:4,talk:4,sit:4,sit_type:4,sleep:4,tired:4,swim:6,float:4,lie:4,perch:4});
const CDN="/virtual-life-asset-pipeline/media/v6p/";
const assets=new Map(),pixels=new Map();
function normalizeProfile(input){
 if(!input||!IDs.includes(input.base))throw Error("Genesis base harus Male atau Female");
 if(!SOURCE?.bases?.[input.base])throw Error("Genesis asset belum tersedia");
 const gender=SOURCE.bases[input.base].gender;
 const defaults={hairStyle:"none",hairColor:"black",skinTone:"light",topStyle:"tee",topColor:"charcoal",
  pantsStyle:"trousers",pantsColor:"slate",shoesStyle:"shoes",shoesColor:"walnut",glasses:"none",facialHair:"none"};
 const fields={
  hairStyle:"hair",hairColor:"hairColor",skinTone:"skin",topStyle:"top",topColor:"topColor",
  pantsStyle:"pants",pantsColor:"pantsColor",shoesStyle:"shoes",shoesColor:"shoesColor",
  glasses:"glasses",facialHair:"facial"};
 const opt=V?.OPT||{};
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
  img.onload=()=>{value.ready=img.naturalWidth>=64&&img.naturalHeight>=112;};
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
 if(hair)parts.push(hair+"_back");
 parts.push("base/body"+f);
 parts.push("top/custom_back");
 if(profile.gender==="female"&&dataFor("shoes/underlay",profile))parts.push("shoes/underlay");
 parts.push("shoes/custom","pants/custom","top/custom");
 // Clothes in mainkan are modular garments over the exact Genesis nude base.
 if(a.shoesStyle&&a.shoesStyle!=="none")parts.push("shoes/"+a.shoesStyle+f);
 if(a.pantsStyle&&a.pantsStyle!=="none")parts.push("pants/"+a.pantsStyle+f);
 if(a.topStyle&&a.topStyle!=="none")parts.push("top/"+a.topStyle+"_back"+f,"top/"+a.topStyle+f);
 parts.push("base/body_front"+f);
 if(a.facialHair!=="none")parts.push("facial/"+a.facialHair);
 if(hair)parts.push(hair+"_front");
 if(a.glasses!=="none")parts.push("glasses/"+a.glasses);
 parts.push("base/shadow","base/fx");
 return parts;
}
function resolvePart(part,profile){
 // Genesis custom parts are exact backing-art from Mahluk's earlier workspace.
 // The bare "shoes/underlay" carries an independent female layer in that backup.
 if(part==="top/custom_back"||part==="top/custom"||part==="pants/custom"||part==="shoes/custom"||part==="shoes/underlay")return path(part,profile);
 return CDN+part+".png";
}
function expressionFor(name){
 if(!EMOSI)return null;
 const key=EMOSI.contexts?.[name]||EMOSI.contexts?.neutral;
 return EMOSI.emotions?.find(e=>e.id===key)||null;
}
function draw(ctx,profile,dir="se",action="idle",frame=0,emotion="neutral",tick=0){
 const norm=normalizeProfile(profile);
 const d=DIRS.includes(dir)?dir:"se",a=Object.hasOwn(ROWS,action)?action:"idle";
 const f=Math.max(0,Math.min(FRAMES[a]-1,Math.floor(frame)||0));
 ctx.clearRect(0,0,64,112);ctx.imageSmoothingEnabled=false;
 const parts=listParts(norm);
 // Preload all layers before painting any, to avoid showing a headless body.
 const missing=parts.some(part=>!lookupImage(resolvePart(part,norm))?.ready);
 if(missing)return false;
 const shade=part=>compositedPixel(part,norm,a,d,f);
 const drawLayer=part=>{const cell=shade(part);if(cell)ctx.drawImage(cell,0,0);};
 for(const part of parts.slice(0,-2))drawLayer(part);
 // Emosi.exe face atlas: no baked face/* or brows/* is ever drawn.
 const e=expressionFor(emotion)||expressionFor("neutral");
 const face=lookupImage(e?.png);
 if(face?.ready&&(d==="se"||d==="sw")){
  const faceFrame=Math.floor(Math.max(0,tick)*Math.max(1,e?.fps||6))%Math.max(1,e?.frames||1);
  ctx.drawImage(face.img,faceFrame*64,DIRS.indexOf(d)*112,64,112,0,0,64,112);
 }
 // Shadow belongs underneath the character; environmental highlights are last.
 const shadow=shade("base/shadow"),fx=shade("base/fx");
 if(shadow){ctx.save();ctx.globalCompositeOperation="destination-over";ctx.drawImage(shadow,0,0);ctx.restore();}
 if(fx)ctx.drawImage(fx,0,0);
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
 mesh.position.y=h*(100/112-.5);
 mesh.userData.characterBillboard=true;mesh.userData.characterSource="genesis";
 mesh.userData.nativeFrame={w:64,h:112,pivotX:32,pivotY:100};
 const state={profile,loaded:false,failed:false,direction:"se",moving:false,pose:null,emotion:"neutral",time:0};
 let previous="",sceneTime=0,lastAction="idle",emotionUntil=0;
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
  const key=[action,state.direction,frame,state.emotion,Math.floor(sceneTime*6),profile.base].join("|");
  if(key!==previous){
   state.loaded=draw(ctx,profile,state.direction,action,frame,state.emotion,sceneTime);
   state.failed=false;
   if(state.loaded){tex.needsUpdate=true;previous=key;}
  }
  const yaw=camera?Math.atan2(camera.position.x-(position?.x||0),camera.position.z-(position?.z||0)):mesh.rotation.y||0;
  mesh.rotation.set(0,yaw,0);
 }
 return {mesh,state,setMoving,setPose,setDirection,setProfile,setCharacter:setProfile,setEmotion,applyContext,step,
  refresh(){previous="";},
  dispose(){mesh.geometry.dispose();mat.dispose();tex.dispose();}};
}
return Object.freeze({IDs,normalizeProfile,draw,directPreview,createRig,expressionFor});
});

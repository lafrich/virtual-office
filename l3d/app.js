/* L3D.EXE — standalone 3D/JSON authoring app for Semesta.
 * Three Object3D JSON is the portable geometry payload; no arbitrary scripts.
 */
const $=id=>document.getElementById(id);
const library=window.VLL3DLibrary;
const status=(s,err=false)=>{$('status').textContent=s;$('status').style.color=err?'#a42f33':'#315b80';};
const num=(id,f)=>{const n=Number($(id).value);return Number.isFinite(n)&&n>0?n:f;};
let THREE,renderer,scene,camera,ortho,persp,orbit,fitWrapper=null,rawModel=null;
let currentId=null,currentDocument=null,jsonMode='tree',grid=null,wire=false;
let modelSource='LFC / SIX SIDES',modelFiles=[],objectURLs=[],modelLoaded=false;
let syncPending=0,raf=null;
function metadata(){
 return {id:$('assetId').value.trim().toLowerCase(),name:$('assetName').value.trim(),
  kind:$('assetKind').value,footprint:[num('sizeW',2),num('sizeD',2)],
  height:num('sizeH',1.5),collision:$('collision').checked};
}
function setMeta(x){
 $('assetId').value=x.id||'lfc_box_01';$('assetName').value=x.name||'LFC Box 01';
 $('assetKind').value=x.kind||'prop';
 $('sizeW').value=x.footprint?.[0]??2.8;$('sizeD').value=x.footprint?.[1]??1.3;
 $('sizeH').value=x.height??1.5;$('collision').checked=x.collision!==false;
}
function defaultMaterial(color){
 return new THREE.MeshStandardMaterial({color,roughness:1,metalness:0,side:THREE.DoubleSide});
}
function sampleBox(){
 const colors=['#698ca9','#aec8db','#dcecf2','#455e72','#90abc5','#56738f'];
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),colors.map(defaultMaterial));
 mesh.userData.lfcBox=true;return mesh;
}
function clearURLs(){for(const u of objectURLs)URL.revokeObjectURL(u);objectURLs=[];}
function setModel(object,source,fit=true){
 if(!THREE)return;
 const next=object||sampleBox();
 if(fitWrapper){scene.remove(fitWrapper);fitWrapper.traverse(node=>{
   if(node.isMesh&&node!==next){
    node.geometry?.dispose?.();
    for(const m of Array.isArray(node.material)?node.material:[node.material])m?.dispose?.();
   }
  });}
 rawModel=next;fitWrapper=new THREE.Group();fitWrapper.name='L3D / normalized ground pivot';
 fitWrapper.add(rawModel);scene.add(fitWrapper);
 modelSource=source||'LOCAL MODEL';modelLoaded=true;
 if(fit)fitToFootprint();
 else {frame();updateStats();updateJSON();}
 $('modelOrigin').textContent=source.toUpperCase().slice(0,45);
 $('stageEmpty').hidden=true;
}
function bounds(){
 if(!rawModel)return null;
 const b=new THREE.Box3().setFromObject(rawModel);
 return b.isEmpty()?null:b;
}
function fitToFootprint(){
 if(!fitWrapper||!rawModel)return;
 fitWrapper.position.set(0,0,0);fitWrapper.scale.set(1,1,1);
 const b=bounds();if(!b){status('MODEL HAS NO GEOMETRY',true);return}
 const size=b.getSize(new THREE.Vector3()),mid=b.getCenter(new THREE.Vector3());
 const w=num('sizeW',2),d=num('sizeD',2),h=num('sizeH',1.5);
 const sx=w/Math.max(.00001,size.x),sy=h/Math.max(.00001,size.y),sz=d/Math.max(.00001,size.z);
 fitWrapper.scale.set(sx,sy,sz);
 fitWrapper.position.set(-mid.x*sx,-b.min.y*sy,-mid.z*sz);
 fitWrapper.updateMatrixWorld(true);
 frame();updateStats();scheduleJSON();
 status('MODEL FIT · PIVOT AT GROUND Y=0');
}
function updateStats(){
 if(!fitWrapper||!THREE)return;
 const b=new THREE.Box3().setFromObject(fitWrapper);
 let meshes=0,triangles=0;fitWrapper.traverse(o=>{if(o.isMesh){
  meshes++;const geo=o.geometry;
  if(geo)triangles+=geo.index?Math.floor(geo.index.count/3):Math.floor((geo.attributes.position?.count||0)/3);
 }});
 const size=b.getSize(new THREE.Vector3());
 $('modelStats').textContent=meshes+' MESH · '+triangles.toLocaleString()+' TRI · '+size.x.toFixed(2)+' × '+size.y.toFixed(2)+' × '+size.z.toFixed(2);
}
function frame(){
 if(!THREE||!fitWrapper||!camera||!orbit)return;
 const b=new THREE.Box3().setFromObject(fitWrapper);
 const c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
 const radius=Math.max(1,Math.hypot(s.x,s.y,s.z));
 orbit.target.copy(c);
 const angle=$('cameraType').value==='persp'?
  new THREE.Vector3(1.55,1.35,1.7).normalize():new THREE.Vector3(1,1.12,1).normalize();
 const distance=radius*1.85+3;
 camera.position.copy(c).addScaledVector(angle,distance);
 if(camera.isOrthographic){camera.left=-radius;camera.right=radius;camera.top=radius*.72;camera.bottom=-radius*.72;camera.zoom=1;}
 else{camera.fov=40;}
 camera.near=.01;camera.far=1500;camera.updateProjectionMatrix();orbit.update();
 resize();
}
function resize(){
 if(!renderer||!camera)return;
 const host=$('stage'),w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
 const ratio=w/h;
 if(camera.isOrthographic){
  const visible=Math.max(2.4,Math.max(num('sizeW',2),num('sizeD',2),num('sizeH',2))*2.2);
  camera.left=-visible*ratio/2;camera.right=visible*ratio/2;
  camera.top=visible/2;camera.bottom=-visible/2;
  camera.updateProjectionMatrix();
 }else{camera.aspect=ratio;camera.updateProjectionMatrix()}
 renderer.setSize(w,h,false);
}
function switchCamera(){
 if(!THREE)return;
 const previous=orbit?.target?.clone()||new THREE.Vector3();
 const pos=camera?.position?.clone()||new THREE.Vector3(8,9,8);
 orbit?.dispose();camera=$('cameraType').value==='persp'?persp:ortho;
 camera.position.copy(pos);
 const {OrbitControls}=window.__L3D_ORBIT;
 orbit=new OrbitControls(camera,$('view'));orbit.enableDamping=true;orbit.dampingFactor=.08;
 orbit.target.copy(previous);orbit.screenSpacePanning=true;orbit.update();frame();
}
async function boot(){
 try{
  THREE=await import('three');
  const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
  window.__L3D_ORBIT={OrbitControls};
  scene=new THREE.Scene();scene.background=new THREE.Color('#1c2e44');
  scene.add(new THREE.AmbientLight(0xffffff,2));
  const light=new THREE.DirectionalLight(0xffffff,3.2);light.position.set(-8,16,12);scene.add(light);
  const fill=new THREE.DirectionalLight(0xaac8ff,1.2);fill.position.set(10,7,-10);scene.add(fill);
  grid=new THREE.GridHelper(100,100,0x4f8ebc,0x345371);scene.add(grid);
  scene.add(new THREE.AxesHelper(1));
  renderer=new THREE.WebGLRenderer({canvas:$('view'),antialias:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  ortho=new THREE.OrthographicCamera(-8,8,6,-6,.01,1500);
  persp=new THREE.PerspectiveCamera(40,1,.01,1500);
  camera=ortho;switchCamera();
  new ResizeObserver(resize).observe($('stage'));
  function animate(){raf=requestAnimationFrame(animate);orbit?.update();renderer.render(scene,camera)}
  animate();
  $('engineStatus').textContent='WEBGL / READY';
  const requested=new URLSearchParams(location.search).get('asset');
  if(requested&&library.get(requested))loadRecord(library.get(requested));
  else newAsset();
 }catch(e){
  $('engineStatus').textContent='WEBGL OFFLINE';$('stageEmpty').hidden=false;
  status('3D ENGINE UNAVAILABLE · JSON VIEWER STILL AVAILABLE',true);
  console.error('L3D viewer boot',e);
  updateJSON();
 }
}
async function importModelFiles(files){
 const selected=[...files],main=selected.find(f=>/\.(glb|gltf|obj|fbx)$/i.test(f.name));
 if(!main){status('SELECT .GLB / .GLTF / .OBJ / .FBX',true);return}
 if(!THREE){status('3D ENGINE NOT AVAILABLE',true);return}
 clearURLs();
 const urls=new Map();
 for(const file of selected){const uri=URL.createObjectURL(file);objectURLs.push(uri);
  urls.set(file.name.toLowerCase(),uri);
  if(file.webkitRelativePath)urls.set(file.webkitRelativePath.toLowerCase(),uri);
 }
 const mgr=new THREE.LoadingManager();
 mgr.setURLModifier(path=>{
  let key;try{key=decodeURIComponent(String(path))}catch{key=String(path)}
  key=key.replace(/\\/g,'/').split('?')[0].toLowerCase();
  return urls.get(key)||urls.get(key.split('/').pop())||path;
 });
 try{
  let loaded=null;
  if(/\.obj$/i.test(main.name)){
   const {OBJLoader}=await import('three/addons/loaders/OBJLoader.js');
   const loader=new OBJLoader(mgr),mtl=selected.find(f=>/\.mtl$/i.test(f.name));
   if(mtl){
    const {MTLLoader}=await import('three/addons/loaders/MTLLoader.js');
    const mats=new MTLLoader(mgr).parse(await mtl.text(),'');
    mats.preload();loader.setMaterials(mats);
   }
   loaded=loader.parse(await main.text());
  }else if(/\.fbx$/i.test(main.name)){
   const {FBXLoader}=await import('three/addons/loaders/FBXLoader.js');
   loaded=new FBXLoader(mgr).parse(await main.arrayBuffer(),'');
  }else{
   const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   const data=/\.glb$/i.test(main.name)?await main.arrayBuffer():await main.text();
   const gltf=await new Promise((resolve,reject)=>new GLTFLoader(mgr).parse(data,'',resolve,reject));
   loaded=gltf.scene;
  }
  if(!loaded)throw Error('Model contains no scene');
  setModel(loaded,main.name);currentDocument=null;
  status('IMPORTED '+main.name+' · FIT then SAVE TO SEMESTA');
 }catch(e){status('IMPORT FAILED: '+e.message,true);console.error(e)}
}
function snapshot(){
 if(!renderer)return '';
 try{
  renderer.render(scene,camera);
  const canvas=document.createElement('canvas');canvas.width=180;canvas.height=135;
  canvas.getContext('2d').drawImage($('view'),0,0,180,135);
  return canvas.toDataURL('image/png');
 }catch{return ''}
}
function buildRecord(withThumbnail=false){
 if(!fitWrapper||!THREE)throw Error('No 3D model loaded');
 const record={format:library.FORMAT,version:1,...metadata(),source:modelSource,
  coordinateSystem:'semesta-xz-yup',pivot:'ground-center',model:fitWrapper.toJSON()};
 if(withThumbnail)record.thumbnail=snapshot();
 library.validate(record);return record;
}
function updateJSON(){
 let doc=currentDocument;
 if(!doc)try{doc=buildRecord(false);}catch{doc={format:library.FORMAT,status:'No 3D model',asset:metadata()}}
 const str=JSON.stringify(doc,null,2);
 if(jsonMode==='raw')$('jsonRaw').value=str;
 else renderTree(doc);
 $('jsonInfo').textContent=(str.length/1024).toFixed(1)+' KB / JSON';
}
function scheduleJSON(){if(syncPending)clearTimeout(syncPending);syncPending=setTimeout(()=>{syncPending=0;updateJSON()},200)}
function renderTree(obj){
 const host=$('jsonTree');host.replaceChildren();let count=0;
 const recursive=(v,key,depth,parent)=>{
  if(++count>450){if(count===451){const more=document.createElement('div');more.textContent='… further nodes omitted (RAW shows full JSON)';parent.append(more)}return}
  if(v&&typeof v==='object'){
   const details=document.createElement('details');details.open=depth<2;
   const sum=document.createElement('summary');
   sum.textContent=key+' '+(Array.isArray(v)?'['+v.length+']':'{'+Object.keys(v).length+'}');
   details.append(sum);parent.append(details);
   if(depth>=8){const limit=document.createElement('span');limit.textContent='… max depth';details.append(limit);return}
   for(const [k,val] of Object.entries(v))recursive(val,k,depth+1,details);
  }else{
   const div=document.createElement('div');div.className='jleaf';
   const label=document.createElement('span');label.className='jkey';label.textContent=key+': ';
   const value=document.createElement('span');value.className=v===null?'jnull':typeof v==='number'?'jnum':typeof v==='string'?'jstr':'';
   value.textContent=typeof v==='string'?JSON.stringify(v.length>170?v.slice(0,170)+'…':v):String(v);
   div.append(label,value);parent.append(div);
  }
 };
 recursive(obj,'root',0,host);
}
function chooseTab(t){
 jsonMode=t;$('treeTab').classList.toggle('active',t==='tree');$('rawTab').classList.toggle('active',t==='raw');
 $('jsonTree').hidden=t!=='tree';$('jsonRaw').hidden=t!=='raw';updateJSON();
}
async function applyJsonObject(doc){
 if(doc?.format===library.FORMAT&&doc?.model){
  library.validate(doc);loadRecord(doc);return;
 }
 if(doc?.metadata?.type==='Object'&&doc.object&&THREE){
  setModel(new THREE.ObjectLoader().parse(doc),'THREE JSON');currentDocument=null;return;
 }
 currentDocument=doc;updateJSON();status('GENERAL JSON OPENED · VIEW ONLY (not a Semesta 3D asset)');
}
function loadRecord(record){
 library.validate(record);setMeta(record);currentId=record.id;
 if(THREE)setModel(new THREE.ObjectLoader().parse(record.model),'L3D ASSET '+record.id,false);
 currentDocument=null;listAssets();updateJSON();
 status('LOADED '+record.name+' · LOCAL L3D ASSET');
}
function newAsset(){
 currentId=null;currentDocument=null;setMeta({id:'lfc_box_01',name:'LFC Box 01',kind:'prop',footprint:[2.8,1.3],height:1.5,collision:true});
 if(THREE)setModel(sampleBox(),'LFC / SIX-SIDE BOX');
 listAssets();updateJSON();status('NEW LFC BOX · SET SIX FACE TEXTURES OR IMPORT A MODEL');
}
function listAssets(){
 const records=library.list();const host=$('assetList');host.replaceChildren();
 $('assetCount').textContent=String(records.length);
 if(!records.length){const note=document.createElement('p');note.className='list-empty';note.textContent='Belum ada aset. Import 3D atau buat LFC box, lalu SAVE TO SEMESTA.';host.append(note);}
 for(const entry of records){
  const row=document.createElement('button');row.type='button';
  row.className='asset-row'+(entry.id===currentId?' active':'');
  const icon=document.createElement('span');icon.className='asset-ico';icon.textContent=entry.kind==='vehicle'?'▰':entry.kind==='building'?'▥':'◇';
  const desc=document.createElement('span');const label=document.createElement('strong');
  label.textContent=entry.name;const sub=document.createElement('small');sub.textContent=entry.kind.toUpperCase()+' · '+entry.id;
  desc.append(label,sub);row.append(icon,desc);row.onclick=()=>loadRecord(entry);host.append(row);
 }
}
function download(name,content){
 const blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob);
 const link=document.createElement('a');link.href=url;link.download=name;
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function save(){
 try{
  const record=buildRecord(true);library.save(record);currentId=record.id;
  listAssets();currentDocument=null;updateJSON();
  window.VLHub?.publish('objects',{kind:'l3d',id:record.id,format:library.FORMAT});
  status('SAVED '+record.name+' · RELOAD SEMESTA TO PLACE 3D ASSET');
 }catch(e){status('SAVE FAILED: '+e.message,true)}
}
async function assignFace(file,index){
 if(!THREE)return;
 let mesh=null;rawModel?.traverse(child=>{if(child.isMesh&&child.userData.lfcBox)mesh=child});
 if(!mesh){status('LFC FACE TEXTURES REQUIRE NEW LFC BOX',true);return}
 const uri=URL.createObjectURL(file);objectURLs.push(uri);
 const texture=await new Promise((resolve,reject)=>new THREE.TextureLoader().load(uri,resolve,undefined,reject));
 texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;
 texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
 const previous=mesh.material[index];mesh.material[index]=defaultMaterial('#ffffff');
 mesh.material[index].map=texture;mesh.material[index].needsUpdate=true;previous?.dispose();
 currentDocument=null;scheduleJSON();status('LFC SIDE '+(index+1)+' UPDATED · SAVE TO SEMESTA');
}
function wireToggle(){
 wire=!wire;$('toggleWire').setAttribute('aria-pressed',String(wire));
 fitWrapper?.traverse?.(o=>{
  if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)m.wireframe=wire;
 });
}
$('modelInput').addEventListener('change',e=>{importModelFiles(e.target.files);e.target.value=''});
$('jsonInput').addEventListener('change',async e=>{
 const file=e.target.files[0];e.target.value='';if(!file)return;
 try{await applyJsonObject(JSON.parse(await file.text()))}catch(err){status('INVALID JSON: '+err.message,true)}
});
$('newBox').onclick=newAsset;$('fresh').onclick=newAsset;
$('cameraType').onchange=switchCamera;$('cameraReset').onclick=frame;
$('toggleGrid').onclick=()=>{if(!grid)return;grid.visible=!grid.visible;$('toggleGrid').setAttribute('aria-pressed',String(grid.visible))};
$('toggleWire').onclick=wireToggle;
$('applyDimensions').onclick=()=>{if(fitWrapper)fitToFootprint()};
$('metadataForm').addEventListener('input',()=>{currentDocument=null;scheduleJSON()});
$('treeTab').onclick=()=>chooseTab('tree');$('rawTab').onclick=()=>chooseTab('raw');
$('formatJSON').onclick=()=>{try{$('jsonRaw').value=JSON.stringify(JSON.parse($('jsonRaw').value),null,2);status('JSON FORMATTED')}catch(e){status('JSON PARSE ERROR: '+e.message,true)}};
$('applyJSON').onclick=async()=>{try{await applyJsonObject(JSON.parse($('jsonRaw').value));status('JSON APPLIED')}catch(e){status('JSON ERROR: '+e.message,true)}};
$('copyJSON').onclick=async()=>{try{await navigator.clipboard.writeText(jsonMode==='raw'?$('jsonRaw').value:JSON.stringify(currentDocument||buildRecord(),null,2));status('JSON COPIED')}catch(e){status('COPY FAILED: '+e.message,true)}};
$('saveAsset').onclick=save;
$('downloadAsset').onclick=()=>{try{
 const payload=currentDocument||buildRecord(true);
 download((payload.id||$('assetId').value||'l3d-asset')+'.json',JSON.stringify(payload,null,2));
 status('JSON EXPORTED');
 }catch(e){status(e.message,true)}
};
$('removeAsset').onclick=()=>{if(!currentId)return status('SELECT A SAVED ASSET FIRST',true);
 if(!confirm('Remove '+currentId+' from this browser? Export JSON to archive first.'))return;
 library.remove(currentId);currentId=null;newAsset();window.VLHub?.publish('objects',{kind:'l3d',removed:true});
};
$('clearFaces').onclick=()=>{if(rawModel?.userData?.lfcBox||rawModel?.children?.some(c=>c.userData?.lfcBox))setModel(sampleBox(),'LFC / RESET BOX')};
document.querySelectorAll('[data-face]').forEach(input=>input.onchange=async e=>{const file=e.target.files[0];if(file)try{await assignFace(file,Number(e.target.dataset.face))}catch(err){status('FACE FAILED: '+err.message,true)}} );
const stage=$('stage');
stage.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='copy'};
stage.ondrop=e=>{e.preventDefault();const files=[...e.dataTransfer.files];if(files.length)importModelFiles(files)};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}});
listAssets();boot();

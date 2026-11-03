const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function setup(){
 const window={};
 vm.runInNewContext(read('bangun-ruang/interior-model.js'),{window});
 vm.runInNewContext(read('bangun-ruang/interior-isometric.js'),{window});
 return window;
}
test('character, doorway, WC and cutaway wall share believable world proportions',()=>{
 const g=setup(),iso=g.VLInteriorIso;
 assert.equal(iso.tilePixels.join(','),'64,32');
 assert.equal(iso.ACTO_SCALE,undefined); // guard against a misspelled public contract
 assert.equal(iso.ACTOR_SCALE,.5);
 assert.equal(64*iso.ACTOR_SCALE,32);
 assert.equal(112*iso.ACTOR_SCALE,56);
 assert.equal(iso.WALL,96);
 assert.equal(iso.WC_SEAT_Z,19);
 assert.equal(iso.WC_TANK_Z,36);
 assert.ok(iso.WC_TANK_Z<112*iso.ACTOR_SCALE);
 assert.ok(iso.WC_SEAT_Z<iso.WC_TANK_Z);
 const html=read('bangun-ruang/index.html');
 assert.ok(html.includes('faceRect(side,-.48,.48,3,61'));
 assert.ok(61-3>=112*iso.ACTOR_SCALE,'Door opening must fit the character');
 const actorCode=read('bangun-ruang/character-scale-preview.js');
 assert.ok(actorCode.includes('drawWidth=FRAME.w*scale,drawHeight=FRAME.h*scale'));
 assert.ok(actorCode.includes("resolved.mode==='sit'"));
 assert.ok(actorCode.includes("Number(resolved.frames||1)-1"));
});
test('exterior PNG and interior iso canvas maintain equal on-screen pixels per tile',()=>{
 const values=new Map();
 const get=id=>{
  if(!values.has(id))values.set(id,{
   style:{values:{},setProperty(key,value){this.values[key]=value}},
   getBoundingClientRect(){return {width:400,height:310};}
  });
  return values.get(id);
 };
 const window={innerWidth:400,addEventListener(){}},document={getElementById:get};
 vm.runInNewContext(read('bangun-ruang/preview-scale.js'),{window,document});
 const adapter=window.VLBuildingPreviewScale;
 adapter.exterior([224,236]);
 adapter.interior([262,270],'iso');
 const sourcePx=parseFloat(get('preview').style.values.width)/224;
 const insidePx=parseFloat(get('interiorCanvas').style.values.width)/262;
 assert.ok(Math.abs(sourcePx-insidePx)<.006);
 assert.ok(sourcePx>0&&sourcePx<=1.5);
 assert.equal(parseFloat(get('preview').style.values.height)<=294,true);
 assert.equal(parseFloat(get('interiorCanvas').style.values.height)<=294,true);
 const scale=adapter.worldPixelScale;
 adapter.interior([262,270],'plan');
 adapter.interior([262,270],'iso');
 assert.equal(adapter.worldPixelScale,scale);
});
test('seat docking still matches moved/rotated WC and uses scaled hip-to-foot offset',()=>{
 const g=setup(),iso=g.VLInteriorIso;
 for(const rotation of [0,90,180,270]){
  const wc={id:'toilet',assetId:'wc',c:1,r:1,rotation};
  const a=iso.actionAnchor(wc);
  assert.equal(a.pixelOffsetY,27*iso.ACTOR_SCALE-iso.WC_SEAT_Z);
  assert.equal(a.itemId,wc.id);
  assert.ok(a.c>=1&&a.c<=2&&a.r>=1&&a.r<=2);
 }
});
test('Mahluk Hidup actual sheet pixels are rendered at fixed half scale in both rooms',()=>{
 const g=setup(),draws=[];let tick;
 const nodes=new Map();
 function el(id){
  if(!nodes.has(id))nodes.set(id,{
   id,value:'',hidden:id==='interiorCanvas',disabled:false,style:{},
   width:id==='interiorCanvas'?262:224,height:id==='interiorCanvas'?270:236,
   naturalWidth:id==='preview'?224:undefined,
   naturalHeight:id==='preview'?236:undefined,
   classList:{toggle(){}},setAttribute(k,v){this[k]=v;},
   replaceChildren(){this.children=[];this.value='';},
   append(v){this.children??=[];this.children.push(v);if(!this.value)this.value=v.value||'';},
   addEventListener(k,v){this['on'+k]=v;},
   getContext(){return {
    drawImage(...args){draws.push(args);},clearRect(){},fillRect(){},fillText(){},strokeRect(){}
   };},
   getBoundingClientRect(){return {left:0,top:0,width:id==='previewStage'?400:this.width,
     height:id==='previewStage'?310:this.height};}
  });
  return nodes.get(id);
 }
 const document={getElementById:el,createElement(){return {value:'',textContent:'',setAttribute(){}};}};
 class ImageMock{
  constructor(){this.naturalWidth=384;this.naturalHeight=4928;}
  set src(value){this.onload?.();}
 }
 g.VLMahlukHidup={ready:true,list:()=>[{id:'ichsan',name:'Ichsan'}],localSync(){},equipmentFor(){return {};}};
 g.VLCharacterRig={
  FRAME:{w:64,h:112,pivotX:32,pivotY:100},DIR:['se','sw','ne','nw'],
  resolve:(id,pose,moving)=>({url:'data:image/png;base64,TEST',
   mode:({toilet:'sit',bathe:'swim',work:'sit_type'}[pose]||pose||'idle'),
   frames:6,row:0,separate:false,loop:true}),
  frameAt:()=>0,directionFromWorld:()=> 'sw'
 };
 vm.runInNewContext(read('bangun-ruang/character-scale-preview.js'),{
  window:g,document,Image:ImageMock,requestAnimationFrame:fn=>{tick=fn;}
 });
 const scene=g.VLBuildingInterior.preset({w:3,d:3},'bathroom');
 scene.floor=1;
 const wc=scene.items.find(x=>x.assetId==='wc');
 let inside=false;
 const c=g.VLCharacterScale.mount({
  getConfig:()=>({w:3,d:3,front:'sw',interactive:true}),
  getFacing:()=> 'sw',getExterior:()=>({pivot:[112,158],size:[224,236]}),
  isInterior:()=>inside,getInterior:()=>scene,getInteriorView:()=> 'iso',
  getSelectedProp:()=>wc,
  openInterior:()=>{inside=true;el('interiorCanvas').hidden=false;},onStatus(){}
 });
 assert.equal(c.ACTOR_SCALE,undefined);
 assert.equal(g.VLCharacterScale.ACTOR_SCALE,.5);
 el('scaleSpawn').onclick();tick(20);tick(100);
 const ext=draws.filter(a=>a.length===9).at(-1);
 assert.ok(ext,'Expected exterior original sprite draw');
 assert.equal(ext[7],32);assert.equal(ext[8],56);
 el('scaleWalkDoor').onclick();
 for(let t=120;t<3800;t+=40)tick(t);
 assert.equal(c.actor.scene,'interior');
 const interior=draws.filter(a=>a.length===9).at(-1);
 assert.equal(interior[7],ext[7]);assert.equal(interior[8],ext[8]);
 el('scaleUse').onclick();
 for(let t=3800;t<14500;t+=40)tick(t);
 assert.equal(c.actor.pose,'toilet');
 const seat=draws.filter(a=>a.length===9).at(-1);
 assert.equal(seat[1],5*64,'Last completed sit frame must stay fixed');
 assert.equal(seat[7],ext[7]);assert.equal(seat[8],ext[8]);
});

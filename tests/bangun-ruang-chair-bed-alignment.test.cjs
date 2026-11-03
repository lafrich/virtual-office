const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const base=path.resolve(__dirname,'../world-builder/bangun-ruang');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
function modules(){
 const w={};
 for(const file of ['interior-model.js','game-proportions.js','interior-isometric.js'])
  vm.runInNewContext(read(file),{window:w});
 return w;
}
const near=(a,b)=>Math.abs(a-b)<.001;

test('chair, office chair, sofa and bed anchors follow the rendered furniture in four rotations',()=>{
 const g=modules(),iso=g.VLInteriorIso;
 for(const assetId of ['chair','office_chair','sofa','bed']){
  const anchors=[];
  for(const rotation of [0,90,180,270]){
   const item={id:'fixture',assetId,c:1,r:1,rotation};
   const anchor=iso.actionAnchor(item);
   const footprint=iso.itemFootprint(item);
   assert.ok(anchor,assetId+' missing '+rotation+' anchor');
   assert.equal(anchor.kind,assetId);
   assert.ok(anchor.c>=1&&anchor.c<=1+footprint[0]);
   assert.ok(anchor.r>=1&&anchor.r<=1+footprint[1]);
   assert.equal(anchor.direction,['sw','se','ne','nw'][rotation/90]);
   assert.equal(anchor.z,assetId==='bed'?21:0);
   assert.equal(anchor.pixelOffsetY,0);
   anchors.push([anchor.c,anchor.r]);
  }
  assert.ok(!near(anchors[0][0],anchors[1][0])||
   !near(anchors[0][1],anchors[1][1]),assetId+' rotation must move the dock');
 }
 // The source-grounded WC calibration must not change as a side effect.
 assert.equal(iso.actionAnchor({id:'wc',assetId:'wc',c:1,r:1,rotation:180}).direction,'sw');
});

test('rotated beds/chairs/sofas and their foreground occlusion render without invalid geometry',()=>{
 const g=modules(),iso=g.VLInteriorIso;
 for(const assetId of ['bed','chair','office_chair','sofa']){
  for(const rotation of [0,90,180,270]){
   const item={id:'fixture',assetId,c:1,r:1,rotation};
   const scene={width:6,depth:6,theme:'warm',entrance:{c:3,r:5},items:[item]};
   let rects=0;
   const ctx={
    fillStyle:'',
    fillRect(x,y,w,h){
     assert.ok([x,y,w,h].every(Number.isFinite),'Non-finite painted pixel');
     rects++;
    },
    clearRect(){}
   };
   const canvas={width:0,height:0,getContext:()=>ctx};
   const geometry=iso.draw(canvas,scene);
   assert.equal(geometry.hits.length,1);
   const before=rects;
   iso.drawSeatForeground(ctx,geometry,item);
   assert.ok(rects>before,'Missing furniture foreground masking '+assetId+' '+rotation);
  }
 }
});

test('Bangun Ruang walks to a bed, lies on its mattress, then sits on a chair',()=>{
 const g=modules(),scene=g.VLBuildingInterior.preset({w:6,d:6},'bedroom');
 scene.floor=1;
 const bed=scene.items.find(i=>i.assetId==='bed');
 const chair=scene.items.find(i=>i.assetId==='chair');
 assert.ok(bed&&chair);
 let selected=bed,inside=false,frame;
 const messages=[],nodes=new Map();
 function element(id){
  if(!nodes.has(id))nodes.set(id,{
   id,value:'',hidden:id==='interiorCanvas',disabled:false,style:{},
   width:id==='interiorCanvas'?454:400,height:id==='interiorCanvas'?398:450,
   naturalWidth:id==='preview'?400:undefined,naturalHeight:id==='preview'?450:undefined,
   classList:{toggle(){}},
   setAttribute(k,v){this[k]=v;},
   replaceChildren(){this.items=[];this.value='';},
   append(v){this.items??=[];this.items.push(v);if(!this.value)this.value=v.value||'';},
   addEventListener(k,fn){this['on'+k]=fn;},
   getContext(){return {drawImage(){},clearRect(){},fillRect(){},fillText(){}};},
   getBoundingClientRect(){return {
    left:0,top:0,width:id==='previewStage'?600:454,
    height:id==='previewStage'?500:398};}
  });
  return nodes.get(id);
 }
 const doc={getElementById:element,createElement:()=>({value:'',textContent:''})};
 class Sprite{constructor(){this.naturalWidth=384;this.naturalHeight=4928;}
  set src(value){this.onload?.();}}
 g.VLMahlukHidup={
  ready:true,list:()=>[{id:'human_male_base',name:'Human Male'}],
  localSync(){},equipmentFor(){return {};}
 };
 g.VLCharacterRig={
  FRAME:{w:64,h:112,pivotX:32,pivotY:100},
  DIR:['se','sw','ne','nw'],
  resolve:(id,pose)=>({
   url:'data:image/png;base64,MOCK',
   mode:({toilet:'sit',work:'sit_type'}[pose]||pose||'idle'),
   frames:6,row:0,loop:true
  }),
  frameAt:()=>0,
  directionFromWorld:(dc,dr)=>Math.abs(dc)>=Math.abs(dr)?
   (dc>0?'se':'nw'):(dr>0?'sw':'ne')
 };
 vm.runInNewContext(read('character-scale-preview.js'),{
  window:g,document:doc,Image:Sprite,requestAnimationFrame:fn=>{frame=fn;}
 });
 const actor=g.VLCharacterScale.mount({
  getConfig:()=>({w:6,d:6,floors:1,front:'sw',interactive:true}),
  getFacing:()=> 'sw',
  getExterior:()=>({pivot:[180,350],size:[400,450]}),
  isInterior:()=>inside,getInterior:()=>scene,getInteriorView:()=> 'iso',
  getSelectedProp:()=>selected,
  openInterior:()=>{inside=true;element('interiorCanvas').hidden=false;},
  onStatus:message=>messages.push(message)
 });
 element('scaleSpawn').onclick();
 element('scaleWalkDoor').onclick();
 for(let t=0;t<6500;t+=40)frame(t);
 assert.equal(actor.actor.scene,'interior');
 element('scaleUse').onclick();
 for(let t=6500;t<18000;t+=40)frame(t);
 let state=actor.actor;
 assert.equal(state.pose,'sleep');
 assert.equal(state.actionAnchor.kind,'bed');
 assert.equal(state.actionAnchor.z,21);
 assert.ok(near(state.c+.5,g.VLInteriorIso.actionAnchor(bed).c));
 assert.ok(near(state.r+.5,g.VLInteriorIso.actionAnchor(bed).r));
 assert.ok(messages.some(s=>s.includes('aligned to mattress')));
 element('scaleIdle').onclick();
 state=actor.actor;
 assert.equal(state.actionAnchor,null);
 assert.ok(g.VLCharacterScale.available(scene,state.c,state.r),
  'Getting out of bed must land on unoccupied floor');
 selected=chair;
 element('scaleUse').onclick();
 for(let t=18000;t<30000;t+=40)frame(t);
 state=actor.actor;
 assert.equal(state.pose,'sit');
 assert.equal(state.actionAnchor.kind,'chair');
 assert.ok(near(state.c+.5,g.VLInteriorIso.actionAnchor(chair).c));
 assert.ok(messages.some(s=>s.includes('aligned to seat')));
 element('scaleIdle').onclick();
 assert.ok(g.VLCharacterScale.available(scene,actor.actor.c,actor.actor.r),
  'Getting up from a chair must restore a walkable location');
});

test('chair and bed docking are preview-only; saved building data has no preview actor',()=>{
 const html=read('index.html');
 assert.ok(html.includes('interior-isometric.js?v=furniture-v10'));
 assert.ok(html.includes('character-scale-preview.js?v=chair-bed-v2'));
 const start=html.indexOf('function buildAsset()'),end=html.indexOf('function persist(',start);
 assert.ok(start>=0&&end>start);
 assert.ok(!html.slice(start,end).includes('actionAnchor'));
});

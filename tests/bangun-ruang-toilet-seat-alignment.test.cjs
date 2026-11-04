const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'../world-builder');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
function modules(){
 const w={};
 vm.runInNewContext(read('bangun-ruang/action-adjustment.js'),{window:w});
 vm.runInNewContext(read('bangun-ruang/interior-model.js'),{window:w});
 vm.runInNewContext(read('bangun-ruang/interior-isometric.js'),{window:w});
 return w;
}
test('WC seat anchor is located at the actual porcelain seat in all four directions',()=>{
 const g=modules(),iso=g.VLInteriorIso;
 const expected=[
  [0,1.61,1.69,'sw'],[90,1.31,1.61,'sw'],
  [180,1.39,1.31,'sw'],[270,1.69,1.39,'sw']
 ];
 for(const [rotation,c,r,dir] of expected){
  const item={id:'wc',assetId:'wc',c:1,r:1,rotation};
  const seat=iso.actionAnchor(item);
  assert.ok(seat,'Missing seat at '+rotation);
  assert.ok(Math.abs(seat.c-c)<.001,'WC C coordinate '+rotation);
  assert.ok(Math.abs(seat.r-r)<.001,'WC R coordinate '+rotation);
  assert.equal(seat.direction,dir);
  assert.equal(seat.pixelOffsetY,0);
  assert.equal(seat.itemId,'wc');
 }
});
test('Mahluk Hidup walking → WC sit pose docks onto WC, then Idle moves back to a free tile',()=>{
 const g=modules(),room=g.VLBuildingInterior.preset({w:3,d:3},'bathroom');
 room.floor=1;
 const wc=room.items.find(i=>i.assetId==='wc');
 assert.ok(wc);
 const events=[];
 let adjustedByDrag=null;
 let callback;
 const nodes=new Map();
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
   getContext(){return {drawImage(){},clearRect(){},fillRect(){},fillText(){},strokeRect(){}};},
   getBoundingClientRect(){return {left:0,top:0,width:id==='previewStage'?600:454,height:id==='previewStage'?500:398};}
  });
  return nodes.get(id);
 }
 const document={getElementById:element,createElement(){return {value:'',textContent:'',setAttribute(){}};}};
 class ImageMock{
  constructor(){this.naturalWidth=384;this.naturalHeight=4928;}
  set src(s){this.onload?.();}
 }
 g.VLMahlukHidup={
  ready:true,list:()=>[{id:'human_male_base',name:'Human Male'}],
  localSync(){},equipmentFor(){return {};}
 };
 g.VLCharacterRig={
  FRAME:{w:64,h:112,pivotX:32,pivotY:100},
  DIR:['se','sw','ne','nw'],
  resolve:(id,pose,moving)=>({
   url:'data:image/png;base64,MOCK',
   mode:({toilet:'sit',bathe:'swim',work:'sit_type'}[pose]||pose||'idle'),
   frames:6,row:0,separate:false,loop:true
  }),
  frameAt:()=>0,
  directionFromWorld:(x,z)=>Math.abs(x)>=Math.abs(z)?
   (x>0?'se':'nw'):(z>0?'sw':'ne')
 };
 vm.runInNewContext(read('bangun-ruang/character-scale-preview.js'),{
  window:g,document,Image:ImageMock,requestAnimationFrame:fn=>{callback=fn;}
 });
 let inside=false;
 const cfg={w:3,d:3,floors:1,front:'sw',interactive:true};
 const player=g.VLCharacterScale.mount({
  getConfig:()=>cfg,getFacing:()=> 'sw',
  getExterior:()=>({pivot:[180,350],size:[400,450]}),
  isInterior:()=>inside,getInterior:()=>room,getInteriorView:()=> 'iso',
  getSelectedProp:()=>wc,
  openInterior:()=>{inside=true;element('interiorCanvas').hidden=false;},
  onStatus:msg=>events.push(msg),
  onAdjustmentChange:v=>adjustedByDrag=v
 });
 element('scaleSpawn').onclick();
 element('scaleWalkDoor').onclick();
 for(let t=0;t<5000;t+=40)callback(t);
 assert.equal(player.actor.scene,'interior');
 element('scaleUse').onclick();
 for(let t=5000;t<16500;t+=40)callback(t);
 const seated=player.actor;
 assert.equal(seated.pose,'toilet');
 assert.equal(seated.direction,'sw');
 assert.equal(seated.actionAnchor.itemId,wc.id);
 assert.ok(Math.abs(seated.c+.5-(wc.c+.61))<.001);
 assert.ok(Math.abs(seated.r+.5-(wc.r+.69))<.001);
 assert.ok(events.some(s=>s.includes('aligned to seat')));
 assert.equal(player.beginAdjustment({x:5,y:-3,direction:'se',layer:'front'}),true);
 assert.equal(player.actor.adjusting,true);
 assert.equal(player.actor.actionAnchor.pixelOffsetX,5);
 assert.equal(player.actor.actionAnchor.objectLayer,'front');
 assert.equal(player.actor.direction,'se');
 const overlay=element('characterScaleCanvas');
 overlay.onpointerdown({pointerId:7,clientX:80,clientY:55,preventDefault(){}});
 overlay.onpointermove({pointerId:7,clientX:100,clientY:68,preventDefault(){}});
 overlay.onpointerup({pointerId:7,preventDefault(){}});
 assert.ok(adjustedByDrag,'Dragging must notify the Actions position inspector');
 assert.equal(adjustedByDrag.x,25);
 assert.equal(adjustedByDrag.y,10);
 assert.equal(player.actor.actionAnchor.pixelOffsetX,25);
 element('scaleIdle').onclick();
 const standing=player.actor;
 assert.equal(standing.pose,'idle');
 assert.equal(standing.actionAnchor,null);
 assert.ok(g.VLCharacterScale.available(room,standing.c,standing.r),
  'Standing actor must leave the occupied WC tile');
 assert.equal(standing.c,1);
 assert.equal(standing.r,2);
});
test('native seat pivot remains canonical; only saved per-action offsets belong in building JSON',()=>{
 const html=read('bangun-ruang/index.html');
 const start=html.indexOf('function buildAsset()');
 const end=html.indexOf('function persist(',start);
 assert.ok(start>0&&end>start);
 const save=html.slice(start,end);
 assert.ok(!save.includes('actionAnchor'));
 assert.ok(!save.includes('scaleController'));
 assert.ok(html.includes('interior-isometric.js?v=action-alignment-v1'));
 assert.ok(html.includes('character-scale-preview.js?v=action-alignment-v1'));
});

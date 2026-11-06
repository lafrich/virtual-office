/* Real no-AI facade drawing regression + direct furniture drag wiring. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const nodePath=require('node:path');
const root=nodePath.join(__dirname,'..');
const html=fs.readFileSync(nodePath.join(root,'world-builder/bangun-ruang/index.html'),'utf8');
const control=fs.readFileSync(nodePath.join(root,'world-builder/bangun-ruang/studio-interior-ui.js'),'utf8');
const generator=require('../world-builder/bangun-ruang/procedural-generator.js');
function getFunction(begin,end){
 const start=html.indexOf(begin),stop=html.indexOf(end,start+begin.length);
 assert.ok(start!==-1&&stop>start,'Missing renderer function '+begin);
 return html.slice(start,stop);
}
const palette={
 cream:['#F4EBDA','#E8DEC6','#D4C8AE','#C3AD8D','#9B866F'],
 terracotta:['#F2A066','#E8894A','#C9692F','#9A6A3E','#6B4F3A'],
 slate:['#D4C8AE','#B8B2A8','#9D9A91','#766B59','#535969'],
 concrete:['#C7CFDC','#A7B2C4','#8D97A8','#788197','#535969'],
 blue:['#CEDBFF','#86CCFF','#3AA6F2','#2479CC','#1D5E80'],
 green:['#86E59A','#4FB36B','#2A9A52','#22894A','#1A6A3A'],
 pink:['#FFDDBE','#FFC2B8','#FF8AA2','#EE4D72','#BE2F56'],
 navy:['#86CCFF','#3F7FE0','#2C6BD8','#2457B8','#1A3F87']
};
const shape=new Function('return '+getFunction('function shape(ctx,pts,color){','function makeView(c,dir){'))();
function render(config,dir){
 let coloredSpans=0,totalSpans=0;
 const ctx={fillStyle:'#fff',fillRect(x,y,w,h){
   assert.ok([x,y,w,h].every(Number.isFinite),'Non-finite painted pixel');
   if(w>0&&h>0)totalSpans++;
   if(w>0&&h>0&&this.fillStyle!=='rgba(0,0,0,0.2196078431)')coloredSpans++;
 }};
 const canvas={width:0,height:0,getContext(){return ctx;},toDataURL(){return 'data:image/png;base64,TEST';}};
 const document={createElement(kind){assert.equal(kind,'canvas');return canvas;}};
 const semesta={byId:()=>null};
 const factory=new Function('semesta','palette','window','document','shape',
  'return '+getFunction('function makeView(c,dir){','function viewResult(c,d){'));
 const makeView=factory(semesta,palette,{},document,shape);
 const result=makeView(config,dir);
 return {...result,spans:coloredSpans,totalSpans};
}
const base=generator.make('ruko',{seed:55,w:6,d:6,floors:3,wall:'cream',roof:'slate'}).config;
test('Rich 2:1 facades draw measurably more actual pixel geometry in four orientations',()=>{
 for(const dir of ['sw','se','ne','nw']){
  const simple=render({...base,detailLevel:'simple'},dir);
  const standard=render({...base,detailLevel:'standard'},dir);
  const rich=render({...base,detailLevel:'rich'},dir);
  assert.ok(standard.spans>simple.spans,'standard should draw more than simple '+dir);
  assert.ok(rich.spans>standard.spans,'rich should draw more than standard '+dir);
  assert.deepEqual(rich.size,[rich.size[0],rich.size[1]]);
  assert.ok(rich.size[0]>0&&rich.size[1]>0&&rich.pivot[0]>=0&&rich.pivot[1]>0);
  assert.ok(rich.pivot[0]<rich.size[0]&&rich.pivot[1]<rich.size[1]);
 }
});
test('Rich recipe is default and stays a reproducible seed after Save',()=>{
 const a=generator.make('kantor',{seed:478}),b=generator.make('kantor',{seed:478});
 assert.equal(a.config.detailLevel,'rich');
 assert.equal(a.config.facadeSeed,478);
 assert.deepEqual(a,b);
 assert.match(html,/generationRecipe:generationRecipe/);
 assert.match(html,/detailLevel:'standard',facadeSeed:1/);
});
test('Direct grab uses furniture polygons and snaps to valid tiles without extra move mode',()=>{
 for(const fragment of [
  'function beginFreeDrag(e,item)',
  "handle:'free'",
  'hit?.itemId',
  'beginFreeDrag(e,item);',
  'Math.hypot(dx,dy)<4',
  'model.move(scene(),item.id,c,r)',
  "canvas.style.touchAction='none'",
  'canvas.setPointerCapture?.(e.pointerId)',
  "e.type==='pointercancel'",
  'recordUndo(d.before);renderObjects();renderActions();'
 ])assert.ok(control.includes(fragment),'Missing direct-drag behavior: '+fragment);
 assert.ok(control.includes('api.onFloorClick?.(c,z,hit)===true'),'Actor adjustment click priority lost');
});

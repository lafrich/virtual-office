const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const F=require('../emotion-studio/frame-order.js');
const html=fs.readFileSync(path.join(__dirname,'../emotion-studio/index.html'),'utf8');

test('moves full frames by index, preserving identity and order',()=>{
 assert.deepEqual(F.move(5,1,3),[0,2,3,1,4]);
 assert.deepEqual(F.move(5,4,0),[4,0,1,2,3]);
 assert.deepEqual(F.fromSlot(5,1,4),[0,2,3,1,4]);
 assert.deepEqual(F.fromSlot(5,3,1),[0,3,1,2,4]);
 assert.deepEqual(F.fromSlot(3,1,2),[0,1,2]);
 assert.deepEqual(F.fromSlot(3,0,3),[1,2,0]);
});
test('duplicate inserts after selected frame, not at the end',()=>{
 assert.deepEqual(F.duplicateAfter(5,1),[0,1,1,2,3,4]);
 assert.deepEqual(F.duplicateAfter(1,0),[0,0]);
 assert.deepEqual(F.duplicateAfter(4,3),[0,1,2,3,3]);
});
test('bad moves and >48 duplicate never corrupt atlas state',()=>{
 assert.throws(()=>F.move(3,4,1));
 assert.throws(()=>F.fromSlot(2,1,3));
 assert.throws(()=>F.duplicateAfter(48,0));
 assert.throws(()=>F.duplicateAfter(0,0));
});
test('atlas reorder copies every frame as 64 x 448 including all SE SW NE NW',()=>{
 const atlas={width:4*64,height:448},draws=[];
 const out=F.compose(atlas,[2,0,3,1],()=>({
  getContext(){return{
   imageSmoothingEnabled:true,
   drawImage(...args){draws.push(args);}
  };}
 }));
 assert.equal(out.width,4*64);assert.equal(out.height,448);
 assert.equal(draws.length,4);
 for(let i=0;i<4;i++){
  const d=draws[i];
  assert.equal(d[0],atlas);
  assert.deepEqual(d.slice(1),[[2,0,3,1][i]*64,0,64,448,i*64,0,64,448]);
 }
});
test('duplicated frame remains exact image copy across all four views',()=>{
 const src={width:3*64,height:448},calls=[];
 const out=F.compose(src,F.duplicateAfter(3,1),()=>({
  getContext(){return{drawImage(...args){calls.push(args);}}}
 }));
 assert.equal(out.width,256);
 assert.deepEqual(calls.map(c=>c[1]),[0,64,64,128]);
 assert.ok(calls.every(c=>c[3]===64&&c[4]===448&&c[7]===64&&c[8]===448));
});
test('Emotion Studio wires drag/drop, pointer grip and nudge buttons to atlas compose',()=>{
 for(const x of [
  './frame-order.js',
  'id="frameMoveLeft"',
  'id="frameMoveRight"',
  'draggable=selected.frames>1',
  'b.addEventListener("dragstart"',
  'b.addEventListener("drop"',
  'handle.addEventListener("pointerdown"',
  'handle.addEventListener("pointermove"',
  'handle.addEventListener("pointerup"',
  'F.fromSlot(selected.frames,source,slot)',
  'F.duplicateAfter(selected.frames,source)',
  'F.compose(atlas,order',
  'function nudgeFrame(delta)',
  'mark();',
  'selected.frames++;frame=source+1;mark()'
 ])assert.ok(html.includes(x),'Missing timeline integration: '+x);
 const inline=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map(match=>match[1]).filter(x=>x.trim());
 for(const js of inline)assert.doesNotThrow(()=>new Function(js),'Inline script parses');
});

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scene=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_minimarket.interior-scene.json'));
const runtime=read('world-builder/njh-play-interiors.js');

test('NJH MART supplies all five mandatory painted wall zones',()=>{
 const layers=new Map(scene.paint.layers.map(x=>[x.layer,x]));
 assert.deepEqual([...layers.keys()],['dado','trim','midDisplay','identity','ceiling']);
 for(const [name,lo,hi] of [['dado',0,49],['trim',50,50],['midDisplay',56,70],['identity',69,116],['ceiling',108,120]]){
  assert.deepEqual(layers.get(name)?.z,[lo,hi],name+' should cover its official source band');
 }
});
test('runtime bakes declared paint as a nearest-neighbor CanvasTexture on both walls',()=>{
 assert.match(runtime,/function bakeMartWall\(side\)/);
 assert.match(runtime,/sc\.paint\?\.layers/);
 for(const name of ['dado','trim','midDisplay','identity','ceiling'])
  assert.ok(runtime.includes("'"+name+"'"),name+' must have visible pixels');
 assert.match(runtime,/themeKind==='minimarket'\?bakeMartWall\(side\):bake\(side\)/);
 assert.match(runtime,/tex\.magFilter=THREE\.NearestFilter/);
 assert.match(runtime,/ctx\.imageSmoothingEnabled=false/);
});

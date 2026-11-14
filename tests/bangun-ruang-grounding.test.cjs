'use strict';
// Semesta 2:1 studio sprites: the image apron lives below the centre ground
// pivot IN PIXELS, but must never be clipped by a real 3D grass floor.
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../world-builder');
const get=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const window={};
vm.runInNewContext(get('studio-sprite-grounding.js'),{window});
const helper=window.VLSemestaStudioSprite;
const sprite={source:'custom-building',size:[430,380],pivot:[215,192],
 variants:{sw:{size:[430,380],pivot:[215,192]},
           se:{size:[412,371],pivot:[206,186]},
           ne:{size:[430,380],pivot:[215,192]},
           nw:{size:[412,371],pivot:[206,186]}}};
test('native studio isometric PNG has positive material BELOW pivot, not negative gameplay elevation',()=>{
 assert.equal(helper.isStudio(sprite),true);
 assert.equal(helper.isStudio({source:'pipeline-street'}),false);
 for(const rot of [0,90,180,270]){
  const met=helper.metrics(sprite,rot);
  assert(met.height>0);
  assert(met.belowPivot>0);
  assert(met.nativeHeight>met.height);
  assert(met.height<met.nativeHeight);
 }
 assert.equal(helper.metrics(sprite,90).facing,'se');
 assert.equal(helper.metrics(sprite,180).facing,'ne');
 assert.equal(helper.metrics(sprite,0,1.15).height>helper.metrics(sprite,0,1).height,true);
});
test('only custom-building art is composited above ground; all other sprites retain depth',()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(helper.spriteMaterial())),{
  transparent:true,depthTest:false,depthWrite:false,alphaTest:.5});
 const builder=get('builder.js');
 assert.match(builder,/const studio=studioSprites\?\.isStudio\(spec\)===true/);
 assert.match(builder,/studio\?\{\.\.\.studioSprites\.spriteMaterial\(\)\}/);
 assert.match(builder,/if\(studio&&playerMode\)/);
 assert.match(builder,/flags\.transparent=false;flags\.alphaTest=\.5;flags\.depthWrite=false/);
 assert.match(builder,/updateStudioActorLayer\(\)/);
 assert.match(builder,/\{transparent:false,depthTest:true,depthWrite:true,alphaTest:\.5\}/);
 assert.match(builder,/plane\.renderOrder=2/);
});
test('selection frame follows footprint and visible above-ground height, not raster below-pivot bounds',()=>{
 const builder=get('builder.js'),guide=get('building-outline.js');
 assert.match(builder,/function selectionGuide\(cur\)/);
 assert.match(builder,/new THREE\.Box3Helper\(bounds,0xf5df42\)/);
 assert.match(builder,/const \[w,d\]=style\.footprint\(obj,assetByName\)/);
 assert.match(builder,/const h=studioSprites\.metrics\(spec,obj\.rotation,obj\.scale\)\.height/);
 assert.match(builder,/bounds\.min\.set\(x-w\/2,y\+\.02,z-d\/2\)/);
 assert.match(builder,/bounds\.max\.set\(x\+w\/2,y\+Math\.max\(1,h\),z\+d\/2\)/);
 assert.match(builder,/highlight=selectionGuide\(cur\)/);
 assert.match(guide,/meta\?\.source==='custom-building'/);
});
test('Semesta saves custom building collision and entrance metadata while correcting height',()=>{
 const source=get('bangun-ruang/semesta-bridge.js');
 const context={window:{VLAssetCatalog:[]},localStorage:{
  getItem(){return JSON.stringify([{
   id:'br-warteg-20261104',name:'Warteg Kharisma Bahari',config:{w:8,d:6,collision:'yes'},
   views:Object.fromEntries(['sw','se','ne','nw'].map(d=>[d,{url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
    size:[430,380],pivot:[215,192]}])),
   entranceFacing:'sw',interactive:true,enterable:true,
   entrance:{facing:'sw'},interior:{format:'virtual-life-interiors-v1',floors:[{entrance:{c:3,r:5},items:[]}]},
   actionSlots:[{id:'counter',interaction:'buy'}]
  }]);}
 },console};
 vm.runInNewContext(source,context);
 const registered=context.window.VLAssetCatalog[0];
 assert.equal(registered.source,'custom-building');
 assert.equal(registered.height<registered.size[1]/50,true);
 assert.equal(registered.height>0,true);
 assert.equal(registered.footprint.join(','),'8,6');
 assert.equal(registered.interactive,true);
 assert.equal(registered.enterable,true);
 assert.equal(registered.actionSlots[0].interaction,'buy');
});
test('Semesta loads studio sprite grounding before its world renderer',()=>{
 const html=get('index.html');
 assert(html.indexOf('studio-sprite-grounding.js')<html.indexOf('builder.js?v='));
});

test('studio camera sort draws player ahead of building only on its foreground footprint',()=>{
 const b={x:0,z:0},camera={x:1,z:1};
 assert.equal(helper.actorInFront({x:1.5,z:1.5},b,camera,[5,4]),true);
 assert.equal(helper.actorInFront({x:-1.5,z:-1.5},b,camera,[5,4]),false);
 assert.equal(helper.actorInFront({x:20,z:20},b,camera,[5,4]),false);
 assert.equal(helper.actorInFront({x:1,z:-1},b,camera,[5,4]),false);
 const builder=get('builder.js');
 assert.match(builder,/plane\.renderOrder=close\?/);
 assert.match(builder,/studioSprites\.actorInFront\(p,o,direction,foot\)/);
 assert.match(builder,/node\.renderOrder=nearStudio\?2:node\.userData\.njhBaseOrder/);
});

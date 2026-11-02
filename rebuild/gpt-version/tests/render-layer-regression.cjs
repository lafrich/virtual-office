/* node rebuild/gpt-version/tests/render-layer-regression.cjs
 * Test original two-canvas depth sorting, not an alpha "player always on top" hack.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
assert.ok(!code.includes('__gptPunchFront'),'player must not override foreground NPC/car occlusion');
assert.ok(!code.includes("if(floorRoad&&g.getAttribute"),'do not hide whole foreground and blank background');
assert.ok(code.includes('v16DepthSkip(far)'),'compositor should depth-sort individual sprites');
assert.ok(code.includes('S2.ready&&!S2.fail&&S2.url&&xcImg(S2.url)'),'do not switch layers before the base image is decoded');
assert.ok(code.includes('var far=V16.farLoaded'),'do not switch before level overlays finish loading');

const gC={name:'native-car-and-pedestrian-group'},npc={name:'crossing NPC',parentNode:gC};
const cars=Array.from({length:15},(_,i)=>({
  name:'car-'+i,style:{},attrs:{},_vk:'old',parentNode:gC,
  setAttribute(k,v){this.attrs[k]=v;}
}));
const S2X={made:true,cfg:{levels:[],region:{lane:[21.85,24.15,37.6,52.05]},crossers:{file:'crossers.png'}},cr:[],sig:{off:0},far:false,gFB:{name:'far-behind'}};
const state={self:{},window:{},console,OUT_ON:true,S2X,EXT:{built:true,cars,gC,yard:{r0:28,r1:32},blk:[]},
  XC:{skip:null},S2:{ready:true,fail:false,url:'data:image/png;base64,TEST'},
  me:{c:22.5,r:32.2,path:[],forceAnim:null},WT:{on:false},CV:{on:false},FMI:{on:false},SPEC:false,
  XG:{curbF:36.3},S2XA:'assets/street2/xing/',S2LA:'assets/street2/loak/',S2L:{props:[]},
  Date:{now:()=>1767225605000},performance:{now:()=>1000},
  xcImg:()=>({naturalWidth:16}),vSprSet:(w,k)=>{w._vk=k},vRidSet:(w,k)=>{w._vk=k},
  s2xInFar:()=>true,s2xFar:on=>{S2X.far=on},
  s2xFarDepth:()=>{S2X.lv={g:{name:'baked-level'}}},s2xPlace:()=>{},extOK:()=>true,say:()=>{}};
vm.createContext(state);
vm.runInContext(code,state);
vm.runInContext('gptWorldV16()',state);
const tick=state.window.__s2xTick;

for(const r of [32.2,33.4,34.25,35.15,36.95,35.1]){
  state.me.r=r;
  tick(.016);
  const skipped=state.XC.skip||[];
  assert.ok(!skipped.includes(gC),'never put all cars AND crossing pedestrians behind at once');
  assert.ok(!skipped.includes(npc),'do not silently force NPC behind the player');
  assert.ok(cars.some(w=>skipped.includes(w)),'some vehicles are behind the player');
  if(r===36.95){assert.ok(S2X.far);assert.ok(skipped.includes(S2X.lv.g),'flat baked road belongs behind player');}
}
state.S2.url=null;
state.me.r=37;
tick(.016);
assert.equal(S2X.far,false,'no far-side mode before base image is ready');
state.S2.url='data:image/png;base64,TEST';
tick(.016);
assert.equal(S2X.far,true,'far-side mode resumes after base decode');
console.log('PASS: native foreground retained, 15 vehicles split by depth, NPC not forced below, base/loading transition guarded.');

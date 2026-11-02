"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const runtime=require("../game-assets/rig-runtime.js");
const bridgeSrc=fs.readFileSync(path.join(__dirname,"../game-assets/asset-bridge.js"),"utf8");
const gameSrc=fs.readFileSync(path.join(__dirname,"../rebuild/game.js"),"utf8");
const coveSrc=fs.readFileSync(path.join(__dirname,"../cove-reskin.js"),"utf8");
const swSrc=fs.readFileSync(path.join(__dirname,"../sw.js"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"../rebuild/index.html"),"utf8");

assert.ok(html.includes("../game-assets/asset-bridge.js"));
assert.ok(html.indexOf("asset-bridge.js")<html.indexOf("game.js"));
assert.ok(gameSrc.includes("VOAssetBridge?.draw(g,p,zoom"));
assert.ok(coveSrc.includes("VOAssetBridge?.draw(ctx,p,.73"));
assert.ok(swSrc.includes("u.searchParams.get('assetbridge') === '1'"));
assert.ok(swSrc.includes("'game-assets/asset-bridge.js'"));
assert.ok(swSrc.includes("if (p === 'office.html'"));
assert.ok(!swSrc.includes("fetch(SCOPE + 'data.json"));

// Readable test fixtures that behave like the published Rig Studio JSON packs.
const characters=[
 {id:"ichsan",name:"Ichsan",model_type:"HUMANOID",pack:"motion-packs/ichsan.json",ready_count:1},
 {id:"legacy_gfunk",name:"Gfunk",model_type:"ALIEN_SUIT",pack:"motion-packs/legacy_gfunk.json",ready_count:1}
];
function clip(id,atlas){
 return {id,status:"ready",name:id.toUpperCase(),atlas,rows:44,columns:6,
  row_start:0,frames:6,frame_ms:[140,140,140,140,140,140],loop:true};
}
const data={
 "rigs.json":{version:1,types:[{id:"HUMANOID"},{id:"ALIEN_SUIT"}],characters},
 "motion-packs/ichsan.json":{format:"virtual-life-sprite-motion-v1",actor:"ichsan",
  model_type:"HUMANOID",clips:[clip("walk","media/ichsan-sheet.png")]},
 "motion-packs/legacy_gfunk.json":{format:"virtual-life-sprite-motion-v1",actor:"legacy_gfunk",
  model_type:"ALIEN_SUIT",clips:[clip("move","media/legacy_gfunk-sheet.png")]}
};
function node(tag="div"){
 return {tag,children:[],hidden:false,style:{},disabled:false,
  append(...children){this.children.push(...children);},
  replaceChildren(...children){this.children=children;},
  setAttribute(k,v){this[k]=v;},addEventListener(){},getContext(){return{
   fillRect(){},drawImage(){},imageSmoothingEnabled:false,
  }}};
}
function makeContext(search){
 const listeners={};const requests=[];
 const document={readyState:"loading",head:node("head"),body:node("body"),
  createElement:node,addEventListener(k,cb){listeners[k]=cb}};
 const window={location:{search},VirtualLifeRig:runtime};
 let tick=1000;
 class MockImage{
  constructor(){this.naturalWidth=0;this.naturalHeight=0;}
  set src(url){this._src=url;this.naturalWidth=384;this.naturalHeight=4928;
   queueMicrotask(()=>this.onload&&this.onload());}
  get src(){return this._src;}
 }
 const context={window,document,Image:MockImage,URL,URLSearchParams,
  performance:{now:()=>tick},requestAnimationFrame(){},
  fetch:async url=>{
   requests.push(url);
   const key=url.replace("https://lafrich.github.io/virtual-life-asset-pipeline/","");
   if(!Object.hasOwn(data,key))return{ok:false,status:404};
   return{ok:true,json:async()=>data[key]};
  },
  navigator:{clipboard:{writeText:async()=>{}}},
  console,Promise,queueMicrotask
 };
 vm.runInNewContext(bridgeSrc,context,{filename:"asset-bridge.js"});
 return{window,listeners,requests,now:n=>tick=n};
}
const normal=makeContext("");
assert.equal(normal.window.VOAssetBridge.enabled,false);
assert.equal(normal.window.VOAssetBridge.draw(),false);
assert.equal(normal.requests.length,0);
assert.equal(Object.keys(normal.listeners).length,0);

async function flush(){for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));}
(async()=>{
 const test=makeContext("?assetbridge=1&cove=1");
 assert.equal(test.window.VOAssetBridge.enabled,true);
 assert.equal(test.window.VOAssetBridge.draw(null,null,1),false);
 test.listeners.DOMContentLoaded();
 await flush();
 const bridge=test.window.VOAssetBridge;
 assert.equal(bridge.getStatus().status,"ready");
 assert.equal(bridge.getStatus().actor,"ichsan");
 assert.ok(test.requests.some(u=>u.endsWith("rigs.json")));
 assert.ok(test.requests.some(u=>u.endsWith("motion-packs/ichsan.json")));
 const calls=[];
 const g={save(){},restore(){},drawImage(...args){calls.push(args);},imageSmoothingEnabled:true};
 test.now(2000);
 const p={x:100,y:140};
 assert.equal(bridge.draw(g,p,1,{direction:"sw",moving:true}),true);
 assert.equal(calls.length,1);
 assert.equal(calls[0][2],112); // SW source y=112
 assert.equal(bridge.draw(g,p,1,{direction:"se",pose:"toilet"}),false);
 assert.equal(bridge.draw(g,p,1,{actorId:"legacy_gfunk",instanceId:"npc-7",actionId:"move",moving:true}),false);
 await flush();
 assert.equal(bridge.draw(g,p,1,{actorId:"legacy_gfunk",instanceId:"npc-7",actionId:"move",moving:true}),false);
 await flush();
 assert.equal(bridge.draw(g,p,1,{actorId:"legacy_gfunk",instanceId:"npc-7",actionId:"move",moving:true}),true);
 assert.equal(bridge.getStatus().actor,"ichsan","NPC rendering must not change selected player");
 assert.equal(await bridge.preloadActor("missing_actor"),null);
 assert.equal(test.requests.every(u=>u.startsWith("https://lafrich.github.io/virtual-life-asset-pipeline/")),true);
 console.log("PASS: default-off, live opt-in, original actor sprite rendering, 4-dir, missing-pose fallback, multi-NPC and safe remote source");
})().catch(e=>{console.error(e);process.exitCode=1;});

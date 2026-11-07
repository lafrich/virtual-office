"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const test=require("node:test");
const root=path.join(__dirname,"..");

function loadRig(catalog){
 const byId=new Map(catalog.map(c=>[c.id,c]));
 const window={
  VLUniversalSleep:{
   isSleep:id=>id==="sleep_bed_right"||id==="sleep_bed_left",
   getSource(ch){
    if(!ch)return null;
    const motion=(Array.isArray(ch.motions)?ch.motions:[])
     .find(m=>m.id==="lie"&&m.available===true);
    if(motion){
     const separate=typeof motion.sheet==="string"&&motion.sheet.startsWith("media/");
     return {sheet:separate?motion.sheet:ch.sheet,row:separate?0:Number(motion.row),
      frames:4,source:"native-lie",separate};
    }
    if(ch.row_starts?.lie===36)
     return {sheet:ch.sheet,row:36,frames:4,source:"native-lie",separate:false};
    return null;
   },
   resolve(ch,action){
    if(!this.isSleep(action))return null;
    const source=this.getSource(ch);
    return source?{...source,id:action,frame_ms:[380,430,470,430]}:null;
   },
   directionFor(action,dir){return dir||"se";},
   DELAYS:[380,430,470,430]
  },
  VLMahlukHidup:{
   has:id=>byId.has(id),
   get:id=>byId.get(id)||null,
   url:sheet=>sheet?("https://example.test/"+sheet):null,
   referenceReset:false
  }
 };
 vm.runInNewContext(fs.readFileSync(path.join(root,"world-builder/pipeline-character-rig.js"),"utf8"),{window});
 return window.VLCharacterRig;
}

const ichsan={
 id:"ichsan",name:"ICHSAN",sheet:"media/ichsan-sheet.png",
 row_starts:{walk:0,idle:4,talk:8,sit:12,sit_type:16,sleep:20,tired:24,swim:28,float:32,lie:36,perch:40},
 motions:[
  {id:"idle",row:4,available:true,frames:4},
  {id:"walk",row:0,available:true,frames:6},
  {id:"talk",row:8,available:true,frames:4},
  {id:"sit",row:12,available:true,frames:4}
 ]
};
const male={
 id:"human_male_base",name:"Human / Male Base",sheet:"media/human-male-base-sheet.png",
 category:"human",baseId:"human_male_base",
 row_starts:{walk:0,idle:4},
 motions:[
  {id:"idle",row:4,available:true,frames:4},
  {id:"lie",name:"LIE",available:true,frames:4,row:0,
   sheet:"media/human-male-base-action-lie.png"}
 ]
};

test("Ichsan pose lie uses V6B row 36 side-lie, not the unavailable head-blob",()=>{
 const rig=loadRig([ichsan]);
 const miss=rig.resolve("ichsan","wave_hello",false);
 assert.equal(miss.unavailable,true);
 const lie=rig.resolve("ichsan","lie",false);
 assert.equal(lie.unavailable,undefined);
 assert.equal(lie.mode,"lie");
 assert.equal(lie.row,36);
 assert.match(lie.url,/ichsan-sheet\.png$/);
 assert.equal(lie.source,"universal-sleep");
});

test("v6p Male authored lie sheet is used for pose lie",()=>{
 const rig=loadRig([male]);
 const lie=rig.resolve("human_male_base","lie",false);
 assert.equal(lie.unavailable,undefined);
 assert.equal(lie.mode,"lie");
 assert.equal(lie.row,0);
 assert.match(lie.url,/human-male-base-action-lie\.png$/);
});

test("floor mattress sleep still reaches the same native-lie frames via sleep_bed_right",()=>{
 const rig=loadRig([ichsan]);
 const sleep=rig.resolve("ichsan","sleep",false);
 assert.equal(sleep.unavailable,undefined);
 assert.equal(sleep.mode,"sleep_bed_right");
 assert.equal(sleep.row,36);
});

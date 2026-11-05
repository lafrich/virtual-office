'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const script=read('mahluk-hidup-bridge.js'),renderer=read('pipeline-character-rig.js');
new Function(script);new Function(renderer);
const id='custom_human_wardrobe-01',hair='preset_human_male_base_hair_short_c4b352b';
const png='data:image/png;base64,YQ==',directions=['se','sw','ne','nw'];
const frames=Object.fromEntries(directions.map(d=>[d,png]));
const actor={id:'human_male_base',name:'Human Male',template:true,
 template_category:'human',gender:'male',sheet:'media/human-male-base-sheet.png',
 motions:[{id:'idle',available:true,source:'custom',frames:4,
  sheet:'media/human-male-base-action-idle.png',row:0}]};
const local={
 'virtual-life-character-storage-v1':JSON.stringify([{id,name:'Customized',base:'human_male_base',skinTone:'tan'}]),
 'virtual-life-accessories-v1':JSON.stringify([{id:hair,category:'hair',
  template_base:'human_male_base',frames,back_frames:{...frames}}]),
 'virtual-life-accessory-equipment-v1':JSON.stringify({[id]:{hair}})
};
const localStorage={getItem:key=>local[key]||null,setItem:(k,v)=>{local[k]=v;}};
const window={VLHumanGameplayRig:{compile(){return {ready:true,forActor(){return null;}}}}};
const context={window,location:{origin:'https://lafrich.github.io'},
 URL,Map,AbortController,localStorage,
 fetch:async()=>({ok:true,json:async()=>({version:1,characters:[actor]})})};
vm.runInNewContext(script,context);
(async()=>{
 await window.VLMahlukHidup.load();
 const custom=window.VLMahlukHidup.get(id);
 assert.equal(custom?.baseId,'human_male_base');
 assert.equal(custom?.skinTone,'tan');
 const item=window.VLMahlukHidup.equipmentFor(id).hair;
 assert.ok(item,'Custom hair must be synchronized');
 assert.deepEqual(Object.keys(item.back_frames),directions);
 assert.deepEqual(Object.keys(item.frames),directions);
 assert.match(renderer,/rearHair\?\.ready/);
 assert.match(renderer,/if\(rearHair\)q\.drawImage\(rearHair,0,0,64,112\)/);
 assert.match(renderer,/equip\.hair\?\.back_frames\?\.\[dir\]/);
 console.log('PASS custom Human native rear hair stays behind original head in Semesta and Bangun Ruang');
})().catch(e=>{console.error(e);process.exitCode=1});

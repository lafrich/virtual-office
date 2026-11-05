'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../world-builder'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const html of [read('index.html'),read('bangun-ruang/index.html')]){
 assert.match(html,/human-gameplay-rig\.js\?v=base-human-gameplay-v1/);
 assert.ok(html.indexOf('human-gameplay-rig.js')<html.indexOf('mahluk-hidup-bridge.js'));
 assert.ok(html.indexOf('mahluk-hidup-bridge.js')<html.indexOf('pipeline-character-rig.js'));
}
const human=(gender)=>({id:'human_'+gender+'_base',gender,template:true,template_category:'human',
 sheet:'media/human-'+gender+'-base-sheet.png',
 motions:['idle','walk','sit','lie_idle','sit_type'].map(id=>({
  id,source:'custom',sheet:'media/human-'+gender+'-base-action-'+id+'.png',
  row:0,frames:4,available:true,frame_ms:[300,300,300,300],loop:true}))});
const actors=[human('male'),human('female'),
 {id:'legacy_theodore',sheet:'media/theodore-sheet.png',
  motions:[{id:'wave_flag',source:'custom',sheet:'media/theodore-wave.png',available:true,row:0,frames:4}]}];
const shared={ready:true,forActor(actor,requested){
 const alias={use_toilet:'sit',rest:'lie_idle'};
 const motion=actor?.motions?.find(m=>m.id===(alias[requested]||requested));
 return {motionId:motion?.id||null,previewReady:!!motion,sourceActor:motion?actor.id:null};
}};
const w={VLHumanGameplayRig:{compile(rows){
 assert.equal(rows.length,3);
 assert.ok(rows.every(x=>x.sheet.startsWith('media/')));
 return shared;
}}};
const context=vm.createContext({window:w,location:{origin:'https://lafrich.github.io'},
 Map,URL,AbortController,localStorage:{getItem(){return null}},
 fetch:async()=>({ok:true,json:async()=>({version:1,build_version:'test1',characters:actors})})});
vm.runInContext(read('mahluk-hidup-bridge.js'),context);
(async()=>{
 const bridge=w.VLMahlukHidup,stats=await bridge.load();
 assert.equal(stats.loaded,true);
 assert.equal(bridge.gameplayRigReady,true);
 assert.equal(bridge.get('human_male_base').category,'human');
 assert.equal(bridge.gameplayAction('human_male_base','use_toilet').motionId,'sit');
 assert.equal(bridge.gameplayAction('human_female_base','rest').motionId,'lie_idle');
 assert.equal(bridge.gameplayAction('legacy_theodore','run').motionId,null);
 assert.equal(bridge.get('legacy_theodore').motions.length,1);
 assert.equal(bridge.available('legacy_theodore','wave_flag').sheet,'media/theodore-wave.png');
 const rig=read('pipeline-character-rig.js');
 assert.match(rig,/entry\.category==='human'/);
 assert.match(rig,/reference\?\.previewReady/);
 assert.match(rig,/motion=actions\.find\(m=>m\.id===reference\.motionId/);
 console.log('PASS: Male/Female shared gameplay references; legacy character preserved; both builders load the same rig');
})().catch(e=>{console.error(e);process.exitCode=1});

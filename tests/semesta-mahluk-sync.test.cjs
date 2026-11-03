'use strict';
/* Regression: Semesta must load REAL Mahluk Hidup NPC actions and local named
   4-direction equipment rather than proxies or guessed action art. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const folder=path.join(__dirname,'../world-builder');
const loadFile=name=>fs.readFileSync(path.join(folder,name),'utf8');
const img='data:image/png;base64,aGVsbG8=';
const actors=[
 {id:'legacy_pak_ogah',name:'Pak Ogah',sheet:'media/legacy_pak_ogah-sheet.png',
  motions:[
   {id:'idle',name:'IDLE',row:4,frames:4,frame_ms:[270,270,270,270],loop:true,available:true},
   {id:'wave_flag',name:'WAVE FLAG',row:0,frames:4,frame_ms:[210,210,210,210],
    loop:true,available:true,sheet:'media/legacy_pak_ogah-action-wave_flag.png'}],
  expressions:[
   {id:'sleepy',label:'Sleepy',overlay:'media/pak-face-layer-sleepy.png'},
   {id:'happy',label:'Happy',sheet:'media/legacy_pak_ogah-face-happy-4dir.png'},
   {id:'untrusted',overlay:'https://evil.invalid/face.png'}]},
 {id:'astrofrich_base',name:'Astrofrich Base',sheet:'media/astrofrich-base-sheet.png',
  template:true,template_category:'astrofrich',
  motions:[{id:'idle',row:4,frames:4,available:true,frame_ms:[250,250,250,250],loop:true},
   {id:'walk',row:0,frames:6,available:true,frame_ms:[145,145,145,145,145,145],loop:true}],
  expressions:[]},
 {id:'legacy_otis',name:'Otis',sheet:'media/legacy_otis-sheet.png',motions:[]},
 {id:'bad',name:'Bad',sheet:'https://evil.invalid/a.png',motions:[]}
];
const local=new Map([
 ['virtual-life-character-storage-v1',JSON.stringify([
  {id:'custom_astro_abc',name:'My Star',base:'astrofrich_base',category:'astrofrich'}])],
 ['virtual-life-accessories-v1',JSON.stringify([
  {id:'acc-bag-1',category:'bag',template_base:'astrofrich_base',frames:{se:img,sw:img,ne:img,nw:img}},
  {id:'acc-helmet-1',category:'helmet',template_base:'astrofrich_base',frames:{se:img,sw:img,ne:img,nw:img}},
  {id:'broken',category:'shirt',template_base:'astrofrich_base',frames:{se:img}}])],
 ['virtual-life-accessory-equipment-v1',JSON.stringify({
  custom_astro_abc:{bag:'acc-bag-1',helmet:'acc-helmet-1',shirt:'broken'}})]
]);
let lastFetch='';
const w={VLPipelineAssets:{characters:[{id:'ichsan'}],character(id){
 return id==='ichsan'?'https://example.com/game/ichsan.png':null;
}}};
const context=vm.createContext({window:w,location:{origin:'https://lafrich.github.io'},
 URL,AbortController,Map,Image:class FakeImage{
  constructor(){this.onload=null;this.naturalWidth=0;this.naturalHeight=0;this._src=''}
  set src(s){this._src=s;
   this.naturalWidth=s.startsWith('data:')?64:s.includes('-action-')?256:384;
   this.naturalHeight=s.startsWith('data:')?112:s.includes('-action-')?448:4928;
   if(this.onload)this.onload();
  }
  get src(){return this._src;}
 },
 fetch:async(url)=>{
  lastFetch=String(url);
  return {ok:true,json:async()=>({version:1,build_version:'abc789',characters:actors})};
 },
 localStorage:{getItem:k=>local.get(k)||null},
 console:{warn(){}},
 document:{createElement(type){
   assert.equal(type,'canvas');
   const record={draws:[],clearRect(){this.draws.length=0;},drawImage(...args){this.draws.push(args);}};
   const cv={width:0,height:0,getContext(){return record},record};
   w.lastCanvas=cv;return cv;
 }}
});
vm.runInContext(loadFile('mahluk-hidup-bridge.js'),context,
 {filename:'mahluk-hidup-bridge.js'});
(async()=>{
 const bridge=w.VLMahlukHidup;
 const stats=await bridge.load();
 assert.equal(stats.loaded,true);
 assert.equal(stats.total,2);
 assert.equal(stats.custom,1);
 assert.match(lastFetch,/\/virtual-life-asset-pipeline\/catalog.json$/);
 assert.equal(bridge.has('legacy_otis'),false);
 assert.equal(bridge.questProfile('pak_ogah'),'legacy_pak_ogah');
 assert.equal(bridge.available('legacy_pak_ogah','wave_flag').frames,4);
 const faces=bridge.get('legacy_pak_ogah').expressions;
 assert.equal(faces.length,2,"Accept native transparent overlays and legacy full face atlases, reject remote assets");
 assert.equal(faces.find(f=>f.id==='sleepy').overlay,'media/pak-face-layer-sleepy.png');
 assert.equal(faces.find(f=>f.id==='happy').sheet,'media/legacy_pak_ogah-face-happy-4dir.png');
 assert.match(bridge.url('media/legacy_pak_ogah-sheet.png'),/build=abc789/);
 assert.equal(bridge.url('https://evil.invalid/foo.png'),null);
 const named=bridge.get('custom_astro_abc');
 assert.equal(named.name,'My Star');
 assert.equal(named.baseId,'astrofrich_base');
 assert.equal(Object.keys(bridge.equipmentFor(named.id)).length,2);
 assert.deepEqual(Object.keys(bridge.equipmentFor(named.id)).sort(),['bag','helmet']);
 assert.ok(bridge.list().some(x=>x.id==='custom_astro_abc'));
 // Locally generated AI rigs must be accepted only after core rig testing.
 w.VLMahlukHidup;
 w.MahlukCharacterDraft={};
 w.VLUniversalRig={
  list:()=>[{id:'ai_maya_001',name:'Maya',status:'rig_ready',rig:{category:'human_standard'}}],
  sourceSheet:()=>img
 };
 bridge.localSync();
 assert.ok(bridge.has('ai_maya_001'),"A tested local AI rig should appear in Semesta");
 assert.equal(bridge.get('ai_maya_001').status,'local_rig_ready');
 assert.equal(bridge.available('ai_maya_001','walk').frames,6);
 assert.equal(bridge.available('ai_maya_001','sit'),null,"Uncreated actions stay unavailable");
 assert.equal(bridge.url(img),img,"Local PNG frame data must resolve without a remote URL");

 const THREE={
  SRGBColorSpace:'srgb',NearestFilter:1,DoubleSide:2,
  CanvasTexture:class{dispose(){}},
  MeshBasicMaterial:class{dispose(){}},
  PlaneGeometry:class{dispose(){}},
  Mesh:class{constructor(g,m){this.geometry=g;this.material=m;this.position={y:0};
   this.rotation={set(){}};this.userData={};}}
 };
 vm.runInContext(loadFile('pipeline-character-rig.js'),context,
  {filename:'pipeline-character-rig.js'});
 const factory=w.VLCharacterRig;
 assert.equal(factory.profiles.custom_astro_abc,'custom_astro_abc');
 assert.equal(factory.resolve('legacy_pak_ogah','wave_flag',false).row,0);
 assert.equal(factory.resolve('ai_maya_001','walk',true).url,img,
  "Semesta rig must resolve the locally generated character sheet");

 assert.equal(factory.resolve('legacy_pak_ogah','wave_flag',false).separate,true);
 const rig=factory.createRig(THREE,{profile:'legacy_pak_ogah',direction:'nw',pose:'wave_flag'});
 rig.step(.21,null,null);
 assert.equal(rig.state.loaded,true);
 let d=w.lastCanvas.record.draws;
 assert.equal(d.length,1);
 assert.match(d[0][0].src,/legacy_pak_ogah-action-wave_flag.png/);
 assert.equal(d[0][2],112*3); // NW third pixel direction on custom 4-way sheet
 rig.setPose('idle');rig.step(.1,null,null);
 d=w.lastCanvas.record.draws;
 assert.match(d[0][0].src,/legacy_pak_ogah-sheet.png/);
 assert.equal(d[0][2],112*(4+3)); // native base 44-row sheet
 rig.dispose();
 const custom=factory.createRig(THREE,{profile:'custom_astro_abc',direction:'se'});
 custom.step(.1,null,null);
 d=w.lastCanvas.record.draws;
 assert.equal(d.length,3); // bag, body, helmet
 assert.equal(d[0][0].src,img);
 assert.match(d[1][0].src,/astrofrich-base-sheet.png/);
 assert.equal(d[2][0].src,img);
 assert.equal(custom.state.characterId,'custom_astro_abc');
 custom.dispose();
 const builder=loadFile('builder.js');
 for(const token of ['await mahluk.load()','mahluk?.questProfile(obj.questId)',
 'quest-character:','character:','mahluk?.localSync()','mahluk?.available','actionChoices(',
 'resetAutoRoute(agent,obj)','Mahluk Hidup synced','virtual-life-character-storage-v1'])
  assert.ok(builder.includes(token),'Missing Semesta implementation '+token);
 const html=loadFile('index.html');
 assert.ok(html.indexOf('mahluk-hidup-bridge.js')<html.indexOf('pipeline-character-rig.js'));
 assert.ok(html.includes('↻ Sync Mahluk Hidup'));
 const style=loadFile('style-rules.js');
 assert.match(style,/\['road','sidewalk','plaza'\].includes\(tile\)/);
 console.log('PASS Semesta: real Pak Ogah 4-view action, existing actors, custom Storage / equipment layering and NPC road placement');
})().catch(e=>{console.error(e);process.exitCode=1;});

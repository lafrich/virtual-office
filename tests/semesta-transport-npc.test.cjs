'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const moduleSource=fs.readFileSync('world-builder/semesta-transport-npc.js','utf8');

const spec=(id='id200_transport_becak_kampung')=>({
  id,source:'pipeline-street',pack:'indonesia-200-v1',category:'transport',
  npcTransport:{modular:true,emptyVehicle:true,version:1,riderSource:'Mahluk Hidup',slots:[
    {role:'driver',profile:'human_male_base',action:'pedal_becak',
      anchor:[.45,.48,.14],scale:.61,layer:'rear'},
    {role:'passenger_1',profile:'human_female_base',action:'sit_idle_transport',
      anchor:[-.3,.64,-.13],scale:.55,layer:'front',optional:true,enabledByDefault:false}
  ]}
});
function environment(){
 const created=[];
 class Group{
  children=[];userData={};name='';
  position={x:0,y:0,z:0,set(x,y,z){Object.assign(this,{x,y,z})}};
  rotation={y:Math.PI/2};
  scale={value:1,setScalar(x){this.value=x}};
  add(child){this.children.push(child);child.parent=this;}
  remove(child){this.children=this.children.filter(x=>x!==child);child.parent=null;}
  getWorldPosition(v){v.x=this.position.x;v.y=this.position.y;v.z=this.position.z;return v;}
 }
 class Vector3{ x=0;y=0;z=0; }
 const known=new Set(['human_male_base','human_female_base']);
 const bridge={ready:false,has:id=>known.has(id),
  available:(id,action)=>bridge.ready&&known.has(id)&&['sit','idle'].includes(action)?
  {id:action,frames:4}:null};
 const rigs={createRig(THREE,opt){
  const mesh={userData:{},renderOrder:0,position:{x:0,y:0,z:0},
   rotation:{y:0,z:0},parent:null};
  const state={direction:'sw',pose:null};
  const item={mesh,state,opt,steps:0,disposed:false,
    setPose(v){state.pose=v;},
    setDirection(v){state.direction=v;},
    step(dt,camera,pos){item.steps++;mesh.position={x:0,y:.35,z:0};mesh.rotation={y:.15,z:0}},
    dispose(){item.disposed=true;}
  };
  created.push(item);return item;
 }};
 const window={VLMahlukHidup:bridge,VLCharacterRig:rigs};
 vm.runInNewContext(moduleSource,{window,Map,Math,Object,Array,Number});
 return {api:window.VLSemestaTransportNPC,window,bridge,rigs,created,
  THREE:{Group,Vector3},Group,known};
}
test('modular transport slots are real published Mahluk profiles, not baked humanoid PNGs',()=>{
 const {api}=environment();
 const rows=api.slotsFor(spec());
 assert.equal(rows.length,1);
 assert.equal(rows[0].profile,'human_male_base');
 assert.equal(rows[0].action,'pedal_becak');
 assert.equal(api.slotsFor(spec(),{npcPassengers:{passenger_1:true}}).length,2);
 assert.equal(api.slotsFor(spec(),{npcDisabled:true}).length,0);
 assert.equal(api.slotsFor({...spec(),source:'pipeline-vegetation'}).length,0);
 const transformed=api.slotsFor(spec(),{npcProfiles:{driver:'human_female_base'}});
 assert.equal(transformed[0].profile,'human_female_base');
});
test('rig attachment waits for actual Mahluk catalog, then runs canonical sit frame loops',()=>{
 const {api,bridge,created,THREE,Group}=environment();
 bridge.ready=false;
 const root=new Group();
 const module=api.create(THREE,root,spec(),{rotation:90,npcPassengers:{passenger_1:true}});
 assert.ok(module&&module.group.userData.transportNPC);
 assert.equal(module.actors.size,0,'must not lock onto Ichsan while catalog is loading');
 bridge.ready=true;
 module.step(.016,{position:{x:5,y:9,z:10}});
 assert.equal(module.actors.size,2);
 assert.equal(created.length,2);
 assert.equal(created[0].opt.profile,'human_male_base');
 assert.equal(created[1].opt.profile,'human_female_base');
 assert.equal(created[0].state.pose,'sit','native authored Mahluk sit animation is used');
 assert.equal(created[0].state.direction,'se');
 assert.equal(module.actors.get('driver').seat.scale.value,.61);
 const previousY=created[0].mesh.position.y;
 module.step(.12,{position:{x:5,y:9,z:10}});
 assert.notEqual(created[0].mesh.position.y,previousY,'pedal body-loop moves on every frame');
 assert.ok(module.actors.get('driver').seat.userData.cyclePhase>=0);
 assert.match(module.actors.get('driver').seat.userData.motionSource,/mahluk-sit\+procedural/);
 module.dispose();
 assert.equal(created.every(x=>x.disposed),true);
 assert.equal(root.children.length,0);
});
test('family transport enables adult passenger but never invents an adult-sized fake child',()=>{
 const {api,THREE,Group,bridge,created}=environment();
 const family=spec('id200_transport_motor_matik_keluarga');
 family.npcTransport.slots[1].enabledByDefault=true;
 family.npcTransport.slots.push({
  role:'child',profile:'human_child_base',action:'ride_idle_passenger',
  anchor:[0,.63,.05],scale:.41,layer:'front',optional:true,enabledByDefault:true
 });
 const root=new Group();const npc=api.create(THREE,root,family);
 bridge.ready=true;npc.step(.016,{position:{x:2,y:8,z:4}});
 assert.deepEqual([...npc.actors.keys()],['driver','passenger_1']);
 assert.equal(created.length,2);
 assert.equal(npc.actors.has('child'),false);
 npc.dispose();
});
test('if a genuine authored pedal action is available it outranks the procedural sit fallback',()=>{
 const {api,window,bridge}=environment();
 bridge.ready=true;
 assert.equal(api.actionFor(bridge,'human_male_base','pedal_becak'),'sit');
 window.VLActionTemplates={get:(who,action)=>action==='pedal_becak'?{ready:true}:null};
 assert.equal(api.actionFor(bridge,'human_male_base','pedal_becak'),'pedal_becak');
});
test('Semesta links animated sprite NPC lifecycle and keeps four-way placement in the same city',()=>{
 const b=fs.readFileSync('world-builder/builder.js','utf8');
 const html=fs.readFileSync('world-builder/index.html','utf8');
 assert.match(b,/transportRiders=new Map\(\)/);
 assert.match(b,/const riderSet=window\.VLSemestaTransportNPC\?\.create\?\.\(THREE,root,vehicleSpec,o\)/);
 assert.match(b,/for\(const riders of transportRiders\.values\(\)\)riders\.step\(dt,camera\)/);
 assert.match(b,/for\(const riders of transportRiders\.values\(\)\)riders\.dispose\(\)/);
 assert.match(html,/semesta-transport-npc\.js\?v=modular-transport-npc-v1/);
});

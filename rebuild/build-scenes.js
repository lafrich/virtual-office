/* Rebuild: editable furniture registries for each existing map.
   Coordinates are the same origins used in the procedural scene drawings. */
(function(global){
 'use strict';
 const asset=(id,name,x,y,w=1,d=1,h=12,extra={})=>({
  id,name,type:'furniture',at:{x,y},size:{w,d,h},
  offset:{x:0,y:0},elevation:0,depthBias:0,
  scale:1,facing:'SW',collision:false,visible:true,sprite:null,action:null,
  visual:global.VOVisualSystem.describeAsset(id,'furniture',w,d),...extra
 });
 const place=(type,label,dx=0,dy=0)=>({
  type,label,range:1.9,approach:{x:dx,y:dy},pose:{x:0,y:0}
 });
 const SCENES={
  office:{width:18,height:13,assets:[
    asset('office-plant-a','Tanaman sudut',2.1,2.7,.8,.8,20),
    asset('office-storage','Lemari biru',4.2,2.2,1.3,1.4,9,{sprite:{base:'./assets/storage_base.svg',pivot:{x:.5,y:.79}}}),
    asset('office-lowtable','Meja samping',8.6,3.8,2.5,1.15,10,{sprite:{base:'./assets/coffee_base.svg',pivot:{x:.5,y:.79}}}),
    asset('office-desk-a','Meja kerja A',12,3.7,2.7,1.55,22,{action:place('work','KERJA',0,1.8),sprite:{base:'./assets/desk_base.svg',pivot:{x:.5,y:.79}}}),
    asset('office-desk-b','Meja kerja B',13.3,5.9,2.7,1.55,22,{sprite:{base:'./assets/desk_base.svg',pivot:{x:.5,y:.79}}}),
    asset('office-plant-b','Tanaman tengah',12.2,8.7,.8,.8,20),
    asset('office-sofa','Sofa biru',7.4,6.1,4.25,1.76,25,{
      action:place('sit','DUDUK',.2,1.4),sprite:{base:'./assets/sofa_base.svg',front:'./assets/sofa_front.svg',pivot:{x:.5,y:.79}}}),
    asset('office-coffee-a','Meja kopi A',10.25,7.9,1.9,.96,6,{sprite:{base:'./assets/coffee_base.svg',pivot:{x:.5,y:.79}}}),
    asset('office-coffee-b','Meja kopi B',11.2,10.1,1.05,.72,10,{sprite:{base:'./assets/coffee_base.svg',pivot:{x:.5,y:.79}},scale:.75}),
    asset('office-desk-c','Meja kerja C',14.5,8.1,2.7,1.55,22,{sprite:{base:'./assets/desk_base.svg',pivot:{x:.5,y:.79}}}),
    asset('office-chair','Kursi kerja',14.4,9.1,.72,.72,18,{action:place('sit','DUDUK',0,-.3),sprite:{base:'./assets/chair_base.svg',front:'./assets/chair_front.svg',pivot:{x:.5,y:.79}}}),
    asset('office-toilet','Toilet',16.1,10.8,.9,.9,8,{action:place('pee','PIPIS',0,0)}),
    asset('office-shower','Kamar mandi',16.2,8.8,1,.9,28,{action:place('shower','MANDI',0,0)})
  ]},
  street:{width:16,height:13,assets:[
    asset('street-plant-0','Tanaman taman A',2,1.7,.8,.8,26),
    asset('street-plant-1','Tanaman taman B',5.4,1.7,.9,.9,29),
    asset('street-plant-2','Tanaman taman C',8.8,1.7,.8,.8,26),
    asset('street-plant-3','Tanaman taman D',12.2,1.7,.8,.8,26),
    asset('street-bench-0','Bangku taman A',5,6.4,3.4,.82,21,{action:place('sit','DUDUK',0,1.2)}),
    asset('street-bench-1','Bangku taman B',10,6.4,3.4,.82,21,{action:place('sit','DUDUK',0,1.2)}),
    asset('street-warteg','Bangunan warteg',11.4,3.9,3.5,2.6,39,{action:place('zone','MASUK',.4,1.6)}),
    asset('street-props-a','Furnitur taman',8.15,9.4,1.5,.9,14),
    asset('street-lounger','Kursi rebah',13.2,8.8,2.4,1,14,{action:place('lie','REBAH',0,.8)})
  ]},
  warteg:{width:12,height:11,assets:[
    asset('warteg-plant','Tanaman warteg',1.4,2.4,.7,.7,24),
    asset('warteg-sign','Pajangan dinding',3,3,1.35,.7,29),
    asset('warteg-table-a','Meja dan bangku A',3.6,8.1,2.5,3,9),
    asset('warteg-table-b','Meja dan bangku B',8.5,8.1,2.5,3,9),
    asset('warteg-bar','Etalase dan bangku bar',6.3,4.1,7.7,3.8,55,{
      action:place('eat','PESAN',.4,1.1)})
  ]}
 };
 global.VOBuildScenes={SCENES,makeWorlds:()=>Object.fromEntries(Object.entries(SCENES)
  .map(([room,data])=>[room,new global.VOModular.ModularWorld({room,...data})]))};
})(window);
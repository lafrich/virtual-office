/* VIRTUAL OFFICE — Visual System 01
   Source of truth for palette, scale hierarchy, lighting and repeatable prop details.
   Game logic/asset positions remain in existing registries. */
(function(global){
 'use strict';
 const palette=Object.freeze({
  wall:'#EADFC7',wallLight:'#FFF3DC',wallSide:'#D4C5A8',
  floor:'#CFE4FF',floorAlt:'#B9D8F5',floorEdge:'#9FBDE0',
  bath:'#D87469',bathAlt:'#E19B86',
  wood:'#A26B3F',woodLight:'#C38C5A',woodDark:'#754A2E',
  cream:'#FFF8E6',creamShade:'#DDD0B7',
  blue:'#4E8DE6',blueLight:'#8BAFEA',blueDark:'#385C9E',
  green:'#6BB77A',greenLight:'#91C795',greenDark:'#477C55',
  grey:'#B7BDC7',shadow:'#8A9DB7',shadowDark:'#53647C',
  ink:'#28364A',softInk:'#44566E',
  uiRed:'#E04848',uiGold:'#FFC857',
  glass:'#A9D9EB',white:'#FEFCF5',
  skin:'#E8AF85',skinShadow:'#C88963',
 });
 const materials=Object.freeze({
  'warm-wall':['wallLight','wall','wallSide'],
  'tile-blue':['floor','floorAlt','floorEdge'],
  'tile-terracotta':['bathAlt','bath','woodDark'],
  'wood':['woodLight','wood','woodDark'],
  'upholstery':['cream','creamShade','shadow'],
  'blue-fabric':['blueLight','blue','blueDark'],
  'leaf':['greenLight','green','greenDark'],
  'ceramic':['white','grey','shadow'],
  'glass':['glass','floorAlt','blueDark']
 });
 const sizes=Object.freeze({
  small:{w:1,d:1,h:1,example:'plant / lamp'},
  medium:{w:2,d:1,h:1,example:'chair / cabinet'},
  large:{w:2,d:2,h:1,example:'sofa / desk'},
  extraLarge:{w:3,d:2,h:1,example:'bed / display'}
 });
 const hierarchy=Object.freeze({
  architecture:0,floorDecor:10,furniture:20,player:30,foreground:40,labels:50,ui:100
 });
 const poses=Object.freeze({
  sit:{facing:'sw',anim:'sit',occlusion:'front'},
  sleep:{facing:'sw',anim:'sleep',occlusion:'front'},
  bathe:{facing:'sw',anim:'bathe',occlusion:'front'},
  work:{facing:'sw',anim:'work',occlusion:'desk'},
  pee:{facing:'sw',anim:'toilet',occlusion:'front'}
 });
 const p=(key)=>palette[key]||key;
 const mat=key=>(materials[key]||materials.wood).map(p);
 // Each prop uses the same isometric projection and the same material ramps.
 function props(api){
  const {box,iso,line,poly,fill,zoom,shadow,drawPlant}=api;
  function bookStack(x,y,z=0){
   box(x,y,.49,.33,1.8,p('blue'),p('blueDark'),p('blueDark'),z);
   box(x+.02,y-.02,.53,.33,1.7,p('cream'),p('creamShade'),p('grey'),z+1.8);
   box(x-.04,y-.02,.50,.3,1.6,p('bath'),p('wood'),p('woodDark'),z+3.5);
  }
  function mug(x,y,z=0){
   box(x,y,.20,.19,2.5,p('white'),p('grey'),p('shadow'),z);
   box(x+.15,y,.11,.08,1.3,p('cream'),p('grey'),p('grey'),z+.9);
  }
  function lamp(x,y,z=0){
   box(x,y,.28,.28,1.5,p('woodDark'),p('wood'),p('woodDark'),z);
   box(x,y,.10,.11,12,p('grey'),p('shadow'),p('shadowDark'),z+1.4);
   box(x,y,.65,.61,5,p('cream'),p('uiGold'),p('woodLight'),z+13);
  }
  function computer(x,y,z=0){
   box(x,y,.81,.20,13,p('ink'),p('softInk'),p('shadowDark'),z);
   box(x,y-.08,.67,.11,9,p('glass'),p('blueDark'),p('shadowDark'),z+12);
   box(x,y+.34,.94,.46,.8,p('grey'),p('shadow'),p('shadowDark'),z);
   box(x,y+.37,.43,.14,.3,p('ink'),p('softInk'),p('shadowDark'),z+.8);
  }
  function desk(x,y){
   const [top,left,right]=mat('wood');
   shadow(x,y,16,5);
   box(x,y,2.7,1.55,12,top,left,right);
   box(x+.86,y+.65,.57,.08,9,p('woodLight'),p('woodDark'),p('woodDark'),1.5);
   for(let z of [4,8])box(x+.86,y+.69,.42,.08,.3,p('woodDark'),p('woodDark'),p('woodDark'),z);
   computer(x-.38,y-.20,12);
   bookStack(x+.78,y-.35,12.4);
   mug(x+.72,y+.32,12.4);
   box(x-.16,y+.48,1.12,.24,.25,p('cream'),p('grey'),p('shadow'),12.2);
  }
  function chair(x,y,color='wood'){
   const ramp=color==='blue'?mat('blue-fabric'):mat('wood');
   shadow(x,y,7,3);
   for(const dx of [-.27,.27])for(const dy of [-.26,.25]){
    box(x+dx,y+dy,.09,.1,7,p('woodDark'),p('woodDark'),p('woodDark'));
   }
   box(x,y,.90,.86,7,ramp[0],ramp[1],ramp[2],6.5);
   box(x,y-.38,.88,.17,19,ramp[0],ramp[1],ramp[2],6);
   line(iso(x-.31,y-.50,25),iso(x+.32,y-.5,25),p('creamShade'),.9);
  }
  function plant(x,y,size=1){
   shadow(x,y,8,3);
   box(x,y,.68,.66,7,p('white'),p('grey'),p('shadowDark'));
   const center=iso(x,y,9*size);
   const branches=[
    [-10,-16,8,7],[-20,-23,13,8],[8,-28,13,8],[18,-14,13,6],
    [0,-39,11,15],[-6,-45,7,12],[12,-43,10,11],[-14,-33,9,10]
   ];
   const g=api.ctx;
   g.save();g.translate(Math.round(center.x),Math.round(center.y));
   g.scale(zoom*size,zoom*size);
   fill(-2,-45,4,48,p('greenDark'));
   for(let i=0;i<branches.length;i++){
    const [ex,ey,w,h]=branches[i];
    line({x:0,y:-8},{x:ex,y:ey+2},p('greenDark'),1.7);
    fill(ex-w/2,ey-h/2,w,h,p(i%3?'green':'greenLight'));
    fill(ex-w/2,ey-h/2,Math.max(2,w*.3),h*.5,p('greenLight'));
   }
   g.restore();
  }
  function rug(x,y,w,d){
   box(x,y,w,d,.17,p('cream'),p('creamShade'),p('shadow'),0);
   box(x,y,w-.30,d-.30,.08,p('wallLight'),p('creamShade'),p('creamShade'),.17);
  }
  function coffee(x,y){
   shadow(x,y,12,3);
   box(x,y,1.90,.96,7,p('woodLight'),p('wood'),p('woodDark'));
   box(x,y,1.78,.84,.45,p('woodLight'),p('wood'),p('woodDark'),7);
   box(x+.40,y-.15,.37,.31,2,p('green'),p('greenDark'),p('greenDark'),7.5);
   box(x-.42,y+.10,.44,.32,.5,p('cream'),p('grey'),p('shadow'),7.5);
  }
  function wallArt(x,y,z,w,d,subject='blue'){
   const a=iso(x,y,z),b=iso(x+w,y+d,z),
    c=iso(x+w,y+d,z+17),e=iso(x,y,z+17);
   poly([a,b,c,e],p('woodDark'),p('woodDark'),1.5);
   const ii=iso(x+w*.12,y+d*.12,z+2),jj=iso(x+w*.88,y+d*.88,z+2),
    kk=iso(x+w*.88,y+d*.88,z+15),ll=iso(x+w*.12,y+d*.12,z+15);
   poly([ii,jj,kk,ll],p(subject),p('creamShade'),1);
  }
  function window(x,y,orient='horizontal',z=35,span=2.7){
   const dx=orient==='horizontal'?span:0,dy=orient==='horizontal'?0:span;
   const a=iso(x,y,z),b=iso(x+dx,y+dy,z),c=iso(x+dx,y+dy,z+34),d=iso(x,y,z+34);
   poly([a,b,c,d],p('glass'),p('cream'),2.5);
   const m1=iso(x+dx/2,y+dy/2,z),m2=iso(x+dx/2,y+dy/2,z+34);
   line(m1,m2,p('white'),1.7);
   for(let t=1;t<8;t++){
    const h=z+2+t*4.0;
    line(iso(x,y,h),iso(x+dx,y+dy,h),t%2?p('creamShade'):p('cream'),1.3);
   }
   line(d,c,p('white'),3);
  }
  return {desk,chair,plant,rug,coffee,window,bookStack,mug,lamp,computer,wallArt};
 }
 const manifest=Object.freeze({
  sofa:{category:'furniture',sizeClass:'large',material:'upholstery',split:['base','front'],pose:'sit'},
  desk:{category:'furniture',sizeClass:'large',material:'wood',pose:'work'},
  chair:{category:'furniture',sizeClass:'medium',material:'wood',pose:'sit'},
  bed:{category:'furniture',sizeClass:'extraLarge',material:'blue-fabric',split:['base','front'],pose:'sleep'},
  bathtub:{category:'bathroom',sizeClass:'large',material:'leaf',split:['base','front'],pose:'bathe'},
  toilet:{category:'bathroom',sizeClass:'medium',material:'ceramic',split:['base','front'],pose:'pee'},
  plant:{category:'decor',sizeClass:'small',material:'leaf'},
  lamp:{category:'decor',sizeClass:'small',material:'warm-wall'},
  rug:{category:'floorDecor',sizeClass:'large',material:'upholstery'},
  bookshelf:{category:'furniture',sizeClass:'medium',material:'wood'}
 });
 global.VOVisualSystem=Object.freeze({
  version:'1.0',palette,materials,sizes,hierarchy,poses,manifest,
  isometric:{footprintTile:{width:46,height:23},logicalSpriteTile:32,lightDirection:'top-left'},
  color:p,material:mat,props
 });
})(window);

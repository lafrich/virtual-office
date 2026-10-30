/* VIRTUAL OFFICE — scene detail rules, shared by every room.
   Architectural trim, contact planes and window light use the canonical
   2:1 projection and palette. Never changes physics or editable footprints. */
(function(global){
 'use strict';
 const P=global.VOVisualSystem.palette;
 function floorEdge(api,w,d,room){
  const {iso,poly,line,zoom}=api,ht=room==='cove'?6:5;
  const a=iso(0,d,0),b=iso(w,d,0),c=iso(w,0,0);
  const a0=iso(0,d,-ht),b0=iso(w,d,-ht),c0=iso(w,0,-ht);
  const warm=room==='cove'||room==='office';
  poly([a,b,b0,a0],warm?P.creamShade:P.wallSide,P.wallSide,.6);
  poly([b,c,c0,b0],warm?P.wallSide:P.shadow,P.shadowDark,.6);
  line(a,b,warm?P.cream:P.creamShade,1.7*zoom);
  line(b,c,warm?P.wallLight:P.cream,1.5*zoom);
  line(a0,b0,P.shadow,zoom*.8);
 }
 function wallBase(api,w,d,room){
  const {iso,line,zoom}=api,band=room==='warteg'?P.greenDark:P.woodLight;
  const stroke=room==='warteg'?P.green:P.wallLight;
  const v=room==='warteg'?7:5;
  line(iso(0,0,v),iso(w,0,v),band,2*zoom);
  line(iso(0,0,v),iso(0,d,v),band,2*zoom);
  line(iso(0,0,v+1.5),iso(w,0,v+1.5),stroke,.7*zoom);
  line(iso(0,0,v+1.5),iso(0,d,v+1.5),stroke,.7*zoom);
 }
 function sunlight(api,room){
  const {iso,poly}=api;
  // A few hard-edged transparent bands mimic morning light, without
  // introducing gradients or non-pixelated photographic textures.
  if(room==='warteg')return;
  const bands=room==='cove'
    ? [[1.1,1.15,3.1,2.6],[3.4,1.15,4.7,2.4]]
    :room==='office'
    ? [[2.3,1.1,4.1,2.2],[5.9,1.1,7.8,2.1]]
    : [[2.0,1.0,3.8,2.2]];
  for(const [x1,y1,x2,y2] of bands){
    poly([iso(x1,y1,.25),iso(x2,y1,.25),iso(x2+.18,y2,.25),iso(x1+.18,y2,.25)],
      'rgba(255,248,230,.11)',null);
  }
 }
 function worldDetail(api,room,w,d){
  floorEdge(api,w,d,room);sunlight(api,room);
 }
 global.VOEnvironment=Object.freeze({version:'1.0',floorEdge,wallBase,sunlight,worldDetail});
})(window);
/* Editable isometric terrain: integer c/r cells, sparse overrides. */
(function(g){
'use strict';
const types=['grass','road','sidewalk','water','plaza','soil','drain','river'];
const bounds=b=>b===null?null:(b||{minX:-30,maxX:40,minZ:20,maxZ:55});
const valid=(c,r,b)=>!b||(c>=b.minX&&c<b.maxX&&r>=b.minZ&&r<b.maxZ);
const key=(c,r)=>c+','+r;
const dict=t=>new Map((t.cells||[]).map(x=>[key(x.c,x.r),x]));
const store=(t,d)=>{t.cells=[...d.values()].sort((a,b)=>a.r-b.r||a.c-b.c);};
const read=(t,c,r,d)=>d.get(key(c,r))?.type||t.default||'grass';
function normalize(t,b){
 const result={default:types.includes(t?.default)?t.default:'grass',cells:[]},m=new Map();
 for(const tile of t?.cells||[]){
  const c=Math.floor(Number(tile.c)),r=Math.floor(Number(tile.r));
  if(!Number.isFinite(c)||!Number.isFinite(r)||!valid(c,r,bounds(b)))continue;
  const type=types.includes(tile.type)?tile.type:'grass';
  m.set(key(c,r),{c,r,type,...(type==='road'?{roadClass:tile.roadClass||'two_lane',...(tile.surface==='concrete'?{surface:'concrete'}:{})}:{})});
 }
 store(result,m);return result;
}
function seeded(b,road){
 const t={default:'grass',cells:[]},m=new Map(),area=bounds(b);
 const z0=road?.z0??32.75,z1=road?.z1??36.3;
 for(let r=Math.ceil(area.minZ);r<area.maxZ;r++)
  for(let c=Math.ceil(area.minX);c<area.maxX;c++){
   const z=r+.5;
   const type=z>=z0&&z<z1?'road':z>=z0-1.5&&z<z1+1.5?'sidewalk':null;
   if(type)m.set(key(c,r),{c,r,type,...(type==='road'?{roadClass:'two_lane'}:{})});
  }
 store(t,m);return t;
}
function mask(t,c,r,d){
 let v=0;for(const [bit,x,z] of [[1,c,r-1],[2,c+1,r],[4,c,r+1],[8,c-1,r]])
  if(read(t,x,z,d)==='road')v|=bit;
 return v;
}
function shape(t,c,r,d){
 const m=mask(t,c,r,d),n=[1,2,4,8].filter(bit=>m&bit).length;
 return n===4?'cross':n===3?'t':n===2?(m===5||m===10?'straight':'corner'):n===1?'end':'isolated';
}
// The authored drain surface stops at roads. Water continues below the
// asphalt through a real road-only culvert segment, never by painting a drain
// over a drivable road or inventing an unapproved corner sprite.
const MAX_CULVERT_ROAD_TILES=6;
function roadUnderpass(t,c,r,dc,dr,d){
 const cells=d||dict(t),roadTiles=[];
 let x=c+dc,z=r+dr;
 while(roadTiles.length<MAX_CULVERT_ROAD_TILES&&read(t,x,z,cells)==='road'){
  roadTiles.push({c:x,r:z});x+=dc;z+=dr;
 }
 return roadTiles.length>0&&read(t,x,z,cells)==='drain'?
  {from:{c,r},to:{c:x,r:z},axis:dc?'c':'r',roadTiles}:null;
}
function culverts(t,d){
 const cells=d||dict(t),out=[];
 for(const tile of t.cells||[]){
  if(tile.type!=='drain')continue;
  // Scan only east and south so a single crossing is not counted twice.
  for(const [dc,dr] of [[1,0],[0,1]]){
   const part=roadUnderpass(t,tile.c,tile.r,dc,dr,cells);
   if(part)out.push(part);
  }
 }
 return out;
}
// Drain.png is authored along r. Infer the connected axis from both surface
// drains and underground road spans. Existing terrain and collision stay intact.
function drainAxis(t,c,r,d){
 const cells=d||dict(t),isDrain=(x,z)=>read(t,x,z,cells)==='drain';
 const connected=(dc,dr)=>isDrain(c+dc,r+dr)||!!roadUnderpass(t,c,r,dc,dr,cells);
 const alongC=Number(connected(-1,0))+Number(connected(1,0));
 const alongR=Number(connected(0,-1))+Number(connected(0,1));
 if(alongC&&alongR)return 'junction';
 return alongC?'along_c':alongR?'along_r':'isolated';
}
function paint(t,c,r,type,size=1,options={}){
 const d=dict(t),b=bounds(options.bounds),n=[1,2,4].includes(size)?size:1;
 const changes=[];
 for(let dz=0;dz<n;dz++)for(let dx=0;dx<n;dx++){
  const a=Math.floor(c)+dx,z=Math.floor(r)+dz;if(!valid(a,z,b))continue;
  d.set(key(a,z),{c:a,r:z,type,...(type==='road'?{roadClass:options.roadClass||'two_lane'}:{})});
  changes.push([a,z]);
 }
 if(type==='road'&&options.autoSidewalk)for(const [a,z] of changes)
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=a+dx,y=z+dz,cur=read(t,x,y,d);
   if(valid(x,y,b)&&(cur==='grass'||cur==='soil'))
    d.set(key(x,y),{c:x,r:y,type:'sidewalk'});
  }
 store(t,d);return changes.length;
}
function fill(t,c,r,type,options={}){
 // On an unbounded world, flood-fill is restricted to the current visible viewport.
 const d=dict(t),b=bounds(options.fillBounds||options.bounds),start=[Math.floor(c),Math.floor(r)];
 if(!valid(...start,b))return 0;
 const old=read(t,...start,d);if(old===type)return 0;
 const todo=[start],seen=new Set(),found=[];
 while(todo.length&&found.length<5000){
  const [x,z]=todo.pop(),k=key(x,z);
  if(seen.has(k)||!valid(x,z,b))continue;
  seen.add(k);if(read(t,x,z,d)!==old)continue;
  found.push([x,z]);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]])todo.push([x+dx,z+dz]);
 }
 for(const [x,z] of found)d.set(key(x,z),{c:x,r:z,type,...(type==='road'?{roadClass:options.roadClass||'two_lane'}:{})});
 store(t,d);return found.length;
}
function exported(t){
 const d=dict(t);
 return t.cells.map(x=>({...x,...(x.type==='road'?{shape:shape(t,x.c,x.r,d)}:{})}));
}
g.VLMapTerrain=Object.freeze({types,normalize,seeded,paint,fill,dict,read,shape,roadUnderpass,culverts,drainAxis,exported});
})(window);

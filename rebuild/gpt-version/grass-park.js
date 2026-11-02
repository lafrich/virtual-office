'use strict';
function gptGrassRuntime(){
  // Park-only ground plane: street r<=36.3, gang at c22..24 and the
  // market at c>=20 stay outside these shapes.
  const zones=[
    {c0:-29,c1:19.5,r0:36.58,r1:51.0},
    {c0:19.5,c1:34,r0:36.58,r1:37.45}
  ];
  const inside=(c,r)=>zones.some(z=>c>=z.c0&&c<=z.c1&&r>=z.r0&&r<=z.r1);
  let cv=null,ctx=null,tile=null,last='',cleaned=false;
  function makeTile(){
    const g=document.createElement('canvas');g.width=32;g.height=32;
    const t=g.getContext('2d');t.fillStyle='#2b9c54';t.fillRect(0,0,32,32);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const h=Math.imul(x+37,1103515245)^Math.imul(y+91,12345)^Math.imul(x+y+1,2654435761);
      const v=(h^(h>>>9)^(h>>>17))>>>0;
      if(v%13===0){t.fillStyle='#298c4a';t.fillRect(x,y,1,1);}
      else if(v%17===0){t.fillStyle='#3fa660';t.fillRect(x,y,1,1);}
      else if(v%67===0){t.fillStyle='#67ae64';t.fillRect(x,y,1,1);}
    }
    return g;
  }
  function cleanFurniture(){
    if(cleaned||!EXT.built)return;
    cleaned=true;
    // Hide only actual scene nodes in the now-empty grass zones.
    // This operates on DOM visuals; no changes to the original road geometry.
    (EXT.props||[]).forEach(g=>{
      if(!g||g._r==null||g._b==null)return;
      const c=g._b-g._r,r=g._r;
      if(inside(c,r)){g.style.display='none';g.style.opacity='0';g._gptGrassHidden=1;}
    });
    (EXT.trees||[]).forEach(t=>{
      if(t&&inside(t.c,t.r)&&t.g){t.g.style.display='none';t.g.style.opacity='0';}
    });
    // Removed park objects must not leave invisible collision or sit points.
    if(EXT.blk)EXT.blk=EXT.blk.filter(b=>!inside(b.c,b.r));
    const seats=window.__vcLifeSeats;
    if(Array.isArray(seats)){
      for(let i=seats.length-1;i>=0;i--){
        if(seats[i].zone==='street'&&inside(seats[i].c,seats[i].r))seats.splice(i,1);
      }
    }
  }
  function frame(){
    try{
      if(!OUT_ON||!EXT.built||WT.on||CV.on||FMI.on){
        if(cv)cv.style.display='none';
      }else{
        cleanFurniture();
        if(!cv){
          cv=document.createElement('canvas');cv.className='gpt-grass-ground';
          cv.setAttribute('aria-hidden','true');
          cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6;image-rendering:pixelated';
          floor.appendChild(cv);ctx=cv.getContext('2d');
          tile=ctx.createPattern(makeTile(),'repeat');
        }
        cv.style.display='block';
        let b=floor.getBoundingClientRect(),m=room.getScreenCTM(),d=window.devicePixelRatio||1;
        if(m&&b.width>0&&b.height>0){
          let W=Math.round(b.width*d),H=Math.round(b.height*d);
          let key=[W,H,m.a,m.b,m.c,m.d,m.e,m.f,b.left,b.top].join(',');
          if(key!==last){
            last=key;
            if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
            ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);
            ctx.setTransform(m.a*d,m.b*d,m.c*d,m.d*d,(m.e-b.left)*d,(m.f-b.top)*d);
            ctx.fillStyle=tile;
            zones.forEach(z=>{
              const a=P(z.c0,z.r0),b=P(z.c1,z.r0),c=P(z.c1,z.r1),e=P(z.c0,z.r1);
              ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
              ctx.lineTo(c.x,c.y);ctx.lineTo(e.x,e.y);ctx.closePath();ctx.fill();
            });
            ctx.setTransform(1,0,0,1,0,0);
          }
        }
      }
    }catch(err){if(!frame.warned){console.warn('[GPT] grass ground',err);frame.warned=1;}}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__gptGrassPark={zones:zones,contains:inside,version:'grass-v1'};
}
function gptGrassPatch(html){
  function one(a,b){const n=html.split(a).length-1;if(n!==1)throw Error('GPT_GRASS_ANCHOR '+n+' '+a.slice(0,90));html=html.replace(a,b);}
  // Undo experimental furniture which v16a.21 added in the far-side park.
  one("gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));",
      "EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));");
  // Restore ordinary values instead of bigger experimental bench/lamp hitboxes.
  one("return prop(c+0.8,r+0.25,1.05,g=>",
      "return prop(c+0.8,r+0.25,0.8,g=>");
  one("function lamp(c,r){ return prop(c,r,0.53,",
      "function lamp(c,r){ return prop(c,r,0.35,");
  one("const RANGE_SEAT = 1.65;","const RANGE_SEAT = 1.35;");
  // The six street-side lamps at the curb are not part of the roadway.
  // Keep signal lamps and zebra lights, only remove decorative street poles.
  one("[-0.5,8,14,20.0,26.6,32.5].forEach(c=>lamp(c,32.2));",
      "/* GPT grass placeholder: decorative curb lamps not installed */");
  // Disable broad foreground re-paint from the previous park experiment.
  one("var parkLevel=(S2X.far&&S2X.lv&&S2X.lv.g&&S2X.lv.g.getAttribute('display')!=='none'&&me.r>=36.35&&me.r<=51)?S2X.lv.g:null;",
      "var parkLevel=null;");
  one("window.__gptDepthDraw=v16DrawOcclusion;",
      "window.__gptDepthDraw=v16DrawOcclusion;\n"+gptGrassRuntime.toString()+"\ngptGrassRuntime();");
  one("GPT VERSION · v16a.21","GPT VERSION · v16a.27 · GRASS");
  return html;
}
self.gptGrassPatch=gptGrassPatch;

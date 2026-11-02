'use strict';
function gptStreet2Flatten(im){
  // Operates on Street2 base PNG pixels BEFORE the scene is baked.
  // Detects the road's actual asphalt line in IMAGE space; no isometric
  // grass overlay, arbitrary world rectangles, or gameplay collision edits.
  const fullW=im.naturalWidth,fullH=im.naturalHeight;
  if(fullW<300||fullH<200)return null;
  const W=Math.min(900,fullW),ratio=W/fullW,H=Math.max(1,Math.round(fullH*ratio));
  const scan=document.createElement('canvas');scan.width=W;scan.height=H;
  const sx=scan.getContext('2d',{willReadFrequently:true});
  sx.imageSmoothingEnabled=false;sx.drawImage(im,0,0,W,H);
  const pix=sx.getImageData(0,0,W,H).data;
  function isRoad(i){
    const r=pix[i],g=pix[i+1],b=pix[i+2];
    return pix[i+3]>100&&r>=45&&r<=112&&g-r>=4&&g-r<=22&&b-g>=5&&b-g<=28&&b<=145;
  }
  function roadScore(off){
    let yes=0,total=0;
    for(let x=Math.ceil(W*.07);x<W*.93;x+=4){
      let y=Math.round(.5*x+off);
      if(y<5||y>=H-5)continue;
      total++;
      if(isRoad((y*W+x)*4))yes++;
    }
    return total>=W*.12?yes/total:0;
  }
  let best=-1,bestScore=0,scores=[],minB=-Math.ceil(W*.6),maxB=H;
  for(let y=minB;y<maxB;y+=1){
    let q=roadScore(y);scores.push(q);
    if(q>bestScore){bestScore=q;best=y;}
  }
  // Fail closed if the expected street is not found.
  if(bestScore<.52)return null;
  let edge=best;
  const reach=Math.max(36,Math.round(W*.18));
  for(let b=best;b<Math.min(maxB,best+reach);b++){
    if(scores[b-minB]>=.39)edge=b;
  }
  // Grass starts just below the curb. Keep the asphalt intact.
  const margin=Math.max(6,Math.round(W*.022));
  const cutoff=x=>(.5*x+edge+margin)/ratio;
  const output=document.createElement('canvas');output.width=fullW;output.height=fullH;
  const out=output.getContext('2d',{willReadFrequently:true});
  out.imageSmoothingEnabled=false;out.drawImage(im,0,0);
  const grass=document.createElement('canvas');grass.width=48;grass.height=48;
  const gx=grass.getContext('2d');
  gx.fillStyle='#2C9C53';gx.fillRect(0,0,48,48);
  for(let y=0;y<48;y++)for(let x=0;x<48;x++){
    let v=(Math.imul(x+11,1664525)^Math.imul(y+29,1013904223)^(Math.imul(x*y+1,2246822519)))>>>0;
    if(v%17<2){gx.fillStyle='#278B4A';gx.fillRect(x,y,1,1);}
    else if(v%19<3){gx.fillStyle='#39A25B';gx.fillRect(x,y,1,1);}
    else if(v%59===0){gx.fillStyle='#71AE66';gx.fillRect(x,y,2,1);}
  }
  const tile=out.createPattern(grass,'repeat');
  // source-atop preserves the original PNG's transparent area boundaries.
  out.save();out.globalCompositeOperation='source-atop';
  out.beginPath();out.moveTo(0,Math.max(0,Math.min(fullH,cutoff(0))));
  for(let x=16;x<fullW;x+=16)out.lineTo(x,Math.max(0,Math.min(fullH,cutoff(x))));
  out.lineTo(fullW,Math.max(0,Math.min(fullH,cutoff(fullW))));
  out.lineTo(fullW,fullH);out.lineTo(0,fullH);out.closePath();
  out.fillStyle=tile;out.fill();out.restore();

  // Two small furniture classes protrude above the garden into the curb:
  // orange benches and narrow yellow-capped park lamp poles.
  // Detect local clusters ONLY near the road edge; avoid shop signage.
  const candidate=[];
  function component(kind){
    let mask=new Uint8Array(W*H),visited=new Uint8Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      let z=y*W+x,i=z*4,off=y-.5*x-edge;
      if(kind==='lamp'){
        if(off< -W*.33||off> -W*.065)continue;
        let r=pix[i],g=pix[i+1],b=pix[i+2];
        if(r>156&&g>95&&g<235&&b<135&&r-g>15&&g-b>35&&pix[i+3]>140)mask[z]=1;
      }else{
        if(off< -W*.09||off>W*.15)continue;
        let r=pix[i],g=pix[i+1],b=pix[i+2];
        if(r>100&&r<250&&g>65&&g<210&&b>20&&b<170&&r-g>15&&g-b>12&&pix[i+3]>140)mask[z]=1;
      }
    }
    if(kind==='bench'){
      const m2=mask.slice();
      // Connect individual wooden slats into one seat component.
      for(let y=2;y<H-2;y++)for(let x=2;x<W-2;x++){
        let z=y*W+x;if(!mask[z])continue;
        for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++)m2[yy*W+xx]=1;
      }
      mask=m2;
    }
    const stack=new Int32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      let start=y*W+x;if(!mask[start]||visited[start])continue;
      let head=0,tail=1;stack[0]=start;visited[start]=1;
      let x0=x,x1=x,y0=y,y1=y,count=0;
      while(head<tail){
        let z=stack[head++],cx=z%W,cy=Math.floor(z/W);count++;
        if(cx<x0)x0=cx;if(cx>x1)x1=cx;if(cy<y0)y0=cy;if(cy>y1)y1=cy;
        for(let n of [z-1,z+1,z-W,z+W]){
          if(n<0||n>=W*H||visited[n]||!mask[n])continue;
          let nx=n%W,ny=Math.floor(n/W);
          if(Math.abs(nx-cx)+Math.abs(ny-cy)!==1)continue;
          visited[n]=1;stack[tail++]=n;
        }
      }
      let bw=x1-x0+1,bh=y1-y0+1;
      if(kind==='lamp'){
        if(count>=W*.10&&count<W*2&&bw>=3&&bw<W*.055&&bh>=8&&bh<W*.08)
          candidate.push({kind,x:x0,y:y0,w:bw,h:bh});
      }else if(count>W*.9&&bw>W*.06&&bh>W*.025&&bw<W*.33&&bh<W*.2){
        candidate.push({kind,x:x0,y:y0,w:bw,h:bh});
      }
    }
  }
  component('lamp');component('bench');
  // Safety: excess matches indicate a bad road detection. Keep grass
  // but do not perform broad inpainting of unrelated image details.
  if(candidate.length<=20){
    for(const o of candidate){
      let x=Math.max(0,Math.floor((o.x-(o.kind==='lamp'?12:6))/ratio));
      let y=Math.max(0,Math.floor((o.y-(o.kind==='lamp'?14:7))/ratio));
      let ww=Math.ceil((o.w+(o.kind==='lamp'?24:12))/ratio);
      let hh=o.kind==='lamp'?
        Math.ceil(Math.max(o.h*6.6,W*.2)/ratio):
        Math.ceil((o.h+15)/ratio);
      if(x+ww>fullW)ww=fullW-x;
      if(y+hh>fullH)hh=fullH-y;
      if(ww<2||hh<2)continue;
      // Copy adjacent road at the same isometric slope. Clip to the
      // asphalt side so that the grass below stays entirely grass.
      const shift=Math.ceil(Math.max(ww*1.4,30/ratio));
      let dx=x+shift<fullW-ww?shift:-shift,sourceX=Math.max(0,Math.min(fullW-ww,x+dx));
      let sourceY=Math.max(0,Math.min(fullH-hh,y+.5*(sourceX-x)));
      out.save();out.beginPath();
      out.moveTo(x,y);out.lineTo(x+ww,y);
      out.lineTo(x+ww,Math.min(y+hh,cutoff(x+ww)));
      out.lineTo(x,Math.min(y+hh,cutoff(x)));
      out.closePath();out.clip();
      out.drawImage(im,sourceX,sourceY,ww,hh,x,y,ww,hh);
      out.restore();
    }
  }
  window.__gptStreet2Cleanup={grass:true,roadScore:bestScore,edge,candidates:candidate.map(x=>x.kind),size:[fullW,fullH]};
  return output.toDataURL('image/png');
}
function gptStreet2CleanPatch(html){
  function replace(a,b){let n=html.split(a).length-1;if(n!==1)throw Error('GPT_STREET2_IMAGE_ANCHOR '+n+' '+a.slice(0,100));html=html.replace(a,b);}
  replace("  .then(u => new Promise(res => { const im = new Image(); im.onload = () => { S2.url = u; s2Put(); res(); }; im.onerror = () => res(); im.src = u; }))",
  "  .then(u => new Promise(res => { const im = new Image(); im.onload = () => { Promise.resolve().then(() => gptStreet2Flatten(im)).then(clean => { S2.url = clean || u; s2Put(); res(); }).catch(err => { console.warn('GPT Street2 grass asset cleanup',err); S2.url = u; s2Put(); res(); }); }; im.onerror = () => res(); im.src = u; }))");
  replace("function s2Ground(g){ S2.slot = el('g', { class: 's2ground' }, g); s2Put(); }",
          gptStreet2Flatten.toString()+"\nfunction s2Ground(g){ S2.slot = el('g', { class: 's2ground' }, g); s2Put(); }");
  replace("GPT VERSION · v16a.28 · PARK","GPT VERSION · v16a.29 · FLAT PARK");
  return html;
}
self.gptStreet2CleanPatch=gptStreet2CleanPatch;

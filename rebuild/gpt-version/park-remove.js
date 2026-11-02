/* GPT Version: non-destructive cleanup of original baked Street2 PARK furniture.
 * Affects only the far-side park pixels of the decrypted background image.
 * No changes to collision, traffic, gang movement, trees, or production Grok.
 */
'use strict';
function gptParkCleanupRuntime(){
  let current=null;
  function wood(r,g,b){return r>=145&&r<=242&&g>=94&&g<=192&&b>=40&&b<=147&&r-g>25&&g-b>17;}
  function yellow(r,g,b){return r>=211&&g>=149&&g<=238&&b<137&&r-g>=12&&g-b>53;}
  function dark(r,g,b){return r<128&&g<135&&b<151&&r>24&&g>28&&b>34&&Math.abs(r-g)<46&&Math.abs(g-b)<53;}
  function cleanup(){
    if(!S2.url||current===S2.url||S2._gptCleanBusy||S2._gptCleanDone)return;
    let original=S2.url;
    current=original;S2._gptCleanBusy=true;
    let image=new Image();
    image.onload=function(){
      try{
        let W=image.naturalWidth,H=image.naturalHeight;
        if(W<100||H<100)throw Error('unexpected Street2 image dimensions');
        let sc=Math.min(1,960/W),w=Math.max(1,Math.round(W*sc)),h=Math.max(1,Math.round(H*sc));
        let scan=document.createElement('canvas');scan.width=w;scan.height=h;
        let sx=scan.getContext('2d',{willReadFrequently:true});
        sx.imageSmoothingEnabled=false;sx.drawImage(image,0,0,w,h);
        let data=sx.getImageData(0,0,w,h).data, len=w*h;
        let seeds=new Uint8Array(len),lit=new Uint8Array(len),inside=new Uint8Array(len);
        const bbox=S2.cfg.base,baseX=bbox.xy[0],baseY=bbox.xy[1],dx=bbox.wh[0]/w,dy=bbox.wh[1]/h;
        for(let y=0;y<h;y++){
          let yy=baseY+(y+.5)*dy;
          for(let x=0;x<w;x++){
            let cell=toGrid(baseX+(x+.5)*dx,yy);
            // The park is SOUTH of the road, not the market or the gang.
            if(cell.r<30.5||cell.r>49.6||cell.c< -21||cell.c>42)continue;
            let z=y*w+x,i=z*4,r=data[i],g=data[i+1],b=data[i+2];
            inside[z]=1;
            if(cell.r>=34.2&&wood(r,g,b))seeds[z]=1;
            if(yellow(r,g,b))lit[z]=1;
          }
        }
        // Join the three horizontal wooden slats, without using the colour
        // threshold as a gameplay collision rule.
        let spread=new Uint8Array(len);
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          let i=y*w+x;if(!seeds[i])continue;
          for(let yy=Math.max(0,y-4);yy<=Math.min(h-1,y+4);yy++){
            let row=yy*w;
            for(let xx=Math.max(0,x-6);xx<=Math.min(w-1,x+6);xx++)if(inside[row+xx])spread[row+xx]=1;
          }
        }
        let seen=new Uint8Array(len),stack=new Int32Array(len),objects=[];
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          let p=y*w+x;if(!spread[p]||seen[p])continue;
          let head=0,tail=1;stack[0]=p;seen[p]=1;
          let x0=x,x1=x,y0=y,y1=y,woodPixels=0;
          while(head<tail){
            let q=stack[head++],qx=q%w,qy=(q/w)|0;
            if(qx<x0)x0=qx;if(qx>x1)x1=qx;
            if(qy<y0)y0=qy;if(qy>y1)y1=qy;
            woodPixels+=seeds[q];
            if(qx>0&&!seen[q-1]&&spread[q-1]){seen[q-1]=1;stack[tail++]=q-1;}
            if(qx<w-1&&!seen[q+1]&&spread[q+1]){seen[q+1]=1;stack[tail++]=q+1;}
            if(qy>0&&!seen[q-w]&&spread[q-w]){seen[q-w]=1;stack[tail++]=q-w;}
            if(qy<h-1&&!seen[q+w]&&spread[q+w]){seen[q+w]=1;stack[tail++]=q+w;}
          }
          let ww=x1-x0+1,hh=y1-y0+1;
          if(ww>=28&&ww<=210&&hh>=10&&hh<=165&&woodPixels>=90&&woodPixels<=13000&&ww>=hh*.78){
            objects.push({kind:'bench',x:x0-6,y:y0-7,w:ww+12,h:hh+29});
          }
        }
        // Find yellow-capped park lamps with long blue-grey poles immediately
        // below. This avoids deleting flowers or ordinary yellow sign art.
        let seenYellow=new Uint8Array(len);
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          let p=y*w+x;if(!lit[p]||seenYellow[p])continue;
          let head=0,tail=1;stack[0]=p;seenYellow[p]=1;
          let x0=x,x1=x,y0=y,y1=y,area=0;
          while(head<tail){
            let q=stack[head++],qx=q%w,qy=(q/w)|0;area++;
            if(qx<x0)x0=qx;if(qx>x1)x1=qx;if(qy<y0)y0=qy;if(qy>y1)y1=qy;
            for(let t of [q-1,q+1,q-w,q+w]){
              if(t<0||t>=len||seenYellow[t]||!lit[t])continue;
              if(Math.abs(t%w-qx)+Math.abs(((t/w)|0)-qy)!==1)continue;
              seenYellow[t]=1;stack[tail++]=t;
            }
          }
          let ww=x1-x0+1,hh=y1-y0+1;
          if(area<12||area>1200||ww<3||ww>28||hh<4||hh>40)continue;
          let middle=Math.round((x0+x1)/2),darkRows=0,run=0,best=0;
          for(let yy=y1+3;yy<Math.min(h,y1+145);yy++){
            let d=0;for(let xx=Math.max(0,middle-4);xx<=Math.min(w-1,middle+4);xx++){
              let z=(yy*w+xx)*4;if(dark(data[z],data[z+1],data[z+2]))d++;
            }
            if(d>=2){darkRows++;run++;best=Math.max(best,run);}else run=0;
          }
          if(darkRows>=32&&best>=10)objects.push({kind:'lamp',x:x0-12,y:y0-8,w:ww+26,h:Math.min(165,darkRows+58)});
        }
        // Safety cap: never wipe a large part of the world on a false positive.
        objects=objects.filter(o=>o.x>=0&&o.y>=0&&o.x+o.w<w&&o.y+o.h<h);
        if(objects.length>22)objects=[];
        if(!objects.length){
          S2._gptCleanDone=true;window.__gptParkRemoved={benches:0,lamps:0,reason:'no safe image matches'};return;
        }
        // Clone neighbouring pavement/grass from the SAME native PNG
        // instead of painting fake grass over paths.
        let output=document.createElement('canvas');output.width=W;output.height=H;
        let oc=output.getContext('2d');oc.imageSmoothingEnabled=false;oc.drawImage(image,0,0);
        let cloned=[];
        function scoreSource(src,o){
          if(src<2||src+o.w>=w-2)return Infinity;
          let score=0,unsafe=0;
          for(let yy=Math.max(0,o.y);yy<Math.min(h,o.y+o.h);yy+=3)for(let xx=src;xx<src+o.w;xx+=3){
            let i=(yy*w+xx)*4;if(wood(data[i],data[i+1],data[i+2])||yellow(data[i],data[i+1],data[i+2]))unsafe++;
          }
          let sy=Math.max(1,Math.min(h-2,o.y)),sY=Math.min(h-2,o.y+o.h-1);
          for(let yy of [sy,Math.round((sy+sY)/2),sY]){
            for(let side of [0,1]){
              let a=(yy*w+(side?o.x+o.w:o.x))*4;
              let b=(yy*w+(side?src+o.w:src))*4;
              score+=Math.abs(data[a]-data[b])+Math.abs(data[a+1]-data[b+1])+Math.abs(data[a+2]-data[b+2]);
            }
          }
          return score+unsafe*5;
        }
        // Largest first prevents overlapping replacement sources.
        objects.sort((a,b)=>(b.w*b.h)-(a.w*a.h));
        for(let o of objects){
          let rx=Math.max(0,o.x),ry=Math.max(0,o.y),rw=Math.min(o.w,w-rx),rh=Math.min(o.h,h-ry);
          let choices=[rx-rw-11,rx+rw+11,rx-2*rw-15,rx+2*rw+15];
          let src=choices.map(x=>({x:Math.round(x),score:scoreSource(Math.round(x),{...o,x:rx,w:rw,h:rh})})).sort((a,b)=>a.score-b.score)[0];
          if(!src||!isFinite(src.score))continue;
          let x=Math.round(rx/sc),y=Math.round(ry/sc),cw=Math.round(rw/sc),ch=Math.round(rh/sc),from=Math.round(src.x/sc);
          cw=Math.min(cw,W-x,W-from);ch=Math.min(ch,H-y);
          if(cw<=2||ch<=2)continue;
          oc.drawImage(image,from,y,cw,ch,x,y,cw,ch);
          cloned.push({kind:o.kind,x:rx,y:ry});
        }
        if(cloned.length){
          // Change only the decoded game image. The original encrypted repo
          // data, traffic simulation, walkability and gang remain untouched.
          const newURL=output.toDataURL('image/png');
          const test=new Image();
          test.onload=function(){
            S2.url=newURL;
            if(S2.slot){let layer=S2.slot.querySelector('image.s2base');if(layer)layer.setAttribute('href',newURL);}
            if(XC.imgs)XC.imgs.set(newURL,test);
            S2._gptCleanDone=true;
            window.__gptParkRemoved={benches:cloned.filter(x=>x.kind==='bench').length,
                                     lamps:cloned.filter(x=>x.kind==='lamp').length};
          };
          test.onerror=function(){S2._gptCleanDone=true;};
          test.src=newURL;
        }else{S2._gptCleanDone=true;}
      }catch(e){S2._gptCleanDone=true;console.warn('[GPT] Park raster cleanup unavailable',e);}
      finally{S2._gptCleanBusy=false;}
    };
    image.onerror=function(){S2._gptCleanBusy=false;S2._gptCleanDone=true;};
    image.src=original;
  }
  window.__gptRemoveParkFurniture=cleanup;
}
function gptRemoveParkFurniturePatch(html){
  function one(a,b){const n=html.split(a).length-1;if(n!==1)throw Error('GPT_REMOVE_PARK_ANCHOR '+n+' '+a.slice(0,75));html=html.replace(a,b);}
  // Remove the three benches + three lamps GPT added in earlier patches.
  one('gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));',
      'EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));');
  // Restore original collision dimensions and normal seating radius.
  one('return prop(c+0.8,r+0.25,1.05,g=>','return prop(c+0.8,r+0.25,0.8,g=>');
  one('function lamp(c,r){ return prop(c,r,0.53,','function lamp(c,r){ return prop(c,r,0.35,');
  one('const RANGE_SEAT = 1.65;','const RANGE_SEAT = 1.35;');
  // Remove experimental extra atlas redrawing, which wasn't the park raster.
  one("var parkLevel=(S2X.far&&S2X.lv&&S2X.lv.g&&S2X.lv.g.getAttribute('display')!=='none'&&me.r>=36.35&&me.r<=51)?S2X.lv.g:null;",
      'var parkLevel=null;');
  one('window.__gptDepthDraw=v16DrawOcclusion;',
      gptParkCleanupRuntime.toString()+'\ngptParkCleanupRuntime();\nwindow.__gptDepthDraw=v16DrawOcclusion;');
  one("class: 's2base' }, S2.slot); }",
      "class: 's2base' }, S2.slot); if(window.__gptRemoveParkFurniture)window.__gptRemoveParkFurniture(); }");
  one('GPT VERSION · v16a.21','GPT VERSION · v16a.22');
  return html;
}
self.gptRemoveParkFurniturePatch=gptRemoveParkFurniturePatch;
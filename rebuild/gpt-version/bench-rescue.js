/* GPT Version only — repair original Street2's baked park bench. */
'use strict';
function gptBenchRuntime(){
  function wood(r,g,b){return r>126&&r<242&&g>74&&g<199&&b>29&&b<152&&r-g>26&&g-b>16&&r>g*1.16&&g>b*1.12;}
  var tmp=null,tmpCtx=null,reported=false;
  function overlap(c,r,mode){
    if(!OUT_ON||!XC.b||!XC.b.width||r<36.25||r>46.5||!S2.ready||WT.on||CV.on||FMI.on)return false;
    try{
      var q=P(c,r),v=S2F(q.x,q.y),d=window.devicePixelRatio||1,back=XC.b;
      var span=mode==='solid'?10:47;
      var x=Math.max(0,Math.floor((v.x-span)*d)),y=Math.max(0,Math.floor((v.y-(mode==='solid'?37:70))*d));
      var w=Math.min(back.width-x,Math.ceil(span*2*d)),h=Math.min(back.height-y,Math.ceil((mode==='solid'?34:86)*d));
      if(w<3||h<3)return false;
      var a=back.getContext('2d',{willReadFrequently:true}).getImageData(x,y,w,h).data,n=0;
      for(var iy=0;iy<h;iy+=2)for(var ix=0;ix<w;ix+=2){var i=(iy*w+ix)*4;if(wood(a[i],a[i+1],a[i+2]))n++;}
      return n>(mode==='solid'?5:35);
    }catch(e){return false;}
  }
  window.__gptBenchCollides=function(c,r){
    return me.forceAnim!=='sit'&&me.forceAnim!=='lie'&&overlap(c,r,'solid');
  };
  window.__gptBakedSeat=function(){
    if(!overlap(me.c,me.r,'near'))return null;
    return {c:me.c,r:me.r,zone:'street',objectId:'gpt_original_park_bench',
      seatIndex:0,pose:'sit',dir:me.dir==='se'?'se':'sw',distance:.6};
  };
  function paint(){
    if(!OUT_ON||!S2.ready||WT.on||CV.on||FMI.on||me.r<36.25||me.r>46.5||!XC.b||!v16OccCanvas||!v16OccCtx)return;
    try{
      var fr=floor.getBoundingClientRect(),p=meSpr.getBoundingClientRect(),d=window.devicePixelRatio||1;
      if(p.width<3||p.height<3)p=meSvg.getBoundingClientRect();
      if(p.width<3||p.height<3)return;
      var x=Math.max(0,Math.floor((p.left-fr.left-1)*d)),y=Math.max(0,Math.floor((p.top-fr.top-1)*d));
      var w=Math.min(XC.b.width-x,Math.ceil((p.width+2)*d)),h=Math.min(XC.b.height-y,Math.ceil((p.height+2)*d));
      if(w<2||h<2)return;
      var pixels=XC.b.getContext('2d',{willReadFrequently:true}).getImageData(x,y,w,h);
      var o=new ImageData(w,h),n=0;
      for(var i=0;i<pixels.data.length;i+=4){
        var r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];
        if(!wood(r,g,b))continue;
        o.data[i]=r;o.data[i+1]=g;o.data[i+2]=b;o.data[i+3]=pixels.data[i+3];n++;
      }
      if(n<5)return;
      if(!tmp){tmp=document.createElement('canvas');tmpCtx=tmp.getContext('2d');}
      if(tmp.width!==w||tmp.height!==h){tmp.width=w;tmp.height=h;}
      tmpCtx.putImageData(o,0,0);
      v16OccCtx.save();v16OccCtx.setTransform(1,0,0,1,0,0);v16OccCtx.globalAlpha=1;
      v16OccCtx.drawImage(tmp,x,y);v16OccCtx.restore();
    }catch(e){if(!reported){console.warn('park bench pigment compositor',e);reported=true;}}
  }
  window.__gptDepthDraw=function(){v16DrawOcclusion();paint();};
}
function gptBenchRescue(html){
  function one(a,b){var n=html.split(a).length-1;if(n!==1)throw Error('BENCH_RESCUE_ANCHOR '+n+' '+a.slice(0,75));html=html.replace(a,b);}
  // Original park benches are already rasterized. Do not place duplicates.
  one("gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));",
    "EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));");
  // Market depth atlases do not contain the park benches.
  one("var parkLevel=(S2X.far&&S2X.lv&&S2X.lv.g&&S2X.lv.g.getAttribute('display')!=='none'&&me.r>=36.35&&me.r<=51)?S2X.lv.g:null;",
    "var parkLevel=null;");
  one("window.__gptDepthDraw=v16DrawOcclusion;",gptBenchRuntime.toString()+"\ngptBenchRuntime();");
  one("return !SPEC && !!p && p.status === 'live' && !!p.me;",
    "return (OUT_ON && !!window.__gptBakedSeat) || (!SPEC && !!p && p.status === 'live' && !!p.me);");
  one("const seat = nearestSeat();",
    "const seat = nearestSeat() || (OUT_ON && window.__gptBakedSeat ? window.__gptBakedSeat() : null);");
  one("function s2xOK(c,r){return v16RoadOK(c,r)||(s2xInFar(c,r)&&!EXT.blk.some(function(b){return Math.hypot(c-b.c,r-b.r)<b.rad;}));}",
    "function s2xOK(c,r){if(window.__gptBenchCollides&&window.__gptBenchCollides(c,r))return false;return v16RoadOK(c,r)||(s2xInFar(c,r)&&!EXT.blk.some(function(b){return Math.hypot(c-b.c,r-b.r)<b.rad;}));}");
  one("GPT VERSION · v16a.21","GPT VERSION · v16a.22");
  return html;
}
self.gptBenchRescue=gptBenchRescue;
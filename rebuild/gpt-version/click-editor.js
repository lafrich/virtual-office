'use strict';
function gptClickEditorRuntime(){
  const KEY='vl-gpt-click-editor-v2';
  let state={nodes:{},raster:[]},history=[],on=false,selection=null,moveMode=false,drag=null;
  let toggleButton,menu,label,outline,shield,editButtons,origin=null,ready=false,pending=false,saving=false;
  function read(){try{let x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&x.nodes&&Array.isArray(x.raster))state=x;}catch(e){}}
  function store(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){hint('Memori browser penuh — reset beberapa edit.');}}
  function backup(){history.push(JSON.stringify(state));if(history.length>30)history.shift();}
  function hint(s){if(label)label.textContent=s;}
  function svgPoint(clientX,clientY){
    let p=room.createSVGPoint();p.x=clientX;p.y=clientY;let m=room.getScreenCTM();return m?p.matrixTransform(m.inverse()):null;
  }
  function imageXY(p){let b=S2.cfg.base;return {x:(p.x-b.xy[0])/b.wh[0]*(origin?.naturalWidth||1),y:(p.y-b.xy[1])/b.wh[1]*(origin?.naturalHeight||1)};}
  function props(){return EXT.props||[];}
  function key(n){let a=n._a||{x:0,y:0};return (n._k||'prop')+'_'+props().indexOf(n)+'_'+Math.round(a.x)+'_'+Math.round(a.y);}
  function vectorRect(n){
    try{let box=n.getBoundingClientRect();if(box.width>=2&&box.height>=2)return box;}catch(e){}
    try{let b=n.getBBox(),m=n.getScreenCTM();if(!m)return null;let xy=[[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(v=>({x:v[0]*m.a+v[1]*m.c+m.e,y:v[0]*m.b+v[1]*m.d+m.f}));return {left:Math.min(...xy.map(v=>v.x)),top:Math.min(...xy.map(v=>v.y)),right:Math.max(...xy.map(v=>v.x)),bottom:Math.max(...xy.map(v=>v.y)),width:Math.max(...xy.map(v=>v.x))-Math.min(...xy.map(v=>v.x)),height:Math.max(...xy.map(v=>v.y))-Math.min(...xy.map(v=>v.y))};}catch(e){return null;}
  }
  function pickVector(e){
    // The street renderer draws props onto canvas. SVG nodes may be invisible
    // to native hit-testing, so pick from their original world anchors too.
    let found=null,score=Infinity,ctm=room.getScreenCTM();
    for(let n of props()){
      if(!n||!n.isConnected||state.nodes[key(n)]?.deleted)continue;
      let r=vectorRect(n),rank=Infinity;
      if(r&&r.width>=2&&r.height>=2&&r.width<550&&r.height<680&&
        e.clientX>=r.left-9&&e.clientX<=r.right+9&&
        e.clientY>=r.top-9&&e.clientY<=r.bottom+9){
        rank=Math.hypot(e.clientX-(r.left+r.right)/2,e.clientY-(r.top+r.bottom)/2)*.42;
      }
      if(ctm&&n._a){
        let ax=ctm.a*n._a.x+ctm.c*n._a.y+ctm.e;
        let ay=ctm.b*n._a.x+ctm.d*n._a.y+ctm.f;
        let scale=Math.max(.65,Math.hypot(ctm.a,ctm.b));
        let isBench=n._k==='bench',isLamp=n._k==='lamp';
        let x0=ax-(isBench?19:isLamp?5:12)*scale;
        let x1=ax+(isBench?19:isLamp?9:12)*scale;
        let y0=ay-(isBench?21:isLamp?70:25)*scale;
        let y1=ay+(isBench?8:isLamp?7:12)*scale;
        if(e.clientX>=x0-7&&e.clientX<=x1+7&&
          e.clientY>=y0-7&&e.clientY<=y1+7){
          let cx=(x0+x1)/2,cy=(y0+y1)/2;
          rank=Math.min(rank,Math.hypot(e.clientX-cx,e.clientY-cy)*.35+4);
        }
      }
      if(rank<score){score=rank;found=n;}
    }
    return found;
  }
  function associatedBlock(n){
    if(n._gptBlk)return n._gptBlk;
    if(n._r==null||n._b==null)return null;
    let c=n._b-n._r,r=n._r,best=null,dist=.95;
    for(let blk of EXT.blk){
      let d=Math.hypot(blk.c-c,blk.r-r);
      if(d<dist){best=blk;dist=d;}
    }
    if(best){n._gptBlk=best;if(best._originalRad==null)best._originalRad=best.rad;}
    return best;
  }
  function applyNode(n){
    if(!n||!n.isConnected)return;
    let k=key(n),v=state.nodes[k]||{};
    if(n._gptOriginal===undefined)n._gptOriginal=n.getAttribute('transform')||'';
    let tr=[];
    if(v.x||v.y)tr.push('translate('+(v.x||0)+' '+(v.y||0)+')');
    if(v.angle)tr.push('rotate('+(v.angle||0)+' '+(n._a?.x||0)+' '+(n._a?.y||0)+')');
    if(n._gptOriginal)tr.push(n._gptOriginal);
    n.setAttribute('transform',tr.join(' '));
    n.style.display=v.deleted?'none':'';
    n.style.opacity=v.deleted?'0':'';
    let blk=associatedBlock(n);if(blk)blk.rad=v.deleted?0:blk._originalRad;
  }
  function applyNodes(){props().forEach(applyNode);}
  function openOriginal(next){
    if(origin){next();return;}
    if(!S2.ready||!S2.url){hint('Map belum selesai loading.');return;}
    let img=new Image();
    img.onload=function(){origin=img;ready=true;next();};
    img.onerror=function(){hint('Background belum bisa dibaca.');};
    img.src=S2.url;
  }
  function detectImageObject(q,callback){
    openOriginal(function(){
      let p=imageXY(q),w=origin.naturalWidth,h=origin.naturalHeight;
      let sampling=document.createElement('canvas');sampling.width=w;sampling.height=h;
      let ctx=sampling.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(origin,0,0);
      let ix=Math.round(p.x),iy=Math.round(p.y);
      if(ix<0||iy<0||ix>=w||iy>=h){hint('Tap objek di dalam map.');return;}
      let scale=Math.max(1,w/1500),rw=Math.round(70*scale),rh=Math.round(115*scale);
      let x0=Math.max(0,ix-rw),x1=Math.min(w-1,ix+rw),y0=Math.max(0,iy-rh),y1=Math.min(h-1,iy+rh);
      let scan=ctx.getImageData(x0,y0,x1-x0+1,y1-y0+1),dat=scan.data,sw=scan.width;
      function wood(r,g,b){return r>122&&r<250&&g>78&&g<205&&b>25&&b<162&&r-g>24&&g-b>13;}
      function yellow(r,g,b){return r>207&&g>140&&b<156&&r-g>12&&g-b>43;}
      let cols=[],rows=[],warm=0,light=0;
      for(let yy=0;yy<scan.height;yy+=2)for(let xx=0;xx<sw;xx+=2){
        let off=(yy*sw+xx)*4,r=dat[off],g=dat[off+1],b=dat[off+2];
        if(wood(r,g,b)){warm++;cols.push(xx);rows.push(yy);}
        if(yellow(r,g,b))light++;
      }
      // A single tap chooses a reasonable object-sized selection. The crop
      // remains inspectable with a yellow outline before any modification.
      let kind=warm>Math.max(15,light*1.4)?'bangku':light>14?'lampu':'gambar';
      let rect;
      if(kind==='bangku'&&cols.length){
        let mx=ix-x0,my=iy-y0,close=[];
        for(let j=0;j<cols.length;j++)if(Math.abs(cols[j]-mx)<75*scale&&Math.abs(rows[j]-my)<62*scale)close.push({x:cols[j],y:rows[j]});
        if(close.length>15){
          let a=Math.min(...close.map(t=>t.x)),b=Math.max(...close.map(t=>t.x)),c=Math.min(...close.map(t=>t.y)),d=Math.max(...close.map(t=>t.y));
          rect={x:x0+a-10*scale,y:y0+c-14*scale,w:Math.min(112*scale,b-a+20*scale),h:Math.min(86*scale,d-c+32*scale)};
        }
      }
      if(!rect&&kind==='lampu')rect={x:ix-23*scale,y:iy-83*scale,w:46*scale,h:128*scale};
      if(!rect)rect={x:ix-29*scale,y:iy-35*scale,w:58*scale,h:70*scale};
      rect.x=Math.round(Math.max(0,Math.min(w-2,rect.x)));
      rect.y=Math.round(Math.max(0,Math.min(h-2,rect.y)));
      rect.w=Math.round(Math.max(4,Math.min(w-rect.x,rect.w)));
      rect.h=Math.round(Math.max(4,Math.min(h-rect.y,rect.h)));
      callback({type:'raster',kind,rect,x:0,y:0,angle:0,deleted:false,id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)});
    });
  }
  function selectedData(){return selection?.type==='vector'?state.nodes[key(selection.node)]||{}:selection?.type==='raster'?state.raster.find(x=>x.id===selection.item.id)||selection.item:null;}
  function currentRect(){
    if(!selection)return null;
    if(selection.type==='vector')return vectorRect(selection.node);
    if(!origin)return null;
    let v=selectedData(),b=S2.cfg.base,sw=origin.naturalWidth,sh=origin.naturalHeight;
    let x=b.xy[0]+(v.rect.x+(v.x||0))/sw*b.wh[0],y=b.xy[1]+(v.rect.y+(v.y||0))/sh*b.wh[1],ww=v.rect.w/sw*b.wh[0],hh=v.rect.h/sh*b.wh[1];
    let p=room.createSVGPoint(),m=room.getScreenCTM();if(!m)return null;
    p.x=x;p.y=y;let a=p.matrixTransform(m);p.x=x+ww;p.y=y+hh;let c=p.matrixTransform(m);
    return{left:Math.min(a.x,c.x),top:Math.min(a.y,c.y),right:Math.max(a.x,c.x),bottom:Math.max(a.y,c.y),width:Math.abs(c.x-a.x),height:Math.abs(c.y-a.y)};
  }
  function drawOutline(){
    if(!outline||!on||!selection){if(outline)outline.style.display='none';return;}
    let r=currentRect();if(!r){outline.style.display='none';return;}
    let f=shield.getBoundingClientRect();
    outline.style.display='block';outline.style.left=(r.left-f.left)+'px';outline.style.top=(r.top-f.top)+'px';
    outline.style.width=Math.max(3,r.width)+'px';outline.style.height=Math.max(3,r.height)+'px';
  }
  function menuState(){
    menu.style.display=on&&selection?'flex':'none';
    if(!selection)return;
    let v=selectedData();
    label.textContent=(selection.type==='vector'?'Objek ':'Gambar ')+(selection.type==='vector'?(selection.node._k||'map'):selection.item.kind);
    editButtons[0].classList.toggle('chosen',moveMode);
    editButtons[2].textContent=v.deleted?'Restore':'Delete';
  }
  function eraseBackground(ctx,r){
    const cw=ctx.canvas.width,ch=ctx.canvas.height;
    let x=Math.max(0,Math.floor(r.x)),y=Math.max(0,Math.floor(r.y)),w=Math.min(cw-x,Math.ceil(r.w)),h=Math.min(ch-y,Math.ceil(r.h));
    if(w<1||h<1)return;
    let gap=Math.max(5,Math.ceil(w/6));
    let srcX=x+w+gap;if(srcX+w>cw)srcX=x-w-gap;
    srcX=Math.max(0,Math.min(cw-w,srcX));
    // Preserve street background rather than replacing with a plain fill.
    ctx.drawImage(origin,srcX,y,w,h,x,y,w,h);
  }
  function cutout(r){
    let cv=document.createElement('canvas');cv.width=Math.ceil(r.w);cv.height=Math.ceil(r.h);
    let ctx=cv.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(origin,r.x,r.y,r.w,r.h,0,0,r.w,r.h);
    let d=ctx.getImageData(0,0,cv.width,cv.height),a=d.data,tw=cv.width,th=cv.height;
    let corners=[[0,0],[tw-1,0],[0,th-1],[tw-1,th-1]];
    let bg=[0,0,0];corners.forEach(([x,y])=>{let i=(y*tw+x)*4;for(let c=0;c<3;c++)bg[c]+=a[i+c]/4;});
    for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
      let i=(y*tw+x)*4,dist=Math.hypot(a[i]-bg[0],a[i+1]-bg[1],a[i+2]-bg[2]);
      let edge=Math.min(x,y,tw-1-x,th-1-y),alpha=Math.max(0,Math.min(1,(dist-25)/34))*Math.max(0,Math.min(1,edge/5));
      a[i+3]=Math.round(a[i+3]*alpha);
    }
    ctx.putImageData(d,0,0);return cv;
  }
  function redrawRaster(){
    if(!origin||pending)return;
    pending=true;
    try{
      let canvas=document.createElement('canvas');canvas.width=origin.naturalWidth;canvas.height=origin.naturalHeight;
      let ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(origin,0,0);
      for(let op of state.raster)eraseBackground(ctx,op.rect);
      for(let op of state.raster){
        if(op.deleted)continue;
        let cv=cutout(op.rect),cx=op.rect.x+op.rect.w/2+(op.x||0),cy=op.rect.y+op.rect.h/2+(op.y||0);
        ctx.save();ctx.translate(cx,cy);ctx.rotate((op.angle||0)*Math.PI/180);
        ctx.drawImage(cv,-op.rect.w/2,-op.rect.h/2);ctx.restore();
      }
      const u=canvas.toDataURL('image/png'),img=new Image();
      img.onload=function(){
        S2.url=u;
        let layer=S2.slot&&S2.slot.querySelector('image.s2base');if(layer)layer.setAttribute('href',u);
        if(XC.imgs)XC.imgs.set(u,img);pending=false;
      };
      img.onerror=function(){pending=false;hint('Perubahan gambar gagal ditampilkan.');};
      img.src=u;
    }catch(e){pending=false;hint('Edit gagal: '+e.message);}
  }
  function mutate(change){
    if(!selection)return;
    backup();
    if(selection.type==='vector'){
      const k=key(selection.node);
      state.nodes[k]={...(state.nodes[k]||{}),...change};applyNode(selection.node);
    }else{
      let v=state.raster.find(x=>x.id===selection.item.id);
      if(!v){v={...selection.item};state.raster.push(v);}
      Object.assign(v,change);selection.item=v;redrawRaster();
    }
    store();drawOutline();menuState();
  }
  function moveSelected(){moveMode=!moveMode;menuState();hint(moveMode?'Tarik objek untuk memindahkan.':'Tap objek untuk memilih.');}
  function rotateSelected(){let v=selectedData();mutate({angle:((v?.angle||0)+15)%360});}
  function deleteSelected(){let v=selectedData();mutate({deleted:!v?.deleted});if(selectedData()?.deleted)selection=null;moveMode=false;menuState();drawOutline();}
  function undo(){if(!history.length){hint('Belum ada perubahan.');return;}
    try{state=JSON.parse(history.pop());}catch(e){return;}
    applyNodes();if(origin)redrawRaster();store();selection=null;moveMode=false;menuState();drawOutline();}
  function start(e){
    if(!on||e.pointerType==='touch'&&!e.isPrimary)return;
    e.preventDefault();
    let p=svgPoint(e.clientX,e.clientY);if(!p)return;
    drag={id:e.pointerId,p,start:e};
    if(moveMode&&selection){
      backup();
      if(selection.type==='raster'&&!state.raster.some(x=>x.id===selection.item.id))state.raster.push(selection.item);
      drag.moving=true;drag.startValue={...selectedData()};return;
    }
  }
  function moving(e){
    if(!drag||e.pointerId!==drag.id||!drag.moving)return;
    e.preventDefault();
    let p=svgPoint(e.clientX,e.clientY),a=drag.p,v=drag.startValue;if(!p)return;
    if(selection.type==='vector'){
      state.nodes[key(selection.node)]={...v,x:(v.x||0)+p.x-a.x,y:(v.y||0)+p.y-a.y};
      applyNode(selection.node);
    }else{
      const sw=origin.naturalWidth/S2.cfg.base.wh[0],sh=origin.naturalHeight/S2.cfg.base.wh[1],obj=selectedData();
      obj.x=(v.x||0)+(p.x-a.x)*sw;obj.y=(v.y||0)+(p.y-a.y)*sh;
    }
    drawOutline();
  }
  function finish(e){
    if(!drag||e.pointerId!==drag.id)return;
    e.preventDefault();let d=drag;drag=null;
    if(d.moving){store();if(selection?.type==='raster')redrawRaster();moveMode=false;menuState();drawOutline();return;}
    let n=pickVector(e);
    if(n){selection={type:'vector',node:n};menuState();drawOutline();return;}
    let p=svgPoint(e.clientX,e.clientY);if(!p)return;
    detectImageObject(p,function(obj){selection={type:'raster',item:obj};menuState();drawOutline();});
  }
  function setOn(v){
    on=v;shield.style.display=on?'block':'none';toggleButton.textContent=on?'✕ Close Editor':'✎ Edit Map';
    selection=null;moveMode=false;menuState();drawOutline();
    if(on){hint('Tap objek untuk memilih.');applyNodes();}
  }
  function reset(){
    if(!confirm('Reset semua edit map GPT Version pada browser ini?'))return;
    backup();state={nodes:{},raster:[]};applyNodes();if(origin)redrawRaster();store();
    selection=null;moveMode=false;menuState();drawOutline();
  }
  function init(){
    if(document.getElementById('gpt-click-editor'))return;
    read();
    let css=document.createElement('style');
    css.textContent=`
    #gpt-click-editor{position:fixed;right:9px;top:70px;z-index:2147483020;background:linear-gradient(#fff,#aecaf0);border:1px solid #1350ad;border-radius:4px;color:#123b70;padding:8px 10px;font:bold 12px Tahoma}
    #gpt-click-shield{position:absolute;inset:0;z-index:45;touch-action:none;pointer-events:none;cursor:crosshair}
    #gpt-click-outline{position:absolute;border:2px solid #ffd23b;box-shadow:0 0 0 1px #244775;pointer-events:none;display:none}
    #gpt-click-menu{position:fixed;left:8px;right:8px;bottom:calc(14px + env(safe-area-inset-bottom,0px));margin:auto;max-width:460px;z-index:2147483021;background:#ece9d8;border:2px solid #1156c5;border-radius:6px;box-shadow:0 10px 32px #18345477;display:none;flex-direction:column;font:12px Tahoma;color:#213856;overflow:hidden}
    #gpt-click-head{background:linear-gradient(#5aaafd,#064dc7);color:white;padding:7px 10px;font:bold 12px Tahoma}
    #gpt-click-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:12px 10px}
    #gpt-click-actions button{background:linear-gradient(#fff,#cedff4);border:1px solid #7e9cc8;border-radius:3px;padding:11px 5px;font:bold 13px Tahoma;color:#173b6e}
    #gpt-click-actions button.chosen{background:#8bade0}
    #gpt-click-actions button:last-child{color:#a03630}
    #gpt-click-controls{display:flex;gap:8px;justify-content:flex-end;padding:0 10px 10px}
    #gpt-click-controls button{font:11px Tahoma;border:1px solid #8ba6bd;background:#fff;border-radius:3px;padding:5px 9px}
    #gpt-click-label{padding:0 10px 9px;color:#566073;font:11px Tahoma}
    `;
    document.head.appendChild(css);
    toggleButton=document.createElement('button');toggleButton.id='gpt-click-editor';toggleButton.textContent='✎ Edit Map';document.body.appendChild(toggleButton);
    shield=document.createElement('div');shield.id='gpt-click-shield';shield.style.display='none';floor.appendChild(shield);
    outline=document.createElement('div');outline.id='gpt-click-outline';shield.appendChild(outline);
    // Capture input at document level. Canvas, avatar, road SVG, XP HUD and
    // mobile browser stacking contexts can otherwise intercept pointer taps.
    function inWorld(e){
      if(!on)return false;
      if(toggleButton.contains(e.target)||menu.contains(e.target))return false;
      let r=floor.getBoundingClientRect();
      return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
    }
    function captureDown(e){
      if(!inWorld(e))return;
      e.preventDefault();e.stopImmediatePropagation();start(e);
    }
    function captureMove(e){
      if(!on||!drag||e.pointerId!==drag.id)return;
      e.preventDefault();e.stopImmediatePropagation();moving(e);
    }
    function captureUp(e){
      if(!on||!drag||e.pointerId!==drag.id)return;
      e.preventDefault();e.stopImmediatePropagation();finish(e);
    }
    document.addEventListener('pointerdown',captureDown,true);
    document.addEventListener('pointermove',captureMove,true);
    document.addEventListener('pointerup',captureUp,true);
    document.addEventListener('pointercancel',function(e){if(drag&&drag.id===e.pointerId)drag=null;},true);
    document.addEventListener('click',function(e){
      if(!inWorld(e))return;
      e.preventDefault();e.stopImmediatePropagation();
    },true);
    menu=document.createElement('div');menu.id='gpt-click-menu';
    menu.innerHTML='<div id="gpt-click-head">Object Editor</div><div id="gpt-click-actions"><button>Move</button><button>Rotate ↻</button><button>Delete</button></div><div id="gpt-click-label"></div><div id="gpt-click-controls"><button id="gpt-click-undo">Undo</button><button id="gpt-click-reset">Reset</button></div>';
    document.body.appendChild(menu);
    label=menu.querySelector('#gpt-click-label');
    editButtons=[...menu.querySelectorAll('#gpt-click-actions button')];
    editButtons[0].addEventListener('click',moveSelected);
    editButtons[1].addEventListener('click',rotateSelected);
    editButtons[2].addEventListener('click',deleteSelected);
    menu.querySelector('#gpt-click-undo').addEventListener('click',undo);
    menu.querySelector('#gpt-click-reset').addEventListener('click',reset);
    toggleButton.addEventListener('click',()=>setOn(!on));
    let last=-1,applied=false;
    function frame(){
      let count=props().length;
      if(count!==last){last=count;applyNodes();}
      if(!applied&&state.raster.length&&S2.ready&&S2.url){applied=true;openOriginal(redrawRaster);}
      if(on&&selection)drawOutline();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.__gptClickEditor={get:()=>state,open:()=>setOn(true)};
}
function gptClickEditorPatch(html){
  function one(a,b){const count=html.split(a).length-1;if(count!==1)throw Error('GPT_CLICK_EDITOR_ANCHOR '+count+' '+a.slice(0,80));html=html.replace(a,b);}
  one("gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));",
      "EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));");
  one("return prop(c+0.8,r+0.25,1.05,g=>","return prop(c+0.8,r+0.25,0.8,g=>");
  one("function lamp(c,r){ return prop(c,r,0.53,","function lamp(c,r){ return prop(c,r,0.35,");
  one("const RANGE_SEAT = 1.65;","const RANGE_SEAT = 1.35;");
  one("var parkLevel=(S2X.far&&S2X.lv&&S2X.lv.g&&S2X.lv.g.getAttribute('display')!=='none'&&me.r>=36.35&&me.r<=51)?S2X.lv.g:null;","var parkLevel=null;");
  one("window.__gptDepthDraw=v16DrawOcclusion;",
      "window.__gptDepthDraw=v16DrawOcclusion;\n"+gptClickEditorRuntime.toString()+"\ngptClickEditorRuntime();");
  one("GPT VERSION · v16a.21","GPT VERSION · v16a.26");
  return html;
}
self.gptClickEditorPatch=gptClickEditorPatch;

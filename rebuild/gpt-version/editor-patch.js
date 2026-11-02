'use strict';
function gptEditorRuntime(){
  const STORE='vl-gpt-editor-v1';
  let data={objects:{},repairs:[]},history=[],active=false,mode='object',action='select',selected=null,box=null,source=null,drag=null;
  let original=null,originalUrl='',busy=false,button,panel,cover,outline,info,actions,tip;
  function message(s){if(tip)tip.textContent=s;}
  function read(){try{let o=JSON.parse(localStorage.getItem(STORE)||'null');if(o&&o.objects&&Array.isArray(o.repairs))data=o;}catch(e){}}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(data));message('Tersimpan otomatis di browser ini.');}catch(e){message('Gagal menyimpan. Ekspor JSON untuk backup.');}}
  function remember(){history.push(JSON.stringify(data));if(history.length>40)history.shift();}
  function items(){return EXT.props||[];}
  function key(n){let p=n._a||{x:0,y:0};return (n._k||'prop')+'-'+items().indexOf(n)+'-'+Math.round(p.x)+'-'+Math.round(p.y);}
  function decorate(n){
    if(!n||!n.isConnected)return;
    if(n._edBase===undefined)n._edBase=n.getAttribute('transform')||'';
    let state=data.objects[key(n)];
    n.style.display=state&&state.hide?'none':'';
    n.style.opacity=state&&state.hide?'0':'';
    let trans=[],p=n._a||{x:0,y:0};
    if(state){
      if(state.dx||state.dy)trans.push('translate('+(state.dx||0)+' '+(state.dy||0)+')');
      if(state.rotate)trans.push('rotate('+(state.rotate||0)+' '+p.x+' '+p.y+')');
    }
    if(n._edBase)trans.push(n._edBase);
    n.setAttribute('transform',trans.join(' '));
  }
  function refreshObjects(){items().forEach(decorate);}
  function point(e){let p=room.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(room.getScreenCTM().inverse());}
  function rect(a,b){
    let w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);
    if(w<4||h<4)return null;
    return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w,h};
  }
  function pick(e){
    let best=null,rank=Infinity;
    for(let n of items()){
      if(!n.isConnected||data.objects[key(n)]?.hide)continue;
      let r;try{r=n.getBoundingClientRect();}catch(_){continue;}
      if(r.width<2||r.height<2||r.width>420||r.height>540)continue;
      if(e.clientX<r.left-7||e.clientX>r.right+7||e.clientY<r.top-7||e.clientY>r.bottom+7)continue;
      let d=Math.hypot(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)+r.width*r.height/1800;
      if(d<rank){rank=d;best=n;}
    }
    return best;
  }
  function screenRect(r){
    let c=room.getScreenCTM();if(!c)return null;
    let p=room.createSVGPoint();p.x=r.x;p.y=r.y;let a=p.matrixTransform(c);
    p.x=r.x+r.w;p.y=r.y+r.h;let b=p.matrixTransform(c);
    let v=cover.getBoundingClientRect();
    return {left:Math.min(a.x,b.x)-v.left,top:Math.min(a.y,b.y)-v.top,width:Math.abs(a.x-b.x),height:Math.abs(a.y-b.y)};
  }
  function highlight(){
    if(!outline||!active)return;
    let r=null;
    if(selected&&selected.isConnected){
      let b=selected.getBoundingClientRect(),f=cover.getBoundingClientRect();
      r={left:b.left-f.left,top:b.top-f.top,width:b.width,height:b.height};
    }else if(box)r=screenRect(box);
    if(!r){outline.style.display='none';return;}
    outline.style.display='block';
    for(let p of ['left','top','width','height'])outline.style[p]=Math.max(p==='width'||p==='height'?3:-10000,r[p])+'px';
  }
  function changeNode(v){
    if(!selected)return;
    remember();let k=key(selected);data.objects[k]={...(data.objects[k]||{}),...v};
    decorate(selected);save();render();highlight();
  }
  function imgXY(q,w,h){let b=S2.cfg.base;return{x:Math.round((q.x-b.xy[0])*w/b.wh[0]),y:Math.round((q.y-b.xy[1])*h/b.wh[1])};}
  function imageBox(r,w,h){
    let a=imgXY(r,w,h),b=imgXY({x:r.x+r.w,y:r.y+r.h},w,h);
    let x=Math.max(0,Math.min(w-1,a.x)),y=Math.max(0,Math.min(h-1,a.y));
    return{x,y,w:Math.max(1,Math.min(w-x,b.x-x)),h:Math.max(1,Math.min(h-y,b.y-y))};
  }
  function ensureImage(next){
    if(original){next();return;}
    if(!S2.url){message('Map belum selesai loading.');return;}
    originalUrl=S2.url;let img=new Image();
    img.onload=function(){original=img;next();};
    img.onerror=function(){message('Gambar asli tidak bisa dibaca.');originalUrl='';};
    img.src=originalUrl;
  }
  function redrawRaster(){
    if(!original||busy)return;
    busy=true;
    try{
      let cv=document.createElement('canvas');cv.width=original.naturalWidth;cv.height=original.naturalHeight;
      let ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(original,0,0);
      for(let op of data.repairs){
        if(!op||!op.to||!op.from)continue;
        let dest=imageBox(op.to,cv.width,cv.height);
        let q=imgXY(op.from,cv.width,cv.height);
        let x=Math.max(0,Math.min(cv.width-dest.w,q.x)),y=Math.max(0,Math.min(cv.height-dest.h,q.y));
        ctx.drawImage(original,x,y,dest.w,dest.h,dest.x,dest.y,dest.w,dest.h);
      }
      let url=cv.toDataURL('image/png'),img=new Image();
      img.onload=function(){
        S2.url=url;
        let node=S2.slot&&S2.slot.querySelector('image.s2base');
        if(node)node.setAttribute('href',url);
        if(XC.imgs)XC.imgs.set(url,img);
        busy=false;
      };
      img.onerror=function(){busy=false;message('Gambar hasil edit gagal dimuat.');};
      img.src=url;
    }catch(e){busy=false;message('Edit gambar gagal: '+e.message);}
  }
  function erase(){
    if(!box){message('Drag kotak di sekitar bangku atau lampu dulu.');return;}
    ensureImage(function(){
      let b=S2.cfg.base;
      let from=source||{x:box.x+box.w+5,y:box.y};
      if(from.x+box.w>b.xy[0]+b.wh[0])from.x=box.x-box.w-5;
      from.x=Math.max(b.xy[0],Math.min(b.xy[0]+b.wh[0]-box.w,from.x));
      from.y=Math.max(b.xy[1],Math.min(b.xy[1]+b.wh[1]-box.h,from.y));
      remember();data.repairs.push({to:{...box},from:{...from}});
      redrawRaster();save();message('Area ditutup. Jika teksturnya tidak cocok, Undo lalu pilih sumber manual.');
    });
  }
  function undo(){
    if(!history.length){message('Tidak ada edit untuk di-Undo.');return;}
    try{data=JSON.parse(history.pop());}catch(_){return;}
    refreshObjects();if(original||data.repairs.length)ensureImage(redrawRaster);
    save();render();highlight();
  }
  function reset(){
    if(!confirm('Reset seluruh edit map pada browser ini?'))return;
    remember();data={objects:{},repairs:[]};refreshObjects();
    if(original)redrawRaster();save();selected=null;box=null;source=null;render();highlight();
  }
  function exportEdits(){
    let obj={format:'virtual-life-gpt-editor-v1',data};
    let blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
    let a=document.createElement('a');a.href=url;a.download='virtual-life-map-edits.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  function importEdits(file){
    if(!file)return;
    let fr=new FileReader();fr.onload=function(){
      try{let o=JSON.parse(fr.result),v=o.data||o;if(!v.objects||!Array.isArray(v.repairs))throw Error('File tidak sesuai');
        remember();data=v;refreshObjects();ensureImage(redrawRaster);save();render();highlight();
      }catch(e){message('Import gagal: '+e.message);}
    };fr.readAsText(file);
  }
  function option(label,fn,danger){
    let b=document.createElement('button');b.type='button';b.textContent=label;
    b.className='gpt-edit-choice'+(danger?' destructive':'');b.addEventListener('click',fn);actions.appendChild(b);return b;
  }
  function render(){
    if(!actions)return;
    actions.replaceChildren();
    info.textContent=selected?'Objek: '+(selected._k||'prop'):box?'Area gambar dipilih':'Tap objek / drag area di peta';
    if(mode==='object'){
      option('Pilih objek',()=>{action='select';message('Tap objek yang bisa diedit.');});
      if(selected){
        option('↶ 15°',()=>{let v=data.objects[key(selected)]||{};changeNode({rotate:(v.rotate||0)-15});});
        option('15° ↷',()=>{let v=data.objects[key(selected)]||{};changeNode({rotate:(v.rotate||0)+15});});
        option('Geser',()=>{action='move';message('Tarik objek untuk memindahkannya.');});
        option('Sembunyikan',()=>{changeNode({hide:true});selected=null;render();highlight();},true);
      }
    }else{
      option('Kotak area',()=>{action='box';message('Drag persegi di sekitar objek yang menyatu dengan gambar.');});
      if(box){
        option('Ambil tekstur',()=>{action='source';message('Tap area kosong dengan rumput/trotoar serupa.');});
        option('Hapus area',erase,true);
      }
    }
    option('Undo',undo);
    option('Reset',reset,true);
    option('Ekspor',exportEdits);
    let input=document.createElement('input');input.type='file';input.accept='.json';input.style.display='none';
    input.addEventListener('change',e=>{importEdits(e.target.files?.[0]);e.target.value='';});
    actions.appendChild(input);option('Impor',()=>input.click());
  }
  function switchMode(m){
    mode=m;action=m==='area'?'box':'select';selected=null;box=null;source=null;
    panel.querySelectorAll('[data-tab]').forEach(n=>n.classList.toggle('current',n.dataset.tab===m));
    message(m==='area'?'Drag kotak di sekitar bangku/lampu pada background.':'Tap objek terpisah untuk memilihnya.');
    render();highlight();
  }
  function toggle(next){
    active=next===undefined?!active:!!next;
    panel.style.display=active?'block':'none';cover.style.display=active?'block':'none';
    button.textContent=active?'✕ Tutup Editor':'✎ Edit Map';
    document.body.classList.toggle('gpt-edit-active',active);
    selected=null;box=null;source=null;action=mode==='area'?'box':'select';
    if(active){refreshObjects();message('Edit lokal. Ekspor JSON untuk backup atau kirim hasilnya.');}
    render();highlight();
  }
  function down(e){
    if(!active||e.target!==cover||e.pointerType==='touch'&&!e.isPrimary)return;
    e.preventDefault();cover.setPointerCapture(e.pointerId);
    let p=point(e);drag={id:e.pointerId,from:p,last:p,action,selected};
    if(action==='move'&&selected){remember();drag.old={...(data.objects[key(selected)]||{})};}
    if(action==='box'){selected=null;box=null;source=null;}
  }
  function move(e){
    if(!drag||e.pointerId!==drag.id)return;
    e.preventDefault();let p=point(e);drag.last=p;
    if(drag.action==='box')box=rect(drag.from,p);
    else if(drag.action==='move'&&drag.selected){
      let n=drag.selected,v=drag.old||{};
      data.objects[key(n)]={...v,dx:(v.dx||0)+p.x-drag.from.x,dy:(v.dy||0)+p.y-drag.from.y};
      decorate(n);
    }
    highlight();
  }
  function up(e){
    if(!drag||drag.id!==e.pointerId)return;
    e.preventDefault();let d=drag;drag=null;
    let p=point(e),distance=Math.hypot(p.x-d.from.x,p.y-d.from.y);
    if(d.action==='box'){box=rect(d.from,p);if(!box)message('Drag kotak yang lebih besar.');}
    else if(d.action==='source'){
      if(box){source={x:p.x-box.w/2,y:p.y-box.h/2};message('Sumber tekstur dipilih. Tekan Hapus area.');}
      action='box';
    }else if(d.action==='select'||d.action==='move'&&distance<2){
      selected=pick(e);if(!selected)message('Objek ini menyatu dengan gambar. Pilih tab Area gambar.');
    }else if(d.action==='move'&&d.selected){save();action='select';}
    render();highlight();
  }
  function init(){
    if(document.getElementById('gpt-edit-toggle'))return;
    read();
    let style=document.createElement('style');
    style.textContent=`
#gpt-edit-toggle{position:fixed;top:70px;right:10px;z-index:2147483010;padding:7px 11px;background:linear-gradient(white,#b0d0f4);border:1px solid #1244ba;color:#123b6e;font:bold 12px Tahoma;border-radius:3px}
#gpt-edit-panel{position:fixed;left:8px;right:8px;bottom:8px;max-width:490px;max-height:54dvh;overflow:auto;margin:auto;z-index:2147483011;background:#ece9d8;border:2px solid #1452be;box-shadow:0 8px 30px #1238;border-radius:6px;font:12px Tahoma;color:#233354}
#gpt-edit-title{background:linear-gradient(#5bb1fb,#0750c8);padding:8px 10px;color:white;font-weight:bold}
#gpt-edit-tabs{display:flex;gap:5px;padding:8px 9px 0}
#gpt-edit-tabs button{flex:1;padding:8px;border:1px solid #839cb9;background:white;color:#193d6c;font:bold 12px Tahoma}
#gpt-edit-tabs button.current{background:#c7dffc}
#gpt-edit-info{padding:8px 10px;font-weight:bold}
#gpt-edit-actions{display:flex;flex-wrap:wrap;gap:6px;padding:5px 9px 10px}
.gpt-edit-choice{flex:1 0 auto;min-width:65px;padding:8px 9px;background:linear-gradient(#fff,#d5e3f1);border:1px solid #8aa0b7;border-radius:3px;color:#153965;font:bold 11px Tahoma}
.gpt-edit-choice.destructive{color:#a42a26}
#gpt-edit-note{padding:7px 10px;background:#fff8da;color:#675735;border-top:1px solid #d0c8a4;font:11px Tahoma}
#gpt-edit-cover{position:absolute;inset:0;z-index:55;touch-action:none;cursor:crosshair}
#gpt-edit-highlight{position:absolute;border:2px dashed #fbc02d;outline:1px solid #253a6a;pointer-events:none;display:none}
body.gpt-edit-active #dpad,body.gpt-edit-active .ctl,body.gpt-edit-active .acts{opacity:.25!important;pointer-events:none!important}
`;
    document.head.appendChild(style);
    button=document.createElement('button');button.id='gpt-edit-toggle';button.textContent='✎ Edit Map';
    button.addEventListener('click',()=>toggle());document.body.appendChild(button);
    cover=document.createElement('div');cover.id='gpt-edit-cover';cover.style.display='none';
    outline=document.createElement('div');outline.id='gpt-edit-highlight';cover.appendChild(outline);
    floor.appendChild(cover);
    cover.addEventListener('pointerdown',down);cover.addEventListener('pointermove',move);cover.addEventListener('pointerup',up);
    cover.addEventListener('pointercancel',()=>{drag=null;});
    panel=document.createElement('div');panel.id='gpt-edit-panel';panel.style.display='none';
    panel.innerHTML='<div id="gpt-edit-title">Virtual Life · Map Editor</div><div id="gpt-edit-tabs"><button data-tab="object" class="current">Objek</button><button data-tab="area">Area gambar</button></div><div id="gpt-edit-info"></div><div id="gpt-edit-actions"></div><div id="gpt-edit-note"></div>';
    document.body.appendChild(panel);
    info=panel.querySelector('#gpt-edit-info');actions=panel.querySelector('#gpt-edit-actions');tip=panel.querySelector('#gpt-edit-note');
    panel.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchMode(b.dataset.tab)));
    refreshObjects();render();
    if(data.repairs.length){
      let attempts=0,timer=setInterval(()=>{attempts++;if(S2.url){clearInterval(timer);ensureImage(redrawRaster);}else if(attempts>100)clearInterval(timer);},220);
    }
    let lastObjectCount=-1;function frame(){let count=items().length;if(count!==lastObjectCount){lastObjectCount=count;refreshObjects();}if(active)highlight();requestAnimationFrame(frame);}requestAnimationFrame(frame);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.__gptMapEditor={open:()=>toggle(true),close:()=>toggle(false),get:()=>data};
}
function gptEditorPatch(html){
  function one(a,b){let n=html.split(a).length-1;if(n!==1)throw Error('GPT_EDITOR_ANCHOR '+n+' '+a.slice(0,90));html=html.replace(a,b);}
  // Undo earlier experimental props. Preserve the park walkable region and gang.
  one('gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));',
      'EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));');
  one('return prop(c+0.8,r+0.25,1.05,g=>','return prop(c+0.8,r+0.25,0.8,g=>');
  one('function lamp(c,r){ return prop(c,r,0.53,','function lamp(c,r){ return prop(c,r,0.35,');
  one('const RANGE_SEAT = 1.65;','const RANGE_SEAT = 1.35;');
  one("var parkLevel=(S2X.far&&S2X.lv&&S2X.lv.g&&S2X.lv.g.getAttribute('display')!=='none'&&me.r>=36.35&&me.r<=51)?S2X.lv.g:null;","var parkLevel=null;");
  one('window.__gptDepthDraw=v16DrawOcclusion;',
      'window.__gptDepthDraw=v16DrawOcclusion;\n'+gptEditorRuntime.toString()+'\ngptEditorRuntime();');
  one('GPT VERSION · v16a.21','GPT VERSION · v16a.24');
  return html;
}
self.gptEditorPatch=gptEditorPatch;

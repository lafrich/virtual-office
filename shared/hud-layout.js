/* HUD Layout: per-element scale + safe-area-aware anchor/offset, Phone vs Desktop. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLHudLayout=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
 'use strict';
 const ELEMENTS=['lifePanel','money','hpButton','bagButton','phone','bag','action','run','needs','toast','dock'];
 const ANCHORS=['top-left','top-right','bottom-left','bottom-right'];
 const MIN_SCALE=0.5, MAX_SCALE=1.5, MIN_TAP=40;
 const SELECTORS={
  lifePanel:['#semestaLifePlayPanel'],
  money:['#vs-money'],
  hpButton:['#ptPhoneBtn'],
  bagButton:['#ptBagBtn'],
  phone:['#vs-layer .vs-nkc','#vs-layer .vs-nk','.vs-nk','#ptWindow'],
  bag:['#ptWindow'],
  action:['#ptActionBtn'],
  run:['#ptRunBtn'],
  needs:['#vs-needs'],
  toast:['#vs-tip'],
  dock:['#y2-dock']
 };
 const ORIGIN={
  lifePanel:'top left',money:'center center',hpButton:'center center',bagButton:'center center',
  phone:'center center', bag:'top left', action:'center center',
  run:'bottom left', needs:'top left', toast:'top left', dock:'bottom right'
 };

 function num(v,min,max,fallback){
  const n=Number(v);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
 }
 function slot(scale,anchor,x,y){
  return {scale,anchor:ANCHORS.includes(anchor)?anchor:'top-left',x,y};
 }
 function desktopProfile(){
  return {
   lifePanel:slot(1,'top-left',10,10),
   money:slot(1,'bottom-right',250,30),hpButton:slot(1,'bottom-right',156,30),bagButton:slot(1,'bottom-right',97,30),
   phone:slot(1,'top-right',16,48),
   bag:slot(1,'top-left',16,48),
   action:slot(1,'bottom-right',12,10),
   run:slot(1,'bottom-left',148,12),
   needs:slot(1,'top-left',12,10),
   toast:slot(1,'top-left',12,64),
   dock:slot(1,'bottom-right',12,10)
  };
 }
 function phoneProfile(){
  // Smaller chrome on a 390×844 phone: windows shrink the most,
  // action/run stay at or above a 40px tap target.
  return {
   lifePanel:slot(0.88,'top-left',5,5),
   money:slot(1,'bottom-right',248,29),hpButton:slot(1,'bottom-right',154,29),bagButton:slot(1,'bottom-right',95,29),
   phone:slot(0.72,'top-right',10,40),
   bag:slot(0.82,'top-left',10,40),
   action:slot(0.72,'bottom-right',10,10),
   run:slot(0.8,'bottom-left',148,12),
   needs:slot(0.8,'top-left',10,8),
   toast:slot(0.86,'top-left',10,52),
   dock:slot(1,'bottom-right',10,8)
  };
 }
 function defaults(){return {desktop:desktopProfile(),phone:phoneProfile()};}

 function normalizeSlot(raw, fallback){
  const base=fallback||slot(1,'top-left',12,12);
  const scale=num(raw&&raw.scale,MIN_SCALE,MAX_SCALE,base.scale);
  const anchor=raw&&ANCHORS.includes(raw.anchor)?raw.anchor:base.anchor;
  return {
   scale,
   anchor,
   x:num(raw&&raw.x,-480,480,base.x),
   y:num(raw&&raw.y,-480,480,base.y)
  };
 }
 function normalizeProfile(raw, kind){
  const base=kind==='phone'?phoneProfile():desktopProfile();
  const src=raw&&typeof raw==='object'?raw:{};
  const out={};
  ELEMENTS.forEach(id=>{out[id]=normalizeSlot(src[id],base[id]);});
  return out;
 }
 function normalize(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  return {
   desktop:normalizeProfile(src.desktop,'desktop'),
   phone:normalizeProfile(src.phone,'phone')
  };
 }
 function detectProfile(doc, hint){
  if(hint==='phone'||hint==='desktop')return hint;
  try{
   const d=doc||(root&&root.document);
   if(d&&d.documentElement&&d.documentElement.classList.contains('vl-device-frame'))return 'phone';
   const hinted=d&&d.documentElement&&d.documentElement.dataset&&d.documentElement.dataset.hudProfile;
   if(hinted==='phone'||hinted==='desktop')return hinted;
   const view=(d&&d.defaultView)||(root&&root.window)||root;
   if(view&&view.matchMedia&&view.matchMedia('(max-width:760px)').matches)return 'phone';
   if(view&&view.innerWidth&&view.innerWidth<=760)return 'phone';
  }catch{}
  return 'desktop';
 }
 function pick(gameplay, kind){
  const layout=normalize(gameplay&&gameplay.modules&&gameplay.modules.hudLayout);
  return layout[kind==='phone'?'phone':'desktop'];
 }
 function samePos(a,b){
  return a&&b&&a.anchor===b.anchor&&Number(a.x)===Number(b.x)&&Number(a.y)===Number(b.y);
 }
 function findEl(doc, id){
  const list=SELECTORS[id]||[];
  for(const sel of list){
   const el=doc.querySelector(sel);
   if(!el)continue;
   if(id==='phone'&&el.id==='ptWindow'&&el.getAttribute('data-kind')==='bag')continue;
   if(id==='bag'&&el.id==='ptWindow'&&el.getAttribute('data-kind')!=='bag')continue;
   if(id==='phone'&&el.id==='ptWindow'&&el.getAttribute('data-kind')!=='phone'&&!el.querySelector('.vs-nk'))continue;
   return el;
  }
  return null;
 }
 function safeInsets(view){
  const cs=view&&view.getComputedStyle?view.getComputedStyle(view.document.documentElement):null;
  const read=n=>{
   if(!cs)return 0;
   const v=cs.getPropertyValue(n)||'0';
   const n2=parseFloat(v);
   return Number.isFinite(n2)?n2:0;
  };
  // Fallback constants; visual viewport env() is applied via CSS when we write calc().
  return {t:read('--sa-t')||0,r:read('--sa-r')||0,b:read('--sa-b')||0,l:read('--sa-l')||0};
 }
 function hostBox(host){
  const r=host.getBoundingClientRect();
  return {w:r.width||host.clientWidth||1,h:r.height||host.clientHeight||1,left:r.left,top:r.top};
 }
 function placedRect(host, el, slot, natural){
  const hb=hostBox(host);
  const scale=slot.scale;
  const w=Math.max(1,(natural.w||el.offsetWidth||40)*scale);
  const h=Math.max(1,(natural.h||el.offsetHeight||40)*scale);
  const sa=safeInsets(host.ownerDocument&&host.ownerDocument.defaultView);
  let ox=slot.x, oy=slot.y;
  if(slot.anchor.indexOf('left')>=0)ox+=sa.l;
  if(slot.anchor.indexOf('right')>=0)ox+=sa.r;
  if(slot.anchor.indexOf('top')>=0)oy+=sa.t;
  if(slot.anchor.indexOf('bottom')>=0)oy+=sa.b;
  let x=ox,y=oy;
  if(slot.anchor==='top-right'){x=hb.w-w-ox;y=oy;}
  else if(slot.anchor==='bottom-left'){x=ox;y=hb.h-h-oy;}
  else if(slot.anchor==='bottom-right'){x=hb.w-w-ox;y=hb.h-h-oy;}
  else {x=ox;y=oy;}
  x=Math.min(Math.max(0,x),Math.max(0,hb.w-w));
  y=Math.min(Math.max(0,y),Math.max(0,hb.h-h));
  return {x,y,w,h,scale};
 }
 function overlap(a,b){
  return !(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
 }
 function resolveOverlaps(rects, mark){
  const order=['needs','toast','dock','action','run','phone','bag']; // LifePanel is movable but exempt from automatic HUD nudges.
  const nudged={};
  order.forEach(id=>{
   const cur=rects[id];if(!cur)return;
   let guard=0;
   while(guard++<8){
    let hit=null;
    for(const other of order){
     if(other===id||!rects[other]||!nudged[other]&&other!==id)continue;
     if(other!==id&&rects[other]&&overlap(cur,rects[other])&&order.indexOf(other)<order.indexOf(id)){hit=rects[other];break;}
    }
    if(!hit&&mark&&overlap(cur,mark))hit=mark;
    if(!hit)break;
    cur.y=hit.y+hit.h+6;
   }
   nudged[id]=true;
  });
  return rects;
 }
 function naturalSize(el){
  const tr=el.style.transform;
  el.style.transform='none';
  const r=el.getBoundingClientRect();
  el.style.transform=tr;
  return {w:r.width||el.offsetWidth||40,h:r.height||el.offsetHeight||40};
 }
 function applyTo(host, gameplay, kind){
  if(!host)return {ok:false};
  const doc=host.ownerDocument||document;
  const profile=detectProfile(doc,kind);
  const slots=pick(gameplay,profile);
  const base=profile==='phone'?phoneProfile():desktopProfile();
  const markEl=doc.getElementById('vl-lafrich-mark');
  const hb=hostBox(host);
  const mark=markEl?(()=>{const r=markEl.getBoundingClientRect();return {x:r.left-hb.left,y:r.top-hb.top,w:r.width,h:r.height};})():null;
  const boxes={};
  ELEMENTS.forEach(id=>{
   const el=findEl(doc,id);
   if(!el||el.hidden)return;
   const nat=naturalSize(el);
   const minScale=Math.min(MAX_SCALE,Math.max(slots[id].scale,Math.min(1,MIN_TAP/Math.min(nat.w,nat.h))));
   const used=Object.assign({},slots[id],{scale:minScale});
   boxes[id]=Object.assign(placedRect(host,el,used,nat),{id,el,custom:!samePos(used,base[id])});
  });
  resolveOverlaps(boxes,mark);
  ELEMENTS.forEach(id=>{
   const box=boxes[id];if(!box||!box.el)return;
   const el=box.el;
   // Buttons are nested inside the capsule dock. Absolute top/left would
   // position them relative to that parent, rather than the game viewport.
   // A local translation instead positions them in host-screen coordinates.
   if(box.custom&&['action','hpButton','bagButton','money'].includes(id)){
    if(el.dataset.hudPos==='translated'){
     el.style.transform='none';
    }else{
     el.style.left='';el.style.top='';el.style.right='';el.style.bottom='';el.style.position='';
     el.style.transform='none';
    }
    const hb=hostBox(host),r=el.getBoundingClientRect();
    const dx=box.x-(r.left-hb.left),dy=box.y-(r.top-hb.top);
    el.style.transform='translate('+Math.round(dx)+'px,'+Math.round(dy)+'px) scale('+box.scale+')';
    el.style.transformOrigin='top left';
    el.dataset.hudPos='translated';el.dataset.hudScale=String(box.scale);
    return;
   }
   el.style.transform='scale('+box.scale+')';
   el.style.transformOrigin=box.custom?'top left':(ORIGIN[id]||'top left');
   if(box.custom){
    el.style.position='absolute';
    el.style.left=box.x+'px';
    el.style.top=box.y+'px';
    el.style.right='auto';
    el.style.bottom='auto';
    el.style.margin='0';
   }else{
    if(el.dataset.hudPos){
     el.style.left='';el.style.top='';el.style.right='';el.style.bottom='';el.style.position='';
     delete el.dataset.hudPos;
    }
   }
   if(box.custom)el.dataset.hudPos='1';
   el.dataset.hudScale=String(box.scale);
   el.style.pointerEvents=el.style.pointerEvents||'';
  });
  host.dataset.hudProfile=profile;
  return {ok:true,profile,boxes,mark};
 }
 function measure(host, gameplay, kind){
  const applied=applyTo(host,gameplay,kind);
  const doc=host.ownerDocument||document;
  const hb=hostBox(host);
  const view=hb.w*hb.h||1;
  const boxes={};
  ELEMENTS.forEach(id=>{
   if(id==='phone'||id==='bag')return;
   const el=findEl(doc,id);
   if(!el||el.hidden)return;
   const cs=doc.defaultView&&doc.defaultView.getComputedStyle?doc.defaultView.getComputedStyle(el):null;
   if(cs&&(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0))return;
   if(id==='toast'&&!el.classList.contains('on'))return;
   const r=el.getBoundingClientRect();
   if(r.width<2||r.height<2)return;
   boxes[id]={id,x:r.left-hb.left,y:r.top-hb.top,w:r.width,h:r.height,scale:Number(el.dataset.hudScale)||1};
  });
  let area=0,offscreen=0,tapTooSmall=[];
  const overlapIds=[];
  const ids=Object.keys(boxes);
  const viewW=(doc.defaultView&&doc.defaultView.innerWidth)||hb.w;
  const viewH=(doc.defaultView&&doc.defaultView.innerHeight)||hb.h;
  ids.forEach(id=>{
   const b=boxes[id];
   area+=b.w*b.h;
   const el=findEl(doc,id);
   const r=el?el.getBoundingClientRect():{left:b.x,top:b.y,right:b.x+b.w,bottom:b.y+b.h};
   if(r.left< -8||r.top< -8||r.right>viewW+8||r.bottom>viewH+8)offscreen++;
   if(Math.min(b.w,b.h)+0.5<MIN_TAP&&(id==='action'||id==='run'||id==='dock'))tapTooSmall.push(id);
  });
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
   const elA=findEl(doc,ids[i]),elB=findEl(doc,ids[j]);
   if(elA&&elB&&(elA.contains(elB)||elB.contains(elA)))continue;
   if(overlap(boxes[ids[i]],boxes[ids[j]]))overlapIds.push([ids[i],ids[j]]);
  }
  let watermarkHits=0;
  const markEl=doc.getElementById('vl-lafrich-mark');
  const mark=markEl?(()=>{const r=markEl.getBoundingClientRect();return {x:r.left-hb.left,y:r.top-hb.top,w:r.width,h:r.height};})():null;
  if(mark){
   ids.forEach(id=>{if(overlap(boxes[id],mark))watermarkHits++;});
  }
  return {
   profile:applied.profile,area,ratio:area/view,offscreen,overlaps:overlapIds,
   watermarkHits,tapTooSmall,boxes:ids.map(id=>({id,x:boxes[id].x,y:boxes[id].y,
    w:boxes[id].w,h:boxes[id].h,scale:boxes[id].scale}))
  };
 }
 function bindPreview(host, opts){
  if(!host||host.dataset.hudDragBound)return;
  host.dataset.hudDragBound='1';
  let drag=null;
  host.addEventListener('pointerdown',ev=>{
   if(!opts||typeof opts.getGameplay!=='function')return;
   const t=ev.target.closest('#ptActionBtn,#ptRunBtn,#y2-dock,#vs-needs,#vs-tip,.vs-nk,#ptWindow');
   if(!t)return;
   const id=t.id==='ptActionBtn'?'action':t.id==='ptRunBtn'?'run':t.id==='y2-dock'?'dock':
    t.id==='vs-needs'?'needs':t.id==='vs-tip'?'toast':t.classList.contains('vs-nk')?'phone':
    (t.getAttribute('data-kind')==='bag'?'bag':t.getAttribute('data-kind')==='phone'?'phone':null);
   if(!id)return;
   ev.preventDefault();
   const g=JSON.parse(JSON.stringify(opts.getGameplay()||{}));
   const profile=detectProfile(host.ownerDocument,opts.profile&&opts.profile());
   const slots=pick(g,profile);
   drag={id,profile,sx:ev.clientX,sy:ev.clientY,ox:slots[id].x,oy:slots[id].y,g};
   try{t.setPointerCapture(ev.pointerId);}catch{}
  });
  host.addEventListener('pointermove',ev=>{
   if(!drag)return;
   const dx=ev.clientX-drag.sx, dy=ev.clientY-drag.sy;
   const slot=pick(drag.g,drag.profile)[drag.id];
   const signX=slot.anchor.indexOf('right')>=0?-1:1;
   const signY=slot.anchor.indexOf('bottom')>=0?-1:1;
   drag.g.modules=drag.g.modules||{};
   drag.g.modules.hudLayout=normalize(drag.g.modules.hudLayout);
   drag.g.modules.hudLayout[drag.profile][drag.id].x=Math.round(drag.ox+dx*signX);
   drag.g.modules.hudLayout[drag.profile][drag.id].y=Math.round(drag.oy+dy*signY);
   applyTo(host,drag.g,drag.profile);
  });
  const end=()=>{
   if(!drag)return;
   if(typeof opts.setGameplay==='function')opts.setGameplay(drag.g);
   drag=null;
  };
  host.addEventListener('pointerup',end);
  host.addEventListener('pointercancel',end);
 }
 return {
  ELEMENTS,ANCHORS,MIN_SCALE,MAX_SCALE,MIN_TAP,SELECTORS,
  defaults,normalize,normalizeProfile,normalizeSlot,detectProfile,pick,
  applyTo,measure,bindPreview,desktopProfile,phoneProfile
 };
});

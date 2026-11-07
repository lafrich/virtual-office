/* Semesta/Jiwa adapter for Ellen's v11a Nokia renderer (phone_ellen.js).
 * Uses the old markup (.vs-nk / canvas.vs-nkc) and the pixel handset, without
 * depending on the old window manager (__vsWM). Errors stay inside this file.
 */
(function(root){
'use strict';
if(!root||typeof document==='undefined')return;
let wrapEl=null,cv=null,cx=null,raf=0,timer=0,open=false,scale=1,pT=0,onClose=null;

function engine(){return root.VLPhoneEllen||root.VL||null;}
function PW(){const E=engine();return (E&&E.PW)||244;}
function PH(){const E=engine();return (E&&E.PH)||366;}
function layer(){return document.getElementById('vs-layer');}

function ensure(){
 if(wrapEl&&cv)return wrapEl;
 wrapEl=document.createElement('div');
 wrapEl.className='vs-nk';
 wrapEl.id='vlNokiaHandset';
 wrapEl.setAttribute('role','dialog');
 wrapEl.setAttribute('aria-label','HP');
 cv=document.createElement('canvas');
 cv.width=PW()+4;cv.height=PH()+4;
 cv.className='vs-nkc';
 cv.id='vlNokiaCanvas';
 cv.setAttribute('aria-label','HP (Nokia style): use the phone keys');
 wrapEl.appendChild(cv);
 cx=cv.getContext('2d');
 if(cx)cx.imageSmoothingEnabled=false;
 cv.addEventListener('pointerdown',onDown);
 ['pointerup','pointercancel','pointerleave'].forEach(ev=>cv.addEventListener(ev,onUp));
 cv.addEventListener('contextmenu',e=>e.preventDefault());
 return wrapEl;
}

function draw(){
 const E=engine();
 if(!E||!cx)return;
 let im=null;
 try{
  if(typeof E.draw==='function')im=E.draw();
  else if(typeof E.renderPhone==='function')im=E.renderPhone();
 }catch(err){return;}
 if(im){try{cx.clearRect(0,0,cv.width,cv.height);cx.putImageData(im,0,0);}catch(err){}}
}

function fitScale(){
 if(!cv)return;
 const W=root.innerWidth||800,H=root.innerHeight||600;
 let s=Math.min((H-16)/(PH()+4),(W-12)/(PW()+4),2.5);
 s=Math.max(1,Math.floor(s*2)/2);
 scale=s;
 cv.style.width=(PW()+4)*s+'px';
 cv.style.height=(PH()+4)*s+'px';
}

function loop(){
 if(!open)return;
 draw();
 timer=setTimeout(function(){raf=requestAnimationFrame(loop);},125);
}

function artXY(e){
 const r=cv.getBoundingClientRect();
 return [Math.floor((e.clientX-r.left)/(r.width/(PW()+4)))-2,
         Math.floor((e.clientY-r.top)/(r.height/(PH()+4)))-2];
}

function inEl(x,y,cx0,cy0,rx,ry){
 const dx=(x+.5-cx0)/rx,dy=(y+.5-cy0)/ry;return dx*dx+dy*dy<=1;
}

function hit(px,py){
 const E=engine();
 const KEYS=E&&E.KEYS;
 if(!KEYS)return null;
 if(px>=88&&px<=156&&py>=184&&py<=252){
  if(inEl(px,py,122,209.5,19,7.5))return 'OK';
  return py<209.5?'U':'D';
 }
 for(const id in KEYS){
  if(id==='NAV')continue;
  const K=KEYS[id],[a,b,c,d]=K.bb||[];
  if(px<a-2||px>c+2||py<b-2||py>d+2)continue;
  try{if(K.m&&K.m(px,py))return id;}catch(err){}
 }
 return null;
}

function notifyHostClosed(){
 if(typeof onClose==='function'){try{onClose();}catch(err){}}
}

function tapKey(k){
 const E=engine();
 if(!E||!k)return;
 try{if(E.setPressed)E.setPressed(k);if(E.press)E.press(k);}catch(err){}
 if(E.isOpen&&!E.isOpen()){closePhone();notifyHostClosed();return;}
 draw();
}

function onDown(e){
 e.preventDefault();e.stopPropagation();
 const xy=artXY(e);const k=hit(xy[0],xy[1]);
 if(k)tapKey(k);
}
function onUp(){
 const E=engine();
 if(!E||!E.setPressed)return;
 clearTimeout(pT);
 pT=setTimeout(function(){try{E.setPressed(null);draw();}catch(err){}},60);
}

const KMAP={arrowup:'U',arrowdown:'D',enter:'OK',' ':'OK',arrowleft:'L',f1:'L',
 arrowright:'R',backspace:'R',f2:'R',c:'CALL',escape:'END',e:'END','*':'*','#':'#'};

function onKey(e){
 if(!open)return;
 const t=e.target;
 if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
 const k=(e.key||'').toLowerCase();
 if(k==='h'){e.preventDefault();return;}
 const m=KMAP[k]||(/^[0-9]$/.test(k)?k:null);
 if(!m)return;
 e.preventDefault();e.stopPropagation();
 tapKey(m);
}

function openPhone(){
 const E=engine();
 if(!E)return null;
 const lay=layer();
 if(!lay)return null;
 try{ensure();if(E.reset)E.reset();else{if(E.openPhone)E.openPhone();if(E.home)E.home();}}catch(err){return null;}
 open=true;
 if(!wrapEl.parentNode)lay.appendChild(wrapEl);
 lay.classList.add('on','vs-nk-on');
 if(document.body)document.body.classList.add('vs-win','vs-nk-open');
 fitScale();draw();loop();
 return wrapEl;
}

function closePhone(){
 const E=engine();
 try{if(E&&E.closePhone)E.closePhone();}catch(err){}
 open=false;
 clearTimeout(timer);if(raf)cancelAnimationFrame(raf);
 if(wrapEl&&wrapEl.parentNode)wrapEl.parentNode.removeChild(wrapEl);
 const lay=layer();
 if(lay)lay.classList.remove('vs-nk-on');
 if(document.body)document.body.classList.remove('vs-nk-open');
}

if(!root.__vlNokiaKeys){
 root.__vlNokiaKeys=true;
 root.addEventListener('keydown',onKey,true);
 root.addEventListener('resize',function(){if(open)fitScale();});
}

root.VLNokiaPlay={
 open:openPhone,
 close:closePhone,
 isOpen:function(){return open;},
 draw:draw,
 canvas:function(){return cv;},
 onHostClose:function(fn){onClose=fn;},
 ready:function(){return !!engine();}
};
})(typeof window!=='undefined'?window:this);

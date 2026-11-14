/* NJH98 UI audit — text overflow + alignment (dev tool, never loaded by the game).
   Usage (Playwright / DevTools console): paste or addScriptTag this file, then
   NJH98Audit.run() → {flags:[{kind,doc,el,text,detail}], counts:{kind:n}, info:[...]}.
   Checks the top document and same-origin iframes (world). Only visible elements.
   kinds: text-outside-box, text-clipped, overflow-x, overflow-y, offscreen,
          row-height, row-misaligned, label-off-center, icon-misaligned, uneven-gap, legend-overlap.
   info (not counted): ellipsis (intended truncation, review by eye), h-scroll. */
(function(){
const TOL=1.5;
function name(el){let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;const c=(typeof el.className==='string'?el.className:'').trim().split(/\s+/).filter(Boolean).slice(0,2);if(c.length)s+='.'+c.join('.');
 if(!el.id){const p=el.closest('[id]');if(p&&p!==el)s=p.tagName.toLowerCase()+'#'+p.id+' '+s;}return s;}
function ownText(el){let t='';for(const n of el.childNodes)if(n.nodeType===3)t+=n.nodeValue;return t.replace(/\s+/g,' ').trim();}
function textRect(el,doc){const rects=[];for(const n of el.childNodes){if(n.nodeType!==3||!n.nodeValue.trim())continue;const r=doc.createRange();r.selectNodeContents(n);for(const q of r.getClientRects())if(q.width>0&&q.height>0)rects.push(q);}
 if(!rects.length)return null;let l=1e9,t=1e9,r=-1e9,b=-1e9;for(const q of rects){l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);b=Math.max(b,q.bottom);}return {left:l,top:t,right:r,bottom:b,width:r-l,height:b-t,lines:new Set(rects.map(q=>Math.round(q.top))).size};}
function vis(el){if(!el.checkVisibility)return el.getClientRects().length>0;return el.checkVisibility({opacityProperty:true,visibilityProperty:true});}
function padBox(el,cs){const r=el.getBoundingClientRect();const bl=parseFloat(cs.borderLeftWidth)||0,bt=parseFloat(cs.borderTopWidth)||0,br=parseFloat(cs.borderRightWidth)||0,bb=parseFloat(cs.borderBottomWidth)||0;return {left:r.left+bl,top:r.top+bt,right:r.right-br,bottom:r.bottom-bb};}
function boxy(cs){return (cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'&&cs.backgroundColor!=='transparent')||cs.backgroundImage!=='none'||cs.boxShadow!=='none'||parseFloat(cs.borderTopWidth)>0||parseFloat(cs.borderLeftWidth)>0;}
const BTN='button,.btn,[role=button],[role=menuitem],[role=tab],input[type=button],input[type=submit],select';
function run(opt){
 opt=opt||{};const flags=[],info=[],seen=new Set();
 const docs=[[document,'top']];
 for(const f of document.querySelectorAll('iframe')){try{const d=f.contentDocument;if(d&&d.body&&vis(f))docs.push([d,f.id||'iframe']);}catch(e){}}
 for(const [doc,dn] of docs){
  const win=doc.defaultView,VW=win.innerWidth,VH=win.innerHeight;
  const add=(kind,el,detail,list)=>{const k=kind+'|'+dn+'|'+name(el)+'|'+(ownText(el)||el.textContent||'').trim().slice(0,30);if(seen.has(k))return;seen.add(k);(list||flags).push({kind,doc:dn,el:name(el),text:(ownText(el)||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,50),detail});};
  const skip=el=>el.closest('canvas,svg,script,style,noscript,[data-audit-skip],.njh-qmark,.njh-pcue,.njh-emote,.njh-glint')||(opt.skip&&el.closest(opt.skip));
  const all=[...doc.body.querySelectorAll('*')].filter(el=>!skip(el)&&vis(el));
  for(const el of all){
   const cs=win.getComputedStyle(el);const r=el.getBoundingClientRect();if(r.width<1||r.height<1)continue;
   const txt=ownText(el);const isInput=/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
   const scrollX=/auto|scroll/.test(cs.overflowX),scrollY=/auto|scroll/.test(cs.overflowY);
   // 1. own scroll overflow (content wider/taller than the box without intended scroll)
   if(!isInput&&(txt||el.matches(BTN))){
    if(el.scrollWidth>el.clientWidth+1&&!scrollX){if(cs.textOverflow==='ellipsis')add('ellipsis',el,el.scrollWidth+'>'+el.clientWidth,info);else add('overflow-x',el,el.scrollWidth+'>'+el.clientWidth);}
    else if(el.scrollWidth>el.clientWidth+1&&scrollX&&el.clientWidth>0)add('h-scroll',el,el.scrollWidth+'>'+el.clientWidth,info);
    if(el.scrollHeight>el.clientHeight+1&&!scrollY&&cs.display!=='inline')add('overflow-y',el,el.scrollHeight+'>'+el.clientHeight);
   }
   if(txt){
    const tr=textRect(el,doc);
    if(tr){
     // 2. text outside its own box / nearest visible box
     let boxEl=null;for(let a=el;a&&a!==doc.body;a=a.parentElement){const ac=win.getComputedStyle(a);if(ac.display!=='inline'&&boxy(ac)){boxEl=a;break;}}
     const ownCs=cs.display==='inline'?null:cs;
     if(ownCs){const pb=padBox(el,cs);if(tr.left<pb.left-TOL||tr.right>pb.right+TOL||tr.top<pb.top-TOL-1||tr.bottom>pb.bottom+TOL+1){if(cs.textOverflow!=='ellipsis')add('text-outside-box',el,'text '+[tr.left,tr.top,tr.right,tr.bottom].map(Math.round)+' box '+[pb.left,pb.top,pb.right,pb.bottom].map(Math.round));}}
     if(boxEl&&boxEl!==el){const bc=win.getComputedStyle(boxEl);const pb=padBox(boxEl,bc);if(tr.left<pb.left-TOL||tr.right>pb.right+TOL||tr.top<pb.top-TOL-1||tr.bottom>pb.bottom+TOL+1)add('text-outside-box',el,'outside '+name(boxEl));}
     // 3. clipped by an overflow:hidden ancestor (not a scroll container)
     for(let a=el.parentElement;a&&a!==doc.documentElement;a=a.parentElement){const ac=win.getComputedStyle(a);const sx=/auto|scroll/.test(ac.overflowX)||/auto|scroll/.test(ac.overflowY);if(sx)break;
      if(ac.overflowX!=='visible'||ac.overflowY!=='visible'){const pb=padBox(a,ac);if(tr.right>pb.right+TOL||tr.left<pb.left-TOL||tr.bottom>pb.bottom+TOL+1||tr.top<pb.top-TOL-1){if(cs.textOverflow!=='ellipsis')add('text-clipped',el,'by '+name(a));}break;}}
     // 4. off the viewport (unless inside a scroll container)
     let inScroll=false;for(let a=el.parentElement;a&&a!==doc.body;a=a.parentElement){const ac=win.getComputedStyle(a);if(/auto|scroll/.test(ac.overflowY+ac.overflowX)){inScroll=true;break;}}
     if(!inScroll&&(tr.left<-TOL||tr.top<-TOL||tr.right>VW+TOL||tr.bottom>VH+TOL))add('offscreen',el,'text '+[tr.left,tr.top,tr.right,tr.bottom].map(Math.round)+' vp '+VW+'x'+VH);
     // 5. single-line label vertically centred in its button/title/tab
     if(el.matches(BTN+',.titlebar,.njh-tabs button,.w98-title')&&tr.lines===1&&cs.display!=='inline'){const pb=padBox(el,cs);const pt=parseFloat(cs.paddingTop)||0,pbm=parseFloat(cs.paddingBottom)||0;
      const cy=(pb.top+pt+pb.bottom-pbm)/2,ty=(tr.top+tr.bottom)/2;const boxCy=(pb.top+pb.bottom)/2;
      if(Math.abs(ty-boxCy)>2.5&&r.height<60)add('label-off-center',el,'text cy '+ty.toFixed(1)+' box cy '+boxCy.toFixed(1)+' (content cy '+cy.toFixed(1)+')');}
     // 6. icon next to text
     for(const ic of el.querySelectorAll(':scope>svg,:scope>img,:scope>i,:scope>.icon')){if(!vis(ic))continue;const ir=ic.getBoundingClientRect();if(ir.width<2||ir.height<2||ir.height>tr.height*3)continue;const d=(ir.top+ir.bottom)/2-(tr.top+tr.bottom)/2;if(tr.lines===1&&Math.abs(d)>2.5)add('icon-misaligned',el,'icon dy '+d.toFixed(1));}
    }
   }
   // 6b. fieldset legend must not sit on the group's first content row
   if(el.tagName==='FIELDSET'){const lg=el.querySelector(':scope>legend');const first=[...el.children].find(k=>k.tagName!=='LEGEND'&&vis(k));
    if(lg&&first&&vis(lg)){const a=lg.getBoundingClientRect(),c=first.getBoundingClientRect();if(a.bottom>c.top+1&&a.right>c.left&&a.left<c.right)add('legend-overlap',lg,'legend bottom '+a.bottom.toFixed(0)+' > content top '+c.top.toFixed(0));}}
   // 7. rows of buttons: same height + same centre line; even gaps
   const kids=[...el.children].filter(k=>vis(k)&&!/absolute|fixed/.test(win.getComputedStyle(k).position));
   if(kids.length>=2&&/flex|grid/.test(cs.display)){
    const rows=[];for(const k of kids){const kr=k.getBoundingClientRect();if(kr.width<1||kr.height<1)continue;let row=rows.find(rw=>kr.top<rw.b-2&&kr.bottom>rw.t+2);if(!row){row={t:kr.top,b:kr.bottom,items:[]};rows.push(row);}row.items.push({k,kr});row.t=Math.min(row.t,kr.top);row.b=Math.max(row.b,kr.bottom);}
    const tabs=el.matches('[role=tablist],.njh-tabs,.tabs');
    for(const row of rows){const btns=tabs?[]:row.items.filter(i=>i.k.matches(BTN));
     if(btns.length>=2){const hs=btns.map(i=>i.kr.height),cy=btns.map(i=>(i.kr.top+i.kr.bottom)/2);
      if(Math.max(...hs)-Math.min(...hs)>1.5)add('row-height',el,'heights '+hs.map(Math.round).join('/'));
      else if(Math.max(...cy)-Math.min(...cy)>1.5)add('row-misaligned',el,'centres '+cy.map(v=>v.toFixed(0)).join('/'));}
     // separators (no text, ≤ 8px wide) split a row into groups; gaps are compared inside each group
     const sorted=row.items.slice().sort((a,b)=>a.kr.left-b.kr.left);const groups=[[]];for(const i of sorted){if(i.kr.width<=8&&!i.k.textContent.trim())groups.push([]);else groups[groups.length-1].push(i);}
     for(const it of groups)if(it.length>=3&&!/space-|center|end/.test(cs.justifyContent)){const gaps=[];for(let i=1;i<it.length;i++)gaps.push(it[i].kr.left-it[i-1].kr.right);
      const g=gaps.filter(v=>v>=-0.5);if(g.length>=2&&Math.max(...g)-Math.min(...g)>2.5&&Math.max(...g)<40)add('uneven-gap',el,'gaps '+g.map(v=>v.toFixed(0)).join('/'));}
    }
   }
  }
 }
 const counts={};for(const f of flags)counts[f.kind]=(counts[f.kind]||0)+1;
 return {total:flags.length,counts,flags,info};
}
(typeof window!=='undefined'?window:globalThis).NJH98Audit={run};
})();

/* Mainkan Flow Editor: graph with clickable nodes, drag, editable edges, inspector.
 * Saving is intentionally file-based. No localStorage or remote writes.
 */
(function(){
 'use strict';
 const F=window.MainkanFlow,$=id=>document.getElementById(id);
 let flow=F.preset('default'),selected='splash',connecting=null,presetName='default';
 let undo=[],redo=[],drag=null;
 const NODE_WIDTH=190,NODE_HEIGHT=92;
 const TYPES=F.TYPES;
 const ROUTE_LABELS={guest:'Guest',new_player:'New',returning:'Returning',first_time:'First Time',default:'Other'};
 function notify(msg,error=false){
  $('notice').textContent=msg;$('notice').className=error?'error':'good';
  $('count').textContent=flow.nodes.length+' nodes';
 }
 function checkpoint(){
  undo.push(JSON.stringify(flow));if(undo.length>80)undo.shift();redo.length=0;
 }
 function find(id){return F.get(flow,id);}
 function optionList(chosen,includeEmpty=false){
  return (includeEmpty?'<option value="">— None —</option>':'')+
   flow.nodes.map(n=>'<option value="'+n.id+'"'+(n.id===chosen?' selected':'')+'>'+n.id+'</option>').join('');
 }
 function selectNode(id){
  if(connecting){
   if(connecting.from===id){connecting=null;notify('Connection cancelled');return;}
   checkpoint();
   const n=find(connecting.from);
   if(n){if(connecting.route){n.routes=n.routes||{};n.routes[connecting.route]=id;}else n.next=id;}
   const old=connecting;connecting=null;render();
   notify('Connected '+old.from+' → '+id);return;
  }
  selected=id;renderNodes();renderInspector();notify('Selected: '+id);
 }
 function render(){
  $('flowName').value=flow.name;
  $('flowStart').innerHTML=optionList(flow.start);
  document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===presetName));
  renderNodes();renderInspector();notify('READY / '+flow.nodes.length+' nodes');
 }
 function renderNodes(){
  const layer=$('nodeLayer');layer.replaceChildren();
  const maxX=Math.max(2800,...flow.nodes.map(n=>n.x+260));
  const maxY=Math.max(650,...flow.nodes.map(n=>n.y+170));
  $('flowCanvas').style.width=maxX+'px';
  $('flowCanvas').style.height=maxY+'px';
  const svg=$('wires');svg.setAttribute('viewBox','0 0 '+maxX+' '+maxY);
  svg.style.width=maxX+'px';svg.style.height=maxY+'px';
  for(const n of flow.nodes){
   const box=document.createElement('div');box.className='node'+(n.enabled===false?' disabled':'')+(selected===n.id?' active':'');
   box.dataset.kind=n.type;box.dataset.id=n.id;box.tabIndex=0;box.setAttribute('role','button');
   box.setAttribute('aria-label',n.title+' ('+n.type+')');box.style.left=n.x+'px';box.style.top=n.y+'px';
   const head=document.createElement('div');head.className='head';head.textContent=n.title;
   const sub=document.createElement('div');sub.className='sub';sub.textContent=n.type.toUpperCase()+(n.type==='splash'?' · '+n.showCount+'×':'');
   const foot=document.createElement('div');foot.className='footer';foot.textContent=n.id;
   box.append(head,sub,foot);
   const out=document.createElement('button');out.type='button';out.className='port';out.title='Hubungkan NEXT ke node lain';out.setAttribute('aria-label','Connect '+n.id);
   out.addEventListener('click',e=>{e.stopPropagation();connecting={from:n.id,route:null};selected=n.id;renderNodes();notify('CONNECT NEXT: klik node tujuan');});
   box.append(out);
   box.addEventListener('click',e=>{if(drag?.moved)return;selectNode(n.id);});
   box.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.target.closest('.port'))selectNode(n.id);});
   box.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    if(e.button!==0)return;
    drag={id:n.id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,baseX:n.x,baseY:n.y,moved:false};
    box.setPointerCapture(e.pointerId);
   });
   box.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==n.id||drag.pointerId!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)>4){checkpoint();drag.moved=true;}
    if(!drag.moved)return;
    n.x=Math.max(0,Math.min(19500,Math.round((drag.baseX+dx)/10)*10));
    n.y=Math.max(0,Math.min(19500,Math.round((drag.baseY+dy)/10)*10));
    box.style.left=n.x+'px';box.style.top=n.y+'px';drawEdges();
   });
   box.addEventListener('pointerup',()=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved){selected=n.id;render();}});
   box.addEventListener('pointercancel',()=>{drag=null;render();});
   layer.append(box);
  }
  drawEdges();
 }
 function drawEdges(){
  const svg=$('wires'),ns='http://www.w3.org/2000/svg';
  svg.replaceChildren();
  const defs=document.createElementNS(ns,'defs');
  const marker=document.createElementNS(ns,'marker');marker.id='endArrow';marker.setAttribute('markerWidth','8');marker.setAttribute('markerHeight','8');marker.setAttribute('refX','7');marker.setAttribute('refY','4');marker.setAttribute('orient','auto');
  const tip=document.createElementNS(ns,'path');tip.setAttribute('d','M 0 0 L 8 4 L 0 8 z');tip.setAttribute('fill','#5e6e8a');marker.append(tip);defs.append(marker);svg.append(defs);
  for(const n of flow.nodes){
   const arr=[];
   if(n.next)arr.push({target:n.next,label:'next',branch:false,index:0});
   if(n.routes)Object.entries(n.routes).forEach(([label,target],i)=>arr.push({target,label:ROUTE_LABELS[label]||label,branch:true,index:i+1}));
   for(const edge of arr){
    const dest=find(edge.target);if(!dest)continue;
    const sx=n.x+NODE_WIDTH,sy=n.y+44+edge.index*11;
    const tx=dest.x,ty=dest.y+44;
    const cx=Math.max(60,Math.abs(tx-sx)*.42);
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d','M '+sx+' '+sy+' C '+(sx+cx)+' '+sy+', '+(tx-cx)+' '+ty+', '+tx+' '+ty);
    path.setAttribute('class','path'+(edge.branch?' branch':'')+(n.enabled===false?' disabled':''));
    path.setAttribute('marker-end','url(#endArrow)');
    svg.append(path);
    if(edge.branch){
     const text=document.createElementNS(ns,'text');text.setAttribute('x',String(sx+Math.min(90,cx*.7)));
     text.setAttribute('y',String(sy-6));text.setAttribute('class','wirelabel');text.textContent=edge.label;svg.append(text);
    }
   }
  }
 }
 function prop(label,el){
  const box=document.createElement('div');box.className='editbox';
  const l=document.createElement('label');l.textContent=label;box.append(l,el);return box;
 }
 function input(value,type='text'){
  const el=document.createElement('input');el.type=type;el.value=value??'';return el;
 }
 function selectOptions(list,chosen){
  const el=document.createElement('select');
  for(const [value,label] of list){
   const o=document.createElement('option');o.value=value;o.textContent=label;o.selected=value===chosen;el.append(o);
  }return el;
 }
 function updateNode(n,key,value){
  checkpoint();n[key]=value;renderNodes();notify('Edited '+n.id+' / '+key);
 }
 function inspectorSelect(n,key,options){
  const el=selectOptions(options,n[key]);el.addEventListener('change',()=>{updateNode(n,key,el.value);renderInspector();});return el;
 }
 function renderInspector(){
  const target=$('inspector');target.replaceChildren();const n=find(selected);
  if(!n){target.textContent='Klik node untuk edit.';return;}
  const id=input(n.id);id.readOnly=true;target.append(prop('ID',id));
  const title=input(n.title);title.maxLength=90;title.addEventListener('change',()=>{if(!title.value.trim()){title.value=n.title;return;}updateNode(n,'title',title.value.trim());});
  target.append(prop('Judul Screen',title));
  const type=inspectorSelect(n,'type',TYPES.map(t=>[t,t.toUpperCase()]));target.append(prop('Type',type));
  const active=document.createElement('input');active.type='checkbox';active.checked=n.enabled!==false;
  active.addEventListener('change',()=>updateNode(n,'enabled',active.checked));
  target.append(prop('Aktif',active));
  const next=selectOptions([['','— None —'],...flow.nodes.filter(x=>x.id!==n.id).map(x=>[x.id,x.id])],n.next||'');
  next.addEventListener('change',()=>updateNode(n,'next',next.value));target.append(prop('NEXT (default)',next));
  const desc=document.createElement('textarea');desc.value=n.description||'';desc.maxLength=500;
  desc.addEventListener('change',()=>updateNode(n,'description',desc.value));target.append(prop('Description / Copy',desc));
  if(['splash','loading','message'].includes(n.type)){
   const dur=input(n.duration,'number');dur.min=0;dur.max=15000;dur.step=100;
   dur.addEventListener('change',()=>updateNode(n,'duration',Math.max(0,Math.min(15000,Number(dur.value)||0))));
   target.append(prop('Durasi (milliseconds)',dur));
  }
  if(n.type==='splash'){
   const count=input(n.showCount,'number');count.min=1;count.max=5;count.step=1;
   count.addEventListener('change',()=>updateNode(n,'showCount',Math.max(1,Math.min(5,Math.round(Number(count.value)||1)))));
   target.append(prop('Tampil berapa kali (1–5)',count));
   target.append(prop('Frequency',inspectorSelect(n,'showRule',[['every_launch','Every launch'],['once_per_session','Once per session'],['first_time_player','First-time only']])));
  }
  if(['splash','tutorial','pause','welcome'].includes(n.type)){
   const skip=document.createElement('input');skip.type='checkbox';skip.checked=n.skippable===true;
   skip.addEventListener('change',()=>updateNode(n,'skippable',skip.checked));target.append(prop('Can skip',skip));
  }
  if(n.type==='auth'||n.type==='branch'){
   for(const key of F.ROUTES[n.type]){
    const el=selectOptions([['','— None —'],...flow.nodes.map(x=>[x.id,x.id])],n.routes?.[key]||'');
    el.addEventListener('change',()=>{
     checkpoint();
     n.routes=n.routes||{};
     if(el.value)n.routes[key]=el.value;else delete n.routes[key];
     renderNodes();notify('Route '+key+' → '+(el.value||'none'));
    });
    target.append(prop('Branch · '+(ROUTE_LABELS[key]||key),el));
   }
  }
  const info=document.createElement('p');info.className='inspector-note tiny';
  info.textContent='Klik bulatan kuning pada node untuk mengganti hubungan NEXT. Cabang (Guest, Returning, dll.) bisa dipilih lewat panel ini.';
  target.append(info);
 }
 function makeNode(){
  checkpoint();let id='screen',i=1;while(find(id+i))i++;id+=i;
  const last=find(selected),x=(last?.x||50)+250,y=(last?.y||50)+150;
  const n={id,type:'message',title:'New Screen',x,y,next:'',enabled:true,duration:1200,showCount:1,showRule:'every_launch',skippable:true,description:'Tulis isi layar di Properties'};
  flow.nodes.push(n);selected=n.id;render();notify('New node: '+n.id);
 }
 function duplicate(){
  const n=find(selected);if(!n)return;
  checkpoint();let id=n.id+'_copy',i=2;while(find(id)){id=n.id+'_copy'+i;i++;}
  const copy=F.clone(n);copy.id=id;copy.title=n.title+' Copy';copy.x=n.x+90;copy.y=n.y+130;
  copy.next='';copy.routes={};flow.nodes.push(copy);selected=id;render();notify('Duplicated '+n.id);
 }
 function remove(){
  const n=find(selected);if(!n)return;
  if(flow.nodes.length<2)return notify('Tidak bisa menghapus semua node',true);
  checkpoint();flow.nodes=flow.nodes.filter(x=>x.id!==n.id);
  for(const other of flow.nodes){
   if(other.next===n.id)other.next='';
   if(other.routes)for(const key of Object.keys(other.routes))if(other.routes[key]===n.id)delete other.routes[key];
  }
  if(flow.start===n.id)flow.start=flow.nodes[0].id;
  selected=flow.start;render();notify('Deleted '+n.id);
 }
 $('addNode').addEventListener('click',makeNode);
 $('duplicateNode').addEventListener('click',duplicate);
 $('deleteNode').addEventListener('click',remove);
 $('undo').addEventListener('click',()=>{if(!undo.length)return;redo.push(JSON.stringify(flow));flow=JSON.parse(undo.pop());selected=flow.start;render();});
 $('redo').addEventListener('click',()=>{if(!redo.length)return;undo.push(JSON.stringify(flow));flow=JSON.parse(redo.pop());selected=flow.start;render();});
 $('flowName').addEventListener('change',e=>{checkpoint();flow.name=e.target.value.trim()||'Mainkan Flow';notify('Flow renamed');});
 $('flowStart').addEventListener('change',e=>{checkpoint();flow.start=e.target.value;notify('New start: '+flow.start);});
 document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
  const kind=b.dataset.preset;
  checkpoint();flow=F.preset(kind);presetName=kind;selected=flow.start;connecting=null;render();notify('Loaded preset: '+flow.name);
 }));
 function validFlow(){
  try{return F.normalize(flow);}
  catch(err){notify('Invalid flow: '+err.message,true);return null;}
 }
 function exportJson(){
  const normalized=validFlow();if(!normalized)return;
  const blob=new Blob([JSON.stringify(normalized,null,2)],{type:'application/json'});
  const uri=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=uri;
  a.download=(normalized.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'mainkan-flow')+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(uri),1000);
  notify('File JSON diexport. Simpan di perangkatmu.');
 }
 $('exportFlow').addEventListener('click',exportJson);
 $('importFlow').addEventListener('click',()=>$('fileIn').click());
 $('fileIn').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>250000)return notify('File too large (max 250KB)',true);
  try{
   const parsed=JSON.parse(await file.text()),normalized=F.normalize(parsed);
   checkpoint();flow=normalized;selected=flow.start;presetName='imported';connecting=null;render();
   notify('Imported '+file.name+' (file only; no database)');
  }catch(err){notify('Import failed: '+err.message,true);}
 });
 function sendPreview(){
  const current=validFlow();if(!current)return;
  const target=$('testFrame').contentWindow;
  if(target)target.postMessage({type:'mainkan:flow-config',flow:current},location.origin);
 }
 $('testFlow').addEventListener('click',()=>{
  if(!validFlow())return;
  $('testOverlay').hidden=false;
  $('testFrame').src='./?flowPreview=1&t='+Date.now();
  notify('Test Flow active. Ubah editor lalu tutup untuk lanjut.');
 });
 $('testFrame').addEventListener('load',()=>{if(!$('testOverlay').hidden)sendPreview();});
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==$('testFrame').contentWindow)return;
  if(e.data?.type==='mainkan:flow-request')sendPreview();
 });
 $('closeTest').addEventListener('click',()=>{
  $('testOverlay').hidden=true;$('testFrame').removeAttribute('src');notify('Test closed; draft graph still in memory');
 });
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('testOverlay').hidden)$('closeTest').click();
  if(['Delete','Backspace'].includes(e.key)&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)&&document.activeElement?.closest('.node'))remove();
 });
 render();
})();

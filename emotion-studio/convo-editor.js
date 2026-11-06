/* EMOSI.EXE / Convo Editor — deterministic text-to-viseme timeline, four views. */
(()=>{
'use strict';
const KEY='emosi-convo-projects-v1',DIR=['se','sw','ne','nw'];
const mouth={rest:[],closed:[[0,0,12,2]],a:[[0,0,12,2],[1,2,10,6],[2,8,8,2]],e:[[0,0,12,2],[0,2,12,3],[2,5,8,1]],i:[[0,0,12,2],[0,2,12,2]],o:[[2,0,8,2],[1,2,10,5],[2,7,8,2]],u:[[3,0,6,2],[2,2,8,4],[3,6,6,2]],fv:[[0,0,12,2],[1,2,10,2]],l:[[1,0,10,2],[3,2,6,4]],smile:[[0,0,3,2],[9,0,3,2],[2,2,8,2]]};
const styles=`
#convoTab{background:#295988!important;color:#fff!important;border:1px solid #7daedc!important;font-weight:700}
#convoTab.active{background:#dbeeff!important;color:#15385a!important}
#convoPanel[hidden]{display:none!important}
#convoPanel{flex:1;min-height:0;overflow:auto;background:#1c2938;padding:14px;color:#d7e7f6;font:12px Consolas,monospace}
.convo-layout{display:grid;grid-template-columns:minmax(265px,340px) minmax(300px,1fr);gap:12px;max-width:1380px;margin:auto}
.convo-box{background:#29384b;border:1px solid #5a7390;padding:12px;min-width:0}
.convo-box h3{margin:0 0 12px;font:700 13px Consolas,monospace;color:#a8d9fc}
.convo-field{display:block;margin:9px 0;color:#b3c9dd;font-size:11px}
.convo-field input,.convo-field textarea,.convo-field select{display:block;width:100%;margin-top:5px;background:#172637;color:#eaf5ff;border:1px solid #728ba4;padding:8px;font:12px Consolas,monospace}
.convo-field textarea{height:120px;resize:vertical;line-height:1.5}
.convo-actions{display:flex;flex-wrap:wrap;gap:6px;margin:9px 0}
.convo-actions button{padding:8px 10px}
#convoCanvas{display:block;margin:12px auto;image-rendering:pixelated;background:repeating-conic-gradient(#4b5d75 0 25%,#35465d 0 50%) 50%/24px 24px;width:min(320px,100%);height:auto;aspect-ratio:64/112;border:1px solid #6d85a0}
#convoFrames{display:flex;gap:3px;overflow:auto;padding:8px 2px;min-height:70px}
#convoFrames button{min-width:45px;display:flex;flex-direction:column;gap:5px;align-items:center;font:10px Consolas,monospace;border-color:#5c7189}
#convoFrames button.active{background:#3677a9;border-color:#b8dfff}
#convoFrames small{color:#b8cce1}
.convo-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#convoStatus{min-height:30px;color:#a8d5f0;margin:8px 0}
#convoPanel input[type=range]{padding:0}
@media(max-width:820px){.convo-layout{grid-template-columns:1fr}#convoPanel{padding:7px}}
`;
const style=document.createElement('style');style.textContent=styles;document.head.append(style);
const nav=document.querySelector('.emotion-window>.menubar');
const workspace=document.getElementById('emotionWorkspace');
if(!nav||!workspace)return;
const tab=document.createElement('button');tab.id='convoTab';tab.type='button';tab.textContent='▸ CONVO EDITOR';nav.append(tab);
const panel=document.createElement('section');panel.id='convoPanel';panel.hidden=true;
panel.innerHTML=`<div class="convo-layout">
<div class="convo-box"><h3>CONVO EDITOR / TEXT → MOUTH</h3>
<label class="convo-field">PROJECT NAME<input id="convoName" maxlength="90" value="New Conversation"></label>
<label class="convo-field">DIALOGUE / INDONESIAN OR ENGLISH<textarea id="convoText" maxlength="2000" spellcheck="false" placeholder="Halo, apa kabar?">Halo, apa kabar?</textarea></label>
<div class="convo-row"><label class="convo-field">FPS<input type="number" id="convoFps" min="4" max="24" value="10"></label><label class="convo-field">FRAMES / CHARACTER<input id="convoSpeed" type="number" min="1" max="6" value="2"></label></div>
<label class="convo-field">BASE EMOTION (LOCAL LIBRARY)<select id="convoBase"><option value="">None / transparent background</option></select></label>
<div class="convo-actions"><button id="convoGenerate">✧ GENERATE LIP SYNC</button><button id="convoSave">▣ SAVE DATABASE</button><button id="convoNew">＋ NEW</button></div>
<label class="convo-field">SAVED CONVERSATIONS<select id="convoSaved"><option value="">Select saved project...</option></select></label>
<div class="convo-actions"><button id="convoExport">↓ EXPORT JSON</button><button id="convoImport">↑ IMPORT JSON</button><input type="file" id="convoFile" accept=".json,application/json" hidden><button id="convoDelete">− DELETE</button></div>
<p style="color:#a6bed2;line-height:1.6">Text creates editable mouth shapes per frame. Punctuation adds pauses. No audio is generated. Database is saved to this browser; export JSON to move devices.</p>
</div>
<div class="convo-box"><h3>ANIMATION PREVIEW · 64 × 112 / 4 VIEWS</h3>
<div class="convo-actions"><button id="convoPlay">▶ PLAY</button><button id="convoPrev">← FRAME</button><button id="convoNext">FRAME →</button><span id="convoPosition" style="align-self:center">FRAME 1</span></div>
<div class="convo-actions" id="convoDirs">${DIR.map((d,i)=>`<button data-convo-dir="${d}" class="${i?'':'active'}">${d.toUpperCase()}</button>`).join('')}</div>
<canvas id="convoCanvas" width="64" height="112"></canvas>
<div class="convo-row"><label class="convo-field">MOUTH X<input id="convoX" type="number" min="0" max="63" value="26"></label><label class="convo-field">MOUTH Y<input id="convoY" type="number" min="0" max="111" value="46"></label></div>
<div class="convo-row"><label class="convo-field">SCALE<input id="convoScale" type="number" min="1" max="4" value="1"></label><label class="convo-field">CURRENT VISEME<select id="convoShape">${Object.keys(mouth).map(x=>`<option value="${x}">${x.toUpperCase()}</option>`).join('')}</select></label></div>
<div style="color:#9ebbd5;margin:12px 0 4px">FRAME-BY-FRAME / SELECT TO ADJUST MOUTH</div>
<div id="convoFrames"></div>
<div id="convoStatus" role="status"></div>
</div></div>`;
workspace.after(panel);
const $=id=>document.getElementById(id);
let project=null,at=0,view='se',playing=false,clock=0,raf=0,baseImage=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||a));
const uid=()=>('convo-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6));
const message=t=>{$('convoStatus').textContent=t};
function readProjects(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function persistAll(xs){localStorage.setItem(KEY,JSON.stringify(xs))}
function phoneme(c,next){if(!/[a-z]/.test(c))return 'rest';if('bmp'.includes(c))return 'closed';if('fv'.includes(c))return 'fv';if(c==='l'||c==='r')return 'l';if('a'.includes(c))return 'a';if('e'.includes(c))return 'e';if('iy'.includes(c))return 'i';if('o'.includes(c))return 'o';if('uw'.includes(c))return 'u';if(c==='q')return 'o';return next&&/[aeiou]/.test(next)?'closed':'e'}
function generate(text,speed=2){
 const out=[];const clean=String(text||'').normalize('NFKC').toLowerCase();
 for(let i=0;i<clean.length;i++){const c=clean[i],n=clean[i+1]||'',shape=phoneme(c,n);
 const count=/[.!?]/.test(c)?Math.max(3,speed*3):/[,;:]/.test(c)?Math.max(2,speed*2):/\s/.test(c)?speed:Math.max(1,speed);
 for(let k=0;k<count;k++)out.push({char:c,viseme:(/[,.!?;:\s]/.test(c)?'rest':shape)});
 if(out.length>=1200)break;
 }
 return out.length?out:[{char:'',viseme:'rest'}];
}
function syncControls(){
 $('convoName').value=project.name;$('convoText').value=project.text;$('convoFps').value=project.fps;$('convoSpeed').value=project.speed;
 $('convoX').value=project.x;$('convoY').value=project.y;$('convoScale').value=project.scale;
 renderTimeline();renderPreview();loadBase();
}
function frame(){return project.frames[at]||{char:'',viseme:'rest'}}
function renderTimeline(){
 const root=$('convoFrames');root.replaceChildren();
 project.frames.forEach((f,i)=>{const b=document.createElement('button');b.type='button';b.classList.toggle('active',i===at);
 const strong=document.createElement('strong');strong.textContent=String(i+1);
 const small=document.createElement('small');small.textContent=f.char===' '?'SPACE':f.char||'—';
 const sh=document.createElement('small');sh.textContent=f.viseme;b.append(strong,small,sh);
 b.onclick=()=>{at=i;renderTimeline();renderPreview()};root.append(b)});
 $('convoPosition').textContent='FRAME '+(at+1)+' / '+project.frames.length;
 const active=root.querySelector('button.active');active?.scrollIntoView({block:'nearest',inline:'nearest'});
}
function renderPreview(){
 const canvas=$('convoCanvas'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,64,112);ctx.imageSmoothingEnabled=false;
 if(baseImage){const fi=at%Math.max(1,Math.floor(baseImage.width/64)),di=DIR.indexOf(view);ctx.drawImage(baseImage,fi*64,di*112,64,112,0,0,64,112)}
 const f=frame();$('convoShape').value=mouth[f.viseme]?f.viseme:'rest';
 const sc=clamp(project.scale,1,4),x=clamp(project.x,0,63),y=clamp(project.y,0,111);
 if(f.viseme!=='rest'){
   ctx.fillStyle='#38262a';for(const [dx,dy,w,h] of mouth[f.viseme]||[]){ctx.fillRect(x+dx*sc,y+dy*sc,w*sc,h*sc)}
   if(['a','e','o','u'].includes(f.viseme)){ctx.fillStyle='#ac5c63';ctx.fillRect(x+3*sc,y+3*sc,6*sc,Math.max(1,2*sc))}
 }
 $('convoPosition').textContent='FRAME '+(at+1)+' / '+project.frames.length;
}
async function loadBase(){
 baseImage=null;renderPreview();const id=project.baseId;if(!id)return;
 try{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('emotion-studio-local-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  if(!db.objectStoreNames.contains('emotion-assets')){db.close();return}
  const record=await new Promise((resolve,reject)=>{const tx=db.transaction('emotion-assets','readonly'),r=tx.objectStore('emotion-assets').get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();
  if(record?.png){const img=new Image();img.onload=()=>{baseImage=img;renderPreview()};img.src=record.png}
 }catch(e){message('Base emotion unavailable: '+e.message)}
}
async function loadBases(){
 const select=$('convoBase');const old=project.baseId;select.replaceChildren(new Option('None / transparent background',''));
 try{const db=await new Promise((res,rej)=>{const r=indexedDB.open('emotion-studio-local-v1');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 if(db.objectStoreNames.contains('emotion-assets')){const entries=await new Promise((res,rej)=>{const t=db.transaction('emotion-assets','readonly'),r=t.objectStore('emotion-assets').getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});entries.forEach(e=>{if(e.id&&e.png)select.add(new Option(e.name||e.id,e.id))})}db.close();
 }catch{}select.value=old||'';
}
function refreshSaved(){const saved=$('convoSaved'),old=project?.id;saved.replaceChildren(new Option('Select saved project...',''));readProjects().forEach(p=>saved.add(new Option(p.name,p.id)));saved.value=readProjects().some(p=>p.id===old)?old:''}
function newProject(){return {format:'emosi-convo-v1',id:uid(),name:'New Conversation',text:'Halo, apa kabar?',fps:10,speed:2,baseId:'',x:26,y:46,scale:1,frames:generate('Halo, apa kabar?',2)}}
function safeImport(p){
 if(!p||p.format!=='emosi-convo-v1'||!Array.isArray(p.frames)||!p.frames.length||p.frames.length>1200)throw Error('Unsupported conversation JSON');
 return {format:'emosi-convo-v1',id:uid(),name:String(p.name||'Imported Conversation').slice(0,90),text:String(p.text||'').slice(0,2000),fps:clamp(p.fps,4,24),speed:clamp(p.speed,1,6),baseId:String(p.baseId||''),x:clamp(p.x,0,63),y:clamp(p.y,0,111),scale:clamp(p.scale,1,4),frames:p.frames.map(f=>({char:String(f.char||'').slice(0,2),viseme:mouth[f.viseme]?f.viseme:'rest'}))};
}
function capture(){project.name=$('convoName').value.trim()||'Untitled Conversation';project.text=$('convoText').value;project.fps=clamp($('convoFps').value,4,24);project.speed=clamp($('convoSpeed').value,1,6);project.baseId=$('convoBase').value;project.x=clamp($('convoX').value,0,63);project.y=clamp($('convoY').value,0,111);project.scale=clamp($('convoScale').value,1,4)}
function stop(){playing=false;$('convoPlay').textContent='▶ PLAY';cancelAnimationFrame(raf)}
function tick(now){if(!playing)return;if(now-clock>=1000/project.fps){at=(at+1)%project.frames.length;clock=now;renderTimeline();renderPreview()}raf=requestAnimationFrame(tick)}
tab.onclick=()=>{const open=panel.hidden;panel.hidden=!open;workspace.hidden=open;workspace.style.display=open?'none':'';tab.classList.toggle('active',open);if(open){loadBases();renderPreview()}else stop()};
$('convoGenerate').onclick=()=>{capture();stop();project.frames=generate(project.text,project.speed);at=0;renderTimeline();renderPreview();message('Generated '+project.frames.length+' frames. Select frame to adjust mouth shape.')};
$('convoSave').onclick=()=>{try{capture();const xs=readProjects(),i=xs.findIndex(x=>x.id===project.id);if(i>=0)xs[i]=project;else xs.push(project);persistAll(xs);refreshSaved();message('Saved in this browser · export JSON for another device')}catch(e){message('SAVE FAILED: '+e.message)}};
$('convoNew').onclick=()=>{stop();project=newProject();at=0;syncControls();refreshSaved();message('New conversation created')};
$('convoSaved').onchange=e=>{const p=readProjects().find(x=>x.id===e.target.value);if(!p)return;stop();project=structuredClone(p);at=0;syncControls();message('Loaded '+p.name)};
$('convoDelete').onclick=()=>{const xs=readProjects().filter(x=>x.id!==project.id);persistAll(xs);stop();project=newProject();at=0;syncControls();refreshSaved();message('Saved conversation deleted')};
$('convoExport').onclick=()=>{capture();const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(project.name.replace(/[^\w-]+/g,'-')||'convo')+'.convo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message('JSON exported')};
$('convoImport').onclick=()=>$('convoFile').click();
$('convoFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>200000)throw Error('File exceeds 200 KB');project=safeImport(JSON.parse(await file.text()));at=0;syncControls();refreshSaved();message('Imported · save to keep')}catch(err){message('IMPORT FAILED: '+err.message)}e.target.value=''};
$('convoPlay').onclick=()=>{if(playing){stop();return}capture();playing=true;$('convoPlay').textContent='Ⅱ PAUSE';clock=0;raf=requestAnimationFrame(tick)};
$('convoPrev').onclick=()=>{stop();at=(at-1+project.frames.length)%project.frames.length;renderTimeline();renderPreview()};
$('convoNext').onclick=()=>{stop();at=(at+1)%project.frames.length;renderTimeline();renderPreview()};
$('convoShape').onchange=e=>{frame().viseme=e.target.value;renderTimeline();renderPreview()};
['convoX','convoY','convoScale'].forEach(id=>$(id).oninput=()=>{capture();renderPreview()});
$('convoBase').onchange=()=>{capture();loadBase()};
document.querySelectorAll('[data-convo-dir]').forEach(b=>b.onclick=()=>{view=b.dataset.convoDir;document.querySelectorAll('[data-convo-dir]').forEach(n=>n.classList.toggle('active',n===b));renderPreview()});
project=newProject();syncControls();refreshSaved();message('Ready · type dialogue and generate mouth animation');
})();
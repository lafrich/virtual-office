/* Original Paint-style Character Creator interaction layer for mainkan.exe.
 * Visual structure & selection vocabulary adapted from the user's attached
 * 2026-10-31 vo-mp/onb/onb.js + xp.css. No old authentication, gate,
 * private encryption or multiplayer code is executed.
 * Original V6B assets remain owned by the character pipeline.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const root=$('classicCreator');
 if(!root)return;
 const COLORS={
   hair:{black:'#2E2A2A',navy:'#2A3242',brown:'#5C3B25',chestnut:'#86432A',blonde:'#D8B25A',red:'#A33A26',white:'#C9CDD3',pink:'#D97BA0'},
   skin:{porcelain:'#F8E4D6',light:'#F1D3B5',tan:'#E3B791',medium:'#C99364',brown:'#9A6644',deep:'#66412B'},
   top:{charcoal:'#2A3242',white:'#ECEFF3',navy:'#22355E',red:'#B8352E',green:'#3E7A4E',mustard:'#D9A43A',sky:'#7FB2DE',pink:'#E59AB5'},
   pants:{slate:'#3A4458',night:'#1C2330',denim:'#4A6A9A',khaki:'#B49A6A',olive:'#5D6438',grey:'#7A7F88'},
   shoes:{walnut:'#5A412F',black:'#24252B',white:'#E9E7E2',red:'#B8352E',navy:'#22355E',tan:'#A87A4E'}
 };
 const GROUPS=[
   {key:'hair',field:'hairColor',label:'Hair'},
   {key:'skin',field:'skinTone',label:'Skin'},
   {key:'top',field:'topColor',label:'Top'},
   {key:'pants',field:'pantsColor',label:'Pants'},
   {key:'shoes',field:'shoesColor',label:'Shoes'}
 ];
 const CATEGORIES=[
  {key:'hair',label:'Hair style',icon:'short'},
  {key:'face',label:'Glasses and facial hair',icon:'glasses'},
  {key:'top',label:'Top',icon:'casual'},
  {key:'pants',label:'Pants',icon:'pants'},
  {key:'shoes',label:'Shoes',icon:'shoes'},
  {key:'body',label:'Gender / body',icon:'other'},
  {key:'rotate',label:'Rotate preview',icon:'rotate',action:true},
  {key:'walk',label:'Change animation',icon:'walk',action:true},
  {key:'expr',label:'Change expression',icon:'smile',action:true},
  {key:'random',label:'Random look',icon:'random',action:true}
 ];
 const PX={k:'#1d1e22',s:'#f1c08f',h:'#5b3a1e',y:'#e8c04a',w:'#ffffff',g:'#8a8f98',b:'#2f6fb5',r:'#c8372d',p:'#c05fb0',t:'#3f8f4f',n:'#1b2a4a',o:'#e07a1f'};
 const ICON={
  short:['..hhhh..','.hhhhhh.','.hssssh.','.ssssss.','..ssss..','...ss...','..bbbb..','.bbbbbb.'],
  glasses:['........','........','kkkkkkkk','kbbkkbbk','kbbk.bbk','.kk..kk.','........','........'],
  casual:['........','.oo..oo.','oooooooo','oooooooo','..oooo..','..oooo..','..oooo..','........'],
  pants:['.nnnnnn.','.nnnnnn.','.nnnnnn.','.nn..nn.','.nn..nn.','.nn..nn.','.nn..nn.','.kk..kk.'],
  shoes:['........','........','........','..kk....','..kkk...','..kkkkk.','.kkkkkkk','.wwwwwww'],
  other:['..tttt.t','.t....tt','.t....t.','.t....t.','..tttt..','...tt...','..tttt..','...tt...'],
  rotate:['..kkkk..','.k....k.','k......k','k.....kkk','k......k.','.k......','..kkkk..','........'],
  walk:['.kk.....','.kkk....','.kk.....','........','....kk..','....kkk.','....kk..','........'],
  smile:['..yyyy..','.yyyyyy.','yykyykyy','yyyyyyyy','ykyyyyky','yykkkkyy','.yyyyyy.','..yyyy..'],
  random:['kkkkkkkk','kw.ww.wk','kwwwwwwk','kww.wwwk','kwwwwwwk','kw.ww.wk','kwwwwwwk','kkkkkkkk']
 };
 const STYLES={
  hair:[['hairStyle','Hair style']],
  face:[['glasses','Glasses'],['facialHair','Facial hair']],
  top:[['topStyle','Top']],
  pants:[['pantsStyle','Pants']],
  shoes:[['shoesStyle','Shoes']],
  body:[['body','Base character']]
 };
 let category='hair',menuOpen='',statusTimer=null;
 function icon(name){
  const p=ICON[name]||ICON.short;
  const parts=[];
  p.forEach((line,y)=>[...line].forEach((ch,x)=>{if(PX[ch])parts.push('<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+PX[ch]+'"/>');}));
  return '<svg viewBox="0 0 8 8" shape-rendering="crispEdges" role="img" aria-hidden="true">'+parts.join('')+'</svg>';
 }
 function label(value){return String(value||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());}
 function status(text){$('ccStatusText').textContent=text||'For Help, click Help Topics on the Help Menu.';}
 function setInput(id,value){
  const el=$(id);if(!el)return false;
  if(!Array.from(el.options||[]).some(o=>o.value===value))return false;
  el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
 }
 function getInput(id){return $(id)?.value||'';}
 function currentBody(){return root.querySelector('#characterChoices .choice.selected')?.dataset.character||'genesis_male_nude';}
 function setBody(value){
  const button=root.querySelector('#characterChoices .choice[data-character="'+value+'"]');
  if(button)button.click();
 }
 function paintTools(){
  const parent=$('ccTools');parent.replaceChildren();
  CATEGORIES.forEach(c=>{
   const btn=document.createElement('button');btn.type='button';btn.className='cc-tool-btn';btn.dataset.tool=c.key;
   btn.title=c.label;btn.setAttribute('aria-label',c.label);btn.setAttribute('aria-pressed',String(!c.action&&category===c.key));
   btn.innerHTML=icon(c.icon);
   btn.addEventListener('click',()=>{
    if(c.action){
     if(c.key==='random')randomize();
     else $(c.key==='rotate'?'charRotate':c.key==='walk'?'charAnimate':'charExpression').click();
     if(c.key==='rotate')status('Rotate character / 4 directions');
     if(c.key==='walk')status('Preview animation: '+$('previewDirection').textContent);
     if(c.key==='expr')status('Expression from Emosi.exe: '+$('previewDirection').textContent);
    }else{category=c.key;paintTools();paintOptions();status(c.label);}
   });
   parent.append(btn);
  });
 }
 // No old wardrobe choice is selectable unless Pakaian v2 was approved
 // for this exact Genesis fingerprint.
 let officialIndex=null;
 let publishedWardrobe=new Set();
 const referenceRoot="/virtual-life-asset-pipeline/media/lgr1/wardrobe-approved/";
 const referenceIds=new Set([
  "male_top_tee","female_top_tee",
  "male_pants_trousers","female_pants_trousers",
  "male_shoes_shoes","female_shoes_shoes"
 ]);
 const readJSON=url=>fetch(url,{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null);
 Promise.all([
  readJSON("/virtual-life-asset-pipeline/media/lgr1/base/index.json"),
  readJSON(referenceRoot+"index.json")
 ]).then(async ([base,catalog])=>{
  officialIndex=base;
  if(catalog?.format==="lgr1-wardrobe-official-reference-index-v1"&&
     catalog.baseVersion===base?.version&&Array.isArray(catalog.entries)){
   const entries=catalog.entries.filter(e=>referenceIds.has(e?.id)&&
    e.id===e.gender+"_"+e.group+"_"+e.variant&&e.path===e.id+".json");
   const verified=await Promise.all(entries.map(async e=>{
    const item=await readJSON(referenceRoot+e.path);
    const front=e.group+"/"+e.variant+(e.gender==="female"?"_f":"");
    return item?.format==="lgr1-pakaian-v2"&&item.id===e.id&&
     item.gender===e.gender&&item.group===e.group&&item.variant===e.variant&&
     item.approved===true&&item.baseVersion===base.version&&
     item.baseRigSha256===base.bases?.[e.gender]?.rigSha256&&
     typeof item.files?.[front]==="string"?e.id:null;
   }));
   publishedWardrobe=new Set(verified.filter(Boolean));
  }
  paintOptions();
 }).catch(()=>paintOptions());
 window.addEventListener("storage",e=>{if(e.key==="lgr1-db-cache-v1")paintOptions()});
 window.addEventListener("lgr-game-ready",()=>paintOptions());
 function styleOptions(field){
  const input=$(field);if(!input)return [];
  const group={topStyle:"top",pantsStyle:"pants",shoesStyle:"shoes",glasses:"glasses",facialHair:"facial"}[field];
  const gender=currentBody().includes("female")?"female":"male",base=officialIndex?.bases?.[gender];
  return Array.from(input.options).filter(option=>{
    const value=option.value;
    if(!value)return false;
    if(!group)return true;
    if(value==="nude"||value==="none")return true;
    const id=gender+"_"+group+"_"+value;
    const e=window.LGRDB?.get?.("pakaian",id);
    const approved=!!e&&e.approved&&e.format==="lgr1-pakaian-v2"&&
     e.baseRigSha256===base?.rigSha256&&e.baseVersion===officialIndex?.version;
    return approved||publishedWardrobe.has(id);
  }).map(option=>[option.value,option.textContent]);
 }
 function chooseOption(field,value){
  if(field==='body')setBody(value);
  else setInput(field,value);
  paintOptions();paintSwatches();paintSummary();status(label(value));
 }
 function paintOptions(){
  const panel=$('ccOptions');panel.replaceChildren();
  const head=document.createElement('b');head.className='cc-choice-heading';head.textContent=CATEGORIES.find(c=>c.key===category)?.label||'Tools';
  panel.append(head);
  for(const [field,title] of STYLES[category]||[]){
   const small=document.createElement('strong');small.textContent=title;panel.append(small);
   const buttons=document.createElement('div');buttons.className='cc-choice-buttons';
   const source=field==='body'?[['genesis_male_nude','Genesis Male Nude'],['genesis_female_nude','Genesis Female Nude']]:styleOptions(field);
   source.forEach(([value,name])=>{
    const b=document.createElement('button');b.type='button';b.className='cc-choice-btn';b.textContent=name;
    const selected=field==='body'?currentBody():getInput(field);
    b.setAttribute('aria-pressed',String(value===selected));
    b.addEventListener('click',()=>chooseOption(field,value));buttons.append(b);
   });
   panel.append(buttons);
  }
 }
 function paintSwatches(){
  const parent=$('ccSwatches');parent.replaceChildren();
  for(const g of GROUPS){
   const row=document.createElement('div');row.className='cc-swatch-row';
   const heading=document.createElement('span');heading.className='cc-swatch-label';heading.textContent=g.label;
   row.append(heading);
   for(const [key,color] of Object.entries(COLORS[g.key])){
    const b=document.createElement('button');b.type='button';b.className='cc-swatch';
    b.style.backgroundColor=color;b.title=g.label+' · '+label(key);b.setAttribute('aria-label',b.title);
    b.setAttribute('aria-pressed',String(getInput(g.field)===key));
    b.addEventListener('click',()=>chooseOption(g.field,key));
    row.append(b);
   }
   parent.append(row);
  }
  $('ccForeground').style.background=COLORS.hair[getInput('hairColor')]||'#2A3242';
  $('ccBackground').style.background=COLORS.skin[getInput('skinTone')]||'#F1D3B5';
 }
 function paintSummary(){
  const look=[getInput('hairStyle'),getInput('topStyle'),getInput('pantsStyle'),getInput('shoesStyle')].map(label).join(' · ');
  $('ccSelectedItems').textContent=look;
 }
 function randomize(){
  const fields=['hairStyle','glasses','facialHair','topStyle','pantsStyle','shoesStyle',...GROUPS.map(g=>g.field)];
  fields.forEach(id=>{const options=styleOptions(id);if(!options.length)return;setInput(id,options[Math.floor(Math.random()*options.length)][0]);});
  const bodies=['genesis_male_nude','genesis_female_nude'];setBody(bodies[Math.floor(Math.random()*bodies.length)]);
  paintOptions();paintSwatches();paintSummary();status('Random look applied');
 }
 function resetLook(){
  const defaults={hairStyle:'mid_curtain',hairColor:'navy',skinTone:'light',topStyle:'nude',topColor:'white',
   pantsStyle:'nude',pantsColor:'slate',shoesStyle:'nude',shoesColor:'black',glasses:'none',facialHair:'none'};
  for(const [field,val] of Object.entries(defaults))setInput(field,val);
  setBody('genesis_male_nude');paintOptions();paintSwatches();paintSummary();status('Appearance reset');
 }
 function closeMenu(){
  menuOpen='';$('ccMenuPopup').hidden=true;
  root.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));
 }
 function showMenu(name,button){
  if(menuOpen===name){closeMenu();return;}
  const menu=$('ccMenuPopup');menu.replaceChildren();menuOpen=name;
  const actions={
   File:[['Create Character',()=>$('characterForm').requestSubmit()],['Back',()=>$('backToLogin').click()]],
   Edit:[['Random look',randomize],['Reset appearance',resetLook]],
   View:[['Rotate preview',()=>$('charRotate').click()],['Walk / Idle',()=>$('charAnimate').click()],['Next expression',()=>$('charExpression').click()]],
   Image:[['Flip direction (180°)',()=>{$('charRotate').click();$('charRotate').click();}]],
   Options:[['Return to Hair tools',()=>{category='hair';paintTools();paintOptions();}],['Reset colors',resetLook]],
   Help:[['Help Topics',()=>status('Select tool → style choice → colors. Enter Nickname and Birthday. Create Character to review.')],['About Character Creator',()=>status('Original Paint-style Character Creator · v6b interface · mainkan.exe')]]
  };
  for(const [itemLabel,fn] of actions[name]||[]){
   const item=document.createElement('button');item.type='button';item.textContent=itemLabel;item.setAttribute('role','menuitem');
   item.addEventListener('click',()=>{closeMenu();fn();});menu.append(item);
  }
  menu.style.left=button.offsetLeft+'px';menu.hidden=false;
  root.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.menu===name)));
 }
 root.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>showMenu(b.dataset.menu,b)));
 document.addEventListener('pointerdown',e=>{if(menuOpen&&!e.target.closest('#ccMenu'))closeMenu();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuOpen){e.stopPropagation();closeMenu();}});
 const DD=['ccDay','ccMonth','ccYear'].map($);
 function syncBirthday(force){
  const values=DD.map(el=>el.value.trim()),[d,m,y]=values;
  const wrap=root.querySelector('.cc-date-fields');
  wrap.classList.remove('valid','invalid');
  if(values.every(x=>!x)){
   $('birthday').value='';$('zodiac').value='';$('ccZodiacText').value='';return true;
  }
  const year=Number(y),month=Number(m),day=Number(d);
  const date=new Date(Date.UTC(year,month-1,day));
  const valid=/^\d{1,2}$/.test(d)&&/^\d{1,2}$/.test(m)&&/^\d{4}$/.test(y)&&
   year>=1900&&year<=new Date().getFullYear()&&month>=1&&month<=12&&day>=1&&day<=31&&
   date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day&&
   date.getTime()<=Date.now();
  if(!valid){
   $('birthday').value='';$('zodiac').value='';$('ccZodiacText').value='';
   if(force||values.every(Boolean)){wrap.classList.add('invalid');status('Birthday: check DD/MM/YYYY');}
   return false;
  }
  wrap.classList.add('valid');
  const iso=String(year).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  $('birthday').value=iso;
  $('birthday').dispatchEvent(new Event('change',{bubbles:true}));
  const zodiac=$('zodiac').value;
  const symbols={Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓'};
  $('ccZodiacText').value=(symbols[zodiac]||'')+' '+zodiac;
  status('Birthday '+d.padStart(2,'0')+'/'+m.padStart(2,'0')+'/'+y+' → '+zodiac);
  return true;
 }
 DD.forEach((input,index)=>{
  input.addEventListener('input',e=>{
   input.value=input.value.replace(/\D/g,'').slice(0,index===2?4:2);
   if(index<2&&input.value.length===2&&e.inputType!=='deleteContentBackward'){
    DD[index+1].focus();DD[index+1].select();
   }
   syncBirthday(false);
  });
  input.addEventListener('keydown',e=>{
   if(e.key==='Backspace'&&!input.value&&index>0){
    e.preventDefault();DD[index-1].focus();DD[index-1].value=DD[index-1].value.slice(0,-1);syncBirthday(false);
   }else if(['/', '.', '-', ' '].includes(e.key)&&index<2){
    e.preventDefault();DD[index+1].focus();DD[index+1].select();
   }
  });
  input.addEventListener('paste',e=>{
   const raw=e.clipboardData?.getData('text')||'';
   const m=/^\s*(\d{1,2})\D+(\d{1,2})\D+(\d{4})\s*$/.exec(raw)||
           /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/.exec(raw);
   if(!m)return;e.preventDefault();
   const values=m[1].length===4?[m[3],m[2],m[1]]:[m[1],m[2],m[3]];
   DD.forEach((v,i)=>v.value=values[i].padStart(i===2?4:2,'0'));
   syncBirthday(true);
  });
 });
 // Prevent a misleading custom appearance if no body and birthday was completed.
 $('characterForm').addEventListener('submit',e=>{
  const valid=syncBirthday(true);
  const name=$('playerName').value.trim();
  if(!valid||!$('birthday').value){
   e.preventDefault();e.stopImmediatePropagation();
   $('characterMessage').textContent='Masukkan tanggal lahir DD / MM / YYYY yang valid.';
   $('characterMessage').classList.add('error');
   return;
  }
  if(name.length<3||name.length>16){
   e.preventDefault();e.stopImmediatePropagation();
   $('characterMessage').textContent='Nickname harus 3–16 karakter.';
   $('characterMessage').classList.add('error');
   return;
  }
  if(!/^[A-Za-z0-9_][A-Za-z0-9_ .-]*[A-Za-z0-9_]$/.test(name)){
   e.preventDefault();e.stopImmediatePropagation();
   $('characterMessage').textContent='Nickname hanya huruf, angka, spasi, titik, garis, underscore.';
   $('characterMessage').classList.add('error');
  }
 },true);
 const displayDate=()=>{
  const value=$('birthday').value;if(!value)return;
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);if(!m)return;
  DD[0].value=m[3];DD[1].value=m[2];DD[2].value=m[1];syncBirthday(false);
 };
 const observer=new MutationObserver(()=>{
  if($('characterScreen').hidden)return;
  displayDate();paintOptions();paintSwatches();paintSummary();
 });
 observer.observe($('characterScreen'),{attributes:true,attributeFilter:['hidden']});
 root.querySelectorAll('select').forEach(s=>s.addEventListener('change',()=>{paintSwatches();paintSummary();}));
 // Respect the original V6.DEF appearance from the source bundle.
 if(getInput('hairStyle')==='short')setInput('hairStyle','mid_curtain');
 if(getInput('hairColor')==='black')setInput('hairColor','navy');
 paintTools();paintOptions();paintSwatches();paintSummary();
 window.MainkanClassicCreator=Object.freeze({refresh:()=>{paintOptions();paintSwatches();paintSummary();},syncBirthday});
})();

/* Namanya Juga Hidup — the Game · UI mock layer (njh98-mock.js)
 * Makes every planned feature usable as a clearly tagged SIMULASI placeholder.
 * Rule: use the real hook when it exists (feature detection), otherwise a localStorage mock under njh98:mock:*.
 * Real game changes only go through the existing public API (SemestaLifePlay.runAction / stop, the reload button).
 * Mock functions Baymax replaces with real logic are listed in NJH98-UI.md (§ Lapisan simulasi).
 */
(function(){
'use strict';
const N=window.NJH98;if(!N)return;
const $=id=>document.getElementById(id);
const {rp,esc}=N;
const P='njh98:mock:';
const ls={get(k,d){try{const v=localStorage.getItem(P+k);return v==null?d:JSON.parse(v);}catch{return d;}},
 set(k,v){try{localStorage.setItem(P+k,JSON.stringify(v));}catch{}},
 clear(){try{Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>localStorage.removeItem(k));}catch{}}};
const SIM='<span class="njh-sim" title="Data simulasi UI (njh98:mock) sampai logic asli tersedia">SIMULASI</span>';
const PH='<span class="njh-soon nologic">PLACEHOLDER</span>';
const L=()=>N.life(),S=()=>N.sp();
const real=(obj,name)=>{try{const o=obj();return o&&typeof o[name]==='function'?o[name].bind(o):null;}catch{return null;}};
// Baymax hooks: canonical window.SemestaLifePlay, aliased window.SemestaPlay
const hook=name=>real(L,name)||real(S,name);
const mockFired=new Set();const fired=n=>{mockFired.add(n);};
const pid=()=>{try{return L()?.playerId?.()||'';}catch{return '';}};
const pk=k=>k+'@'+(pid()||'guest');
const st=()=>N.lifeState()||{};
const rules=()=>{try{return N.world()?.JiwaLifeEconomy||null;}catch{return null;}};
const setting=(k,d)=>{try{return rules()?.defaults?.()?.settings?.[k]??d;}catch{return d;}};
// fallback prices (Rp) = Baymax jiwa/life-economy.js (preview 2d965ee); the game setting wins when it exists
const PRICE={streetFoodPrice:2500,wartegMealPrice:12000,coffeePrice:5000,teaPrice:3000,tokenPrice:20000,tokenUnits:5,roomPrice:700000,fridgePrice:2000000,publicShowerFee:500,charity:1000};
const FURN_PRICE={fridge:2000000,bed:1500000,chair:350000,stove:850000,wardrobe:1000000};
const price=k=>setting(k,PRICE[k]);
const furnPrice=id=>(rules()?.FURNITURE||[]).find(x=>x.id===id)?.price??(id==='fridge'?price('fridgePrice'):FURN_PRICE[id]??0);
const playing=()=>N.current()==='gameScreen';

/* ================= settings (UI only, njh98:settings) ================= */
const SET_KEY='njh98:settings';
function settings(){try{return {sound:true,lang:'id',scale:100,...JSON.parse(localStorage.getItem(SET_KEY)||'{}')};}catch{return {sound:true,lang:'id',scale:100};}}
function saveSettings(v){try{localStorage.setItem(SET_KEY,JSON.stringify(v));}catch{}applySettings();}
const EN={'Nokia':'Phone','Tas':'Bag','Status':'Status','Peta':'Map','Menu':'Menu','Layar':'Screen','Kondisi':'Needs','Energi':'Energy','Kebersihan':'Hygiene',
 'Buang Air':'Bladder','Kenyang':'Fullness','Moral':'Morale','▶ Lanjut Main':'▶ Resume','Lihat Tutorial':'Tutorial','Muat Ulang Kota':'Reload City','Simpan':'Save','Muat':'Load',
 'Laporan Hari':'Day Report','Pengaturan':'Settings','Keluar ke Menu Utama':'Quit to Main Menu','▶ Mulai Main':'▶ Play','Main Tanpa Akun':'Play as Guest',
 'Lanjutkan':'Continue','Mulai Baru':'New Game','Kredit':'Credits','Menu Utama':'Main Menu','Menu Jeda':'Pause Menu','Status Pemain':'Player Status'};
function applySettings(){
 const v=settings();
 document.documentElement.style.setProperty('--njh-ui',String(v.scale/100));
 document.documentElement.lang=v.lang==='en'?'en':'id';
 document.querySelectorAll('.njh-app span,.njh-needs .w98-title span,.njh-need label,.njh-menu .btn>span:first-child,#njhStatusTitle,.screen h1').forEach(el=>{
  if(el.dataset.njhId==null)el.dataset.njhId=el.textContent;
  const id=el.dataset.njhId;el.textContent=v.lang==='en'&&EN[id]?EN[id]:id;
 });
}
let actx=null;
function blip(){
 if(!settings().sound)return;
 try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();
  o.type='square';o.frequency.value=880;g.gain.value=.025;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+.03);}catch{}
}
document.addEventListener('click',e=>{if(e.target.closest('.btn,.njh-app,.njh-slot,.njh-tabs button'))blip();},true);

/* ================= windows ================= */
const dlgLayer=document.createElement('div');dlgLayer.id='njhDlg';dlgLayer.className='njh-dlg';document.body.append(dlgLayer);
function win(id,title,html,{layer='auto',cls=''}={}){
 const inGame=layer==='hud'||(layer==='auto'&&playing());
 let w=$(id);
 const parent=inGame?$('njhHud'):dlgLayer;
 if(!w){w=document.createElement('section');w.id=id;w.setAttribute('role','dialog');w.innerHTML='<header class="w98-title"><span></span><button type="button" data-close aria-label="Tutup">×</button></header><div class="w98-body"></div>';}
 if(w.parentElement!==parent)parent.append(w);
 w.className='w98 njh-win '+cls;
 w.querySelector('.w98-title span').innerHTML=title;w.querySelector('.w98-body').innerHTML=html;
 N.closeWindows();N.closeCtx();w.hidden=false;dlgLayer.classList.toggle('on',!inGame);
 setTimeout(()=>(w.querySelector('[data-focus]')||w.querySelector('.btn.primary')||w.querySelector('[data-close]'))?.focus(),0);
 return w;
}
const bodyOf=id=>$(id)?.querySelector('.w98-body');
document.addEventListener('click',e=>{if(e.target.closest('#njhDlg [data-close]'))setTimeout(()=>{if(![...dlgLayer.children].some(c=>!c.hidden))dlgLayer.classList.remove('on');},0);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=[...document.querySelectorAll('.njh-win')].filter(w=>!w.hidden&&w.id!=='njhHowtoWin');
 if(open.length){open.forEach(w=>w.hidden=true);dlgLayer.classList.remove('on');indoorOff();}}});
function confirmBox(title,text,okLabel,onOk){
 const w=win('njhConfirm',title,'<p>'+text+'</p><div class="njh-row"><button class="btn" type="button" data-close>Batal</button><button class="btn primary" type="button" id="njhConfirmOk">'+okLabel+'</button></div>',{cls:'njh-small'});
 w.querySelector('#njhConfirmOk').onclick=()=>{w.hidden=true;dlgLayer.classList.remove('on');onOk();};
}
function say(text){if(playing())N.toast(text);else win('njhInfo','Info','<p>'+esc(text)+'</p><div class="njh-row"><button class="btn primary" data-close>OK</button></div>',{cls:'njh-small'});}

/* ================= mock wallet (rewards / non-runAction purchases) ================= */
const mwallet={get(){return ls.get(pk('wallet'),50000);},add(n){const v=Math.max(0,this.get()+n);ls.set(pk('wallet'),v);return v;}};

/* ================= day tracking → Laporan Hari ================= */
const dayNow=()=>{const c=hook('clock');if(c){try{const v=c();if(Number.isFinite(Number(v?.day)))return Number(v.day);}catch{}}fired('clock');const m=/Hari\s*(\d+)|Day\s*(\d+)/i.exec($('njhDay')?.textContent||'');return m?Number(m[1]||m[2]):1;};
let obs=null;   // {wallet,txId,day}
const COUNT_ACTIONS=['work','eat','coffee','cook','cook_recipe','scavenge','fish','help','charity','worship','course','home_shower','public_shower','sleep'];
function observe(s){
 if(!Number.isFinite(Number(s.wallet)))return;
 const day=dayNow();
 const days=ls.get(pk('days'),{});
 const cur=days[day]||(days[day]={day,start:s.wallet,end:s.wallet,income:{},expense:{}});
 const tx=(s.transactions||[]);const lastTx=tx[tx.length-1];
 if(obs&&obs.pid===pid()){
  // new transactions since last look → counters (skills / quests)
  let fresh=[];
  if(obs.txId){const i=tx.findIndex(t=>t.id===obs.txId);fresh=i>=0?tx.slice(i+1):[];}else if(obs.txLen===0)fresh=tx;
  if(fresh.length){const c=ls.get(pk('counts'),{});
   for(const t of fresh){if(COUNT_ACTIONS.includes(t.action))c[t.action]=(c[t.action]||0)+1;if(t.action==='work'&&t.delta>0)c.workEarn=(c.workEarn||0)+t.delta;}ls.set(pk('counts'),c);}
  const delta=s.wallet-obs.wallet;
  if(delta){
   const label=(fresh.slice().reverse().find(t=>t.delta===delta)||{}).label||(delta>0?'Pemasukan lain':'Pengeluaran lain');
   const bucket=delta>0?cur.income:cur.expense;bucket[label]=(bucket[label]||0)+Math.abs(delta);
  }
  if(day>obs.day&&!dayEndHook&&!hook('clock')){fired('day-end');const prev=days[obs.day];if(prev){prev.closed=true;prev.status=statusSnap(s);}ls.set(pk('days'),trimDays(days));openReport(obs.day,true);}
 }
 // also count non-wallet actions (cook/shower/sleep) from the pose the player just did is not observable → transactions only
 cur.end=s.wallet;cur.status=statusSnap(s);days[day]=cur;ls.set(pk('days'),trimDays(days));
 obs={pid:pid(),wallet:s.wallet,txId:lastTx?.id||obs?.txId||'',txLen:tx.length,day};
}
function closeDay(d){const days=ls.get(pk('days'),{});if(days[d]){days[d].closed=true;ls.set(pk('days'),days);}}
const trimDays=d=>{const k=Object.keys(d).map(Number).sort((a,b)=>b-a);k.slice(14).forEach(x=>delete d[x]);return d;};
const statusSnap=s=>({energy:s.energy,fullness:s.fullness,hygiene:s.hygiene,moral:s.moral,housing:s.housing?.room?'Kost':'Tenda'});
let dayEndHook=false;
// Baymax: Nokia's Peta app (world iframe) posts 'njh98:open-map' → the same Peta Kota window as the dock (one map only)
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='njh98:open-map')return;try{N.world()?.document?.getElementById('ptWinClose')?.click();}catch{}setTimeout(openMap,80);});
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='mainkan:day-end'){dayEndHook=true;const d=Number(e.data.previousDay)||(Number(e.data.day)||dayNow())-1;closeDay(d);openReport(d,true);}});
function openReport(day,ended){
 day=day||dayNow();let source='mock';
 let r=null;const hookFn=hook('dayReport');
 if(hookFn){try{r=hookFn(day)||null;}catch{}}
 if(r)source='hook';
 const tx=st().transactions||[];const rec=ls.get(pk('days'),{})[day];
 if(!r&&tx.length&&tx.every(t=>Number.isFinite(Number(t.day)))){
  // real data: Baymax's transactions[].day (log keeps the last 40 wallet deltas)
  const mine=tx.filter(t=>Number(t.day)===day);const income={},expense={};
  for(const t of mine){const b=t.delta>0?income:expense;b[t.label||t.action]=(b[t.label||t.action]||0)+Math.abs(t.delta);}
  const first=mine[0],last=mine[mine.length-1];
  r={day,start:first?first.balance-first.delta:(rec?.start??st().wallet),end:last?last.balance:(rec?.end??st().wallet),income,expense,status:rec?.status||statusSnap(st())};source='tx';
 }
 const mock=!r;if(mock)fired('dayReport');
 if(!r){const d=ls.get(pk('days'),{})[day];r=d?{day,start:d.start,end:d.end,income:d.income,expense:d.expense,status:d.status}:{day,start:st().wallet,end:st().wallet,income:{},expense:{},status:statusSnap(st())};}
 const rows=o=>{const e=Object.entries(o||{});return e.length?e.map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+rp(v)+'</td></tr>').join(''):'<tr><th colspan="2"><i>belum ada</i></th></tr>';};
 const sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
 const inc=sum(r.income),exp=sum(r.expense),s2=r.status||{};
 const html='<p class="micro">'+(ended?'Hari '+day+' selesai.':'Hari '+day+' (berjalan).')+(source==='tx'?' Dari transaksi game (transactions[].day).':' Dihitung dari perubahan dompet yang terlihat di game.')+(mock?' '+SIM:'')+'</p>'+
  '<div class="njh-2col"><fieldset class="njh-group"><legend>Pendapatan</legend><table>'+rows(r.income)+'<tr class="tot"><th>Total</th><td>'+rp(inc)+'</td></tr></table></fieldset>'+
  '<fieldset class="njh-group"><legend>Pengeluaran</legend><table>'+rows(r.expense)+'<tr class="tot"><th>Total</th><td>'+rp(exp)+'</td></tr></table></fieldset></div>'+
  '<fieldset class="njh-group"><legend>Tabungan &amp; status</legend><table><tr><th>Saldo awal</th><td>'+rp(r.start)+'</td></tr><tr><th>Tabungan akhir</th><td><b>'+rp(r.end)+'</b> ('+(inc-exp>=0?'+':'−')+rp(Math.abs(inc-exp)).replace('Rp ','Rp')+')</td></tr>'+
  '<tr><th>Kondisi</th><td>Energi '+N.clamp(s2.energy)+' · Kenyang '+N.clamp(s2.fullness)+' · Bersih '+N.clamp(s2.hygiene)+' · Moral '+N.clamp(s2.moral)+'</td></tr><tr><th>Tinggal di</th><td>'+esc(s2.housing||'—')+'</td></tr></table></fieldset>'+
  '<div class="njh-row"><button class="btn primary" type="button" data-close>'+(ended?'Lanjutkan ke Hari '+(day+1)+' &gt;':'Tutup')+'</button></div>';
 win('njhReport','Laporan Hari '+day,html,{cls:'njh-report'});
}

/* ================= status window (Kondisi + skill/reputasi + tempat tinggal) ================= */
const bar=(label,v,max=100)=>'<div class="njh-need"><label>'+esc(label)+'</label><div class="njh-bar"><i style="width:'+Math.round(100*Math.max(0,Math.min(max,v))/max)+'%"></i></div><output>'+Math.round(v)+'</output></div>';
function level(s){const f=hook('level');if(f){try{return {lv:f(),mock:false};}catch{}}fired('level');return {lv:1+Math.floor((Number(s.experience)||0)/10),mock:true};}
function skills(s){
 const f=hook('skills');if(f){try{const v=f();if(Array.isArray(v))return {list:v,mock:false};}catch{}}fired('skills');
 const c=ls.get(pk('counts'),{}),q=Object.values(ls.get(pk('quests'),{})).filter(x=>x.state==='done').length;
 const lv=n=>Math.min(10,1+Math.floor(n/3));
 return {mock:true,list:[{label:'Kerja jalanan',level:lv(c.work||0)},{label:'Masak',level:lv((c.cook||0)+(c.cook_recipe||0))},{label:'Mulung & mancing',level:lv((c.scavenge||0)+(c.fish||0))},{label:'Sosial',level:lv((c.help||0)+(c.charity||0)+q*2)}]};
}
function reputation(s){
 const f=hook('reputation');if(f){try{const v=f();if(Array.isArray(v))return {list:v,mock:false};}catch{}}fired('reputation');
 const c=ls.get(pk('counts'),{}),q=Object.values(ls.get(pk('quests'),{})).filter(x=>x.state==='done').length;
 return {mock:true,list:[{label:'Warga kampung',value:Math.min(100,20+q*15+(c.help||0)*5)},{label:'Pedagang',value:Math.min(100,10+((c.eat||0)+(c.coffee||0))*4)},{label:'Kang parkir & Pak Ogah',value:Math.min(100,10+(c.work||0)*3)}]};
}
const LADDER=[{id:'tenda',label:'Tenda',lv:1},{id:'kost',label:'Kost',lv:3},{id:'rumah',label:'Rumah',lv:8}];
function housing(s){
 const f=hook('housingProgress');if(f){try{const v=f();if(v)return {...v,mock:false};}catch{}}fired('housingProgress');
 const {lv}=level(s);const q=Object.values(ls.get(pk('quests'),{})).filter(x=>x.state==='done').length;
 const cur=s.housing?.room?'kost':'tenda';const room=price('roomPrice');const furn=s.furniture||[];
 const targets=cur==='tenda'?[
   {label:'Level '+3,done:lv>=3,info:'Lv '+lv},
   {label:'Tabungan '+rp(room),done:(s.wallet||0)>=room,info:rp(s.wallet)},
   {label:'Sewa kamar di Kost',done:!!s.housing?.room,info:'datangi Kost'}]:[
   {label:'Level 8',done:lv>=8,info:'Lv '+lv},
   {label:'Tabungan Rp150.000.000',done:(s.wallet||0)>=150000000,info:rp(s.wallet)},
   {label:'Furnitur: Kasur, Kursi, Kompor, Lemari',done:['bed','chair','stove','wardrobe'].every(x=>furn.includes(x)),info:furn.length+'/4'},
   {label:'Selesaikan 4 quest warga',done:q>=4,info:q+'/4'}];
 return {current:cur,next:cur==='tenda'?'kost':'rumah',targets,mock:true};
}
function statusHTML(s){
 const name=N.profile()?.name||'Pemain';const {lv,mock:lvMock}=level(s);
 const sk=skills(s),rep=reputation(s),h=housing(s);
 const idx=LADDER.findIndex(x=>x.id===h.current);
 return '<fieldset class="njh-group"><legend>'+esc(name)+' · Level '+lv+(lvMock?' '+SIM:'')+'</legend>'+
   N.NEEDS.map(([k,l])=>bar(l,N.clamp(s[k]))).join('')+'<p class="micro">Dompet '+rp(s.wallet)+' · Dompet simulasi '+rp(mwallet.get())+' '+SIM+'</p></fieldset>'+
  '<div class="njh-2col"><fieldset class="njh-group"><legend>Skill'+(sk.mock?' '+SIM:'')+'</legend>'+sk.list.map(x=>bar(x.label,x.level,10)).join('')+'</fieldset>'+
  '<fieldset class="njh-group"><legend>Reputasi'+(rep.mock?' '+SIM:'')+'</legend>'+rep.list.map(x=>bar(x.label,x.value)).join('')+'</fieldset></div>'+
  '<fieldset class="njh-group"><legend>Progres tempat tinggal'+(h.mock?' '+SIM:'')+'</legend><div class="njh-ladder">'+
   LADDER.map((x,i)=>'<span class="'+(i===idx?'on':i<idx?'done':'')+'">'+x.label+' <small>Lv'+x.lv+'</small></span>').join('<i class="njh-arrow">→</i>')+'</div>'+
   (h.targets?.length?'<p class="micro">Target ke <b>'+esc(LADDER.find(x=>x.id===h.next)?.label||h.next)+'</b>:</p><ul class="njh-check">'+h.targets.map(t=>'<li class="'+(t.done?'ok':'')+'"><i>'+(t.done?'✓':'')+'</i>'+esc(t.label)+'<small>'+esc(t.info||'')+'</small></li>').join('')+'</ul>':'')+
  '</fieldset><div class="njh-row"><button type="button" class="btn primary" data-close>OK</button></div>';
}

/* ================= quests ================= */
const QUESTS=[
 {re:/silver/i,id:'q_silver',title:'Modal Cat Silver',text:'Mas, cat silver mahal. Bantu cari modal dulu ya, kerja apa aja.',goal:'Dapatkan Rp5.000 dari kerja',kind:'earn',target:5000,reward:7500},
 {re:/ogah/i,id:'q_ogah',title:'Isi Perut Dulu',text:'Ngatur jalan itu capek, Bos. Makan dulu di warteg, abis itu kita ngobrol.',goal:'Makan di warteg 1×',kind:'count',act:'eat',target:1,reward:5000},
 {re:/parkir/i,id:'q_parkir',title:'Biar Rapi',text:'Kalau mau bantu jaga parkir, minimal mandi dulu lah biar orang percaya.',goal:'Kebersihan minimal 80',kind:'stat',stat:'hygiene',target:80,reward:4000},
 {re:/loak|babeh/i,id:'q_loak',title:'Barang Bekas',text:'Babeh lagi butuh barang. Bawa apa aja dua biji, nanti Babeh kasih ongkos.',goal:'Punya 2 barang di tas',kind:'inv',target:2,reward:6000},
 {re:/./,id:'q_warga',title:'Bantu Warga',text:'Lagi butuh bantuan nih. Belajar dulu biar makin jago.',goal:'Naikkan EXP +5',kind:'exp',target:5,reward:3000}];
const questFor=o=>QUESTS.find(q=>q.re.test(o?.name||''))||QUESTS[QUESTS.length-1];
function qprogress(q,rec,s){
 const c=ls.get(pk('counts'),{});const b=rec?.base||{};
 switch(q.kind){
  case 'earn':return (c.workEarn||0)-(b.workEarn||0);
  case 'count':return (c[q.act]||0)-(b[q.act]||0);
  case 'stat':return Number(s[q.stat])||0;
  case 'inv':return (s.inventory||[]).length;
  case 'exp':return (Number(s.experience)||0)-(b.exp||0);
 }return 0;
}
function questState(o){
 const rec=ls.get(pk('quests'),{})[o.id];
 if(!rec)return 'available';
 if(rec.state==='done')return null;
 const q=questFor(o);return qprogress(q,rec,st())>=q.target?'ready':null;
}
function openQuest(qm){
 const o=qm.npc||{};const me=N.playerPos();
 if(me&&Math.hypot((o.x||0)-me.x,(o.z||0)-me.z)>6){N.toast('Dekati '+(o.name||'NPC')+' dulu.');return;}
 // real quest data for this NPC wins: quests() → [{npcId,id,title,goal,target,progress,reward,state:'available'|'active'|'ready'|'done'}]
 let hq=null;const hookQ=hook('quests');if(hookQ){try{hq=(hookQ()||[]).find(x=>String(x.npcId)===String(o.id))||null;}catch{}}
 if(!hq)fired('quests');
 const q=hq?{...questFor(o),...hq,text:hq.text||questFor(o).text,kind:'count'}:questFor(o);const all=ls.get(pk('quests'),{});const s=st();
 const rec=hq?(hq.state==='available'?null:{state:hq.state}):all[o.id];
 const prog=hq?Number(hq.progress)||0:rec?qprogress(q,rec,s):0;const ready=hq?hq.state==='ready':rec&&rec.state!=='done'&&prog>=q.target;
 const pct=Math.max(0,Math.min(100,Math.round(100*prog/q.target)));
 let html='<div class="njh-quest"><b class="njh-qicon'+(ready?' ready':'')+'">'+(ready?'?':'!')+'</b><div><p><b>'+esc(o.name||'NPC')+':</b> “'+esc(q.text)+'”</p>'+
  '<fieldset class="njh-group"><legend>'+esc(q.title)+(hq?'':' '+SIM)+'</legend><p>Tujuan: '+esc(q.goal)+'</p>'+
  (rec&&rec.state!=='done'?'<div class="njh-bar njh-bar-lg"><i style="width:'+pct+'%"></i></div><p class="micro">'+(q.kind==='earn'?rp(Math.max(0,prog))+' / '+rp(q.target):Math.max(0,Math.round(prog))+' / '+q.target)+'</p>':'')+
  '<p class="micro">Hadiah: '+rp(q.reward)+' ke dompet simulasi · reputasi warga +15</p></fieldset></div></div><div class="njh-row">';
 if(!rec)html+='<button class="btn" type="button" data-close>Nanti</button><button class="btn primary" type="button" id="njhQAccept">Terima</button>';
 else if(rec.state==='done')html+='<span class="micro">Quest sudah selesai. Makasih!</span><button class="btn primary" type="button" data-close>OK</button>';
 else html+='<button class="btn" type="button" data-close>Tutup</button><button class="btn primary" type="button" id="njhQTurnIn"'+(ready?'':' disabled')+'>? Serahkan</button>';
 const w=win('njhQuest','Quest · '+esc(o.name||'NPC'),html+'</div>',{layer:'hud',cls:'njh-questwin'});
 w.querySelector('#njhQAccept')?.addEventListener('click',()=>{
  const acc=hook('acceptQuest');if(acc&&hq){try{acc(o.id,q.id);}catch{}openQuest(qm);return;}
  const c=ls.get(pk('counts'),{});all[o.id]={qid:q.id,state:'active',base:{workEarn:c.workEarn||0,[q.act||'x']:c[q.act]||0,exp:Number(s.experience)||0},at:Date.now()};ls.set(pk('quests'),all);
  inbox.push(o.name||'NPC','Quest “'+q.title+'” diterima: '+q.goal+'.');openQuest(qm);});
 w.querySelector('#njhQTurnIn')?.addEventListener('click',()=>{
  const ti=hook('turnInQuest');if(ti&&hq){try{ti(o.id,q.id);}catch{}openQuest(qm);return;}
  all[o.id]={...rec,state:'done',doneAt:Date.now()};ls.set(pk('quests'),all);mwallet.add(q.reward);
  inbox.push(o.name||'NPC','Makasih! Hadiah '+rp(q.reward)+' masuk dompet simulasi.');N.toast('Quest selesai · +'+rp(q.reward)+' (SIMULASI)');openQuest(qm);});
}
$('njhMarks')?.addEventListener('click',e=>{const m=e.target.closest('.njh-qmark');if(m?._q)openQuest(m._q);});

/* ================= Nokia extras: Pesan / Lowongan / Tips ================= */
const inbox={real(){const f=hook('messages');if(!f)return null;try{const v=f();return Array.isArray(v)?v:null;}catch{return null;}},
 list(){const r=this.real();if(r){const extra=ls.get(pk('inbox'),null)||[];return extra.filter(m=>m.sim).concat(r);}fired('messages');return ls.get(pk('inbox'),null)||[{from:'Lafrich',text:'Selamat datang di kota! Cari kerja, hemat, kumpulin buat kost.',t:Date.now()},{from:'Mak Kost',text:'Kamar kost masih ada, '+rp(price('roomPrice'))+' sekali bayar. Kabarin ya.',t:Date.now()}];},
 // UI-only notes (e.g. a SIMULASI job application) are kept beside the real inbox and tagged
 push(from,text){const real=!!this.real();const l=real?(ls.get(pk('inbox'),null)||[]).filter(m=>m.sim):this.list();l.unshift({from,text,t:Date.now(),unread:true,sim:real});ls.set(pk('inbox'),l.slice(0,30));}};
const JOB_NAMES={pak_ogah:'Bantu Lalu Lintas (Pak Ogah)',manusia_silver:'Manusia Silver',kang_parkir:'Jaga Parkir (Kang Parkir)',kantor_premium:'Kerja Kantor Premium'};
// fallback = the 4 game jobs with Baymax's wages (Rp per sesi); used only when neither jobs() nor JiwaLifeEconomy.JOBS exist
const MOCK_JOBS=[{id:'manusia_silver',wage:1600,minutes:25},{id:'pak_ogah',wage:2500,minutes:20},{id:'kang_parkir',wage:2100,minutes:18},{id:'kantor_premium',wage:4500,minutes:28,minHygiene:70}].map(j=>({...j,label:JOB_NAMES[j.id],per:'sesi '+j.minutes+' mnt'}));
function jobs(){
 const f=hook('jobs');if(f){try{const v=f();if(Array.isArray(v))return v.map(j=>({...j,mock:false}));}catch{}}fired('jobs');
 let rj=[];try{rj=(rules()?.JOBS||[]).map(j=>({id:j.id,label:JOB_NAMES[j.id]||j.label,wage:j.wage,per:'sesi '+j.minutes+' mnt',site:(L()?.sites?.()||[]).find(s=>s.jobId===j.id),mock:false,minHygiene:j.minHygiene}));}catch{}
 return rj.length?rj:MOCK_JOBS.map(j=>({...j,mock:true}));
}
let nokiaTab='pesan';
function paintNokiaPlus(){
 const b=bodyOf('njhNokiaPlus');if(!b)return;
 const tabs=[['pesan','Pesan'],['lowongan','Lowongan'],['tips','Tips']];
 let body='';
 if(nokiaTab==='pesan'){const l=inbox.list();body='<ul class="njh-list">'+l.map(m=>'<li><b>'+esc(m.from)+'</b><span>'+esc(m.text)+'</span></li>').join('')+'</ul>';
  if(!inbox.real()){l.forEach(m=>m.unread=false);ls.set(pk('inbox'),l);}}
 if(nokiaTab==='lowongan')body='<ul class="njh-list">'+jobs().map((j,i)=>'<li><b>'+esc(j.label)+(j.mock?' '+SIM:'')+'</b><span>'+rp(j.wage)+' / '+esc(j.per)+(j.minHygiene?' · bersih ≥ '+j.minHygiene:'')+(j.where?' · '+esc(j.where):'')+'</span>'+
  (j.site?'<button class="btn" type="button" data-job-map="'+esc(j.site.id)+'">Tandai di Peta</button>':j.mock?'<button class="btn" type="button" data-job-apply="'+i+'">Lamar</button>':'')+'</li>').join('')+'</ul>';
 if(nokiaTab==='tips')body='<ul class="njh-list tips"><li>Kerja: tahan <b>AKSI</b> di tempat kerja sampai bar penuh.</li><li>Kebersihan rendah? Mandi umum cuma '+rp(price('publicShowerFee'))+'.</li><li>Kumpulin '+rp(price('roomPrice'))+' buat sewa kost biar tidurnya pulih lebih banyak.</li><li>Makanan bisa busuk. Simpan di kulkas kost.</li><li>Moral di bawah '+setting('arrestMoralThreshold',15)+' bikin hansip curiga.</li></ul>';
 b.innerHTML='<div class="njh-tabs" role="tablist">'+tabs.map(([id,l])=>'<button type="button" role="tab" aria-selected="'+(id===nokiaTab)+'" data-ntab="'+id+'">'+l+'</button>').join('')+'</div><div class="njh-tabpane">'+body+'</div><p class="micro">Aplikasi tambahan Nokia '+SIM+'</p>';
}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-ntab]');if(t){nokiaTab=t.dataset.ntab;paintNokiaPlus();return;}
 const m=e.target.closest('[data-job-map]');if(m){mapFocus=m.dataset.jobMap;try{N.world()?.document?.getElementById('ptWinClose')?.click();}catch{}setTimeout(openMap,80);return;}
 const a=e.target.closest('[data-job-apply]');if(a){const j=jobs()[Number(a.dataset.jobApply)];inbox.push(j.where||'HRD','Lamaran '+j.label+' diterima! Mulai besok jam 07.00. (SIMULASI)');N.toast('Lamaran terkirim');nokiaTab='pesan';paintNokiaPlus();}
});
let lastModal='';
function onModal(kind){
 if(kind===lastModal)return;lastModal=kind;
 const w=$('njhNokiaPlus');
 if(kind==='phone'){
  let x=w;if(!x){x=document.createElement('section');x.id='njhNokiaPlus';x.className='w98 njh-nokiaplus';x.innerHTML='<header class="w98-title"><span>Nokia · Aplikasi</span></header><div class="w98-body"></div>';$('njhHud').append(x);}
  x.hidden=false;paintNokiaPlus();
 }else if(w)w.hidden=true;
}

/* ================= map window (dock Peta) ================= */
let mapFocus='';
function openMap(){
 const w=win('njhMapWin','Peta Kota','<canvas id="njhMapCanvas" width="480" height="300" aria-label="Peta"></canvas><div class="njh-maplegend"><span><i class="me"></i>Kamu</span><span><i class="site"></i>Tempat</span><span><i class="q"></i>Quest</span><span><i class="door"></i>Pintu</span></div><div class="w98-well micro" id="njhMapInfo">Klik titik untuk nama tempat.</div><div class="njh-row"><button class="btn primary" type="button" data-close>Tutup</button></div>',{layer:'hud',cls:'njh-mapwin'});
 paintMap();const c=$('njhMapCanvas');
 c.onclick=e=>{const r=c.getBoundingClientRect(),x=(e.clientX-r.left)*c.width/r.width,y=(e.clientY-r.top)*c.height/r.height;
  const hit=(mapPts||[]).map(p=>({...p,d:Math.hypot(p.px-x,p.py-y)})).sort((a,b)=>a.d-b.d)[0];
  $('njhMapInfo').textContent=hit&&hit.d<14?hit.label+(hit.placeholder?' (placeholder)':''):'Klik titik untuk nama tempat.';};
 return w;
}
let mapPts=[];
function paintMap(){
 const c=$('njhMapCanvas');if(!c||$('njhMapWin')?.hidden)return;
 const g=c.getContext('2d');let snap=null;try{snap=N.world()?.VL?.gameSnapshot?.()?.map||null;}catch{}
 g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
 if(!snap){g.fillStyle='#000';g.font='12px sans-serif';g.fillText('Peta belum siap.',12,20);return;}
 const b=snap.bounds||{minX:-50,maxX:50,minZ:-50,maxZ:50},pad=14;
 const sx=(c.width-2*pad)/Math.max(1,b.maxX-b.minX),sz=(c.height-2*pad)/Math.max(1,b.maxZ-b.minZ),k=Math.min(sx,sz);
 const ox=(c.width-(b.maxX-b.minX)*k)/2-pad,oy=(c.height-(b.maxZ-b.minZ)*k)/2-pad;
 const X=x=>ox+pad+(x-b.minX)*k,Y=z=>oy+pad+(z-b.minZ)*k;
 g.fillStyle='#c0c0c0';g.fillRect(0,0,c.width,c.height);g.fillStyle='#fff';g.fillRect(X(b.minX),Y(b.minZ),(b.maxX-b.minX)*k,(b.maxZ-b.minZ)*k);
 g.strokeStyle='#dfdfdf';for(let x=Math.ceil(b.minX/10)*10;x<=b.maxX;x+=10){g.beginPath();g.moveTo(X(x)+.5,Y(b.minZ));g.lineTo(X(x)+.5,Y(b.maxZ));g.stroke();}
 for(let z=Math.ceil(b.minZ/10)*10;z<=b.maxZ;z+=10){g.beginPath();g.moveTo(X(b.minX),Y(z)+.5);g.lineTo(X(b.maxX),Y(z)+.5);g.stroke();}
 g.strokeStyle='#808080';g.strokeRect(Math.round(X(b.minX))+.5,Math.round(Y(b.minZ))+.5,(b.maxX-b.minX)*k,(b.maxZ-b.minZ)*k);
 mapPts=[];
 for(const s of snap.sites||[]){const px=X(s.x),py=Y(s.z);g.fillStyle=s.placeholder?'#c0c0c0':'#008080';g.fillRect(Math.round(px)-2,Math.round(py)-2,5,5);mapPts.push({px,py,label:s.label,placeholder:s.placeholder,id:s.id});
  if(s.id===mapFocus){g.strokeStyle='#ff0000';g.strokeRect(Math.round(px)-6.5,Math.round(py)-6.5,13,13);}}
 for(const d of N.doorList()){const px=X(d.x),py=Y(d.z);g.fillStyle='#000080';g.fillRect(Math.round(px)-1,Math.round(py)-5,3,3);}
 for(const q of N.questList()){const px=X(q.x),py=Y(q.z);g.fillStyle='#ffff00';g.fillRect(Math.round(px)-3,Math.round(py)-8,7,9);g.strokeStyle='#000';g.strokeRect(Math.round(px)-3.5,Math.round(py)-8.5,7,9);g.fillStyle='#000';g.fillRect(Math.round(px),Math.round(py)-7,1,4);g.fillRect(Math.round(px),Math.round(py)-2,1,1);mapPts.push({px,py,label:q.name+' (quest)'});}
 const p=snap.player;if(p){const px=Math.round(X(p.x)),py=Math.round(Y(p.z));const on=Math.floor(performance.now()/400)%2;g.fillStyle=on?'#ff0000':'#800000';g.fillRect(px-3,py-3,7,7);g.strokeStyle='#000';g.strokeRect(px-3.5,py-3.5,7,7);}
}

/* ================= interiors (placeholder) ================= */
const SHOPS={
 warung:{title:'Warteg',real:[{act:'eat',label:'Makan Warteg',price:()=>price('wartegMealPrice')}],mock:[['Es Teh Manis',3000],['Gorengan 2 biji',2500]]},
 coffee:{title:'Warung Kopi',real:[{act:'coffee',label:'Kopi',price:()=>price('coffeePrice')},{act:'tea',label:'Es Teh',price:()=>price('teaPrice')}],mock:[['Gorengan 2 biji',2500]]},
 loak:{title:'Toko Loak',real:[{act:'sell_loak',label:'Jual barang dari tas',item:true}],mock:[['Kipas Angin Bekas',45000],['Radio Bekas',30000]]},
 pasar_ikan:{title:'Pasar Ikan',real:[{act:'sell_fish',label:'Jual ikan',item:true,args:{buyerId:'pasar_ikan'}}],mock:[['Ikan Lele 1 kg',28000],['Tahu & Tempe',6000]]},
 siomay_batagor:{title:'Bang Siomay / Batagor',real:[{act:'sell_fish',label:'Jual ikan ke Abang',item:true,args:{buyerId:'siomay_batagor'}}],mock:[['Siomay 1 porsi',12000],['Batagor 1 porsi',12000]]},
 course:{title:'Kursus HP',real:[{act:'course',label:'Ikut Kursus HP (EXP +12)'}],mock:[['Buku Tulis',5000],['Pulpen',3000]]},
 public_wc:{title:'WC Umum',real:[{act:'public_toilet',label:'Pakai WC',args:{facilityId:'public_wc'}}],mock:[['Tisu',2000]]},
 public_bath:{title:'Mandi Umum',real:[{act:'public_shower',label:'Mandi',price:()=>price('publicShowerFee'),args:{facilityId:'public_bath'}}],mock:[['Sabun Sachet',1000],['Sampo Sachet',1000]]},
 prayer:{title:'Tempat Ibadah',real:[{act:'worship',label:'Ibadah'}],mock:[['Sedekah',1000]]}
};
const shopOf=id=>SHOPS[id]||(/^prayer_/.test(id)?SHOPS.prayer:null);
function itemSelect(id,list,meta){return '<select id="'+id+'">'+(list.length?list.map(x=>'<option value="'+esc(x)+'">'+esc(meta?.[x]?.label||x)+'</option>').join(''):'<option value="">(kosong)</option>')+'</select>';}
function runReal(action,args){
 const f=real(L,'runAction');if(!f)return {ok:false,reason:'Game belum siap.'};
 try{return f(action,args||{})||{ok:false,reason:'Tidak ada respon'};}catch(err){return {ok:false,reason:String(err.message||err)};}
}
const resultText=r=>r.ok?'✓ '+((r.changes||[]).join(' · ')||'OK'):'✗ '+(r.reason||'Gagal');
function enterDoor(d){
 const id=String(d.id||'').replace(/^d:/,'');
 if(id==='kost')return openKost(d);
 const enter=hook('enterInterior');if(enter&&!d.sample){try{if(enter(id))return;}catch{}}
 fired('enterInterior');
 const shop=shopOf(id)||{title:d.name,real:[],mock:[['Lihat-lihat',0]]};
 const s=st();
 const html='<div class="njh-shophead"><b>'+esc(d.name||shop.title)+'</b>'+PH+'</div>'+
  '<p class="micro">Interior placeholder. Aksi asli lewat game, sisanya '+SIM+'.</p>'+
  (shop.real.length?'<fieldset class="njh-group"><legend>Aksi (game asli)</legend>'+shop.real.map((a,i)=>{const pr=typeof a.price==='function'?a.price():a.price;
   return '<div class="njh-shoprow">'+(a.item?itemSelect('njhShopItem'+i,s.inventory||[],s.itemMeta):'')+'<button class="btn" type="button" data-shop-real="'+i+'"><span>'+esc(a.label)+'</span>'+(pr!=null?'<small>'+rp(pr)+'</small>':'')+'</button></div>';}).join('')+'</fieldset>':'')+
  '<fieldset class="njh-group"><legend>Menu lain '+SIM+'</legend>'+shop.mock.map(([l,p],i)=>'<div class="njh-shoprow"><button class="btn" type="button" data-shop-mock="'+i+'"><span>'+esc(l)+'</span><small>'+(p?rp(p):'gratis')+'</small></button></div>').join('')+'</fieldset>'+
  '<div class="w98-well micro" id="njhShopMsg">Dompet '+rp(s.wallet)+' · Dompet simulasi '+rp(mwallet.get())+'</div>'+
  '<div class="njh-row"><button class="btn primary" type="button" data-close>Keluar</button></div>';
 const w=win('njhShop',esc(shop.title)+'.exe',html,{layer:'hud',cls:'njh-shopwin'});
 w.onclick=e=>{
  const r=e.target.closest('[data-shop-real]'),m=e.target.closest('[data-shop-mock]');const msg=$('njhShopMsg');
  if(r){const a=shop.real[Number(r.dataset.shopReal)];const args={...(a.args||{})};if(a.item)args.itemId=$('njhShopItem'+r.dataset.shopReal)?.value||'';
   const res=runReal(a.act,args);msg.textContent=resultText(res)+' · Dompet '+rp(st().wallet);}
  if(m){const [l,p]=shop.mock[Number(m.dataset.shopMock)];if(mwallet.get()<p){msg.innerHTML='Dompet simulasi kurang. '+SIM;return;}
   const left=mwallet.add(-p);msg.innerHTML='Beli '+esc(l)+' '+rp(p)+' · Dompet simulasi '+rp(left)+' '+SIM;}
 };
}
/* Kost.exe: furniture hotspots, actions only near the matching furniture */
const ROOM={w:8,h:6,door:{x:3,y:5}};
function furnitureSpots(s){
 const f=hook('furnitureSpots');if(f){try{const v=f();if(Array.isArray(v)&&v.length)return v;}catch{}}fired('furnitureSpots');
 const has=id=>(s.furniture||[]).includes(id);
 return [
  {id:'bed',label:'Kasur',x:0,y:1,w:2,h:2,owned:has('bed'),acts:[{act:'sleep',label:'Tidur'}]},
  {id:'stove',label:'Kompor',x:6,y:1,w:2,h:1,owned:has('stove'),acts:[{act:'cook',label:'Masak Ikan',item:'inventory'},{act:'cook_recipe',label:'Masak Resep',recipe:true}]},
  {id:'fridge',label:'Kulkas',x:5,y:1,w:1,h:1,owned:!!s.housing?.fridge,buy:'fridge',acts:[{act:'store_fridge',label:'Simpan ke Kulkas',item:'inventory'},{act:'take_fridge',label:'Ambil dari Kulkas',item:'fridge'}]},
  {id:'bath',label:'Kamar Mandi',x:7,y:3,w:1,h:2,owned:true,acts:[{act:'home_shower',label:'Mandi'}]},
  {id:'wc',label:'WC',x:6,y:4,w:1,h:1,owned:true,acts:[{act:'home_toilet',label:'Buang Air'}]},
  {id:'wardrobe',label:'Lemari',x:0,y:4,w:1,h:1,owned:has('wardrobe'),acts:[{act:'store_home',label:'Simpan Barang',item:'inventory'},{act:'take_home',label:'Ambil Barang',item:'homeStorage'}]},
  {id:'chair',label:'Kursi',x:3,y:2,w:1,h:1,owned:has('chair'),acts:[{mock:true,label:'Duduk Santai'}]}];
}
let indoor=null;   // {x,y}
const GATE_KIND={bed:'bed',stove:'stove',bath:'bathroom'};
// Baymax: SemestaLifePlay.setInteriorFurnitureAdapter(fn) → furniture in world space for the nearbyActions/runAction gates.
// The placeholder room reports only the furniture the room marker stands next to, at the player's world position.
function roomAdapter(){
 if(!indoor)return [];const near=nearSpot(furnitureSpots(st()));if(!near||!near.owned||!GATE_KIND[near.id])return [];
 const p=N.playerPos()||{x:0,z:0};
 return [{id:'njh-room-'+near.id,kind:GATE_KIND[near.id],furnitureId:near.id==='bath'?'kamar_mandi':near.id,label:near.label,x:p.x,z:p.z,roomId:'njh-kost-placeholder',source:'interior'}];
}
function setAdapter(on){const f=real(L,'setInteriorFurnitureAdapter');if(f){try{f(on?roomAdapter:null);}catch{}}else fired('setInteriorFurnitureAdapter');}
function indoorOff(){if(indoor){indoor=null;document.body.classList.remove('njh-indoor');setAdapter(false);}}
function openKost(d){
 const s=st();
 if(!s.housing?.room){
  const w=win('njhKost','Kost.exe','<div class="njh-shophead"><b>Kost</b>'+PH+'</div><p>Kamu belum punya kamar. Sewa sekali bayar <b>'+rp(price('roomPrice'))+'</b> (aksi game asli).</p><div class="w98-well micro" id="njhKostMsg">Dompet '+rp(s.wallet)+'</div><div class="njh-row"><button class="btn" data-close type="button">Nanti</button><button class="btn primary" type="button" id="njhKostRent">Sewa Kamar</button></div>',{layer:'hud',cls:'njh-small'});
  w.querySelector('#njhKostRent').onclick=()=>{const r=runReal('buy_room',{});$('njhKostMsg').textContent=resultText(r);if(r.ok)setTimeout(()=>openKost(d),700);};
  return;
 }
 indoor={x:ROOM.door.x,y:ROOM.door.y};document.body.classList.add('njh-indoor');setAdapter(true);
 win('njhKost','Kost.exe · Kamar','<div class="njh-shophead"><b>Kamar Kost</b>'+PH+'</div><div class="njh-room" id="njhRoom" tabindex="0" aria-label="Kamar kost"></div><div class="njh-roomacts" id="njhRoomActs"></div>'+
  '<p class="micro">Posisi furnitur contoh. Jalan: '+(N.coarse()?'ketuk lantai':'panah / WASD atau klik lantai')+'. Aksi muncul kalau dekat furnitur.</p><div class="njh-row"><button class="btn" type="button" data-close id="njhKostExit">Keluar</button></div>',{layer:'hud',cls:'njh-kostwin'});
 $('njhKostExit').addEventListener('click',indoorOff);
 $('njhKost').querySelector('.w98-title [data-close]').addEventListener('click',indoorOff);
 paintRoom();setTimeout(()=>$('njhRoom')?.focus(),0);
}
function nearSpot(spots){return spots.find(f=>indoor.x>=f.x-1&&indoor.x<=f.x+f.w&&indoor.y>=f.y-1&&indoor.y<=f.y+f.h);}
function paintRoom(msg){
 const r=$('njhRoom');if(!r||!indoor)return;const s=st();const spots=furnitureSpots(s);
 let html='';
 for(let y=0;y<ROOM.h;y++)for(let x=0;x<ROOM.w;x++){
  const f=spots.find(f=>x>=f.x&&x<f.x+f.w&&y>=f.y&&y<f.y+f.h);
  html+='<i class="t'+(y===0?' wall':'')+((x+y)%2?' a':'')+(x===ROOM.door.x&&y===ROOM.door.y?' door':'')+'" data-x="'+x+'" data-y="'+y+'"></i>';
 }
 html+=spots.map(f=>'<b class="f'+(f.owned?'':' missing')+'" style="--x:'+f.x+';--y:'+f.y+';--w:'+f.w+';--h:'+f.h+'">'+esc(f.label)+'</b>').join('');
 html+='<em class="njh-me" style="--x:'+indoor.x+';--y:'+indoor.y+'" title="Kamu (placeholder)"></em>';
 r.innerHTML=html;
 const near=nearSpot(spots);const box=$('njhRoomActs');
 if(!near){box.innerHTML='<span class="micro">Dekati furnitur: '+spots.map(f=>f.label).join(', ')+'.</span>';return;}
 if(!near.owned){const price=furnPrice(near.id);
  box.innerHTML='<b>'+esc(near.label)+'</b> belum punya. <button class="btn" type="button" data-room-buy="'+esc(near.id)+'">Beli '+rp(price)+'</button><div class="micro" id="njhRoomMsg">'+(msg||'')+'</div>';return;}
 let recipes='';try{recipes=[...(N.wdoc()?.querySelectorAll('#slpRecipe option')||[])].map(o=>'<option value="'+esc(o.value)+'">'+esc(o.textContent)+'</option>').join('');}catch{}
 const na=real(L,'nearbyActions');let list=null;if(na){try{list=na()||[];}catch{list=null;}}else fired('nearbyActions');
 const entry=a=>list?list.find(x=>x.id===a.act||x.action===a.act):null;
 box.innerHTML='<b>'+esc(near.label)+':</b> '+near.acts.map((a,i)=>{const en=a.mock?null:entry(a);const gated=!!list?.length&&!a.mock&&!en;
  if(en&&en.price)a.price=en.price;a._args=en?.args||null;a._gated=gated;return a;}).map((a,i)=>'<span class="njh-shoprow">'+
   (a.item?itemSelect('njhRoomItem'+i,s[a.item]||[],s.itemMeta):'')+(a.recipe?'<select id="njhRoomRecipe'+i+'">'+(recipes||'<option value="">(belum ada resep)</option>')+'</select>':'')+
   '<button class="btn" type="button" data-room-act="'+i+'"'+(a._gated?' disabled title="Belum tersedia di sini (gate furnitur game)"':'')+'>'+esc(a.label)+(a.price?' <small>'+rp(a.price)+'</small>':'')+(a.mock?' '+SIM:'')+'</button></span>').join('')+'<div class="micro" id="njhRoomMsg">'+(msg||'')+'</div>';
 box.onclick=e=>{
  const b=e.target.closest('[data-room-act]'),buy=e.target.closest('[data-room-buy]');
  if(buy){const id=buy.dataset.roomBuy;const res=id==='fridge'?runReal('buy_fridge',{}):runReal('buy_furniture',{itemId:id});paintRoom(resultText(res));return;}
  if(!b)return;const i=Number(b.dataset.roomAct),a=near.acts[i];
  if(a.mock){paintRoom('Kamu duduk santai sebentar. (SIMULASI)');return;}
  const args={...(a._args||{})};if(a.item)args.itemId=$('njhRoomItem'+i)?.value||'';if(a.recipe)args.activityId=$('njhRoomRecipe'+i)?.value||'';
  paintRoom(resultText(runReal(a.act,args)));
 };
}
function roomMove(dx,dy){if(!indoor)return;const spots=furnitureSpots(st());const nx=Math.max(0,Math.min(ROOM.w-1,indoor.x+dx)),ny=Math.max(1,Math.min(ROOM.h-1,indoor.y+dy));
 if(spots.some(f=>nx>=f.x&&nx<f.x+f.w&&ny>=f.y&&ny<f.y+f.h))return;indoor={x:nx,y:ny};paintRoom();}
document.addEventListener('keydown',e=>{
 if(!indoor||$('njhKost')?.hidden)return;if(/INPUT|SELECT/.test(e.target.tagName))return;
 const k=e.key.toLowerCase();const d={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]}[k];
 if(d){e.preventDefault();e.stopPropagation();roomMove(d[0],d[1]);}
},true);
document.addEventListener('click',e=>{
 const t=e.target.closest('#njhRoom i.t');if(!t||!indoor)return;
 const tx=+t.dataset.x,ty=+t.dataset.y;let guard=20;
 while(guard--&&(indoor.x!==tx||indoor.y!==ty)){const ox=indoor.x,oy=indoor.y;roomMove(Math.sign(tx-indoor.x),0);if(indoor.x===ox)roomMove(0,Math.sign(ty-indoor.y));if(indoor.x===ox&&indoor.y===oy)break;}
});

/* ================= save slots ================= */
// Real: SemestaLifePlay.saveSlot(slot)/loadSlot(slot)/listSlots()/saveMeta(slot?)/hasSave(slot?) (key semesta-life-slots-v1:…).
// Mock (same names/shapes) only when those are missing: njh98:mock:slots@player.
const SLOT_IDS=['slot1','slot2','slot3'];
const LIFE_PREFIX='semesta-life-play-v1:';
function lifeKey(){
 const id=pid();let keys=[];try{keys=Object.keys(localStorage).filter(k=>k.startsWith(LIFE_PREFIX)&&(id?k.endsWith('@'+id):!k.includes('@')));}catch{}
 const w=st().wallet;return keys.find(k=>{try{return JSON.parse(localStorage.getItem(k)).state.wallet===w;}catch{return false;}})||keys[0]||'';
}
const mockSlots={
 all(){return ls.get(pk('slots2'),{});},
 listSlots(){fired('listSlots');const a=this.all();return SLOT_IDS.filter(id=>a[id]).map(id=>a[id].meta);},
 saveMeta(slot){fired('saveMeta');if(slot)return this.all()[slot]?.meta||null;
  // no argument = the automatic life save (same as Baymax)
  let raw=null;try{raw=JSON.parse(localStorage.getItem(lifeKey())||'null');}catch{}const s=raw?.state;
  return s?{slot:'auto',savedAt:null,day:dayNow(),minute:null,label:'',weekday:'',wallet:s.wallet,elapsedMinutes:s.elapsedMinutes}:null;},
 hasSave(slot){fired('hasSave');if(slot)return !!this.all()[slot];let auto=false;try{auto=!!localStorage.getItem(lifeKey());}catch{}return auto||SLOT_IDS.some(id=>this.all()[id]);},
 saveSlot(slot){fired('saveSlot');const s=st();if(!Number.isFinite(Number(s.wallet)))return {ok:false,slot,reason:'Game belum siap.'};
  const key=lifeKey();let cityId='';try{cityId=JSON.parse(localStorage.getItem(key)||'{}').cityId||'';}catch{}
  const meta={slot,savedAt:new Date().toISOString(),day:dayNow(),minute:null,label:$('njhTime')?.textContent||'',weekday:'',wallet:s.wallet,elapsedMinutes:s.elapsedMinutes};
  const a=this.all();a[slot]={meta,key,cityId,state:JSON.parse(JSON.stringify(s))};ls.set(pk('slots2'),a);return {ok:true,slot,meta};},
 loadSlot(slot){fired('loadSlot');const sl=this.all()[slot];if(!sl?.key||!sl.state)return {ok:false,slot,reason:'Slot kosong.'};
  try{L()?.stop?.();}catch{}
  try{localStorage.setItem(sl.key,JSON.stringify({schema:1,cityId:sl.cityId,state:sl.state}));}catch{return {ok:false,slot,reason:'Gagal menulis simpanan.'};}
  return {ok:true,slot,meta:sl.meta,reload:true};}
};
const slotApi=name=>hook(name)||mockSlots[name].bind(mockSlots);
const slotNames=()=>ls.get(pk('slotNames'),{});
function slotLine(m){return m?'<b>'+esc(slotNames()[m.slot]||N.profile()?.name||'Pemain')+'</b> · Hari '+(m.day??'?')+' · '+rp(m.wallet)+' · <small>'+(m.label?esc(m.label)+' · ':'')+new Date(m.savedAt||Date.now()).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})+'</small>':'<i>— kosong —</i>';}
function openSlots(mode){
 const mock=!hook('listSlots');let list=[];try{list=slotApi('listSlots')()||[];}catch{}
 const by=Object.fromEntries(list.map(m=>[m.slot,m]));
 const html='<p class="micro">'+(mode==='save'?'Pilih slot untuk menyimpan progres sekarang.':'Pilih slot untuk dimuat.')+(mock?' '+SIM:' Simpanan game asli.')+'</p><ol class="njh-slotlist">'+
  SLOT_IDS.map((id,i)=>'<li><span>Slot '+(i+1)+'</span><div>'+slotLine(by[id])+'</div><button class="btn" type="button" data-slot="'+id+'"'+(mode==='load'&&!by[id]?' disabled':'')+'>'+(mode==='save'?'Simpan':'Muat')+'</button></li>').join('')+'</ol>'+
  '<div class="w98-well micro" id="njhSlotMsg">'+(mode==='save'?'Auto-save tetap jalan terus.':'')+'</div><div class="njh-row"><button class="btn primary" type="button" data-close>Tutup</button></div>';
 const w=win('njhSlots',mode==='save'?'Simpan Permainan':'Muat Permainan',html,{cls:'njh-slotwin'});
 w.onclick=e=>{const b=e.target.closest('[data-slot]');if(!b)return;const id=b.dataset.slot;
  if(mode==='save'){const r=slotApi('saveSlot')(id);if(r?.ok){const n=slotNames();n[id]=N.profile()?.name||'Pemain';ls.set(pk('slotNames'),n);}openSlots('save');if(!r?.ok)$('njhSlotMsg').textContent='✗ '+(r?.reason||'Gagal');}
  else confirmBox('Muat '+id.replace('slot','Slot '),'Progres sekarang yang belum disimpan akan diganti. Lanjut?','Muat',()=>loadSlot(id));};
}
function saveSlot(slot){return slotApi('saveSlot')(slot);}
function loadSlot(slot){
 const r=slotApi('loadSlot')(slot);
 if(!r?.ok){say('Gagal muat: '+(r?.reason||'?'));return r;}
 obs=null;dlgLayer.classList.remove('on');N.closeWindows();
 $('resumeGame')?.click();
 if(r.reload)setTimeout(()=>$('reloadWorld')?.click(),0);   // mock path: world re-reads the auto-save
 else setTimeout(()=>N.toast('Dimuat: '+slot.replace('slot','Slot ')),300);
 return r;
}

/* ================= settings / credits / menu ================= */
function openSettings(){
 const v=settings();
 const html='<fieldset class="njh-group"><legend>Suara</legend><label class="njh-check1"><input type="checkbox" id="njhSetSound"'+(v.sound?' checked':'')+'> Bunyi klik tombol</label></fieldset>'+
  '<fieldset class="njh-group"><legend>Bahasa</legend><select id="njhSetLang"><option value="id"'+(v.lang==='id'?' selected':'')+'>Bahasa Indonesia</option><option value="en"'+(v.lang==='en'?' selected':'')+'>English (menu &amp; HUD)</option></select></fieldset>'+
  '<fieldset class="njh-group"><legend>Ukuran UI</legend><div class="njh-radios">'+[90,100,115,130].map(n=>'<label><input type="radio" name="njhScale" value="'+n+'"'+(v.scale===n?' checked':'')+'> '+n+'%</label>').join('')+'</div></fieldset>'+
  '<p class="micro">Disimpan di perangkat ini (njh98:settings).</p><div class="njh-row"><button class="btn" type="button" data-close>Batal</button><button class="btn primary" type="button" id="njhSetOk">OK</button></div>';
 const w=win('njhSettings','Pengaturan',html,{cls:'njh-small'});
 w.querySelector('#njhSetOk').onclick=()=>{saveSettings({sound:$('njhSetSound').checked,lang:$('njhSetLang').value,scale:Number(w.querySelector('[name=njhScale]:checked')?.value||100)});w.hidden=true;dlgLayer.classList.remove('on');};
}
function openCredits(){
 win('njhCredits','Kredit','<div class="njh-credits"><b class="njh-cr-title">NAMANYA JUGA HIDUP</b><em>the Game</em><p>dibuat oleh <b>Lafrich</b></p><table>'+
  [['Produser &amp; desain','Ichsan'],['Logic &amp; engine Semesta','Baymax'],['UI Win98 / Y2K','Layar'],['Animasi karakter','Gerak'],['Aset pixel','Tim Lafrich (LFB / LGR)']].map(([a,b])=>'<tr><th>'+a+'</th><td>'+b+'</td></tr>').join('')+
  '</table><p class="micro">Tanpa aset berhak cipta pihak lain. © Lafrich 2026.</p></div><div class="njh-row"><button class="btn primary" type="button" data-close>OK</button></div>',{cls:'njh-small'});
}
function lastSession(){return ls.get('last',null);}
function paintContinue(){
 const b=document.querySelector('[data-njh-placeholder=lanjutkan]');if(!b)return;const l=lastSession();
 let sm=b.querySelector('.njh-last');if(!sm){sm=document.createElement('small');sm.className='njh-last';b.querySelector('span')?.after(sm);}
 sm.textContent=l?(l.name+' · Hari '+l.day):'';
}
function doContinue(){
 const l=lastSession();
 if(!l){say('Belum ada simpanan di perangkat ini. Pilih Mulai Main dulu.');return;}
 if(l.guest){$('welcomeGuest')?.click();return;}
 $('welcomeContinue')?.click();
 setTimeout(()=>{const e=$('email');if(e){e.value=l.id;e.dispatchEvent(new Event('input',{bubbles:true}));$('password')?.focus();}},50);
}
function doNewGame(){
 confirmBox('Mulai Baru','Ini menghapus <b>data simulasi</b> (njh98:mock:*), status tutorial, dan <b>karakter lokal</b> di perangkat ini, lalu kamu bikin karakter lagi. Progres hidup di kota (uang/kost) tidak dihapus.','Ya, mulai baru',()=>{
  ls.clear();try{localStorage.removeItem('njh98:tutorial-done');Object.keys(localStorage).filter(k=>k.startsWith('mainkan-character-v1')).forEach(k=>localStorage.removeItem(k));}catch{}
  paintContinue();$('welcomeContinue')?.click();
 });
}
const ACTIONS={lanjutkan:doContinue,'mulai-baru':doNewGame,pengaturan:openSettings,kredit:openCredits,simpan:()=>openSlots('save'),muat:()=>openSlots('load'),'laporan-hari':()=>openReport(dayNow(),false)};
document.querySelectorAll('[data-njh-placeholder]').forEach(b=>{
 const fn=ACTIONS[b.dataset.njhPlaceholder];if(!fn)return;
 b.disabled=false;b.removeAttribute('aria-disabled');
 const tag=b.querySelector('.njh-soon');if(tag){tag.className='njh-sim';tag.textContent='SIMULASI';}
 b.title='Placeholder jalan (data simulasi)';b.addEventListener('click',fn);
});


/* ================= body actions: Pipis di Tembok (wall_pee) + Kentut (fart) =================
   Options INSIDE the one Action menu (no own button). Same shape as Baymax's plan:
   wall_pee: only when bladder >= 65 AND near/facing a wall or building → Buang Air -70, Kebersihan -5, Moral -5.
   fart: always offered, ~60 s play-time cooldown; Moral -3 only if an NPC/other player is within ~2 tiles, 0 alone.
   Real wins: if SemestaLifePlay.nearbyActions() lists the id, Baymax's panel shows it and the mock hides it.
   Mock effects are SIMULASI only (njh98:mock:body@<pemain>) and never change the real status. */
const BODY={peeNeed:65,wallDist:1.6,doorDist:3,npcDist:2,fartCd:60};
let playSec=0,fartAt=-1e9;
const WALLISH=/wall|tembok|pagar|fence|building|bangunan|house|rumah|shop|toko|warung|kost|gedung|ruko/i;
function realIds(){const f=hook('nearbyActions');if(!f)return new Set();try{return new Set((f()||[]).map(a=>String(a.id||a.action)));}catch{return new Set();}}
function directory(){try{return S()?.worldDirectory?.()||[];}catch{return [];}}
function nearWall(me){
 const f=hook('nearWall');if(f){try{return !!f();}catch{}}fired('nearWall');
 for(const o of directory()){if(!Number.isFinite(o?.x))continue;const k=[o.type,o.kind,o.category,o.id,o.name].join(' ');if(!WALLISH.test(k)||/npc/i.test(String(o.type||'')))continue;
  if(Math.hypot(o.x-me.x,(o.z||0)-me.z)<=(o.enterable?BODY.doorDist:BODY.wallDist))return true;}
 try{return N.doorList().some(d=>Math.hypot(d.x-me.x,d.z-me.z)<=BODY.doorDist);}catch{return false;}
}
function npcNear(me){return directory().some(o=>Number.isFinite(o?.x)&&/npc|player|orang/i.test(String(o.type||o.kind||''))&&Math.hypot(o.x-me.x,(o.z||0)-me.z)<=BODY.npcDist);}
function bodyRec(){return ls.get(pk('body'),{bladder:0,hygiene:0,moral:0,at:0});}
function bladderNow(s){const r=bodyRec();const fresh=Date.now()-(r.at||0)<10*60*1000;return Math.max(0,(Number(s.bladder)||0)+(fresh?r.bladder:0));}
function bodyActions(){
 if(!playing())return [];const me=N.playerPos();const s=st();const real=realIds();const out=[];
 if(!real.has('wall_pee')&&me&&bladderNow(s)>=BODY.peeNeed&&nearWall(me))out.push({id:'wall_pee',label:'Pipis di Tembok',mock:true,contextual:true});
 if(!real.has('fart')){const left=Math.ceil(BODY.fartCd-(playSec-fartAt));
  out.push(left>0?{id:'fart',label:'Kentut',mock:true,disabled:true,hint:'tunggu '+left+' dtk'}:{id:'fart',label:'Kentut',mock:true});}
 if(out.length)fired('bodyActions');return out;
}
function runBody(id){
 const r=bodyRec();const me=N.playerPos();const fresh=Date.now()-(r.at||0)<10*60*1000;if(!fresh){r.bladder=0;r.hygiene=0;r.moral=0;}
 if(id==='wall_pee'){r.bladder-=70;r.hygiene-=5;r.moral-=5;r.at=Date.now();ls.set(pk('body'),r);
  return 'Pipis di tembok… lega. Buang Air −70 · Kebersihan −5 · Moral −5 (SIMULASI)';}
 if(id==='fart'){if(playSec-fartAt<BODY.fartCd)return 'Belum bisa kentut lagi. (SIMULASI)';
  const seen=!!me&&npcNear(me);fartAt=playSec;if(seen){r.moral-=3;r.at=Date.now();}ls.set(pk('body'),r);
  return seen?'Prrt… ada yang dengar. Moral −3 (SIMULASI)':'Prrt… aman, nggak ada yang dengar. (SIMULASI)';}
 return '';
}
/* ================= tick (500 ms while playing) ================= */
let t=0;
function tick(s){
 if(!s||!Number.isFinite(Number(s.wallet)))return;
 t++;observe(s);if(document.getElementById('pauseScreen')?.hidden!==false)playSec+=0.5;
 if(t%4===0)ls.set('last',{id:pid(),guest:!pid(),name:N.profile()?.name||'Pemain',day:dayNow(),wallet:s.wallet,at:Date.now()});
 if(!$('njhStatusWin')?.hidden&&t%2===0)N.paintStatus();
 if(!$('njhNokiaPlus')?.hidden&&nokiaTab!=='pesan'&&t%6===0)paintNokiaPlus();
 if(indoor&&!$('njhKost')?.hidden&&t%4===0&&!document.activeElement?.closest('#njhRoomActs'))paintRoom($('njhRoomMsg')?.textContent);
 if(indoor&&$('njhKost')?.hidden)indoorOff();
}
(function mapLoop(){paintMap();requestAnimationFrame(mapLoop);})();
applySettings();paintContinue();
new MutationObserver(()=>{if(!$('welcomeScreen')?.hidden)paintContinue();applySettings();}).observe($('welcomeScreen')||document.body,{attributes:true,attributeFilter:['hidden']});

window.NJH98Mock=Object.freeze({
 // UI-facing mock API (njh98:mock:*). Each one prefers the real hook named in NJH98-UI.md.
 questState,openQuest,statusHTML,enterDoor,openMap,onModal,tick,openReport,openSlots,openSettings,openCredits,
 bodyActions,runBody,
 saveSlot,loadSlot,listSlots:()=>slotApi('listSlots')(),saveMeta:slot=>slotApi('saveMeta')(slot),hasSave:slot=>slotApi('hasSave')(slot),mockFired:()=>[...mockFired].sort(),jobs,skills,reputation,housing,level,furnitureSpots,mockWallet:mwallet,inbox,
 // test helper: close the current day now (screenshots / QA only)
 endDay:()=>{const d=dayNow();const days=ls.get(pk('days'),{});if(days[d]){days[d].closed=true;ls.set(pk('days'),days);}openReport(d,true);}
});
})();

/* Ellen.exe — project knowledge chat, explicit training, and Google Drive sync.
 * No API keys, access tokens or GitHub credentials are persisted in browser/Drive.
 * This client works in limited knowledge-retrieval mode until a private AI worker is configured.
 */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const STORE="ellen-local-memory-v1",ENDPOINT="ellen-worker-endpoint-v1";
const CLIENT_ID="369223065433-idbuhhj6akuf2cmo6vpbiblkhu019csn.apps.googleusercontent.com";
const SCOPE="openid email https://www.googleapis.com/auth/drive.file";
const API="https://www.googleapis.com/drive/v3/files",UPLOAD="https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_TYPE="application/vnd.google-apps.folder";
const REMOTE_NAME="ellen-memory-v1.json",FORMAT="ellen-memory-v1";
const REPOS=["lafrich/virtual-office","lafrich/virtual-life-asset-pipeline"];
let seed=[],data={format:FORMAT,facts:[],messages:[]},busy=false,token="",expires=0,folderId="",remote=null;
let syncQueue=Promise.resolve(),didIntro=false;
const stopWords=new Set("yang dengan untuk dari pada ada ini itu dan atau bisa aku kamu saya di ke nya dalam apa gimana jadi harus emang nih dong lagi tentang buat bikin si sebuah adalah kalau sama tadi tolong agar nggak ga gak gausah".split(" "));
const id=()=>typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID():"e-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
const stamp=()=>new Date().toISOString();
function status(message,error){$("status").textContent=message;if(error)$("status").style.color="#a12b26";else $("status").style.color="";}
function setMode(){let ai=!!getEndpoint()&&connected();$("mode").textContent=ai?"AI ONLINE":getEndpoint()?"AI WAITING LOGIN":"LOCAL KNOWLEDGE";$("connectDrive").textContent=connected()?"✓ DRIVE CONNECTED":"☁ CONNECT GOOGLE DRIVE";$("syncDrive").disabled=!connected();$("disconnectDrive").disabled=!connected();}
function getEndpoint(){try{return localStorage.getItem(ENDPOINT)||""}catch{return ""}}
function clean(input){return String(input||"").trim().slice(0,8000)}
function safeLocal(){try{localStorage.setItem(STORE,JSON.stringify(data))}catch(e){status("Storage lokal penuh. Export memory untuk backup.",true)}}
function validMemory(obj){return obj&&obj.format===FORMAT&&Array.isArray(obj.facts)&&Array.isArray(obj.messages)}
function restoreLocal(){try{const raw=JSON.parse(localStorage.getItem(STORE)||"null");if(validMemory(raw))data={format:FORMAT,facts:raw.facts.slice(-400),messages:raw.messages.slice(-500)}}catch(e){status("Local memory invalid; seed knowledge tetap aman.",true)}}
function mergeRecords(left,right,limit){
 const found=new Map();
 for(const x of [...left,...right]){
  if(!x||typeof x.id!=="string"||x.id.length>120)continue;
  const old=found.get(x.id);
  if(!old||String(x.updatedAt||x.at||"")>=String(old.updatedAt||old.at||""))found.set(x.id,x);
 }
 return [...found.values()].sort((a,b)=>String(a.updatedAt||a.at||"").localeCompare(String(b.updatedAt||b.at||""))).slice(-limit);
}
function mergeRemote(other){
 if(!validMemory(other))throw Error("Format Drive memory tidak dikenali");
 data.facts=mergeRecords(data.facts,other.facts,400);
 data.messages=mergeRecords(data.messages,other.messages,500);
 safeLocal();
 renderMessages();renderMemory();
}
function allFacts(){return [...data.facts.filter(x=>!x.deleted),...seed].filter(x=>x&&x.topic&&x.text)}
function renderMessages(){
 const area=$("chat"),prevBottom=area.scrollHeight-area.scrollTop-area.clientHeight<90;
 area.replaceChildren();
 const entries=data.messages.slice(-140);
 if(!entries.length){
  const intro=document.createElement("div");intro.className="message ellen";
  intro.textContent="Halo, aku Ellen. Aku mengenali arsitektur Semesta, Jiwa, Bangun Ruang, Emosi, Mahluk Hidup, V6B, dan Membangun dari project knowledge. Ajari aku lewat tab Teach; koneksikan Google Drive untuk memori lintas perangkat. Tanpa AI backend aku menjawab dengan pencarian knowledge, bukan model generatif.";
  area.appendChild(intro);
 }
 for(const msg of entries){
  if(!["user","ellen"].includes(msg.role)||typeof msg.text!=="string")continue;
  const row=document.createElement("article");row.className="message "+msg.role;
  const who=document.createElement("div");who.className="name";who.textContent=msg.role==="user"?"YOU":"ELLEN · "+(msg.engine||"LOCAL");
  const body=document.createElement("div");body.className="body";body.textContent=msg.text.slice(0,12000);
  const t=document.createElement("div");t.className="time";t.textContent=new Date(msg.at||Date.now()).toLocaleString("id-ID");
  row.append(who,body,t);area.appendChild(row);
 }
 if(prevBottom)area.scrollTop=area.scrollHeight;
}
function renderMemory(){
 const filter=$("memorySearch").value.trim().toLowerCase();
 const facts=allFacts().filter(f=>(f.topic+" "+f.text).toLowerCase().includes(filter));
 $("memoryCount").textContent=data.facts.filter(x=>!x.deleted).length+" taught · "+seed.length+" project basics";
 const list=$("memoryList");list.replaceChildren();
 for(const f of facts.slice(0,220)){
  const node=document.createElement("section");node.className="fact";
  const head=document.createElement("strong");head.textContent=f.topic;
  const para=document.createElement("p");para.textContent=f.text;
  const note=document.createElement("div");note.className="note";note.textContent=f.source==="owner-teach"?"OWNER-TAUGHT · "+new Date(f.updatedAt).toLocaleString("id-ID"):"PROJECT SEED · read-only";
  if(f.source==="owner-teach"){
   const btn=document.createElement("button");btn.type="button";btn.textContent="DELETE";btn.title="Hapus memori ini dari sinkronisasi berikutnya";
   btn.addEventListener("click",()=>{if(!confirm("Hapus pengetahuan ini dari memory Ellen?"))return;f.deleted=true;f.updatedAt=stamp();safeLocal();renderMemory();queueSync();});
   node.appendChild(btn);
  }
  node.append(head,para,note);list.appendChild(node);
 }
 if(!facts.length){const empty=document.createElement("p");empty.textContent="Tidak ada knowledge yang cocok.";list.appendChild(empty)}
}
function addMessage(role,text,engine){data.messages.push({id:id(),role,text:clean(text).slice(0,12000),engine:engine||"LOCAL",at:stamp()});data.messages=data.messages.slice(-500);safeLocal();renderMessages();queueSync()}
function tokens(text){return [...new Set(clean(text).toLowerCase().split(/[^a-z0-9]+/g).filter(s=>s.length>2&&!stopWords.has(s)))];}
function retrieve(question){
 const terms=tokens(question);
 return allFacts().map(f=>{
  const title=f.topic.toLowerCase(),body=f.text.toLowerCase();
  let score=0;
  for(const term of terms){if(title.includes(term))score+=4;if(body.includes(term))score+=1}
  if(f.source==="owner-teach")score*=1.6;
  return {fact:f,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.fact);
}
function localAnswer(query){
 const relevant=retrieve(query);
 if(!relevant.length)return "Aku belum menemukan jawaban yang terverifikasi di memory proyek. Buka TEACH untuk menambahkan aturan yang benar, atau hubungkan AI Engine agar aku bisa berdiskusi secara generatif. Aku tidak akan menebak status deploy atau mengklaim sudah mengubah GitHub.";
 return "Dari project knowledge yang aku punya:\n\n"+relevant.map((f,i)=>(i+1)+". "+f.topic+"\n"+f.text).join("\n\n")+"\n\nIni hasil pencarian memori, bukan audit GitHub terbaru. Kalau ada yang keliru, koreksi aku lewat TEACH.";
}
function connected(){return !!token&&Date.now()+60000<expires}
function bearer(){if(!connected())throw Error("Google session habis. Connect lagi.");return token}
async function driveRequest(url,options={}){
 const headers=new Headers(options.headers||{});headers.set("Authorization","Bearer "+bearer());
 const resp=await fetch(url,{...options,headers,cache:"no-store"});
 if(!resp.ok){if(resp.status===401)disconnect();let message="Google Drive HTTP "+resp.status;try{const info=await resp.json();message+=": "+(info.error?.message||"")}catch{}throw Error(message)}
 return resp;
}
function quote(s){return String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'")}
async function findFiles(parent,name){
 const q=new URLSearchParams({q:"'"+quote(parent)+"' in parents and name = '"+quote(name)+"' and trashed=false",
  fields:"files(id,name,mimeType,version,modifiedTime),nextPageToken",pageSize:"100"});
 return (await (await driveRequest(API+"?"+q)).json()).files||[];
}
async function ensureFolder(parent,name){
 const hit=(await findFiles(parent,name)).find(x=>x.mimeType===FOLDER_TYPE);
 if(hit)return hit.id;
 const created=await driveRequest(API+"?fields=id",{method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({name,mimeType:FOLDER_TYPE,parents:[parent]})});
 return (await created.json()).id;
}
async function getFolder(){
 if(folderId)return folderId;
 const root=await ensureFolder("root","Membangun");
 folderId=await ensureFolder(root,"Ellen");return folderId;
}
async function getRemoteInfo(){
 const files=await findFiles(await getFolder(),REMOTE_NAME);
 return files.find(x=>x.mimeType==="application/json")||null;
}
async function pull(){
 const info=await getRemoteInfo();remote=info;
 if(!info)return null;
 const loaded=await (await driveRequest(API+"/"+encodeURIComponent(info.id)+"?alt=media")).json();
 if(!validMemory(loaded))throw Error("Remote Ellen memory format mismatch; original tidak ditimpa");
 mergeRemote(loaded);return info;
}
async function push(){
 const fresh=await getRemoteInfo();
 if(fresh&&(!remote||fresh.id!==remote.id||String(fresh.version)!==String(remote.version))){
  // Another device has saved a change since our last read. Read and merge once.
  await pull();
 }
 const payload=JSON.stringify({...data,format:FORMAT,syncedAt:stamp()});
 const info=await getRemoteInfo();
 if(info){
  if(remote&&String(info.version)!==String(remote.version))throw Error("Konflik Drive: versi berubah saat menyimpan; sync ulang");
  const res=await driveRequest(UPLOAD+"/"+encodeURIComponent(info.id)+"?uploadType=media&fields=id,name,version,modifiedTime",
    {method:"PATCH",headers:{"Content-Type":"application/json"},body:payload});
  remote=await res.json();
 }else{
  const boundary="ellen_"+Math.random().toString(36).slice(2);
  const metadata=JSON.stringify({name:REMOTE_NAME,mimeType:"application/json",parents:[await getFolder()],appProperties:{app:"ellen",kind:"memory"}});
  const multipart="--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+metadata+
  "\r\n--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+payload+"\r\n--"+boundary+"--";
  const res=await driveRequest(UPLOAD+"?uploadType=multipart&fields=id,name,version,modifiedTime",
    {method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body:multipart});
  remote=await res.json();
 }
 $("driveStatus").textContent="DRIVE SYNCED · "+new Date().toLocaleString("id-ID")+" · "+data.facts.filter(x=>!x.deleted).length+" teachings, "+data.messages.length+" messages";
}
async function sync(){
 if(!connected())return;
 status("Drive: merge dan simpan memori…");
 await pull();await push();status("Memory tersinkron Google Drive");
}
function queueSync(){
 if(!connected())return;
 syncQueue=syncQueue.catch(()=>{}).then(sync).catch(e=>{status("Local saved; Drive: "+e.message,true);$("driveStatus").textContent="SYNC FAILED · "+e.message;});
}
function disconnect(){
 token="";expires=0;remote=null;folderId="";
 $("driveStatus").textContent="DRIVE DISCONNECTED · lokal tetap ada";setMode();
}
async function connect(){
 const oauth=window.google?.accounts?.oauth2;
 if(!oauth?.initTokenClient)throw Error("Google Sign-In belum siap. Buka dari HTTPS/browser yang mendukung Google OAuth.");
 const response=await new Promise((resolve,reject)=>{
  try{oauth.initTokenClient({client_id:CLIENT_ID,scope:SCOPE,include_granted_scopes:true,
    callback:x=>x?.access_token?resolve(x):reject(Error(x?.error_description||x?.error||"Login ditolak")),
    error_callback:x=>reject(Error(x?.message||x?.type||"Popup tertutup"))
   }).requestAccessToken({prompt:""});}
  catch(e){reject(e)}
 });
 token=response.access_token;expires=Date.now()+Number(response.expires_in||3500)*1000;folderId="";
 setMode();await sync();
 $("driveStatus").textContent="DRIVE CONNECTED · Membangun / Ellen / "+REMOTE_NAME;
}
function saveEndpoint(){
 const raw=$("endpoint").value.trim();
 if(!raw)throw Error("Isi alamat server AI terlebih dahulu");
 const url=new URL(raw);
 if(url.protocol!=="https:"||url.username||url.password||url.search||url.hash)throw Error("Endpoint harus HTTPS tanpa token/query/fragment");
 if(!/^\/chat\/?$/.test(url.pathname))throw Error("Endpoint harus berakhir /chat");
 localStorage.setItem(ENDPOINT,url.href);setMode();status("Endpoint disimpan. Connect Google Drive untuk mengaktifkan AI.");
}
async function answerAI(prompt){
 const endpoint=getEndpoint();
 if(!endpoint||!connected())return {text:localAnswer(prompt),engine:"LOCAL"};
 const facts=allFacts().map(f=>({topic:f.topic,text:f.text,source:f.source||"seed"})).slice(0,230);
 const history=data.messages.slice(-12).map(m=>({role:m.role==="user"?"user":"assistant",content:m.text.slice(0,4500)}));
 const res=await fetch(endpoint,{method:"POST",headers:{"Authorization":"Bearer "+bearer(),"Content-Type":"application/json"},
  body:JSON.stringify({message:prompt,history,knowledge:facts,repos:REPOS})});
 let json;try{json=await res.json()}catch{throw Error("AI backend tidak mengembalikan JSON")}
 if(!res.ok)throw Error(json?.error||"AI backend HTTP "+res.status);
 if(typeof json?.answer!=="string"||!json.answer.trim())throw Error("AI backend tidak mengirim jawaban");
 return {text:json.answer,engine:"AI"};
}
async function send(event){
 event.preventDefault();
 if(busy)return;
 const input=$("prompt"),question=clean(input.value).slice(0,5000);
 if(!question)return;
 busy=true;$("send").disabled=true;input.value="";addMessage("user",question,"OWNER");
 try{
  status("Ellen sedang menyusun jawaban…");
  const response=await answerAI(question);addMessage("ellen",response.text,response.engine);
  status(response.engine==="AI"?"Dijawab oleh AI privat · memori tersimpan":"Dijawab dari knowledge lokal · belum memakai model AI");
 }catch(err){addMessage("ellen","Backend belum bisa dipakai ("+err.message+"). Aku belum mengklaim tugas berhasil. Jawaban dari knowledge lokal:\n\n"+localAnswer(question),"LOCAL");status("AI backend error; fallback knowledge",true)}
 finally{busy=false;$("send").disabled=false;input.focus()}
}
function teach(event){
 event.preventDefault();
 const topic=clean($("topic").value).slice(0,140),text=clean($("lesson").value);
 if(!topic||!text)return;
 data.facts.push({id:id(),topic,text,source:"owner-teach",updatedAt:stamp()});
 data.facts=data.facts.slice(-400);safeLocal();renderMemory();queueSync();
 $("topic").value="";$("lesson").value="";status("Knowledge ditambahkan dan disimpan lokal; Drive sync jika terhubung");
 showTab("memory");
}
function showTab(name){
 document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
 document.querySelectorAll(".view").forEach(v=>v.hidden=v.id!=="view-"+name);
 if(name==="memory")renderMemory();
}
function exportData(){
 const blob=new Blob([JSON.stringify({...data,exportedAt:stamp()},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="ellen-memory-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),300);
}
async function init(){
 restoreLocal();
 try{const response=await fetch("./knowledge.json",{cache:"no-store"});if(!response.ok)throw Error(String(response.status));
  const obj=await response.json();seed=Array.isArray(obj.facts)?obj.facts:[];}
 catch(e){status("Seed knowledge belum terbaca: "+e.message,true)}
 document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
 $("chatForm").addEventListener("submit",send);$("teachForm").addEventListener("submit",teach);
 $("prompt").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("chatForm").requestSubmit()}});
 $("teachFromLast").addEventListener("click",()=>{
  const recent=[...data.messages].reverse().find(m=>m.role==="user");if(!recent){status("Belum ada pesan untuk dijadikan topik");return}
  $("topic").value=("Koreksi: "+recent.text.slice(0,125)).slice(0,140);
  $("lesson").focus();status("Tulis aturan yang benar di kolom lesson, lalu simpan");
 });
 $("memorySearch").addEventListener("input",renderMemory);$("refreshMemory").addEventListener("click",renderMemory);
 $("exportMemory").addEventListener("click",exportData);
 $("endpoint").value=getEndpoint();
 $("saveEndpoint").addEventListener("click",()=>{try{saveEndpoint()}catch(e){status(e.message,true)}});
 $("clearEndpoint").addEventListener("click",()=>{localStorage.removeItem(ENDPOINT);$("endpoint").value="";setMode();status("AI endpoint dihapus; local knowledge tetap tersedia")});
 $("connectDrive").addEventListener("click",async()=>{$("connectDrive").disabled=true;try{await connect()}catch(e){status("Drive: "+e.message,true);$("driveStatus").textContent="DRIVE ERROR · "+e.message}finally{$("connectDrive").disabled=false;setMode()}});
 $("syncDrive").addEventListener("click",()=>{syncQueue=syncQueue.catch(()=>{}).then(sync).catch(e=>{status(e.message,true);$("driveStatus").textContent="SYNC ERROR · "+e.message;})});
 $("disconnectDrive").addEventListener("click",disconnect);
 renderMessages();renderMemory();setMode();
 if(seed.length&&!data.messages.length)status("Ellen siap · "+seed.length+" project knowledge tersedia");
}
document.addEventListener("DOMContentLoaded",init);
})();
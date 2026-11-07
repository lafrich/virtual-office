/* Shared same-origin sync bus for Namanya Juga Hidup: The Game studios.
 * BroadcastChannel + storage stamp + storage-key fallback.
 * Data-only: never touches encrypted game assets, passwords, or accounts.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root&&root.document){
  if(!root.VLHub||root.VLHub._standalone){
   const inst=api.create(root);
   inst._standalone=false;
   root.VLHub=inst;
  }
 }
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const VERSION=1;
 const CHANNEL='virtual-life-hub-v1';
 const STAMP_KEY='virtual-life-hub-stamp-v1';
 const GAMEPLAY_KEY='virtual-life-gameplay-v1';
 const PROJECT_NAME='Namanya Juga Hidup: The Game';
 const TOPICS=Object.freeze(['world','rooms','objects','characters','accessories','emotions','gameplay','cityBuilding']);
 const KEY_TO_TOPIC=Object.freeze({
  'virtual-life-active-city-draft':'world',
  'virtual-life-city-building-update-v1':'cityBuilding',
  'virtual-life-bangun-ruang-v1':'rooms',
  'virtual-life-bangun-objects-v1':'objects',
  'virtual-life-character-storage-v1':'characters',
  'mahluk-2-library-v1':'characters',
  'virtual-life-accessory-equipment-v1':'accessories',
  'virtual-life-accessories-v1':'accessories',
  'emotion-studio-local-fallback-v1':'emotions',
  'emosi-convo-projects-v1':'emotions',
  'emosi-convo-mouth-guide-v1':'emotions',
  'jiwa-project-change':'gameplay',
  'virtual-life-gameplay-v1':'gameplay',
  'jiwa-sandbox-actor-v1':'characters'
 });
 const copy=o=>{try{return JSON.parse(JSON.stringify(o));}catch{return o;}};
 function summarize(payload){
  if(payload==null)return null;
  if(typeof payload!=='object')return String(payload).slice(0,80);
  const out={};
  for(const [k,v] of Object.entries(payload)){
   if(['png','document','views','atlas','frames','interior'].includes(k)){out[k]='[omitted]';continue;}
   if(typeof v==='string')out[k]=v.length>160?v.slice(0,80)+'…':v;
   else if(Array.isArray(v))out[k]={length:v.length};
   else if(v&&typeof v==='object')out[k]={keys:Object.keys(v).slice(0,8)};
   else out[k]=v;
  }
  return out;
 }

 function installMark(doc){
  doc=doc||(typeof document!=='undefined'?document:null);
  if(!doc||!doc.documentElement)return null;
  if(doc.getElementById('vl-lafrich-mark'))return doc.getElementById('vl-lafrich-mark');
  if(!doc.getElementById('vl-lafrich-mark-style')){
   const style=doc.createElement('style');
   style.id='vl-lafrich-mark-style';
   style.textContent='#vl-lafrich-mark{position:fixed;left:max(10px,env(safe-area-inset-left,0px));bottom:max(8px,env(safe-area-inset-bottom,0px));z-index:40;pointer-events:none;user-select:none;-webkit-user-select:none;opacity:.34;color:#2a3340;font:8px/1 "Courier New",Tahoma,monospace;letter-spacing:.06em;text-transform:none;text-shadow:0 1px 0 #fff6;white-space:nowrap}#vl-lafrich-mark span{opacity:.9}@media(max-width:760px){#vl-lafrich-mark{left:max(8px,env(safe-area-inset-left,0px));bottom:auto;top:max(10px,env(safe-area-inset-top,0px));opacity:.28;font-size:7px;z-index:30}}html.vl-play-hud-active #vl-lafrich-mark{bottom:auto;top:max(10px,env(safe-area-inset-top,0px));left:max(10px,env(safe-area-inset-left,0px));opacity:.28;z-index:20}';
   (doc.head||doc.documentElement).appendChild(style);
  }
  const el=doc.createElement('div');
  el.id='vl-lafrich-mark';
  el.setAttribute('aria-hidden','true');
  el.setAttribute('title','© Lafrich');
  el.textContent='by Lafrich';
  const mount=()=>{if(doc.body&&!doc.getElementById('vl-lafrich-mark'))doc.body.appendChild(el);};
  if(doc.body)mount();
  else if(doc.addEventListener)doc.addEventListener('DOMContentLoaded',mount);
  return el;
 }
 function create(env){
  const g=env||{};
  const listeners=new Map();
  const sourceId='hub-'+Math.random().toString(36).slice(2,10);
  let stamp={
   schema:'virtual-life-hub-v1',schemaVersion:VERSION,build:'hub-20261107-1',
   project:{name:PROJECT_NAME},sourceId,seq:0,lastTopic:null,topics:{}
  };
  let channel=null;
  function emit(msg){
   if(!msg||!msg.topic)return;
   const sets=[listeners.get(msg.topic),listeners.get('*')];
   for(const set of sets){
    if(!set)continue;
    for(const handler of set){
     try{handler(msg);}catch(err){if(g.console)g.console.warn('VLHub listener',err);}
    }
   }
  }
  function readStamp(){
   try{
    const raw=g.localStorage&&g.localStorage.getItem(STAMP_KEY);
    if(!raw)return stamp;
    const parsed=JSON.parse(raw);
    if(parsed&&parsed.schema==='virtual-life-hub-v1')return parsed;
   }catch{}
   return stamp;
  }
  function writeStamp(){
   try{if(g.localStorage)g.localStorage.setItem(STAMP_KEY,JSON.stringify(stamp));}catch{}
  }
  function publish(topic,payload){
   if(!TOPICS.includes(topic))return null;
   stamp=readStamp();
   stamp.seq=(Number(stamp.seq)||0)+1;
   stamp.sourceId=sourceId;
   stamp.project={name:PROJECT_NAME};
   stamp.lastTopic=topic;
   stamp.topics=stamp.topics||{};
   const summary=summarize(payload);
   stamp.topics[topic]={seq:stamp.seq,at:new Date().toISOString(),payload:summary};
   writeStamp();
   const msg={topic,payload:payload==null?null:payload,summary,seq:stamp.seq,
    at:stamp.topics[topic].at,sourceId,via:'local',project:PROJECT_NAME};
   emit(msg);
   if(channel){
    try{channel.postMessage({...msg,payload:summary,via:'broadcast'});}catch{}
   }
   if(g.dispatchEvent&&typeof g.CustomEvent==='function'){
    try{g.dispatchEvent(new g.CustomEvent('vl-hub',{detail:msg}));}catch{}
   }
   return msg;
  }
  function subscribe(topic,handler){
   if(typeof handler!=='function')return ()=>{};
   const list=Array.isArray(topic)?topic:(topic==='*'?['*']:[topic]);
   for(const t of list){
    if(t!=='*'&&!TOPICS.includes(t))continue;
    if(!listeners.has(t))listeners.set(t,new Set());
    listeners.get(t).add(handler);
   }
   return function unsubscribe(){
    for(const t of list){const set=listeners.get(t);if(set)set.delete(handler);}
   };
  }
  function attach(){
   if(typeof g.BroadcastChannel==='function'){
    try{
     channel=new g.BroadcastChannel(CHANNEL);
     channel.onmessage=ev=>{
      const data=ev&&ev.data;
      if(!data||data.sourceId===sourceId||!TOPICS.includes(data.topic))return;
      emit({...data,via:'broadcast'});
     };
    }catch{channel=null;}
   }
   if(typeof g.addEventListener==='function'){
    g.addEventListener('storage',ev=>{
     if(!ev||!ev.key)return;
     if(ev.key===STAMP_KEY){
      try{
       const next=JSON.parse(ev.newValue||'null');
       if(!next||next.sourceId===sourceId)return;
       stamp=next;
       const topic=next.lastTopic;
       if(TOPICS.includes(topic))
        emit({topic,payload:next.topics&&next.topics[topic],seq:next.seq,
         sourceId:next.sourceId,via:'storage-stamp',project:PROJECT_NAME});
      }catch{}
      return;
     }
     const topic=KEY_TO_TOPIC[ev.key];
     if(topic)emit({topic,payload:{key:ev.key},sourceId:'remote-storage',via:'storage-key',project:PROJECT_NAME});
    });
   }
  }
  attach();
  try{installMark(g.document);}catch{}
  return {
   VERSION,CHANNEL,STAMP_KEY,GAMEPLAY_KEY,TOPICS,KEY_TO_TOPIC,
   PROJECT_NAME,project:{name:PROJECT_NAME},
   sourceId,publish,subscribe,installMark,
   topicOfKey:key=>KEY_TO_TOPIC[key]||null,
   stamp:()=>copy(stamp),
   create
  };
 }
 return {VERSION,CHANNEL,STAMP_KEY,GAMEPLAY_KEY,TOPICS,KEY_TO_TOPIC,PROJECT_NAME,
  project:{name:PROJECT_NAME},create,installMark,_standalone:true};
});

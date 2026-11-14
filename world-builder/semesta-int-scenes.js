/* Modular Beraksi interaction-scene layer (preview).
 * Scene bodies live in the Beraksi lgr-db and win over any in-code copy.
 * This file only maps the 6 planned slot ids and offers them as
 * nearbyActions id "scene:<sceneId>". Tiny fallback if the DB is unreachable.
 * Do not upload placeholders to Drive from here.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SemestaIntScenes=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
'use strict';

const SLOTS=Object.freeze({
 njh_int_wc:  {context:'wc',  audience:'partner', label:'Adegan WC'},
 njh_int_bed: {context:'bed', audience:'partner', label:'Adegan Kasur'},
 njh_int_tree:{context:'tree',audience:'partner', label:'Adegan Pohon'},
 njh_int_room:{context:'room',audience:'partner', label:'Adegan Kamar'},
 njh_int_npc_f:{context:'npc',audience:'npc', gender:'female', label:'Adegan NPC (P)'},
 njh_int_npc_m:{context:'npc',audience:'npc', gender:'male', label:'Adegan NPC (L)'}
});

const FALLBACK=Object.freeze(Object.keys(SLOTS).reduce((m,id)=>{
 m[id]=Object.freeze({
  format:'lgr1-beraksi-v1',schema:1,id,name:SLOTS[id].label+' (fallback)',
  category:'njh_int',notes:'In-code fallback only. DB/scene always wins after sync.',
  rev:0,loop:false,durationMs:800,placeholder:true,fallback:true,
  context:SLOTS[id].context,audience:SLOTS[id].audience,
  actors:[
   {key:'a1',name:'Player',gender:'male',dir:'sw',flip:false,layer:0,x:-20,y:0,
    track:[{motion:'builtin:idle',ms:800}],emosi:[]},
   {key:'a2',name:SLOTS[id].audience==='npc'?'NPC':'Partner',
    gender:SLOTS[id].gender||'female',dir:'sw',flip:true,layer:1,x:20,y:0,
    track:[{motion:'builtin:idle',ms:800}],emosi:[]}
  ]
 });
 return m;
},{}));

const cache=new Map(); // id -> {entry, version, source}

function slotOf(id){return SLOTS[id]||null;}
function allSlots(){return Object.keys(SLOTS).map(id=>({id,...SLOTS[id]}));}

function ingest(entry,opts){
 if(!entry||!entry.id)return null;
 const id=String(entry.id);
 const rec={entry,version:entry.rev||entry.updated||entry.sha256||1,source:(opts&&opts.source)||'db',ingestedAt:Date.now()};
 cache.set(id,rec);
 return rec;
}

function load(id,opts){
 const slot=SLOTS[id];
 if(!slot)return null;
 if(opts&&opts.entry)ingest(opts.entry,{source:opts.source||'db'});
 const hit=cache.get(id);
 if(hit&&hit.entry)return {id,scene:hit.entry,source:hit.source,version:hit.version,slot};
 const db=opts&&opts.fromDb;
 if(typeof db==='function'){
  try{
   const row=db(id);
   if(row){ingest(row,{source:'db'});const h=cache.get(id);return {id,scene:h.entry,source:'db',version:h.version,slot};}
  }catch(_e){}
 }
 const fb=FALLBACK[id];
 return {id,scene:fb,source:'fallback',version:0,slot};
}

function canOffer(id,ctx){
 const slot=SLOTS[id];if(!slot)return false;
 ctx=ctx||{};
 if(slot.audience==='partner'&&!ctx.partnered)return false;
 if(slot.context==='npc'){
  if(!ctx.npcGender)return false;
  if(slot.gender&&ctx.npcGender!==slot.gender)return false;
  return true;
 }
 if(slot.context&&ctx.context&&slot.context!==ctx.context)return false;
 return true;
}

function nearbySceneActions(ctx){
 const out=[];
 for(const id of Object.keys(SLOTS)){
  if(!canOffer(id,ctx))continue;
  const loaded=load(id,ctx);
  out.push({id:'scene:'+id,action:'scene:'+id,label:SLOTS[id].label,price:0,
   args:{sceneId:id,source:loaded.source,version:loaded.version,context:SLOTS[id].context,audience:SLOTS[id].audience}});
 }
 return out;
}

function play(id,opts){
 const loaded=load(id,opts);
 if(!loaded||!loaded.scene)return {ok:false,reason:'Adegan tidak tersedia'};
 const scene=loaded.scene;
 const emit=(opts&&opts.emit)||((type,detail)=>{
  try{root?.dispatchEvent?.(new root.CustomEvent(type,{detail}));}catch(_e){}
  try{opts?.window?.dispatchEvent?.(new opts.window.CustomEvent(type,{detail}));}catch(_e){}
 });
 const duration=Number(scene.durationMs)||(scene.actors||[]).reduce((n,a)=>Math.max(n,(a.track||[]).reduce((m,t)=>m+(Number(t.ms)||0),0)),800);
 if(typeof (opts&&opts.pause)==='function')opts.pause();
 emit('mainkan:scene-start',{sceneId:id,source:loaded.source,version:loaded.version,duration,actors:scene.actors});
 const finish=()=>{
  emit('mainkan:scene-end',{sceneId:id,source:loaded.source,version:loaded.version});
  if(typeof (opts&&opts.resume)==='function')opts.resume();
 };
 if(opts&&opts.now===true)finish();
 else if(typeof (opts&&opts.timer)==='function')opts.timer(finish,duration);
 else if(typeof setTimeout==='function')setTimeout(finish,duration);
 return {ok:true,sceneId:id,source:loaded.source,version:loaded.version,duration,tracks:(scene.actors||[]).map(a=>a.track),scene};
}

return Object.freeze({SLOTS,FALLBACK,allSlots,slotOf,ingest,load,canOffer,nearbySceneActions,play,cache});
});

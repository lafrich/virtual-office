/* Mainkan.exe onboarding graph contract. No localStorage, no network, no editor dependencies. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.MainkanFlow=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const FORMAT='mainkan-flow-v1';
 const TYPES=Object.freeze(['splash','welcome','auth','character','confirm','loading','branch','tutorial','game','pause','message']);
 const ROUTES=Object.freeze({auth:['guest','new_player','returning'],branch:['first_time','returning','guest']});
 const clone=v=>JSON.parse(JSON.stringify(v));
 const node=(id,type,title,x,y,next='',extra={})=>Object.assign({id,type,title,x,y,next,enabled:true,skippable:false,showRule:'every_launch',showCount:1,duration:1200,description:''},extra);
 const defaultNodes=[
  node('splash','splash','Splash Screen',80,110,'welcome',{duration:1500,showCount:1,skippable:true}),
  node('welcome','welcome','Welcome',340,110,'auth'),
  node('auth','auth','Login / Register / Guest',600,110,'character',{routes:{guest:'character',new_player:'character',returning:'loading'}}),
  node('character','character','Character Creator',860,50,'confirm',{description:'Nickname, birthday, zodiac and old v6b appearance options'}),
  node('confirm','confirm','Confirm Character',1120,50,'loading'),
  node('loading','loading','Enter World',1380,50,'firstCheck',{duration:850}),
  node('firstCheck','branch','First-Time Check',1640,50,'game',{routes:{first_time:'tutorial',guest:'tutorial',returning:'game'}}),
  node('tutorial','tutorial','Intro Tutorial',1900,50,'game',{skippable:true}),
  node('game','game','Gameplay · Semesta',2170,50,'pause'),
  node('pause','pause','Pause Menu',2430,220,'game',{skippable:true})
 ];
 function preset(kind='default'){
  const graph={format:FORMAT,version:1,name:'Default Player Flow',start:'splash',nodes:clone(defaultNodes)};
  if(kind==='returning'){
   graph.name='Returning Player';
   graph.nodes.find(n=>n.id==='splash').showRule='once_per_session';
   graph.nodes.find(n=>n.id==='auth').routes.returning='loading';
  }else if(kind==='guest'){
   graph.name='Guest Preview';
   graph.nodes.find(n=>n.id==='auth').routes.guest='character';
  }else if(kind==='debug'){
   graph.name='Debug Fast Entry';
   graph.start='game';
  }
  return graph;
 }
 function check(input){
  const errors=[];
  if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,errors:['Flow must be an object']};
  if(input.format!==FORMAT)errors.push('Unsupported format (expected '+FORMAT+')');
  if(!Array.isArray(input.nodes)||!input.nodes.length||input.nodes.length>80)errors.push('Flow needs 1-80 nodes');
  const nodes=Array.isArray(input.nodes)?input.nodes.slice(0,81):[];
  const ids=new Set();
  for(const n of nodes){
   if(!n||typeof n!=='object'||Array.isArray(n)){errors.push('Invalid node');continue;}
   if(typeof n.id!=='string'||!/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/.test(n.id))errors.push('Invalid node ID');
   if(ids.has(n.id))errors.push('Duplicate ID: '+n.id);
   ids.add(n.id);
   if(!TYPES.includes(n.type))errors.push('Unsupported node type: '+n.id);
   if(typeof n.title!=='string'||!n.title.trim()||n.title.length>90)errors.push('Invalid title: '+n.id);
   if(n.x!==undefined&&(!Number.isFinite(n.x)||Math.abs(n.x)>20000))errors.push('Invalid X: '+n.id);
   if(n.y!==undefined&&(!Number.isFinite(n.y)||Math.abs(n.y)>20000))errors.push('Invalid Y: '+n.id);
   if(n.duration!==undefined&&(!Number.isFinite(n.duration)||n.duration<0||n.duration>15000))errors.push('Invalid duration: '+n.id);
   if(n.showCount!==undefined&&(!Number.isInteger(n.showCount)||n.showCount<1||n.showCount>5))errors.push('Invalid repeat count: '+n.id);
   if(n.showRule!==undefined&&!['every_launch','once_per_session','first_time_player'].includes(n.showRule))errors.push('Invalid show rule: '+n.id);
  }
  if(typeof input.start!=='string'||!ids.has(input.start))errors.push('Start node does not exist');
  for(const n of nodes){
   if(!n||typeof n!=='object')continue;
   if(n.next&&(!ids.has(n.next)||typeof n.next!=='string'))errors.push('Broken next link: '+n.id+' → '+n.next);
   if(n.routes!==undefined){
    if(!n.routes||typeof n.routes!=='object'||Array.isArray(n.routes))errors.push('Invalid routes: '+n.id);
    else for(const [label,target] of Object.entries(n.routes)){
     if(!['guest','new_player','returning','first_time','default'].includes(label))errors.push('Invalid branch label: '+n.id+'/'+label);
     if(typeof target!=='string'||!ids.has(target))errors.push('Broken branch: '+n.id+'/'+label+' → '+target);
    }
   }
  }
  return {ok:errors.length===0,errors};
 }
 function normalize(flow){
  const validated=check(flow);
  if(!validated.ok)throw Error(validated.errors.join('; '));
  return {
   format:FORMAT,version:1,name:String(flow.name||'Mainkan Flow').slice(0,100),start:flow.start,
   nodes:flow.nodes.map(n=>({
    id:n.id,type:n.type,title:n.title,
    x:Math.round(Number(n.x)||0),y:Math.round(Number(n.y)||0),
    next:n.next||'',routes:n.routes?Object.fromEntries(Object.entries(n.routes)):undefined,
    enabled:n.enabled!==false,skippable:n.skippable===true,
    showRule:n.showRule||'every_launch',showCount:n.showCount||1,duration:n.duration===undefined?1200:n.duration,
    description:String(n.description||'').slice(0,500)
   }))
  };
 }
 function next(graph,n,branch){
  const target=branch&&n.routes&&n.routes[branch];
  return target||n.next||'';
 }
 function get(graph,id){return graph.nodes.find(n=>n.id===id)||null;}
 return Object.freeze({FORMAT,TYPES,ROUTES,preset,check,normalize,next,get,clone});
});

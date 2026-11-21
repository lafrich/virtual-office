const fs=require('fs'),path=require('path'),vm=require('vm');
// Minimal browser-like sandbox that runs the real semesta-life-play.js + hooks + life-economy + balancing loader.
const R=path.join(__dirname,"..","..");
module.exports=function harness(opts={}){
 const B=require(R+'/shared/njh-balancing.js'),Life=require(R+'/jiwa/life-economy.js');
 const store=new Map();
 const ls={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const el=()=>{const e={hidden:false,style:{},dataset:{},innerHTML:'',textContent:'',children:[],classList:{add(){},remove(){},toggle(){}},
  querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},appendChild(c){return c;},setAttribute(){},remove(){},append(){},blur(){}};return e;};
 const document={createElement:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:el(),head:el(),addEventListener(){}};
 const win={console,localStorage:ls,document,JiwaLifeEconomy:Life,NJHBalancing:B,location:{href:'http://x/world-builder/index.html'},
  requestAnimationFrame:()=>0,cancelAnimationFrame(){},performance:{now:()=>Date.now()},addEventListener(){},dispatchEvent(){},CustomEvent:function(t,d){this.type=t;this.detail=d&&d.detail;},
  fetch:()=>Promise.reject(new Error('offline')),setTimeout,clearTimeout,URL};
 win.window=win;win.globalThis=win;win.self=win;
 const ctx=vm.createContext(win);
 vm.runInContext(fs.readFileSync(R+'/world-builder/semesta-life-hooks.js','utf8'),ctx);
 vm.runInContext(fs.readFileSync(R+'/world-builder/semesta-life-play.js','utf8'),ctx);
 const P=win.SemestaLifePlay;
 let pos={x:0,z:0},clock={minute:390,day:1,speed:1,paused:false};
 const objects=opts.objects||[{id:'tenda_hobo_1',name:'Tenda Hobo',type:'prop',asset:'hobo_tent',x:0,z:0}];
 const bridge={getWorld:()=>({objects,map:{}}),getPosition:()=>pos,getCityId:()=>'test_city',getPlayerId:()=>'',
  getClock:()=>({snapshot:()=>({...clock}),restore:c=>{clock={...clock,...c};}}),playPose(){},currentPose:()=>'idle',respawn(){},syncHud(){},teleport(){return true;}};
 P.attach(bridge);
 return {P,win,Life,B,setPos:p=>{pos=p;},clock:()=>clock,store};
};

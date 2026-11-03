/* Semesta · Harvest Moon-inspired 24-hour clock and solar lighting model.
 * Pure data logic; no dependencies on DOM, timers or Three.js.
 * At 1×, 1 real second = 1 in-game minute (24 real minutes/day).
 */
(function(g){
'use strict';
const MINUTES=1440,DEFAULT_MINUTE=7*60,DAY_REAL_SECONDS=24*60;
const WEEK=['SEN','SEL','RAB','KAM','JUM','SAB','MIN'];
const stops=[
 {t:0,night:.78,glow:1,cast:.025,contact:.22,rgb:[11,27,56],sky:'#1a304c'},
 {t:300,night:.71,glow:.95,cast:.05,contact:.20,rgb:[28,38,67],sky:'#304969'},
 {t:360,night:.33,glow:.52,cast:.28,contact:.22,rgb:[95,68,71],sky:'#94a1a0'},
 {t:420,night:.11,glow:0,cast:.35,contact:.25,rgb:[162,120,90],sky:'#bfd2d2'},
 {t:540,night:.015,glow:0,cast:.31,contact:.25,rgb:[230,211,181],sky:'#c2dce4'},
 {t:720,night:0,glow:0,cast:.24,contact:.27,rgb:[255,245,226],sky:'#b9d5e2'},
 {t:900,night:.025,glow:0,cast:.28,contact:.26,rgb:[216,197,165],sky:'#d5d5d1'},
 {t:1035,night:.12,glow:.04,cast:.32,contact:.24,rgb:[180,105,70],sky:'#d1b9a1'},
 {t:1080,night:.25,glow:.35,cast:.22,contact:.21,rgb:[125,77,90],sky:'#8b8699'},
 {t:1140,night:.57,glow:.85,cast:.07,contact:.18,rgb:[25,39,70],sky:'#3d4e70'},
 {t:1200,night:.72,glow:1,cast:.02,contact:.20,rgb:[14,29,61],sky:'#253b5d'},
 {t:1440,night:.78,glow:1,cast:.025,contact:.22,rgb:[11,27,56],sky:'#1a304c'}
];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function normalize(snapshot){
 const state=snapshot||{};
 const day=Math.max(1,Math.min(999999,Math.floor(Number(state.day)||1)));
 const minute=((Number(state.minute)??DEFAULT_MINUTE)%MINUTES+MINUTES)%MINUTES;
 const speed=[1,2,4].includes(Number(state.speed))?Number(state.speed):1;
 return {day,minute:Number.isFinite(minute)?minute:DEFAULT_MINUTE,speed,paused:!!state.paused};
}
function format(minute){
 let m=((Math.floor(minute)%MINUTES)+MINUTES)%MINUTES;
 return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
}
function advance(state,seconds){
 const input=normalize(state),dt=clamp(Number(seconds)||0,0,60);
 if(input.paused||dt<=0)return input;
 const total=input.minute+dt*input.speed;
 input.minute=total%MINUTES;
 input.day=Math.min(999999,input.day+Math.floor(total/MINUTES));
 return input;
}
function hexToRgb(hex){
 const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
}
function mix(a,b,t){return a+(b-a)*t;}
function model(minute){
 const t=((Number(minute)%MINUTES)+MINUTES)%MINUTES;
 let a=stops[0],b=stops[stops.length-1];
 for(let i=1;i<stops.length;i++){
  if(stops[i].t>=t){a=stops[i-1];b=stops[i];break;}
 }
 const u=clamp((t-a.t)/(b.t-a.t||1),0,1);
 const lerp=(k)=>mix(a[k],b[k],u);
 const skyA=hexToRgb(a.sky),skyB=hexToRgb(b.sky);
 const sky='#'+skyA.map((v,i)=>Math.round(mix(v,skyB[i],u)).toString(16).padStart(2,'0')).join('');
 const daylight=clamp(Math.sin(Math.PI*(t-330)/(18.5*60-330)),0,1);
 // Shadow travels west during the morning and east in late afternoon.
 const angle=(t-720)/360*Math.PI*.67;
 const sun={x:Math.cos(angle),z:Math.sin(angle),height:daylight};
 const phase=t<300||t>=1140?'MALAM':t<420?'FAJAR':t<660?'PAGI':
  t<900?'SIANG':t<1080?'SORE':'SENJA';
 return {phase,sun,sky,night:lerp('night'),glow:lerp('glow'),cast:lerp('cast'),
  contact:lerp('contact'),tintRGB:a.rgb.map((v,i)=>Math.round(mix(v,b.rgb[i],u)))};
}
function makeClock(initial){
 let clock=normalize(initial);
 return {
  get(){return {...clock};},
  snapshot(){return {...clock};},
  tick(realSeconds){clock=advance(clock,realSeconds);return {...clock};},
  restore(obj){clock=normalize(obj);return {...clock};},
  setMinute(value){const n=Number(value);if(Number.isFinite(n))clock.minute=((n%MINUTES)+MINUTES)%MINUTES;return {...clock};},
  setSpeed(value){const n=Number(value);if([1,2,4].includes(n))clock.speed=n;return {...clock};},
  setPaused(value){clock.paused=!!value;return {...clock};},
  label(){return format(clock.minute);},
  weekday(){return WEEK[(clock.day-1)%7];},
  solar(){return model(clock.minute);}
 };
}
g.VLSemestaDayNight=Object.freeze({
 MINUTES,DEFAULT_MINUTE,DAY_REAL_SECONDS,WEEK,normalize,advance,model,format,makeClock
});
})(window);

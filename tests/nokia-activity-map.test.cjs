'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const phoneSource=fs.readFileSync('shared/vl-hud/phone_ellen.js','utf8');
const gameplaySource=fs.readFileSync('world-builder/semesta-life-play.js','utf8');
const hudSource=fs.readFileSync('shared/play-hud.js','utf8');

function handset(){
 const window={};
 class ImageData {constructor(data,width,height){this.data=data;this.width=width;this.height=height;}}
 new Function('window','ImageData',phoneSource)(window,ImageData);
 return window.VLPhoneEllen;
}
test('the original Nokia handset and its existing Peta app remain intact',()=>{
 const E=handset();
 assert.equal(typeof E.setGameProvider,'function');
 assert.equal(typeof E.press,'function');
 assert.equal(typeof E.draw,'function');
 assert.equal(E.hasGameProvider(),false);
 assert.match(phoneSource,/const MENU=\[/);
 assert.match(phoneSource,/\['Peta','peta',\(\)=>Peta\(\)\]/);
 assert.match(phoneSource,/const LM=\[/); // Original offline map remains a fallback.
});
test('live map renders game activities and updates its real player position',()=>{
 const E=handset();
 const game={wallet:3200,map:{
  bounds:{minX:-30,maxX:40,minZ:-50,maxZ:45},
  player:{x:-3,z:1},
  sites:[
   {id:'fish',label:'Mancing',x:30,z:10,icon:'peta',placeholder:false},
   {id:'job_pak_ogah',label:'Pak Ogah',x:-12,z:-25,icon:'office',placeholder:true},
   {id:'kost',label:'Kost',x:0,z:4,icon:'house',placeholder:false}
  ]
 }};
 E.setGameProvider(()=>game);
 assert.equal(E.hasGameProvider(),true);
 E.press('OK'); // Standby → Menu
 E.press('6');  // Menu 6: Peta
 assert.equal(E.depth(),3);
 const before=E.draw();
 assert.ok(before&&before.data&&before.width===248&&before.height===370);
 game.map.player.x=35;game.map.player.z=-40;
 const after=E.draw();
 let difference=0;
 for(let i=0;i<before.data.length;i++)if(before.data[i]!==after.data[i])difference++;
 assert.ok(difference>0,'map player marker must move when gameplay coordinates change');
 E.press('D'); // Select the next activity from Nokia directional controls
 E.press('OK'); // Mark the selected activity
 assert.ok(E.draw());
 E.setGameProvider(null);
 assert.equal(E.hasGameProvider(),false);
});
test('Semesta exports city-wide activity coordinates to Nokia and has no 3D floating marker geometry',()=>{
 assert.match(gameplaySource,/function nokiaSnapshot\(\)/);
 assert.match(gameplaySource,/map:\{/);
 assert.match(gameplaySource,/player:getPos\(\),bounds:worldBounds\(\)/);
 assert.match(gameplaySource,/sites:sites\.map\(/);
 assert.match(gameplaySource,/root\.VLPhoneEllen\.setGameProvider\(nokiaSnapshot\)/);
 assert.match(gameplaySource,/root\.VLPhoneEllen\.setGameProvider\(null\)/);
 assert.match(gameplaySource,/function placeMarkers\(\)\{\s*\/\/ Activity points live in the original Nokia Peta/);
 assert.doesNotMatch(gameplaySource,/jiwa-play-temporary-interactions/);
 assert.match(gameplaySource,/function nearest\(\)/);
 assert.match(gameplaySource,/function runAction\(action,args=/);
});
test('Semesta HP button invokes the actual Nokia renderer instead of a second phone menu',()=>{
 assert.match(gameplaySource,/root\.VLPlayHud\.toggleWindow\('phone'\)/);
 assert.doesNotMatch(gameplaySource,/function phoneMarkup\(\)/);
 assert.match(hudSource,/VLNokiaPlay\.open/);
 assert.match(phoneSource,/function PetaSemesta\(\)/);
 assert.match(phoneSource,/function Kursus\(\)/);
 assert.match(phoneSource,/function Furnitur\(\)/);
});

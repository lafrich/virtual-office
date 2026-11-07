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

test('Nokia wallet, Dompet ledger and course share exactly the Jiwa game state',()=>{
 const E=require('../jiwa/life-economy.js');
 const config=E.defaults();
 let player=E.stateFrom({wallet:50000},config);
 const room=E.run(config,player,'buy_room',{roomSpawn:{id:'kost',x:7,z:11}});
 assert.ok(room.ok);player=room.state;
 const Nokia=handset();
 const snapshot=()=>({
  wallet:player.wallet,transactions:player.transactions.slice().reverse(),
  experience:player.experience,energy:player.energy,fullness:player.fullness,
  hygiene:player.hygiene,bladder:player.bladder,moral:player.moral,
  ownsRoom:!!player.housing.room,fridgeOwned:!!player.housing.fridge,
  powerTokens:player.powerTokens,identity:player.identity,
  furniture:player.furniture,furnitureCatalog:E.FURNITURE,
  settings:config.settings,religions:E.RELIGIONS.filter(x=>x!=='satanis'),
  zodiacs:E.ZODIACS,
  map:{bounds:{minX:0,maxX:30,minZ:0,maxZ:30},player:{x:2,z:3},sites:[]},
  runAction:(action,args)=>{
   const r=E.run(config,player,action,args);
   if(r.ok)player=r.state;
   return r;
  }
 });
 Nokia.setGameProvider(snapshot);
 Nokia.press('OK');Nokia.press('1'); // Menu -> Dompet
 const before=Nokia.draw();
 assert.ok(before);
 assert.equal(player.wallet,20000);
 Nokia.press('R');Nokia.press('4'); // Marketplace
 Nokia.press('1');Nokia.press('L');Nokia.press('L'); // Token -> buy -> confirm
 assert.equal(player.wallet,19000);
 assert.equal(player.powerTokens,5);
 assert.equal(player.transactions.length,2);
 assert.deepEqual(player.transactions.map(t=>t.delta),[-30000,-1000]);
 Nokia.press('R');Nokia.press('R');Nokia.press('R');Nokia.press('1'); // Dompet
 const after=Nokia.draw();
 assert.ok(after);
 let different=0;
 for(let i=0;i<before.data.length;i++)if(before.data[i]!==after.data[i])different++;
 assert.ok(different>0,'Dompet LCD must visibly update after real Jiwa transaction');
 Nokia.press('R');Nokia.press('3');Nokia.press('1');Nokia.press('L'); // course
 assert.equal(player.experience,12);
 assert.equal(player.wallet,19000,'a course with no fee cannot change the money balance');
});
test('Nokia cannot invent a balance from unowned purchases, and Jiwa owns product prices',()=>{
 const E=require('../jiwa/life-economy.js'),cfg=E.defaults();
 cfg.settings.tokenPrice=1750;
 let player=E.stateFrom({wallet:50000},cfg);
 const failed=E.run(cfg,player,'buy_token');
 assert.equal(failed.ok,false);
 assert.equal(failed.state.wallet,50000);
 assert.equal(failed.state.transactions.length,0);
 const bought=E.run(cfg,player,'buy_room',{roomSpawn:{id:'kost',x:2,z:2}});
 player=bought.state;
 const token=E.run(cfg,player,'buy_token');
 assert.ok(token.ok);
 assert.equal(token.state.wallet,player.wallet-1750);
 assert.equal(token.state.transactions.at(-1).delta,-1750);
 const furniture=E.run(cfg,token.state,'buy_furniture',{itemId:'chair'});
 assert.ok(furniture.ok);
 assert.equal(furniture.state.transactions.at(-1).delta,-E.FURNITURE.find(f=>f.id==='chair').price);
});
test('Nokia screen remains open across HUD redraws and active game rules never show demo wallet',()=>{
 assert.match(hudSource,/if\(!root\.VLNokiaPlay\.isOpen\?\.\(\)\)root\.VLNokiaPlay\.open\(\)/);
 assert.match(phoneSource,/saldo:0,/);
 assert.match(phoneSource,/liveData\(\)\?\.wallet/);
 assert.match(phoneSource,/transactions/);
 assert.match(phoneSource,/furnitureCatalog/);
 assert.match(phoneSource,/setGameProvider/);
 assert.match(gameplaySource,/transactions:\(state\.transactions\|\|\[\]\)\.slice\(\)\.reverse\(\)/);
});

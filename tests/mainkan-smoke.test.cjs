'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const html=read('mainkan/index.html');
const app=read('mainkan/app.js');
const launcher=read('membangun/index.html');
const semesta=read('world-builder/builder.js');
const semestaIndex=read('world-builder/index.html');
const playerCSS=read('world-builder/semesta-player.css');
test('mainkan client and Semesta player CSS parse',()=>{
 assert.doesNotThrow(()=>new vm.Script(app,{filename:'mainkan/app.js'}));
 assert.doesNotThrow(()=>new vm.Script(read('mainkan/config.js')));
});
test('mainkan onboarding and native Semesta iframe exist',()=>{
 for(const id of ['splashScreen','loginScreen','characterScreen','gameScreen','authForm','guestButton','characterForm','semestaFrame','worldLoading','exitGame','reloadWorld'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/Windows 98|mainkan\.exe/i);
 assert.match(app,/world-builder\//);
 assert.match(app,/searchParams\.set\('player','1'\)/);
 assert.match(app,/mainkan:semesta-ready/);
 assert.doesNotMatch(app,/world\.json/);
 assert.doesNotMatch(app,/drawTerrain|drawObject|function blocked\(/);
});
test('login requires real server; browser never stores Mainkan passwords',()=>{
 assert.match(app,/authenticated!==true/);
 assert.match(app,/saved!==true/);
 assert.doesNotMatch(app,/(?:localStorage|sessionStorage)\s*\./);
});
test('Semesta has a native read-only player entry, real walk, life and 3D render',()=>{
 assert.match(semestaIndex,/semesta-player\.css/);
 assert.match(semestaIndex,/player'\)===\x271\x27/);
 assert.match(playerCSS,/semesta-player-mode/);
 assert.match(playerCSS,/#canvas-wrap/);
 assert.match(semesta,/const playerMode=/);
 assert.match(semesta,/if\(playerMode&&m!==\x27walk\x27\)return/);
 assert.match(semesta,/if\(playerMode\)return; \/\/ Preview/);
 assert.match(semesta,/setMode\(\x27walk\x27\)/);
 assert.match(semesta,/SemestaLifePlay\?\.start/);
 assert.match(semesta,/renderer\.render\(scene,camera\)/);
 assert.match(semesta,/mainkan:semesta-ready/);
});
test('Membangun opens the standalone player client',()=>{
 assert.match(launcher,/data-app="mainkan"/);
 assert.match(launcher,/data-art="mainkan"/);
 assert.match(launcher,/virtual-office\/mainkan\//);
});

test('Flow Editor parses and includes graph, inspector, file IO and test preview',()=>{
 const editor=read('mainkan/flow-editor.html'),logic=read('mainkan/flow-editor.js'),schema=read('mainkan/flow-model.js');
 assert.doesNotThrow(()=>new vm.Script(logic,{filename:'mainkan/flow-editor.js'}));
 assert.doesNotThrow(()=>new vm.Script(schema,{filename:'mainkan/flow-model.js'}));
 for(const name of ['nodeLayer','wires','inspector','addNode','duplicateNode','deleteNode','importFlow','exportFlow','testFlow','testFrame'])
  assert.match(editor,new RegExp('id="'+name+'"'));
 assert.match(logic,/pointermove/);
 assert.match(logic,/mainkan:flow-config/);
 assert.match(logic,/Blob\(/);
});
test('validated onboarding default flow has connected branches',()=>{
 const F=require('../mainkan/flow-model.js');
 const graph=F.normalize(F.preset('default'));
 assert.equal(graph.format,'mainkan-flow-v1');
 assert.equal(F.get(graph,'auth').routes.guest,'character');
 assert.equal(F.get(graph,'character').next,'confirm');
 assert.equal(F.get(graph,'firstCheck').routes.first_time,'tutorial');
 assert.equal(F.get(graph,'tutorial').next,'game');
 const invalid=F.clone(graph);invalid.nodes.find(n=>n.id==='character').next='deleted';
 assert.equal(F.check(invalid).ok,false);
});
test('Game UI moved to Mainkan while Semesta stays source for world/phone systems',()=>{
 const hud=read('mainkan/game-hud.js');
 assert.match(html,/id="gamePhone"/);
 assert.match(html,/id="gameBag"/);
 assert.match(html,/id="gameAction"/);
 assert.match(hud,/ptPhoneBtn/);
 assert.match(hud,/ptActionBtn/);
 assert.match(playerCSS,/#vs-hud\{display:none!important\}/);
 assert.match(app,/flowPreview/);
 assert.match(app,/mainkan:flow-request/);
 assert.match(html,/id="importPlayerFlow"/);
});

test('Genesis is the only player body; all player faces are Emosi.exe sources',()=>{
 const gen=read('shared/genesis-player.js'),base=read('shared/genesis-source.js'),emotions=read('shared/emosi-source.js');
 for(const [file,source] of [['shared/genesis-player.js',gen],['shared/genesis-source.js',base],['shared/emosi-source.js',emotions]])
  assert.doesNotThrow(()=>new vm.Script(source,{filename:file}));
 assert.match(html,/genesis_male_nude/);
 assert.match(html,/genesis_female_nude/);
 assert.doesNotMatch(app,/['"](?:ichsan|noor|theodore)['"]/);
 assert.doesNotMatch(html,/data-character="(?:ichsan|noor|theodore)"/);
 assert.match(gen,/faceSource:"emosi\.exe"/);
 assert.match(gen,/EMOSI\.emotions/);
 assert.match(semesta,/mainkan:profile-request/);
 assert.match(semesta,/mainkan:player-profile/);
 assert.match(semesta,/GenesisPlayer\.createRig/);
 assert.match(semesta,/const first=playerMode\?makeTemporaryLifePlayer\(\)/);
 assert.match(semesta,/setPlayerEmotion/);
 // Source loading is now atomic; one slow hair sheet may not erase a frame.
 assert.match(gen,/const items=names\.map\(part=>\(\{part,image:lookupImage/);
 assert.match(gen,/if\(!status\.ready\)return false/);
 assert.match(gen,/ctx\.clearRect\(0,0,64,112\);ctx\.drawImage\(work,0,0\)/);
 assert.match(gen,/\["short","swept"\]\.includes/);
 for(const id of ['topStyle','pantsStyle','shoesStyle'])
  assert.match(html,new RegExp('<select id="'+id+'"><option value="custom" selected>Genesis Custom Wear'));
 assert.match(app,/mainkan:player-loading/);
 assert.match(semesta,/function reportPlayerReady\(\)/);
});

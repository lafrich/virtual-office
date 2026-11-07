'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('world-builder/index.html','utf8');
const builder=fs.readFileSync('world-builder/builder.js','utf8');
const hud=fs.readFileSync('shared/play-hud.js','utf8');
const mark=fs.readFileSync('shared/hub-registry.js','utf8');

test('Semesta loads shared gameplay schema and Play HUD',()=>{
 assert.match(html,/shared\/gameplay-schema\.js/);
 assert.match(html,/shared\/play-hud\.js/);
 assert.match(html,/shared\/hub-registry\.js/);
});

test('Walk Test / Play reads hub gameplay and does not hardcode world speed alone',()=>{
 assert.match(builder,/function currentPlayGameplay/);
 assert.match(builder,/virtual-life-gameplay-v1/);
 assert.match(builder,/playWorldSpeed/);
 assert.match(builder,/const speed=playWorldSpeed\(\)/);
 assert.doesNotMatch(builder,/const speed=4\.1/);
 assert.match(builder,/VLHub.subscribe\('gameplay'/);
 assert.match(builder,/VLPlayHud\.mount/);
 assert.match(builder,/playControllerOnly/);
 assert.match(builder,/no tap-to-move player/);
 assert.match(builder,/walkRunning/);
 assert.match(builder,/window\.SemestaPlay/);
});

test('shared Play HUD is X-only, one window, overlay clears the watermark',()=>{
 assert.match(hud,/ptWinClose/);
 assert.match(hud,/>×</);
 assert.match(hud,/oneWindowAtATime/);
 assert.match(hud,/mode==='overlay'/);
 assert.match(hud,/pt-with-pad/);
 assert.match(mark,/vl-play-hud-active/);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('jiwa/index.html','utf8');
const panel=fs.readFileSync('jiwa/mechanics-panel.js','utf8');
const hud=fs.readFileSync('shared/play-hud.js','utf8');
const ui=fs.readFileSync('jiwa/jiwa.js','utf8');

test('Jiwa Play Test uses the new game title and mechanics panel hooks',()=>{
 assert.match(html,/Namanya Juga Hidup: The Game — Play Test/);
 assert.match(html,/id="mechanicsPanel"/);
 assert.match(html,/id="playtestHud"/);
 assert.match(html,/src="\.\/mechanics-panel\.js"/);
 assert.match(html,/src="\.\.\/shared\/gameplay-schema\.js"/);
 assert.match(html,/src="\.\.\/shared\/play-hud\.js"/);
 assert.match(html,/src="\.\.\/shared\/hub-registry\.js"/);
 assert.match(html,/src="\.\.\/world-builder\/city-drafts\.js"/);
});

test('Play Test HUD is X-only, one window at a time, controller movement, no tap-to-move',()=>{
 assert.match(panel,/Namanya Juga Hidup: The Game/);
 assert.match(hud,/oneWindowAtATime/);
 assert.match(hud,/ptWinClose/);
 assert.match(hud,/>×</);
 assert.match(panel,/controllerOnly/);
 assert.match(hud,/No phone apps enabled|NOKIA/);
 assert.doesNotMatch(panel,/tap-to-move player/);
 assert.match(hud,/playtestMap/);
 assert.match(panel,/\(a\.x\+a\.z\)-\(b\.x\+b\.z\)/);
 assert.match(panel,/VLPlayHud\.mount/);
});

test('gameplay config is stored on the Jiwa project and published to the hub',()=>{
 assert.match(ui,/gameplay:JG\.defaultGameplay\(\)/);
 assert.match(ui,/result\.gameplay=JG\.normalizeGameplay/);
 assert.match(ui,/JiwaGameplayBridge/);
 assert.match(ui,/VLHub\.publish\('gameplay'/);
});

test('mechanics panel exposes a Traffic lights module',()=>{
 assert.match(panel,/TRAFFIC LIGHTS/);
 assert.match(panel,/cycleSeconds/);
});

test('mechanics panel exposes HUD Layout scales and reset',()=>{
 assert.match(panel,/HUD LAYOUT/);
 assert.match(panel,/hudLayoutReset/);
 assert.match(panel,/Phone profile/);
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('path');
const HL=require('../shared/hud-layout.js');
const G=require('../shared/gameplay-schema.js');

test('defaults ship separate Phone and Desktop profiles and clamp scale',()=>{
 const d=HL.defaults();
 assert.equal(d.desktop.action.scale,1);
 assert.ok(d.phone.action.scale<1);
 assert.ok(d.phone.phone.scale<0.8);
 assert.equal(d.phone.dock.scale,1);
 const n=HL.normalize({phone:{action:{scale:9,anchor:'nope',x:-9999},run:{scale:0.1}}});
 assert.equal(n.phone.action.scale,1.5);
 assert.equal(n.phone.action.anchor,'bottom-right');
 assert.equal(n.phone.action.x,-480);
 assert.equal(n.phone.run.scale,0.5);
});

test('gameplay schema includes hudLayout and clamps through normalize',()=>{
 const g=G.defaultGameplay();
 assert.ok(g.modules.hudLayout.phone.action.scale<1);
 assert.equal(g.modules.hudLayout.desktop.dock.scale,1);
 const n=G.normalizeGameplay({modules:{hudLayout:{phone:{action:{scale:0.2,anchor:'bottom-left',x:20,y:20}}}}});
 assert.equal(n.modules.hudLayout.phone.action.scale,0.5);
 assert.equal(n.modules.hudLayout.phone.action.anchor,'bottom-left');
});

test('play-hud and Jiwa load the module and expose sliders plus reset',()=>{
 const hud=fs.readFileSync(path.resolve(__dirname,'../shared/play-hud.js'),'utf8');
 const panel=fs.readFileSync(path.resolve(__dirname,'../jiwa/mechanics-panel.js'),'utf8');
 const jiwa=fs.readFileSync(path.resolve(__dirname,'../jiwa/index.html'),'utf8');
 const html=fs.readFileSync(path.resolve(__dirname,'../world-builder/index.html'),'utf8');
 assert.match(hud,/applyHudLayout/);
 assert.match(hud,/VLHudLayout/);
 assert.match(panel,/HUD LAYOUT/);
 assert.match(panel,/hudLayoutReset/);
 assert.match(panel,/Phone profile/);
 assert.match(jiwa,/hud-layout\.js/);
 assert.match(html,/hud-layout\.js/);
});

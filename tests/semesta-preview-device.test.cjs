'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const builder=fs.readFileSync('world-builder/builder.js','utf8');
const hud=fs.readFileSync('shared/play-hud.js','utf8');
const css=fs.readFileSync('world-builder/xp.css','utf8');
const html=fs.readFileSync('world-builder/index.html','utf8');

test('Walk Test remembers a Phone vs Desktop preview toggle',()=>{
 assert.match(builder,/semesta-play-device-v1/);
 assert.match(builder,/deviceFrame/);
 assert.match(builder,/semestaDevicePhone/);
 assert.match(builder,/semestaDeviceDesktop/);
 assert.match(builder,/DEVICE_PRESETS/);
 assert.match(builder,/390/);
 assert.match(builder,/844/);
 assert.match(builder,/717/);
 assert.match(builder,/746/);
 assert.match(builder,/writeDevicePref/);
 assert.match(builder,/applyDevicePreview/);
 assert.match(html,/legacy-objects\.js/);
 assert.match(css,/semestaDeviceBar/);
 assert.match(css,/semestaDeviceFrame/);
});

test('Phone preview uses the same play view via iframe, not a fake layout',()=>{
 assert.match(builder,/searchParams\.set\('deviceFrame','1'\)/);
 assert.match(builder,/isDeviceFrame/);
 assert.doesNotMatch(builder,/fake-mobile-hud/);
 assert.match(hud,/shell\.css/);
 assert.match(hud,/y2k\.css/);
 assert.match(hud,/nokia\.css/);
 assert.match(hud,/ptRunBtn/);
 assert.match(hud,/Hold to run|vs-run/);
});

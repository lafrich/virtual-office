'use strict';
// Static half of the lesson-18 gate (MUST: no UI window/button/tab cropped on any screen size).
// The browser half is mainkan/tools/njh98-window-fit.mjs (4 screen sizes, every window) and must exit 0 before any push.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=path.join(__dirname,'..');
test('window-fit gate: CSS keeps windows shrinkable and the checker covers every window',()=>{
 const css=fs.readFileSync(path.join(R,'mainkan/njh98.css'),'utf8');
 assert.match(css,/\.njh-win>\.w98-body\{grid-template-columns:minmax\(0,1fr\)/,'window body is one shrinkable column');
 assert.match(css,/\.njh-win \.njh-tabs\{flex-wrap:wrap/,'tab strips wrap');
 const tool=fs.readFileSync(path.join(R,'mainkan/tools/njh98-window-fit.mjs'),'utf8');
 for(const sz of ['1024, height: 576','1280, height: 800','844, height: 390','390, height: 844'])assert.ok(tool.includes('width: '+sz),sz);
 for(const id of ['openCook','openStorage(\'fridge\')','openStorage(\'storage\')','openShop','openFish','openToken','openMap','openSlots','openSettings','openCredits','openHowto','enterDoor','njhDockStatus','gameBag','pauseButton','gameAction','loginScreen','characterScreen'])
  assert.ok(tool.includes(id),'checker opens '+id);
 const win=fs.readFileSync(path.join(R,'mainkan/njh98-step2.js'),'utf8');
 for(const m of win.matchAll(/openWin\('(\w+)'/g))assert.ok(['njhCook','njhFish','njhShop2','njhStore','njhTokenWin'].includes(m[1]),'new step-2 window '+m[1]+' must be added to the checker');
});
test('window-fit portrait force-renders landscape (no blocking Putar HP gate)',()=>{
 const css=fs.readFileSync(path.join(R,'mainkan/njh98.css'),'utf8');
 const html=fs.readFileSync(path.join(R,'mainkan/index.html'),'utf8');
 const js=fs.readFileSync(path.join(R,'mainkan/njh98.js'),'utf8');
 const tool=fs.readFileSync(path.join(R,'mainkan/tools/njh98-window-fit.mjs'),'utf8');
 assert.match(html,/id="njhStage"/);
 assert.doesNotMatch(html,/id="njhRotate"|Putar HP ke landscape/);
 assert.doesNotMatch(html,/njhRotateContinue|Lanjut bermain|Saran Tampilan HP/);
 assert.doesNotMatch(css,/njh-rotate/);
 assert.match(css,/njh-force-landscape/);
 assert.match(css,/\.njh-joy\{[^}]*background:transparent/);
 assert.match(css,/filter:opacity\(1\)/);
 assert.match(html,/fresh-mode\.js\?v=njh-cp3-qa-20261122/);
 assert.match(html,/id="njhFreshBanner"/);

 assert.match(css,/rotate\(90deg\) translateY\(-100%\)/);
 assert.match(js,/function applyForceLandscape/);
 assert.match(js,/function clientToStage/);
 assert.doesNotMatch(js,/dismissRotateHint|scheduleRotateHintDismiss/);
 assert.match(js,/function lockLandscape/);
 assert.match(tool,/phone-390x844/);
 assert.match(tool,/force-landscape/);
 assert.match(tool,/sz\.tag === 'phone-390x844'/);
});

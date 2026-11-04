'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),js=read('builder.js'),css=read('xp.css');
assert.match(html,/<button class="chrome-tool" id="panMode"[^>]*aria-pressed="false"/,
 'toolbar needs explicit accessible Pan button');
assert.match(js,/\$\('panMode'\)\.onclick=\(\)=>\{/,
 'Pan button must activate Pan mode');
assert.match(js,/if\(mode==='pan'\)\{[\s\S]*?drag=\{kind:'pan'[\s\S]*?hit:false[\s\S]*?return;/,
 'Pan branch must precede object picking and never select or move objects');
assert.ok(js.indexOf("if(mode==='pan'){")<js.indexOf('const hit=pick(e);'),
 'Pan must skip raycasting objects');
assert.match(js,/for\(const type of \['select','move','pan','walk','paint','fill'\]\)/,
 'Pan must participate in selected tool state');
assert.match(js,/canvas\.classList\.toggle\('pan-tool-active',m==='pan'\)/);
assert.match(js,/drag\.kind==='pan'&&!drag\.hit/,
 'Pan must reuse established camera dragging mechanics');
assert.match(js,/else if\(e\.key\.toLowerCase\(\)==='p'\)setMode\('pan'\)/);
assert.match(css,/#world\.pan-tool-active\{cursor:grab\}/);
assert.match(css,/#world\.pan-tool-active:active\{cursor:grabbing\}/);
assert.match(html,/builder\.js\?v=[^"\n]*pan-camera-v1/,'pan camera remains present in versioned builder script');
assert.match(css,/#world\{display:block/);
console.log('PASS Semesta explicit Pan tool, drag-anywhere without object selection, keyboard and touch-compatible cursor');

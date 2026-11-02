'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
for(const marker of ["var atGateFloor=me.c>=20.4", "if(roadLevel)back.push(S2X.lv.g)", "kind==='tall'?1.28:kind==='wide'?1.20:1.26", "XC._gptLastPaint<32", "navigator.maxTouchPoints>0"]){assert.ok(code.includes(marker),'Missing '+marker);}
assert.ok(!code.includes('__gptPunchFront'));
console.log('PASS gate floor depth / original tree pivot scale / mobile canvas frame cap');

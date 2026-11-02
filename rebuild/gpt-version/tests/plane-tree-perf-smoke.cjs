'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
for(const marker of ["var atGateFloor=me.c>=18.6", "if(roadLevel)back.push(S2X.lv.g)", "kind==='tall'?1.85:kind==='wide'?1.95:2.05", "XC._gptLastPaint<32", "navigator.maxTouchPoints>0"]){assert.ok(code.includes(marker),'Missing '+marker);}
assert.ok(code.includes("officeTree=r>=28.6&&r<=29.6&&c>=15&&c<=30"),'office lawn tree target must be specific');
assert.ok(code.includes("'-office-v11'"),'office tree sprite must not share the old global cache key');
assert.ok(code.includes("scale(1.12 1.65)"),'office tree visual must be stretched upward from trunk base');
assert.ok(code.includes('GPT VERSION · v16a.14'),'verify visible beta build tag');
assert.ok(code.includes('const vk = k * treeScale'),'active vegTree PNG must receive scale factor');
assert.ok(code.includes("vegZone(c,r)==='front'"),'scale applies to office-front vegetation');
assert.ok(code.includes("kind==='tall'?1.85:kind==='wide'?2.1:2.15"),'non-uniform tree kind proportions');
assert.ok(!code.includes('__gptPunchFront'));
assert.ok(code.includes('me.r>=31.6'),'back-layer floor must activate on approach, before crossing');
console.log('PASS gate floor depth / original tree pivot scale / mobile canvas frame cap');

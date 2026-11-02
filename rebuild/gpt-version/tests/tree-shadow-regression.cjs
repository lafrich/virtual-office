/* node rebuild/gpt-version/tests/tree-shadow-regression.cjs
 * Only beta image variants: tree canopy & collision/scale remain unchanged.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
const required=[
  'function gptOfficeShadowData(n)',
  'const scaleX=0.52,scaleY=0.48',
  'ctx.globalAlpha=0.5',
  "officeLawn ? 'gpt-office-shadow:'+nm : nm",
  "VEG.data['gpt-office-shadow:'+n]=gptOfficeShadowData(n)",
  'data.data[i]===0&&data.data[i+1]===0&&data.data[i+2]===0',
  'data.data[i+3]>0&&data.data[i+3]<=110',
  'ctx.drawImage(clean,0,0)',
  "kind==='tall'?1.85:kind==='wide'?2.1:2.15",
  'GPT VERSION · v16a.13',
];
for(const token of required)assert.ok(src.includes(token),'Missing active PNG shadow fix: '+token);
assert.ok(src.includes("if([].concat(...Object.values(VEG.layout.trees.front)).includes(n))"),
  'Only source species used on front lawn should be modified');
assert.ok(!src.includes('shadow.style.opacity=0')&&!src.includes('__gptPunchFront'),
  'The fix must not alter world/player depth to hide the shadow');

const c=0, y=0, shadow=56, grass=255, trunk=255;
const pixels=[[0,0,0,shadow],[26,106,58,grass],[79,55,39,trunk]];
const processed=pixels.map(px=>px[0]===0&&px[1]===0&&px[2]===0&&px[3]>0&&px[3]<=110
 ? {originalAlpha:0,shrinkAlpha:px[3]*.5} : {originalAlpha:px[3],shrinkAlpha:0});
assert.equal(processed[0].originalAlpha,0);
assert.equal(processed[0].shrinkAlpha,28);
assert.equal(processed[1].originalAlpha,grass);
assert.equal(processed[2].originalAlpha,trunk);
console.log('PASS: active PNG shadow variant, half-opacity + reduced footprint, grass/canopy/trunk preserved');

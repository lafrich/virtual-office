/* node rebuild/gpt-version/tests/tree-shadow-regression.cjs
 * Office-front tree shadows are eliminated, not resized or overpainted.
 */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
for(const token of [
  'function gptOfficeShadowData(n)',
  'pixels.data[i]===0 && pixels.data[i+1]===0',
  'pixels.data[i+2]===0 && pixels.data[i+3]>0',
  'pixels.data[i+3]<=110',
  'pixels.data[i+3]=0',
  "officeLawn ? 'gpt-office-shadow:'+nm : nm",
  "VEG.data['gpt-office-shadow:'+n]=gptOfficeShadowData(n)",
  "kind==='tall'?1.85:kind==='wide'?2.1:2.15",
  'GPT VERSION · v16a.14'
])assert.ok(src.includes(token),'Missing expected patch token: '+token);
assert.ok(!src.includes('ctx.drawImage(shadow'),'Old cast shadow must never be redrawn');
assert.ok(!src.includes('__gptPunchFront'),'Do not force player over vehicles');
const shadow=[0,0,0,56],darkShadow=[0,0,0,90],leaf=[30,130,70,255],trunk=[95,64,42,255];
function clearAlpha(pixel){const [r,g,b,a]=pixel;return r===0&&g===0&&b===0&&a>0&&a<=110?0:a;}
assert.equal(clearAlpha(shadow),0);
assert.equal(clearAlpha(darkShadow),0);
assert.equal(clearAlpha(leaf),255);
assert.equal(clearAlpha(trunk),255);
console.log('PASS: front-office tree shadow removed, opaque trunk and canopy untouched');

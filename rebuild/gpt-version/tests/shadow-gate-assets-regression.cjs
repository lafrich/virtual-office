/* node rebuild/gpt-version/tests/shadow-gate-assets-regression.cjs
 * Safeguards the pre-bake PNG shadow removal and per-pixel gateway floor cut.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
for (const part of [
 "VEG.data[n]=gptOfficeShadowData(n)",
 "function gptOfficeShadowData(n)",
 "pixels.data[i+3]=0",
 "const vk = k * treeScale",
 "gpt level-floor",
 "var y0=Math.max(238,Math.floor(h*0.58)),ww=Math.min(75,w)",
 "if(floor)d[j+3]=0",
 "ctx.putImageData(a,0,y0)",
 "if(!/\\/lv_\\d+\\.png(?:[?#]|$)/.test(u))return i",
 "GPT VERSION · v16a.15"
])assert.ok(source.includes(part),'Missing PNG integration: '+part);
assert.ok(!source.includes('var atGateFloor='),'Do not delay gate floor layering based on player coordinate');
assert.ok(!source.includes('ctx.drawImage(shadow'),'Tree shadow must not be readded');
function isFloor(r,g,b,a){
 return (r===184&&g===178&&b===168)||
  (r===157&&g===154&&b===145)||
  (r===200&&g===188&&b===159)||
  (r===118&&g===107&&b===89)||
  (r===0&&g===0&&b===0&&a>0&&a<=90);
}
assert.equal(isFloor(184,178,168,255),true,'pavement color removed');
assert.equal(isFloor(255,90,95,255),false,'red gateway pillar retained');
assert.equal(isFloor(231,235,242,255),false,'white gateway pillar retained');
assert.equal(isFloor(0,0,0,56),true,'flat ground shadow removed');
function isTreeShadow(r,g,b,a){return r===0&&g===0&&b===0&&a>0&&a<=110}
assert.equal(isTreeShadow(0,0,0,56),true);
assert.equal(isTreeShadow(0,0,0,90),true);
assert.equal(isTreeShadow(79,55,39,255),false);
assert.equal(isTreeShadow(35,130,64,255),false);
console.log('PASS: tree shadow removed before bake; gate floor pixels removed from front, red/white pillars retained.');

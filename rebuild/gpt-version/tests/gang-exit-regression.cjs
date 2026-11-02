/* node rebuild/gpt-version/tests/gang-exit-regression.cjs
 * Isolated path contract checks. No production Worker or credentials used.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
const match=(pattern,label)=>{
 const found=code.match(pattern);assert.ok(found,'Missing '+label);return found;
};
const lane=JSON.parse('['+match(/region\.lane=\[([0-9.,]+)\]/,'alley corridor')[1]+']');
const terminal=JSON.parse('['+match(/region\.terminal=\[([0-9.,]+)\]/,'rear local road')[1]+']');
match(/rep\("return inR\(R\.side\) \|\| inR\(R\.lane\); }",\s*"return inR\(R\.side\) \|\| inR\(R\.lane\) \|\| \(R\.terminal \? inR\(R\.terminal\) : false\); }"\)/,'original s2xInFar guard must include rear road');
match(/function s2xOK\(c,r\)\{return v16RoadOK\(c,r\)\|\|\(s2xInFar\(c,r\)/,'real extOK must continue through region');
const R={side:[19.4,25.6,36.45,37.65],lane,terminal};
const inside=(r,c,y)=>c>=r[0]&&c<=r[1]&&y>=r[2]&&y<=r[3];
const walk=(c,y)=>inside(R.side,c,y)||inside(R.lane,c,y)||inside(R.terminal,c,y);
assert.deepEqual(lane,[21.85,24.15,37.6,52.05]);
assert.deepEqual(terminal,[-40,34,51.4,54.7]);
let steps=0;
for(let r=36.6;r<=54.69;r+=.1){assert.ok(walk(22.55,r),'alley pass must stay continuous at r='+r);steps++;}
for(let c=-39.9;c<=33.9;c+=.1){assert.ok(walk(c,53),'rear road must allow side exploration at c='+c);steps++;}
for(const [c,r] of [[22.55,55],[-40.5,53],[34.5,53],[17.9,50],[22.55,56]])
 assert.ok(!walk(c,r),'player may not cross baked art boundary '+c+','+r);
assert.ok(code.includes("V16.gangEntered=true"),'beta must expose exploration status');
assert.ok(code.includes("var floorRoad=(me.r>=51.25&&me.r<=54.85"),'road floor overlay must be disabled over the player');
assert.ok(code.includes("if(floorRoad&&g.getAttribute('display')!=='none')"),'only road should hide the baked front occluder');
assert.ok(code.includes("const G_=n.parentNode===EXT.gF"),'normal foreground prop sorting must remain in place');
console.log('PASS: '+steps+' walk samples, full lateral road and bounded ends; road occluder guard and native depth logic present.');

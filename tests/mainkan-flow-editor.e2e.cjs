'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.MAINKAN_TEST_URL||'http://127.0.0.1:8091/virtual-office/mainkan/';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1365,height:900},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e.stack||e)));
 await page.goto(new URL('flow-editor.html?cloudLegacy=1',base).href,{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('.node[data-id=welcome]').click({timeout:10000});
 const desc=page.locator('#inspector textarea');await desc.fill('Welcome khusus dari Flow Editor!');await desc.blur();
 assert.equal(await page.locator('.node').count(),10);
 const downloadPromise=page.waitForEvent('download');
 await page.locator('#exportFlow').click();
 const download=await downloadPromise,path=await download.path();
 assert.ok(path&&fs.existsSync(path));
 const json=JSON.parse(fs.readFileSync(path,'utf8'));
 assert.equal(json.format,'mainkan-flow-v1');
 assert.equal(json.nodes.find(n=>n.id==='welcome').description,'Welcome khusus dari Flow Editor!');
 // Test Flow sends the editable graph to an isolated Mainkan iframe (never browser database).
 await page.locator('#testFlow').click();
 const frame=page.frameLocator('#testFrame');
 await frame.locator('#skipSplash').click({timeout:15000});
 await frame.locator('#welcomeScreen').waitFor({state:'visible',timeout:10000});
 assert.equal(await frame.locator('#welcomeCopy').textContent(),'Welcome khusus dari Flow Editor!');
 await page.locator('#closeTest').click();
 // Clicking an output port and destination rewires NEXT.
 await page.locator('.node[data-id=splash] .port').click();
 await page.locator('.node[data-id=auth]').click();
 await page.locator('.node[data-id=splash]').click();
 assert.equal(await page.locator('#inspector').locator('select').first().inputValue(),'splash');
 assert.equal(await page.locator('#inspector').locator('select').nth(1).inputValue(),'auth');
 // Import restores the exported saved flow from disk.
 await page.locator('#fileIn').setInputFiles(path);
 await page.locator('.node[data-id=splash]').click();
 assert.equal(await page.locator('#inspector').locator('select').nth(1).inputValue(),'welcome');
 const saved=await page.evaluate(()=>localStorage.length);
 assert.equal(saved,0,'Flow editor must use file import/export, not localStorage autosave');
 assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
 fs.mkdirSync('screenshots',{recursive:true});
 await page.screenshot({path:'screenshots/mainkan-flow-editor.png'});
 await browser.close();
 console.log('MAINKAN_FLOW_EDITOR_BROWSER_PASS');
})().catch(e=>{console.error('MAINKAN_FLOW_EDITOR_BROWSER_FAIL',e.stack||e);process.exit(1)});

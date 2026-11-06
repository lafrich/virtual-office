'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--no-sandbox','--disable-gpu']});
 try{
  const page=await browser.newPage({viewport:{width:1040,height:830},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e.message)));
  const root='http://127.0.0.1:8080/';
  await page.goto(root+'virtual-office/membangun/laptop.html?app=semesta',{waitUntil:'domcontentloaded'});
  await page.evaluate((root)=>{
   const urls={
    mahluk:'virtual-life-asset-pipeline/site/index.html',
    emotion:'virtual-office/emotion-studio/',
    bangun:'virtual-office/world-builder/bangun-ruang/',
    semesta:'virtual-office/world-builder/',
    jiwa:'virtual-office/jiwa/'
   };
   for(const [id,path] of Object.entries(urls))localStorage.setItem('membangun-link-'+id,root+path);
  },root);
  await page.reload({waitUntil:'domcontentloaded'});
  const cases=[
   ['semesta','Semesta'],['mahluk','Mahluk'],['emotion','EMOSI'],
   ['bangun','Bangun'],['jiwa','JIWA']
  ];
  for(const [id,expected] of cases){
   await page.locator('#quickApps button[data-app="'+id+'"]').click();
   await page.waitForFunction(([id,expected])=>{
    const f=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none');
    const title=f?.contentDocument?.title||'';
    return f?.src.includes('/')&&title.toLowerCase().includes(expected.toLowerCase());
   },[id,expected],{timeout:30000});
   const title=await page.evaluate(()=>{
    const f=[...document.querySelectorAll('#frameWrap iframe')].find(x=>x.style.display!=='none');
    return f.contentDocument.title;
   });
   console.log('LOADED_APP',id,title);
  }
  assert.equal(await page.locator('#frameWrap iframe').count(),5,'one persistent frame per app');
  await page.locator('#quickApps button[data-app=semesta]').click();
  assert.equal(await page.locator('#frameWrap iframe').count(),5,'switching back does not create duplicate frame');
  await page.setViewportSize({width:480,height:920});
  await page.locator('#rotate90').click();
  assert.equal(await page.locator('body').evaluate(x=>x.classList.contains('rotated')),true);
  await page.locator('#padMode').click();
  await page.screenshot({path:'membangun-laptop-rotated.png'});
  await page.locator('#keyMode').click();
  await page.screenshot({path:'membangun-laptop-keyboard.png'});
  console.log('APP_SWITCH_AND_ROTATE_OK');
  if(errors.filter(x=>/is not defined|Cannot read properties/.test(x)).length>3)throw Error('Runtime errors: '+errors.join('; ').slice(0,700));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});

'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const files=new Map();let seq=0,deleteCalls=0;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({acceptDownloads:true}),pages=[];
 const base='http://127.0.0.1:4174/virtual-office';
 const mockGoogle=async(page)=>{
  await page.route('https://accounts.google.com/gsi/client',route=>route.fulfill({status:200,contentType:'text/javascript',
   body:"window.google={accounts:{oauth2:{initTokenClient(o){return{requestAccessToken(){o.callback({access_token:'mock',expires_in:3600})}}},hasGrantedAllScopes(){return true}}}};"}));
  await page.route('https://www.googleapis.com/**',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname,method=req.method();
   const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
   if(method==='DELETE'){deleteCalls++;return reply({error:'DELETE not allowed in test'},403)}
   if(method==='GET'&&path==='/drive/v3/files'){
    const q=url.searchParams.get('q')||'';
    const parent=/'([^']+)' in parents/.exec(q)?.[1]||'root',
     name=/name = '([^']+)'/.exec(q)?.[1],
     contains=/name contains '([^']+)'/.exec(q)?.[1],
     mime=/mimeType = '([^']+)'/.exec(q)?.[1],
     omitMime=/mimeType != '([^']+)'/.exec(q)?.[1];
    const found=[...files.values()].filter(f=>f.parent===parent&&(!name||name===f.name)&&
     (!contains||f.name.includes(contains))&&(!mime||mime===f.mimeType)&&(!omitMime||f.mimeType!==omitMime));
    return reply({files:found.map(f=>({id:f.id,name:f.name,mimeType:f.mimeType,
     modifiedTime:f.modifiedTime,version:f.version})),nextPageToken:''});
   }
   if(method==='POST'&&path==='/drive/v3/files'){
    const obj=JSON.parse(req.postData()||'{}'),id='cloud-'+(++seq);
    files.set(id,{id,name:obj.name,mimeType:obj.mimeType,parent:obj.parents?.[0]||'root',
     body:'',version:'1',modifiedTime:new Date().toISOString()});
    return reply({id});
   }
   if(method==='POST'&&path==='/upload/drive/v3/files'){
    const raw=req.postData()||'',mime=req.headers()['content-type']||'';
    const boundary=/boundary=([^;]+)/.exec(mime)?.[1];
    if(!boundary)return reply({error:{message:'No multipart boundary'}},400);
    const parts=raw.split('--'+boundary).filter(p=>p.includes('Content-Type:'));
    const partContent=p=>p.substring(p.indexOf('\r\n\r\n')+4).replace(/\r\n$/,'');
    const meta=JSON.parse(partContent(parts[0])),body=partContent(parts[1]);
    const id='cloud-'+(++seq);
    files.set(id,{id,name:meta.name,mimeType:meta.mimeType,parent:meta.parents?.[0]||'root',
     body,version:'1',modifiedTime:new Date().toISOString()});
    return reply({id});
   }
   if(method==='PATCH'&&path.startsWith('/upload/drive/v3/files/')){
    const item=files.get(path.split('/').pop());if(!item)return reply({error:{message:'Missing'}},404);
    item.body=req.postData()||'';item.version=String(Number(item.version)+1);
    item.modifiedTime=new Date().toISOString();return reply({id:item.id,name:item.name,modifiedTime:item.modifiedTime});
   }
   if(method==='GET'&&path.startsWith('/drive/v3/files/')&&url.searchParams.get('alt')==='media'){
    const item=files.get(path.split('/').pop());if(!item)return reply({error:{message:'Missing'}},404);
    return route.fulfill({status:200,contentType:'application/json',body:item.body});
   }
   return reply({error:{message:'Unexpected mock Drive request: '+method+' '+url.href}},400);
  });
 };
 async function openPage(path,property){
  const p=await context.newPage();pages.push(p);await mockGoogle(p);
  p.on('console',msg=>{if(msg.type()==='error'&&/Cloud entry|cloud deps|Cannot read/.test(msg.text()))console.warn('PAGE',path,msg.text())});
  await p.goto(base+path,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(prop=>!!window[prop]&&!!window.google?.accounts?.oauth2,{timeout:45000},property);
  return p;
 }
 try{
  for(const [path,entry] of [
   ['/mainkan/flow-editor.html','MainkanCloudEntry'],
   ['/emotion-studio/','EmosiCloudEntry'],
   ['/jiwa/','JiwaCloudEntry']
  ]){
   const page=await openPage(path,entry);
   await page.evaluate(()=>localStorage.setItem('cloud-regression-sentinel','PRESERVE'));
   assert.equal(await page.locator('[aria-label="Cloud startup"]').count(),1);
   await page.getByRole('button',{name:/SYNC FROM DRIVE/i}).first().click();
   await page.waitForFunction(prop=>window[prop]?.gate?.isReady?.()===true,{timeout:40000},entry);
   assert.equal(await page.evaluate(()=>localStorage.getItem('cloud-regression-sentinel')),'PRESERVE');
   console.log('PASS '+entry+' Google OAuth + Drive folder sync, browser data retained');
   if(entry==='MainkanCloudEntry'){
    await page.locator('#flowName').fill('Cloud Test Flow');
    await page.locator('#flowName').dispatchEvent('change');
    await page.waitForFunction(()=>document.querySelector('#mainkan-cloud-tools')?.textContent.includes('LATEST ON DRIVE'),
     {timeout:20000});
    assert.ok([...files.values()].some(f=>f.name==='flow--main-flow.json'),'Mainkan flow missing on Drive');
    console.log('PASS Mainkan Flow Editor delayed verified cloud autosave');
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:/UNIVERSAL/i}).last().click();
    const saved=await download;
    assert.match(saved.suggestedFilename(),/membangun-mainkan-universal/);
    console.log('PASS Mainkan Universal download');
   }
  }
  const second=await openPage('/mainkan/flow-editor.html','MainkanCloudEntry');
  await second.getByRole('button',{name:/SYNC FROM DRIVE/i}).first().click();
  await second.waitForFunction(()=>window.MainkanCloudEntry.gate.isReady());
  assert.equal(await second.locator('#flowName').inputValue(),'Cloud Test Flow');
  console.log('PASS new browser page loaded newest verified Mainkan flow from Drive');
  assert.equal(deleteCalls,0,'Any Drive deletion is forbidden');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

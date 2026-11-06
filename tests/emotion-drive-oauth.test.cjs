'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../emotion-studio/drive-sync.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../emotion-studio/index.html'),'utf8');
test('Emotion Studio initializes Google OAuth with a defined window root',async()=>{
 let requested=0;
 const root={
  google:{accounts:{oauth2:{
   initTokenClient(args){
    assert.equal(args.scope,'https://www.googleapis.com/auth/drive.file');
    assert.match(args.client_id,/^[0-9]+-[\w-]+\.apps\.googleusercontent\.com$/);
    return {requestAccessToken(){requested++;args.callback({access_token:'mock-token',expires_in:3600})}};
   },
   hasGrantedAllScopes(){return true}
  }}},
  localStorage:{getItem(){return null},setItem(){}}
 };
 const load=new Function('window','module','localStorage',source+'\nreturn window.EmotionDrive;');
 const api=load(root,undefined,root.localStorage);
 assert.ok(api,'window.EmotionDrive should initialize');
 assert.equal(requested,0,'OAuth must wait for a user action');
 const auth=await api.connect();
 assert.equal(auth.connected,true);
 assert.equal(requested,1);
 assert.equal(api.connected(),true);
 api.disconnect();
 assert.equal(api.connected(),false);
});
test('Emotion Studio loads Drive module before its editor script',()=>{
 assert.ok(html.includes('src="./drive-sync.js?v='));
 assert.ok(html.includes('src="https://accounts.google.com/gsi/client"'));
 assert.ok(html.indexOf('src="./drive-sync.js')<html.lastIndexOf('/* Standalone Emotion Studio.'));
 assert.ok(html.includes('id="driveConnect"'));
});

test('Emosi.exe mobile exposes the same Drive actions as desktop without switching to Details',()=>{
 for(const id of ['mobileDriveConnect','mobileDriveRefresh','mobileDriveSave','mobileDriveState']){
  assert.ok(html.includes('id="'+id+'"'),id+' mobile control must exist');
 }
 const mobilePos=html.indexOf('class="emotion-mobile-drivebar"');
 const workspacePos=html.indexOf('class="emotion-workspace"');
 assert.ok(mobilePos>0&&mobilePos<workspacePos,'Drive toolbar must be outside hidden mobile workspace panels');
 assert.match(html,/\.emotion-mobile-drivebar\{display:block!important/);
 assert.match(html,/\$\("mobileDriveConnect"\)\.onclick=connectDrive/);
 assert.match(html,/\$\("mobileDriveRefresh"\)\.onclick=\(\)=>refreshDrive\(\)/);
 assert.match(html,/\$\("mobileDriveSave"\)\.onclick=saveToDrive/);
 assert.match(html,/mobile\.textContent=message/);
});

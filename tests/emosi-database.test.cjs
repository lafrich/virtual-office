const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const DB=require('../emotion-studio/database-fork.js');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'emotion-studio/index.html'),'utf8');
const launcher=fs.readFileSync(path.join(base,'membangun/index.html'),'utf8');
const validPNG='data:image/png;base64,aGVsbG8=';
test('new independent ID is collision resistant and follows existing naming schema',()=>{
 const taken=['emotion-rs-aa','emotion-rs-aa-2'];
 assert.equal(DB.newId(taken,1000,'aa'),'emotion-rs-aa-3');
 assert.match(DB.newId([],1000,'wow'),/^emotion-[a-z\d]+-wow$/);
});
test('copy keeps native frame count, all metadata except original Drive identity',()=>{
 const origin={id:'happy',name:'Happy',base:'female',frames:12,fps:8,
  png:validPNG,template:'happy',driveFileId:'abc',driveModifiedTime:'yesterday',
  cloudSyncHash:'token',customAttribute:99};
 const draft=DB.fork(origin,{id:'emotion-new-1',name:'  Happy / Experiment  ',png:validPNG});
 assert.equal(draft.id,'emotion-new-1');
 assert.equal(draft.name,'Happy / Experiment');
 assert.equal(draft.frames,12);
 assert.equal(draft.fps,8);
 assert.equal(draft.base,'female');
 assert.equal(draft.customAttribute,99);
 assert.equal(draft.driveFileId,undefined);
 assert.equal(draft.driveModifiedTime,undefined);
 assert.equal(draft.cloudSyncHash,undefined);
 assert.equal(draft.template,undefined);
 assert.equal(origin.driveFileId,'abc');
 assert.equal(origin.template,'happy');
 assert.equal(origin.id,'happy');
});
test('blank entry uses independent valid schema and no starter template',()=>{
 const blank=DB.fork(null,{id:'emotion-blank-1',name:'Blank',base:'universal',png:validPNG});
 assert.deepEqual(blank,{id:'emotion-blank-1',name:'Blank',base:'universal',
  frames:1,fps:6,png:validPNG});
});
test('fail closed on invalid formats and IDs',()=>{
 assert.throws(()=>DB.fork(null,{id:'Bad ID',name:'oops',png:validPNG}));
 assert.throws(()=>DB.fork(null,{id:'good-id',name:'oops',png:'fake-image'}));
});
test('Emosi.exe has all database controls and old inline scripts still parse',()=>{
 assert.match(html,/<title>EMOSI\.EXE/);
 for(const id of ['new','duplicateEmotion','saveAsNewTop','saveAsNew',
 'libraryNew','libraryDuplicate','newEmotionDialog','newEmotionForm',
 'newEmotionName','confirmCreate','entryKind','entryId','emotionWorkspace',
 'cloudDetails','name','base','fps','save','pixelOverlay','timeline']){
  assert.match(html,new RegExp('id="'+id+'"'),'Missing '+id);
 }
 for(const fn of ['function showDuplicateDialog','async function submitDuplicateDialog',
 'function createEmotionRecord','function newEmotion','function setWorkspaceTab',
 'DB.fork(','DB.newId(','setDirty(true)','await save()']){
  assert.ok(html.includes(fn),'Missing '+fn);
 }
 assert.match(html,/<script src="\.\/database-fork\.js/);
 assert.match(launcher,/EMOSI\.EXE/);
 assert.doesNotMatch(launcher,/EMOTION STUDIO\.EXE/);
 const scripts=[...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map(x=>x[1]).filter(Boolean);
 for(const js of scripts)assert.doesNotThrow(()=>new Function(js));
});

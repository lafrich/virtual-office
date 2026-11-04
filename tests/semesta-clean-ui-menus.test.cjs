'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../world-builder');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const builder=fs.readFileSync(path.join(root,'builder.js'),'utf8');
function button(id){
 const escaped=id.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');
 const regex=new RegExp('<button\\b(?=[^>]*\\bid="'+escaped+'")[^>]*>', 'i');
 const m=html.match(regex);assert(m,'button exists for event binding '+id);return m[0];
}
test('requested legacy top menus are visually removed but remain addressable by existing handlers',()=>{
 for(const id of ['export','import','reset','openVirtualAssets','membangunHome','buildingStudio','openGame'])
  assert.match(button(id),/\bhidden\b/,id+' hidden');
});
test('footer duplicate My Cities and Export JSON are removed from display',()=>{
 for(const id of ['manageDrafts','exportShortcut'])
  assert.match(button(id),/\bhidden\b/,id+' hidden');
 assert(!html.includes('V/L<br>MAP'),'old left-side V/L MAP badge gone');
});
test('Save City and My Cities stay available on top; existing city editing is intact',()=>{
 for(const id of ['saveDraftMenu','openDraftMenu','saveCityDraft']){
  assert.doesNotMatch(button(id),/\bhidden\b/,id+' remains visible');
 }
 assert.match(builder,/\$\('saveDraftMenu'\)\.onclick/);
 assert.match(builder,/\$\('openDraftMenu'\)\.onclick=openDraftDialog/);
 assert.match(builder,/\$\('manageDrafts'\)\.onclick=openDraftDialog/);
 assert.match(builder,/\$\('exportShortcut'\)\.onclick/);
 assert.match(builder,/\$\('reset'\)\.onclick/);
 assert.match(builder,/\$\('export'\)\.onclick/);
 assert.match(builder,/\$\('import'\)\.onclick/);
 assert.match(html,/id="assetList"/);
 assert.match(html,/id="canvasPanel"/);
 assert.match(html,/id="draftDialog"/);
});
test('hidden buttons are actually hidden on mobile and desktop',()=>{
 const css=fs.readFileSync(path.join(root,'xp.css'),'utf8');
 assert.match(css,/\[hidden\]\{display:none!important\}/);
});

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder/bangun-ruang');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const creator=fs.readFileSync(path.join(root,'pixel-object-creator.js'),'utf8');
const bridge=fs.readFileSync(path.join(root,'object-bridge.js'),'utf8');
const PNG='data:image/png;base64,aGVsbG8=';

test('Pixel Creator buttons are persistent and directly wired in source HTML',()=>{
 for(const id of ['openObjectPixelCreator','openObjectCreatorShelf']){
  assert.match(html,new RegExp('id="'+id+'"[^>]*onclick="window\\.openBangunPixelCreator\\(event\\)"'));
 }
 assert.match(html,/window\.openBangunPixelCreator=async function/);
 assert.match(html,/pixel-object-creator\.js\?v=creator-(?:grid-xp-v1|fix2)/);
});
test('object bridge registers all built-in metadata without blocking on canvas rasterization',()=>{
 const window={VLAssetCatalog:[{file:'pipeline:source',source:'pipeline-street'}],VLBuildingInterior:{types:{wc:{label:'WC',w:1,d:1,actions:['use_toilet']}}}};
 const localStorage={getItem:()=>null};
 const document={createElement:()=>{throw Error('Eager rendering blocked UI initialization');}};
 vm.runInNewContext(bridge,{window,localStorage,document,console});
 assert.equal(window.VLBangunObjects.builtins.length,7);
 assert.equal(window.VLAssetCatalog.filter(x=>x.source==='bangun-object').length,7);
 assert.ok(window.VLAssetCatalog.some(x=>x.file==='object:furniture-wc'));
});
test('Pixel Creator initializes and opens a modal with either static-button entry point',()=>{
 const els=new Map();
 class El{
  constructor(tag,id=''){this.tagName=tag;this.id=id;this.children=[];this.style={};
   this.classList={toggle(){},add(){}};this.value='';this.width=96;this.height=144;
   this.isConnected=true;this.open=false;this.attrs={};this.disabled=false;this.hidden=false;}
  set innerHTML(markup){for(const match of markup.matchAll(/<([a-z]+)[^>]*?\bid="([^"]+)"[^>]*>/g))
   els.set(match[2],new El(match[1],match[2]));}
  append(...children){this.children.push(...children);for(const child of children)if(child.id)els.set(child.id,child);}
  appendChild(child){this.append(child);return child;}
  replaceChildren(){this.children=[];}
  addEventListener(){}
  setAttribute(name,value){this.attrs[name]=value;}
  querySelectorAll(){return [];}
  hasAttribute(attr){return attr==='onclick'&&['openObjectPixelCreator','openObjectCreatorShelf'].includes(this.id);}
  showModal(){this.open=true;}
  getContext(){return {clearRect(){},drawImage(){},fillRect(){},fillText(){},
   getImageData:()=>({data:new Uint8Array(this.width*this.height*4)})};}
  toDataURL(){return PNG;}
 }
 for(const id of ['openObjectPixelCreator','openObjectCreatorShelf','exportBtn','status'])
  els.set(id,new El('button',id));
 const document={getElementById:id=>els.get(id)||null,querySelector:()=>new El('nav'),
  createElement:tag=>new El(tag),head:new El('head'),body:new El('body')};
 const window={VLBangunObjects:{categories:{decor:{label:'Decorations',group:'Decorations',
  guide:'2:1 scale',defaultFootprint:[1,1],collision:false}},
  builtins:[{id:'park-lamp',name:'Lamp',category:'decor',footprint:[1,1],collision:false}],
  image:()=>PNG,read:()=>[],valid:()=>true}};
 const persisted=new Map();const localStorage={getItem:key=>persisted.get(key)||null,setItem:(k,v)=>persisted.set(k,v)};
 vm.runInNewContext(creator,{window,document,localStorage,Image:El,console});
 assert.equal(typeof window.VLPixelCreator?.open,'function');
 assert.equal(els.get('openObjectPixelCreator').id,'openObjectPixelCreator');
 window.VLPixelCreator.open();
 assert.equal(els.get('objectPixelDialog').open,true);
 assert.match(els.get('opcStatus').textContent,/New object/);
 assert.match(els.get('opcGridToggle').textContent,/Grid ON/);
 assert.match(els.get('opcRefToggle').textContent,/Character ON/);
 assert.equal(els.get('opcGridOverlay').style.display,'block');
 els.get('opcGridToggle').onclick();
 assert.match(els.get('opcGridToggle').textContent,/Grid OFF/);
 assert.equal(els.get('opcGridOverlay').style.display,'none');
 els.get('opcGridToggle').onclick();
 els.get('opcGridSize').value='16';els.get('opcGridSize').onchange();
 assert.match(els.get('opcGridOverlay').style.backgroundSize,/16\.666/);
 els.get('opcRefToggle').onclick();
 assert.match(els.get('opcRefToggle').textContent,/Character OFF/);
 assert.equal(els.get('opcReferencePanel').style.display,'none');
 els.get('opcRefToggle').onclick();
 assert.equal(els.get('opcReferencePanel').style.display,'block');
 assert.ok(els.get('opcCharacterCanvas'),'native 64x112 reference frame is mounted');
 assert.match(creator,/linear-gradient\(90deg,#042777/,'Windows XP titlebar is shared');
 assert.doesNotThrow(()=>window.VLPixelCreator.open());
});

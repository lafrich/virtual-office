const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const sources=['interior-model.js','interior-isometric.js','object-bridge.js']
 .map(f=>fs.readFileSync(path.join(__dirname,'../world-builder/bangun-ruang',f),'utf8'));
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
const DIR=['sw','se','ne','nw'];
function runtime(){
 const store=new Map();
 function canvas(){
  const c={width:300,height:300};
  c.getContext=()=>({
   imageSmoothingEnabled:false,fillStyle:'#fff',
   fillRect(){},drawImage(){},clearRect(){},
   getImageData(){const a=new Uint8ClampedArray(c.width*c.height*4);a[(Math.floor(c.height/2)*c.width+Math.floor(c.width/2))*4+3]=255;return {data:a};}
  });
  c.toDataURL=()=>PNG;return c;
 }
 const window={VLAssetCatalog:[{file:'pipeline:existing',source:'pipeline-street'}]};
 const localStorage={
  getItem(key){return store.get(key)||null;},
  setItem(key,value){store.set(key,value);}
 };
 const context={window,document:{createElement:type=>{assert.equal(type,'canvas');return canvas();}},localStorage,console};
 for(const source of sources)vm.runInNewContext(source,context);
 return window;
}
const sample=(id='obj-my-lamp')=>({
 id,name:'Custom Park Lamp',category:'lamp',footprint:[1,1],collision:false,
 views:Object.fromEntries(DIR.map(d=>[d,{url:PNG,size:[48,96],pivot:[24,90]}]))
});

test('all 18 interior props and 6 street props appear in Semesta catalog',()=>{
 const w=runtime(),items=w.VLBangunObjects.builtins;
 assert.equal(items.length,24);
 for(const id of ['furniture-wc','furniture-chair','furniture-bed','furniture-office_chair','park-lamp','park-bench','potted-plant']){
  const spec=w.VLAssetCatalog.find(a=>a.file==='object:'+id);
  assert.ok(spec,'missing '+id);
  assert.equal(spec.source,'bangun-object');
  assert.equal(spec.published,true);
  assert.equal(Object.keys(spec.variants).length,4);
  for(const d of DIR)assert.ok(w.VLBangunObjects.image(id,d).startsWith('data:image/png;base64,'));
 }
});
test('custom object persists with all 4 views and keeps its ID for live reload',()=>{
 const w=runtime(),api=w.VLBangunObjects;
 const obj=sample();assert.equal(api.valid(obj),true);
 api.save(obj);
 const listed=w.VLAssetCatalog.find(e=>e.file==='object:obj-my-lamp');
 assert.ok(listed);
 assert.equal(listed.objectCategory,'lamp');
 assert.equal(listed.collision,false);
 assert.deepEqual(Array.from(listed.footprint),[1,1]);
 assert.equal(api.image(obj.id,'se'),PNG);
 obj.name='Lampu Taman Custom Baru';api.save(obj);
 assert.equal(api.read().length,1);
 assert.equal(w.VLAssetCatalog.find(e=>e.file==='object:obj-my-lamp').label,obj.name);
 api.remove(obj.id);
 assert.equal(api.read().length,0);
 assert.equal(w.VLAssetCatalog.some(e=>e.file==='object:obj-my-lamp'),false);
});
test('malformed object data cannot pollute placement catalog',()=>{
 const w=runtime(),api=w.VLBangunObjects,obj=sample();
 obj.views.ne.url='javascript:alert(1)';assert.equal(api.valid(obj),false);
 assert.throws(()=>api.save(obj));
 obj.views.ne.url=PNG;obj.footprint=[1,200];assert.equal(api.valid(obj),false);
});

test('physical world height is independent from source PNG resolution',()=>{
 const w=runtime(),api=w.VLBangunObjects;
 const obj=sample('obj-real-tree');
 obj.category='plant';obj.worldHeight=5.5;
 api.save(obj);
 const spec=w.VLAssetCatalog.find(v=>v.file==='object:obj-real-tree');
 const character=api.characterWorldHeight;
 assert.ok(Math.abs(character-1.837)<.01,'character uses 72 visible px in Semesta world units');
 assert.ok(Math.abs(spec.worldHeight-5.5)<.0001);
 assert.ok(Math.abs(spec.height*(90/96)-5.5)<.0001,'sprite pivot is placed at the ground');
 assert.ok(Math.abs(spec.width-spec.height*48/96/(2/Math.sqrt(3)))<.0001,'isometric sprite aspect preserved');
 assert.ok(Math.abs(spec.worldHeight/character-3)<.05,'tree is around three character heights');
 obj.worldHeight=.1;assert.equal(api.valid(obj),false);
 obj.worldHeight=25;assert.equal(api.valid(obj),false);
});
test('older custom objects keep native world size and built-in tree uses real placement scale',()=>{
 const w=runtime(),api=w.VLBangunObjects;
 const legacy=sample('obj-legacy');
 assert.equal(legacy.worldHeight,undefined);
 api.save(legacy);
 const placed=w.VLAssetCatalog.find(v=>v.file==='object:obj-legacy');
 assert.ok(Math.abs(placed.height-96*Math.SQRT2/64*2/Math.sqrt(3))<.0001);
 const tree=w.VLAssetCatalog.find(v=>v.file==='object:small-tree');
 assert.ok(tree,'built-in tree available');
 assert.ok(Math.abs(tree.worldHeight-5.5)<.0001);
});

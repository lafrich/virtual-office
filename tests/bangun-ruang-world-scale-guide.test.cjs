const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'../world-builder/bangun-ruang');
const source=fs.readFileSync(path.join(root,'world-scale-guide.js'),'utf8');
test('real-world placement preview compares actor and object, without changing pixel artwork',()=>{
 const elements=new Map(),draws=[];
 class Element{
  constructor(tag='div',id=''){
   this.tagName=tag;this.id=id;this.value='';this.style={};this.width=96;this.height=144;
   this.isConnected=true;this.children=[];this.events={};this.attrs={};
  }
  set innerHTML(html){
   for(const match of html.matchAll(/<([a-z]+)[^>]*?\bid="([^"]+)"[^>]*>/g))
    elements.set(match[2],new Element(match[1],match[2]));
  }
  append(...nodes){this.children.push(...nodes);for(const node of nodes)if(node.id)elements.set(node.id,node);}
  insertBefore(node){this.append(node);}
  setAttribute(attr,value){this.attrs[attr]=value;}
  getAttribute(attr){return this.attrs[attr]||'true';}
  querySelector(query){
   if(query==='.opc-inspector')return inspector;
   if(query==='.opc-character-frame')return frame;
   if(query==='.opc-ref-caption')return caption;
   if(query==='button.active')return {dataset:{view:'sw'}};
   return null;
  }
  addEventListener(name,listener){this.events[name]=listener;}
  getContext(){
   const el=this;
   return {clearRect(){},fillRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},
    drawImage(...args){if(el.id==='opcWorldScaleCanvas')draws.push(args);},
    getImageData(){
     const data=new Uint8Array(el.width*el.height*4);
     if(el.id==='opcCanvas')data[(45*el.width+40)*4+3]=255;
     return {data};
    }};
  }
 }
 const dialog=new Element('dialog','objectPixelDialog'),inspector=new Element('aside','inspector');
 const panel=new Element('div','opcReferencePanel'),frame=new Element('div','frame'),caption=new Element('span','caption');
 for(const el of [dialog,panel])elements.set(el.id,el);
 const category=new Element('select','opcCategory');category.value='plant';
 const profile=new Element('select','opcReferenceProfile');profile.value='ichsan';
 const views=new Element('div','opcViews');
 const toggle=new Element('button','opcRefToggle');
 const canvas=new Element('canvas','opcCanvas');
 const collision=new Element('select','opcCollision');collision.previousElementSibling=new Element('label');
 for(const el of [category,profile,views,toggle,canvas,collision])elements.set(el.id,el);
 const document={
  getElementById:id=>elements.get(id)||null,
  createElement:tag=>new Element(tag),
  head:new Element('head')
 };
 const window={
  VLBangunObjects:{characterWorldHeight:72*Math.SQRT2/64*2/Math.sqrt(3),
   defaultWorldHeight:{plant:5.5,decor:1.6,lamp:4.7}},
  VLAssetCatalog:[{source:'bangun-object',id:'small-tree',worldHeight:5.5}]
 };
 vm.runInNewContext(source,{window,document,Image:Element,console});
 const api=window.VLPixelCreatorScale;
 assert.equal(typeof api?.render,'function');
 assert.equal(api.height(),5.5);
 assert.match(elements.get('opcWorldRatio').textContent,/2\.99×/);
 assert.ok(draws.length>0,'placement preview paints the object');
 assert.equal(caption.textContent,'PLACEMENT PREVIEW / WORLD SCALE');
 const input=elements.get('opcWorldHeight');input.value='2';
 input.events.input();
 assert.equal(api.height(),2);
 assert.match(elements.get('opcWorldRatio').textContent,/1\.09×/);
 api.load({id:'custom-lamp',category:'lamp',worldHeight:4.8},false);
 assert.equal(api.height(),4.8);
 api.load({id:'small-tree',category:'plant'},true);
 assert.equal(api.height(),5.5);
 assert.ok(elements.get('opcWorldScaleCanvas').isConnected);
});

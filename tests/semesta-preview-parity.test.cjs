const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const read=p=>fs.readFileSync('world-builder/'+p,'utf8');

test('all vehicle previews use the exact placement renderer, not a second sprite sheet',()=>{
 const art=read('semesta-traffic-art.js');
 const gallery=read('asset-library.js');
 const thumbs=read('asset-thumbnails.js');
 const builder=read('builder.js');
 assert.match(art,/function vehiclePreview\(id,dir='se'\)/);
 assert.match(art,/function vehiclePreviewAsync\(id,dir='se'\)/);
 assert.match(art,/nativeGalleryImages\.set\(key,task\)/);
 assert.match(art,/const EXACT_RIDERS=new Set\(Object\.keys\(RIDER_V3\)\)/);
 assert.match(art,/originalCache\.get\(originalKey\(id,side,0\)\)/);
 assert.match(art,/trimPreview\(vehicleCanvas\(id,side\)\)/);
 assert.match(art,/mat\.map=ready\|\|texture\(THREE,spec\.id,dir\)/);
 assert.match(gallery,/options\.vehicleImage\?\.\(s\.id,side\)/);
 assert.match(builder,/vehicleImage:\(id,dir\)=>trafficArt\?\.vehiclePreviewAsync\?\.\(id,dir\)/);
 assert.match(thumbs,/VLSemestaArt\?\.vehiclePreviewAsync\?\.\(id,'se'\)/);
 assert.doesNotMatch(builder,/vehicleImage:id=>\{/);
});

test('TransJakarta and other vehicles have a renderable single-object thumbnail',()=>{
 const palette={bus_transjakarta:'#3166b5',sedan_red:'#dc5952',gojek:'#36a36d'};
 function canvasFactory(){
  const canvas={width:0,height:0};
  const ctx={
   fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},
   arc(){},ellipse(){},translate(){},scale(){},drawImage(){},
   getImageData(){
    const d=new Uint8ClampedArray(canvas.width*canvas.height*4);
    for(let i=3;i<d.length;i+=4)d[i]=255;
    return {data:d};
   }
  };
  canvas.getContext=()=>ctx;
  canvas.toDataURL=()=>('data:image/png;base64,'+
   Buffer.from('rendered '+canvas.width+'x'+canvas.height).toString('base64'));
  return canvas;
 }
 const g={VLSemestaCatalog:{palette,vehicle(id){return{id,views:{se:'a',sw:'b',ne:'c',nw:'d'}}}},
  location:{origin:'https://lafrich.github.io'}};
 const sandbox={window:g,location:g.location,URL,document:{createElement:canvasFactory}};
 vm.runInNewContext(read('semesta-traffic-art.js'),sandbox);
 for(const id of ['bus_transjakarta','sedan_red','gojek']){
  const art=g.VLSemestaArt.vehiclePreview(id,'se');
  assert.match(art,/^data:image\/png;base64,/);
  assert.equal(g.VLSemestaArt.vehiclePreview(id,'se'),art);
  assert.match(g.VLSemestaArt.vehiclePreview(id,'nw'),/^data:image\/png;base64,/);
 }
 assert.match(g.VLSemestaArt.questPreview('pak_ogah'),/^data:image\/png;base64,/);
});

test('Native rider preview loads true v3 PNG before placing, never falls back to crude proxy art',async()=>{
 const palette={gojek:'#36a36d'};
 const nativeSizes={gojek:[60,87],gojek_pax:[54,92],maxim:[54,87],
  maxim_pax:[54,92],sma_triple:[66,96]};
 const requested=[];
 function makeCanvas(){
  const c={width:160,height:108};
  const ctx={fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},
    closePath(){},fill(){},arc(){},ellipse(){},translate(){},scale(){},drawImage(){},
    getImageData(){const d=new Uint8ClampedArray(c.width*c.height*4);
      for(let i=3;i<d.length;i+=4)d[i]=255;return{data:d};}};
  c.getContext=()=>ctx;
  c.toDataURL=()=>('data:image/png;base64,'+Buffer.from('proxy').toString('base64'));
  return c;
 }
 class NativeImage{
  set src(url){
   this._src=url;requested.push(url);
   const key=/riders_v3\/frames\/(gojek_pax|gojek|maxim_pax|maxim|sma_triple)_/.exec(url);
   if(key){[this.naturalWidth,this.naturalHeight]=nativeSizes[key[1]];queueMicrotask(()=>this.onload?.());}
   else queueMicrotask(()=>this.onerror?.());
  }
  get src(){return this._src;}
 }
 const g={VLSemestaCatalog:{palette,vehicle(id){
  return {id,views:{sw:'riders/'+id+'_sw.png',se:'riders/'+id+'_se.png',
   ne:'riders/'+id+'_ne.png',nw:'riders/'+id+'_nw.png'}};}}};
 const context={window:g,Image:NativeImage,URL,location:{origin:'https://lafrich.github.io'},
  document:{createElement:makeCanvas},setTimeout,clearTimeout};
 vm.runInNewContext(read('semesta-traffic-art.js'),context);
 const ids=Object.keys(nativeSizes);
 for(const id of ids){
  for(const dir of ['se','sw','ne','nw']){
   const png=await g.VLSemestaArt.vehiclePreviewAsync(id,dir);
   assert.match(png,new RegExp('riders_v3/frames/'+id+'_'+dir+'_f0\\.png'));
   assert.ok(!png.startsWith('data:image'),'Must not use proxy '+id+' '+dir);
  }
 }
 assert.equal(requested.length,20);
 assert.equal(await g.VLSemestaArt.vehiclePreviewAsync('gojek_pax','se'),
  'https://lafrich.github.io/virtual-life-asset-pipeline/assets/street_vehicles/riders_v3/frames/gojek_pax_se_f0.png');
 assert.equal(requested.length,20,'verified native URLs are cached');

 // When published source fails the gallery hides the broken asset; never
 // resurrect the wrong-looking fallback rider.
 class MissingImage{set src(v){queueMicrotask(()=>this.onerror?.());}}
 const second={window:{VLSemestaCatalog:g.VLSemestaCatalog},
  Image:MissingImage,URL,location:{origin:'https://lafrich.github.io'},
  document:{createElement:makeCanvas},setTimeout,clearTimeout};
 vm.runInNewContext(read('semesta-traffic-art.js'),second);
 assert.equal(await second.window.VLSemestaArt.vehiclePreviewAsync('gojek_pax','se'),null);
});

test('character preview is one correct 64x112 idle frame, not 44 atlas rows',async()=>{
 const entry={id:'human_male_base',name:'Male',sheet:'media/male.png',
  motions:[{id:'idle',row:4,frames:4,available:true}],expressions:[]};
 const g={VLMahlukHidup:{
  has:id=>id===entry.id,get:id=>id===entry.id?entry:null,
  url:path=>'https://lafrich.github.io/virtual-life-asset-pipeline/'+path,
  equipmentFor:()=>({}),get buildVersion(){return 'v1';},
  list:()=>[entry]
 },VLPipelineAssets:{characters:[]}};
 class FakeImage{
  naturalWidth=64*6;naturalHeight=112*44;
  set src(v){this._src=v;queueMicrotask(()=>this.onload?.());}
  get src(){return this._src;}
 }
 const calls=[];
 const document={createElement(type){
  assert.equal(type,'canvas');
  const cv={width:0,height:0};
  cv.getContext=()=>({
   drawImage(...args){calls.push(args);},imageSmoothingEnabled:false
  });
  cv.toDataURL=()=>('data:image/png;base64,'+Buffer.from('preview').toString('base64'));
  return cv;
 }};
 vm.runInNewContext(read('pipeline-character-rig.js'),{
  window:g,Image:FakeImage,document,setTimeout,clearTimeout,URL,console
 });
 const preview=await g.VLCharacterRig.characterPreview(entry.id,'sw');
 assert.match(preview,/^data:image\/png;base64,/);
 assert.equal(calls.length,1);
 assert.deepEqual(Array.from(calls[0].slice(1)),[0,5*112,64,112,0,0,64,112]);
 assert.equal(await g.VLCharacterRig.characterPreview(entry.id,'sw'),preview);
 const gallery=read('asset-library.js');
 assert.match(gallery,/options\.characterImage\?\.\(s\.id,side\)/);
 assert.match(gallery,/spec\.kind==='vehicle'\|\|spec\.kind==='character'/);
 assert.match(read('asset-thumbnails.js'),/VLCharacterRig\?\.characterPreview/);
 assert.doesNotMatch(read('builder.js'),/characterImage:id=>window\.VLPipelineAssets\?\.character/);
});

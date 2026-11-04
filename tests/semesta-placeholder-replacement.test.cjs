const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.runInNewContext(fs.readFileSync('world-builder/placeholder-replacement.js','utf8'),ctx);
const api=ctx.VLPlaceholderReplace;
const spec=(id,cat,foot=[1,1],published=true)=>({
 id,file:'pipeline:'+id,source:'pipeline-street',published,label:id,
 group:cat==='building'?'jalan':cat==='utility'?'prop':cat==='furniture'?'taman':'taman',
 footprint:foot,width:3,height:5,collision:true,variants:{sw:{},se:{}}
});
const cat=[
 spec('kantor_a','building',[7,6]),spec('ruko_a','building',[3,6]),
 spec('tiang_listrik','utility'),spec('lampu_taman','utility'),
 spec('bangku_taman','furniture'),spec('meja_taman','furniture'),
 spec('tong_sampah','street'),spec('gapura_gang','street'),
 {...spec('hotel','building',[8,6]),published:false},
 {id:'pohon_kiara_payung',file:'vegetation:pohon_kiara_payung',source:'pipeline-vegetation',group:'Vegetation • trees',published:true,label:'Kiara',width:2,height:3,collision:true}
];
const objs=[
 {id:'hospital',type:'building',w:8,d:6,x:2,z:4,rotation:0,scale:1,collision:true,tags:['placeholder']},
 {id:'power',type:'lamp',x:12,z:4,rotation:0,scale:1,collision:true},
 {id:'seat',type:'bench',x:15,z:4,rotation:0,scale:1,collision:true},
 {id:'park',type:'tree',x:19,z:4,rotation:0,scale:1,collision:true},
 {id:'bin',type:'box',x:22,z:4,rotation:0,scale:1,collision:true},
 {id:'real',type:'sprite',asset:'pipeline:kantor_a',x:30,z:4,rotation:0,scale:1,collision:true}
];
test('only category-compatible published sprites are shown',()=>{
 assert.deepEqual(Array.from(api.candidates(cat,'utility'),x=>x.id),['tiang_listrik','lampu_taman']);
 assert.deepEqual(Array.from(api.candidates(cat,'building'),x=>x.id),['kantor_a','ruko_a']);
 assert.deepEqual(Array.from(api.candidates(cat,'tree'),x=>x.id),['pohon_kiara_payung']);
});
test('batch building replacement preserves position and other categories',()=>{
 const r=api.replace(objs,cat,{category:'building',mode:'single',selected:['kantor_a']});
 assert.equal(r.changed,1);assert.equal(r.matched,1);
 assert.equal(r.objects[0].asset,'pipeline:kantor_a');
 assert.equal(r.objects[0].x,2);assert.equal(r.objects[0].z,4);
 for(let i=1;i<objs.length;i++)assert.equal(r.objects[i],objs[i]);
 assert.equal(r.objects[0].layer,'structure');assert.equal(r.objects[0].assetPath,undefined);
});
test('utility, furniture, tree and street placeholders replace independently',()=>{
 for(const [category,kind,id] of [['utility','power','tiang_listrik'],['furniture','seat','bangku_taman'],['tree','park','pohon_kiara_payung'],['street','bin','tong_sampah']]){
  const r=api.replace(objs,cat,{category,mode:'single',selected:[id]});
  assert.equal(r.changed,1,category);
  assert.equal(r.objects.find(x=>x.id===kind).asset,cat.find(x=>x.id===id).file);
  assert.equal(r.objects[0],objs[0],category);
 }
});
test('seed creates reproducible random mix, without changing object coordinates',()=>{
 const many=Array.from({length:20},(_,i)=>({id:String(i),type:'lamp',x:i*3,z:10}));
 const opts={category:'utility',mode:'mixed',selected:['tiang_listrik','lampu_taman'],seed:88};
 const a=api.replace(many,cat,opts),b=api.replace(many,cat,opts);
 assert.deepEqual(a.objects.map(o=>o.asset),b.objects.map(o=>o.asset));
 assert.deepEqual(a.objects.map(o=>o.x),many.map(o=>o.x));
 assert.ok(new Set(a.objects.map(o=>o.asset)).size>1);
});
test('does not expand building beyond its existing lot or override absent artwork',()=>{
 const small=[{id:'small',type:'building',w:2,d:2,x:4,z:4}];
 const r=api.replace(small,cat,{category:'building',mode:'single',selected:['kantor_a']});
 assert.equal(r.changed,0);assert.equal(r.skipped,1);
 assert.throws(()=>api.replace(objs,cat,{category:'building',mode:'single',selected:['hotel']}));
});
test('respect validation callback, skip colliding replacements and preserve objects',()=>{
 const r=api.replace(objs,cat,{category:'utility',mode:'single',selected:['tiang_listrik']},()=>false);
 assert.equal(r.changed,0);assert.equal(r.skipped,1);assert.equal(r.objects[1],objs[1]);
});

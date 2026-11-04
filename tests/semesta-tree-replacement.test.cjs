const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('world-builder/tree-replacement.js','utf8');
const context={};vm.runInNewContext(source,context);
const api=context.VLTreeReplace;
const catalog=[
 {id:'pohon_kiara_payung',file:'vegetation:pohon_kiara_payung',group:'Vegetation • trees',source:'pipeline-vegetation',published:true,label:'Kiara payung',width:2.4,height:3,collision:true},
 {id:'pohon_trembesi_M',file:'vegetation:pohon_trembesi_M',group:'Vegetation • trees',source:'pipeline-vegetation',published:true,label:'Trembesi',width:3.1,height:2.6,collision:true},
 {id:'pohon_asam_M',file:'vegetation:pohon_asam_M',group:'Vegetation • trees',source:'pipeline-vegetation',published:false,label:'Asam',width:3.2,height:4,collision:true}
];
const world=[
 {id:'a',type:'tree',name:'Park Tree',x:5,z:10,y:0,scale:1},
 {id:'b',type:'sprite',asset:'vegetation:pohon_asam_M',x:8,z:11,y:0,scale:1},
 {id:'c',type:'sprite',asset:'vegetation:pohon_kiara_payung',x:9,z:12,y:0,scale:1},
 {id:'d',type:'building',x:12,z:11},
 {id:'e',type:'virtual_asset',assetCategory:'tree',x:15,z:16}
];
test('replace placeholders only; preserve IDs and map positions',()=>{
 const r=api.replace(world,catalog,{mode:'single',species:'pohon_trembesi_M'});
 assert.equal(r.changed,3);
 assert.deepEqual([...r.objects].map(o=>[o.id,o.x,o.z]),world.map(o=>[o.id,o.x,o.z]));
 assert.equal(r.objects[2],world[2]);
 assert.equal(r.objects[3],world[3]);
 for(const o of [r.objects[0],r.objects[1],r.objects[4]])assert.equal(o.asset,'vegetation:pohon_trembesi_M');
});
test('all scope changes existing placed trees but not other objects',()=>{
 const r=api.replace(world,catalog,{scope:'all',mode:'single',species:'pohon_trembesi_M'});
 assert.equal(r.changed,4);assert.equal(r.objects[3],world[3]);
});
test('seed produces reproducible random spread',()=>{
 const opts={scope:'all',mode:'mixed',selected:['pohon_kiara_payung','pohon_trembesi_M'],seed:1234};
 const a=api.replace(world,catalog,opts),b=api.replace(world,catalog,opts);
 assert.deepEqual(a.objects.map(o=>o.asset),b.objects.map(o=>o.asset));
});
test('invalid or unpublished species cannot be selected',()=>{
 assert.throws(()=>api.replace(world,catalog,{mode:'single',species:'pohon_asam_M'}));
 assert.throws(()=>api.replace(world,catalog,{mode:'mixed',selected:['not-a-tree']}));
});

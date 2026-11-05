'use strict';
// Run: node tests/semesta-legacy-tree-upgrade.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder');
const w={},context=vm.createContext({window:w});
for(const file of ['vegetation-catalog.js','kebon-sirih-style.js','style-rules.js']){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const catalog=Array.from(w.VLVegetation.entries);
const source={map:{name:'My authored city',visualStyle:'kebon-sirih-2026-v1'},objects:[
 {id:'old-untagged-tree',type:'tree',name:'Custom tree',x:12.5,z:8.25,y:.4,scale:1.12,rotation:0},
 {id:'old-forest-tree',type:'tree',name:'Forest tree',x:20,z:4,scale:.91,tags:['forest']},
 {id:'already-native',type:'sprite',asset:'vegetation:pohon_asam_M',x:11,z:14,scale:1.1},
 {id:'original-custom-art',type:'tree',assetPath:'trees/custom.png',x:3,z:6,scale:1.1},
 {id:'untagged-building',type:'building',x:6,z:1,w:6,d:5,h:4,scale:1.1}
]};
const result=w.VLKebonSirihStyle.upgrade(source,catalog);
assert.equal(result.changed,2,'only generic legacy tree proxies are migrated');
const [tree,forest,native,vault,building]=result.map.objects;
assert.equal(tree.type,'sprite');
assert.match(tree.asset,/^vegetation:pohon_/);
assert.equal(tree.id,'old-untagged-tree');
assert.equal(tree.name,'Custom tree');
assert.equal(tree.x,12.5);assert.equal(tree.z,8.25);assert.equal(tree.y,.4);
assert.equal(tree.scale,1.12,'manual size must survive the sprite migration');
assert.equal(tree.layer,'vegetation');
assert.equal(forest.type,'sprite');
assert.equal(forest.scale,.91);
assert.match(forest.asset,/^vegetation:pohon_/);
assert.equal(native.asset,'vegetation:pohon_asam_M','existing species must not change');
assert.equal(native.scale,1.1);
assert.equal(vault.type,'tree','user-assigned original art must not be replaced');
assert.equal(vault.assetPath,'trees/custom.png');
assert.equal(building.type,'building','unrelated authored objects stay unchanged');
assert.equal(source.objects[0].type,'tree','migration must not mutate saved input');
assert.equal(w.VLKebonSirihStyle.upgrade(result.map,catalog).changed,0,
 'reopening an upgraded draft must not shuffle species');
assert.equal(w.VLWorldStyle.presets.tree,'vegetation:pohon_angsana_M',
 'new generic tree placement must use published artwork');
assert.match(fs.readFileSync(path.join(root,'builder.js'),'utf8'),
 /const preset=style\.presets\[type\],chosen=preset\?'sprite:'\+preset:type/);
console.log('Semesta legacy tree migration and native new placement: PASS');

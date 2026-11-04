const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const window={location:{href:'https://lafrich.github.io/virtual-office/world-builder/'}};
const mocks={
 VLBuildingBridge:{image:(id,dir)=>id==='studio-1'?'data:image/png;base64,AA==':null},
 VLBangunObjects:{image:(id,dir)=>id==='lampu-1'?'data:image/png;base64,AQ==':null},
 VLAssetThumbnails:undefined,
 VLSemestaArt:{vehiclePreview(id,dir){return 'data:image/png;base64,Ag=='},vehicleCanvas(id,dir){return {toDataURL(){return 'data:image/png;base64,Ag=='}};}},
 VLSemestaCatalog:{vehicle(id){return {id,footprint:[2.5,1]}}},
 VLKebonSirihStyle:{tileUrl(k){return 'https://example.com/terrain/'+k+'.png'}}
};
Object.assign(window,mocks);
vm.runInNewContext(fs.readFileSync('world-builder/asset-thumbnails.js','utf8'),{window,URL});
const api=window.VLAssetThumbnails;
const byName=new Map([
 ['pipeline:rumah_a',{file:'pipeline:rumah_a',id:'rumah_a',label:'Rumah A',
 source:'pipeline-street',published:true,footprint:[3,3.2],
 variants:{sw:{file:'kampung/rumah_kampung_a_sw.png'}}}],
 ['vegetation:pohon_meranti',{file:'vegetation:pohon_meranti',id:'pohon_meranti',
 source:'pipeline-vegetation',published:true,relativeFile:'trees/pohon_meranti.png',
 footprint:[1.25,1.25]}],
 ['pipeline:unpublished',{file:'pipeline:unpublished',id:'unpublished',source:'pipeline-street',
 published:false,variants:{sw:{file:'props/not-published.png'}}}],
 ['studio:studio-1',{file:'studio:studio-1',id:'studio-1',source:'custom-building'}],
 ['object:lampu-1',{file:'object:lampu-1',id:'lampu-1',source:'bangun-object'}]
]);
test('all published pipeline buildings show the EXACT upstream sw image',()=>{
 const d=api.describe({tag:'sprite:pipeline:rumah_a',category:'building',title:'Rumah A'},byName);
 assert.equal(d.url,'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/street_buildings/kampung/rumah_kampung_a_sw.png');
 assert.equal(d.footprint,'3×3.2 tiles');assert.equal(d.source,'PIXEL PIPELINE');
});
test('published trees load corresponding real PNG, no generic art',()=>{
 const d=api.describe({tag:'sprite:vegetation:pohon_meranti',category:'vegetation'},byName);
 assert.equal(d.url,'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/vegetation_kebonsirih/trees/pohon_meranti.png');
 assert.equal(d.fallback,'♣');
});
test('unpublished asset and GPT originals never invent PNG URLs',()=>{
 assert.equal(api.describe({tag:'sprite:pipeline:unpublished',category:'street'},byName).url,null);
 assert.equal(api.describe({tag:'sprite:street2/nonexistent.png',category:'street'},byName).url,null);
});
test('Bangun Ruang custom building and pixel prop use their own registered image',()=>{
 assert.equal(api.describe({tag:'sprite:studio:studio-1',category:'building'},byName).url,'data:image/png;base64,AA==');
 assert.equal(api.describe({tag:'sprite:object:lampu-1',category:'street'},byName).url,'data:image/png;base64,AQ==');
});
test('roads, pavements and vehicles have preview art and sizing',()=>{
 const road=api.describe({tag:'terrain:road',category:'terrain'},byName);
 assert.equal(road.url,'https://example.com/terrain/road_asphalt.png');
 const car=api.describe({tag:'vehicle:sedan_red',category:'vehicles'},byName);
 assert.equal(car.url,'data:image/png;base64,Ag==');
 assert.equal(car.footprint,'2.5×1 tiles');
});
test('UI keeps existing click-to-place and replace control; thumbnails lazy-load',()=>{
 const builder=fs.readFileSync('world-builder/builder.js','utf8');
 const html=fs.readFileSync('world-builder/index.html','utf8');
 const css=fs.readFileSync('world-builder/xp.css','utf8');
 assert.ok(html.includes('id="assetViewList"')&&html.includes('id="assetViewGrid"'));
 assert.ok(html.includes('id="assetPreview"'));
 assert.ok(html.indexOf('asset-thumbnails.js')<html.indexOf('builder.js?v='));
 assert.ok(builder.includes('assignAssetImage(picture,noPicture,meta.url,true)'));
 assert.ok(builder.includes('btn.addEventListener(\'pointerenter\',()=>previewAssetCard(a,meta))'));
 assert.ok(builder.includes("placementType=a.tag;setMode('place')"));
 assert.ok(builder.includes("closeMobileSheets()"));
 assert.ok(css.includes('#assetList[data-view="grid"]'));
 assert.ok(css.includes('image-rendering:pixelated'));
});

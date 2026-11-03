/* Canonical base list for Bangun Ruang, read directly from Semesta's live
 * VLPipelineAssets.prefabs and its three native placeholder footprints.
 * No copied sprite pixels and no writes to Virtual Life.
 */
(function(g){
'use strict';
const nativeSizes=Object.freeze([
 {id:'semesta:small',label:'Small Building · 3×3',group:'placeholder',kind:'rumah',
  footprint:[3,3],height:3.8,floors:1,wall:'cream',roof:'terracotta',roofShape:'gable',detail:'simple'},
 {id:'semesta:medium',label:'Medium Building · 5×4',group:'placeholder',kind:'ruko',
  footprint:[5,4],height:6.2,floors:2,wall:'concrete',roof:'slate',roofShape:'flat',detail:'storefront'},
 {id:'semesta:large',label:'Large Building · 8×6',group:'placeholder',kind:'kantor',
  footprint:[8,6],height:10.5,floors:3,wall:'blue',roof:'navy',roofShape:'flat',detail:'storefront'}
]);
const descriptions={
 kantor_a:['kantor',5,'blue','navy','flat','storefront'],
 kantor_b:['kantor',8,'blue','slate','flat','storefront'],
 indomaret:['warung',1,'cream','slate','flat','storefront'],
 ruko_a:['ruko',3,'cream','slate','flat','storefront'],
 ruko_b:['ruko',2,'green','slate','flat','storefront'],
 ruko_c:['ruko',3,'pink','slate','flat','storefront'],
 bank_bca:['kantor',2,'blue','slate','flat','storefront'],
 hotel:['kost',6,'cream','terracotta','flat','storefront'],
 mall:['kantor',4,'concrete','navy','flat','storefront'],
 kafe_blue_doors:['warung',1,'blue','slate','flat','storefront'],
 toko_loak:['warung',1,'cream','terracotta','gable','awning'],
 warung_madura:['warung',1,'green','navy','gable','awning'],
 rumah_kampung_a:['rumah',1,'cream','terracotta','gable','simple'],
 rumah_kampung_b:['rumah',1,'pink','slate','gable','simple'],
 pos_ronda:['rumah',1,'cream','terracotta','gable','simple']
};
const upstream=(g.VLPipelineAssets?.prefabs||[]);
const pipeline=upstream.filter(x=>Object.hasOwn(descriptions,x.id)).map(x=>{
 const [kind,floors,wall,roof,roofShape,detail]=descriptions[x.id];
 return Object.freeze({
  id:'pipeline:'+x.id,label:x.label,group:x.group,kind,
  footprint:[...x.footprint],height:x.height,
  floors,wall,roof,roofShape,detail,
  variants:x.variants,source:'semesta-pipeline-metadata',published:x.published===true,
  assetSource:x.file
 });
});
const all=Object.freeze([...nativeSizes.map(x=>Object.freeze(x)),...pipeline]);
g.VLSemestaBuildingSpecs=Object.freeze({
 all,byId(id){return all.find(x=>x.id===id)||null;},
 native:Object.freeze(nativeSizes.map(x=>x.id)),
 tilePixels:Object.freeze([64,32]),
 coordinates:'c/r',
 directions:Object.freeze(['sw','se','ne','nw']),
 source:'world-builder/pipeline-catalog.js + world-builder/builder.js BUILD_SIZES'
});
})(window);

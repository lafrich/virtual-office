/* L3D / native 3D library intake. Runs after static asset catalog loads,
 * before Semesta builder captures its catalog. Additive, never overwrites PNGs.
 */
(function(g){
 'use strict';
 const lib=g.VLL3DLibrary;
 if(!lib)return;
 const existing=g.VLAssetCatalog||[];
 const l3d=lib.catalogEntries().filter(a=>!existing.some(s=>s.file===a.file));
 g.VLAssetCatalog=Object.freeze([...existing,...l3d.map(Object.freeze)]);
 g.VLSemestaL3DIntake=Object.freeze({count:l3d.length,version:1});
})(window);

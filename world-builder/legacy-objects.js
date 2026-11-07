/* Virtual Life legacy search props and spots.
 * Pickup items now come from Loak Objects v2 (see loak-v2-adapter.js)
 * so the 37 preserved types are not registered twice.
 */
(function(root){
'use strict';
const entries = [
  {
    "file": "legacy/virtual-life-legacy/props/tong_sampah_besi_sw.png",
    "label": "Tong sampah",
    "width": 2.22,
    "height": 3.09,
    "pivotY": 0.79,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "tong_sampah_besi_sw",
    "collision": true,
    "source": "legacy-local",
    "relativeFile": "props/tong_sampah_besi_sw.png",
    "url": "./legacy-assets/virtual-life-legacy/props/tong_sampah_besi_sw.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/props/got_kecil_sw.png",
    "label": "Got kecil (selokan)",
    "width": 5.33,
    "height": 2.18,
    "pivotY": 0.5,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "got_kecil_sw",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "props/got_kecil_sw.png",
    "url": "./legacy-assets/virtual-life-legacy/props/got_kecil_sw.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/props/tong_sampah_besi_se.png",
    "label": "Tong sampah",
    "width": 2.67,
    "height": 2.82,
    "pivotY": 0.89,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "tong_sampah_besi_se",
    "collision": true,
    "source": "legacy-local",
    "relativeFile": "props/tong_sampah_besi_se.png",
    "url": "./legacy-assets/virtual-life-legacy/props/tong_sampah_besi_se.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/props/tumpukan_kardus_sw.png",
    "label": "Tumpukan kardus",
    "width": 2.89,
    "height": 2.86,
    "pivotY": 0.86,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "tumpukan_kardus_sw",
    "collision": true,
    "source": "legacy-local",
    "relativeFile": "props/tumpukan_kardus_sw.png",
    "url": "./legacy-assets/virtual-life-legacy/props/tumpukan_kardus_sw.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/props/got_kecil_se.png",
    "label": "Got kecil (selokan)",
    "width": 5.33,
    "height": 2.18,
    "pivotY": 0.5,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "got_kecil_se",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "props/got_kecil_se.png",
    "url": "./legacy-assets/virtual-life-legacy/props/got_kecil_se.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/props/kantong_kresek_se.png",
    "label": "Kantong kresek di sudut",
    "width": 2.33,
    "height": 1.64,
    "pivotY": 0.75,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "kantong_kresek_se",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "props/kantong_kresek_se.png",
    "url": "./legacy-assets/virtual-life-legacy/props/kantong_kresek_se.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/props/karung_rongsok_se.png",
    "label": "Karung rongsokan",
    "width": 2.44,
    "height": 2.41,
    "pivotY": 0.85,
    "group": "Virtual Life Legacy",
    "category": "props",
    "legacyId": "karung_rongsok_se",
    "collision": true,
    "source": "legacy-local",
    "relativeFile": "props/karung_rongsok_se.png",
    "url": "./legacy-assets/virtual-life-legacy/props/karung_rongsok_se.png",
    "interactive": true,
    "interactions": [
      "search",
      "inspect"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s1_tong_sampah_besi_sw.png",
    "label": "Search spot s1 \u00b7 trotoar",
    "width": 2.22,
    "height": 3.09,
    "pivotY": 0.79,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s1",
    "spotArea": "trotoar",
    "spotProp": "tong_sampah_besi",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s1_tong_sampah_besi_sw.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s1_tong_sampah_besi_sw.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s2_got_kecil_sw.png",
    "label": "Search spot s2 \u00b7 jalan",
    "width": 5.33,
    "height": 2.18,
    "pivotY": 0.5,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s2",
    "spotArea": "jalan",
    "spotProp": "got_kecil",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s2_got_kecil_sw.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s2_got_kecil_sw.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s3_tong_sampah_besi_se.png",
    "label": "Search spot s3 \u00b7 belakang_indomaret",
    "width": 2.67,
    "height": 2.82,
    "pivotY": 0.89,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s3",
    "spotArea": "belakang_indomaret",
    "spotProp": "tong_sampah_besi",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s3_tong_sampah_besi_se.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s3_tong_sampah_besi_se.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s4_tumpukan_kardus_sw.png",
    "label": "Search spot s4 \u00b7 sekitar_warung",
    "width": 2.89,
    "height": 2.86,
    "pivotY": 0.86,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s4",
    "spotArea": "sekitar_warung",
    "spotProp": "tumpukan_kardus",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s4_tumpukan_kardus_sw.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s4_tumpukan_kardus_sw.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s5_got_kecil_se.png",
    "label": "Search spot s5 \u00b7 gang",
    "width": 5.33,
    "height": 2.18,
    "pivotY": 0.5,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s5",
    "spotArea": "gang",
    "spotProp": "got_kecil",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s5_got_kecil_se.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s5_got_kecil_se.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s6_kantong_kresek_se.png",
    "label": "Search spot s6 \u00b7 gang",
    "width": 2.33,
    "height": 1.64,
    "pivotY": 0.75,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s6",
    "spotArea": "gang",
    "spotProp": "kantong_kresek",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s6_kantong_kresek_se.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s6_kantong_kresek_se.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  },
  {
    "file": "legacy/virtual-life-legacy/spots/s7_karung_rongsok_se.png",
    "label": "Search spot s7 \u00b7 gang",
    "width": 2.44,
    "height": 2.41,
    "pivotY": 0.85,
    "group": "Virtual Life Legacy",
    "category": "spots",
    "legacyId": "s7",
    "spotArea": "gang",
    "spotProp": "karung_rongsok",
    "collision": false,
    "source": "legacy-local",
    "relativeFile": "spots/s7_karung_rongsok_se.png",
    "url": "./legacy-assets/virtual-life-legacy/spots/s7_karung_rongsok_se.png",
    "interactive": true,
    "interactions": [
      "search"
    ],
    "jiwaAction": "search",
    "front": null
  }
];
function image(specOrId, _view){
  if(specOrId && typeof specOrId === 'object'){
    return specOrId.url || ('./legacy-assets/virtual-life-legacy/' + (specOrId.relativeFile||''));
  }
  const hit = entries.find(e => e.legacyId===specOrId || e.file===specOrId);
  return hit ? hit.url : '';
}
const prev = root.VLAssetCatalog || [];
if(!root.__vlLegacyMerged){
  root.VLAssetCatalog = Object.freeze([].concat(prev, entries));
  root.__vlLegacyMerged = true;
}
root.VLLegacyObjects = Object.freeze({
  entries,
  image,
  count: entries.length,
  groups: {props: entries.filter(e=>e.category==='props').length,
           items: 0,
           spots: entries.filter(e=>e.category==='spots').length}
});
})(typeof window!=='undefined'?window:this);

/* Shared predicate: only the official NJH Semesta map (and user drafts of it) may be opened. */
(function(g){
'use strict';
const NJH_CITY_IDS=['city-njh-semesta-draft1-with-pending','njh-semesta-map-draft1'];
function isNjhDocument(input,id){
 const rec=(input&&input.record)||input||{};
 const doc=(rec&&rec.document)||(input&&Array.isArray(input.objects)?input:null)||{};
 const cid=String(id||(input&&input.id)||rec.id||'');
 if(NJH_CITY_IDS.includes(cid))return true;
 const name=String((doc.map&&doc.map.name)||rec.name||'');
 if(name.includes('Kampung Kali Kebon Sirih'))return true;
 const objs=doc.objects||[];
 return objs.some(o=>o&&(o.id==='njh-kos-noor'||String(o.id||'').startsWith('njh-spawn-')));
}
g.VLNjhCityGuard=Object.freeze({isNjhDocument,NJH_CITY_IDS});
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:{});

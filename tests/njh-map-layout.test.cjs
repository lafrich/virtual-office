'use strict';
// NJH official map layout guard: no overlaps, clear doors/use tiles/spawns, one connected
// walk network, actors on legal terrain. Logic lives in njh-map-layout-check.cjs.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {check}=require('./njh-map-layout-check.cjs');
test('NJH map has no overlaps, blocked tiles, cut-off walk surface or misplaced actors',()=>{
 const {issues,missing}=check();
 assert.deepEqual(missing,[],'every used asset is in catalog-snapshot.json');
 for(const [rule,list] of Object.entries(issues))
  assert.deepEqual(list,[],rule+' must be empty: '+JSON.stringify(list.slice(0,5)));
});

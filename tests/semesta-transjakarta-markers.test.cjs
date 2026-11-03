'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder');
const get=p=>fs.readFileSync(path.join(root,p),'utf8'),w={};
const ctx=vm.createContext({window:w});
for(const p of ['semesta-traffic-catalog.js','style-rules.js','semesta-traffic-flow.js'])
 vm.runInContext(get(p),ctx,{filename:p});
const bus=w.VLSemestaCatalog.vehicle('bus_transjakarta');
assert.equal(bus.footprint[0],6.6);
assert.equal(bus.editorFootprint[0],2);
assert.equal(bus.editorFootprint[1],1);
assert.deepEqual(Array.from(w.VLWorldStyle.footprint({
 type:'vehicle',vehicleId:'bus_transjakarta',scale:1,motion:{direction:'east'}
 },new Map())),[2,1]);
assert.equal(w.VLSemestaTrafficFlow.lengthOf({vehicleId:'bus_transjakarta'}),2);
assert.match(get('semesta-traffic-art.js'),/spec\.editorArtScale/);
const engine=get('builder.js'),html=get('index.html');
for(const id of ['markerVisibility','markerVisibilityTool','markerPicker','markerFind',
 'markerDelete','markerDeleteAll']) assert.match(html,new RegExp('id="'+id+'"'));
assert.match(engine,/function setMarkerVisible\(/);
assert.match(engine,/function refreshMarkerManager\(/);
assert.match(engine,/const radius=isTouch\?27:20/);
assert.match(engine,/new THREE\.CylinderGeometry\(\.48,\.48,1\.4,8\)/);
assert.match(engine,/documentMap\.objects=documentMap\.objects\.filter\(o=>o\.type!=='marker'\)/);
assert.match(engine,/undoPoint\(\)/);
console.log('Semesta compact TransJakarta + yellow marker controls: PASS');

'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..','world-builder');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const window={};const context=vm.createContext({window});
for(const p of ['semesta-traffic-catalog.js','semesta-traffic.js','semesta-vehicle-placement.js','style-rules.js','map-schema.js'])
 vm.runInContext(read(p),context,{filename:p});

const placement=window.VLSemestaVehiclePlacement;
assert.equal(placement.scale(1.62),1.62);
assert.equal(placement.scale(8),2.5);
assert.equal(placement.scale(.1),.45);
assert.equal(placement.scale(NaN),1);
assert.deepEqual(JSON.parse(JSON.stringify(placement.offset({x:1.24,y:-.3,z:99}))),{x:1.24,y:-.3,z:3});
const car={id:'car-1',type:'vehicle',vehicleId:'bus_transjakarta',name:'Bus',x:5.5,y:0,z:2.5,
 rotation:0,scale:1.6,visualOffset:{x:.25,y:.42,z:-.15},
 motion:{mode:'road',direction:'east',speed:3,enabled:true}};
window.VLWorldStyle.normalize(car,new Map());
window.VLMapSchema.normalize(car,new Map(),window.VLWorldStyle);
assert.equal(car.scale,1.6,'schema must preserve visual scale');
assert.equal(car.visualOffset.y,.42,'schema must preserve vertical visual adjustment');
assert.deepEqual(Array.from(window.VLWorldStyle.footprint(car,new Map())),[2,1],
 'bus collision footprint must remain exactly 2x1 when artwork is rescaled');
car.scale=2.5;
assert.deepEqual(Array.from(window.VLWorldStyle.footprint(car,new Map())),[2,1],
 'max visual scaling does not change road occupancy');
const group={position:{set(x,y,z){this.x=x;this.y=y;this.z=z;}}};
placement.apply(group,car);
assert.ok(Math.abs(group.position.x-.25/2.5)<1e-6);
assert.ok(Math.abs(group.position.y-.42/2.5)<1e-6);
assert.ok(Math.abs(group.position.z+.15/2.5)<1e-6);

const ui=read('index.html'),builder=read('builder.js'),effects=read('semesta-world-effects.js'),art=read('semesta-traffic-art.js');
for(const id of ['vehicleControls','vehicleVisualScale','vehicleVisualScaleValue','vehicleOffsetX',
 'vehicleOffsetY','vehicleOffsetZ','vehicleResetVisual'])
 assert.ok(ui.includes('id="'+id+'"'),'missing vehicle inspector '+id);
assert.ok(ui.includes('semesta-vehicle-placement.js?v=vehicle-edit-v1'));
assert.ok(ui.includes('semesta-world-effects.js?v=character-contact-circle-v1'));
assert.ok(ui.includes('builder.js?v=pan-camera-v1'));
assert.match(builder,/e\.visualOffset=vehiclePlacement\.offset\(p\.visualOffset\)/,
 'visual offset must survive city draft reload and import');
assert.match(builder,/function editVehicleVisual\(/);
assert.match(builder,/visual\.add\(gfx\.mesh\)/);
assert.match(builder,/vehiclePlacement\.apply\(visual,obj\)/);
assert.match(builder,/function editVehicleVisual[\s\S]*?updateSelection\(\);[\s\S]*?saved\(\);/);
assert.match(effects,/new THREE\.CircleGeometry\(1,24\)/,'actor contact shadows are solid circles');
assert.ok(!effects.includes('createRadialGradient'),'shadow and lamp pixels must not blur');
assert.ok(!effects.includes('sun.height'),'no time-of-day shadow direction');
assert.ok(!art.includes('shadowHalf'),'vehicle art no longer draws own shadow');
console.log('PASS Vehicle visual scale/offset, persistent data, fixed road footprint and constant character shadow');

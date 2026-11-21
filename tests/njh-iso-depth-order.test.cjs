'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');

const DIR={x:1,z:1}; // matches builder direction x/z (y ignored)

test('iso foot-depth helper: closer objects get a higher render order',async()=>{
  const {isoFootDepth,isoRenderOrder,shouldDrawInFront}=await import(path.join(base,'world-builder/njh-iso-depth.js'));
  const behind={x:0,z:0}, front={x:2,z:2};
  assert.ok(isoFootDepth(front.x,front.z,DIR)>isoFootDepth(behind.x,behind.z,DIR));
  assert.ok(isoRenderOrder(front.x,front.z,DIR)>isoRenderOrder(behind.x,behind.z,DIR));
  assert.equal(shouldDrawInFront(front,behind,DIR),true);
  assert.equal(shouldDrawInFront(behind,front,DIR),false);
  // Same tile: actor still wins because of the caller-applied bias, and
  // shouldDrawInFront treats equal feet as the actor in front.
  assert.equal(shouldDrawInFront({x:1,z:1},{x:1,z:1},DIR),true);
  assert.ok(isoRenderOrder(1,1,DIR,2)>isoRenderOrder(1,1,DIR,0));
});

test('builder applies iso foot depth and no longer announces play while Genesis is pending',()=>{
  const builder=fs.readFileSync(path.join(base,'world-builder/builder.js'),'utf8');
  assert.match(builder,/from '\.\/njh-iso-depth\.js'/);
  assert.match(builder,/function applyIsoFootDepth\(\)/);
  assert.match(builder,/isoRenderOrder\(holder\.root\.position\.x,holder\.root\.position\.z,dir,2\)/);
  assert.match(builder,/function assetGate\(/);
  assert.match(builder,/characterPending:false/);
  assert.match(builder,/__njhPlayInputLocked=true/);
});

function loadOutdoor(){
  const city=JSON.parse(fs.readFileSync(path.join(base,
    'world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
  const objects=city.record.document.objects||[];
  return objects.filter(o=>Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.z))&&o.type!=='marker')
    .map(o=>({id:o.id,type:o.type,asset:o.asset,name:o.name||o.label||o.id,x:Number(o.x),z:Number(o.z)}));
}

function loadInteriors(){
  const dir=path.join(base,'world-builder/njh-map-preview/interiors');
  const rooms=[];
  for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.interior-scene.json'))){
    const sc=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
    const items=(sc.items||[]).filter(it=>Number.isFinite(Number(it.c??it.x))||Number.isFinite(Number(it.x)));
    const furniture=items.map(it=>({
      id:it.id||it.assetId,asset:it.assetId,name:it.name||it.assetId,
      x:Number(it.usePoint?.[0]??((Number(it.c)+0.5)||Number(it.x)||0)),
      z:Number(it.usePoint?.[1]??((Number(it.r)+0.5)||Number(it.z)||0))
    }));
    rooms.push({id:sc.id||file,label:sc.label||file,width:sc.width,depth:sc.depth,furniture});
  }
  return rooms;
}

test('outdoor map: a character standing in front of a prop is drawn later than that prop',async()=>{
  const {isoRenderOrder,shouldDrawInFront}=await import(path.join(base,'world-builder/njh-iso-depth.js'));
  const props=loadOutdoor();
  assert.ok(props.length>=50,'expected the NJH outdoor map');
  let cases=0;
  for(const prop of props){
    // Stand half a tile toward the camera from the prop foot.
    const actor={x:prop.x+0.6,z:prop.z+0.6};
    assert.equal(shouldDrawInFront(actor,prop,DIR),true,prop.id);
    assert.ok(
      isoRenderOrder(actor.x,actor.z,DIR,2)>isoRenderOrder(prop.x,prop.z,DIR,0),
      'order '+prop.id
    );
    cases++;
  }
  assert.ok(cases>=50,cases);
});

test('every interior: character in front of each furniture foot draws later than the furniture',async()=>{
  const {isoRenderOrder,shouldDrawInFront}=await import(path.join(base,'world-builder/njh-iso-depth.js'));
  const rooms=loadInteriors();
  assert.ok(rooms.length>=8,'expected all interior scenes');
  let cases=0;
  for(const room of rooms){
    assert.ok(room.furniture.length>=1,room.id+' has furniture');
    for(const f of room.furniture){
      const actor={x:f.x+0.5,z:f.z+0.5};
      assert.equal(shouldDrawInFront(actor,f,DIR),true,room.id+':'+f.id);
      assert.ok(isoRenderOrder(actor.x,actor.z,DIR,2)>isoRenderOrder(f.x,f.z,DIR,0),room.id+':'+f.id);
      cases++;
    }
  }
  assert.ok(cases>=30,cases);
});

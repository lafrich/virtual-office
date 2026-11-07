'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Hub=require('../shared/hub-registry.js');
const Game=require('../shared/gameplay-schema.js');

test('shared project title is Namanya Juga Hidup: The Game',()=>{
 assert.equal(Hub.PROJECT_NAME,'Namanya Juga Hidup: The Game');
 assert.equal(Hub.project.name,'Namanya Juga Hidup: The Game');
 assert.equal(Game.PROJECT_NAME,'Namanya Juga Hidup: The Game');
 assert.equal(Game.defaultGameplay().project.name,'Namanya Juga Hidup: The Game');
});

test('isolated hubs deliver publish to local subscribers and omit heavy payloads',()=>{
 const store=new Map();
 const env={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console};
 const hub=Hub.create(env);
 const seen=[];
 hub.subscribe('world',msg=>seen.push(msg));
 const msg=hub.publish('world',{id:'city-1',action:'save',document:{huge:true},png:'LONG'});
 assert.equal(msg.topic,'world');
 assert.equal(seen.length,1);
 assert.equal(seen[0].payload.id,'city-1');
 const stamp=JSON.parse(store.get(Hub.STAMP_KEY));
 assert.equal(stamp.project.name,'Namanya Juga Hidup: The Game');
 assert.equal(stamp.topics.world.payload.document,'[omitted]');
 assert.equal(stamp.topics.world.payload.png,'[omitted]');
});

test('unknown topics are ignored and storage keys map to topics',()=>{
 const hub=Hub.create({});
 assert.equal(hub.publish('nope',{}),null);
 assert.equal(Hub.KEY_TO_TOPIC['virtual-life-bangun-ruang-v1'],'rooms');
 assert.equal(Hub.KEY_TO_TOPIC['emotion-studio-local-fallback-v1'],'emotions');
 assert.equal(Hub.KEY_TO_TOPIC['mahluk-2-library-v1'],'characters');
});

test('installMark injects a non-interactive by Lafrich label once',()=>{
 const created=[];
 const doc={
  documentElement:{},
  head:{appendChild(el){created.push(['head',el]);}},
  body:{appendChild(el){created.push(['body',el]);this.mark=el;}},
  getElementById(id){return id==='vl-lafrich-mark'?this.body.mark:null;},
  createElement(tag){return {tagName:tag,id:'',textContent:'',setAttribute(){}};}
 };
 const first=Hub.installMark(doc);
 assert.equal(first.textContent,'by Lafrich');
 assert.equal(Hub.installMark(doc),first);
 const css=created.find(x=>x[0]==='head')[1].textContent;
 assert.match(css,/pointer-events:none/);
 assert.match(css,/safe-area-inset/);
 assert.match(css,/opacity/);
});

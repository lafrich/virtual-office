const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../mainkan/offline-save.js');
function mem(){
 const db=new Map();
 return {getItem:k=>db.has(k)?db.get(k):null,
  setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k),
  dump:()=>Object.fromEntries(db)};
}
const hero={base:'genesis_male_nude',name:'Pemain',appearance:{hairStyle:'short'}};
test('offline character, life state and slots backup round-trip',()=>{
 const a=mem(),b=mem();
 assert.equal(S.putCharacter(hero,a),true);
 a.setItem(S.LIFE_KEY,JSON.stringify({schema:1,cityId:S.CITY_ID,state:{wallet:15000,visualClock:{day:2,minute:420}}}));
 a.setItem(S.SLOTS_KEY,JSON.stringify({schema:1,slots:{manual_1:{state:{wallet:15000}}}}));
 const raw=S.makeBackup(a);
 assert.equal(S.restoreBackup(raw,b),true);
 assert.deepEqual(b.dump(),a.dump());
 assert.equal(S.character(b).name,'Pemain');
 assert.equal(S.hasSave(b),true);
 assert.equal(S.clear(b),true);
 assert.equal(S.hasSave(b),false);
});
test('offline clear never deletes another player or editor data',()=>{
 const s=mem();S.putCharacter(hero,s);
 s.setItem('mainkan-character-v1:ichsan','keep');
 s.setItem('jiwa-mechanics-v1','keep');
 S.clear(s);
 assert.equal(s.getItem('mainkan-character-v1:ichsan'),'keep');
 assert.equal(s.getItem('jiwa-mechanics-v1'),'keep');
});
test('backup import rejects unknown keys and mismatched city with no writes',()=>{
 const s=mem();S.putCharacter(hero,s);
 const valid=JSON.parse(S.makeBackup(s));
 valid.records['fake-admin-key']='secret';
 assert.throws(()=>S.restoreBackup(JSON.stringify(valid),s),/tidak dikenal/);
 delete valid.records['fake-admin-key'];
 valid.cityId='other-city';
 assert.throws(()=>S.restoreBackup(JSON.stringify(valid),s),/tidak cocok/);
 assert.deepEqual(S.character(s),hero);
});
test('invalid character and corrupted state are rejected',()=>{
 const s=mem();
 assert.equal(S.putCharacter({base:'unknown',name:'Player'},s),false);
 assert.throws(()=>S.makeBackup(s),/karakter/);
 S.putCharacter(hero,s);
 const p=JSON.parse(S.makeBackup(s));
 p.records[S.LIFE_KEY]=JSON.stringify({schema:1,cityId:'wrong',state:{}});
 assert.throws(()=>S.restoreBackup(JSON.stringify(p),s),/Jiwa/);
});

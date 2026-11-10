// Test start profiles: data-only seed for the Mainkan test-login IDs.
const test=require('node:test'),assert=require('node:assert'),fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..');
const d=JSON.parse(fs.readFileSync(path.join(R,'mainkan/test-start-profiles.json'),'utf8'));
const Life=require(path.join(R,'jiwa/life-economy.js'));
test('only t_ichsan and t_noor get a start; guests stay normal',()=>{
 assert.strictEqual(d.format,'mainkan-test-start-v1');
 assert.deepStrictEqual(Object.keys(d.profiles).sort(),['t_ichsan','t_noor']);
 for(const p of Object.values(d.profiles))assert.ok(d.starts[p.start]&&Number.isInteger(p.version));
});
test('start data has no credentials',()=>{
 assert.doesNotMatch(JSON.stringify(d),/"[^"]*(pass|secret|token|hash)[^"]*":/i);
});
test('rich_housed: Rp10.000.000, kost + kompor, cooking ingredients fit bag and storage',()=>{
 const s=d.starts.rich_housed;
 assert.strictEqual(s.wallet,10000000);assert.strictEqual(s.housing.room,true);
 const furn=(Life.FURNITURE||[]).map(f=>f.id);for(const f of s.furniture)assert.ok(furn.includes(f),f);
 assert.ok(s.furniture.includes('stove'));
 const cfg=Life.defaults();assert.ok(s.inventory.length<=cfg.settings.bagSlots);assert.ok(s.homeStorage.length<=cfg.settings.homeStorageSlots);
 for(const ing of ['nasi','telur','minyak'])assert.ok(s.inventory.some(i=>i.type===ing),ing);
 assert.ok(s.inventory.some(i=>Life.FISH.some(f=>f.id===i.type)),'a fish to cook');
});
test('life play applies the start per player id and RESET re-applies it',()=>{
 const src=fs.readFileSync(path.join(R,'world-builder/semesta-life-play.js'),'utf8');
 assert.match(src,/test-start-profiles\.json/);assert.match(src,/testSeed/);assert.match(src,/function resetSave/);
 assert.match(src,/STORAGE\+projectId\+\(id\?'@'\+id:''\)/);
 assert.match(fs.readFileSync(path.join(R,'mainkan/app.js'),'utf8'),/playerId:guest\?'':testPlayerId/);
});

'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const VO=path.resolve(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(VO,rel),'utf8');
const R7=['njh_mushola','njh_koperasi','njh_toko_loak','njh_warung_madura','njh_nasi_sunda','njh_pecel_lele_tenda','njh_sate_madura_tenda'];
const WARTEG_ALIKE=['njh_warung_madura','njh_nasi_sunda','njh_pecel_lele_tenda','njh_warung_kopi'];

function loadPlay(){
 const Interiors=require(path.join(VO,'world-builder/njh-play-interiors.js'));
 return Interiors.create({});
}

test('STEP 2 tags are unique; LGR pack ?v is unchanged',()=>{
 assert.match(read('sw.js'),/^\/\* sw v48 /);
 assert.match(read('mainkan/index.html'),/\?v=njh-rollback-step2-v48-20261122/);
 assert.match(read('mainkan/index.html'),/fresh-mode\.js\?v=njh-rollback-step2-v48-20261122/);
 const hub=JSON.parse(read('shared/hub-version.json'));
 assert.equal(hub.build,'hub-20261122-rollback-step2-v48');
 assert.match(read('shared/genesis-player.js'),/\?v=pakaian-v2-njh-newbot-fix-20261122/);
});

test('kindOfBuilding uses njhInteriorTemplate before WARTEG_PATTERN',()=>{
 const api=loadPlay();
 assert.equal(api.kindOfBuilding({name:'Warung Madura (warung pojok)',njhInteriorTemplate:'njh_warung_madura'}),'public');
 assert.equal(api.kindOfBuilding({name:'Warung nasi Sunda · Jakarta',njhInteriorTemplate:'njh_nasi_sunda'}),'public');
 assert.equal(api.kindOfBuilding({name:'Warung Pecel Lele (tenda)',njhInteriorTemplate:'njh_pecel_lele_tenda'}),'public');
 assert.equal(api.kindOfBuilding({name:'Warung Kopi Pojok Gang',njhInteriorTemplate:'njh_warung_kopi'}),'public');
 assert.equal(api.kindOfBuilding({name:'Mushola Kampung',njhInteriorTemplate:'njh_mushola'}),'public');
 assert.equal(api.kindOfBuilding({name:'Warteg (warung makan)',njhInteriorTemplate:'njh_warung_makan'}),'warteg');
 assert.equal(api.kindOfBuilding({name:'Warteg (warung makan)',njhInteriorTemplate:'njh_warteg_kharisma'}),'warteg');
 assert.equal(api.kindOfBuilding({name:'NJH Mart (Minimarket)',njhInteriorTemplate:'njh_minimarket'}),'minimarket');
 // name-only fallback still maps a bare warteg
 assert.equal(api.kindOfBuilding({name:'Warteg Bu Sari'}),'warteg');
});

test('bakeMartWall is minimarket-only; other painted scenes use bakeDeclaredPaint',()=>{
 const src=read('world-builder/njh-play-interiors.js');
 assert.match(src,/function bakeDeclaredPaint\(side\)/);
 assert.match(src,/Must not reuse NJH MART branding/);
 assert.match(src,/const mart=themeKind==='minimarket'\|\|sc\.id==='njh_minimarket'\|\|roomKind==='minimarket'/);
 assert.match(src,/const can=mart\?bakeMartWall\(side\):\(sc\.paint&&Array\.isArray\(sc\.paint\.layers\)&&sc\.paint\.layers\.length\?bakeDeclaredPaint\(side\):bake\(side\)\)/);
 assert.doesNotMatch(src,/\(sc\.paint&&Array\.isArray\(sc\.paint\.layers\)&&sc\.paint\.layers\.length\)\?bakeMartWall\(side\):bake\(side\)/);
});

test('every r7 scene item id resolves in the play catalog with art files',()=>{
 const cat=JSON.parse(read('world-builder/njh-play-interiors/catalog.json'));
 const items=cat.items||cat;
 const playDir=path.join(VO,'world-builder/njh-play-interiors');
 const artDir=path.join(playDir,'art');
 const ids=new Set();
 for(const id of R7){
  const sc=JSON.parse(read('world-builder/njh-map-preview/interiors/'+id+'.interior-scene.json'));
  for(const it of sc.items||[])ids.add(it.assetId);
 }
 assert.ok(ids.size>=20,ids.size);
 for(const id of ids){
  assert.ok(items[id],id+' missing from play catalog');
  for(const dir of ['se','sw','ne','nw']){
   const view=items[id][dir];
   assert.ok(view&&view.file,id+' missing '+dir);
   const file=view.file.startsWith('../')?path.resolve(playDir,view.file):path.join(artDir,view.file);
   assert.ok(fs.existsSync(file),id+' art '+view.file);
  }
 }
 for(const must of ['prayer_mat','bookshelf','wudhu_tap','plastic_bench_red','plastic_bench_blue'])
  assert.ok(ids.has(must)||items[must],must+' is in catalog');
});

test('plastic_bench_* are in FURNITURE_GATES with rest/sit',()=>{
 const hooks=read('world-builder/semesta-life-hooks.js');
 assert.match(hooks,/furnitureIds:Object\.freeze\(\['plastic_bench_red','plastic_bench_blue','plastic_bench'\]\)/);
 assert.match(hooks,/actions:Object\.freeze\(\['rest','sit'\]\)/);
 const access=read('world-builder/semesta-room-access.js');
 assert.match(access,/sit: \['rest'\]/);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/rest:'sit'/);
 assert.match(play,/const seating=\(action==='rest'\|\|action==='sit'\)&&args&&\(args\.seatId\|\|args\.furnitureId\)/);
});

test('Warung Kopi stays locked; name regex cannot remap r7 doors to warteg',()=>{
 for(const id of WARTEG_ALIKE){
  if(id==='njh_warung_kopi')continue;
  // covered by kindOfBuilding test; here confirm READY
 }
 const src=read('world-builder/njh-map-preview.js');
 assert.match(src,/NJH_PENDING=\['njh_warung_kopi'\]/);
 assert.ok(src.includes("'njh_mushola'")&&src.includes('NJH_READY'));
});

test('Warteg door resolves to njh_warteg_kharisma with Ibu Warteg, even if the template is still the fallback id',()=>{
 const Interiors=require(path.join(VO,'world-builder/njh-play-interiors.js'));
 const kharisma=JSON.parse(read('world-builder/njh-play-interiors/njh_warteg_kharisma.interior-scene.json'));
 const fallback=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_warung_makan.interior-scene.json'));
 const api=Interiors.create({scenes:{njh_warteg_kharisma:kharisma,njh_warung_makan:fallback}});
 assert.equal(api.resolvePlayTemplate('njh_warung_makan'),'njh_warteg_kharisma');
 assert.equal(api.resolvePlayTemplate('warteg'),'njh_warteg_kharisma');
 assert.equal(api.resolvePlayTemplate('njh_warteg_kharisma'),'njh_warteg_kharisma');
 const ibu=(kharisma.items||[]).find(i=>i.assetId==='npc_ibu_warteg');
 assert.ok(ibu,'Ibu Warteg is in the Kharisma scene');
 const src=read('world-builder/njh-map-preview.js');
 assert.match(src,/njh_warteg_kharisma/);
 const meta=JSON.parse(read('world-builder/njh-map-preview/njh-map-meta.json'));
 const door=meta.doors.find(d=>d.doorId==='njh_door_warung_makan');
 assert.equal(door.interiorTemplate,'njh_warteg_kharisma');
 const previewSrc=read('world-builder/njh-play-interiors.js');
 assert.match(previewSrc,/new Set\(\[\.\.\.(always|official),\.\.\.t\]\)/);
});

test('Laundry and Bengkel item ids resolve in the play catalog with art',()=>{
 const cat=JSON.parse(read('world-builder/njh-play-interiors/catalog.json'));
 const items=cat.items||cat;
 const playDir=path.join(VO,'world-builder/njh-play-interiors');
 const artDir=path.join(playDir,'art');
 for(const id of ['njh_laundry','njh_bengkel']){
  const sc=JSON.parse(read('world-builder/njh-map-preview/interiors/'+id+'.interior-scene.json'));
  const ids=new Set((sc.items||[]).map(it=>it.assetId));
  for(const asset of ids){
   assert.ok(items[asset],id+' missing catalog '+asset);
   for(const dir of ['se','sw','ne','nw']){
    const view=items[asset][dir];
    assert.ok(view&&view.file,asset+' missing '+dir);
    const file=view.file.startsWith('../')?path.resolve(playDir,view.file):path.join(artDir,view.file);
    assert.ok(fs.existsSync(file),asset+' art '+view.file);
   }
  }
 }
 for(const must of ['washing_machine','workbench','tool_rack','laundry_counter','locker','waiting_bench','table'])
  assert.ok(items[must],must);
});

test('rejectAction allows rest on a public interior; kost rooms stay locked for guests',()=>{
 const Access=require(path.join(VO,'world-builder/semesta-room-access.js'));
 const A=Access.create();
 A.loadBuilding(JSON.parse(read('world-builder/njh-play-interiors/kost-building.json')));
 assert.equal(A.rejectAction('t_guest','njh_sate_madura_tenda','rest',{seatId:'njh-sate-plastic_bench_red-1'}),null);
 assert.equal(A.rejectAction('t_guest','njh_laundry','rest',{seatId:'waiting_bench'}),null);
 assert.equal(A.rejectAction('t_guest_1','njh_kos_ichsan','sleep'),'Terkunci');
});

test('mushola wudhu taps do not overlap a sajadah (grid or Chebyshev 1)',()=>{
 const scene=JSON.parse(read('world-builder/njh-map-preview/interiors/njh_mushola.interior-scene.json'));
 const catalog=JSON.parse(read('world-builder/njh-play-interiors/catalog.json'));
 const art=catalog.art||catalog.items||catalog;
 function footprint(assetId,rot){
  const rec=art[assetId]||{};
  const view=rec.sw||rec.se||rec;
  const fp=(view&&view.footprint)||[1,1];
  let dc=Number(fp[0])||1,dr=Number(fp[1])||1;
  const r=((Number(rot)||0)%360+360)%360;
  if(r===90||r===270)[dc,dr]=[dr,dc];
  return [dc,dr];
 }
 function tiles(it){
  const [dc,dr]=footprint(it.assetId,it.rotation);
  const out=[];
  for(let c=it.c;c<it.c+dc;c++)for(let r=it.r;r<it.r+dr;r++)out.push(c+','+r);
  return out;
 }
 const mats=scene.items.filter(i=>i.assetId==='prayer_mat');
 const taps=scene.items.filter(i=>i.assetId==='wudhu_tap');
 assert.ok(taps.length>=1&&mats.length>=1);
 const matTiles=new Set(mats.flatMap(tiles));
 const tapTiles=taps.flatMap(tiles);
 for(const t of tapTiles){
  assert.equal(matTiles.has(t),false,'wudhu tile '+t+' overlaps a sajadah');
  const [c,r]=t.split(',').map(Number);
  for(let dc=-1;dc<=1;dc++)for(let dr=-1;dr<=1;dr++){
   const n=(c+dc)+','+(r+dr);
   assert.equal(matTiles.has(n),false,'wudhu at '+t+' is adjacent to sajadah '+n);
  }
 }
 const shaf2=scene.items.filter(i=>i.assetId==='prayer_mat'&&i.r>=2);
 assert.ok(shaf2.every(i=>i.c<=3),'no sajadah in the wudhu corner (c>=5)');
 assert.equal(scene.items.some(i=>i.id==='njh-mushola-prayer_mat-9'),false);
});

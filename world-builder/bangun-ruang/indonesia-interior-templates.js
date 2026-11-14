/* Indonesia Interior Pack · generated-source registry for Bangun Ruang.
 * 64×32 native Semesta units. Every prop carries actions; unsupported moves
 * remain explicit gameplay hooks, never counterfeit character animations.
 * Do not overwrite legacy custom rooms or existing Warteg Kharisma template.
 */
(function(g){
'use strict';
// Upstream may already register v1. This local extension merges only NJH Mart
// IDs when upstream is present; it must not overwrite canonical templates.
const action=(label,pose=null)=>({label,pose,description:pose?'Existing rig preview; gameplay integration remains separate':'Interaction slot / gameplay hook; animation not authored'});
const actions={
 eat:action('Makan'),drink:action('Minum'),pray:action('Salat'),watch:action('Nonton','idle'),
 read:action('Baca','idle'),play:action('Main'),exercise:action('Olahraga'),
 check_in:action('Daftar / Check-in','talk'),treat:action('Periksa / Berobat'),
 withdraw:action('Tarik Tunai'),deposit:action('Setor Tunai'),pay:action('Bayar','talk'),
 scan:action('Scan Barang'),repair:action('Perbaiki'),brew:action('Seduh'),
 collect:action('Ambil Barang'),laundry:action('Cuci Pakaian'),
 switch_on:action('Nyalakan'),store:action('Simpan Barang')
};
function prop(label,category,glyph,w,d,actions,visualAs='',material=''){
 return {label,category,glyph,w,d,actions:actions.split(','),visualAs,material};
}
const types={
 floor_mattress:prop('Kasur Lantai','Rumah','🛏',2,2,'sleep,rest','floor_mattress'),
 dining_table:prop('Meja Makan','Rumah','▤',2,1,'eat,browse','table'),
 chair:prop('Kursi Makan','Rumah','▦',1,1,'sit','chair'),
 wooden_bench:prop('Bangku Panjang','Rumah','▭',2,1,'sit','wooden_bench'),
 tv:prop('TV Tabung / Layar','Rumah','▣',2,1,'watch,switch_on','tv'),
 fan:prop('Kipas Angin','Rumah','✳',1,1,'switch_on','fan'),
 shoe_rack:prop('Rak Sepatu','Rumah','▥',2,1,'open,store','shelf'),
 prayer_mat:prop('Sajadah','Rumah','▧',1,2,'pray','prayer_mat'),
 rice_cooker:prop('Rice Cooker','Dapur','♨',1,1,'cook,open','rice_cooker'),
 water_dispenser:prop('Dispenser Galon','Dapur','◈',1,1,'drink','water_dispenser'),
 dish_rack:prop('Rak Piring','Dapur','▥',2,1,'wash,store','shelf'),
 food_vitrine:prop('Etalase Lauk','Kuliner','▤',2,1,'buy,sell,browse','food_vitrine'),
 food_cart:prop('Gerobak Makanan','Kuliner','▥',2,1,'buy,sell,cook','food_cart'),
 noodle_pot:prop('Panci Bakso','Kuliner','◉',1,1,'cook','rice_cooker'),
 drink_cooler:prop('Cooler Minuman','Kuliner','▣',1,1,'drink,buy','fridge'),
 coffee_machine:prop('Mesin Kopi','Kuliner','▣',1,1,'brew','coffee_machine'),
 aisle_rack:prop('Rak Minimarket','Toko','▥',2,1,'browse,collect','aisle_rack'),
 fridge_drinks:prop('Kulkas Minuman','Toko','▣',1,1,'browse,open,buy','fridge'),
 display_freezer:prop('Freezer Es Krim','Toko','▤',2,1,'open,buy','counter'),
 checkout:prop('Meja Kasir','Toko','▣',2,1,'pay,buy,sell','cashier'),
 market_crate:prop('Keranjang Dagangan','Toko','▥',1,1,'browse,collect','market_crate'),
 atm:prop('Mesin ATM','Publik','▣',1,1,'withdraw,deposit','atm'),
 waiting_bench:prop('Bangku Tunggu','Publik','▭',2,1,'sit','sofa'),
 registration_desk:prop('Meja Pendaftaran','Publik','▤',2,1,'check_in','desk'),
 clinic_bed:prop('Bed Periksa','Publik','🛏',2,2,'rest,treat','bed'),
 medicine_rack:prop('Rak Obat','Publik','▥',2,1,'browse,collect','shelf'),
 squat_toilet:prop('WC Jongkok','Publik','🚽',1,1,'use_toilet,pee,poop','squat_toilet'),
 water_tub:prop('Bak Mandi + Gayung','Publik','▣',1,1,'bathe','water_tub'),
 wudhu_tap:prop('Keran Wudu','Publik','🚰',1,1,'wash','sink'),
 bookshelf:prop('Rak Buku','Sekolah','▥',2,1,'browse,read','shelf'),
 study_desk:prop('Meja Belajar','Sekolah','▤',2,1,'study,read','desk'),
 whiteboard:prop('Papan Tulis','Sekolah','▣',2,1,'study','whiteboard'),
 arcade:prop('Mesin Arcade','Jasa','▣',1,1,'play','arcade'),
 game_console:prop('Rental PS / TV','Jasa','▣',2,1,'play,watch','tv'),
 salon_chair:prop('Kursi Salon','Jasa','▣',1,1,'sit','office_chair'),
 salon_mirror:prop('Cermin Salon','Jasa','▣',1,1,'browse','whiteboard'),
 washing_machine:prop('Mesin Cuci','Jasa','▣',1,1,'laundry','washing_machine'),
 laundry_counter:prop('Loket Laundry','Jasa','▤',2,1,'pay,collect','counter'),
 workbench:prop('Meja Bengkel','Jasa','▤',2,1,'repair,work','desk'),
 tool_rack:prop('Rak Perkakas','Jasa','▥',2,1,'repair,collect','shelf'),
 gym_mat:prop('Matras Olahraga','Jasa','▧',1,2,'exercise','prayer_mat'),
 treadmill:prop('Treadmill','Jasa','▰',2,1,'exercise','treadmill'),
 trash_bin:prop('Tempat Sampah','Jasa','▣',1,1,'open','trash_bin'),
 locker:prop('Loker','Jasa','▥',2,1,'open,store','wardrobe'),
 // NJH MART: dimensions and stable IDs match njh-play-interiors/catalog.json.
 // Keep art in the existing Step-2 four-view catalog, not generated substitutes.
 njh_rak_sembako:prop('Rak Sembako NJH Mart','Toko','▥',2,1,'browse,collect','aisle_rack'),
 njh_rak_bumbu_mi:prop('Rak Bumbu & Mi NJH Mart','Toko','▥',2,1,'browse,collect','aisle_rack'),
 njh_rak_snack:prop('Rak Snack NJH Mart','Toko','▥',2,1,'browse,collect','aisle_rack'),
 njh_chiller_segar:prop('Chiller Segar NJH Mart','Toko','▣',2,1,'browse,open,buy','display_freezer'),
 njh_display_sayur_buah:prop('Sayur & Buah NJH Mart','Toko','▤',2,1,'browse,collect','market_crate'),
 njh_keranjang_belanja:prop('Keranjang Belanja NJH Mart','Toko','▥',1,1,'collect','market_crate'),
 njh_troli:prop('Troli NJH Mart','Toko','▥',1,1,'collect','market_crate'),
 njh_papan_promo:prop('Papan Promo NJH Mart','Toko','▣',1,1,'browse','whiteboard'),
 njh_counter_kasir:prop('Meja Kasir NJH Mart','Toko','▣',2,1,'pay,buy,sell','cashier'),
 njh_counter_kopi:prop('Counter Kopi NJH Mart','Toko','▤',3,1,'brew,pay','counter'),
 njh_mesin_kopi:prop('Mesin Kopi NJH Mart','Toko','◈',1,1,'brew','coffee_machine')
};
const templates={};
const rows=[
 ['Rumah','Rumah Kampung Sederhana','warm','sofa,table,tv,fan,shoe_rack,prayer_mat'],
 ['Rumah','Rumah Kontrakan Petak','warm','floor_mattress,wardrobe,fan,rice_cooker,water_dispenser,prayer_mat'],
 ['Rumah','Rumah Subsidi','cream','sofa,tv,dining_table,chair,fridge,shoe_rack'],
 ['Rumah','Rumah Keluarga','warm','sofa,sofa,tv,dining_table,chair,fridge,fan'],
 ['Rumah','Rumah Nenek','warm','wooden_bench,table,tv,prayer_mat,dish_rack,fan'],
 ['Rumah','Apartemen Studio Jakarta','blue','bed,wardrobe,desk,office_chair,fridge,tv,shower'],
 ['Rumah','Kos Mahasiswa','warm','floor_mattress,study_desk,chair,fan,water_dispenser,shoe_rack'],
 ['Rumah','Kos Karyawan','cream','bed,wardrobe,study_desk,chair,tv,shoe_rack'],
 ['Rumah','Kos Eksklusif','blue','bed,wardrobe,sofa,tv,fridge,water_dispenser'],
 ['Rumah','Kamar Anak','warm','floor_mattress,study_desk,chair,bookshelf,fan'],
 ['Rumah','Kamar Tidur Utama','warm','bed,wardrobe,wardrobe,fan,prayer_mat'],
 ['Rumah','Ruang Tamu Lebaran','warm','sofa,sofa,wooden_bench,table,tv,fan'],
 ['Rumah','Dapur Rumah Indonesia','warm','stove,rice_cooker,kitchen_sink,dish_rack,fridge,water_dispenser,dining_table'],
 ['Rumah','Kamar Mandi Rumah','aqua','squat_toilet,water_tub,sink,trash_bin'],
 ['Rumah','Kamar Mandi Modern','aqua','wc,shower,sink,bathtub,trash_bin'],
 ['Toko','Minimarket Merah Kuning','blue','aisle_rack,aisle_rack,aisle_rack,fridge_drinks,display_freezer,checkout,market_crate'],
 ['Toko','Minimarket Biru Kuning','blue','aisle_rack,aisle_rack,fridge_drinks,fridge_drinks,checkout,market_crate'],
 ['Toko','Supermarket Grosir','cream','aisle_rack,aisle_rack,aisle_rack,aisle_rack,display_freezer,checkout,checkout'],
 ['Toko','Warung Madura 24 Jam','warm','aisle_rack,shelf,fridge_drinks,checkout,market_crate,market_crate'],
 ['Toko','Warung Kelontong','warm','shelf,shelf,checkout,market_crate,water_dispenser'],
 ['Toko','Toko Sembako','warm','aisle_rack,shelf,market_crate,market_crate,checkout'],
 ['Toko','Toko Elektronik','blue','tv,tv,aisle_rack,checkout,computer'],
 ['Toko','Toko Pakaian','cream','wardrobe,locker,shelf,checkout,waiting_bench'],
 ['Toko','Toko Buku','warm','bookshelf,bookshelf,bookshelf,checkout,study_desk'],
 ['Toko','Toko Bangunan','warm','tool_rack,tool_rack,aisle_rack,checkout,market_crate'],
 ['Toko','Konter HP dan Pulsa','blue','counter,checkout,computer,waiting_bench,aisle_rack'],
 ['Toko','Apotek Pinggir Jalan','aqua','medicine_rack,medicine_rack,checkout,waiting_bench,registration_desk'],
 ['Kuliner','Warteg Kaki Lima','warteg','food_vitrine,food_vitrine,stove,rice_cooker,dining_table,wooden_bench,chair,water_dispenser'],
 ['Kuliner','Rumah Makan Padang','warm','food_vitrine,food_vitrine,checkout,dining_table,dining_table,wooden_bench,water_dispenser'],
 ['Kuliner','Warung Bakso','warm','noodle_pot,food_cart,dining_table,wooden_bench,chair,drink_cooler'],
 ['Kuliner','Warung Mie Ayam','warm','food_cart,noodle_pot,dining_table,chair,chair,drink_cooler'],
 ['Kuliner','Warung Pecel Lele','warm','stove,food_cart,dining_table,wooden_bench,chair,water_dispenser'],
 ['Kuliner','Warung Nasi Kuning','warm','food_vitrine,food_cart,stove,dining_table,wooden_bench,water_dispenser'],
 ['Kuliner','Warkop Pinggir Jalan','warm','stove,rice_cooker,coffee_machine,dining_table,wooden_bench,chair'],
 ['Kuliner','Angkringan','warm','food_cart,food_vitrine,wooden_bench,wooden_bench,drink_cooler'],
 ['Kuliner','Roti Bakar Bandung','warm','stove,food_vitrine,dining_table,dining_table,chair,chair'],
 ['Kuliner','Kedai Kopi Ruko','cream','coffee_machine,checkout,dining_table,wooden_bench,chair,fridge_drinks'],
 ['Kuliner','Kantin Sekolah','warm','food_vitrine,food_cart,checkout,dining_table,wooden_bench,drink_cooler'],
 ['Kuliner','Cafe Modern Jakarta','cream','coffee_machine,checkout,sofa,dining_table,dining_table,chair,fridge_drinks'],
 ['Publik','Toilet Umum Terminal','aqua','squat_toilet,squat_toilet,wc,sink,water_tub,trash_bin'],
 ['Publik','Toilet Mall','aqua','wc,wc,sink,sink,trash_bin'],
 ['Publik','Mushola Kampung','cream','prayer_mat,prayer_mat,prayer_mat,prayer_mat,bookshelf,wudhu_tap,shoe_rack'],
 ['Publik','Mushola Rest Area','cream','prayer_mat,prayer_mat,prayer_mat,prayer_mat,wudhu_tap,shoe_rack,fan'],
 ['Publik','Puskesmas Pendaftaran','aqua','registration_desk,waiting_bench,waiting_bench,medicine_rack,trash_bin'],
 ['Publik','Ruang Periksa Puskesmas','aqua','clinic_bed,registration_desk,medicine_rack,sink,chair'],
 ['Publik','Klinik Dokter Umum','aqua','clinic_bed,desk,office_chair,medicine_rack,sink'],
 ['Publik','Kantor Kelurahan','blue','registration_desk,waiting_bench,waiting_bench,office_chair,computer'],
 ['Publik','Kelas SD Negeri','cream','whiteboard,study_desk,study_desk,study_desk,chair,chair,bookshelf'],
 ['Publik','Kelas SMA','cream','whiteboard,study_desk,study_desk,study_desk,chair,chair,bookshelf'],
 ['Publik','Perpustakaan Umum','warm','bookshelf,bookshelf,study_desk,study_desk,chair,waiting_bench'],
 ['Publik','Pos Satpam Komplek','warm','desk,chair,fan,water_dispenser,locker'],
 ['Publik','Bank BCA Mini','blue','atm,registration_desk,registration_desk,waiting_bench,office_chair'],
 ['Publik','ATM Center','blue','atm,atm,atm,waiting_bench'],
 ['Jasa','Kantor Startup','blue','desk,desk,office_chair,office_chair,computer,computer,water_dispenser'],
 ['Jasa','Ruang Meeting Kantor','blue','dining_table,chair,chair,chair,whiteboard,water_dispenser'],
 ['Jasa','Laundry Kiloan','cream','washing_machine,washing_machine,laundry_counter,locker,waiting_bench'],
 ['Jasa','Bengkel Motor','warm','workbench,tool_rack,tool_rack,waiting_bench,trash_bin'],
 ['Jasa','Barbershop Kampung','warm','salon_chair,salon_mirror,waiting_bench,fan,checkout'],
 ['Jasa','Salon Kecantikan','cream','salon_chair,salon_chair,salon_mirror,salon_mirror,waiting_bench,checkout'],
 ['Jasa','Warnet Jadul','blue','computer,computer,computer,desk,desk,office_chair,checkout'],
 ['Jasa','Rental PlayStation','blue','game_console,game_console,sofa,sofa,checkout'],
 ['Jasa','Rental Arcade','blue','arcade,arcade,arcade,checkout,waiting_bench'],
 ['Jasa','Gym Kecil','blue','treadmill,treadmill,gym_mat,gym_mat,locker,water_dispenser'],
 ['Jasa','Gudang Paket Online','cream','aisle_rack,aisle_rack,locker,workbench,checkout,trash_bin'],
 ['Jasa','Kamar Hotel Melati','warm','bed,wardrobe,tv,study_desk,chair,shower,wc'],
 ['Jasa','Studio Desain Freelance','blue','desk,computer,office_chair,bookshelf,sofa,coffee_machine']
];
const anchors=[
 [.04,.04],[.65,.04],[.07,.48],[.65,.52],[.37,.07],[.35,.46],
 [.02,.25],[.81,.26],[.24,.70],[.52,.72],[.46,.24],[.05,.71],[.8,.69]
];
for(const [category,label,theme,recipe] of rows){
 const key='id_'+label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
 const assets=recipe.split(',').map(x=>x.trim()).filter(Boolean);
 const items=assets.map((assetId,i)=>[assetId,...anchors[i%anchors.length]]);
 templates[key]={label:category+' · '+label,category,theme,min:category==='Rumah'?[5,4]:[8,6],items,source:'indonesia-interior-pack-v1'};
}
function pairTemplateChairs(){
 const CHAIR=new Set(['chair']);
 const TABLE=new Set(['table','dining_table','counter','food_vitrine','cashier','desk','study_desk','workbench','registration_desk','checkout','laundry_counter']);
 const VECS=[{id:'sw',dc:-1,dr:1,rot:0},{id:'se',dc:1,dr:1,rot:90},{id:'ne',dc:1,dr:-1,rot:180},{id:'nw',dc:-1,dr:-1,rot:270}];
 const tiles=(c,r,fw,fd)=>{const out=[];for(let cc=Math.floor(c);cc<Math.ceil(c+fw-1e-9);cc++)for(let rr=Math.floor(r);rr<Math.ceil(r+fd-1e-9);rr++)out.push(cc+','+rr);return out;};
 for(const t of Object.values(templates)){
  const W=(t.min&&t.min[0])||8,D=(t.min&&t.min[1])||6;
  const entC=Math.floor(W/2),entR=D-1,reserved=new Set([entC+','+entR,entC+','+Math.max(0,entR-1)]);
  const items=t.items.map((row,i)=>{
   const typ=types[row[0]]||{};
   let fw=typ.w||1,fd=typ.d||1;
   let c=Math.round((Number(row[1])||0)*W),r=Math.round((Number(row[2])||0)*D);
   if(c<0)c=0;if(r<0)r=0;if(c+fw>W)c=Math.max(0,W-fw);if(r+fd>D)r=Math.max(0,D-fd);
   return {assetId:row[0],c,r,fw,fd,rot:Number(row[3])||0,i};
  });
  const occupied=new Set();
  for(const it of items){if(CHAIR.has(it.assetId))continue;for(const k of tiles(it.c,it.r,it.fw,it.fd))occupied.add(k);}
  const tableTiles=[];
  for(const it of items){
   if(!TABLE.has(it.assetId))continue;
   const ts=tiles(it.c,it.r,it.fw,it.fd);
   const cx=it.c+it.fw/2,cz=it.r+it.fd/2;
   for(const k of ts)tableTiles.push({k,it,cx,cz,c:+k.split(',')[0],r:+k.split(',')[1]});
  }
  const seats=[];
  const seenSeat=new Set();
  for(const tt of tableTiles){
   for(const [dc,dr] of [[0,1],[0,-1],[1,0],[-1,0]]){
    const c=tt.c+dc,r=tt.r+dr,k=c+','+r;
    if(c<0||r<0||c>=W||r>=D||occupied.has(k)||reserved.has(k)||seenSeat.has(k))continue;
    seenSeat.add(k);
    seats.push({c,r,cx:c+0.5,cz:r+0.5,table:tt});
   }
  }
  const used=new Set();
  for(const ch of items.filter(it=>CHAIR.has(it.assetId))){
   const self=new Set(tiles(ch.c,ch.r,ch.fw,ch.fd));
   let paired=null;
   for(const tt of tableTiles){
    const [cc,rr]=tt.k.split(',').map(Number);
    for(const k of self){
     const [c,r]=k.split(',').map(Number);
     if(Math.abs(c-cc)+Math.abs(r-rr)===1){paired=tt;break;}
    }
    if(paired)break;
   }
   if(!paired){
    let best=null,bestD=1e9;
    for(const s of seats){
     if(used.has(s.c+','+s.r))continue;
     const dist=Math.hypot(s.c-ch.c,s.r-ch.r);
     if(dist<bestD){bestD=dist;best=s;}
    }
    if(best){
     ch.c=best.c;ch.r=best.r;paired=best.table;used.add(best.c+','+best.r);
    }
   }else{
    for(const k of self)used.add(k);
   }
   if(!paired)continue;
   const vx=paired.cx-(ch.c+ch.fw/2),vz=paired.cz-(ch.r+ch.fd/2);
   let best=VECS[0],dot=-1e9;
   for(const v of VECS){
    const d=v.dc*vx+v.dr*vz;
    if(d>dot){dot=d;best=v;}
   }
   ch.rot=best.rot;
  }
  t.items=items.map(it=>[it.assetId,it.c/W,it.r/D,it.rot]);
 }
}
pairTemplateChairs();
const previous=g.VLIndonesiaInteriorPack;
if(previous?.version===1){
 const martOnly=Object.fromEntries(Object.entries(types).filter(([id])=>id.startsWith('njh_')));
 g.VLIndonesiaInteriorPack=Object.freeze({...previous,
  types:Object.freeze({...previous.types,...martOnly}),njhMartVersion:1});
 return;
}
g.VLIndonesiaInteriorPack=Object.freeze({version:1,source:'lafrich/virtual-life-asset-pipeline',tilePixels:[64,32],actions:Object.freeze(actions),types:Object.freeze(types),templates:Object.freeze(templates),count:Object.keys(templates).length,njhMartVersion:1});
})(window);

/* Jakarta City: editable central Jakarta-inspired Semesta city.
 * Reuses existing city terrain and Jakarta / pipeline asset migration, not invented remote sprites.
 */
(function(g){
'use strict';
function create(base,catalog,style,schema){
 const city=g.VLReferenceCity.create(base,catalog,style,schema);
 city.map.name='Jakarta City';
 city.map.preset='jakarta-city-central-v1';
 city.map.notes='Stylized Jakarta Pusat: Monas/Medan Merdeka, Thamrin-Sudirman, Kebon Sirih, Menteng, Pasar Baru, Tanah Abang, Gambir. Approximate playable interpretation, not a surveyed GIS road map.';
 city.map.landmarks={monas:{c:33,r:59},gambir:{c:33,r:30},thamrin:{c:19,r:72},kebonSirih:{c:19,r:43},menteng:{c:60,r:59},tanahAbang:{c:-20,r:87},pasarBaru:{c:7,r:6}};
 const byId=new Map(city.objects.map(o=>[o.id,o]));
 const names={
 'ref-hospital':['RS Jakarta Pusat','hospital'],
 'ref-church':['Gedung Bersejarah Pasar Baru','civic'],
 'ref-city-hall':['Stasiun Gambir (representasi)','service'],
 'ref-civic-annex':['Kompleks Pemerintahan','civic'],
 'ref-clock-tower':['Gedung Kantor Menteng','office'],
 'ref-jail':['Kantor Polisi Jakarta Pusat','police'],
 'ref-police':['Pos Polisi Kebon Sirih','police'],
 'ref-gas-station':['SPBU Jakarta','service'],
 'ref-central-library':['Pusat Grosir Tanah Abang','store'],
 'ref-market':['Pasar Tanah Abang','store'],
 'ref-factory':['Bangunan Komersial Cikini','office'],
 'ref-warehouse':['Pergudangan / Ruko','warehouse'],
 'ref-school':['Sekolah Jakarta','school'],
 'ref-hotel':['Hotel Pasar Baru','hotel'],
 'ref-commerce':['Pasar Baru','store'],
 'ref-housing-office':['Apartemen Jakarta','residential']
 };
 for(const [id,[name,subtype]] of Object.entries(names)){
  const o=byId.get(id);if(!o)continue;
  o.name=name;o.subtype=subtype;
  o.tags=['jakarta','jakarta-pusat',subtype,'editable'];
  o.notes='Jakarta-inspired building placement. Replace with an accurate Semesta native asset when available.';
 }
 // Retain the reference city's legally traversable, connected road + sidewalk network.
 // Rework the central park to represent Medan Merdeka and add a non-blocking landmark.
 const center=byId.get('ref-clock-tower');
 if(center)center.name='Gedung Perkantoran Menteng';
 const monas={id:'jakarta-monas',type:'building',name:'Monumen Nasional · MONAS',
  x:33.5,z:59.5,y:0,rotation:0,scale:1,w:3,d:3,h:19,
  color:'#e2d2a6',collision:true,blocking:'auto',layer:'structure',
  subtype:'landmark',sizeClass:'small',replaceable:true,
  tags:['jakarta','monas','medan-merdeka','landmark'],interactions:[],
  notes:'Landmark geometry placeholder. Actual Monas-specific artwork not claimed.'};
 style.normalize(monas,catalog);schema.normalize(monas,catalog,style);
 city.objects.push(monas);
 const locations=[
  ['Bundaran HI / Jalan Thamrin',19,63,'marker'],
  ['Jalan Kebon Sirih',19,43,'marker'],
  ['Stasiun Gambir',32,24,'marker'],
  ['Kawasan Menteng',60,56,'marker'],
  ['Pasar Baru',6,6,'marker'],
  ['Tanah Abang',-20,82,'marker']
 ];
 locations.forEach(([name,x,z],i)=>{
  city.objects.push({id:'jakarta-label-'+i,type:'marker',name,x,z,y:0,rotation:0,scale:1,
   markerKind:'interaction',collision:false,blocking:'no',layer:'marker',subtype:'location',
   tags:['jakarta','location-label'],interactions:[],notes:'Approximate district guide marker; not functional navigation.'});
 });
 for(const o of city.objects){
  if(o.id.startsWith('ref-infill')||o.id.startsWith('ref-density')||o.id.startsWith('ref-row')||o.id.startsWith('ref-north')||o.id.startsWith('ref-east')||o.id.startsWith('ref-west')||o.id.startsWith('ref-south')){
   if(o.type==='shop'||o.subtype==='shop')o.name='Ruko Jakarta · '+o.id.slice(-4);
   else if(o.subtype==='house')o.name='Rumah Permukiman Jakarta';
   else if(o.subtype==='office')o.name='Gedung Kantor Jakarta';
  }
 }
 return city;
}
g.VLJakartaCity={create};
})(window);

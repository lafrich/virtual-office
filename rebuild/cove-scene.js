/* Cove Room: procedural pixel isometric preview.
   Each prop is drawn from a modular asset definition; PNG sprites can replace it. */
(function(global){
'use strict';
function drawFloor(api){
 const {iso,box,diamond,poly,line,zoom}=api;
 for(let y=0;y<11;y++)for(let x=0;x<16;x++){
  const bath=x>=9;
  const color=bath?(x+y)%2?'#d79a84':'#e9b09a':(x+y)%2?'#b2d4f6':'#c6e2ff';
  diamond(x,y,color,bath?'#c18575':'#a5c4eb');
 }
 // Bedroom cream rug, hallway welcome mat; visually no collision.
 box(4.7,7.1,4.6,3.0,.18,'#eadfca','#c8b9a2','#c3b49b');
 box(9.1,9.0,1.2,.7,.19,'#5489ed','#3d64c0','#3c5bc2');
 const roomW=16,depth=11,h=62;
 const a=iso(0,0),b=iso(roomW,0),c=iso(0,depth);
 poly([iso(0,0,h),iso(roomW,0,h),b,a],'#e7d7ba','#b6a98b',1);
 poly([iso(0,0,h),iso(0,depth,h),c,a],'#f2e4ca','#ae9f84',1);
 line(iso(0,0,h),iso(roomW,0,h),'#fff4db',5*zoom);
 line(iso(0,0,h),iso(0,depth,h),'#fff4db',5*zoom);
 // Two wall zones and a partition dividing bedroom from bathroom visually.
 const ps=[iso(9.05,0,0),iso(9.05,0,65),iso(9.05,3.4,65),iso(9.05,3.4,0)];
 poly(ps,'#e4d2af','#c9b99b',1);
 // Upper bathroom wall, including reddish shower tile backdrop.
 poly([iso(10.0,0,0),iso(13.25,0,0),iso(13.25,0,54),iso(10.0,0,54)],'#bc8068','#a56c58',1);
 for(let i=11;i<14;i++)line(iso(i,0,0),iso(i,0,52),'#cf957d',.6);
 for(let z=8;z<=50;z+=8)line(iso(10,0,z),iso(13.25,0,z),'#ce9884',.5);
 // Large bedroom window, with thin slatted blinds.
 poly([iso(.2,0,20),iso(4.35,0,20),iso(4.35,0,53),iso(.2,0,53)],'#add6f3','#e5dcc1',2);
 for(let z=21;z<53;z+=4)line(iso(.2,0,z),iso(4.35,0,z),'#f5eed9',1.7);
 // Bathroom window reflection and wall light.
 poly([iso(15.15,0,21),iso(15.8,0,21),iso(15.8,0,46),iso(15.15,0,46)],'#a0bbbc','#b28766',2);
}
function drawAsset(api,a,part){
 const {box,line,iso,ctx,shadow,drawPlant}=api;
 const p=a.at,x=p.x,y=p.y,sc=a.scale,z=a.elevation;
 const dims=(w,d,h)=>[w*sc,d*sc,h*sc];
 const b=(dx,dy,w,d,h,t,l,r,zz=0)=>{
  const sz=dims(w,d,h);return box(x+dx*sc,y+dy*sc,...sz,t,l,r,z+zz*sc)
 };
 const highlight=(dx,dy,h1,h2,col)=>line(iso(x+dx*sc,y+dy*sc,z+h1),iso(x+dx*sc,y+dy*sc,z+h2),col,2);
 if(part==='front'){
  if(a.type==='bed'){
   b(0,.60,a.size.w*.95,.40,12,'#6f8fd7','#4663b1','#4b68b9',.4);
   b(0,.86,a.size.w,.18,15,'#a77750','#865d40','#79583f',0);
  }else if(a.type==='bathtub'){
   b(0,.70,a.size.w,.30,20,'#708f75','#547459','#55735c');
   b(0,.82,a.size.w*.90,.13,22,'#8aa68a','#5f7f68','#55735b');
  }else if(a.type==='toilet')b(0,.31,a.size.w*.7,.60,15,'#f7f8f7','#d0d7db','#c0d0d6');
  else if(a.type==='chair')b(0,.42,.84,.19,12,'#b98c5d','#8b623e','#956d48');
  return;
 }
 switch(a.type){
  case 'rug': b(0,0,a.size.w,a.size.d,.16,'#f5e8d1','#e9d9bf','#e6d5bc');break;
  case 'bed':
   b(0,0,a.size.w,a.size.d,9,'#ac7047','#795038','#754b38');
   b(0,-.75,a.size.w,.28,23,'#ae7850','#7c513c','#774a32');
   b(0,0,a.size.w*.95,a.size.d*.80,11,'#9cb8ea','#6b8bc7','#6789c0',4);
   b(0,-.53,a.size.w*.82,.58,4,'#ffffff','#dadfdf','#c5cfd5',14);
   b(0,.29,a.size.w*.90,1.08,2,'#6e90d1','#5479be','#5877b8',14);
   b(0,-.16,.70,.42,3,'#526ba9','#40558e','#41558f',16);
   break;
  case 'nightstand':
   b(0,0,a.size.w,a.size.d,9,'#bd8b58','#8b5f3d','#896141');
   b(0,.30,.65,.10,6,'#9e6d45','#745036','#725239',8);
   break;
  case 'lamp':
   b(0,0,.25,.25,2,'#f4e9d7','#bca98f','#bea589',8);
   b(0,0,.17,.17,10,'#c0a37c','#927b5e','#987758',10);
   b(0,0,.60,.54,7,'#fff3ce','#f1d99b','#f3d7a6',20);
   break;
  case 'desk':
   b(0,0,a.size.w,a.size.d,10,'#c58e58','#9d673b','#956a46');
   b(0,-.09,.94,.54,1,'#373c4f','#273a4f','#29354a',23);
   b(0,-.10,.68,.43,1,'#9ec3e0','#7daacb','#83b5c8',24);
   b(1.05,.16,.50,.29,2,'#f5efd8','#c6bdab','#c8b4a0',23);
   b(-.86,.10,.35,.38,10,'#ece0c2','#ab8c6c','#c0a583',14);
   break;
  case 'chair':
   b(0,0,a.size.w,a.size.d,7,'#c79c69','#805838','#825b3d');
   b(0,-.40,a.size.w,.19,23,'#b78c5a','#89603e','#926843');
   break;
  case 'bookshelf':
   b(0,0,a.size.w,a.size.d,a.size.h,'#d0a071','#a26b45','#ad754b');
   for(let i=0;i<3;i++){
    b(.02,.17,.95,.22,1,'#8f6148','#704936','#774d37',8+i*8);
    for(let t=0;t<3;t++)b(-.40+t*.33,.11,.20,.21,5,
      ['#cfd9cf','#537cac','#a17c5e'][(i+t)%3],
      '#5d6275','#58657e',8+i*8)
   }
   break;
  case 'dresser':
   b(0,0,a.size.w,a.size.d,a.size.h,'#bb8d60','#8f623d','#87603e');
   for(let zz of [5,11,17]){b(0,.43,a.size.w*.84,.035,.18,'#795b43','#5b4435','#68503c',zz);}
   break;
  case 'plant':drawPlant(x,y,1);break;
  case 'bathtub':
   b(0,0,a.size.w,a.size.d,16,'#7c9d7f','#5c806b','#53755f');
   b(0,-.12,a.size.w*.84,a.size.d*.68,1,'#6db8c1','#4d99a9','#4e8fa2',17);
   b(-.55,-.1,.55,.7,1,'#e1bd83','#b48c60','#ad865a',18);
   break;
  case 'shower':
   b(0,0,.18,.25,44,'#dfc692','#bf9e67','#b9a16e');
   b(.35,.23,.82,.28,3,'#f1d4a1','#caa66e','#cba669',45);
   break;
  case 'partition':
   b(0,0,a.size.w,a.size.d,38,'#e3f0ed55','#acb6bb88','#b7c8cf88');
   for(let z2=8;z2<37;z2+=9)b(.03,0,.16,a.size.d,.42,'#e8f5ef','#adc9c9','#b7cbcb',z2);
   break;
  case 'sink':
   b(0,0,a.size.w,a.size.d,20,'#a26b44','#84583d','#895d42');
   b(0,0,.60,.49,3,'#8fad86','#65836b','#5e8166',20);
   b(0,-.16,.11,.15,8,'#e6bc79','#cda56c','#ba9668',23);
   break;
  case 'mirror':
   b(0,0,a.size.w,a.size.d,35,'#926442','#754c35','#6f4e35');
   b(0,0,a.size.w*.73,.24,27,'#a5cbd5','#7397a2','#7eabae',39);
   break;
  case 'toilet':
   b(0,-.42,.96,.55,24,'#fff','#dfe6e7','#c7d2d5');
   b(0,.13,1.12,.96,12,'#f8f9f6','#cdd7db','#becbd0');
   b(0,.18,.69,.58,1,'#a7cad1','#e2eeee','#cbdee3',12);
   break;
  case 'door':
   b(0,0,.30,a.size.d,43,'#a86e44','#8a583c','#94613f');
   b(.035,0,.08,a.size.d*.73,30,'#ad774f','#875536','#916043',7);
   break;
  default:
   b(0,0,a.size.w,a.size.d,a.size.h,'#c5b5a2','#a49178','#96836c');
 }
}
global.VOCoveScene={drawFloor,drawAsset};
})(window);

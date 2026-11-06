/* Bangun Ruang / Generate Building: deterministic v6b-style building recipes.
 * This is an editor front-end, not an AI model or a Python execution service.
 * Native pipeline landmarks are imported as editable source copies.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VLBangunGenerator=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const RECIPES=Object.freeze({
  rumah:{label:'Rumah Jakarta',baseId:'pipeline:rumah_kampung_a',kind:'rumah',w:4,d:4,floors:1,room:'home',walls:['cream','pink','concrete'],roofs:['terracotta','slate'],detail:'simple',roofShape:'gable'},
  ruko:{label:'Ruko Jakarta',baseId:'pipeline:ruko_a',kind:'ruko',w:4,d:6,floors:3,room:'warung',walls:['cream','concrete','green','pink'],roofs:['slate','navy'],detail:'storefront',roofShape:'flat'},
  warung:{label:'Warung / Toko',baseId:'pipeline:warung_madura',kind:'warung',w:3,d:4,floors:1,room:'warung',walls:['cream','green','blue'],roofs:['terracotta','slate','navy'],detail:'awning',roofShape:'gable'},
  kantor:{label:'Gedung Kantor',baseId:'pipeline:kantor_a',kind:'kantor',w:7,d:6,floors:5,room:'office',walls:['concrete','blue','cream'],roofs:['slate','navy'],detail:'storefront',roofShape:'flat'},
  hotel:{label:'Hotel / Apartemen',baseId:'pipeline:hotel',kind:'kost',w:8,d:6,floors:6,room:'kost',walls:['cream','concrete','pink'],roofs:['slate','navy'],detail:'storefront',roofShape:'flat'},
  mall:{label:'Mall / Kompleks',baseId:'pipeline:mall',kind:'kantor',w:12,d:7,floors:4,room:'warung',walls:['concrete','blue','cream'],roofs:['navy','slate'],detail:'storefront',roofShape:'flat'},
  masjid:{label:'Landmark · Masjid',baseId:'semesta:large',nativeId:'masjid',kind:'kantor',w:9,d:7,floors:2,room:'empty',walls:['cream'],roofs:['slate'],detail:'simple',roofShape:'flat'}
 });
 const validWall=['cream','concrete','blue','green','pink'];
 const validRoof=['terracotta','slate','navy','green'];
 const clamp=(v,min,max,fallback)=>{const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):fallback;};
 function hash(s){let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
 function rand(seed){let x=seed>>>0;return ()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
 function make(type,options={}){
  const recipe=RECIPES[type];if(!recipe)throw Error('Unknown building recipe: '+type);
  const seed=clamp(options.seed,1,999999,1),random=rand(seed^hash(type));
  const walls=recipe.walls,roofs=recipe.roofs;
  const wall=validWall.includes(options.wall)?options.wall:walls[Math.floor(random()*walls.length)];
  const roof=validRoof.includes(options.roof)?options.roof:roofs[Math.floor(random()*roofs.length)];
  const windowStyle=['square','wide','narrow'][Math.floor(random()*3)];
  const windows=clamp(options.windows,0,6,Math.min(4,recipe.w));
  const name=String(options.name||recipe.label+' '+String(seed).padStart(3,'0')).replace(/[<>"'&]/g,'').slice(0,50);
  const interactive=options.interactive!==false;
  const w=clamp(options.w,2,24,recipe.w),d=clamp(options.d,2,24,recipe.d);
  const floors=clamp(options.floors,1,12,recipe.floors);
  const roomTemplate=String(options.roomTemplate||recipe.room);
  return {
   config:{
    baseId:recipe.baseId,name,kind:recipe.kind,w,d,floors,windows,wall,roof,
    roofShape:recipe.roofShape,detail:recipe.detail,
    doorStyle:['ruko','warung','mall','kantor'].includes(type)?'glass':'wood',
    windowStyle,balcony:(floors>1&&random()>.64)?'yes':'no',
    sign:options.sign?String(options.sign).slice(0,14):'',front:'sw',
    actions:interactive?'enter'+(['ruko','warung','mall'].includes(type)?',buy':''):'',collision:'yes',
    interactive
   },
   recipe:{generator:'bangun-ruang-procedural-v1',type,seed,roomTemplate,
    renderer:recipe.nativeId?'native-pipeline-source-copy':'bangun-ruang-browser-v6b',
    sourceId:recipe.nativeId||recipe.baseId},
   roomTemplate,nativeId:recipe.nativeId||null
  };
 }
 function mount(host){
  if(!host||typeof host.generate!=='function')throw Error('Generator host missing');
  const $=id=>document.getElementById(id);
  const css=document.createElement('style');
  css.textContent=[
   '#brGenDialog{width:min(570px,calc(100vw - 24px));max-height:calc(100dvh - 30px);overflow:auto;border:2px solid #2d5fa6;border-radius:6px;padding:0;color:#273448;background:#ece9d8;box-shadow:0 16px 60px #001a5688;font:12px Tahoma,sans-serif}',
   '#brGenDialog::backdrop{background:#001d4c88}',
   '#brGenDialog .brg-title{padding:11px 13px;color:#fff;font-weight:bold;background:linear-gradient(#65acff,#0954c4)}',
   '#brGenDialog .brg-body{padding:14px;display:grid;gap:10px}',
   '#brGenDialog label{display:grid;gap:4px;font-weight:bold;font-size:11px}',
   '#brGenDialog input,#brGenDialog select{width:100%;padding:8px;border:1px solid #8da1b8;border-radius:2px;background:white;color:#253850}',
   '#brGenDialog .brg-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
   '#brGenDialog .brg-actions{display:flex;gap:7px;flex-wrap:wrap;border-top:1px solid #c2c5c7;padding:11px}',
   '#brGenDialog button{padding:8px 10px}',
   '#brGenDialog small{color:#596e86;line-height:1.5}',
   '#brGenDialog output{display:block;font-weight:bold;color:#335b82;min-height:16px}',
   '@media(max-width:550px){#brGenDialog .brg-cols{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(css);
  const dialog=document.createElement('dialog');dialog.id='brGenDialog';
  dialog.innerHTML=[
   '<div class="brg-title">✳ BANGUN RUANG / GENERATE BUILDING · V6B</div>',
   '<div class="brg-body">',
   '<label>BUILDING RECIPE<select id="brgType"></select></label>',
   '<label>BUILDING NAME<input id="brgName" maxlength="50"></label>',
   '<div class="brg-cols">',
   '<label>WIDTH / TILES<input id="brgW" type="number" min="2" max="24" step="1"></label>',
   '<label>DEPTH / TILES<input id="brgD" type="number" min="2" max="24" step="1"></label>',
   '<label>FLOORS (MAX 12)<input id="brgFloors" type="number" min="1" max="12" step="1"></label>',
   '<label>VARIATION SEED<input id="brgSeed" type="number" min="1" max="999999" value="1"></label>',
   '<label>WALL PALETTE<select id="brgWall"><option value="auto">Auto · deterministic variation</option><option value="cream">Cream</option><option value="concrete">Concrete</option><option value="blue">Blue</option><option value="green">Green</option><option value="pink">Pink</option></select></label>',
   '<label>ROOF PALETTE<select id="brgRoof"><option value="auto">Auto · deterministic variation</option><option value="terracotta">Terracotta</option><option value="slate">Slate</option><option value="navy">Navy</option><option value="green">Green</option></select></label>',
   '</div>',
   '<label><span><input id="brgInteractive" type="checkbox" checked style="width:auto;margin-right:6px"> Enterable building · create editable interior</span></label>',
   '<label>GROUND FLOOR INTERIOR TEMPLATE<select id="brgRoom"></select></label>',
   '<label>AFTER GENERATE<select id="brgAfter"><option value="exterior">Edit exterior first</option><option value="interior">Edit interior first</option></select></label>',
   '<small id="brgNote">One draft building. Changes are not saved until Save Asset / Save to Semesta. Existing saved buildings remain untouched.</small>',
   '<output id="brgStatus" role="status">READY · NO IMAGE AI REQUIRED</output>',
   '</div><div class="brg-actions">',
   '<button type="button" id="brgCreate" class="primary">✳ Generate → Edit</button>',
   '<button type="button" id="brgVariation">↻ Next variation</button>',
   '<button type="button" id="brgCancel">Close</button>',
   '</div>'
  ].join('');
  document.body.appendChild(dialog);
  for(const [id,recipe] of Object.entries(RECIPES)){
   const o=document.createElement('option');o.value=id;o.textContent=recipe.label;$('brgType').appendChild(o);
  }
  const rooms=window.VLBuildingInterior?.templates||{};
  for(const [key,template] of Object.entries(rooms)){
   const o=document.createElement('option');o.value=key;o.textContent=template.label||key;$('brgRoom').appendChild(o);
  }
  let autoName=true;
  function defaults(){
   const type=$('brgType').value,p=RECIPES[type];
   $('brgW').value=p.w;$('brgD').value=p.d;$('brgFloors').value=p.floors;
   $('brgRoom').value=rooms[p.room]?p.room:'empty';
   $('brgName').value=p.label+' '+String($('brgSeed').value||1).padStart(3,'0');
   $('brgWall').value='auto';$('brgRoof').value='auto';autoName=true;
   const landmark=!!p.nativeId;
   for(const id of ['brgW','brgD','brgFloors'])$(id).disabled=landmark;
   $('brgNote').textContent=landmark
    ?'This landmark imports approved native pipeline PNGs for editing. Missing rear-view PNGs get a procedural fallback; landmark geometry is not freely parametric yet.'
    :'Draft built with deterministic no-AI pixel geometry; four views, footprint and editable interior are passed into Bangun Ruang. Save explicitly when ready.';
  }
  $('brgType').onchange=defaults;
  $('brgName').oninput=()=>{autoName=false;};
  $('brgVariation').onclick=()=>{
   $('brgSeed').value=String((clamp($('brgSeed').value,1,999999,1)%999999)+1);
   if(autoName)$('brgName').value=RECIPES[$('brgType').value].label+' '+String($('brgSeed').value).padStart(3,'0');
   $('brgStatus').textContent='VARIATION '+$('brgSeed').value+' READY · CLICK GENERATE';
  };
  $('brgCancel').onclick=()=>dialog.close();
  $('brgCreate').onclick=async()=>{
   if($('brgCreate').disabled)return;
   const options={
    name:$('brgName').value,w:$('brgW').value,d:$('brgD').value,
    floors:$('brgFloors').value,seed:$('brgSeed').value,
    wall:$('brgWall').value,roof:$('brgRoof').value,
    interactive:$('brgInteractive').checked,roomTemplate:$('brgRoom').value
   };
   const result=make($('brgType').value,options);
   $('brgCreate').disabled=true;$('brgStatus').textContent='CREATING EDITABLE BUILDING DRAFT…';
   try{
    const created=await host.generate(result,$('brgAfter').value);
    if(created===false){$('brgStatus').textContent='GENERATION CANCELLED · EXISTING EDITOR PRESERVED';return;}
    $('brgStatus').textContent='✓ DRAFT READY · EDIT AND SAVE WHEN APPROVED';
    dialog.close();
   }catch(err){
    $('brgStatus').textContent='⚠ GENERATE FAILED: '+(err?.message||String(err));
   }finally{$('brgCreate').disabled=false;}
  };
  defaults();
  return Object.freeze({open(){
   if(!dialog.open)dialog.showModal();
   $('brgType').focus();
  },close(){dialog.close();}});
 }
 return Object.freeze({RECIPES,make,mount});
});

/* GPT Version only: lower park movement, safe furniture footprints, native sitting. */
'use strict';
function gptParkPatch(html) {
  function change(oldText,newText) {
    if (html.split(oldText).length!==2) throw Error('GPT_PARK_ANCHOR '+oldText.slice(0,72));
    html=html.replace(oldText,newText);
  }
  change('region.terminal=[-40,34,51.4,54.7];',
    'region.terminal=[-40,34,51.4,54.7]; region.park=[-2,34,37.1,49.2];');
  change('return inR(R.side) || inR(R.lane) || (R.terminal ? inR(R.terminal) : false); }',
    'return inR(R.side) || inR(R.lane) || (R.park ? inR(R.park) : false) || (R.terminal ? inR(R.terminal) : false); }');
  change('return prop(c+0.8,r+0.25,0.8,g=>',
    'return prop(c+0.8,r+0.25,1.05,g=>');
  change('function lamp(c,r){ return prop(c,r,0.35,',
    'function lamp(c,r){ return prop(c,r,0.53,');
  change('const RANGE_SEAT = 1.35;',
    'const RANGE_SEAT = 1.65;');
  change('EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));',
    'gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));');
  change('  // Precise foreground safety pass.', `
  // Functional native park benches, created before the original scene bake.
  function gptParkSetup(){
    if(V16.parkBuilt)return;
    V16.parkBuilt=true;
    var positions=[[11.6,38.85],[29.15,39.2],[11.4,44.45]];
    var lights=[[8.6,38.55],[31.8,38.9],[8.5,44.0]];
    var seats=window.__vcLifeSeats||(window.__vcLifeSeats=[]);
    V16.parkBenches=[];V16.parkLamps=[];
    positions.forEach(function(q,i){
      var from=seats.length,g=bench(q[0],q[1]);
      g._gptPark=true;V16.parkBenches.push(g);
      for(var j=from;j<seats.length;j++){
        var s=seats[j];
        s.zone='street';s.objectId='gpt_park_bench_'+i;s.pose='sit';
        if(typeof SEATDY!=='undefined') SEATDY.push({c:s.c,r:s.r,dy:1.5});
      }
      EXT.blk.push({c:q[0]+.3,r:q[1]+.25,rad:.48});
      EXT.blk.push({c:q[0]+1.3,r:q[1]+.25,rad:.48});
    });
    lights.forEach(function(q){var g=lamp(q[0],q[1]);g._gptPark=true;V16.parkLamps.push(g);});
  }
  // Precise foreground safety pass.`);

  // Important: the lower-park furniture lives in EXT.gF, not EXT.gY.
  // The previous overlay read EXT.dyn (EXT.gY only), silently excluding it.
  // Draw ONLY bench/lamp pixels; trees/buildings keep their native painter.
  change('if(!OUT_ON||!EXT.dyn||!EXT.dyn.length||!XC.b){',
    'if(!OUT_ON||!EXT.props||!EXT.props.length||!XC.b){');
  change('for(var i=0;i<EXT.dyn.length;i++){\n      var n=EXT.dyn[i];',
    'for(var i=0;i<EXT.props.length;i++){\n      var n=EXT.props[i];');
  change('if(!n||!n.isConnected||n._b==null||n._b<pd-.08)continue;',
    "if(!n||!n.isConnected||n._b==null)continue; if(n._k!=='bench'&&n._k!=='lamp'&&!n._gptPark)continue; if(n._b<pd-.30)continue;");
  // Seated players stay above the seat cushions; only the near/front lower
  // portions of that bench are restored over the avatar.
  change('try{for(var j=0;j<hits.length;j++)xcDraw(cv,hits[j],true);}',
    "try{for(var j=0;j<hits.length;j++){var obj=hits[j];if(obj._k==='bench'&&me.forceAnim==='sit'){ctx.save();var rr=obj.getBoundingClientRect();var yy=(rr.top-fr.top+rr.height*.65)*d;ctx.beginPath();ctx.rect(clipX,Math.max(clipY,yy),clipW,Math.max(0,clipY+clipH-yy));ctx.clip();xcDraw(cv,obj,true);ctx.restore();}else xcDraw(cv,obj,true);}}");
  change('GPT VERSION · v16a.17','GPT VERSION · v16a.19');
  return html;
}
self.gptParkPatch=gptParkPatch;

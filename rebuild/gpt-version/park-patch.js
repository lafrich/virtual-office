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
  change('GPT VERSION · v16a.17','GPT VERSION · v16a.18');
  return html;
}
self.gptParkPatch=gptParkPatch;

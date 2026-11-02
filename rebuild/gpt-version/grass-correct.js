/* GPT-only lower/near-side park cleanup.
   IMPORTANT: the park visible BELOW the street is r<32.5, not r>36.
   Do not add any canvas overlay; keep original pixel grass and road textures. */
'use strict';
function gptGrassCorrect(html){
  function exactly(from,to){
    const n=html.split(from).length-1;
    if(n!==1)throw Error('GPT_GRASS_CORRECT_ANCHOR '+n+' '+from.slice(0,100));
    html=html.replace(from,to);
  }
  // Disable the experimental far-park furniture introduced by v16a.18.
  exactly('gptParkSetup(); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));',
          'EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p));');
  exactly('return prop(c+0.8,r+0.25,1.05,g=>',
          'return prop(c+0.8,r+0.25,0.8,g=>');
  exactly('function lamp(c,r){ return prop(c,r,0.53,',
          'function lamp(c,r){ return prop(c,r,0.35,');
  exactly('const RANGE_SEAT = 1.65;', 'const RANGE_SEAT = 1.35;');
  // Don't composite the market sprite atlas on top of the player.
  exactly("var parkLevel=(S2X.far&&S2X.lv&&S2X.lv.g&&S2X.lv.g.getAttribute('display')!=='none'&&me.r>=36.35&&me.r<=51)?S2X.lv.g:null;",
          'var parkLevel=null;');

  // The park in the screenshots is the NEAR side, r28..32.5. Remove
  // decorative near-side props at construction, before baking and before
  // registering collisions / bench seat anchors. This preserves grass below.
  exactly('planter(-8.5,28.4,1.6); bench(-6.8,28.6); bench(5.2,28.65); bikeRack(10.4,28.95); planter(13.2,28.6,1.4); bench(16.4,28.65); bench(25.3,28.65);',
          '/* GPT empty park: no near-side planters / benches / bike rack */');
  exactly('[-0.5,8,14,20.0,26.6,32.5].forEach(c=>lamp(c,32.2));',
          '/* GPT empty park: decorative street/park lamps removed */');
  exactly("bin(-0.9,32.2,['#2EB872','#22A094','#1B7F76']); bin(7.4,32.2,['#FF9F43','#E08A2E','#C9731F']); bin(27.3,32.2,['#2EB872','#22A094','#1B7F76']);",
          '/* GPT empty park: curb bins removed */');
  exactly("signPost(-4.8,32.2,'P',['#2C6BD8']); signPost(19.3,32.2,'CROSS',['#2C6BD8']); s2Signals(); s2lProps(); hydrant(25.3,32.2);",
          "/* Keep crossing signals, market props and the real zebra crossing. */ s2Signals(); s2lProps();");
  // Remove only trees directly in the near-side garden; distant/shop
  // greenery stays. There must be no tree sprites atop the replacement lawn.
  exactly("[[2.4,29.0,'round'],[9.0,29.0,'tall'],[18.9,28.95,'palm'],[27.7,29.0,'round'],[-0.3,29.0,'tall'],[-9.9,29.2,'round']].forEach(([c,r,k,s])=>T(k,c,r,s||1,0.55));",
          '/* GPT empty park: near-side ornamental trees removed */');
  exactly('EXT.trees.forEach(t=>{ let k=-1; SHOPS.forEach((s,i)=>{ if(t.c>s.c1||t.r>s.r1) k=i; });',
          'EXT.trees.forEach(t=>{ if(t.r>=28.0&&t.r<=32.6) {t.g.remove(); return;} let k=-1; SHOPS.forEach((s,i)=>{ if(t.c>s.c1||t.r>s.r1) k=i; });');
  // Prune only collision created by objects in the now-vacant garden strip,
  // not the office doors, indoor walls, road or far-side gang.
  exactly("EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p)); EXT.dyn=[...EXT.gY.children].filter(n=>n._b!=null);",
          "EXT.blk=EXT.blk.filter(b=>b.r<=28.35||b.r>32.35); EXT.yardP.forEach(p=>(p._r>36.4?EXT.gF:EXT.gY).appendChild(p)); EXT.dyn=[...EXT.gY.children].filter(n=>n._b!=null);");
  // Existing VEG.lawn is the correctly aligned textured grass ground.
  // No new canvas, rectangle or green polygon is added to the game.
  exactly('GPT VERSION · v16a.21','GPT VERSION · v16a.28 · PARK');
  return html;
}
self.gptGrassCorrect=gptGrassCorrect;
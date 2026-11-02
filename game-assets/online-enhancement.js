/* Online integration of GPT visuals, road traffic, movement and XP loading.
 * Never writes multiplayer state, accounts, tokens or save data.
 * The root Service Worker calls onlineEnhanceHtml() AFTER decryption.
 * ?classic=1 skips this patch without touching user state.
 */
'use strict';
function onlineEnhanceHtml(html){
  if(!html.includes('vc-street2-xing')||!html.includes('Virtual Life v15a'))
    throw Error('ONLINE_ENHANCEMENT_UNSUPPORTED_WORLD');
  if(!self.gptApplyA||!self.gptLoadingPatch)
    throw Error('ONLINE_ENHANCEMENT_MISSING_MODULE');
  const result=self.gptApplyA(html);
  let out=result.html;
  function replaceOne(a,b){
    const count=out.split(a).length-1;
    if(count!==1)throw Error('ONLINE_INTEGRATION_ANCHOR '+count+' '+a.slice(0,90));
    out=out.replace(a,b);
  }
  // Keep native online tap-to-walk and demo activities enabled. The GPT
  // offline preview turned these off because it did not use online accounts.
  replaceOne('/* beta A1: floor tap disabled; NPC/object click remains */',
             'const p=toSvg(e), g=toGrid(p.x,p.y); if(okG(g.c,g.r)) goTo({c:g.c,r:g.r});');
  replaceOne('const DM_SLOTS=[]','const DM_SLOTS=[{h:12,dir:1},{h:19,dir:-1}]');

  // The beta preview hid online status, notifications, and parts of the HUD.
  // Keep all those production controls. Add only safe style improvements.
  const begin='<style id="gpt-v16a-css">';
  const at=out.indexOf(begin),end=out.indexOf('</style>',at);
  if(at<0||end<0||out.indexOf(begin,at+1)>=0)
    throw Error('ONLINE_INTEGRATION_CSS_ANCHOR');
  const css='<style id="online-v16a-css">'+
    'html,body{min-height:100%;overscroll-behavior:none}'+
    '@media(max-width:600px){#vj-toast{top:clamp(192px,32dvh,285px)!important;bottom:auto!important;max-width:min(300px,calc(100vw - 28px))}}'+
    '.s2l-spark,[class*=sparkle]{opacity:.45!important}</style>';
  out=out.slice(0,at)+css+out.slice(end+'</style>'.length);
  // Remove preview-only diagnostic badge and version flag.
  replaceOne('<div id="gpt-pkg-a" style="position:fixed;top:4px;right:8px;z-index:2147483000;pointer-events:none;background:#183758d9;color:#fff;padding:3px 7px;font:bold 10px Tahoma">GPT VERSION · v16a.17</div>','');
  replaceOne("window.__vsBuild = 'Virtual Life v16a · GPT beta';",
             "window.__vsBuild = 'Virtual Life v16a · Online';");
  // Online painter fix: the preview was built for a single offline player.
  // It skipped individual vehicle sprites based on center-point depth and
  // placed a second clip canvas over the avatar. In the multiplayer map this
  // could make the character appear to stand ON a bus or street furniture.
  // Use the native two-canvas renderer, with road vehicles kept on its true
  // front canvas. Keep the far-side background and gate-pavement safety logic.
  replaceOne(
    "xcDraw(XC.f,EXT.RF); if(window.__gptDepthDraw)window.__gptDepthDraw(); }catch(e){",
    "xcDraw(XC.f,EXT.RF); }catch(e){"
  );
  const skipStart=out.indexOf('function v16DepthSkip(far){');
  const skipEnd=out.indexOf('  // Precise foreground safety pass.',skipStart);
  if(skipStart<0||skipEnd<0||out.indexOf('function v16DepthSkip(far){',skipStart+1)>=0)
    throw Error('ONLINE_DEPTH_SORT_ANCHOR');
  const oldSort=out.slice(skipStart,skipEnd);
  if(!oldSort.includes('o.back=far||')||
     !oldSort.includes('XC.skip=back.length?back:null;')||
     !oldSort.includes('var roadLevel=far'))
    throw Error('ONLINE_DEPTH_SORT_INCOMPATIBLE');
  const safeSort=`function v16DepthSkip(far){
    // Never move animated traffic to the rear based on its sprite center.
    // All traffic remains in EXT.gC (front); individual NPCs and furniture
    // retain the native engine's group ordering and footprint depth.
    var back=[];
    if(far&&S2X.gFB)back.push(S2X.gFB);
    var roadLevel=far&&S2X.lv&&S2X.lv.g&&me.r>=51.25&&me.r<=54.85;
    if(roadLevel)back.push(S2X.lv.g);
    XC.skip=back.length?back:null;
  }
  `;
  out=out.slice(0,skipStart)+safeSort+out.slice(skipEnd);

  // Undo the beta's altered Level-PNG transparency mask: painting some
  // gate floor colors as transparent also erased overlapping artwork in
  // the online map, so fall back to the original, unmodified PNG decoder.
  const changedXcImg="function xcImg(u){ let i=XC.imgs.get(u); if(!i){ i=new Image(); i.src=u; XC.imgs.set(u,i); } if(!i.complete||!i.naturalWidth)return null;";
  const imgStart=out.indexOf(changedXcImg);
  const tail="return clean&&clean.complete&&clean.naturalWidth?clean:null; }";
  const imgStop=out.indexOf(tail,imgStart);
  if(imgStart<0||imgStop<0||imgStop-imgStart>4000)
    throw Error('ONLINE_LEVEL_ASSET_ANCHOR');
  const originalXcImg="function xcImg(u){ let i=XC.imgs.get(u); if(!i){ i=new Image(); i.src=u; XC.imgs.set(u,i); } return i.complete&&i.naturalWidth?i:null; }";
  const currentAssetBlock=out.slice(imgStart,imgStop+tail.length);
  if(!currentAssetBlock.includes("i._gptFloorDone")||!currentAssetBlock.includes("return clean&&clean.complete"))
    throw Error('ONLINE_LEVEL_ASSET_INCOMPATIBLE');
  out=out.slice(0,imgStart)+originalXcImg+out.slice(imgStop+tail.length);

  // Reuse the established XP loading screen. It reads local game-renderer
  // readiness only, never auth state or multiplayer tokens.
  out=self.gptLoadingPatch(out);
  if(!out.includes('function xcFrame(dt)')||
     !out.includes('gpt-loading-screen')||
     !out.includes('function v16RoadOK(c,r)')||
     !out.includes("window.__vsBuild = 'Virtual Life v16a · Online'"))
    throw Error('ONLINE_INTEGRATION_INCOMPLETE');
  return {html:out,applied:result.applied,features:[
    'traffic-clock','pedestrian-crossings','character-movement',
    'world-depth','tree-shadow','mobile-compositor','xp-loader'
  ]};
}
self.onlineEnhanceHtml=onlineEnhanceHtml;
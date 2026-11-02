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
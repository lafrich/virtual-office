/* JIWA CONTEXT EDITOR: keeps existing World, Systems, Test and object inspector intact.
   Edit WHEN / WHERE / IF / THEN; all state changes remain in local Jiwa sandbox. */
(function(){
 'use strict';
 const root=document.getElementById('contextEditor');
 const F=window.JiwaFoundation,B=window.JiwaContextBridge;
 if(!root||!F||!B)return;
 let current='crossing',filter='All',sequence=0,lastPayload=null;
 const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const options=(arr,value)=>arr.map(v=>'<option value="'+escapeHTML(v)+'"'+(v===value?' selected':'')+'>'+escapeHTML(v.replaceAll('_',' '))+'</option>').join('');
 const ctxData=()=>B.project()?.foundation||null;
 function selected(){
  const f=ctxData();if(!f)return null;
  const matches=f.contexts.filter(x=>filter==='All'||x.group===filter);
  if(!matches.length)return null;
  const found=matches.find(x=>x.id===current);
  if(!found)current=matches[0].id;
  return found||matches[0];
 }
 function lineRows(ctx,key,kinds){
  const rows=ctx[key]||[];
  if(!rows.length)return '<p class="subtle">Belum ada '+(key==='conditions'?'syarat':'konsekuensi')+'.</p>';
  return rows.map((r,i)=>'<div class="context-row">'+
   '<select data-row-key="'+key+'" data-row-index="'+i+'" data-part="kind" aria-label="'+key+' type '+(i+1)+'">'+options(kinds,r.kind)+'</select>'+
   '<input data-row-key="'+key+'" data-row-index="'+i+'" data-part="value" aria-label="'+key+' value '+(i+1)+'" maxlength="120" value="'+escapeHTML(r.value)+'">'+
   '<button type="button" data-remove="'+key+':'+i+'" aria-label="Delete '+key+' '+i+'">×</button></div>').join('');
 }
 function render(){
  const f=ctxData();
  if(!f){root.innerHTML='<div class="card"><h3>CONTEXT FOUNDATION</h3><p>Simpan kota dulu melalui Semesta → Save City. Jiwa menyimpan konfigurasi per kota, tidak mengubah scene.</p></div>';return;}
  const ctx=selected(),s=f.settings,active=B.selectedObject();
  if(!ctx){root.innerHTML='<div class="card">No contexts configured.</div>';return;}
  const displayed=f.contexts.filter(x=>filter==='All'||x.group===filter);
  const badObject=ctx.objectId&&(!active||ctx.objectId!==active.id);
  root.innerHTML=
    '<div class="card"><h3>FOUNDATION / LIFE CONTEXTS</h3>'+
     '<p class="subtle">Aturan dasar sudah siap. Edit konteks (WHEN → WHERE → IF → THEN) tanpa edit kode game. SIMULATE = sandbox lokal, tidak mengubah akun/multiplayer.</p>'+
     '<div class="context-grid">'+
      '<label>Group<select id="foundationGroup">'+options(['All'].concat(F.GROUPS),filter)+'</select></label>'+
      '<label>Context<select id="foundationPicker">'+displayed.map(x=>'<option value="'+escapeHTML(x.id)+'"'+(ctx.id===x.id?' selected':'')+'>'+escapeHTML(x.label)+'</option>').join('')+'</select></label>'+
     '</div><div class="controls"><button id="foundationNew" type="button">＋ NEW CONTEXT</button>'+
     (ctx.id.startsWith('custom_')?'<button id="foundationDelete" type="button">🗑 DELETE</button>':'<button id="foundationDefault" type="button">↶ RESET PRESET</button>')+
     '</div></div>'+
    '<div class="card"><h3>WORLD RULES / GUARDRAILS</h3>'+
      '<div class="context-grid">'+
       '<label>Max Bag Slots<input value="8 (fixed, physical bag)" readonly></label>'+
       '<label>Daily wage cap (Rp)<input type="number" min="0" max="100000" step="500" data-setting="dailyWageCap" value="'+s.dailyWageCap+'"></label>'+
       '<label>Course XP / day<input type="number" min="0" max="150" data-setting="dailyCourseXpCap" value="'+s.dailyCourseXpCap+'"></label>'+
       '<label>Base Luck / 100<input type="number" min="0" max="100" data-setting="baseLuck" value="'+s.baseLuck+'"></label>'+
      '</div>'+
      '<label class="context-checkbox"><input type="checkbox" data-setting="socialEnabled" '+(s.socialEnabled?'checked':'')+'> Enable Social Opportunities in sandbox</label>'+
      '<p class="subtle">Default: status offline tidak decay. Income, inventory dan housing harus divalidasi server saat nanti publish. Moral tidak otomatis menjadi reputasi.</p></div>'+
    '<div class="card"><h3>EDIT CONTEXT — '+escapeHTML(ctx.id)+'</h3>'+
      '<label class="context-checkbox"><input id="foundationEnabled" type="checkbox" '+(ctx.enabled?'checked':'')+'> Context enabled</label>'+
      '<div class="context-grid">'+
       '<label>Context Name<input data-edit="label" maxlength="70" value="'+escapeHTML(ctx.label)+'"></label>'+
       '<label>Category<select data-edit="group">'+options(F.GROUPS,ctx.group)+'</select></label>'+
       '<label>WHEN / Event<input data-edit="trigger" maxlength="80" value="'+escapeHTML(ctx.trigger)+'"></label>'+
       '<label>WHERE / Object Tag<input data-edit="target" maxlength="80" value="'+escapeHTML(ctx.target)+'"></label>'+
      '</div>'+
      '<label>Purpose / Story Context<textarea data-edit="description" rows="2" maxlength="300">'+escapeHTML(ctx.description)+'</textarea></label>'+
      '<div class="context-object"><b>Specific Semesta Object</b><div class="mini">'+escapeHTML(ctx.objectId||'Any matching object tag')+'</div>'+
        '<div class="controls"><button type="button" id="foundationBind" '+(!active?'disabled':'')+'>◉ USE SELECTED OBJECT'+(active?' · '+escapeHTML(active.name).slice(0,34):'')+'</button>'+
        '<button type="button" id="foundationUnbind">CLEAR BINDING</button></div>'+
        (badObject?'<p class="subtle">Binding objek berbeda dari pilihan saat ini. Periksa jika aset diganti/ID berubah.</p>':'')+
      '</div>'+
      '<h4>IF / CONDITIONS</h4>'+lineRows(ctx,'conditions',F.CONDS)+
      '<button type="button" data-add="conditions">＋ CONDITION</button>'+
      '<h4>THEN / CONSEQUENCES</h4>'+lineRows(ctx,'effects',F.EFFECTS)+
      '<button type="button" data-add="effects">＋ EFFECT</button>'+
      '<p class="subtle">Effects diproses atomik dalam sandbox. Edit nominal, syarat, atau target; animasi/pemicu world live tetap terpisah sampai runtime server tersambung.</p>'+
    '</div>'+
    '<div class="card"><h3>TRY THIS CONTEXT</h3><p class="subtle">Aksi yang berisiko divalidasi ulang. Uji kondisi normal atau softlock sebelum dipakai sebagai gameplay.</p>'+
     '<div class="context-grid"><label>Test Scenario<select id="foundationScenario">'+options(['normal','wallet_zero_energy_zero','bag_full','has_room','trust_skill_ready','unverified'],root.dataset.scenario||'normal')+'</select></label>'+
      '<label>Current Test Day<input readonly value="'+(B.sandbox()?.gameDay||1)+'"></label></div>'+
     '<div class="controls"><button type="button" id="foundationRun" class="primary">▶ SIMULATE</button>'+
     '<button type="button" id="foundationDay">＋ NEXT GAME DAY</button>'+
     '<button type="button" id="foundationReset">↻ RESET SANDBOX</button></div>'+
     '<p class="subtle">Cek hasilnya di tab TEST. Existing HP, HUD, 8-slot bag, dan tombol Action tidak berubah.</p></div>';
 }
 root.addEventListener('change',ev=>{
  const el=ev.target,f=ctxData(),ctx=selected();if(!f||!ctx)return;
  if(el.id==='foundationGroup'){filter=el.value;render();return;}
  if(el.id==='foundationPicker'){current=el.value;render();return;}
  if(el.id==='foundationScenario'){root.dataset.scenario=el.value;return;}
  if(el.id==='foundationEnabled'){ctx.enabled=el.checked;B.changed();return;}
  if(el.dataset.setting){
   const name=el.dataset.setting;
   f.settings[name]=name==='socialEnabled'?el.checked:Number(el.value);
   f.settings=F.normalizeFoundation(f).settings;
   B.changed();render();return;
  }
  if(el.dataset.edit){
   const name=el.dataset.edit;
   ctx[name]=String(el.value).slice(0,name==='description'?300:80);
   B.changed();
   if(name==='group'){filter='All';render();}
   return;
  }
  if(el.dataset.rowKey){
   const rows=ctx[el.dataset.rowKey],row=rows?.[Number(el.dataset.rowIndex)];
   if(!row)return;
   row[el.dataset.part]=String(el.value).slice(0,120);B.changed();
  }
 });
 root.addEventListener('click',ev=>{
  const el=ev.target.closest('button');if(!el)return;
  const f=ctxData(),ctx=selected();if(!f||!ctx)return;
  if(el.id==='foundationNew'){
   const id='custom_'+Date.now().toString(36);
   f.contexts.push({id,label:'Custom Context',group:filter==='All'?'Survival':filter,trigger:'CUSTOM_EVENT',
     target:'world_object',description:'Describe the interaction and its consequence.',enabled:true,
     conditions:[{kind:'verified',value:'true'}],effects:[{kind:'message',value:'Action completed'}],objectId:''});
   current=id;B.changed();render();return;
  }
  if(el.id==='foundationDelete'){
   if(!ctx.id.startsWith('custom_')||!confirm('Delete this custom context?'))return;
   f.contexts=f.contexts.filter(x=>x.id!==ctx.id);current='crossing';filter='All';B.changed();render();return;
  }
  if(el.id==='foundationDefault'){
   if(!confirm('Restore default conditions and effects for '+ctx.label+'?'))return;
   const original=F.defaultFoundation().contexts.find(x=>x.id===ctx.id);if(!original)return;
   const index=f.contexts.indexOf(ctx);f.contexts[index]=original;B.changed();render();return;
  }
  if(el.id==='foundationBind'){
   const o=B.selectedObject();if(o){ctx.objectId=o.id;B.changed();render();}return;
  }
  if(el.id==='foundationUnbind'){ctx.objectId='';B.changed();render();return;}
  if(el.dataset.add){
   const key=el.dataset.add;if(ctx[key].length>=20)return;
   ctx[key].push(key==='conditions'?{kind:'verified',value:'true'}:{kind:'message',value:'Action occurred'});
   B.changed();render();return;
  }
  if(el.dataset.remove){
   const parts=el.dataset.remove.split(':'),key=parts[0],index=Number(parts[1]);
   if((key==='conditions'||key==='effects')&&Number.isInteger(index)){ctx[key].splice(index,1);B.changed();render();}return;
  }
  if(el.id==='foundationReset'){B.reset();render();return;}
  if(el.id==='foundationDay'){B.nextDay();render();return;}
  if(el.id==='foundationRun'){
   const s=B.sandbox();if(!s)return;
   const scenario=root.dataset.scenario||'normal';
   if(scenario==='wallet_zero_energy_zero'){s.wallet=0;s.energy=0;s.homeAccess=false;}
   if(scenario==='bag_full'){s.inventory=Array.from({length:8},(_,i)=>'test_item_'+i);}
   if(scenario==='has_room'){s.homeAccess=true;}
   if(scenario==='trust_skill_ready'){s.trust=80;s.skill=80;s.moral=75;}
   const id='jiwa-demo-'+Date.now()+'-'+(++sequence);
   const payload={eventId:id,verified:scenario!=='unverified',progressComplete:true,confirmed:true,
    witnessed:true,recipient:true,itemId:'botol_bekas',spawnId:'scavenge-'+sequence,
    jobInstanceId:'job-'+sequence,crossingId:'crossing-'+sequence,referralKey:'demo_referral',
    objectId:ctx.objectId||'',targetTag:ctx.target,verifiedPrice:1200,roll:0.1,source:'sandbox'};
   lastPayload=payload;
   B.test(ctx.id,payload);return;
  }
 });
 window.addEventListener('jiwa:context:render',render);
 render();
})();
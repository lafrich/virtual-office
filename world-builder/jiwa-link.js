/* Semesta → JIWA deep link. Uses only the saved City Draft ID and selected object ID.
   No city edits; no game account or encrypted assets touched. */
(function(){
'use strict';
const bar=document.querySelector('.active-asset-bar');
if(!bar)return;
const btn=document.createElement('button');
btn.id='openJiwaForObject';btn.type='button';btn.textContent='⚙ JIWA / MECHANICS';
btn.title='Configure gameplay rules for the selected object in JIWA.EXE';
btn.style.cssText='white-space:nowrap;min-height:28px;max-width:180px;background:linear-gradient(#fff,#d3e6f9);border:1px solid #7595ae;color:#173b61;font:700 10px Tahoma,Arial,sans-serif;cursor:pointer;padding:4px 7px;';
bar.appendChild(btn);
btn.addEventListener('click',()=>{
 const id=document.getElementById('activeAssetPicker')?.value||'';
 const city=localStorage.getItem('virtual-life-active-city-draft')||'';
 if(!city){alert('Save City di Semesta dulu, lalu buka JIWA. JIWA membaca kota tersimpan, bukan working copy yang belum disimpan.');return;}
 const url=new URL('../jiwa/',location.href);
 url.searchParams.set('city',city);
 if(id)url.searchParams.set('object',id);
 window.open(url.href,'_blank','noopener');
});
})();
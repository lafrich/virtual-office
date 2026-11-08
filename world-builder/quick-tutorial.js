/* Welcome wizard for new World Builder users.
 * No map edits and no network requests. The tour can be reopened from Help.
 */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const KEY='virtual-life-city-builder-welcome-v1';
const steps=[
 {icon:'🗺️',title:'Welcome to Semesta!',
  text:'Selamat datang di Semesta. Rancang kota isometric sendiri, letakkan gedung dan props, lalu simpan sebagai City Draft.',
  tip:'Mulai dengan Reference City, atau buat map baru tanpa menghapus draft yang sudah disimpan.'},
 {icon:'✋',title:'Geser map dan lihat grid',
  text:'Geser area kosong untuk pan. Gunakan dua jari untuk pinch zoom; di komputer bisa pakai scroll. Tombol # menampilkan atau menyembunyikan grid.',
  tip:'Grid mengikuti map tanpa batas. Gunakan Snap untuk posisi objek lebih rapi.'},
 {icon:'🏢',title:'Place building & props',
  text:'Buka ▣ Assets, pilih gedung Small, Medium atau Large; lalu tap map untuk menaruhnya. Pohon, kursi, dan lampu juga tersedia.',
  tip:'Preview hijau = boleh ditempatkan. Merah = bertabrakan. Pilih objek untuk mengubah Properties.'},
 {icon:'🛣️',title:'Paint jalan dan taman',
  text:'Di Assets → Terrain pilih Road, Grass, Sidewalk, Water, atau Plaza. Geser jari memakai Paint; gunakan Fill untuk satu area.',
  tip:'Karakter tidak bisa menembus objek solid atau berjalan di air. Gedung besar akan transparan saat menutupi karakter.'},
 {icon:'💾',title:'Test, save, and continue',
  text:'🎥 Character untuk ikuti pemain. Mobil dan ojol loop di jalan, NPC dan crowd loop di trotoar; NPC quest idle di tempat. Simpan lewat 💾 Save Draft.',
  tip:'My Cities membuka draft yang tersimpan di browser ini. Export JSON untuk backup atau diteruskan ke AI developer.'}
];
let idx=0,oldFocus=null;
function show(){
 const step=steps[idx];
 $('tutorialStepCounter').textContent='STEP '+String(idx+1).padStart(2,'0')+' / '+String(steps.length).padStart(2,'0');
 $('tutorialIcon').textContent=step.icon;
 $('tutorialTitle').textContent=step.title;
 $('tutorialText').textContent=step.text;
 $('tutorialHint').textContent='TIP  '+step.tip;
 $('tutorialProgressDots').textContent=steps.map((_,i)=>i===idx?'●':'○').join(' ');
 $('tutorialPrev').disabled=idx===0;
 $('tutorialNext').textContent=idx===steps.length-1?'Start Building ✓':'Next →';
}
function open(){
 oldFocus=document.activeElement;
 idx=0;show();
 $('tutorialOverlay').hidden=false;
 $('tutorialNext').focus();
}
function close(markSeen=true){
 $('tutorialOverlay').hidden=true;
 if(markSeen)try{localStorage.setItem(KEY,'done');}catch{}
 if(oldFocus&&typeof oldFocus.focus==='function')oldFocus.focus();
 oldFocus=null;
}
$('tutorialNext').addEventListener('click',()=>{
 if(idx<steps.length-1){idx++;show();}
 else close();
});
$('tutorialPrev').addEventListener('click',()=>{
 if(idx>0){idx--;show();}
});
$('tutorialSkip').addEventListener('click',()=>close());
$('tutorialClose').addEventListener('click',()=>close());
$('openTutorial').addEventListener('click',open);
$('tutorialOverlay').addEventListener('click',event=>{
 if(event.target===$('tutorialOverlay'))close();
});
g.addEventListener('keydown',event=>{
 if($('tutorialOverlay').hidden)return;
 if(event.key==='Escape'){event.preventDefault();close();}
 if(event.key==='ArrowRight'){event.preventDefault();$('tutorialNext').click();}
 if(event.key==='ArrowLeft'){event.preventDefault();$('tutorialPrev').click();}
});
// New browsers see the tutorial once, after the initial map has loaded.
g.addEventListener('load',()=>{
 // mainkan.exe uses this exact world in player mode; never show editor tutorial.
 if(document.documentElement.classList.contains('semesta-player-mode'))return;
 let seen=false;try{seen=localStorage.getItem(KEY)==='done';}catch{}
 if(!seen)open();
},{once:true});
g.VLQuickTutorial=Object.freeze({open,close,steps:steps.length});
})(window);

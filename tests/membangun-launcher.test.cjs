'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');

test('Membangun is the entry point with all three canonical programs',()=>{
 const s=read('membangun/index.html');
 assert.ok(s.includes("const ids=['mahluk','bangun','semesta'];"));
 assert.ok(s.includes('https://lafrich.github.io/virtual-life-asset-pipeline/'));
 assert.ok(s.includes('https://lafrich.github.io/virtual-office/world-builder/bangun-ruang/'));
 assert.ok(s.includes('https://lafrich.github.io/virtual-office/world-builder/'));
 assert.ok(s.includes('requestedApp=new URLSearchParams(location.search).get(\'app\')'));
 assert.ok(s.includes("let selected=ids.includes(requestedApp)?requestedApp:'mahluk';"));
 assert.ok(s.includes("window.open(url,'_blank','noopener,noreferrer')"));
});
test('desktop panels remain aligned and mobile launcher layout survives',()=>{
 const s=read('membangun/index.html');
 assert.ok(s.includes('@media (min-width:901px)'));
 assert.ok(s.includes('grid-template-columns:218px minmax(0,1fr) 236px'));
 assert.ok(s.includes('@media (min-width:701px) and (max-width:900px)'));
 assert.ok(s.includes('@media(max-width:700px)'));
 assert.ok(s.includes('data-app="mahluk"'));
 assert.ok(s.includes('data-app="bangun"'));
 assert.ok(s.includes('data-app="semesta"'));
});
test('Semesta and Bangun Ruang return through Membangun launcher',()=>{
 const semesta=read('world-builder/index.html');
 const bangun=read('world-builder/bangun-ruang/index.html');
 assert.ok(semesta.includes("location.href='../membangun/?app=semesta'"));
 assert.ok(semesta.includes("location.href='../membangun/?app=bangun'"));
 assert.ok(bangun.includes('href="../../membangun/?app=bangun"'));
 assert.ok(bangun.includes('href="../../membangun/?app=semesta"'));
});
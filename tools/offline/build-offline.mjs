#!/usr/bin/env node
// Build the offline NJH play bundle (for the Android APK / any static WebView).
//   node tools/offline/build-offline.mjs [--out offline-www] [--mirror /path/to/mirror]
// Output keeps the GitHub Pages layout so absolute paths keep working when served from the web root
// (Capacitor serves webDir at https://localhost/):
//   /index.html                         -> redirects to /virtual-office/mainkan/index.html
//   /virtual-office/{mainkan,world-builder,shared,jiwa,content}   play set only (editors/tests/docs pruned)
//   /virtual-life-asset-pipeline/...    baked from the live pipeline Pages site (asset-manifest.json)
//   /vlap-raw/...                       baked raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/...
//   /vendor/three@0.181.0/build/...     vendored three.js (was jsDelivr/unpkg)
// Removed/disabled in the bundle: Worker test login (guest only), Google Identity script, CDN three,
// raw.githubusercontent / lafrich.github.io absolute URLs. The output folder is rebuildable (gitignored).
import fs from 'fs';import path from 'path';import crypto from 'crypto';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));const REPO=path.resolve(HERE,'../..');
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:d;};
const OUT=path.resolve(REPO,arg('--out','offline-www'));
const MIRROR=path.resolve(arg('--mirror',process.env.NJH_OFFLINE_MIRROR||path.join(REPO,'..','njh-offline-mirror')));
if(/(^|\/)(dist|build|out)$/.test(OUT))throw Error('use a non dist/build/out folder name');
const manifest=JSON.parse(fs.readFileSync(path.join(HERE,'asset-manifest.json'),'utf8'));
const VO_PATHS=JSON.parse(fs.readFileSync(path.join(HERE,'vo-play-paths.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const TEXT=/\.(js|mjs|json|html|css|txt|svg)$/i;
// --- play set from this repo ---------------------------------------------------------------
// Whole folders whose files are picked at runtime (interiors, map preview data, art, HUD icons).
const DYNAMIC_DIRS=['mainkan/njh-icons','shared/vl-hud','world-builder/njh-play-interiors','world-builder/njh-map-preview',
  'world-builder/bangun-ruang','world-builder/ellen-preview-assets','world-builder/legacy-assets','content'];
const PRUNE=[/\.md$/i,/\.py$/i,/(^|\/)tests?\//,/(^|\/)tools\//,/(^|\/)README/i,/\.test\.c?js$/,/\.e2e\./,
  /^world-builder\/bangun-ruang\/index\.html$/,/^world-builder\/njh-map-preview\/serve\.py$/,/\.(zip|psd|aseprite|blend|xcf)$/i];
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else out.push(f);}return out;}
const voFiles=new Set();
for(const p of VO_PATHS){const rel=p.replace(/^\/virtual-office\//,'').replace(/\/$/,'/index.html');if(fs.existsSync(path.join(REPO,rel))&&fs.statSync(path.join(REPO,rel)).isFile())voFiles.add(rel);}
for(const d of DYNAMIC_DIRS)for(const f of walk(path.join(REPO,d)))voFiles.add(path.relative(REPO,f));
for(const must of ['mainkan/index.html','world-builder/index.html','mainkan/config.js'])voFiles.add(must);
const kept=[...voFiles].filter(r=>!PRUNE.some(rx=>rx.test(r))).sort();
// --- transforms ------------------------------------------------------------------------------
const RAW=/https:\/\/raw\.githubusercontent\.com\/lafrich\/virtual-life-asset-pipeline\/main\//g;
function rewrite(rel,s){
  s=s.replace(RAW,'/vlap-raw/');
  s=s.replace(/'https:\/\/raw\.githubusercontent\.com\/lafrich\/virtual-life-asset-pipeline\/'\+PREVIEW_REF\+'\/'/g,"'/vlap-raw/'");
  s=s.replace(/https:\/\/lafrich\.github\.io\/virtual-life-asset-pipeline\//g,'/virtual-life-asset-pipeline/');
  if(rel==='world-builder/builder.js'){
    const a="'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js',\n  'https://unpkg.com/three@0.181.0/build/three.module.js'";
    if(!s.includes(a))throw Error('builder.js three CDN block changed');
    s=s.replace(a,"'/vendor/three@0.181.0/build/three.module.js'");
    s=s.replace('Periksa koneksi internet dan muat ulang.','Muat ulang aplikasi.');
  }
  if(rel==='mainkan/app.js'){
    const a="new URL('../world-builder/',location.href)";if(!s.includes(a))throw Error('app.js world url changed');
    s=s.replace(a,"new URL('../world-builder/index.html',location.href)");
  }
  if(rel==='world-builder/jiwa-link.js')s=s.replace("new URL('../jiwa/',location.href)","new URL('../jiwa/index.html',location.href)");
  if(rel==='mainkan/config.js')s="/* Offline APK build: no server. Guest only, progress stays on the device. */\nwindow.NJH_OFFLINE=true;\nwindow.MAINKAN_CONFIG=Object.freeze({apiBase:''});\n";
  if(rel.endsWith('index.html')){
    s=s.replace(/<script src="https:\/\/accounts\.google\.com\/gsi\/client"[^>]*><\/script>\n?/g,'');
    s=s.replace(/<head>/i,'<head>\n<script>window.NJH_OFFLINE=true;</script>');
    if(rel==='mainkan/index.html')s=s.replace('<title>','<link rel="icon" href="data:,">\n<title>');
  }
  return s;
}
// --- write ------------------------------------------------------------------------------------
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
let bytes=0,n=0;const write=(rel,buf)=>{const f=path.join(OUT,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,buf);bytes+=buf.length;n++;};
for(const rel of kept){let b=fs.readFileSync(path.join(REPO,rel));if(TEXT.test(rel))b=Buffer.from(rewrite(rel,b.toString('utf8')));write('virtual-office/'+rel,b);}
function liveUrl(k){
  if(k.startsWith('virtual-life-asset-pipeline/'))return 'https://lafrich.github.io/'+k;
  if(k.startsWith('vlap-raw/'))return 'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/'+k.slice(9);
  if(k.startsWith('vendor/three@0.181.0/'))return 'https://cdn.jsdelivr.net/npm/three@0.181.0/'+k.slice('vendor/three@0.181.0/'.length);
  throw Error('unknown key '+k);
}
const missing=[],drift=[];
for(const f of manifest.files){
  const src=path.join(MIRROR,f.path);let b;
  if(fs.existsSync(src))b=fs.readFileSync(src);
  else{
    const r=await fetch(liveUrl(f.path));if(!r.ok){missing.push(f.path+' HTTP '+r.status);continue;}
    b=Buffer.from(await r.arrayBuffer());fs.mkdirSync(path.dirname(src),{recursive:true});fs.writeFileSync(src,b);
  }
  if(sha(b)!==f.sha256)drift.push(f.path);
  if(TEXT.test(f.path))b=Buffer.from(rewrite(f.path,b.toString('utf8')));
  write(f.path,b);
}
write('index.html',Buffer.from('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Namanya Juga Hidup</title><style>html,body{margin:0;background:#008080}</style><script>location.replace("/virtual-office/mainkan/index.html")</script>\n'));
// leftover external URLs in code (report only; data/xml namespaces and inert links are expected)
const ext={};
for(const f of walk(OUT)){if(!/\.(js|mjs|html|css)$/.test(f))continue;const s=fs.readFileSync(f,'utf8');
  for(const m of s.matchAll(/https?:\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)<>]*/gi)){const h=new URL(m[0]).hostname;if(/w3\.org$/.test(h))continue;(ext[h]=ext[h]||new Set()).add(path.relative(OUT,f));}}
const info={out:OUT,files:n,MB:+(bytes/1048576).toFixed(2),voFiles:kept.length,bakedAssets:manifest.files.length-missing.length,missing,drift:drift.length,driftSample:drift.slice(0,10),
  externalUrlRefs:Object.fromEntries(Object.entries(ext).map(([h,s])=>[h,[...s].slice(0,6)]))};
fs.writeFileSync(path.join(OUT,'offline-build.json'),JSON.stringify({...info,builtAt:new Date().toISOString()},null,1));
console.log(JSON.stringify(info,null,1));
if(missing.length)process.exitCode=1;

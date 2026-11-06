"use strict";
const t=require("node:test"),a=require("node:assert/strict"),fs=require("node:fs");
t("Membangun routes Mahluk Hidup 1 and removes V2 launcher",()=>{
 const h=fs.readFileSync("membangun/index.html","utf8");
 a.match(h,/data-app="mahluk"/);
 a.match(h,/MAHLUK HIDUP\.EXE/);
 a.doesNotMatch(h,/mahluk2|\/mahluk-2\/|MAHLUK HIDUP 2\.0/);
 a.match(h,/https:\/\/lafrich\.github\.io\/virtual-life-asset-pipeline\//);
});
t("Jiwa selects V1 catalog and keeps original custom characters",()=>{
 const s=fs.readFileSync("jiwa/character-link.js","utf8");
 a.match(s,/virtual-life-character-storage-v1/);
 a.match(s,/catalog\.json/);
 a.doesNotMatch(s,/mahluk-2-library-v1/);
 a.doesNotThrow(()=>new Function(s));
});
t("Emosi advertises V1 facial synchronization",()=>{
 const h=fs.readFileSync("emotion-studio/index.html","utf8");
 a.match(h,/MAHLUK HIDUP 1/);
 a.match(h,/emotion-studio-local-v1/);
});
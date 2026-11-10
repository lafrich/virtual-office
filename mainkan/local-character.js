/* Mainkan character kept on this device per test player id, used while the test Worker
 * has no /players/profile route. Stores only the character object (base + looks);
 * never credentials. */
(function(root){
'use strict';
const PREFIX='mainkan-character-v1:';
const key=id=>PREFIX+String(id||'').toLowerCase().replace(/[^a-z0-9_-]/g,'');
function save(id,character){
 if(!id||!character||typeof character!=='object')return false;
 try{root.localStorage.setItem(key(id),JSON.stringify(character));return true;}catch{return false;}
}
function load(id){
 if(!id)return null;
 try{const c=JSON.parse(root.localStorage.getItem(key(id))||'null');return c&&typeof c==='object'?c:null;}catch{return null;}
}
root.MainkanLocalCharacter=Object.freeze({PREFIX,save,load});
})(window);

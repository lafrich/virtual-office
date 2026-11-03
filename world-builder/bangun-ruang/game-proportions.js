/* Bangun Ruang / source-grounded proportions.
 *
 * Based on the user's Virtual Life source snapshot (2026-11-02):
 * workspace/vo-patch/abc-backup-20261031/index.html:
 * TW=32 TH=16 PPU=2, character sheet frame [64,112] pivot [32,100].
 * workspace/vo-mp/ind/p_cove.py:
 * HS=1.6, corridor wall HW=40, door height=30,
 * WC seat top=4.6, tank top=12 (Cove), bowl local footprint/ring.
 * workspace/vo-mp/ind/p_v6b.py:
 * toilet action uses the real 'sit' row, forces SW facing, and uses
 * a separate bowl seat point offset approximately (+0.11,+0.08) tile.
 * This file only defines editor preview geometry; no online game mutation.
 */
(function(g){
'use strict';
const PPU=2,HEIGHT_SCALE=1.6;
const character=Object.freeze({
 frame:Object.freeze([64,112]),
 pivot:Object.freeze([32,100]),
 visibleHeight:72,  // original Ichsan V6B visible bbox y=31..103
 scale:1,           // 64x32 art tile is already PPU=2; no 0.5x twice!
 sitFacing:'sw',
 sitFrameCount:4,
 sitFps:3
});
const building=Object.freeze({
 wallHeight:Math.round(40*HEIGHT_SCALE*PPU),       // 128
 doorHeight:Math.round(30*HEIGHT_SCALE*PPU),       // 96
 doorWidthTiles:.9
});
const toilet=Object.freeze({
 seatHeight:Math.round(4.6*HEIGHT_SCALE*PPU),     // 15
 tankHeight:Math.round(12*HEIGHT_SCALE*PPU),      // 38
 // Source 'cove': bowl centre(-13.285,rr+0.515),
 // seated character(-13.178,rr+0.587) = (+.107,+.072).
 // Source office: bowl centre(23.95,.61), seat(24.068,.702)
 // = (+.118,+.092). Round to canonical local tile coords.
 bowlCenter:Object.freeze([.50,.61]),
 seatedPoint:Object.freeze([.61,.69]),
 sitFacing:'sw',
 footOffsetY:0     // game sets position on bowl; no arbitrary sprite Y offset
});
g.VLGameProportions=Object.freeze({
 pixelTile:Object.freeze([64,32]),PPU,HEIGHT_SCALE,character,building,toilet
});
})(window);

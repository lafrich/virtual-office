/* Loak Objects v2 adapter for Semesta.
 * 122 types (37 preserved originals + 85 new). Icons 32x32 + ground sprites.
 * Does not duplicate the preserved 37 against a second old-item catalog.
 */
(function(root){
'use strict';
const entries = [
  {
    "id": "botol_plastik_bening",
    "file": "loak-v2/ground/botol_plastik_bening.png",
    "label": "Botol plastik bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.737,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "botol_plastik",
    "legacyId": "botol_plastik_bening",
    "rarity": "umum",
    "value": 300,
    "detail": "botol air mineral kosong, penyok",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      19
    ],
    "pivot": [
      15,
      14
    ],
    "footprint": null,
    "pickupAnchor": [
      15,
      14
    ],
    "icon": "loak-v2/icons/botol_plastik_bening.png",
    "url": "./legacy-assets/loak-v2/ground/botol_plastik_bening.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/botol_plastik_bening.png",
    "relativeFile": "ground/botol_plastik_bening.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "botol_plastik_hijau",
    "file": "loak-v2/ground/botol_plastik_hijau.png",
    "label": "Botol plastik bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.737,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "botol_plastik",
    "legacyId": "botol_plastik_hijau",
    "rarity": "umum",
    "value": 300,
    "detail": "botol air mineral kosong, penyok",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      19
    ],
    "pivot": [
      15,
      14
    ],
    "footprint": null,
    "pickupAnchor": [
      15,
      14
    ],
    "icon": "loak-v2/icons/botol_plastik_hijau.png",
    "url": "./legacy-assets/loak-v2/ground/botol_plastik_hijau.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/botol_plastik_hijau.png",
    "relativeFile": "ground/botol_plastik_hijau.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kaleng_minuman_merah",
    "file": "loak-v2/ground/kaleng_minuman_merah.png",
    "label": "Kaleng minuman bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.688,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kaleng_minuman",
    "legacyId": "kaleng_minuman_merah",
    "rarity": "umum",
    "value": 400,
    "detail": "kaleng soda kosong, bisa dijual kiloan",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      24,
      16
    ],
    "pivot": [
      10,
      11
    ],
    "footprint": null,
    "pickupAnchor": [
      10,
      11
    ],
    "icon": "loak-v2/icons/kaleng_minuman_merah.png",
    "url": "./legacy-assets/loak-v2/ground/kaleng_minuman_merah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kaleng_minuman_merah.png",
    "relativeFile": "ground/kaleng_minuman_merah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kaleng_minuman_hijau",
    "file": "loak-v2/ground/kaleng_minuman_hijau.png",
    "label": "Kaleng minuman bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.688,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kaleng_minuman",
    "legacyId": "kaleng_minuman_hijau",
    "rarity": "umum",
    "value": 400,
    "detail": "kaleng soda kosong, bisa dijual kiloan",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      24,
      16
    ],
    "pivot": [
      10,
      11
    ],
    "footprint": null,
    "pickupAnchor": [
      10,
      11
    ],
    "icon": "loak-v2/icons/kaleng_minuman_hijau.png",
    "url": "./legacy-assets/loak-v2/ground/kaleng_minuman_hijau.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kaleng_minuman_hijau.png",
    "relativeFile": "ground/kaleng_minuman_hijau.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kardus_lipat",
    "file": "loak-v2/ground/kardus_lipat.png",
    "label": "Kardus bekas dilipat",
    "width": 0.625,
    "height": 0.7,
    "pivotY": 0.565,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kardus_lipat",
    "legacyId": "kardus_lipat",
    "rarity": "umum",
    "value": 800,
    "detail": "kardus mi instan dilipat pipih",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      40,
      23
    ],
    "pivot": [
      20,
      13
    ],
    "footprint": null,
    "pickupAnchor": [
      20,
      13
    ],
    "icon": "loak-v2/icons/kardus_lipat.png",
    "url": "./legacy-assets/loak-v2/ground/kardus_lipat.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kardus_lipat.png",
    "relativeFile": "ground/kardus_lipat.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "koran_bekas",
    "file": "loak-v2/ground/koran_bekas.png",
    "label": "Koran bekas",
    "width": 0.562,
    "height": 0.7,
    "pivotY": 0.571,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "koran_bekas",
    "legacyId": "koran_bekas",
    "rarity": "umum",
    "value": 500,
    "detail": "koran lama terlipat, dijual kiloan",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      21
    ],
    "pivot": [
      18,
      12
    ],
    "footprint": null,
    "pickupAnchor": [
      18,
      12
    ],
    "icon": "loak-v2/icons/koran_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/koran_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/koran_bekas.png",
    "relativeFile": "ground/koran_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sandal_jepit_biru",
    "file": "loak-v2/ground/sandal_jepit_biru.png",
    "label": "Sandal jepit putus",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.526,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sandal_jepit",
    "legacyId": "sandal_jepit_biru",
    "rarity": "umum",
    "value": 300,
    "detail": "sandal jepit karet, talinya putus",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      32,
      19
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/sandal_jepit_biru.png",
    "url": "./legacy-assets/loak-v2/ground/sandal_jepit_biru.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sandal_jepit_biru.png",
    "relativeFile": "ground/sandal_jepit_biru.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sandal_jepit_merah",
    "file": "loak-v2/ground/sandal_jepit_merah.png",
    "label": "Sandal jepit putus",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.526,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sandal_jepit",
    "legacyId": "sandal_jepit_merah",
    "rarity": "umum",
    "value": 300,
    "detail": "sandal jepit karet, talinya putus",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      32,
      19
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/sandal_jepit_merah.png",
    "url": "./legacy-assets/loak-v2/ground/sandal_jepit_merah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sandal_jepit_merah.png",
    "relativeFile": "ground/sandal_jepit_merah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kabel_bekas",
    "file": "loak-v2/ground/kabel_bekas.png",
    "label": "Gulungan kabel bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.429,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kabel_bekas",
    "legacyId": "kabel_bekas",
    "rarity": "umum",
    "value": 1500,
    "detail": "kabel listrik sisa, tembaganya bisa dijual",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      30,
      21
    ],
    "pivot": [
      13,
      9
    ],
    "footprint": null,
    "pickupAnchor": [
      13,
      9
    ],
    "icon": "loak-v2/icons/kabel_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/kabel_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kabel_bekas.png",
    "relativeFile": "ground/kabel_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "charger_rusak",
    "file": "loak-v2/ground/charger_rusak.png",
    "label": "Charger HP rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.556,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "charger_rusak",
    "legacyId": "charger_rusak",
    "rarity": "umum",
    "value": 1500,
    "detail": "kepala charger putih, kabel terkelupas",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      22,
      18
    ],
    "pivot": [
      8,
      10
    ],
    "footprint": null,
    "pickupAnchor": [
      8,
      10
    ],
    "icon": "loak-v2/icons/charger_rusak.png",
    "url": "./legacy-assets/loak-v2/ground/charger_rusak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/charger_rusak.png",
    "relativeFile": "ground/charger_rusak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kaset_pita",
    "file": "loak-v2/ground/kaset_pita.png",
    "label": "Kaset pita lama",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kaset_pita",
    "legacyId": "kaset_pita",
    "rarity": "umum",
    "value": 2500,
    "detail": "kaset lagu lawas, pitanya sedikit kusut",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      28,
      18
    ],
    "pivot": [
      14,
      9
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      9
    ],
    "icon": "loak-v2/icons/kaset_pita.png",
    "url": "./legacy-assets/loak-v2/ground/kaset_pita.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kaset_pita.png",
    "relativeFile": "ground/kaset_pita.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "buku_bekas_merah",
    "file": "loak-v2/ground/buku_bekas_merah.png",
    "label": "Buku bekas",
    "width": 0.562,
    "height": 0.7,
    "pivotY": 0.591,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "buku_bekas",
    "legacyId": "buku_bekas_merah",
    "rarity": "umum",
    "value": 2000,
    "detail": "buku pelajaran lama, sampulnya lecek",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      22
    ],
    "pivot": [
      18,
      13
    ],
    "footprint": null,
    "pickupAnchor": [
      18,
      13
    ],
    "icon": "loak-v2/icons/buku_bekas_merah.png",
    "url": "./legacy-assets/loak-v2/ground/buku_bekas_merah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/buku_bekas_merah.png",
    "relativeFile": "ground/buku_bekas_merah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "buku_bekas_biru",
    "file": "loak-v2/ground/buku_bekas_biru.png",
    "label": "Buku bekas",
    "width": 0.562,
    "height": 0.7,
    "pivotY": 0.591,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "buku_bekas",
    "legacyId": "buku_bekas_biru",
    "rarity": "umum",
    "value": 2000,
    "detail": "buku pelajaran lama, sampulnya lecek",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      22
    ],
    "pivot": [
      18,
      13
    ],
    "footprint": null,
    "pickupAnchor": [
      18,
      13
    ],
    "icon": "loak-v2/icons/buku_bekas_biru.png",
    "url": "./legacy-assets/loak-v2/ground/buku_bekas_biru.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/buku_bekas_biru.png",
    "relativeFile": "ground/buku_bekas_biru.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "payung_rusak_ungu",
    "file": "loak-v2/ground/payung_rusak_ungu.png",
    "label": "Payung rusak",
    "width": 0.656,
    "height": 0.7,
    "pivotY": 0.75,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "payung_rusak",
    "legacyId": "payung_rusak_ungu",
    "rarity": "umum",
    "value": 2000,
    "detail": "payung lipat, rangkanya patah",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      42,
      20
    ],
    "pivot": [
      20,
      15
    ],
    "footprint": null,
    "pickupAnchor": [
      20,
      15
    ],
    "icon": "loak-v2/icons/payung_rusak_ungu.png",
    "url": "./legacy-assets/loak-v2/ground/payung_rusak_ungu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/payung_rusak_ungu.png",
    "relativeFile": "ground/payung_rusak_ungu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "payung_rusak_hitam",
    "file": "loak-v2/ground/payung_rusak_hitam.png",
    "label": "Payung rusak",
    "width": 0.656,
    "height": 0.7,
    "pivotY": 0.75,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "payung_rusak",
    "legacyId": "payung_rusak_hitam",
    "rarity": "umum",
    "value": 2000,
    "detail": "payung lipat, rangkanya patah",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      42,
      20
    ],
    "pivot": [
      20,
      15
    ],
    "footprint": null,
    "pickupAnchor": [
      20,
      15
    ],
    "icon": "loak-v2/icons/payung_rusak_hitam.png",
    "url": "./legacy-assets/loak-v2/ground/payung_rusak_hitam.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/payung_rusak_hitam.png",
    "relativeFile": "ground/payung_rusak_hitam.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sepatu_bekas_putih",
    "file": "loak-v2/ground/sepatu_bekas_putih.png",
    "label": "Sepatu bekas",
    "width": 0.562,
    "height": 0.822,
    "pivotY": 0.714,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sepatu_bekas",
    "legacyId": "sepatu_bekas_putih",
    "rarity": "umum",
    "value": 3000,
    "detail": "sepatu kets sebelah, solnya mangap",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      28
    ],
    "pivot": [
      16,
      20
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      20
    ],
    "icon": "loak-v2/icons/sepatu_bekas_putih.png",
    "url": "./legacy-assets/loak-v2/ground/sepatu_bekas_putih.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sepatu_bekas_putih.png",
    "relativeFile": "ground/sepatu_bekas_putih.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sepatu_bekas_hitam",
    "file": "loak-v2/ground/sepatu_bekas_hitam.png",
    "label": "Sepatu bekas",
    "width": 0.562,
    "height": 0.822,
    "pivotY": 0.714,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sepatu_bekas",
    "legacyId": "sepatu_bekas_hitam",
    "rarity": "umum",
    "value": 3000,
    "detail": "sepatu kets sebelah, solnya mangap",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      28
    ],
    "pivot": [
      16,
      20
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      20
    ],
    "icon": "loak-v2/icons/sepatu_bekas_hitam.png",
    "url": "./legacy-assets/loak-v2/ground/sepatu_bekas_hitam.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sepatu_bekas_hitam.png",
    "relativeFile": "ground/sepatu_bekas_hitam.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "dompet_kosong",
    "file": "loak-v2/ground/dompet_kosong.png",
    "label": "Dompet kosong",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.55,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "dompet_kosong",
    "legacyId": "dompet_kosong",
    "rarity": "umum",
    "value": 3000,
    "detail": "dompet kulit sintetis, isinya sudah tidak ada (KTP tidak ada)",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      28,
      20
    ],
    "pivot": [
      14,
      11
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      11
    ],
    "icon": "loak-v2/icons/dompet_kosong.png",
    "url": "./legacy-assets/loak-v2/ground/dompet_kosong.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/dompet_kosong.png",
    "relativeFile": "ground/dompet_kosong.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gelas_plastik",
    "file": "loak-v2/ground/gelas_plastik.png",
    "label": "Gelas plastik es teh",
    "width": 0.55,
    "height": 0.704,
    "pivotY": 0.792,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gelas_plastik",
    "legacyId": "gelas_plastik",
    "rarity": "umum",
    "value": 200,
    "detail": "gelas plastik bekas es teh, sedotannya masih nancep",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      18,
      24
    ],
    "pivot": [
      6,
      19
    ],
    "footprint": null,
    "pickupAnchor": [
      6,
      19
    ],
    "icon": "loak-v2/icons/gelas_plastik.png",
    "url": "./legacy-assets/loak-v2/ground/gelas_plastik.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gelas_plastik.png",
    "relativeFile": "ground/gelas_plastik.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "ember_bocor",
    "file": "loak-v2/ground/ember_bocor.png",
    "label": "Ember bocor",
    "width": 0.55,
    "height": 0.939,
    "pivotY": 0.781,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "ember_bocor",
    "legacyId": "ember_bocor",
    "rarity": "umum",
    "value": 2500,
    "detail": "ember plastik hitam, dasarnya bolong",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      28,
      32
    ],
    "pivot": [
      12,
      25
    ],
    "footprint": null,
    "pickupAnchor": [
      12,
      25
    ],
    "icon": "loak-v2/icons/ember_bocor.png",
    "url": "./legacy-assets/loak-v2/ground/ember_bocor.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/ember_bocor.png",
    "relativeFile": "ground/ember_bocor.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "hp_jadul_biru",
    "file": "loak-v2/ground/hp_jadul_biru.png",
    "label": "HP jadul rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.474,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "hp_jadul",
    "legacyId": "hp_jadul_biru",
    "rarity": "jarang",
    "value": 15000,
    "detail": "HP Nokia klasik, layarnya retak, masih bisa diservis",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      24,
      19
    ],
    "pivot": [
      12,
      9
    ],
    "footprint": null,
    "pickupAnchor": [
      12,
      9
    ],
    "icon": "loak-v2/icons/hp_jadul_biru.png",
    "url": "./legacy-assets/loak-v2/ground/hp_jadul_biru.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/hp_jadul_biru.png",
    "relativeFile": "ground/hp_jadul_biru.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "hp_jadul_abu",
    "file": "loak-v2/ground/hp_jadul_abu.png",
    "label": "HP jadul rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.474,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "hp_jadul",
    "legacyId": "hp_jadul_abu",
    "rarity": "jarang",
    "value": 15000,
    "detail": "HP Nokia klasik, layarnya retak, masih bisa diservis",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      24,
      19
    ],
    "pivot": [
      12,
      9
    ],
    "footprint": null,
    "pickupAnchor": [
      12,
      9
    ],
    "icon": "loak-v2/icons/hp_jadul_abu.png",
    "url": "./legacy-assets/loak-v2/ground/hp_jadul_abu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/hp_jadul_abu.png",
    "relativeFile": "ground/hp_jadul_abu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "jam_tangan_rusak",
    "file": "loak-v2/ground/jam_tangan_rusak.png",
    "label": "Jam tangan rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.474,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "jam_tangan_rusak",
    "legacyId": "jam_tangan_rusak",
    "rarity": "jarang",
    "value": 12000,
    "detail": "jam tangan analog, kacanya retak, talinya kulit",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      24,
      19
    ],
    "pivot": [
      12,
      9
    ],
    "footprint": null,
    "pickupAnchor": [
      12,
      9
    ],
    "icon": "loak-v2/icons/jam_tangan_rusak.png",
    "url": "./legacy-assets/loak-v2/ground/jam_tangan_rusak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/jam_tangan_rusak.png",
    "relativeFile": "ground/jam_tangan_rusak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kacamata",
    "file": "loak-v2/ground/kacamata.png",
    "label": "Kacamata bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.688,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kacamata",
    "legacyId": "kacamata",
    "rarity": "jarang",
    "value": 8000,
    "detail": "kacamata minus, satu gagangnya longgar",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      30,
      16
    ],
    "pivot": [
      10,
      11
    ],
    "footprint": null,
    "pickupAnchor": [
      10,
      11
    ],
    "icon": "loak-v2/icons/kacamata.png",
    "url": "./legacy-assets/loak-v2/ground/kacamata.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kacamata.png",
    "relativeFile": "ground/kacamata.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kunci_lama",
    "file": "loak-v2/ground/kunci_lama.png",
    "label": "Kunci lama",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kunci_lama",
    "legacyId": "kunci_lama",
    "rarity": "jarang",
    "value": 5000,
    "detail": "dua anak kunci kuningan di ring besi",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      24,
      12
    ],
    "pivot": [
      10,
      6
    ],
    "footprint": null,
    "pickupAnchor": [
      10,
      6
    ],
    "icon": "loak-v2/icons/kunci_lama.png",
    "url": "./legacy-assets/loak-v2/ground/kunci_lama.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kunci_lama.png",
    "relativeFile": "ground/kunci_lama.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "besi_tua",
    "file": "loak-v2/ground/besi_tua.png",
    "label": "Besi tua",
    "width": 0.625,
    "height": 0.7,
    "pivotY": 0.636,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "besi_tua",
    "legacyId": "besi_tua",
    "rarity": "jarang",
    "value": 6000,
    "detail": "potongan pipa besi berkarat + mur, dijual kiloan",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      40,
      22
    ],
    "pivot": [
      19,
      14
    ],
    "footprint": null,
    "pickupAnchor": [
      19,
      14
    ],
    "icon": "loak-v2/icons/besi_tua.png",
    "url": "./legacy-assets/loak-v2/ground/besi_tua.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/besi_tua.png",
    "relativeFile": "ground/besi_tua.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "helm_bekas_merah",
    "file": "loak-v2/ground/helm_bekas_merah.png",
    "label": "Helm bekas",
    "width": 0.55,
    "height": 0.763,
    "pivotY": 0.654,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "helm_bekas",
    "legacyId": "helm_bekas_merah",
    "rarity": "jarang",
    "value": 20000,
    "detail": "helm half-face, kaca visornya baret",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      26
    ],
    "pivot": [
      16,
      17
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      17
    ],
    "icon": "loak-v2/icons/helm_bekas_merah.png",
    "url": "./legacy-assets/loak-v2/ground/helm_bekas_merah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/helm_bekas_merah.png",
    "relativeFile": "ground/helm_bekas_merah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "helm_bekas_putih",
    "file": "loak-v2/ground/helm_bekas_putih.png",
    "label": "Helm bekas",
    "width": 0.55,
    "height": 0.763,
    "pivotY": 0.654,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "helm_bekas",
    "legacyId": "helm_bekas_putih",
    "rarity": "jarang",
    "value": 20000,
    "detail": "helm half-face, kaca visornya baret",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      26
    ],
    "pivot": [
      16,
      17
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      17
    ],
    "icon": "loak-v2/icons/helm_bekas_putih.png",
    "url": "./legacy-assets/loak-v2/ground/helm_bekas_putih.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/helm_bekas_putih.png",
    "relativeFile": "ground/helm_bekas_putih.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "helm_bekas_hitam",
    "file": "loak-v2/ground/helm_bekas_hitam.png",
    "label": "Helm bekas",
    "width": 0.55,
    "height": 0.763,
    "pivotY": 0.654,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "helm_bekas",
    "legacyId": "helm_bekas_hitam",
    "rarity": "jarang",
    "value": 20000,
    "detail": "helm half-face, kaca visornya baret",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      26
    ],
    "pivot": [
      16,
      17
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      17
    ],
    "icon": "loak-v2/icons/helm_bekas_hitam.png",
    "url": "./legacy-assets/loak-v2/ground/helm_bekas_hitam.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/helm_bekas_hitam.png",
    "relativeFile": "ground/helm_bekas_hitam.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tas_bekas_coklat",
    "file": "loak-v2/ground/tas_bekas_coklat.png",
    "label": "Tas bekas",
    "width": 0.55,
    "height": 1.027,
    "pivotY": 0.743,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tas_bekas",
    "legacyId": "tas_bekas_coklat",
    "rarity": "jarang",
    "value": 15000,
    "detail": "tas selempang, resletingnya macet",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      32,
      35
    ],
    "pivot": [
      14,
      26
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      26
    ],
    "icon": "loak-v2/icons/tas_bekas_coklat.png",
    "url": "./legacy-assets/loak-v2/ground/tas_bekas_coklat.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tas_bekas_coklat.png",
    "relativeFile": "ground/tas_bekas_coklat.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tas_bekas_hitam",
    "file": "loak-v2/ground/tas_bekas_hitam.png",
    "label": "Tas bekas",
    "width": 0.55,
    "height": 1.027,
    "pivotY": 0.743,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tas_bekas",
    "legacyId": "tas_bekas_hitam",
    "rarity": "jarang",
    "value": 15000,
    "detail": "tas selempang, resletingnya macet",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      32,
      35
    ],
    "pivot": [
      14,
      26
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      26
    ],
    "icon": "loak-v2/icons/tas_bekas_hitam.png",
    "url": "./legacy-assets/loak-v2/ground/tas_bekas_hitam.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tas_bekas_hitam.png",
    "relativeFile": "ground/tas_bekas_hitam.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "boneka_kain",
    "file": "loak-v2/ground/boneka_kain.png",
    "label": "Boneka beruang kumal",
    "width": 0.55,
    "height": 0.88,
    "pivotY": 0.767,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "boneka_kain",
    "legacyId": "boneka_kain",
    "rarity": "jarang",
    "value": 7000,
    "detail": "boneka beruang kain, satu matanya copot",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      28,
      30
    ],
    "pivot": [
      13,
      23
    ],
    "footprint": null,
    "pickupAnchor": [
      13,
      23
    ],
    "icon": "loak-v2/icons/boneka_kain.png",
    "url": "./legacy-assets/loak-v2/ground/boneka_kain.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/boneka_kain.png",
    "relativeFile": "ground/boneka_kain.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "mainan_mobil_merah",
    "file": "loak-v2/ground/mainan_mobil_merah.png",
    "label": "Mobil-mobilan rusak",
    "width": 0.55,
    "height": 0.734,
    "pivotY": 0.64,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "mainan_mobil",
    "legacyId": "mainan_mobil_merah",
    "rarity": "jarang",
    "value": 6000,
    "detail": "mobil-mobilan plastik, satu rodanya hilang",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      25
    ],
    "pivot": [
      16,
      16
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      16
    ],
    "icon": "loak-v2/icons/mainan_mobil_merah.png",
    "url": "./legacy-assets/loak-v2/ground/mainan_mobil_merah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/mainan_mobil_merah.png",
    "relativeFile": "ground/mainan_mobil_merah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "mainan_mobil_kuning",
    "file": "loak-v2/ground/mainan_mobil_kuning.png",
    "label": "Mobil-mobilan rusak",
    "width": 0.55,
    "height": 0.734,
    "pivotY": 0.64,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "mainan_mobil",
    "legacyId": "mainan_mobil_kuning",
    "rarity": "jarang",
    "value": 6000,
    "detail": "mobil-mobilan plastik, satu rodanya hilang",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      25
    ],
    "pivot": [
      16,
      16
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      16
    ],
    "icon": "loak-v2/icons/mainan_mobil_kuning.png",
    "url": "./legacy-assets/loak-v2/ground/mainan_mobil_kuning.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/mainan_mobil_kuning.png",
    "relativeFile": "ground/mainan_mobil_kuning.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kipas_angin",
    "file": "loak-v2/ground/kipas_angin.png",
    "label": "Kipas angin meja rusak",
    "width": 0.55,
    "height": 1.291,
    "pivotY": 0.795,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kipas_angin",
    "legacyId": "kipas_angin",
    "rarity": "jarang",
    "value": 25000,
    "detail": "kipas angin meja, baling-balingnya patah satu",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      32,
      44
    ],
    "pivot": [
      13,
      35
    ],
    "footprint": null,
    "pickupAnchor": [
      13,
      35
    ],
    "icon": "loak-v2/icons/kipas_angin.png",
    "url": "./legacy-assets/loak-v2/ground/kipas_angin.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kipas_angin.png",
    "relativeFile": "ground/kipas_angin.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "setrika_lama",
    "file": "loak-v2/ground/setrika_lama.png",
    "label": "Setrika lama",
    "width": 0.562,
    "height": 0.792,
    "pivotY": 0.667,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "setrika_lama",
    "legacyId": "setrika_lama",
    "rarity": "jarang",
    "value": 12000,
    "detail": "setrika listrik jadul, kabelnya putus",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      27
    ],
    "pivot": [
      17,
      18
    ],
    "footprint": null,
    "pickupAnchor": [
      17,
      18
    ],
    "icon": "loak-v2/icons/setrika_lama.png",
    "url": "./legacy-assets/loak-v2/ground/setrika_lama.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/setrika_lama.png",
    "relativeFile": "ground/setrika_lama.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "radio_tua",
    "file": "loak-v2/ground/radio_tua.png",
    "label": "Radio tua",
    "width": 0.55,
    "height": 1.115,
    "pivotY": 0.763,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "radio_tua",
    "legacyId": "radio_tua",
    "rarity": "jarang",
    "value": 30000,
    "detail": "radio transistor kayu, masih ada bunyi kresek-kresek",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      34,
      38
    ],
    "pivot": [
      14,
      29
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      29
    ],
    "icon": "loak-v2/icons/radio_tua.png",
    "url": "./legacy-assets/loak-v2/ground/radio_tua.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/radio_tua.png",
    "relativeFile": "ground/radio_tua.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "jam_dinding",
    "file": "loak-v2/ground/jam_dinding.png",
    "label": "Jam dinding mati",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.526,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "jam_dinding",
    "legacyId": "jam_dinding",
    "rarity": "jarang",
    "value": 15000,
    "detail": "jam dinding bulat, jarumnya berhenti di 10:10",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      30,
      19
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/jam_dinding.png",
    "url": "./legacy-assets/loak-v2/ground/jam_dinding.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/jam_dinding.png",
    "relativeFile": "ground/jam_dinding.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gembok_tua",
    "file": "loak-v2/ground/gembok_tua.png",
    "label": "Gembok tua",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.75,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gembok_tua",
    "legacyId": "gembok_tua",
    "rarity": "jarang",
    "value": 8000,
    "detail": "gembok kuningan tanpa kunci",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      18,
      20
    ],
    "pivot": [
      6,
      15
    ],
    "footprint": null,
    "pickupAnchor": [
      6,
      15
    ],
    "icon": "loak-v2/icons/gembok_tua.png",
    "url": "./legacy-assets/loak-v2/ground/gembok_tua.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gembok_tua.png",
    "relativeFile": "ground/gembok_tua.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "senter_rusak",
    "file": "loak-v2/ground/senter_rusak.png",
    "label": "Senter rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.667,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "senter_rusak",
    "legacyId": "senter_rusak",
    "rarity": "jarang",
    "value": 5000,
    "detail": "senter plastik kuning, baterainya bocor",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      32,
      18
    ],
    "pivot": [
      14,
      12
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      12
    ],
    "icon": "loak-v2/icons/senter_rusak.png",
    "url": "./legacy-assets/loak-v2/ground/senter_rusak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/senter_rusak.png",
    "relativeFile": "ground/senter_rusak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "koin_kuno",
    "file": "loak-v2/ground/koin_kuno.png",
    "label": "Koin kuno",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.455,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "koin_kuno",
    "legacyId": "koin_kuno",
    "rarity": "langka",
    "value": 50000,
    "detail": "beberapa koin lama (100 rupiah 1973, sen Hindia Belanda)",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      22,
      11
    ],
    "pivot": [
      8,
      5
    ],
    "footprint": null,
    "pickupAnchor": [
      8,
      5
    ],
    "icon": "loak-v2/icons/koin_kuno.png",
    "url": "./legacy-assets/loak-v2/ground/koin_kuno.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/koin_kuno.png",
    "relativeFile": "ground/koin_kuno.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tembaga_gulungan",
    "file": "loak-v2/ground/tembaga_gulungan.png",
    "label": "Gulungan kawat tembaga",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.571,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tembaga_gulungan",
    "legacyId": "tembaga_gulungan",
    "rarity": "langka",
    "value": 40000,
    "detail": "kawat tembaga bekas gulungan dinamo, mahal di pengepul",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      30,
      21
    ],
    "pivot": [
      13,
      12
    ],
    "footprint": null,
    "pickupAnchor": [
      13,
      12
    ],
    "icon": "loak-v2/icons/tembaga_gulungan.png",
    "url": "./legacy-assets/loak-v2/ground/tembaga_gulungan.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tembaga_gulungan.png",
    "relativeFile": "ground/tembaga_gulungan.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "aki_bekas",
    "file": "loak-v2/ground/aki_bekas.png",
    "label": "Aki bekas",
    "width": 0.562,
    "height": 0.939,
    "pivotY": 0.688,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "aki_bekas",
    "legacyId": "aki_bekas",
    "rarity": "langka",
    "value": 35000,
    "detail": "aki motor/mobil bekas, berat, dibeli pengepul",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      36,
      32
    ],
    "pivot": [
      16,
      22
    ],
    "footprint": null,
    "pickupAnchor": [
      16,
      22
    ],
    "icon": "loak-v2/icons/aki_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/aki_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/aki_bekas.png",
    "relativeFile": "ground/aki_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kamera_analog",
    "file": "loak-v2/ground/kamera_analog.png",
    "label": "Kamera analog",
    "width": 0.55,
    "height": 0.792,
    "pivotY": 0.667,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kamera_analog",
    "legacyId": "kamera_analog",
    "rarity": "langka",
    "value": 80000,
    "detail": "kamera film jadul, lensanya masih utuh",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      30,
      27
    ],
    "pivot": [
      13,
      18
    ],
    "footprint": null,
    "pickupAnchor": [
      13,
      18
    ],
    "icon": "loak-v2/icons/kamera_analog.png",
    "url": "./legacy-assets/loak-v2/ground/kamera_analog.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kamera_analog.png",
    "relativeFile": "ground/kamera_analog.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "walkman",
    "file": "loak-v2/ground/walkman.png",
    "label": "Walkman kaset",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.522,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "walkman",
    "legacyId": "walkman",
    "rarity": "langka",
    "value": 60000,
    "detail": "pemutar kaset portabel tahun 80-an",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      28,
      23
    ],
    "pivot": [
      14,
      12
    ],
    "footprint": null,
    "pickupAnchor": [
      14,
      12
    ],
    "icon": "loak-v2/icons/walkman.png",
    "url": "./legacy-assets/loak-v2/ground/walkman.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/walkman.png",
    "relativeFile": "ground/walkman.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "piringan_hitam",
    "file": "loak-v2/ground/piringan_hitam.png",
    "label": "Piringan hitam",
    "width": 0.75,
    "height": 0.763,
    "pivotY": 0.538,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "piringan_hitam",
    "legacyId": "piringan_hitam",
    "rarity": "langka",
    "value": 70000,
    "detail": "piringan hitam lagu keroncong dalam sampul kertas",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      48,
      26
    ],
    "pivot": [
      24,
      14
    ],
    "footprint": null,
    "pickupAnchor": [
      24,
      14
    ],
    "icon": "loak-v2/icons/piringan_hitam.png",
    "url": "./legacy-assets/loak-v2/ground/piringan_hitam.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/piringan_hitam.png",
    "relativeFile": "ground/piringan_hitam.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "arloji_saku",
    "file": "loak-v2/ground/arloji_saku.png",
    "label": "Arloji saku antik",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.533,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "arloji_saku",
    "legacyId": "arloji_saku",
    "rarity": "langka",
    "value": 120000,
    "detail": "arloji saku kuningan dengan rantai, barang antik incaran kolektor",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      26,
      15
    ],
    "pivot": [
      12,
      8
    ],
    "footprint": null,
    "pickupAnchor": [
      12,
      8
    ],
    "icon": "loak-v2/icons/arloji_saku.png",
    "url": "./legacy-assets/loak-v2/ground/arloji_saku.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/arloji_saku.png",
    "relativeFile": "ground/arloji_saku.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "lampu_petromaks",
    "file": "loak-v2/ground/lampu_petromaks.png",
    "label": "Lampu petromaks",
    "width": 0.55,
    "height": 1.086,
    "pivotY": 0.811,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "lampu_petromaks",
    "legacyId": "lampu_petromaks",
    "rarity": "langka",
    "value": 90000,
    "detail": "lampu petromaks kuningan peninggalan pedagang malam",
    "reviewGroup": "koleksi_asli",
    "status": "preserved_original",
    "size": [
      22,
      37
    ],
    "pivot": [
      8,
      30
    ],
    "footprint": null,
    "pickupAnchor": [
      8,
      30
    ],
    "icon": "loak-v2/icons/lampu_petromaks.png",
    "url": "./legacy-assets/loak-v2/ground/lampu_petromaks.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/lampu_petromaks.png",
    "relativeFile": "ground/lampu_petromaks.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "pipa_besi",
    "file": "loak-v2/ground/pipa_besi.png",
    "label": "Pipa besi berkarat",
    "width": 0.67,
    "height": 0.792,
    "pivotY": 0.667,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "pipa_besi",
    "legacyId": "pipa_besi",
    "rarity": "umum",
    "value": 1500,
    "detail": "Pipa besi berkarat",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      43,
      27
    ],
    "pivot": [
      21,
      18
    ],
    "footprint": [
      0.67,
      0.42
    ],
    "pickupAnchor": [
      21,
      18
    ],
    "icon": "loak-v2/icons/pipa_besi.png",
    "url": "./legacy-assets/loak-v2/ground/pipa_besi.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/pipa_besi.png",
    "relativeFile": "ground/pipa_besi.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "siku_pipa",
    "file": "loak-v2/ground/siku_pipa.png",
    "label": "Siku pipa besi",
    "width": 0.55,
    "height": 0.734,
    "pivotY": 0.64,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "siku_pipa",
    "legacyId": "siku_pipa",
    "rarity": "umum",
    "value": 1500,
    "detail": "Siku pipa besi",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      33,
      25
    ],
    "pivot": [
      17,
      16
    ],
    "footprint": [
      0.52,
      0.39
    ],
    "pickupAnchor": [
      17,
      16
    ],
    "icon": "loak-v2/icons/siku_pipa.png",
    "url": "./legacy-assets/loak-v2/ground/siku_pipa.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/siku_pipa.png",
    "relativeFile": "ground/siku_pipa.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "engsel_pintu",
    "file": "loak-v2/ground/engsel_pintu.png",
    "label": "Engsel pintu lepas",
    "width": 0.56,
    "height": 0.7,
    "pivotY": 0.55,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "engsel_pintu",
    "legacyId": "engsel_pintu",
    "rarity": "umum",
    "value": 1500,
    "detail": "Engsel pintu lepas",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      36,
      20
    ],
    "pivot": [
      18,
      11
    ],
    "footprint": [
      0.56,
      0.31
    ],
    "pickupAnchor": [
      18,
      11
    ],
    "icon": "loak-v2/icons/engsel_pintu.png",
    "url": "./legacy-assets/loak-v2/ground/engsel_pintu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/engsel_pintu.png",
    "relativeFile": "ground/engsel_pintu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "braket_rak",
    "file": "loak-v2/ground/braket_rak.png",
    "label": "Braket rak besi",
    "width": 0.55,
    "height": 0.998,
    "pivotY": 0.765,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "braket_rak",
    "legacyId": "braket_rak",
    "rarity": "umum",
    "value": 1500,
    "detail": "Braket rak besi",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      34,
      34
    ],
    "pivot": [
      16,
      26
    ],
    "footprint": [
      0.53,
      0.53
    ],
    "pickupAnchor": [
      16,
      26
    ],
    "icon": "loak-v2/icons/braket_rak.png",
    "url": "./legacy-assets/loak-v2/ground/braket_rak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/braket_rak.png",
    "relativeFile": "ground/braket_rak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "rantai_sepeda",
    "file": "loak-v2/ground/rantai_sepeda.png",
    "label": "Rantai sepeda putus",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "rantai_sepeda",
    "legacyId": "rantai_sepeda",
    "rarity": "umum",
    "value": 1500,
    "detail": "Rantai sepeda putus",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      35,
      18
    ],
    "pivot": [
      16,
      9
    ],
    "footprint": [
      0.55,
      0.28
    ],
    "pickupAnchor": [
      16,
      9
    ],
    "icon": "loak-v2/icons/rantai_sepeda.png",
    "url": "./legacy-assets/loak-v2/ground/rantai_sepeda.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/rantai_sepeda.png",
    "relativeFile": "ground/rantai_sepeda.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gir_sepeda",
    "file": "loak-v2/ground/gir_sepeda.png",
    "label": "Gir sepeda bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.562,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gir_sepeda",
    "legacyId": "gir_sepeda",
    "rarity": "umum",
    "value": 1500,
    "detail": "Gir sepeda bekas",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      30,
      16
    ],
    "pivot": [
      14,
      9
    ],
    "footprint": [
      0.47,
      0.25
    ],
    "pickupAnchor": [
      14,
      9
    ],
    "icon": "loak-v2/icons/gir_sepeda.png",
    "url": "./legacy-assets/loak-v2/ground/gir_sepeda.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gir_sepeda.png",
    "relativeFile": "ground/gir_sepeda.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "pegas_besi",
    "file": "loak-v2/ground/pegas_besi.png",
    "label": "Per pegas lepas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.562,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "pegas_besi",
    "legacyId": "pegas_besi",
    "rarity": "umum",
    "value": 1500,
    "detail": "Per pegas lepas",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      33,
      16
    ],
    "pivot": [
      15,
      9
    ],
    "footprint": [
      0.52,
      0.25
    ],
    "pickupAnchor": [
      15,
      9
    ],
    "icon": "loak-v2/icons/pegas_besi.png",
    "url": "./legacy-assets/loak-v2/ground/pegas_besi.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/pegas_besi.png",
    "relativeFile": "ground/pegas_besi.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "baut_mur",
    "file": "loak-v2/ground/baut_mur.png",
    "label": "Sekantong baut mur",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.6,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "baut_mur",
    "legacyId": "baut_mur",
    "rarity": "umum",
    "value": 1500,
    "detail": "Sekantong baut mur",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      30,
      20
    ],
    "pivot": [
      14,
      12
    ],
    "footprint": [
      0.47,
      0.31
    ],
    "pickupAnchor": [
      14,
      12
    ],
    "icon": "loak-v2/icons/baut_mur.png",
    "url": "./legacy-assets/loak-v2/ground/baut_mur.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/baut_mur.png",
    "relativeFile": "ground/baut_mur.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kran_air",
    "file": "loak-v2/ground/kran_air.png",
    "label": "Kran air rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.682,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kran_air",
    "legacyId": "kran_air",
    "rarity": "umum",
    "value": 1500,
    "detail": "Kran air rusak",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      21,
      22
    ],
    "pivot": [
      7,
      15
    ],
    "footprint": [
      0.33,
      0.34
    ],
    "pickupAnchor": [
      7,
      15
    ],
    "icon": "loak-v2/icons/kran_air.png",
    "url": "./legacy-assets/loak-v2/ground/kran_air.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kran_air.png",
    "relativeFile": "ground/kran_air.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gagang_pintu",
    "file": "loak-v2/ground/gagang_pintu.png",
    "label": "Gagang pintu bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gagang_pintu",
    "legacyId": "gagang_pintu",
    "rarity": "umum",
    "value": 1500,
    "detail": "Gagang pintu bekas",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      26,
      17
    ],
    "pivot": [
      10,
      10
    ],
    "footprint": [
      0.41,
      0.27
    ],
    "pickupAnchor": [
      10,
      10
    ],
    "icon": "loak-v2/icons/gagang_pintu.png",
    "url": "./legacy-assets/loak-v2/ground/gagang_pintu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gagang_pintu.png",
    "relativeFile": "ground/gagang_pintu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kawat_kasa",
    "file": "loak-v2/ground/kawat_kasa.png",
    "label": "Kawat kasa sobek",
    "width": 0.64,
    "height": 0.7,
    "pivotY": 0.565,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kawat_kasa",
    "legacyId": "kawat_kasa",
    "rarity": "umum",
    "value": 1500,
    "detail": "Kawat kasa sobek",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      41,
      23
    ],
    "pivot": [
      21,
      13
    ],
    "footprint": [
      0.64,
      0.36
    ],
    "pickupAnchor": [
      21,
      13
    ],
    "icon": "loak-v2/icons/kawat_kasa.png",
    "url": "./legacy-assets/loak-v2/ground/kawat_kasa.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kawat_kasa.png",
    "relativeFile": "ground/kawat_kasa.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "potongan_seng",
    "file": "loak-v2/ground/potongan_seng.png",
    "label": "Potongan seng bergelombang",
    "width": 0.84,
    "height": 0.91,
    "pivotY": 0.548,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "potongan_seng",
    "legacyId": "potongan_seng",
    "rarity": "umum",
    "value": 1500,
    "detail": "Potongan seng bergelombang",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      54,
      31
    ],
    "pivot": [
      27,
      17
    ],
    "footprint": [
      0.84,
      0.48
    ],
    "pickupAnchor": [
      27,
      17
    ],
    "icon": "loak-v2/icons/potongan_seng.png",
    "url": "./legacy-assets/loak-v2/ground/potongan_seng.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/potongan_seng.png",
    "relativeFile": "ground/potongan_seng.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tutup_kaleng",
    "file": "loak-v2/ground/tutup_kaleng.png",
    "label": "Tutup kaleng cat",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tutup_kaleng",
    "legacyId": "tutup_kaleng",
    "rarity": "umum",
    "value": 1500,
    "detail": "Tutup kaleng cat",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      29,
      17
    ],
    "pivot": [
      13,
      10
    ],
    "footprint": [
      0.45,
      0.27
    ],
    "pickupAnchor": [
      13,
      10
    ],
    "icon": "loak-v2/icons/tutup_kaleng.png",
    "url": "./legacy-assets/loak-v2/ground/tutup_kaleng.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tutup_kaleng.png",
    "relativeFile": "ground/tutup_kaleng.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "rangka_sadel",
    "file": "loak-v2/ground/rangka_sadel.png",
    "label": "Rangka sadel sepeda",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.526,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "rangka_sadel",
    "legacyId": "rangka_sadel",
    "rarity": "umum",
    "value": 1500,
    "detail": "Rangka sadel sepeda",
    "reviewGroup": "logam",
    "status": "new_review_only",
    "size": [
      25,
      19
    ],
    "pivot": [
      9,
      10
    ],
    "footprint": [
      0.39,
      0.3
    ],
    "pickupAnchor": [
      9,
      10
    ],
    "icon": "loak-v2/icons/rangka_sadel.png",
    "url": "./legacy-assets/loak-v2/ground/rangka_sadel.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/rangka_sadel.png",
    "relativeFile": "ground/rangka_sadel.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "jeriken_minyak",
    "file": "loak-v2/ground/jeriken_minyak.png",
    "label": "Jeriken minyak kosong",
    "width": 0.55,
    "height": 0.939,
    "pivotY": 0.719,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "jeriken_minyak",
    "legacyId": "jeriken_minyak",
    "rarity": "umum",
    "value": 400,
    "detail": "Jeriken minyak kosong",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      30,
      32
    ],
    "pivot": [
      14,
      23
    ],
    "footprint": [
      0.47,
      0.5
    ],
    "pickupAnchor": [
      14,
      23
    ],
    "icon": "loak-v2/icons/jeriken_minyak.png",
    "url": "./legacy-assets/loak-v2/ground/jeriken_minyak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/jeriken_minyak.png",
    "relativeFile": "ground/jeriken_minyak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "botol_sampo",
    "file": "loak-v2/ground/botol_sampo.png",
    "label": "Botol sampo kosong",
    "width": 0.55,
    "height": 0.88,
    "pivotY": 0.767,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "botol_sampo",
    "legacyId": "botol_sampo",
    "rarity": "umum",
    "value": 400,
    "detail": "Botol sampo kosong",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      21,
      30
    ],
    "pivot": [
      8,
      23
    ],
    "footprint": [
      0.33,
      0.47
    ],
    "pickupAnchor": [
      8,
      23
    ],
    "icon": "loak-v2/icons/botol_sampo.png",
    "url": "./legacy-assets/loak-v2/ground/botol_sampo.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/botol_sampo.png",
    "relativeFile": "ground/botol_sampo.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "botol_deterjen",
    "file": "loak-v2/ground/botol_deterjen.png",
    "label": "Botol deterjen kosong",
    "width": 0.55,
    "height": 0.822,
    "pivotY": 0.75,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "botol_deterjen",
    "legacyId": "botol_deterjen",
    "rarity": "umum",
    "value": 400,
    "detail": "Botol deterjen kosong",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      24,
      28
    ],
    "pivot": [
      10,
      21
    ],
    "footprint": [
      0.38,
      0.44
    ],
    "pickupAnchor": [
      10,
      21
    ],
    "icon": "loak-v2/icons/botol_deterjen.png",
    "url": "./legacy-assets/loak-v2/ground/botol_deterjen.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/botol_deterjen.png",
    "relativeFile": "ground/botol_deterjen.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "baskom_retak",
    "file": "loak-v2/ground/baskom_retak.png",
    "label": "Baskom retak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.591,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "baskom_retak",
    "legacyId": "baskom_retak",
    "rarity": "umum",
    "value": 400,
    "detail": "Baskom retak",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      34,
      22
    ],
    "pivot": [
      15,
      13
    ],
    "footprint": [
      0.53,
      0.34
    ],
    "pickupAnchor": [
      15,
      13
    ],
    "icon": "loak-v2/icons/baskom_retak.png",
    "url": "./legacy-assets/loak-v2/ground/baskom_retak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/baskom_retak.png",
    "relativeFile": "ground/baskom_retak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "saringan_plastik",
    "file": "loak-v2/ground/saringan_plastik.png",
    "label": "Saringan plastik patah",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "saringan_plastik",
    "legacyId": "saringan_plastik",
    "rarity": "umum",
    "value": 400,
    "detail": "Saringan plastik patah",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      31,
      18
    ],
    "pivot": [
      12,
      9
    ],
    "footprint": [
      0.48,
      0.28
    ],
    "pickupAnchor": [
      12,
      9
    ],
    "icon": "loak-v2/icons/saringan_plastik.png",
    "url": "./legacy-assets/loak-v2/ground/saringan_plastik.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/saringan_plastik.png",
    "relativeFile": "ground/saringan_plastik.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kotak_makan",
    "file": "loak-v2/ground/kotak_makan.png",
    "label": "Kotak makan tanpa tutup",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.591,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kotak_makan",
    "legacyId": "kotak_makan",
    "rarity": "umum",
    "value": 400,
    "detail": "Kotak makan tanpa tutup",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      32,
      22
    ],
    "pivot": [
      14,
      13
    ],
    "footprint": [
      0.5,
      0.34
    ],
    "pickupAnchor": [
      14,
      13
    ],
    "icon": "loak-v2/icons/kotak_makan.png",
    "url": "./legacy-assets/loak-v2/ground/kotak_makan.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kotak_makan.png",
    "relativeFile": "ground/kotak_makan.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tutup_botol",
    "file": "loak-v2/ground/tutup_botol.png",
    "label": "Tutup botol campur",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.533,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tutup_botol",
    "legacyId": "tutup_botol",
    "rarity": "umum",
    "value": 400,
    "detail": "Tutup botol campur",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      25,
      15
    ],
    "pivot": [
      11,
      8
    ],
    "footprint": [
      0.39,
      0.25
    ],
    "pickupAnchor": [
      11,
      8
    ],
    "icon": "loak-v2/icons/tutup_botol.png",
    "url": "./legacy-assets/loak-v2/ground/tutup_botol.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tutup_botol.png",
    "relativeFile": "ground/tutup_botol.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "hanger_patah",
    "file": "loak-v2/ground/hanger_patah.png",
    "label": "Gantungan baju patah",
    "width": 0.56,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "hanger_patah",
    "legacyId": "hanger_patah",
    "rarity": "umum",
    "value": 400,
    "detail": "Gantungan baju patah",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      36,
      18
    ],
    "pivot": [
      17,
      9
    ],
    "footprint": [
      0.56,
      0.28
    ],
    "pickupAnchor": [
      17,
      9
    ],
    "icon": "loak-v2/icons/hanger_patah.png",
    "url": "./legacy-assets/loak-v2/ground/hanger_patah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/hanger_patah.png",
    "relativeFile": "ground/hanger_patah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "pot_plastik",
    "file": "loak-v2/ground/pot_plastik.png",
    "label": "Pot tanaman kosong retak",
    "width": 0.55,
    "height": 0.704,
    "pivotY": 0.708,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "pot_plastik",
    "legacyId": "pot_plastik",
    "rarity": "umum",
    "value": 400,
    "detail": "Pot tanaman kosong retak",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      26,
      24
    ],
    "pivot": [
      12,
      17
    ],
    "footprint": [
      0.41,
      0.38
    ],
    "pickupAnchor": [
      12,
      17
    ],
    "icon": "loak-v2/icons/pot_plastik.png",
    "url": "./legacy-assets/loak-v2/ground/pot_plastik.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/pot_plastik.png",
    "relativeFile": "ground/pot_plastik.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "keranjang_pecah",
    "file": "loak-v2/ground/keranjang_pecah.png",
    "label": "Keranjang belanja pecah",
    "width": 0.59,
    "height": 0.851,
    "pivotY": 0.655,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "keranjang_pecah",
    "legacyId": "keranjang_pecah",
    "rarity": "umum",
    "value": 400,
    "detail": "Keranjang belanja pecah",
    "reviewGroup": "plastik",
    "status": "new_review_only",
    "size": [
      38,
      29
    ],
    "pivot": [
      18,
      19
    ],
    "footprint": [
      0.59,
      0.45
    ],
    "pickupAnchor": [
      18,
      19
    ],
    "icon": "loak-v2/icons/keranjang_pecah.png",
    "url": "./legacy-assets/loak-v2/ground/keranjang_pecah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/keranjang_pecah.png",
    "relativeFile": "ground/keranjang_pecah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tabung_karton",
    "file": "loak-v2/ground/tabung_karton.png",
    "label": "Tabung karton bekas",
    "width": 0.59,
    "height": 0.734,
    "pivotY": 0.68,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tabung_karton",
    "legacyId": "tabung_karton",
    "rarity": "umum",
    "value": 500,
    "detail": "Tabung karton bekas",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      38,
      25
    ],
    "pivot": [
      18,
      17
    ],
    "footprint": [
      0.59,
      0.39
    ],
    "pickupAnchor": [
      18,
      17
    ],
    "icon": "loak-v2/icons/tabung_karton.png",
    "url": "./legacy-assets/loak-v2/ground/tabung_karton.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tabung_karton.png",
    "relativeFile": "ground/tabung_karton.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kantong_kertas",
    "file": "loak-v2/ground/kantong_kertas.png",
    "label": "Kantong kertas kusut",
    "width": 0.55,
    "height": 0.734,
    "pivotY": 0.72,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kantong_kertas",
    "legacyId": "kantong_kertas",
    "rarity": "umum",
    "value": 500,
    "detail": "Kantong kertas kusut",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      24,
      25
    ],
    "pivot": [
      10,
      18
    ],
    "footprint": [
      0.38,
      0.39
    ],
    "pickupAnchor": [
      10,
      18
    ],
    "icon": "loak-v2/icons/kantong_kertas.png",
    "url": "./legacy-assets/loak-v2/ground/kantong_kertas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kantong_kertas.png",
    "relativeFile": "ground/kantong_kertas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tray_telur",
    "file": "loak-v2/ground/tray_telur.png",
    "label": "Tray telur karton",
    "width": 0.58,
    "height": 0.7,
    "pivotY": 0.524,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tray_telur",
    "legacyId": "tray_telur",
    "rarity": "umum",
    "value": 500,
    "detail": "Tray telur karton",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      37,
      21
    ],
    "pivot": [
      18,
      11
    ],
    "footprint": [
      0.58,
      0.33
    ],
    "pickupAnchor": [
      18,
      11
    ],
    "icon": "loak-v2/icons/tray_telur.png",
    "url": "./legacy-assets/loak-v2/ground/tray_telur.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tray_telur.png",
    "relativeFile": "ground/tray_telur.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "majalah_bekas",
    "file": "loak-v2/ground/majalah_bekas.png",
    "label": "Majalah bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.55,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "majalah_bekas",
    "legacyId": "majalah_bekas",
    "rarity": "umum",
    "value": 500,
    "detail": "Majalah bekas",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      34,
      20
    ],
    "pivot": [
      16,
      11
    ],
    "footprint": [
      0.53,
      0.31
    ],
    "pickupAnchor": [
      16,
      11
    ],
    "icon": "loak-v2/icons/majalah_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/majalah_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/majalah_bekas.png",
    "relativeFile": "ground/majalah_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "amplop_coklat",
    "file": "loak-v2/ground/amplop_coklat.png",
    "label": "Amplop coklat kosong",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.579,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "amplop_coklat",
    "legacyId": "amplop_coklat",
    "rarity": "umum",
    "value": 500,
    "detail": "Amplop coklat kosong",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      34,
      19
    ],
    "pivot": [
      16,
      11
    ],
    "footprint": [
      0.53,
      0.3
    ],
    "pickupAnchor": [
      16,
      11
    ],
    "icon": "loak-v2/icons/amplop_coklat.png",
    "url": "./legacy-assets/loak-v2/ground/amplop_coklat.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/amplop_coklat.png",
    "relativeFile": "ground/amplop_coklat.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "poster_gulung",
    "file": "loak-v2/ground/poster_gulung.png",
    "label": "Gulungan poster lama",
    "width": 0.56,
    "height": 0.7,
    "pivotY": 0.636,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "poster_gulung",
    "legacyId": "poster_gulung",
    "rarity": "umum",
    "value": 500,
    "detail": "Gulungan poster lama",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      36,
      22
    ],
    "pivot": [
      17,
      14
    ],
    "footprint": [
      0.56,
      0.34
    ],
    "pickupAnchor": [
      17,
      14
    ],
    "icon": "loak-v2/icons/poster_gulung.png",
    "url": "./legacy-assets/loak-v2/ground/poster_gulung.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/poster_gulung.png",
    "relativeFile": "ground/poster_gulung.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kantong_semen",
    "file": "loak-v2/ground/kantong_semen.png",
    "label": "Kantong semen kosong",
    "width": 0.62,
    "height": 0.7,
    "pivotY": 0.545,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kantong_semen",
    "legacyId": "kantong_semen",
    "rarity": "umum",
    "value": 500,
    "detail": "Kantong semen kosong",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      40,
      22
    ],
    "pivot": [
      20,
      12
    ],
    "footprint": [
      0.62,
      0.34
    ],
    "pickupAnchor": [
      20,
      12
    ],
    "icon": "loak-v2/icons/kantong_semen.png",
    "url": "./legacy-assets/loak-v2/ground/kantong_semen.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kantong_semen.png",
    "relativeFile": "ground/kantong_semen.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "inti_lakban",
    "file": "loak-v2/ground/inti_lakban.png",
    "label": "Inti lakban karton",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "inti_lakban",
    "legacyId": "inti_lakban",
    "rarity": "umum",
    "value": 500,
    "detail": "Inti lakban karton",
    "reviewGroup": "kertas",
    "status": "new_review_only",
    "size": [
      22,
      17
    ],
    "pivot": [
      9,
      10
    ],
    "footprint": [
      0.34,
      0.27
    ],
    "pickupAnchor": [
      9,
      10
    ],
    "icon": "loak-v2/icons/inti_lakban.png",
    "url": "./legacy-assets/loak-v2/ground/inti_lakban.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/inti_lakban.png",
    "relativeFile": "ground/inti_lakban.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "botol_kecap",
    "file": "loak-v2/ground/botol_kecap.png",
    "label": "Botol kecap kosong",
    "width": 0.55,
    "height": 0.851,
    "pivotY": 0.759,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "botol_kecap",
    "legacyId": "botol_kecap",
    "rarity": "umum",
    "value": 800,
    "detail": "Botol kecap kosong",
    "reviewGroup": "kaca",
    "status": "new_review_only",
    "size": [
      21,
      29
    ],
    "pivot": [
      8,
      22
    ],
    "footprint": [
      0.33,
      0.45
    ],
    "pickupAnchor": [
      8,
      22
    ],
    "icon": "loak-v2/icons/botol_kecap.png",
    "url": "./legacy-assets/loak-v2/ground/botol_kecap.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/botol_kecap.png",
    "relativeFile": "ground/botol_kecap.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "stoples_kaca",
    "file": "loak-v2/ground/stoples_kaca.png",
    "label": "Stoples kaca tanpa tutup",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.696,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "stoples_kaca",
    "legacyId": "stoples_kaca",
    "rarity": "umum",
    "value": 800,
    "detail": "Stoples kaca tanpa tutup",
    "reviewGroup": "kaca",
    "status": "new_review_only",
    "size": [
      23,
      23
    ],
    "pivot": [
      9,
      16
    ],
    "footprint": [
      0.36,
      0.36
    ],
    "pickupAnchor": [
      9,
      16
    ],
    "icon": "loak-v2/icons/stoples_kaca.png",
    "url": "./legacy-assets/loak-v2/ground/stoples_kaca.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/stoples_kaca.png",
    "relativeFile": "ground/stoples_kaca.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gelas_belimbing",
    "file": "loak-v2/ground/gelas_belimbing.png",
    "label": "Gelas belimbing retak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.632,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gelas_belimbing",
    "legacyId": "gelas_belimbing",
    "rarity": "umum",
    "value": 800,
    "detail": "Gelas belimbing retak",
    "reviewGroup": "kaca",
    "status": "new_review_only",
    "size": [
      20,
      19
    ],
    "pivot": [
      7,
      12
    ],
    "footprint": [
      0.31,
      0.3
    ],
    "pickupAnchor": [
      7,
      12
    ],
    "icon": "loak-v2/icons/gelas_belimbing.png",
    "url": "./legacy-assets/loak-v2/ground/gelas_belimbing.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gelas_belimbing.png",
    "relativeFile": "ground/gelas_belimbing.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "mangkuk_kaca",
    "file": "loak-v2/ground/mangkuk_kaca.png",
    "label": "Mangkuk kaca sumbing",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.611,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "mangkuk_kaca",
    "legacyId": "mangkuk_kaca",
    "rarity": "umum",
    "value": 800,
    "detail": "Mangkuk kaca sumbing",
    "reviewGroup": "kaca",
    "status": "new_review_only",
    "size": [
      24,
      18
    ],
    "pivot": [
      10,
      11
    ],
    "footprint": [
      0.38,
      0.28
    ],
    "pickupAnchor": [
      10,
      11
    ],
    "icon": "loak-v2/icons/mangkuk_kaca.png",
    "url": "./legacy-assets/loak-v2/ground/mangkuk_kaca.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/mangkuk_kaca.png",
    "relativeFile": "ground/mangkuk_kaca.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "cermin_tangan",
    "file": "loak-v2/ground/cermin_tangan.png",
    "label": "Cermin tangan retak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "cermin_tangan",
    "legacyId": "cermin_tangan",
    "rarity": "umum",
    "value": 800,
    "detail": "Cermin tangan retak",
    "reviewGroup": "kaca",
    "status": "new_review_only",
    "size": [
      30,
      18
    ],
    "pivot": [
      12,
      9
    ],
    "footprint": [
      0.47,
      0.28
    ],
    "pickupAnchor": [
      12,
      9
    ],
    "icon": "loak-v2/icons/cermin_tangan.png",
    "url": "./legacy-assets/loak-v2/ground/cermin_tangan.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/cermin_tangan.png",
    "relativeFile": "ground/cermin_tangan.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "keyboard_bekas",
    "file": "loak-v2/ground/keyboard_bekas.png",
    "label": "Keyboard bekas",
    "width": 0.75,
    "height": 0.792,
    "pivotY": 0.556,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "keyboard_bekas",
    "legacyId": "keyboard_bekas",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Keyboard bekas",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      48,
      27
    ],
    "pivot": [
      24,
      15
    ],
    "footprint": [
      0.75,
      0.42
    ],
    "pickupAnchor": [
      24,
      15
    ],
    "icon": "loak-v2/icons/keyboard_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/keyboard_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/keyboard_bekas.png",
    "relativeFile": "ground/keyboard_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "mouse_rusak",
    "file": "loak-v2/ground/mouse_rusak.png",
    "label": "Mouse komputer rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.562,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "mouse_rusak",
    "legacyId": "mouse_rusak",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Mouse komputer rusak",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      21,
      16
    ],
    "pivot": [
      8,
      9
    ],
    "footprint": [
      0.33,
      0.25
    ],
    "pickupAnchor": [
      8,
      9
    ],
    "icon": "loak-v2/icons/mouse_rusak.png",
    "url": "./legacy-assets/loak-v2/ground/mouse_rusak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/mouse_rusak.png",
    "relativeFile": "ground/mouse_rusak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "remote_tv",
    "file": "loak-v2/ground/remote_tv.png",
    "label": "Remote televisi rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "remote_tv",
    "legacyId": "remote_tv",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Remote televisi rusak",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      30,
      17
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": [
      0.47,
      0.27
    ],
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/remote_tv.png",
    "url": "./legacy-assets/loak-v2/ground/remote_tv.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/remote_tv.png",
    "relativeFile": "ground/remote_tv.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "papan_sirkuit",
    "file": "loak-v2/ground/papan_sirkuit.png",
    "label": "Papan sirkuit bekas",
    "width": 0.58,
    "height": 0.7,
    "pivotY": 0.55,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "papan_sirkuit",
    "legacyId": "papan_sirkuit",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Papan sirkuit bekas",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      37,
      20
    ],
    "pivot": [
      18,
      11
    ],
    "footprint": [
      0.58,
      0.31
    ],
    "pickupAnchor": [
      18,
      11
    ],
    "icon": "loak-v2/icons/papan_sirkuit.png",
    "url": "./legacy-assets/loak-v2/ground/papan_sirkuit.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/papan_sirkuit.png",
    "relativeFile": "ground/papan_sirkuit.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "steker_listrik",
    "file": "loak-v2/ground/steker_listrik.png",
    "label": "Kepala colokan listrik",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "steker_listrik",
    "legacyId": "steker_listrik",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Kepala colokan listrik",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      24,
      17
    ],
    "pivot": [
      11,
      10
    ],
    "footprint": [
      0.38,
      0.27
    ],
    "pickupAnchor": [
      11,
      10
    ],
    "icon": "loak-v2/icons/steker_listrik.png",
    "url": "./legacy-assets/loak-v2/ground/steker_listrik.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/steker_listrik.png",
    "relativeFile": "ground/steker_listrik.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "stopkontak_bekas",
    "file": "loak-v2/ground/stopkontak_bekas.png",
    "label": "Stopkontak tiga lubang",
    "width": 0.64,
    "height": 0.7,
    "pivotY": 0.571,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "stopkontak_bekas",
    "legacyId": "stopkontak_bekas",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Stopkontak tiga lubang",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      41,
      21
    ],
    "pivot": [
      21,
      12
    ],
    "footprint": [
      0.64,
      0.33
    ],
    "pickupAnchor": [
      21,
      12
    ],
    "icon": "loak-v2/icons/stopkontak_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/stopkontak_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/stopkontak_bekas.png",
    "relativeFile": "ground/stopkontak_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kabel_usb",
    "file": "loak-v2/ground/kabel_usb.png",
    "label": "Kabel USB putus",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.65,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kabel_usb",
    "legacyId": "kabel_usb",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Kabel USB putus",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      31,
      20
    ],
    "pivot": [
      12,
      13
    ],
    "footprint": [
      0.48,
      0.31
    ],
    "pickupAnchor": [
      12,
      13
    ],
    "icon": "loak-v2/icons/kabel_usb.png",
    "url": "./legacy-assets/loak-v2/ground/kabel_usb.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kabel_usb.png",
    "relativeFile": "ground/kabel_usb.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "speaker_kecil",
    "file": "loak-v2/ground/speaker_kecil.png",
    "label": "Speaker kecil rusak",
    "width": 0.55,
    "height": 0.851,
    "pivotY": 0.69,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "speaker_kecil",
    "legacyId": "speaker_kecil",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Speaker kecil rusak",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      26,
      29
    ],
    "pivot": [
      10,
      20
    ],
    "footprint": [
      0.41,
      0.45
    ],
    "pickupAnchor": [
      10,
      20
    ],
    "icon": "loak-v2/icons/speaker_kecil.png",
    "url": "./legacy-assets/loak-v2/ground/speaker_kecil.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/speaker_kecil.png",
    "relativeFile": "ground/speaker_kecil.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "adaptor_laptop",
    "file": "loak-v2/ground/adaptor_laptop.png",
    "label": "Adaptor laptop rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.476,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "adaptor_laptop",
    "legacyId": "adaptor_laptop",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Adaptor laptop rusak",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      35,
      21
    ],
    "pivot": [
      17,
      10
    ],
    "footprint": [
      0.55,
      0.33
    ],
    "pickupAnchor": [
      17,
      10
    ],
    "icon": "loak-v2/icons/adaptor_laptop.png",
    "url": "./legacy-assets/loak-v2/ground/adaptor_laptop.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/adaptor_laptop.png",
    "relativeFile": "ground/adaptor_laptop.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "router_wifi",
    "file": "loak-v2/ground/router_wifi.png",
    "label": "Router WiFi mati",
    "width": 0.55,
    "height": 0.968,
    "pivotY": 0.727,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "router_wifi",
    "legacyId": "router_wifi",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Router WiFi mati",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      33,
      33
    ],
    "pivot": [
      14,
      24
    ],
    "footprint": [
      0.52,
      0.52
    ],
    "pickupAnchor": [
      14,
      24
    ],
    "icon": "loak-v2/icons/router_wifi.png",
    "url": "./legacy-assets/loak-v2/ground/router_wifi.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/router_wifi.png",
    "relativeFile": "ground/router_wifi.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "baling_kipas",
    "file": "loak-v2/ground/baling_kipas.png",
    "label": "Baling kipas lepas",
    "width": 0.64,
    "height": 0.7,
    "pivotY": 0.524,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "baling_kipas",
    "legacyId": "baling_kipas",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Baling kipas lepas",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      41,
      21
    ],
    "pivot": [
      21,
      11
    ],
    "footprint": [
      0.64,
      0.33
    ],
    "pickupAnchor": [
      21,
      11
    ],
    "icon": "loak-v2/icons/baling_kipas.png",
    "url": "./legacy-assets/loak-v2/ground/baling_kipas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/baling_kipas.png",
    "relativeFile": "ground/baling_kipas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "dinamo_kecil",
    "file": "loak-v2/ground/dinamo_kecil.png",
    "label": "Dinamo kecil bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.65,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "dinamo_kecil",
    "legacyId": "dinamo_kecil",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Dinamo kecil bekas",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      33,
      20
    ],
    "pivot": [
      17,
      13
    ],
    "footprint": [
      0.52,
      0.31
    ],
    "pickupAnchor": [
      17,
      13
    ],
    "icon": "loak-v2/icons/dinamo_kecil.png",
    "url": "./legacy-assets/loak-v2/ground/dinamo_kecil.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/dinamo_kecil.png",
    "relativeFile": "ground/dinamo_kecil.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kalkulator_mati",
    "file": "loak-v2/ground/kalkulator_mati.png",
    "label": "Kalkulator mati",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.526,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kalkulator_mati",
    "legacyId": "kalkulator_mati",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Kalkulator mati",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      30,
      19
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": [
      0.47,
      0.3
    ],
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/kalkulator_mati.png",
    "url": "./legacy-assets/loak-v2/ground/kalkulator_mati.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kalkulator_mati.png",
    "relativeFile": "ground/kalkulator_mati.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "headphone_patah",
    "file": "loak-v2/ground/headphone_patah.png",
    "label": "Headphone patah",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.591,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "headphone_patah",
    "legacyId": "headphone_patah",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Headphone patah",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      33,
      22
    ],
    "pivot": [
      15,
      13
    ],
    "footprint": [
      0.52,
      0.34
    ],
    "pickupAnchor": [
      15,
      13
    ],
    "icon": "loak-v2/icons/headphone_patah.png",
    "url": "./legacy-assets/loak-v2/ground/headphone_patah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/headphone_patah.png",
    "relativeFile": "ground/headphone_patah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "dvd_bekas",
    "file": "loak-v2/ground/dvd_bekas.png",
    "label": "DVD bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "dvd_bekas",
    "legacyId": "dvd_bekas",
    "rarity": "jarang",
    "value": 8000,
    "detail": "DVD bekas",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      25,
      14
    ],
    "pivot": [
      11,
      7
    ],
    "footprint": [
      0.39,
      0.25
    ],
    "pickupAnchor": [
      11,
      7
    ],
    "icon": "loak-v2/icons/dvd_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/dvd_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/dvd_bekas.png",
    "relativeFile": "ground/dvd_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "fiting_lampu",
    "file": "loak-v2/ground/fiting_lampu.png",
    "label": "Fiting lampu lepas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.632,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "fiting_lampu",
    "legacyId": "fiting_lampu",
    "rarity": "jarang",
    "value": 8000,
    "detail": "Fiting lampu lepas",
    "reviewGroup": "elektronik",
    "status": "new_review_only",
    "size": [
      22,
      19
    ],
    "pivot": [
      9,
      12
    ],
    "footprint": [
      0.34,
      0.3
    ],
    "pickupAnchor": [
      9,
      12
    ],
    "icon": "loak-v2/icons/fiting_lampu.png",
    "url": "./legacy-assets/loak-v2/ground/fiting_lampu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/fiting_lampu.png",
    "relativeFile": "ground/fiting_lampu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "panci_penyok",
    "file": "loak-v2/ground/panci_penyok.png",
    "label": "Panci aluminium penyok",
    "width": 0.55,
    "height": 0.704,
    "pivotY": 0.583,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "panci_penyok",
    "legacyId": "panci_penyok",
    "rarity": "umum",
    "value": 1200,
    "detail": "Panci aluminium penyok",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      35,
      24
    ],
    "pivot": [
      16,
      14
    ],
    "footprint": [
      0.55,
      0.38
    ],
    "pickupAnchor": [
      16,
      14
    ],
    "icon": "loak-v2/icons/panci_penyok.png",
    "url": "./legacy-assets/loak-v2/ground/panci_penyok.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/panci_penyok.png",
    "relativeFile": "ground/panci_penyok.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "wajan_tua",
    "file": "loak-v2/ground/wajan_tua.png",
    "label": "Wajan tua",
    "width": 0.58,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "wajan_tua",
    "legacyId": "wajan_tua",
    "rarity": "umum",
    "value": 1200,
    "detail": "Wajan tua",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      37,
      20
    ],
    "pivot": [
      15,
      10
    ],
    "footprint": [
      0.58,
      0.31
    ],
    "pickupAnchor": [
      15,
      10
    ],
    "icon": "loak-v2/icons/wajan_tua.png",
    "url": "./legacy-assets/loak-v2/ground/wajan_tua.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/wajan_tua.png",
    "relativeFile": "ground/wajan_tua.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tutup_panci",
    "file": "loak-v2/ground/tutup_panci.png",
    "label": "Tutup panci lepas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.471,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tutup_panci",
    "legacyId": "tutup_panci",
    "rarity": "umum",
    "value": 1200,
    "detail": "Tutup panci lepas",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      32,
      17
    ],
    "pivot": [
      14,
      8
    ],
    "footprint": [
      0.5,
      0.27
    ],
    "pickupAnchor": [
      14,
      8
    ],
    "icon": "loak-v2/icons/tutup_panci.png",
    "url": "./legacy-assets/loak-v2/ground/tutup_panci.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tutup_panci.png",
    "relativeFile": "ground/tutup_panci.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sendok_garpu",
    "file": "loak-v2/ground/sendok_garpu.png",
    "label": "Sendok garpu bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.571,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sendok_garpu",
    "legacyId": "sendok_garpu",
    "rarity": "umum",
    "value": 1200,
    "detail": "Sendok garpu bekas",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      32,
      21
    ],
    "pivot": [
      14,
      12
    ],
    "footprint": [
      0.5,
      0.33
    ],
    "pickupAnchor": [
      14,
      12
    ],
    "icon": "loak-v2/icons/sendok_garpu.png",
    "url": "./legacy-assets/loak-v2/ground/sendok_garpu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sendok_garpu.png",
    "relativeFile": "ground/sendok_garpu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "parutan_dapur",
    "file": "loak-v2/ground/parutan_dapur.png",
    "label": "Parutan dapur tumpul",
    "width": 0.56,
    "height": 0.7,
    "pivotY": 0.571,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "parutan_dapur",
    "legacyId": "parutan_dapur",
    "rarity": "umum",
    "value": 1200,
    "detail": "Parutan dapur tumpul",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      36,
      21
    ],
    "pivot": [
      18,
      12
    ],
    "footprint": [
      0.56,
      0.33
    ],
    "pickupAnchor": [
      18,
      12
    ],
    "icon": "loak-v2/icons/parutan_dapur.png",
    "url": "./legacy-assets/loak-v2/ground/parutan_dapur.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/parutan_dapur.png",
    "relativeFile": "ground/parutan_dapur.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sodet_patah",
    "file": "loak-v2/ground/sodet_patah.png",
    "label": "Sodet patah",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.556,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sodet_patah",
    "legacyId": "sodet_patah",
    "rarity": "umum",
    "value": 1200,
    "detail": "Sodet patah",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      35,
      18
    ],
    "pivot": [
      16,
      10
    ],
    "footprint": [
      0.55,
      0.28
    ],
    "pickupAnchor": [
      16,
      10
    ],
    "icon": "loak-v2/icons/sodet_patah.png",
    "url": "./legacy-assets/loak-v2/ground/sodet_patah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sodet_patah.png",
    "relativeFile": "ground/sodet_patah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "cangkir_enamel",
    "file": "loak-v2/ground/cangkir_enamel.png",
    "label": "Cangkir enamel sumbing",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.632,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "cangkir_enamel",
    "legacyId": "cangkir_enamel",
    "rarity": "umum",
    "value": 1200,
    "detail": "Cangkir enamel sumbing",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      22,
      19
    ],
    "pivot": [
      8,
      12
    ],
    "footprint": [
      0.34,
      0.3
    ],
    "pickupAnchor": [
      8,
      12
    ],
    "icon": "loak-v2/icons/cangkir_enamel.png",
    "url": "./legacy-assets/loak-v2/ground/cangkir_enamel.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/cangkir_enamel.png",
    "relativeFile": "ground/cangkir_enamel.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "talenan_kayu",
    "file": "loak-v2/ground/talenan_kayu.png",
    "label": "Talenan kayu usang",
    "width": 0.59,
    "height": 0.7,
    "pivotY": 0.524,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "talenan_kayu",
    "legacyId": "talenan_kayu",
    "rarity": "umum",
    "value": 1200,
    "detail": "Talenan kayu usang",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      38,
      21
    ],
    "pivot": [
      18,
      11
    ],
    "footprint": [
      0.59,
      0.33
    ],
    "pickupAnchor": [
      18,
      11
    ],
    "icon": "loak-v2/icons/talenan_kayu.png",
    "url": "./legacy-assets/loak-v2/ground/talenan_kayu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/talenan_kayu.png",
    "relativeFile": "ground/talenan_kayu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "termos_rusak",
    "file": "loak-v2/ground/termos_rusak.png",
    "label": "Termos rusak",
    "width": 0.55,
    "height": 0.91,
    "pivotY": 0.774,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "termos_rusak",
    "legacyId": "termos_rusak",
    "rarity": "umum",
    "value": 1200,
    "detail": "Termos rusak",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      21,
      31
    ],
    "pivot": [
      7,
      24
    ],
    "footprint": [
      0.33,
      0.48
    ],
    "pickupAnchor": [
      7,
      24
    ],
    "icon": "loak-v2/icons/termos_rusak.png",
    "url": "./legacy-assets/loak-v2/ground/termos_rusak.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/termos_rusak.png",
    "relativeFile": "ground/termos_rusak.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sapu_lidi",
    "file": "loak-v2/ground/sapu_lidi.png",
    "label": "Sapu lidi pendek",
    "width": 0.66,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sapu_lidi",
    "legacyId": "sapu_lidi",
    "rarity": "umum",
    "value": 1200,
    "detail": "Sapu lidi pendek",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      42,
      22
    ],
    "pivot": [
      17,
      11
    ],
    "footprint": [
      0.66,
      0.34
    ],
    "pickupAnchor": [
      17,
      11
    ],
    "icon": "loak-v2/icons/sapu_lidi.png",
    "url": "./legacy-assets/loak-v2/ground/sapu_lidi.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sapu_lidi.png",
    "relativeFile": "ground/sapu_lidi.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "sikat_pakaian",
    "file": "loak-v2/ground/sikat_pakaian.png",
    "label": "Sikat pakaian usang",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.611,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "sikat_pakaian",
    "legacyId": "sikat_pakaian",
    "rarity": "umum",
    "value": 1200,
    "detail": "Sikat pakaian usang",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      26,
      18
    ],
    "pivot": [
      12,
      11
    ],
    "footprint": [
      0.41,
      0.28
    ],
    "pickupAnchor": [
      12,
      11
    ],
    "icon": "loak-v2/icons/sikat_pakaian.png",
    "url": "./legacy-assets/loak-v2/ground/sikat_pakaian.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/sikat_pakaian.png",
    "relativeFile": "ground/sikat_pakaian.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "rak_sabun",
    "file": "loak-v2/ground/rak_sabun.png",
    "label": "Rak kawat sabun",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.571,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "rak_sabun",
    "legacyId": "rak_sabun",
    "rarity": "umum",
    "value": 1200,
    "detail": "Rak kawat sabun",
    "reviewGroup": "rumah_tangga",
    "status": "new_review_only",
    "size": [
      30,
      21
    ],
    "pivot": [
      14,
      12
    ],
    "footprint": [
      0.47,
      0.33
    ],
    "pickupAnchor": [
      14,
      12
    ],
    "icon": "loak-v2/icons/rak_sabun.png",
    "url": "./legacy-assets/loak-v2/ground/rak_sabun.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/rak_sabun.png",
    "relativeFile": "ground/rak_sabun.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "palu_bekas",
    "file": "loak-v2/ground/palu_bekas.png",
    "label": "Palu bekas",
    "width": 0.59,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "palu_bekas",
    "legacyId": "palu_bekas",
    "rarity": "umum",
    "value": 1800,
    "detail": "Palu bekas",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      38,
      18
    ],
    "pivot": [
      18,
      9
    ],
    "footprint": [
      0.59,
      0.28
    ],
    "pickupAnchor": [
      18,
      9
    ],
    "icon": "loak-v2/icons/palu_bekas.png",
    "url": "./legacy-assets/loak-v2/ground/palu_bekas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/palu_bekas.png",
    "relativeFile": "ground/palu_bekas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "tang_karat",
    "file": "loak-v2/ground/tang_karat.png",
    "label": "Tang berkarat",
    "width": 0.59,
    "height": 0.7,
    "pivotY": 0.591,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "tang_karat",
    "legacyId": "tang_karat",
    "rarity": "umum",
    "value": 1800,
    "detail": "Tang berkarat",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      38,
      22
    ],
    "pivot": [
      20,
      13
    ],
    "footprint": [
      0.59,
      0.34
    ],
    "pickupAnchor": [
      20,
      13
    ],
    "icon": "loak-v2/icons/tang_karat.png",
    "url": "./legacy-assets/loak-v2/ground/tang_karat.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/tang_karat.png",
    "relativeFile": "ground/tang_karat.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "obeng_minus",
    "file": "loak-v2/ground/obeng_minus.png",
    "label": "Obeng minus bekas",
    "width": 0.56,
    "height": 0.7,
    "pivotY": 0.632,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "obeng_minus",
    "legacyId": "obeng_minus",
    "rarity": "umum",
    "value": 1800,
    "detail": "Obeng minus bekas",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      36,
      19
    ],
    "pivot": [
      16,
      12
    ],
    "footprint": [
      0.56,
      0.3
    ],
    "pickupAnchor": [
      16,
      12
    ],
    "icon": "loak-v2/icons/obeng_minus.png",
    "url": "./legacy-assets/loak-v2/ground/obeng_minus.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/obeng_minus.png",
    "relativeFile": "ground/obeng_minus.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kunci_pas",
    "file": "loak-v2/ground/kunci_pas.png",
    "label": "Kunci pas bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kunci_pas",
    "legacyId": "kunci_pas",
    "rarity": "umum",
    "value": 1800,
    "detail": "Kunci pas bekas",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      34,
      18
    ],
    "pivot": [
      15,
      9
    ],
    "footprint": [
      0.53,
      0.28
    ],
    "pickupAnchor": [
      15,
      9
    ],
    "icon": "loak-v2/icons/kunci_pas.png",
    "url": "./legacy-assets/loak-v2/ground/kunci_pas.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kunci_pas.png",
    "relativeFile": "ground/kunci_pas.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "meteran_macet",
    "file": "loak-v2/ground/meteran_macet.png",
    "label": "Meteran gulung macet",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.609,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "meteran_macet",
    "legacyId": "meteran_macet",
    "rarity": "umum",
    "value": 1800,
    "detail": "Meteran gulung macet",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      28,
      23
    ],
    "pivot": [
      10,
      14
    ],
    "footprint": [
      0.44,
      0.36
    ],
    "pickupAnchor": [
      10,
      14
    ],
    "icon": "loak-v2/icons/meteran_macet.png",
    "url": "./legacy-assets/loak-v2/ground/meteran_macet.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/meteran_macet.png",
    "relativeFile": "ground/meteran_macet.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kuas_cat",
    "file": "loak-v2/ground/kuas_cat.png",
    "label": "Kuas cat kering",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.526,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kuas_cat",
    "legacyId": "kuas_cat",
    "rarity": "umum",
    "value": 1800,
    "detail": "Kuas cat kering",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      33,
      19
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": [
      0.52,
      0.3
    ],
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/kuas_cat.png",
    "url": "./legacy-assets/loak-v2/ground/kuas_cat.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kuas_cat.png",
    "relativeFile": "ground/kuas_cat.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gergaji_tumpul",
    "file": "loak-v2/ground/gergaji_tumpul.png",
    "label": "Gergaji tangan tumpul",
    "width": 0.69,
    "height": 0.704,
    "pivotY": 0.583,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gergaji_tumpul",
    "legacyId": "gergaji_tumpul",
    "rarity": "umum",
    "value": 1800,
    "detail": "Gergaji tangan tumpul",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      44,
      24
    ],
    "pivot": [
      22,
      14
    ],
    "footprint": [
      0.69,
      0.38
    ],
    "pickupAnchor": [
      22,
      14
    ],
    "icon": "loak-v2/icons/gergaji_tumpul.png",
    "url": "./legacy-assets/loak-v2/ground/gergaji_tumpul.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gergaji_tumpul.png",
    "relativeFile": "ground/gergaji_tumpul.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gunting_patah",
    "file": "loak-v2/ground/gunting_patah.png",
    "label": "Gunting patah",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gunting_patah",
    "legacyId": "gunting_patah",
    "rarity": "umum",
    "value": 1800,
    "detail": "Gunting patah",
    "reviewGroup": "perkakas",
    "status": "new_review_only",
    "size": [
      35,
      18
    ],
    "pivot": [
      17,
      9
    ],
    "footprint": [
      0.55,
      0.28
    ],
    "pickupAnchor": [
      17,
      9
    ],
    "icon": "loak-v2/icons/gunting_patah.png",
    "url": "./legacy-assets/loak-v2/ground/gunting_patah.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gunting_patah.png",
    "relativeFile": "ground/gunting_patah.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "gasing_kayu",
    "file": "loak-v2/ground/gasing_kayu.png",
    "label": "Gasing kayu usang",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.611,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "gasing_kayu",
    "legacyId": "gasing_kayu",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Gasing kayu usang",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      22,
      18
    ],
    "pivot": [
      9,
      11
    ],
    "footprint": [
      0.34,
      0.28
    ],
    "pickupAnchor": [
      9,
      11
    ],
    "icon": "loak-v2/icons/gasing_kayu.png",
    "url": "./legacy-assets/loak-v2/ground/gasing_kayu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/gasing_kayu.png",
    "relativeFile": "ground/gasing_kayu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "bola_kempis",
    "file": "loak-v2/ground/bola_kempis.png",
    "label": "Bola karet kempis",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.5,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "bola_kempis",
    "legacyId": "bola_kempis",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Bola karet kempis",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      25,
      14
    ],
    "pivot": [
      11,
      7
    ],
    "footprint": [
      0.39,
      0.25
    ],
    "pickupAnchor": [
      11,
      7
    ],
    "icon": "loak-v2/icons/bola_kempis.png",
    "url": "./legacy-assets/loak-v2/ground/bola_kempis.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/bola_kempis.png",
    "relativeFile": "ground/bola_kempis.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "yoyo_tanpa_tali",
    "file": "loak-v2/ground/yoyo_tanpa_tali.png",
    "label": "Yoyo tanpa tali",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "yoyo_tanpa_tali",
    "legacyId": "yoyo_tanpa_tali",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Yoyo tanpa tali",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      22,
      17
    ],
    "pivot": [
      9,
      10
    ],
    "footprint": [
      0.34,
      0.27
    ],
    "pickupAnchor": [
      9,
      10
    ],
    "icon": "loak-v2/icons/yoyo_tanpa_tali.png",
    "url": "./legacy-assets/loak-v2/ground/yoyo_tanpa_tali.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/yoyo_tanpa_tali.png",
    "relativeFile": "ground/yoyo_tanpa_tali.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "robot_mainan",
    "file": "loak-v2/ground/robot_mainan.png",
    "label": "Robot mainan satu lengan",
    "width": 0.55,
    "height": 0.851,
    "pivotY": 0.759,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "robot_mainan",
    "legacyId": "robot_mainan",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Robot mainan satu lengan",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      26,
      29
    ],
    "pivot": [
      10,
      22
    ],
    "footprint": [
      0.41,
      0.45
    ],
    "pickupAnchor": [
      10,
      22
    ],
    "icon": "loak-v2/icons/robot_mainan.png",
    "url": "./legacy-assets/loak-v2/ground/robot_mainan.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/robot_mainan.png",
    "relativeFile": "ground/robot_mainan.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "balok_kayu",
    "file": "loak-v2/ground/balok_kayu.png",
    "label": "Balok alfabet kayu",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.65,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "balok_kayu",
    "legacyId": "balok_kayu",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Balok alfabet kayu",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      22,
      20
    ],
    "pivot": [
      8,
      13
    ],
    "footprint": [
      0.34,
      0.31
    ],
    "pickupAnchor": [
      8,
      13
    ],
    "icon": "loak-v2/icons/balok_kayu.png",
    "url": "./legacy-assets/loak-v2/ground/balok_kayu.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/balok_kayu.png",
    "relativeFile": "ground/balok_kayu.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "peluit_mainan",
    "file": "loak-v2/ground/peluit_mainan.png",
    "label": "Peluit mainan rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.533,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "peluit_mainan",
    "legacyId": "peluit_mainan",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Peluit mainan rusak",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      22,
      15
    ],
    "pivot": [
      9,
      8
    ],
    "footprint": [
      0.34,
      0.25
    ],
    "pickupAnchor": [
      9,
      8
    ],
    "icon": "loak-v2/icons/peluit_mainan.png",
    "url": "./legacy-assets/loak-v2/ground/peluit_mainan.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/peluit_mainan.png",
    "relativeFile": "ground/peluit_mainan.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kelereng_kantong",
    "file": "loak-v2/ground/kelereng_kantong.png",
    "label": "Kelereng dalam kantong jala",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.632,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kelereng_kantong",
    "legacyId": "kelereng_kantong",
    "rarity": "jarang",
    "value": 6000,
    "detail": "Kelereng dalam kantong jala",
    "reviewGroup": "mainan",
    "status": "new_review_only",
    "size": [
      25,
      19
    ],
    "pivot": [
      11,
      12
    ],
    "footprint": [
      0.39,
      0.3
    ],
    "pickupAnchor": [
      11,
      12
    ],
    "icon": "loak-v2/icons/kelereng_kantong.png",
    "url": "./legacy-assets/loak-v2/ground/kelereng_kantong.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kelereng_kantong.png",
    "relativeFile": "ground/kelereng_kantong.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "lensa_kamera",
    "file": "loak-v2/ground/lensa_kamera.png",
    "label": "Lensa kamera lepas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.682,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "lensa_kamera",
    "legacyId": "lensa_kamera",
    "rarity": "langka",
    "value": 35000,
    "detail": "Lensa kamera lepas",
    "reviewGroup": "salvage_khusus",
    "status": "new_review_only",
    "size": [
      23,
      22
    ],
    "pivot": [
      9,
      15
    ],
    "footprint": [
      0.36,
      0.34
    ],
    "pickupAnchor": [
      9,
      15
    ],
    "icon": "loak-v2/icons/lensa_kamera.png",
    "url": "./legacy-assets/loak-v2/ground/lensa_kamera.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/lensa_kamera.png",
    "relativeFile": "ground/lensa_kamera.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "kompas_saku",
    "file": "loak-v2/ground/kompas_saku.png",
    "label": "Kompas saku rusak",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.533,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "kompas_saku",
    "legacyId": "kompas_saku",
    "rarity": "langka",
    "value": 35000,
    "detail": "Kompas saku rusak",
    "reviewGroup": "salvage_khusus",
    "status": "new_review_only",
    "size": [
      25,
      15
    ],
    "pivot": [
      11,
      8
    ],
    "footprint": [
      0.39,
      0.25
    ],
    "pickupAnchor": [
      11,
      8
    ],
    "icon": "loak-v2/icons/kompas_saku.png",
    "url": "./legacy-assets/loak-v2/ground/kompas_saku.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/kompas_saku.png",
    "relativeFile": "ground/kompas_saku.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "teropong_kecil",
    "file": "loak-v2/ground/teropong_kecil.png",
    "label": "Teropong kecil rusak",
    "width": 0.55,
    "height": 0.704,
    "pivotY": 0.625,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "teropong_kecil",
    "legacyId": "teropong_kecil",
    "rarity": "langka",
    "value": 35000,
    "detail": "Teropong kecil rusak",
    "reviewGroup": "salvage_khusus",
    "status": "new_review_only",
    "size": [
      35,
      24
    ],
    "pivot": [
      16,
      15
    ],
    "footprint": [
      0.55,
      0.38
    ],
    "pickupAnchor": [
      16,
      15
    ],
    "icon": "loak-v2/icons/teropong_kecil.png",
    "url": "./legacy-assets/loak-v2/ground/teropong_kecil.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/teropong_kecil.png",
    "relativeFile": "ground/teropong_kecil.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "medali_kuningan",
    "file": "loak-v2/ground/medali_kuningan.png",
    "label": "Medali kuningan bekas",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.471,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "medali_kuningan",
    "legacyId": "medali_kuningan",
    "rarity": "langka",
    "value": 35000,
    "detail": "Medali kuningan bekas",
    "reviewGroup": "salvage_khusus",
    "status": "new_review_only",
    "size": [
      23,
      17
    ],
    "pivot": [
      9,
      8
    ],
    "footprint": [
      0.36,
      0.27
    ],
    "pickupAnchor": [
      9,
      8
    ],
    "icon": "loak-v2/icons/medali_kuningan.png",
    "url": "./legacy-assets/loak-v2/ground/medali_kuningan.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/medali_kuningan.png",
    "relativeFile": "ground/medali_kuningan.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  },
  {
    "id": "harmonika_tua",
    "file": "loak-v2/ground/harmonika_tua.png",
    "label": "Harmonika tua",
    "width": 0.55,
    "height": 0.7,
    "pivotY": 0.588,
    "group": "Loak Objects",
    "category": "object",
    "objectCategory": "item",
    "source": "loak-v2",
    "legacyType": "harmonika_tua",
    "legacyId": "harmonika_tua",
    "rarity": "langka",
    "value": 35000,
    "detail": "Harmonika tua",
    "reviewGroup": "salvage_khusus",
    "status": "new_review_only",
    "size": [
      32,
      17
    ],
    "pivot": [
      14,
      10
    ],
    "footprint": [
      0.5,
      0.27
    ],
    "pickupAnchor": [
      14,
      10
    ],
    "icon": "loak-v2/icons/harmonika_tua.png",
    "url": "./legacy-assets/loak-v2/ground/harmonika_tua.png",
    "iconUrl": "./legacy-assets/loak-v2/icons/harmonika_tua.png",
    "relativeFile": "ground/harmonika_tua.png",
    "collision": false,
    "interactive": true,
    "interactions": [
      "pickup"
    ],
    "jiwaAction": "pickup",
    "published": true,
    "kind": "sprite",
    "front": null
  }
];
const types = [
  {
    "id": "botol_plastik",
    "name": "Botol plastik bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 300,
    "spawnWeight": 14,
    "detail": "botol air mineral kosong, penyok",
    "sprites": [
      "botol_plastik_bening",
      "botol_plastik_hijau"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kaleng_minuman",
    "name": "Kaleng minuman bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 12,
    "detail": "kaleng soda kosong, bisa dijual kiloan",
    "sprites": [
      "kaleng_minuman_merah",
      "kaleng_minuman_hijau"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kardus_lipat",
    "name": "Kardus bekas dilipat",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 800,
    "spawnWeight": 12,
    "detail": "kardus mi instan dilipat pipih",
    "sprites": [
      "kardus_lipat"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "koran_bekas",
    "name": "Koran bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 12,
    "detail": "koran lama terlipat, dijual kiloan",
    "sprites": [
      "koran_bekas"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "sandal_jepit",
    "name": "Sandal jepit putus",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 300,
    "spawnWeight": 10,
    "detail": "sandal jepit karet, talinya putus",
    "sprites": [
      "sandal_jepit_biru",
      "sandal_jepit_merah"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kabel_bekas",
    "name": "Gulungan kabel bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "kabel listrik sisa, tembaganya bisa dijual",
    "sprites": [
      "kabel_bekas"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "charger_rusak",
    "name": "Charger HP rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 8,
    "detail": "kepala charger putih, kabel terkelupas",
    "sprites": [
      "charger_rusak"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kaset_pita",
    "name": "Kaset pita lama",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 2500,
    "spawnWeight": 7,
    "detail": "kaset lagu lawas, pitanya sedikit kusut",
    "sprites": [
      "kaset_pita"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "buku_bekas",
    "name": "Buku bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 2000,
    "spawnWeight": 9,
    "detail": "buku pelajaran lama, sampulnya lecek",
    "sprites": [
      "buku_bekas_merah",
      "buku_bekas_biru"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "payung_rusak",
    "name": "Payung rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 2000,
    "spawnWeight": 6,
    "detail": "payung lipat, rangkanya patah",
    "sprites": [
      "payung_rusak_ungu",
      "payung_rusak_hitam"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "sepatu_bekas",
    "name": "Sepatu bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 3000,
    "spawnWeight": 7,
    "detail": "sepatu kets sebelah, solnya mangap",
    "sprites": [
      "sepatu_bekas_putih",
      "sepatu_bekas_hitam"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "dompet_kosong",
    "name": "Dompet kosong",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 3000,
    "spawnWeight": 6,
    "detail": "dompet kulit sintetis, isinya sudah tidak ada (KTP tidak ada)",
    "sprites": [
      "dompet_kosong"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "gelas_plastik",
    "name": "Gelas plastik es teh",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 200,
    "spawnWeight": 14,
    "detail": "gelas plastik bekas es teh, sedotannya masih nancep",
    "sprites": [
      "gelas_plastik"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "ember_bocor",
    "name": "Ember bocor",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "umum",
    "catalogPrice": 2500,
    "spawnWeight": 6,
    "detail": "ember plastik hitam, dasarnya bolong",
    "sprites": [
      "ember_bocor"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "hp_jadul",
    "name": "HP jadul rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 15000,
    "spawnWeight": 5,
    "detail": "HP Nokia klasik, layarnya retak, masih bisa diservis",
    "sprites": [
      "hp_jadul_biru",
      "hp_jadul_abu"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "jam_tangan_rusak",
    "name": "Jam tangan rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 12000,
    "spawnWeight": 5,
    "detail": "jam tangan analog, kacanya retak, talinya kulit",
    "sprites": [
      "jam_tangan_rusak"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kacamata",
    "name": "Kacamata bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 6,
    "detail": "kacamata minus, satu gagangnya longgar",
    "sprites": [
      "kacamata"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kunci_lama",
    "name": "Kunci lama",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 5000,
    "spawnWeight": 7,
    "detail": "dua anak kunci kuningan di ring besi",
    "sprites": [
      "kunci_lama"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "besi_tua",
    "name": "Besi tua",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 8,
    "detail": "potongan pipa besi berkarat + mur, dijual kiloan",
    "sprites": [
      "besi_tua"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "helm_bekas",
    "name": "Helm bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 20000,
    "spawnWeight": 5,
    "detail": "helm half-face, kaca visornya baret",
    "sprites": [
      "helm_bekas_merah",
      "helm_bekas_putih",
      "helm_bekas_hitam"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "tas_bekas",
    "name": "Tas bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 15000,
    "spawnWeight": 5,
    "detail": "tas selempang, resletingnya macet",
    "sprites": [
      "tas_bekas_coklat",
      "tas_bekas_hitam"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "boneka_kain",
    "name": "Boneka beruang kumal",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 7000,
    "spawnWeight": 6,
    "detail": "boneka beruang kain, satu matanya copot",
    "sprites": [
      "boneka_kain"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "mainan_mobil",
    "name": "Mobil-mobilan rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 6,
    "detail": "mobil-mobilan plastik, satu rodanya hilang",
    "sprites": [
      "mainan_mobil_merah",
      "mainan_mobil_kuning"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kipas_angin",
    "name": "Kipas angin meja rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 25000,
    "spawnWeight": 4,
    "detail": "kipas angin meja, baling-balingnya patah satu",
    "sprites": [
      "kipas_angin"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "setrika_lama",
    "name": "Setrika lama",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 12000,
    "spawnWeight": 4,
    "detail": "setrika listrik jadul, kabelnya putus",
    "sprites": [
      "setrika_lama"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "radio_tua",
    "name": "Radio tua",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 30000,
    "spawnWeight": 3,
    "detail": "radio transistor kayu, masih ada bunyi kresek-kresek",
    "sprites": [
      "radio_tua"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "jam_dinding",
    "name": "Jam dinding mati",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 15000,
    "spawnWeight": 4,
    "detail": "jam dinding bulat, jarumnya berhenti di 10:10",
    "sprites": [
      "jam_dinding"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "gembok_tua",
    "name": "Gembok tua",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 6,
    "detail": "gembok kuningan tanpa kunci",
    "sprites": [
      "gembok_tua"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "senter_rusak",
    "name": "Senter rusak",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "jarang",
    "catalogPrice": 5000,
    "spawnWeight": 6,
    "detail": "senter plastik kuning, baterainya bocor",
    "sprites": [
      "senter_rusak"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "koin_kuno",
    "name": "Koin kuno",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 50000,
    "spawnWeight": 2,
    "detail": "beberapa koin lama (100 rupiah 1973, sen Hindia Belanda)",
    "sprites": [
      "koin_kuno"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "tembaga_gulungan",
    "name": "Gulungan kawat tembaga",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 40000,
    "spawnWeight": 3,
    "detail": "kawat tembaga bekas gulungan dinamo, mahal di pengepul",
    "sprites": [
      "tembaga_gulungan"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "aki_bekas",
    "name": "Aki bekas",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 35000,
    "spawnWeight": 3,
    "detail": "aki motor/mobil bekas, berat, dibeli pengepul",
    "sprites": [
      "aki_bekas"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "kamera_analog",
    "name": "Kamera analog",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 80000,
    "spawnWeight": 2,
    "detail": "kamera film jadul, lensanya masih utuh",
    "sprites": [
      "kamera_analog"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "walkman",
    "name": "Walkman kaset",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 60000,
    "spawnWeight": 2,
    "detail": "pemutar kaset portabel tahun 80-an",
    "sprites": [
      "walkman"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "piringan_hitam",
    "name": "Piringan hitam",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 70000,
    "spawnWeight": 2,
    "detail": "piringan hitam lagu keroncong dalam sampul kertas",
    "sprites": [
      "piringan_hitam"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "arloji_saku",
    "name": "Arloji saku antik",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 120000,
    "spawnWeight": 1,
    "detail": "arloji saku kuningan dengan rantai, barang antik incaran kolektor",
    "sprites": [
      "arloji_saku"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "lampu_petromaks",
    "name": "Lampu petromaks",
    "status": "preserved_original",
    "reviewGroup": "koleksi_asli",
    "rarity": "langka",
    "catalogPrice": 90000,
    "spawnWeight": 1,
    "detail": "lampu petromaks kuningan peninggalan pedagang malam",
    "sprites": [
      "lampu_petromaks"
    ],
    "proposedFootprint": null,
    "proposedPickupAnchor": null
  },
  {
    "id": "pipa_besi",
    "name": "Pipa besi berkarat",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Pipa besi berkarat",
    "sprites": [
      "pipa_besi"
    ],
    "proposedFootprint": [
      0.67,
      0.42
    ],
    "proposedPickupAnchor": [
      21,
      18
    ]
  },
  {
    "id": "siku_pipa",
    "name": "Siku pipa besi",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Siku pipa besi",
    "sprites": [
      "siku_pipa"
    ],
    "proposedFootprint": [
      0.52,
      0.39
    ],
    "proposedPickupAnchor": [
      17,
      16
    ]
  },
  {
    "id": "engsel_pintu",
    "name": "Engsel pintu lepas",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Engsel pintu lepas",
    "sprites": [
      "engsel_pintu"
    ],
    "proposedFootprint": [
      0.56,
      0.31
    ],
    "proposedPickupAnchor": [
      18,
      11
    ]
  },
  {
    "id": "braket_rak",
    "name": "Braket rak besi",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Braket rak besi",
    "sprites": [
      "braket_rak"
    ],
    "proposedFootprint": [
      0.53,
      0.53
    ],
    "proposedPickupAnchor": [
      16,
      26
    ]
  },
  {
    "id": "rantai_sepeda",
    "name": "Rantai sepeda putus",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Rantai sepeda putus",
    "sprites": [
      "rantai_sepeda"
    ],
    "proposedFootprint": [
      0.55,
      0.28
    ],
    "proposedPickupAnchor": [
      16,
      9
    ]
  },
  {
    "id": "gir_sepeda",
    "name": "Gir sepeda bekas",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Gir sepeda bekas",
    "sprites": [
      "gir_sepeda"
    ],
    "proposedFootprint": [
      0.47,
      0.25
    ],
    "proposedPickupAnchor": [
      14,
      9
    ]
  },
  {
    "id": "pegas_besi",
    "name": "Per pegas lepas",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Per pegas lepas",
    "sprites": [
      "pegas_besi"
    ],
    "proposedFootprint": [
      0.52,
      0.25
    ],
    "proposedPickupAnchor": [
      15,
      9
    ]
  },
  {
    "id": "baut_mur",
    "name": "Sekantong baut mur",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Sekantong baut mur",
    "sprites": [
      "baut_mur"
    ],
    "proposedFootprint": [
      0.47,
      0.31
    ],
    "proposedPickupAnchor": [
      14,
      12
    ]
  },
  {
    "id": "kran_air",
    "name": "Kran air rusak",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Kran air rusak",
    "sprites": [
      "kran_air"
    ],
    "proposedFootprint": [
      0.33,
      0.34
    ],
    "proposedPickupAnchor": [
      7,
      15
    ]
  },
  {
    "id": "gagang_pintu",
    "name": "Gagang pintu bekas",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Gagang pintu bekas",
    "sprites": [
      "gagang_pintu"
    ],
    "proposedFootprint": [
      0.41,
      0.27
    ],
    "proposedPickupAnchor": [
      10,
      10
    ]
  },
  {
    "id": "kawat_kasa",
    "name": "Kawat kasa sobek",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Kawat kasa sobek",
    "sprites": [
      "kawat_kasa"
    ],
    "proposedFootprint": [
      0.64,
      0.36
    ],
    "proposedPickupAnchor": [
      21,
      13
    ]
  },
  {
    "id": "potongan_seng",
    "name": "Potongan seng bergelombang",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Potongan seng bergelombang",
    "sprites": [
      "potongan_seng"
    ],
    "proposedFootprint": [
      0.84,
      0.48
    ],
    "proposedPickupAnchor": [
      27,
      17
    ]
  },
  {
    "id": "tutup_kaleng",
    "name": "Tutup kaleng cat",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Tutup kaleng cat",
    "sprites": [
      "tutup_kaleng"
    ],
    "proposedFootprint": [
      0.45,
      0.27
    ],
    "proposedPickupAnchor": [
      13,
      10
    ]
  },
  {
    "id": "rangka_sadel",
    "name": "Rangka sadel sepeda",
    "status": "new_review_only",
    "reviewGroup": "logam",
    "rarity": "umum",
    "catalogPrice": 1500,
    "spawnWeight": 9,
    "detail": "Rangka sadel sepeda",
    "sprites": [
      "rangka_sadel"
    ],
    "proposedFootprint": [
      0.39,
      0.3
    ],
    "proposedPickupAnchor": [
      9,
      10
    ]
  },
  {
    "id": "jeriken_minyak",
    "name": "Jeriken minyak kosong",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Jeriken minyak kosong",
    "sprites": [
      "jeriken_minyak"
    ],
    "proposedFootprint": [
      0.47,
      0.5
    ],
    "proposedPickupAnchor": [
      14,
      23
    ]
  },
  {
    "id": "botol_sampo",
    "name": "Botol sampo kosong",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Botol sampo kosong",
    "sprites": [
      "botol_sampo"
    ],
    "proposedFootprint": [
      0.33,
      0.47
    ],
    "proposedPickupAnchor": [
      8,
      23
    ]
  },
  {
    "id": "botol_deterjen",
    "name": "Botol deterjen kosong",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Botol deterjen kosong",
    "sprites": [
      "botol_deterjen"
    ],
    "proposedFootprint": [
      0.38,
      0.44
    ],
    "proposedPickupAnchor": [
      10,
      21
    ]
  },
  {
    "id": "baskom_retak",
    "name": "Baskom retak",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Baskom retak",
    "sprites": [
      "baskom_retak"
    ],
    "proposedFootprint": [
      0.53,
      0.34
    ],
    "proposedPickupAnchor": [
      15,
      13
    ]
  },
  {
    "id": "saringan_plastik",
    "name": "Saringan plastik patah",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Saringan plastik patah",
    "sprites": [
      "saringan_plastik"
    ],
    "proposedFootprint": [
      0.48,
      0.28
    ],
    "proposedPickupAnchor": [
      12,
      9
    ]
  },
  {
    "id": "kotak_makan",
    "name": "Kotak makan tanpa tutup",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Kotak makan tanpa tutup",
    "sprites": [
      "kotak_makan"
    ],
    "proposedFootprint": [
      0.5,
      0.34
    ],
    "proposedPickupAnchor": [
      14,
      13
    ]
  },
  {
    "id": "tutup_botol",
    "name": "Tutup botol campur",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Tutup botol campur",
    "sprites": [
      "tutup_botol"
    ],
    "proposedFootprint": [
      0.39,
      0.25
    ],
    "proposedPickupAnchor": [
      11,
      8
    ]
  },
  {
    "id": "hanger_patah",
    "name": "Gantungan baju patah",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Gantungan baju patah",
    "sprites": [
      "hanger_patah"
    ],
    "proposedFootprint": [
      0.56,
      0.28
    ],
    "proposedPickupAnchor": [
      17,
      9
    ]
  },
  {
    "id": "pot_plastik",
    "name": "Pot tanaman kosong retak",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Pot tanaman kosong retak",
    "sprites": [
      "pot_plastik"
    ],
    "proposedFootprint": [
      0.41,
      0.38
    ],
    "proposedPickupAnchor": [
      12,
      17
    ]
  },
  {
    "id": "keranjang_pecah",
    "name": "Keranjang belanja pecah",
    "status": "new_review_only",
    "reviewGroup": "plastik",
    "rarity": "umum",
    "catalogPrice": 400,
    "spawnWeight": 10,
    "detail": "Keranjang belanja pecah",
    "sprites": [
      "keranjang_pecah"
    ],
    "proposedFootprint": [
      0.59,
      0.45
    ],
    "proposedPickupAnchor": [
      18,
      19
    ]
  },
  {
    "id": "tabung_karton",
    "name": "Tabung karton bekas",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Tabung karton bekas",
    "sprites": [
      "tabung_karton"
    ],
    "proposedFootprint": [
      0.59,
      0.39
    ],
    "proposedPickupAnchor": [
      18,
      17
    ]
  },
  {
    "id": "kantong_kertas",
    "name": "Kantong kertas kusut",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Kantong kertas kusut",
    "sprites": [
      "kantong_kertas"
    ],
    "proposedFootprint": [
      0.38,
      0.39
    ],
    "proposedPickupAnchor": [
      10,
      18
    ]
  },
  {
    "id": "tray_telur",
    "name": "Tray telur karton",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Tray telur karton",
    "sprites": [
      "tray_telur"
    ],
    "proposedFootprint": [
      0.58,
      0.33
    ],
    "proposedPickupAnchor": [
      18,
      11
    ]
  },
  {
    "id": "majalah_bekas",
    "name": "Majalah bekas",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Majalah bekas",
    "sprites": [
      "majalah_bekas"
    ],
    "proposedFootprint": [
      0.53,
      0.31
    ],
    "proposedPickupAnchor": [
      16,
      11
    ]
  },
  {
    "id": "amplop_coklat",
    "name": "Amplop coklat kosong",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Amplop coklat kosong",
    "sprites": [
      "amplop_coklat"
    ],
    "proposedFootprint": [
      0.53,
      0.3
    ],
    "proposedPickupAnchor": [
      16,
      11
    ]
  },
  {
    "id": "poster_gulung",
    "name": "Gulungan poster lama",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Gulungan poster lama",
    "sprites": [
      "poster_gulung"
    ],
    "proposedFootprint": [
      0.56,
      0.34
    ],
    "proposedPickupAnchor": [
      17,
      14
    ]
  },
  {
    "id": "kantong_semen",
    "name": "Kantong semen kosong",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Kantong semen kosong",
    "sprites": [
      "kantong_semen"
    ],
    "proposedFootprint": [
      0.62,
      0.34
    ],
    "proposedPickupAnchor": [
      20,
      12
    ]
  },
  {
    "id": "inti_lakban",
    "name": "Inti lakban karton",
    "status": "new_review_only",
    "reviewGroup": "kertas",
    "rarity": "umum",
    "catalogPrice": 500,
    "spawnWeight": 10,
    "detail": "Inti lakban karton",
    "sprites": [
      "inti_lakban"
    ],
    "proposedFootprint": [
      0.34,
      0.27
    ],
    "proposedPickupAnchor": [
      9,
      10
    ]
  },
  {
    "id": "botol_kecap",
    "name": "Botol kecap kosong",
    "status": "new_review_only",
    "reviewGroup": "kaca",
    "rarity": "umum",
    "catalogPrice": 800,
    "spawnWeight": 8,
    "detail": "Botol kecap kosong",
    "sprites": [
      "botol_kecap"
    ],
    "proposedFootprint": [
      0.33,
      0.45
    ],
    "proposedPickupAnchor": [
      8,
      22
    ]
  },
  {
    "id": "stoples_kaca",
    "name": "Stoples kaca tanpa tutup",
    "status": "new_review_only",
    "reviewGroup": "kaca",
    "rarity": "umum",
    "catalogPrice": 800,
    "spawnWeight": 8,
    "detail": "Stoples kaca tanpa tutup",
    "sprites": [
      "stoples_kaca"
    ],
    "proposedFootprint": [
      0.36,
      0.36
    ],
    "proposedPickupAnchor": [
      9,
      16
    ]
  },
  {
    "id": "gelas_belimbing",
    "name": "Gelas belimbing retak",
    "status": "new_review_only",
    "reviewGroup": "kaca",
    "rarity": "umum",
    "catalogPrice": 800,
    "spawnWeight": 8,
    "detail": "Gelas belimbing retak",
    "sprites": [
      "gelas_belimbing"
    ],
    "proposedFootprint": [
      0.31,
      0.3
    ],
    "proposedPickupAnchor": [
      7,
      12
    ]
  },
  {
    "id": "mangkuk_kaca",
    "name": "Mangkuk kaca sumbing",
    "status": "new_review_only",
    "reviewGroup": "kaca",
    "rarity": "umum",
    "catalogPrice": 800,
    "spawnWeight": 8,
    "detail": "Mangkuk kaca sumbing",
    "sprites": [
      "mangkuk_kaca"
    ],
    "proposedFootprint": [
      0.38,
      0.28
    ],
    "proposedPickupAnchor": [
      10,
      11
    ]
  },
  {
    "id": "cermin_tangan",
    "name": "Cermin tangan retak",
    "status": "new_review_only",
    "reviewGroup": "kaca",
    "rarity": "umum",
    "catalogPrice": 800,
    "spawnWeight": 8,
    "detail": "Cermin tangan retak",
    "sprites": [
      "cermin_tangan"
    ],
    "proposedFootprint": [
      0.47,
      0.28
    ],
    "proposedPickupAnchor": [
      12,
      9
    ]
  },
  {
    "id": "keyboard_bekas",
    "name": "Keyboard bekas",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Keyboard bekas",
    "sprites": [
      "keyboard_bekas"
    ],
    "proposedFootprint": [
      0.75,
      0.42
    ],
    "proposedPickupAnchor": [
      24,
      15
    ]
  },
  {
    "id": "mouse_rusak",
    "name": "Mouse komputer rusak",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Mouse komputer rusak",
    "sprites": [
      "mouse_rusak"
    ],
    "proposedFootprint": [
      0.33,
      0.25
    ],
    "proposedPickupAnchor": [
      8,
      9
    ]
  },
  {
    "id": "remote_tv",
    "name": "Remote televisi rusak",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Remote televisi rusak",
    "sprites": [
      "remote_tv"
    ],
    "proposedFootprint": [
      0.47,
      0.27
    ],
    "proposedPickupAnchor": [
      14,
      10
    ]
  },
  {
    "id": "papan_sirkuit",
    "name": "Papan sirkuit bekas",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Papan sirkuit bekas",
    "sprites": [
      "papan_sirkuit"
    ],
    "proposedFootprint": [
      0.58,
      0.31
    ],
    "proposedPickupAnchor": [
      18,
      11
    ]
  },
  {
    "id": "steker_listrik",
    "name": "Kepala colokan listrik",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Kepala colokan listrik",
    "sprites": [
      "steker_listrik"
    ],
    "proposedFootprint": [
      0.38,
      0.27
    ],
    "proposedPickupAnchor": [
      11,
      10
    ]
  },
  {
    "id": "stopkontak_bekas",
    "name": "Stopkontak tiga lubang",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Stopkontak tiga lubang",
    "sprites": [
      "stopkontak_bekas"
    ],
    "proposedFootprint": [
      0.64,
      0.33
    ],
    "proposedPickupAnchor": [
      21,
      12
    ]
  },
  {
    "id": "kabel_usb",
    "name": "Kabel USB putus",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Kabel USB putus",
    "sprites": [
      "kabel_usb"
    ],
    "proposedFootprint": [
      0.48,
      0.31
    ],
    "proposedPickupAnchor": [
      12,
      13
    ]
  },
  {
    "id": "speaker_kecil",
    "name": "Speaker kecil rusak",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Speaker kecil rusak",
    "sprites": [
      "speaker_kecil"
    ],
    "proposedFootprint": [
      0.41,
      0.45
    ],
    "proposedPickupAnchor": [
      10,
      20
    ]
  },
  {
    "id": "adaptor_laptop",
    "name": "Adaptor laptop rusak",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Adaptor laptop rusak",
    "sprites": [
      "adaptor_laptop"
    ],
    "proposedFootprint": [
      0.55,
      0.33
    ],
    "proposedPickupAnchor": [
      17,
      10
    ]
  },
  {
    "id": "router_wifi",
    "name": "Router WiFi mati",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Router WiFi mati",
    "sprites": [
      "router_wifi"
    ],
    "proposedFootprint": [
      0.52,
      0.52
    ],
    "proposedPickupAnchor": [
      14,
      24
    ]
  },
  {
    "id": "baling_kipas",
    "name": "Baling kipas lepas",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Baling kipas lepas",
    "sprites": [
      "baling_kipas"
    ],
    "proposedFootprint": [
      0.64,
      0.33
    ],
    "proposedPickupAnchor": [
      21,
      11
    ]
  },
  {
    "id": "dinamo_kecil",
    "name": "Dinamo kecil bekas",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Dinamo kecil bekas",
    "sprites": [
      "dinamo_kecil"
    ],
    "proposedFootprint": [
      0.52,
      0.31
    ],
    "proposedPickupAnchor": [
      17,
      13
    ]
  },
  {
    "id": "kalkulator_mati",
    "name": "Kalkulator mati",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Kalkulator mati",
    "sprites": [
      "kalkulator_mati"
    ],
    "proposedFootprint": [
      0.47,
      0.3
    ],
    "proposedPickupAnchor": [
      14,
      10
    ]
  },
  {
    "id": "headphone_patah",
    "name": "Headphone patah",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Headphone patah",
    "sprites": [
      "headphone_patah"
    ],
    "proposedFootprint": [
      0.52,
      0.34
    ],
    "proposedPickupAnchor": [
      15,
      13
    ]
  },
  {
    "id": "dvd_bekas",
    "name": "DVD bekas",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "DVD bekas",
    "sprites": [
      "dvd_bekas"
    ],
    "proposedFootprint": [
      0.39,
      0.25
    ],
    "proposedPickupAnchor": [
      11,
      7
    ]
  },
  {
    "id": "fiting_lampu",
    "name": "Fiting lampu lepas",
    "status": "new_review_only",
    "reviewGroup": "elektronik",
    "rarity": "jarang",
    "catalogPrice": 8000,
    "spawnWeight": 4,
    "detail": "Fiting lampu lepas",
    "sprites": [
      "fiting_lampu"
    ],
    "proposedFootprint": [
      0.34,
      0.3
    ],
    "proposedPickupAnchor": [
      9,
      12
    ]
  },
  {
    "id": "panci_penyok",
    "name": "Panci aluminium penyok",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Panci aluminium penyok",
    "sprites": [
      "panci_penyok"
    ],
    "proposedFootprint": [
      0.55,
      0.38
    ],
    "proposedPickupAnchor": [
      16,
      14
    ]
  },
  {
    "id": "wajan_tua",
    "name": "Wajan tua",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Wajan tua",
    "sprites": [
      "wajan_tua"
    ],
    "proposedFootprint": [
      0.58,
      0.31
    ],
    "proposedPickupAnchor": [
      15,
      10
    ]
  },
  {
    "id": "tutup_panci",
    "name": "Tutup panci lepas",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Tutup panci lepas",
    "sprites": [
      "tutup_panci"
    ],
    "proposedFootprint": [
      0.5,
      0.27
    ],
    "proposedPickupAnchor": [
      14,
      8
    ]
  },
  {
    "id": "sendok_garpu",
    "name": "Sendok garpu bekas",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Sendok garpu bekas",
    "sprites": [
      "sendok_garpu"
    ],
    "proposedFootprint": [
      0.5,
      0.33
    ],
    "proposedPickupAnchor": [
      14,
      12
    ]
  },
  {
    "id": "parutan_dapur",
    "name": "Parutan dapur tumpul",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Parutan dapur tumpul",
    "sprites": [
      "parutan_dapur"
    ],
    "proposedFootprint": [
      0.56,
      0.33
    ],
    "proposedPickupAnchor": [
      18,
      12
    ]
  },
  {
    "id": "sodet_patah",
    "name": "Sodet patah",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Sodet patah",
    "sprites": [
      "sodet_patah"
    ],
    "proposedFootprint": [
      0.55,
      0.28
    ],
    "proposedPickupAnchor": [
      16,
      10
    ]
  },
  {
    "id": "cangkir_enamel",
    "name": "Cangkir enamel sumbing",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Cangkir enamel sumbing",
    "sprites": [
      "cangkir_enamel"
    ],
    "proposedFootprint": [
      0.34,
      0.3
    ],
    "proposedPickupAnchor": [
      8,
      12
    ]
  },
  {
    "id": "talenan_kayu",
    "name": "Talenan kayu usang",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Talenan kayu usang",
    "sprites": [
      "talenan_kayu"
    ],
    "proposedFootprint": [
      0.59,
      0.33
    ],
    "proposedPickupAnchor": [
      18,
      11
    ]
  },
  {
    "id": "termos_rusak",
    "name": "Termos rusak",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Termos rusak",
    "sprites": [
      "termos_rusak"
    ],
    "proposedFootprint": [
      0.33,
      0.48
    ],
    "proposedPickupAnchor": [
      7,
      24
    ]
  },
  {
    "id": "sapu_lidi",
    "name": "Sapu lidi pendek",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Sapu lidi pendek",
    "sprites": [
      "sapu_lidi"
    ],
    "proposedFootprint": [
      0.66,
      0.34
    ],
    "proposedPickupAnchor": [
      17,
      11
    ]
  },
  {
    "id": "sikat_pakaian",
    "name": "Sikat pakaian usang",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Sikat pakaian usang",
    "sprites": [
      "sikat_pakaian"
    ],
    "proposedFootprint": [
      0.41,
      0.28
    ],
    "proposedPickupAnchor": [
      12,
      11
    ]
  },
  {
    "id": "rak_sabun",
    "name": "Rak kawat sabun",
    "status": "new_review_only",
    "reviewGroup": "rumah_tangga",
    "rarity": "umum",
    "catalogPrice": 1200,
    "spawnWeight": 8,
    "detail": "Rak kawat sabun",
    "sprites": [
      "rak_sabun"
    ],
    "proposedFootprint": [
      0.47,
      0.33
    ],
    "proposedPickupAnchor": [
      14,
      12
    ]
  },
  {
    "id": "palu_bekas",
    "name": "Palu bekas",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Palu bekas",
    "sprites": [
      "palu_bekas"
    ],
    "proposedFootprint": [
      0.59,
      0.28
    ],
    "proposedPickupAnchor": [
      18,
      9
    ]
  },
  {
    "id": "tang_karat",
    "name": "Tang berkarat",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Tang berkarat",
    "sprites": [
      "tang_karat"
    ],
    "proposedFootprint": [
      0.59,
      0.34
    ],
    "proposedPickupAnchor": [
      20,
      13
    ]
  },
  {
    "id": "obeng_minus",
    "name": "Obeng minus bekas",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Obeng minus bekas",
    "sprites": [
      "obeng_minus"
    ],
    "proposedFootprint": [
      0.56,
      0.3
    ],
    "proposedPickupAnchor": [
      16,
      12
    ]
  },
  {
    "id": "kunci_pas",
    "name": "Kunci pas bekas",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Kunci pas bekas",
    "sprites": [
      "kunci_pas"
    ],
    "proposedFootprint": [
      0.53,
      0.28
    ],
    "proposedPickupAnchor": [
      15,
      9
    ]
  },
  {
    "id": "meteran_macet",
    "name": "Meteran gulung macet",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Meteran gulung macet",
    "sprites": [
      "meteran_macet"
    ],
    "proposedFootprint": [
      0.44,
      0.36
    ],
    "proposedPickupAnchor": [
      10,
      14
    ]
  },
  {
    "id": "kuas_cat",
    "name": "Kuas cat kering",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Kuas cat kering",
    "sprites": [
      "kuas_cat"
    ],
    "proposedFootprint": [
      0.52,
      0.3
    ],
    "proposedPickupAnchor": [
      14,
      10
    ]
  },
  {
    "id": "gergaji_tumpul",
    "name": "Gergaji tangan tumpul",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Gergaji tangan tumpul",
    "sprites": [
      "gergaji_tumpul"
    ],
    "proposedFootprint": [
      0.69,
      0.38
    ],
    "proposedPickupAnchor": [
      22,
      14
    ]
  },
  {
    "id": "gunting_patah",
    "name": "Gunting patah",
    "status": "new_review_only",
    "reviewGroup": "perkakas",
    "rarity": "umum",
    "catalogPrice": 1800,
    "spawnWeight": 8,
    "detail": "Gunting patah",
    "sprites": [
      "gunting_patah"
    ],
    "proposedFootprint": [
      0.55,
      0.28
    ],
    "proposedPickupAnchor": [
      17,
      9
    ]
  },
  {
    "id": "gasing_kayu",
    "name": "Gasing kayu usang",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Gasing kayu usang",
    "sprites": [
      "gasing_kayu"
    ],
    "proposedFootprint": [
      0.34,
      0.28
    ],
    "proposedPickupAnchor": [
      9,
      11
    ]
  },
  {
    "id": "bola_kempis",
    "name": "Bola karet kempis",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Bola karet kempis",
    "sprites": [
      "bola_kempis"
    ],
    "proposedFootprint": [
      0.39,
      0.25
    ],
    "proposedPickupAnchor": [
      11,
      7
    ]
  },
  {
    "id": "yoyo_tanpa_tali",
    "name": "Yoyo tanpa tali",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Yoyo tanpa tali",
    "sprites": [
      "yoyo_tanpa_tali"
    ],
    "proposedFootprint": [
      0.34,
      0.27
    ],
    "proposedPickupAnchor": [
      9,
      10
    ]
  },
  {
    "id": "robot_mainan",
    "name": "Robot mainan satu lengan",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Robot mainan satu lengan",
    "sprites": [
      "robot_mainan"
    ],
    "proposedFootprint": [
      0.41,
      0.45
    ],
    "proposedPickupAnchor": [
      10,
      22
    ]
  },
  {
    "id": "balok_kayu",
    "name": "Balok alfabet kayu",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Balok alfabet kayu",
    "sprites": [
      "balok_kayu"
    ],
    "proposedFootprint": [
      0.34,
      0.31
    ],
    "proposedPickupAnchor": [
      8,
      13
    ]
  },
  {
    "id": "peluit_mainan",
    "name": "Peluit mainan rusak",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Peluit mainan rusak",
    "sprites": [
      "peluit_mainan"
    ],
    "proposedFootprint": [
      0.34,
      0.25
    ],
    "proposedPickupAnchor": [
      9,
      8
    ]
  },
  {
    "id": "kelereng_kantong",
    "name": "Kelereng dalam kantong jala",
    "status": "new_review_only",
    "reviewGroup": "mainan",
    "rarity": "jarang",
    "catalogPrice": 6000,
    "spawnWeight": 4,
    "detail": "Kelereng dalam kantong jala",
    "sprites": [
      "kelereng_kantong"
    ],
    "proposedFootprint": [
      0.39,
      0.3
    ],
    "proposedPickupAnchor": [
      11,
      12
    ]
  },
  {
    "id": "lensa_kamera",
    "name": "Lensa kamera lepas",
    "status": "new_review_only",
    "reviewGroup": "salvage_khusus",
    "rarity": "langka",
    "catalogPrice": 35000,
    "spawnWeight": 2,
    "detail": "Lensa kamera lepas",
    "sprites": [
      "lensa_kamera"
    ],
    "proposedFootprint": [
      0.36,
      0.34
    ],
    "proposedPickupAnchor": [
      9,
      15
    ]
  },
  {
    "id": "kompas_saku",
    "name": "Kompas saku rusak",
    "status": "new_review_only",
    "reviewGroup": "salvage_khusus",
    "rarity": "langka",
    "catalogPrice": 35000,
    "spawnWeight": 2,
    "detail": "Kompas saku rusak",
    "sprites": [
      "kompas_saku"
    ],
    "proposedFootprint": [
      0.39,
      0.25
    ],
    "proposedPickupAnchor": [
      11,
      8
    ]
  },
  {
    "id": "teropong_kecil",
    "name": "Teropong kecil rusak",
    "status": "new_review_only",
    "reviewGroup": "salvage_khusus",
    "rarity": "langka",
    "catalogPrice": 35000,
    "spawnWeight": 2,
    "detail": "Teropong kecil rusak",
    "sprites": [
      "teropong_kecil"
    ],
    "proposedFootprint": [
      0.55,
      0.38
    ],
    "proposedPickupAnchor": [
      16,
      15
    ]
  },
  {
    "id": "medali_kuningan",
    "name": "Medali kuningan bekas",
    "status": "new_review_only",
    "reviewGroup": "salvage_khusus",
    "rarity": "langka",
    "catalogPrice": 35000,
    "spawnWeight": 2,
    "detail": "Medali kuningan bekas",
    "sprites": [
      "medali_kuningan"
    ],
    "proposedFootprint": [
      0.36,
      0.27
    ],
    "proposedPickupAnchor": [
      9,
      8
    ]
  },
  {
    "id": "harmonika_tua",
    "name": "Harmonika tua",
    "status": "new_review_only",
    "reviewGroup": "salvage_khusus",
    "rarity": "langka",
    "catalogPrice": 35000,
    "spawnWeight": 2,
    "detail": "Harmonika tua",
    "sprites": [
      "harmonika_tua"
    ],
    "proposedFootprint": [
      0.5,
      0.27
    ],
    "proposedPickupAnchor": [
      14,
      10
    ]
  }
];
function image(specOrId){
  if(specOrId && typeof specOrId === 'object'){
    return specOrId.url || ('./legacy-assets/loak-v2/' + (specOrId.relativeFile||''));
  }
  const hit = entries.find(e => e.id===specOrId || e.legacyId===specOrId || e.file===specOrId);
  return hit ? hit.url : '';
}
function icon(specOrId){
  const hit = typeof specOrId==='object' ? specOrId : entries.find(e => e.id===specOrId || e.legacyId===specOrId);
  return hit ? (hit.iconUrl || '') : '';
}
function typeOf(id){return types.find(t => t.id===id) || null;}
function spriteOf(id){return entries.find(e => e.id===id || e.legacyId===id) || null;}
const prev = root.VLAssetCatalog || [];
if(!root.__vlLoakV2Merged){
  const filtered = prev.filter(e => !(e && e.source==='legacy-local' && e.category==='items'));
  root.VLAssetCatalog = Object.freeze([].concat(filtered, entries));
  root.__vlLoakV2Merged = true;
}
root.VLLoakV2 = Object.freeze({
  entries, types, image, icon, typeOf, spriteOf,
  count: entries.length,
  typeCount: types.length,
  preserved: types.filter(t=>t.status==='preserved_original').length,
  added: types.filter(t=>t.status==='new_review_only').length
});
})(typeof window!=='undefined'?window:this);

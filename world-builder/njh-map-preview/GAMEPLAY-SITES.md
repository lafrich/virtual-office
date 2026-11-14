# NJH gameplay sites (preview/njh-gameplay-sites)

Preview only, not live, not pushed. Based on `preview/njh-map-draft1` at `ffc76e6`. Function first, aesthetics later (Ichsan t26u/t27u via Layar).

Semesta Life Play matches sites with `name(o) = name + label + asset + subtype + questId + tags`. Every required site below resolves to a real object (no fallback pin).

## Site resolution

| Site | play.js id | Object id | Name | Position (x, z) | Asset | Door id | Interior | Placeholder? |
|---|---|---|---|---|---|---|---|---|
| Mancing | `fish` | `njh-dermaga-mancing-anchor` | PENDING Dermaga mancing | -51.5, 44.0 | `marker` | `—` | `—` | no |
| Bang Siomay / Batagor | `siomay_batagor` | `njh-lapak-siomay-batagor` | Lapak Siomay Batagor | -22.5, 37.5 | `pipeline:lapak_tas` | `—` | `—` | stand-in / see notes |
| Pasar Ikan | `pasar_ikan` | `jakarta-v3-4942` | Pasar Ikan (lapak ikan basah) | -20.5, 29.9 | `pipeline:id200_pasar_lapak_ikan_basah` | `—` | `—` | no |
| Manusia Silver | `job_silver` | `ref-ambient-9` | Manusia Silver | -13.5, 40.5 | `quest_npc` | `—` | `—` | no |
| Pak Ogah | `job_pak_ogah` | `njh-npc-pak-ogah` | Pak Ogah | -29.5, 41.5 | `quest_npc` | `—` | `—` | no |
| Kang Parkir | `job_kang_parkir` | `ref-ambient-11` | Kang Parkir | -16.5, 40.5 | `quest_npc` | `—` | `—` | no |
| Warung Kopi | `coffee` | `ref-west-center-a` | Warung Kopi Pojok Gang | -38.5, 49.5 | `pipeline:warung_madura` | `njh_door_warung_kopi` | `njh_warung_kopi` | no |
| WC Umum | `public_wc` | `njh-wc-umum` | WC Umum / Mandi Umum | -43.0, 69.15 | `pipeline:id200_publik_toilet_umum_kampung` | `njh_door_wc_umum` | `njh_wc_mandi_umum` | no |
| Mandi Umum | `public_bath` | `njh-wc-umum` | WC Umum / Mandi Umum | -43.0, 69.15 | `pipeline:id200_publik_toilet_umum_kampung` | `njh_door_wc_umum` | `njh_wc_mandi_umum` | no |
| Kost | `kost` | `njh-kos-noor` | Kost Noor | -26.25, 68.7 | `pipeline:id200_bangunan_rumah_kos_dua_lantai` | `njh_door_home_noor` | `njh_kos` | no |
| Tenda Hobo | `tent` | `njh-tenda-hobo` | Tenda Hobo | -51.5, 63.5 | `pipeline:id200_pasar_tenda_biru_pasar` | `—` | `—` | stand-in / see notes |
| Hansip | `hansip` | `ref-north-row-a` | Pos Hansip Kali | -49.0, 40.0 | `pipeline:pos_ronda` | `—` | `—` | no |
| Mulung (first of 19) | `scavenge` | `njh-lapak-bekas` | Lapak Barang Bekas | -23.0, 24.25 | `pipeline:lapak_barang_bekas` | `—` | `—` | no |

Kost, WC/mandi umum, and Warung Kopi were already enterable on draft1. Door ids are unchanged. The kost interior is `njh_kos` (Baymax's existing kost template). WC/mandi share `njh_wc_mandi_umum` and the same building (`njh-wc-umum`).

## Name and tag fixes on existing objects

- `njh-kos-noor`: Kos Noor → **Kost Noor** (also already matched via asset `kos_`).
- `njh-wc-umum`: WC / Mandi Umum → **WC Umum / Mandi Umum** so both `wc.umum` and `mandi.umum` match the visible name.
- `jakarta-v3-4942`: Lapak ikan basah → **Pasar Ikan (lapak ikan basah)**. Same `pipeline:id200_pasar_lapak_ikan_basah` art.
- `ref-north-row-a`: Pos Ronda Kali → **Pos Hansip Kali**. Same `pipeline:pos_ronda` art.
- `ref-north-row-b` (Warung Madura): removed the `cafe` tag, which was stealing the coffee site from Warung Kopi Pojok Gang.

## New objects

- **Tenda Hobo** (`njh-tenda-hobo`) at -51.5, 63.5, on the Kali-bank sidewalk. Inserted first in `objects` so `/tenda/` resolves here, not to pasar/food tents. Art is a stand-in: existing `pipeline:id200_pasar_tenda_biru_pasar`. Collision is off so the inspection path stays clear. No dedicated hobo-tent sprite was in the runtime catalog.
- **Lapak Siomay Batagor** (`njh-lapak-siomay-batagor`) at -22.5, 37.5, on the pasar plaza between the pecel and sate tents. No siomay/batagor asset exists; this reuses `pipeline:lapak_tas` as a clearly named stand-in. Collision on; south tile (-22.5, 38.5) is free and is not a door tile.
- **Pak Ogah** (`njh-npc-pak-ogah`) quest NPC at -29.5, 41.5, on the sidewalk south of Tiang Pak Ogah (not on the road). Interaction side is north (`-29.5, 40.5`). Manusia Silver and Kang Parkir were already on draft1.
- **16 new mulung points** plus the 3 that were already on the map (2 tong + lapak barang bekas near the loak / plaza) = **19** scavenge matches, spread across gang utara, gang selatan, gang timur, Kali bank, and pasar edges. Only the 2 original loak-adjacent points remain within 8 tiles of Toko Loak.

## Scavenge points

| Object id | Name | Position (x, z) | Asset | New? |
|---|---|---|---|---|
| `njh-lapak-bekas` | Lapak Barang Bekas | -23.0, 24.25 | `pipeline:lapak_barang_bekas` | no |
| `jakarta-v3-22020` | Tong Sampah Jakarta · Jakarta | -24.000000000000007, 22.8 | `pipeline:tong_sampah` | no |
| `sprite-zhf6zq` | Tong Sampah Jakarta | -22.6, 40.5 | `pipeline:tong_sampah` | no |
| `njh-scavenge-tong-nw-1` | Tong Sampah Gang Utara | -47.5, 25.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-nw-1` | Botol bekas Gang Utara | -41.5, 25.5 | `loak-v2/ground/botol_plastik_bening.png` | yes |
| `njh-scavenge-kardus-nw-1` | Kardus bekas Gang Utara | -37.5, 25.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-sw-1` | Tong Sampah Gang Selatan | -47.5, 51.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-sw-1` | Botol bekas dekat Warung Kopi | -41.5, 51.5 | `loak-v2/ground/botol_plastik_hijau.png` | yes |
| `njh-scavenge-kardus-sw-1` | Kardus bekas Gang Selatan | -36.5, 51.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-sw-2` | Tong Sampah Gang Selatan 2 | -47.5, 63.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-sw-2` | Botol bekas dekat Tenda Hobo | -45.5, 63.5 | `loak-v2/ground/botol_plastik_bening.png` | yes |
| `njh-scavenge-kardus-sw-2` | Kardus bekas Gang Selatan 2 | -37.5, 63.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-se-1` | Tong Sampah Gang Timur | -24.5, 64.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-se-1` | Botol bekas Gang Timur | -18.5, 64.5 | `loak-v2/ground/botol_plastik_hijau.png` | yes |
| `njh-scavenge-kardus-se-1` | Kardus bekas dekat Kost | -13.5, 64.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-botol-pasar-1` | Botol bekas tepi pasar | -13.5, 22.5 | `loak-v2/ground/botol_plastik_bening.png` | yes |
| `njh-scavenge-kardus-pasar-1` | Kardus bekas tepi plaza | -29.5, 36.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-kali-1` | Tong Sampah tepi Kali utara | -51.5, 28.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-kali-1` | Botol bekas tepi Kali selatan | -51.5, 56.5 | `loak-v2/ground/botol_plastik_hijau.png` | yes |

Botol and kardus use existing Loak v2 ground sprites (`loak-v2/ground/botol_plastik_*.png`, `kardus_lipat.png`). Tong uses `pipeline:tong_sampah`. All new scavenge props have collision off.

## Skipped (not in this pass)

Rumah ibadah extras were already partially present (mushola) but no new gereja/pura/vihara/klenteng were added. Kotak sedekah, relawan, kursus, and kantor premium were skipped as requested. Those sites will still fall back in play.js.

Fishing still resolves first to the existing `PENDING Dermaga mancing` anchor at the same coordinates as the real dermaga sprite. That is not a fallback.

## QA

Every required site resolves by play.js name pattern. No new object sits on a road, water tile, or door use tile. Each new object has at least one free sidewalk/plaza neighbor for interaction. Overview: `renders/njh-gameplay-sites-overview.png`.

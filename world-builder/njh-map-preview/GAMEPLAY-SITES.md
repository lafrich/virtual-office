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
| Kost | `kost` | `njh-kos-noor` | Kost Cove (Ichsan & Noor) | -26.25, 68.7 | `object:njh_kost_cove` | `njh_door_kos_cove_lobby` | `njh_kos_cove_lobby` | no (simple LFB Cove facade; footprint matches the old dua-lantai lot — see KOST-ROOMS.md) |
| Tenda Hobo | `tent` | `njh-tenda-hobo` | Tenda Hobo | -51.5, 63.5 | `pipeline:id200_pasar_tenda_biru_pasar` | `—` | `—` | stand-in / see notes |
| Hansip | `hansip` | `ref-north-row-a` | Pos Hansip Kali | -49.0, 40.0 | `pipeline:pos_ronda` | `—` | `—` | no |
| Mulung (first of 19) | `scavenge` | `njh-lapak-bekas` | Lapak Barang Bekas | -23.0, 24.25 | `pipeline:lapak_barang_bekas` | `—` | `—` | no |

Kost, WC/mandi umum, and Warung Kopi were already enterable on draft1. The kost street door is now `njh_door_kos_cove_lobby` → lobby `njh_kos_cove_lobby`; room doors `njh_door_home_ichsan` / `njh_door_home_noor` sit inside that lobby (see `KOST-ROOMS.md`). WC/mandi share `njh_wc_mandi_umum` and the same building (`njh-wc-umum`).

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
| `njh-scavenge-botol-sw-1` | Botol bekas Gang Selatan | -41.5, 51.5 | `loak-v2/ground/botol_plastik_hijau.png` | yes |
| `njh-scavenge-kardus-sw-1` | Kardus bekas Gang Selatan | -36.5, 51.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-sw-2` | Tong Sampah Gang Selatan 2 | -47.5, 63.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-sw-2` | Botol bekas Gang Selatan 2 | -45.5, 63.5 | `loak-v2/ground/botol_plastik_bening.png` | yes |
| `njh-scavenge-kardus-sw-2` | Kardus bekas Gang Selatan 2 | -37.5, 63.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-se-1` | Tong Sampah Gang Timur | -24.5, 64.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-se-1` | Botol bekas Gang Timur | -18.5, 64.5 | `loak-v2/ground/botol_plastik_hijau.png` | yes |
| `njh-scavenge-kardus-se-1` | Kardus bekas Gang Timur | -13.5, 64.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-botol-pasar-1` | Botol bekas tepi pasar | -13.5, 22.5 | `loak-v2/ground/botol_plastik_bening.png` | yes |
| `njh-scavenge-kardus-pasar-1` | Kardus bekas tepi plaza | -29.5, 36.5 | `loak-v2/ground/kardus_lipat.png` | yes |
| `njh-scavenge-tong-kali-1` | Tong Sampah tepi Kali utara | -51.5, 28.5 | `pipeline:tong_sampah` | yes |
| `njh-scavenge-botol-kali-1` | Botol bekas tepi Kali selatan | -51.5, 56.5 | `loak-v2/ground/botol_plastik_hijau.png` | yes |

Botol and kardus use existing Loak v2 ground sprites (`loak-v2/ground/botol_plastik_*.png`, `kardus_lipat.png`). Tong uses `pipeline:tong_sampah`. All new scavenge props have collision off.

## Already present (not added in the gameplay-sites pass)

- **Kotak sedekah / charity** is not a fallback: `/kotak.?amal/` already hits `njh-kotak-amal-anchor` (`PENDING Kotak amal`) at the same coordinates as the real `njh-kotak-amal` sprite.
- Mushola was already on draft1 (`prayer_islam_a`).
- Fishing still resolves first to the existing `PENDING Dermaga mancing` anchor at the same coordinates as the real dermaga sprite. That is not a fallback.
- Warung makan now resolves to **Warteg (warung makan)** (`jakarta-v3-18446`), not Warung Madura. The warteg object was moved earlier in `objects`. The coffee-site fix (no `cafe` tag on Warung Madura) is unchanged.

## Skipped (still fallback)

No new gereja / pura / vihara / klenteng, relawan, kursus, or kantor premium were added. Those sites still fall back in play.js.

## Warung kopi interior

The r6 scene `njh_warung_kopi.interior-scene.json` is wired on `njh_door_warung_kopi` (copied from `/workspace/njh-interior-templates-r6/scenes/`). Preview only. This layout does **not** yet meet the mandatory Kharisma interior standard (Drive Guides, `NJH-INTERIOR-LAYOUT-STANDARD-KHARISMA.md`); a revision is planned.

## Name-pattern cleanup

- Dropped the `streetscape` tag on `jakarta-v3-22020` (Tong Sampah Jakarta). The substring `tree` inside `streetscape` was making play.js treat the bin as a fruit tree.
- Renamed `Rak sandal masjid` → `Rak sandal`. The visible name no longer matches a prayer site, but the pipeline asset id `id200_budaya_rak_sandal_masjid` still contains `masjid`, and play.js `name()` includes `asset`/`subtype`. So `prayer_islam_b` still resolves to this rack (`matches[1]`). A full fix needs an asset alias or a play.js change. `prayer_islam_c` still falls back (only two masjid/mushola matches).
- Scavenge labels use area names only (no Warung Kopi / Kost / Tenda Hobo), so they cannot become false enterables for those sites.

## QA

Every required site resolves by play.js name pattern. No new object sits on a road, water tile, or door use tile. Each new object has at least one free sidewalk/plaza neighbor for interaction. Overview: `renders/njh-gameplay-sites-overview.png`.

## Step 2 — Minimarket (`preview/njh-step2-minimarket`)

Preview only, not live, not pushed. Branch taken from frozen `preview/njh-gameplay-sites` at `8e099eb`. Gerak's NJH Mart is registered and placed; the interior scene is **not** vendored (Gerak is still fixing it). Site id is `minimarket` (Layar NJH-SPEC-MASAK; replaces `supermarket`). Frozen `semesta-life-play.js` has no minimarket matcher yet — do not edit play.js on this branch. Name / subtype / tags are `NJH Mart (Minimarket)` / `minimarket` / `minimarket, shop` so they do not hijack existing play.js site patterns.

| Site | play.js id | Object id | Name | Position (x, z) | Asset | Door id | Interior | Placeholder? |
|---|---|---|---|---|---|---|---|---|
| Minimarket | `minimarket` (not wired in frozen play.js yet) | `njh-minimarket` | NJH Mart (Minimarket) | -26.5, 56.0 | `object:njh_minimarket` | `njh_door_minimarket` | `njh_minimarket` (pending) | exterior placed; interior pending |

Lot: 5×4 grass at tiles c=−29..−25, r=54..57, east of the main N–S road (sidewalk c=−30 left clear). Rotation 0 / sw, door on the +z edge, use tile (−27, 58) / use point (−26.5, 58.5) on the E–W gang sidewalk that meets that main road. About 15 tiles south of Kost Cove (same x) and about 28 tiles from the dock via the main roads. Billboard width/height use the LFB PX/PY lock (6.894 × 8.012), not size/50. Street furniture `njh-atm-15` (pole, to −22.0, 58.5), `njh-atm-16` (Bangku Taman, to −22.5, 55.9, sit tile still free), and `njh-atm-17` (papan, to −21.2, 54.5) was nudged off the lot. In-map close-up: `renders/njh-minimarket-placement-closeup.png`.

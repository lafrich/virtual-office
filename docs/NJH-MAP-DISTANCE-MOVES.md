# NJH map distance moves (slice 'Hobo → Punya Kos')

Branch `preview/njh-map-distance` (preview only, not main, not deployed). Based on `preview/njh-map-densify` `a804890a`, with `preview/njh-balancing-20261122` `c2533a04` merged in (semantic JSON merge: balancing's sajadah/siomay-cart swap, sedan id, tong sizes and NPC r=41.5 applied; densify's own tree positions kept where both branches moved the same 5 trees).

Rule: every core-point pair ≤ **30 tiles**, straight-line (`map.maxCoreDistanceTiles`, `content/balancing.json`). Points and metric are exactly the brief's (`docs/NJH-MAP-DISTANCE-BRIEF.md`), plus Manusia Silver. "Mandi umum" is the same building and door as WC (`njh_door_wc_umum`, "WC / Mandi Umum").

Check: `node tools/njh-map-distance-check.cjs` (full matrix, exit 1 if any pair > limit). Test: `tests/njh-map-distance.test.cjs`.

## Result

| | max pair | pairs > 30 |
|---|---|---|
| brief source (balancing meta, 11 points) | wc–loak 48.2 | 25 (matches the brief) |
| before (densify + balancing merge, 12 points) | wc–loak 48.2 | 30 |
| after (12 points) | spot_mancing–pasar_ikan 29.67 | 0 |

Tightest after: spot_mancing–pasar_ikan 29.67, tenda–pasar_ikan 29.07, parkir–spot_mancing 28.16, dermaga–pasar_ikan 27.88.

## Moves

Big buildings are only swapped with a same-width house in the target block (grid-aligned, front on the same street edge, door facing the street, never on sidewalk/road). Nothing was deleted.

| item | from | to | why |
|---|---|---|---|
| Toko Loak `njh-toko-loak` + door `njh_door_loak` | (−27, 23.75), use (−27, 26) | (−42, 55.25), use (−42, 57.5) | swap with Rumah warga 13 (both 4 wide); was 45.5 from Kost, 48.2 from WC |
| Rumah warga 13 `njh-sw2-h3` | (−42, 55.4) | (−27, 23.9) | swap partner, takes the old Loak lot |
| Warteg `jakarta-v3-18446` + door `njh_door_warung_makan` | (−39.5, 39.5), use (−39.5, 41.5) | (−38.5, 55.5), use (−38.5, 57.5) | swap with Rumah warga 14 (both 3 wide); was 32.8 from Kost, 30.2 from WC |
| Rumah warga 14 `njh-sw2-h4` | (−38.5, 55.4) | (−39.5, 39.4) | swap partner, takes the old Warteg lot |
| Pasar Ikan stall `jakarta-v3-4942` (`njh_pasar_ikan`, `njh_pasar_1_3`) | (−20.5, 29.9), use (−20.5, 31.0) | (−22.5, 56.6), use (−22.5, 57.7) | lapangan beside NJH Mart; was 47.2 from the fishing spot. Pasar row 1 keeps an empty slot |
| WC / Mandi Umum `njh-wc-umum` + door | (−43, 69.15), use (−43, 71.5) | (−42, 69.15), use (−42, 71.5) | 1 tile east inside its own block, frees a 2-wide cart slot |
| Siomay cart `njh-lapak-siomay-batagor` | (−22.5, 37.5), use (−22.5, 38.5) | (−45, 70.5), use (−45, 71.5) | between Bengkel and WC, front on the r=71 sidewalk; was 40.3 from the fishing spot |
| Dermaga `njh-dermaga-mancing` + anchor | (−51.5, 44), use (−50.375, 44) | (−51.5, 58), use (−50.375, 58) | same Kali bank (c=−52 sidewalk, river c=−53), Gang Selatan mouth; was 36.6 from Kost |
| Pak Ogah `njh-npc-pak-ogah` + Tiang Ogah | NPC (−29.5, 41.5), work (−29.5, 40.5) | NPC (−35.5, 47.5), work (−36.5, 47.5); tiang (−35.5, 48.5) | same simpang, SW corner by zebra barat; was 33.8 from WC |
| Manusia Silver `ref-ambient-9` + lapak | NPC (−13.5, 41.5), talk (−12.5, 41.5) | NPC (−35.5, 50.5), talk (−36.5, 50.5); lapak (−35.5, 49.5) | next to Pak Ogah; was 46.0 from the fishing spot |
| Kang Parkir `ref-ambient-11` | NPC (−16.5, 41.5), talk (−15.5, 41.5) | NPC (−24.5, 59.5), talk (−23.5, 59.5) | NJH Mart forecourt; was 43.6 from the fishing spot |

Knock-on (non-core) moves: Bangku Taman `njh-atm-16` (−22.5, 55.9) → (−22.5, 37.5), the old siomay slot in the food-tent row; Tiang kabel listrik `njh-atm-15` (−22, 58.5) → (−20.5, 59.5); scavenge bottle `njh-scavenge-botol-kali-1` (−51, 56.5) → (−51, 55.5); sajadah `njh-penanda-doa` (−11.5, 23.5) → (−12, 23.5), because the balancing swap made it 2×1 and it sat on the c=−11 drain (use point unchanged).

Unchanged core points: Tenda (−50.5, 65.5), spot mancing (−50.5, 67.5), Kost (−26.25, 71.5).

Meta kept in sync: door `doorPoint`/`useTile`/`usePoint`/`footprintRect`, interactable `usePoint`s (Pak Ogah, Tiang and lapak silver use sides are now `west`, toward the c=−37 pedestrian loop), dermaga `waterSideTiles`, `pendingAssets.minCorner`, anchor markers, `gameplaySites.fishing_spot` (unchanged). Door ids, interior templates and locations are unchanged.

## Checks

- `node tests/njh-map-layout-check.cjs`: R1–R7 all 0.
- `check_trees.py`: 0 FAIL. `check_water_axis.py`: 0 FAIL, 0 WARN.
- `node --test tests/*.test.cjs`: 616 pass, 0 fail, 2 skipped.
- Tests updated for the moves: `njh-map-preview` (dock cells, bench/pole), `njh-sync-decisions` (siomay use point; the NPC/tree test now asserts via the layout checker), `world-builder-v2` (object count 152 → 208; densify r1 had already added 56 objects and left this test failing).

# NJH map distance v2 (data-only)

Branch `preview/njh-map-distance-v2`, based on live `origin/main` 30135b6d. It replaces `preview/njh-map-distance` (5bac93b), which New Bot approved but which conflicts with live main and with balancing r3.

It is a data-only change. It touches the city JSON, `njh-map-meta.json`, `tools/njh-map-distance-check.cjs`, `tests/njh-map-distance.test.cjs`, three existing tests (expectations only) and these docs. It does **not** touch `sw.js`, `index.html` or any engine code, and it adds no densify trees or props.

Rule: `map.maxCoreDistanceTiles` = 30 Euclidean tiles. The value is read from `content/balancing.json` when present. Balancing r3 and the live branch hold value 30. Live main has no such file yet, so the checker falls back to 30. The balancing branches touch only `docs/NJH-MAP-DISTANCE-BRIEF.*`, which this branch does not add, so no files overlap.

## Result

| | max pair | pairs > 30 (12 points) | pairs > 30 (11 brief points) |
|---|---|---|---|
| live main | wc-loak 48.23 | 30 | 25 |
| v2 | tenda-pasar_ikan 29.79 | 0 | 0 |

Run `node tools/njh-map-distance-check.cjs` (`--json`, `--brief-only`). It exits 1 if any pair is over the limit.

## Moves (positions re-derived on live data; ids are live)

| id | name | from (x, z) | to (x, z) | why |
|---|---|---|---|---|
| `njh-toko-loak` | Toko Loak | (-27, 23.75) | (-42, 55.25) | swap with Rumah warga 13: Loak joins the Gang Selatan row (was 45.5 from Kost, 48.2 from WC) |
| `njh-sw2-h3` | Rumah warga 13 | (-42, 55.4) | (-27, 23.9) | swap partner of Toko Loak (house takes the old Loak lot, front on the pasar plaza edge) |
| `jakarta-v3-18446` | Warteg (warung makan) | (-39.5, 39.5) | (-38.5, 55.5) | swap with Rumah warga 14: Warteg moves next to Loak on Gang Selatan (was 32.8 from Kost) |
| `njh-sw2-h4` | Rumah warga 14 | (-38.5, 55.4) | (-39.5, 39.4) | swap partner of Warteg (house takes the old Warteg lot on Jl. Kebon Sirih) |
| `jakarta-v3-4942` | Pasar Ikan (lapak ikan basah) | (-20.5, 29.9) | (-22.5, 56.6) | Pasar Ikan stall to the lapangan beside NJH Mart (was 47.2 from the fishing spot) |
| `njh-atm-16` | Bangku Taman | (-22.5, 55.9) | (-16.5, 55.9) | Bangku Taman gives its spot to the Pasar Ikan stall; same lapangan, east side by Pos Ronda |
| `njh-atm-15` | Tiang kabel listrik | (-22, 58.5) | (-20.5, 59.5) | Tiang kabel listrik 1.5 east / 1 south on the same forecourt sidewalk so the Pasar Ikan use tiles stay clear |
| `njh-lapak-siomay-batagor` | Lapak Siomay Batagor | (-22.5, 37.5) | (-40, 65.5) | siomay cart to the Gang Selatan 2 garden, serving the r=64 gang (was 40.3 from the fishing spot; old slot overlapped both food tents) |
| `njh-dermaga-mancing` | Dermaga mancing | (-51.5, 44) | (-51.5, 66) | dock moved south along the Kali bank next to Tenda Hobo / fishing spot; in front of it is only Bengkel (fades) and low jemuran, so it is not hidden by house roofs (was 36.6 from Kost) |
| `njh-dermaga-mancing-anchor` | PENDING Dermaga mancing | (-51.5, 44) | (-51.5, 66) | anchor follows the dock (legacy play.js fish site) |
| `njh-npc-pak-ogah` | Pak Ogah | (-29.5, 41.5) | (-35.5, 47.5) | Pak Ogah keeps his simpang but works its SW corner by zebra barat (was 33.8 from WC) |
| `njh-tiang-ogah` | Tiang Pak Ogah | (-28.5, 40.5) | (-35.5, 48.5) | flag post follows Pak Ogah |
| `njh-tiang-ogah-anchor` | PENDING Tiang Pak Ogah | (-28.5, 40.5) | (-35.5, 48.5) | anchor follows the post |
| `ref-ambient-9` | Manusia Silver | (-13.5, 41.5) | (-35.5, 50.5) | Manusia Silver to the simpang SW corner sidewalk next to Pak Ogah (was 46.0 from the fishing spot) |
| `njh-lapak-silver` | Lapak Manusia Silver | (-27.5, 39.5) | (-35.5, 49.5) | Silver stand follows Manusia Silver |
| `njh-lapak-silver-anchor` | PENDING Lapak Manusia Silver | (-27.5, 39.5) | (-35.5, 49.5) | anchor follows the stand |
| `ref-ambient-11` | Kang Parkir | (-16.5, 41.5) | (-28.5, 58.5) | Kang Parkir to the NJH Mart forecourt, west end (was 43.6 from the fishing spot; the v1 spot 4 tiles east put his label on Ibu Pasar Ikan and his work point 1 tile from the stall) |
| `njh-warteg-makan-anchor` | Warteg - Makan di tempat (titik aksi) | new | (-36.5, 53.0) | fix a: new invisible marker; the outdoor Makan Warteg site no longer derives from the building centre (it landed 1 tile in front of the door) |

Meta stays in sync:
- **Loak:** door `njh_door_loak` → doorPoint (-42,57), use (-42,57.5).
- **Warteg:** door `njh_door_warung_makan` → doorPoint (-38.5,57), use (-38.5,57.5).
- **Pasar Ikan:** `njh_pasar_ikan` use (-22.5,57.7); `njh_pasar_1_3` use (-22.5,58.0).
- **Siomay:** use (-40,64.5), rot 180, facing ne.
- **Dermaga:** use (-50.375,66), waterSideTiles (-53,65)/(-53,66), pending minCorner (-52,65).
- **Pak Ogah, tiang and silver:** uses on the west sidewalk (-36.5, 47.5–50.5).
- **Kang Parkir:** use (-28.5,59.5).

The Warteg door id is the live meta id, `njh_door_warung_makan`; its objectId is `jakarta-v3-18446`. The engine enters room `njh_warteg_kharisma`. The checker finds the door under any of `njh_warteg_kharisma`, `njh_door_warteg_kharisma` or `njh_door_warung_makan`.

Not carried over from v1:
- The WC shift, botol and sajadah nudges are not needed on live.
- The v1 siomay spot (-45,70.5) is blocked on live by tree 22589, so the siomay went to the garden instead.
- The v1 bench target hits the food tents on live, so the bench went to (-16.5,55.9).

## Fixes

**a) Makan Warteg vs door.** The outdoor "warung" life site came from findLanding on the Warteg building centre. It landed 1 tile in front of the door, so E picked Makan (Rp12.000) instead of Masuk.
- A new invisible marker `njh-warteg-makan-anchor` at (-36.5,53) is now the first /warteg/ object, so the eat site is built from it.
- The eat site is 4.92 tiles from the door use (-38.5,57.5). The gap needed is more than ENTER_RADIUS 2.2 + site RANGE 2.5 = 4.7, so the radii do not overlap. The marker is also outside every other door's 2.2 radius.
- Browser QA: E at the door entered `njh_warteg_kharisma`, and the eat point shows the Makan action.
- Markers are invisible in play and are never picked as the Warteg building (findBuilding takes sprites only).

**b) Kang Parkir label vs Ibu Pasar Ikan.** Kang Parkir is now at the west end of the Mart forecourt: NPC (-28.5,58.5), use (-28.5,59.5). That is 6.3 from the Pasar Ikan use, and the labels no longer overlap in game. Tested distances stay ≤ 30.

**c) Dermaga hidden by roofs.** The dock moved south along the same bank to r=66, between Tenda Hobo and the fishing spot.
- Seen from the fixed camera, the objects in front of it are now Bengkel (big building, fades) and tree 22589 (fades). The dock is no longer behind ordinary 3×3.2 houses, which never fade. The player at the dock is visible.
- Limit: when the player is elsewhere, Bengkel and the tree still cover part of the deck. Making it visible from every camera position needs an engine change (fading small houses) or removing the tree, which the densify package handles.

## Checks (vs live baseline; live already fails some, fixed by the separate densify package)

- `tests/njh-map-layout-check.cjs` (local copy from densify): resolves 4 issues (tents×2 vs siomay, Loak vs tree 22249, Kang Parkir vs tree 22819). One pre-existing overlap changes partner: Rumah warga 13 on the old Loak lot vs tree 22249, a densify tree.
- `check_trees.py`: 13 → 12 FAIL; no new FAIL.
- `check_water_axis.py`: 4 FAIL, unchanged (pre-existing).
- `node --test tests/*.test.cjs`: 607 pass, 0 fail, 2 skipped (live baseline: 601 pass, 0 fail).

Test expectations updated for the new positions (data only):
- `tests/njh-map-preview.test.cjs`: dock bank tiles r=65/66 and placed.z 66; bench (-16.5,55.9) with sit (-16.5,56.9); pole (-20.5,59.5).
- `tests/njh-sync-decisions.test.cjs`: siomay usePoint (-40,64.5); Kang Parkir (-28.5,58.5) and Manusia Silver (-35.5,50.5) instead of r=41.5.
- `tests/world-builder-v2.test.cjs`: object count 152 → 153 (+ the eat anchor marker).

## Caveats

- TELEPORT TEST "Warteg / Makanan" travels to the eat site (engine: travel = site), so it now lands at the eat marker, 4.9 tiles from the door.
- The Loak life site still lands 1 tile in front of the Loak door. Live has the same behaviour; it is not fixed here.
- The Kang Parkir site is 2.24 from the Mart door use, but it sits west of the door, not in front of it. Mart's door wins E when the player stands on the door tile.
- The dock is now 1.5 tiles from the fishing-spot use and 1.9 from the tent use. Each action still wins E at its own tile.
- The tenda–pasar_ikan margin is tight (29.79).

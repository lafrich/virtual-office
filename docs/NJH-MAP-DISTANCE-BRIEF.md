# NJH map distance brief (slice-1.0)

Rule: core points at most **30 tiles** apart (`map.maxCoreDistanceTiles` in `content/balancing.json`, straight-line). Source points: `world-builder/njh-map-preview/njh-map-meta.json`.

Decision (New Bot, 2026-11-22): **no code or map change** in the balancing package. This is a brief for the map owner (Ellen, `preview/njh-map-densify`). Machine-readable copy: `docs/NJH-MAP-DISTANCE-BRIEF.json`.

## Core points (tiles)

| Point | x | z |
|---|---|---|
| tenda | -51.5 | 64.5 |
| wc | -43 | 71.5 |
| warteg | -39.5 | 41.5 |
| pak_ogah | -29.5 | 40.5 |
| parkir | -15.5 | 40.5 |
| loak | -27 | 26 |
| dermaga | -50.375 | 44 |
| spot_mancing | -50.5 | 67.5 |
| pasar_ikan | -20.5 | 31 |
| siomay | -22.5 | 38.5 |
| kost | -26.25 | 71.5 |

## 25 pairs over 30 tiles (worst first)

| # | From | To | Euclidean | Manhattan |
|---|---|---|---|---|
| 1 | wc | loak | 48.2 | 61.5 |
| 2 | loak | spot_mancing | 47.7 | 65 |
| 3 | spot_mancing | pasar_ikan | 47.2 | 66.5 |
| 4 | wc | pasar_ikan | 46.3 | 63 |
| 5 | tenda | loak | 45.6 | 63 |
| 6 | tenda | pasar_ikan | 45.6 | 64.5 |
| 7 | loak | kost | 45.5 | 46.3 |
| 8 | parkir | spot_mancing | 44.2 | 62 |
| 9 | tenda | parkir | 43.3 | 60 |
| 10 | wc | parkir | 41.4 | 58.5 |
| 11 | pasar_ikan | kost | 40.9 | 46.3 |
| 12 | spot_mancing | siomay | 40.3 | 57 |
| 13 | tenda | siomay | 38.9 | 55 |
| 14 | wc | siomay | 38.8 | 53.5 |
| 15 | dermaga | kost | 36.6 | 51.6 |
| 16 | parkir | dermaga | 35.1 | 38.4 |
| 17 | pak_ogah | spot_mancing | 34.2 | 48 |
| 18 | wc | pak_ogah | 33.8 | 44.5 |
| 19 | siomay | kost | 33.2 | 36.8 |
| 20 | warteg | kost | 32.8 | 43.3 |
| 21 | parkir | kost | 32.8 | 41.8 |
| 22 | tenda | pak_ogah | 32.6 | 46 |
| 23 | dermaga | pasar_ikan | 32.6 | 42.9 |
| 24 | pak_ogah | kost | 31.2 | 34.3 |
| 25 | wc | warteg | 30.2 | 33.5 |

Pattern: the tent / WC / fishing spot cluster (west, z 64–72) is far from the work and selling cluster (Pak Ogah, Parkir, Loak, Pasar Ikan, Siomay; z 26–41). Kost Cove sits south and is >30 from most of the work cluster.

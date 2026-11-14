# Kost rooms — Ichsan & Noor (preview only)

For the first 4-player online test. Not live, not pushed. Access enforcement is Baymax's.

Branch: `preview/njh-gameplay-sites`. Building: `njh-kos-noor` (named **Kost Ichsan & Noor**), the existing two-storey kost. A neighbouring lot was not used: the gap west of this building is a road, so both room doors sit on the same south facade, 2 tiles apart, each on a clear sidewalk use tile. `enterRadius` is 1.25, so the doors do not overlap.

Ichsan's previous home door on `ref-gas-station` (Rumah Ichsan, `njh_rumah_biasa`) was freed and is still enterable as `njh_door_rumah_biasa`. Spawn/home for `t_ichsan` is now the kost room, not the house.

## Doors and rooms

| Player login | ownerId (furniture) | Door id | Use tile | Use point | Room / interior id | Building object |
|---|---|---|---|---|---|---|
| `t_ichsan` | `ichsan` | `njh_door_home_ichsan` | -28, 71 | -28.25, 71.5 | `njh_kos_ichsan` | `njh-kos-noor` |
| `t_noor` | `noor` | `njh_door_home_noor` | -27, 71 | -26.25, 71.5 | `njh_kos_noor` | `njh-kos-noor` |

Compatibility: `njh_kos` is kept as a file and aliased to `njh_kos_noor` (`resolveTemplate('njh_kos') === 'njh_kos_noor'`). Prefer `njh_kos_noor` in new wiring.

Partner: they are a couple. `homes[].partnerPlayer` is `t_noor` for Ichsan and `t_ichsan` for Noor. Doors also have `partnerOwner`.

## Access rule (for Baymax)

Both players may enter either room (partner access at the other door).

Inside a room:

- `access: shared_partner` — the owner and their partner may use it. **Kasur (bed) and the WC / kamar mandi** (squat toilet, bak + gayung / `water_tub`, wall sink, sekat). Living dressing props (kursi, meja, kipas, rak sepatu) are also tagged `shared_partner`.
- `access: owner_only` — **only the room owner** may use it. **Kulkas (`fridge`) and lemari / storage (`wardrobe`)**. The partner must not open these.

There is no official owner field on `virtual-life-interior-v1`, so every item has all three of: `ownerId` (`ichsan` or `noor`), `access` (`shared_partner` or `owner_only`), and `tags` (`owner:ichsan` / `access:owner_only`, etc.). Use any of them. Player ids in homes/doors are `t_ichsan` / `t_noor`.

Wiring: `wireDoors` now stores `obj.njhDoors[]`. `doorAnchor(o, x, z)` and `nearestEnterable` pick the nearest door on a multi-door building. `enterNearbyBuilding` opens that door's interior, not a single building interior. `openInteriorById(buildingId)` is ambiguous for this kost — please open by **door id** (`njh_door_home_ichsan` / `njh_door_home_noor`) or by the interior template. I did not add a new hook for that; say if you want `openInteriorByDoorId`.

## Room layout (both rooms, 8×6, entrance at c=4,r=5)

No shower. Kamar mandi is `water_tub` (this TYPE is already "Bak + Gayung"; there is no separate gayung TYPE). Partition is `sekat_wc`. Sink is on the wall, rot 90, backsplash against the stall, front into the stall aisle. Based on Baymax's `njh_kos` from `preview/main-interiors-kost-warteg` (read via `git show`; his worktree was not touched).

### `njh_kos_ichsan`

| Item id | TYPE | Name | Tile | ownerId | access | tags |
|---|---|---|---|---|---|---|
| `njh_kos_ichsan-bed` | `bed` | Kasur | (0,0) rot 0 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-wardrobe` | `wardrobe` | Lemari | (2,0) rot 0 | `ichsan` | `owner_only` | `owner:ichsan, access:owner_only` |
| `njh_kos_ichsan-fridge` | `fridge` | Kulkas | (4,0) rot 0 | `ichsan` | `owner_only` | `owner:ichsan, access:owner_only` |
| `njh_kos_ichsan-sekat_wc` | `sekat_wc` | Sekat WC / Kamar Mandi | (6,0) rot 90 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-squat_toilet` | `squat_toilet` | WC Jongkok | (7,0) rot 0 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-sink` | `sink` | Wastafel | (6,2) rot 90 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-water_tub` | `water_tub` | Bak + Gayung | (7,3) rot 270 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-fan` | `fan` | Kipas | (4,2) rot 0 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-chair` | `chair` | Kursi | (0,3) rot 90 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-dining_table` | `dining_table` | Meja | (2,3) rot 0 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |
| `njh_kos_ichsan-shoe_rack` | `shoe_rack` | Rak Sepatu | (0,5) rot 180 | `ichsan` | `shared_partner` | `owner:ichsan, access:shared_partner` |

### `njh_kos_noor`

| Item id | TYPE | Name | Tile | ownerId | access | tags |
|---|---|---|---|---|---|---|
| `njh_kos_noor-bed` | `bed` | Kasur | (0,0) rot 0 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-wardrobe` | `wardrobe` | Lemari | (2,0) rot 0 | `noor` | `owner_only` | `owner:noor, access:owner_only` |
| `njh_kos_noor-fridge` | `fridge` | Kulkas | (4,0) rot 0 | `noor` | `owner_only` | `owner:noor, access:owner_only` |
| `njh_kos_noor-sekat_wc` | `sekat_wc` | Sekat WC / Kamar Mandi | (6,0) rot 90 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-squat_toilet` | `squat_toilet` | WC Jongkok | (7,0) rot 0 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-sink` | `sink` | Wastafel | (6,2) rot 90 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-water_tub` | `water_tub` | Bak + Gayung | (7,3) rot 270 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-fan` | `fan` | Kipas | (4,2) rot 0 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-chair` | `chair` | Kursi | (0,3) rot 90 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-dining_table` | `dining_table` | Meja | (2,3) rot 0 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |
| `njh_kos_noor-shoe_rack` | `shoe_rack` | Rak Sepatu | (0,5) rot 180 | `noor` | `shared_partner` | `owner:noor, access:shared_partner` |

The compatibility file `njh_kos.interior-scene.json` matches Noor's layout, with item ids prefixed `njh-kos-` and the same owner/access metadata (`noor`).

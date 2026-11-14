# Kost Cove — lobby + Ichsan & Noor rooms (preview only)

For the first 4-player online test. Not live, not pushed. Access enforcement is Baymax's.

Branch: `preview/njh-gameplay-sites`. Building: `njh-kos-noor`, named **Kost Cove (Ichsan & Noor)**.

## Sources

- Ellen's earlier empty Cove room + lobby door states: `/workspace/virtual-office-assets/kamar_cove_kosong/` (README, manifest, `pintu_lobi_{milik,milik_orang_lain,terkunci,tersedia}_sw.png`, kamar shell, kasur, wc_gantung, ember/gayung props). Preview pack, previously unwired.
- Original Cove lobby/room geometry: `/workspace/vo-mp/ind/p_cove.py` and `/workspace/virtual-office/index.html`. Lobby is a short corridor (`c -21.6..-12.8`, `r 24.6..28`) with five orange doors at `c = -20.5, -18.85, -17.2, -15.55, -13.9`. Owners: door index 3 (kamar 4) Ichsan, index 4 (kamar 5) Noor. Rooms: bed on the left, bathroom right of sekat `PW = -16.5`, exit mat back to the lobby.
- Street facade: simple LFB two-storey Cove building `object:njh_kost_cove` (Ichsan t533: “Yaudah bikin simple aja”). Grey-white walls, five numbered windows (4–5 glow for Ichsan and Noor), glass door centred on the south facade at the street use tile (`-27, 71` / `-26.25, 71.5`), `COVE` sign, thin canopy. Based on the old procedural Cove facade in `vo-mp/ind/p_cove.py` and `virtual-office/index.html`. **Footprint and collision match** the previous `pipeline:id200_bangunan_rumah_kos_dua_lantai` lot (`[5.5, 4.6]`, sw 338×352 pivot `[159, 272]`, se 338×350 pivot `[160, 270]`), so paths and the use tile stay valid. Sprites: `world-builder/njh-map-preview/buildings/njh_kost_cove/`. Metadata in `njh_kost_cove.json` (`sizeClass: medium`, `levelCount: 2`, `placement: ground`, `collision: true`, rotation 0 = `sw`).

## Enter lobby first

Street enter no longer opens a bedroom. One street door on the south facade:

| Street door id | Use tile | Use point | Interior | Building |
|---|---|---|---|---|
| `njh_door_kos_cove_lobby` | -27, 71 | -26.25, 71.5 | `njh_kos_cove_lobby` | `njh-kos-noor` |

The previous second street tile (`njh_door_home_ichsan` at -28.25, 71.5) is gone from the facade. `enterRadius` is 1.25, so that old tile does not enter the building.

Room doors live **inside the lobby**, ids unchanged so Baymax's access logic still keys off them:

| Player login | ownerId (furniture) | Lobby door id | Lobby use tile | Room / interior id |
|---|---|---|---|---|
| `t_ichsan` | `ichsan` | `njh_door_home_ichsan` | (7, 1) | `njh_kos_ichsan` |
| `t_noor` | `noor` | `njh_door_home_noor` | (9, 1) | `njh_kos_noor` |

Lobby layout (10×5, entrance at c=4, r=4), five doors on the back wall (r=0), Cove order 1–5 at c=1, 3, 5, 7, 9:

| Door id | Label | State | interiorTemplate |
|---|---|---|---|
| `njh_door_cove_room_1` | Kamar 1 | `locked` | — |
| `njh_door_cove_room_2` | Kamar 2 | `locked` | — |
| `njh_door_cove_room_3` | Kamar 3 | `locked` | — |
| `njh_door_home_ichsan` | Kost Ichsan | `owned` | `njh_kos_ichsan` |
| `njh_door_home_noor` | Kost Noor | `owned` | `njh_kos_noor` |
| `njh_door_kos_cove_lobby_exit` | Keluar ke jalan | exit | street (`streetDoorId` = `njh_door_kos_cove_lobby`) |

Lobby dressing (existing TYPEs only, `access: public`): `registration_desk` at (8,3), `shoe_rack` at (0,4) rot 180. Door wall cells at r=0 should be treated as blocked.

Compatibility: `njh_kos` is still a file and aliased to `njh_kos_noor` (`resolveTemplate('njh_kos') === 'njh_kos_noor'`). Prefer `njh_kos_noor` in new wiring. `openInteriorById(buildingId)` for `njh-kos-noor` should now open the **lobby**, not a bedroom.

Partner: they are a couple. `homes[].partnerPlayer` is `t_noor` for Ichsan and `t_ichsan` for Noor. Each may enter the other's **room** from the lobby and use kasur + kamar mandi, but not kulkas, storage, or the kitchen.

## Homes / spawn (do not break room ids)

`homes[]` still identifies each player by their **room** door and template. Spawn is on the sidewalk in front of the lobby (lobby-first):

| player | doorId (room identity) | interiorTemplate | lobbyDoorId | lobbyTemplate | homeSpawn |
|---|---|---|---|---|---|
| `t_ichsan` | `njh_door_home_ichsan` | `njh_kos_ichsan` | `njh_door_kos_cove_lobby` | `njh_kos_cove_lobby` | -26.25, 71.5 |
| `t_noor` | `njh_door_home_noor` | `njh_kos_noor` | `njh_door_kos_cove_lobby` | `njh_kos_cove_lobby` | -26.25, 71.5 |

Street enter / `nearestEnterable` at that point opens `njh_kos_cove_lobby`. After that, open the room by lobby door id or room template. The standalone house stays enterable as `njh_door_rumah_biasa`.

## Schema addition for Baymax — `doors[]` / `exits[]`

`virtual-life-interior-v1` has no nested-door furniture TYPE, so the lobby (and each room) carry a **`doors`** array. **`exits`** on the lobby is the `role: exit` subset.

Each `doors[]` entry:

- `id`, `role` (`room` or `exit`), `label`
- `c`, `r`, `useTile`, `usePoint`
- room doors: `state` (`locked` / `owned` / `available`), `interiorTemplate` (or null), `ownerId` / `owner` / `partnerOwnerId` / `partnerOwner`, `access`, `sprite`, `sprites`
- exit doors: `exitTo` (`street` or a parent interior id), plus `streetDoorId` or `lobbyDoorId`

Lobby door sprites are Ellen's `pintu_lobi_*` from `kamar_cove_kosong`, copied to `interiors/lobby-doors/`. They are **not** catalog TYPEs. Please draw `doors[].sprite` / `doors[].sprites` by viewer state:

- own room: `pintu_lobi_milik_sw.png`
- partner / other occupied: `pintu_lobi_milik_orang_lain_sw.png` (+ optional `__glow`)
- locked (kamar 1–3): `pintu_lobi_terkunci_sw.png`
- for-sale (unused here): `pintu_lobi_tersedia_sw.png`

Please open by **door id** or **interior template**. From the street, only `njh_door_kos_cove_lobby`. From the lobby, `njh_door_home_ichsan` / `njh_door_home_noor`. Room scenes have an exit door back to `njh_kos_cove_lobby`.

`wireDoors` still stores `obj.njhDoors[]` for street doors. This building now has a single street door.

## Access rule (for Baymax)

Both players may enter either room (partner access at the other lobby door).

Inside a room:

- `access: shared_partner` — owner and partner. **Kasur (bed)** and the **kamar mandi** (squat toilet, **bathtub**, **shower**, wall sink, sekat). Dressing props (kipas, rak sepatu) are also `shared_partner`.
- `access: owner_only` — **only the room owner**. **Kulkas (`fridge`)**, **lemari / storage (`wardrobe`)**, and the **kitchenette** (`stove` / Kompor and `kitchen_sink` / Bak Cuci).

**Kitchen access choice:** `owner_only` (the default). The partner must not cook at or take from the owner's dapur, same rule as kulkas and lemari. Change this later if you want shared cooking.

There is no official owner field on `virtual-life-interior-v1`, so every room item has `ownerId` (`ichsan` or `noor`), `access`, and `tags`. Player ids in homes/doors are `t_ichsan` / `t_noor`.

### Interaction / action tags (play.js + hooks convention)

Hooks today gate stove (`cook` / `cook_recipe`), bathroom (`home_shower` / `shower`), and bed (`sleep`) by furniture kind; kulkas / storage use kost-site actions `store_fridge` / `take_fridge` / `store_home` / `take_home`. Interiors follow the existing rumah-biasa `actionId` values, plus tags Baymax can match:

| Item | TYPE | actionId | motions / pose | tags (plus owner/access) |
|---|---|---|---|---|
| Kasur | `bed` | `sleep` | `lie_sleep` / pose `lie` | `access:shared_partner` |
| Kulkas | `fridge` | `open` | `open` | `open_fridge`, `store_fridge`, `take_fridge`, `dapur` |
| Lemari | `wardrobe` | `open` | `open` | `open_storage`, `store_home`, `take_home` |
| Kompor | `stove` | `cook` | `cook` | `cook`, `cook_recipe`, `dapur` |
| Bak Cuci | `kitchen_sink` | `wash` | `wash` | `wash`, `dapur` |
| Shower | `shower` | `bathe` | `mandi` / pose `bathe` | `bathroom`, `home_shower` |
| Bathtub | `bathtub` | `bathe` | `mandi` / pose `bathtub_bathe` | `bathroom`, `home_shower`, `bathtub_bathe` |
| WC Jongkok | `squat_toilet` | `use_toilet` | `wc_squat` / pose `toilet` | `bathroom`, `home_toilet` |
| Wastafel | `sink` | `wash` | `wash` | `bathroom` |

A catalog `counter` (meja / kitchenette counter, 2×1) exists but was left out so the aisle stays clear; the cook station is `stove` + `kitchen_sink`. No `rice_cooker` (would be a second `cook` point).

## Bathroom exception (t519)

Kost rooms **`njh_kos_ichsan` and `njh_kos_noor` only** use catalog TYPEs `bathtub` + `shower` (both `shared_partner`). They do **not** use `water_tub` (bak + gayung). Toilet, sekat, and the wall sink stay.

This is an **explicit exception**. Public `njh_wc_mandi_umum` is unchanged: bak + gayung (`water_tub`), no bathtub, no shower.

## Room layout (both rooms, 10×8, entrance at c=4, r=7)

Cove plan: kasur on the left, bathroom to the right of `sekat_wc`, kitchenette along the back wall (kompor, bak cuci, kulkas), lemari on the left wall, clear aisle on c=4–5 from the door to the kitchen and into the bathroom at (6,1). Existing catalog TYPEs only. Each used item has a free, door-reachable interaction-side tile (rot 0 = +r, 90 = +c, 180 = −r, 270 = −c).

### `njh_kos_ichsan`

| Item id | TYPE | Name | Tile | actionId | ownerId | access | interaction tags |
|---|---|---|---|---|---|---|---|
| `njh_kos_ichsan-bed` | `bed` | Kasur | (0,0) rot 0 | `sleep` | `ichsan` | `shared_partner` | — |
| `njh_kos_ichsan-stove` | `stove` | Kompor | (2,0) rot 0 | `cook` | `ichsan` | `owner_only` | `cook`, `cook_recipe`, `dapur` |
| `njh_kos_ichsan-kitchen_sink` | `kitchen_sink` | Bak Cuci | (3,0) rot 0 | `wash` | `ichsan` | `owner_only` | `wash`, `dapur` |
| `njh_kos_ichsan-fridge` | `fridge` | Kulkas | (4,0) rot 0 | `open` | `ichsan` | `owner_only` | `open_fridge`, `store_fridge`, `take_fridge`, `dapur` |
| `njh_kos_ichsan-sekat_wc` | `sekat_wc` | Sekat WC / Kamar Mandi | (6,0) rot 90 | — | `ichsan` | `shared_partner` | `bathroom` |
| `njh_kos_ichsan-shower` | `shower` | Shower | (7,0) rot 0 | `bathe` | `ichsan` | `shared_partner` | `bathroom`, `home_shower` |
| `njh_kos_ichsan-squat_toilet` | `squat_toilet` | WC Jongkok | (9,0) rot 0 | `use_toilet` | `ichsan` | `shared_partner` | `bathroom`, `home_toilet` |
| `njh_kos_ichsan-sink` | `sink` | Wastafel | (7,2) rot 90 | `wash` | `ichsan` | `shared_partner` | `bathroom` |
| `njh_kos_ichsan-bathtub` | `bathtub` | Bathtub / Bak Mandi | (7,3) rot 0 | `bathe` | `ichsan` | `shared_partner` | `bathroom`, `home_shower`, `bathtub_bathe` |
| `njh_kos_ichsan-wardrobe` | `wardrobe` | Lemari | (0,4) rot 0 | `open` | `ichsan` | `owner_only` | `open_storage`, `store_home`, `take_home` |
| `njh_kos_ichsan-fan` | `fan` | Kipas | (2,6) rot 0 | — | `ichsan` | `shared_partner` | — |
| `njh_kos_ichsan-shoe_rack` | `shoe_rack` | Rak Sepatu | (0,7) rot 180 | — | `ichsan` | `shared_partner` | — |

Exit: `njh_kos_ichsan-exit` at (4,7) → `njh_kos_cove_lobby` (`lobbyDoorId` = `njh_door_home_ichsan`).

### `njh_kos_noor`

Same layout and action tags. Item ids use the `njh_kos_noor-` prefix. `ownerId` / `owner:` tags are `noor`. Exit `lobbyDoorId` is `njh_door_home_noor`.

The compatibility file `njh_kos.interior-scene.json` matches Noor's layout, with item ids prefixed `njh-kos-` and the same owner/access metadata (`noor`).

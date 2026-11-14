# Life-play logic status (preview)

Preview branch `preview/main-interiors-kost-warteg` only. Not live. Status:

- **real** — implemented end-to-end against Jiwa / the Semesta save / a real map object.
- **stub** — the hook or action works with a small data-driven or default implementation, not yet the finished authored content.
- **placeholder-position** — the action itself works, but the site sits at an offset because `world.json` has no matching object.

## Step 2 (live 2026-11-14, sw v28, `?v=njh-step2-2`)

Contract: `docs/HOOKS-STEP2.md`. UI: Layar `mainkan/njh98-step2.js` (`1ff0fa3f`), real hooks win, no SIMULASI when they exist.

| Feature | Status | Notes |
|---|---|---|
| Containers `inventory` / `moveItem` / `eatItem` (bag, kulkas, lemari) | real | kulkas/lemari owner_only; partner/stranger get disabled AKSI rows with the reason; token 0 locks them |
| Cooking `recipes` / `cook` + `mainkan:cook-done` | real | 38 recipes (Gerak manifest), known + experiment, needs kompor in own kost + token |
| Minimarket `shopList` / `buy` / `checkoutCart` + `mainkan:shop-receipt` | real | NJH Mart interior (Gerak scene), 54 items + `token_listrik`; prices in `jiwa/njh-cooking-catalog.js`, override via `cooking.prices` |
| Fishing `fishSpots` / `fishStart` / `fishInput` + `mainkan:fish-result` | real | Ellen's `njh-fishing-spot-kali-selatan` (−51.5,68) + old dock (−51.5,44), range 2.5; legacy `fish` kept |
| Kost token `token` / `topupToken` + `mainkan:token` | real | Rp20.000 / 5 unit, base drain 1 unit / 240 game min + fridge; minimarket `token_listrik` tops up |
| Animations (`cook`, `cook_stir`, `hand_over`, `fishing_cast`, `fishing_wait(_sit)`, `use_storage`, `eat*`) | stub | ids wired; fall back through the existing pose chain |

Follow-ups: preview prop sizes at size/50 (dock ~22% short, Cove 6.76×7.04 vs 7.469×8.982) not changed; minimarket paint hook; Bangun Ruang registry for the 8 + 3 minimarket types.

## Hooks (`SemestaLifePlay` / `SemestaPlay`)

| Item | Status | Notes |
|---|---|---|
| `dayReport(day)` | real | From `transactions[].day` + persisted day-end snapshot |
| `level()` | real | From `experience` |
| `skills()` | real | From persisted `actionCounts` |
| `reputation()` | real | From `actionCounts` + completed quests |
| `housingProgress()` | stub | `tenda`/`kost` are real; `rumah` is a target list only (no buy-house action yet) |
| `quests()` / `acceptQuest` / `turnInQuest` | stub | Data-driven table + real wallet reward via `quest_reward`; not Jiwa-authored quests |
| `questMarkers()` | real | Follows those quest states; also world `quest_npc` objects |
| `jobs()` | real | Jiwa `config.jobs` |
| `enterInterior(id)` | real | Street door / `openInteriorById('njh-kos-noor')` opens lobby `njh_kos_cove_lobby`; rooms via lobby doors or `spawnAt('kost', roomId)` |
| `furnitureSpots()` | real | Default 8×6 kost grid from the save; interior items when inside a room |
| `messages()` | real | Persisted Nokia inbox |
| `sites()` | real | `{id,label,x,z,placeholder,npc?,points[]}`; `x,z` is the first match, `points` lists every match (e.g. all scavenge spots) |
| `enterables()` | real | Requires `enterable` or an interior template; scavenge props are excluded |
| `housing()` / `relationship()` / `roomAccess()` / `saveMeta()` | real | Client-side 4P kost + pacaran. `housing().roomId` is `njh_kos_ichsan` / `njh_kos_noor`. Partner may use bed/WC; fridge/lemari/stove/kitchen_sink rejected with `Punya pacar`. Locked doors show `Terkunci`. |
| `nearbyActions()` / `runAction()` | real | SITE actions, lobby/room door enter/exit on the Action button, mapped furniture ids (`open`/`cook`/`wash`/`bathe`/`use_toilet` + tags), and `scene:<id>` stubs |
| `spawnAt` / `clock` / `pause` / save slots | real | `spawnAt('kost', roomId)` still lands in the room (skips lobby) for Ichsan/Noor |
| `njh98:open-map` | real | Listener forwards to the parent map window |
| `wall_pee` | real | See actions |
| `fart` | real | See actions |
| `tea` | real | Es teh, Rp3.000, at the coffee site |

## Site actions

| Site id | Map | Action | Status |
|---|---|---|---|
| `loak` | real object | `sell_loak` | real |
| `scavenge` | real object | `scavenge` | real |
| `tree` | real object | `catch_fruit` | real; name match is word-bounded (`\btree\b`) so the `streetscape` tag is ignored |
| `warung` | real object | `eat` (warteg Rp12.000) | real; prefers a building whose name matches `warteg` |
| `bench` | real object | `rest` | real |
| `fish` | placeholder-position | `fish` (no water tiles required; `spotId` is enough) | real + placeholder-position |
| `siomay_batagor` | placeholder-position | `sell_fish` | real + placeholder-position |
| `pasar_ikan` | placeholder-position | `sell_fish` | real + placeholder-position |
| `job_silver` | placeholder-position | `work` | real + placeholder-position |
| `job_pak_ogah` | placeholder-position | `work` | real + placeholder-position |
| `job_kang_parkir` | placeholder-position | `work` | real + placeholder-position |
| `premium_job` | placeholder-position | `work` | real + placeholder-position |
| `coffee` | placeholder-position | `coffee`, `tea` | real + placeholder-position |
| `public_wc` | placeholder-position | `public_toilet` | real + placeholder-position |
| `public_bath` | placeholder-position | `public_shower` | real + placeholder-position |
| `kost` | placeholder-position unless a real kost / `__njh_play_kost__` is on the map | `buy_room` / in-room actions | real; position may be placeholder |
| `tent` | placeholder-position until hobo spawn | `sleep` | real + placeholder-position |
| `prayer_islam_a/b/c` | placeholder-position | `worship` | real + placeholder-position |
| `prayer_kristen` | placeholder-position | `worship` | real + placeholder-position |
| `prayer_katolik` | placeholder-position | `worship` | real + placeholder-position |
| `prayer_hindu` | placeholder-position | `worship` | real + placeholder-position |
| `prayer_buddha` | placeholder-position | `worship` | real + placeholder-position |
| `prayer_konghucu` | placeholder-position | `worship` | real + placeholder-position |
| `hansip` | placeholder-position | `talk`, `arrest` | real + placeholder-position |
| `help` | placeholder-position | `help` | real + placeholder-position |
| `charity` | placeholder-position | `charity` | real + placeholder-position |
| `course` | placeholder-position | `course` | real + placeholder-position |

## Context actions (single Action button)

| Action id | Status | Stats / rules |
|---|---|---|
| `wall_pee` | real | Offered only if bladder ≥ 65 and near a wall/building. Honours `wallPeeFacingRequired` (default true). **moral −5, bladder −70, hygiene −5**, 3 minutes — the single set from `jiwa/interaction-rules.js` `wall_pee`, also used in life-economy, activity-catalog, and foundation/gameplay config. The generic `pee_outside` / “Pipis sembarangan” button is removed. |
| `fart` | real | Always in `nearbyActions` after a **1 game-minute** cooldown (≈ 60s game time). **moral −3** when an NPC or other player is within 2 tiles, **0** when alone. A nearby NPC plays a placeholder “jijik” emote (`mainkan:npc-react`). |
| `talk` | stub | Simple conversation at hansip / NPC sites. |

## NPCs (ephemeral, never saved to the city draft)

| NPC id | Site | Role | Behaviour | Art | Status |
|---|---|---|---|---|---|
| `npc_silver` | `job_silver` | work + quest `q_silver` | work | LGR `manusia_silver` if present, else placeholder capsule | stub / placeholder |
| `npc_ogah` | `job_pak_ogah` | work + quest `q_ogah` | work | LGR `pak_ogah` if present, else placeholder | stub / placeholder |
| `npc_parkir` | `job_kang_parkir` | work + quest `q_parkir` | work | LGR `kang_parkir` if present, else placeholder | stub / placeholder |
| `npc_premium` | `premium_job` | work | idle | placeholder | stub / placeholder |
| `npc_siomay` | `siomay_batagor` | buyer | idle | placeholder | stub / placeholder |
| `npc_pasar` | `pasar_ikan` | buyer | idle | placeholder | stub / placeholder |
| `npc_loak` | `loak` | buyer + quest `q_loak` | idle | placeholder | stub / placeholder |
| `npc_hansip` | `hansip` | hansip | patrol + talk | LGR `hansip` if present, else placeholder | stub / placeholder |
| `npc_help` | `help` | quest `q_warga` | idle + give quest | placeholder | stub / placeholder |
| `npc_ibu_warteg` | `warung` / inside warteg | penjual, offers `eat` (Makan Warteg) | idle, stands behind etalase/cashier facing customers | old Virtual Life v6b `bu_warteg` sheet (placeholder art) | old-asset placeholder |

Behaviours are placeholder: idle, a short patrol loop, talk, give quest, stand-at-work. They use official LGR characters when the vault has them; otherwise a colored capsule + label.

## Prices (authoritative, `jiwa/life-economy.js`)

| Id | Label | Rp |
|---|---|---|
| `streetFoodPrice` / `eat` | Jajanan kaki lima / gorengan | 2.500 |
| `wartegMealPrice` | Makan Warteg | 12.000 |
| `coffeePrice` | Kopi | 5.000 |
| `teaPrice` | Es Teh | 3.000 |
| `tokenPrice` | Token listrik (5 unit) | 20.000 |
| `roomPrice` | Sewa kost (sekali bayar) | 700.000 |
| `fridgePrice` | Kulkas | 2.000.000 |
| `bed` | Kasur | 1.500.000 |
| `chair` | Kursi | 350.000 |
| `stove` | Kompor | 850.000 |
| `wardrobe` | Lemari | 1.000.000 |
| `publicShowerFee` | Mandi umum | 500 |
| `charity` | Sedekah | 1.000 |

Job session wages are unchanged (Silver Rp1.600, Pak Ogah Rp2.500, Kang Parkir Rp2.100, Premium Rp4.500). They are small next to a Rp700.000 kost and were left as-is on purpose.

## Tests

- `tests/semesta-life-hooks.test.cjs` — hooks, quests, enterables, `wall_pee`, `fart`, `open-map`
- `tests/semesta-life-logic.test.cjs` — site list, NPC defs, no `pee_outside` UI, price + stat alignment, fish without water
- `tests/semesta-room-access.test.cjs` — 4P housing, pacaran, lobby/room access, locked doors, action map
- `tests/njh-kost-lobby-smoke.test.cjs` — official Cove lobby/rooms, `openInteriorById`, partner/guest, site-name guards
- `tests/semesta-int-scenes.test.cjs` — 6 Beraksi slot files import + DB version replace + play events

## Kost Cove lobby (Ellen `8e099eb`)

Street door `njh_door_kos_cove_lobby` on building `njh-kos-noor` (use tile −27,71 / point −26.25,71.5) opens interior `njh_kos_cove_lobby`. Inside: `njh_door_home_ichsan` → `njh_kos_ichsan`, `njh_door_home_noor` → `njh_kos_noor`, `njh_door_cove_room_1/2/3` locked (`Terkunci`), `njh_door_kos_cove_lobby_exit` → street. New scene schema: `doors[]` + optional `exits[]` (`role` room|exit, `c/r`, `useTile`/`usePoint`, `state`, `interiorTemplate`, `exitTo`, sprites). Generic clip-test `njh_kos.interior-scene.json` is not overwritten.

## Interaction scenes (stubs)

Planned Beraksi ids `njh_int_wc|bed|tree|room|npc_f|npc_m` are mapped in `semesta-int-scenes.js` and offered as `scene:<id>`. Importable placeholder JSONs live in `/workspace/beraksi-int-slots/` (not Drive). Cloud DB wins after sync; tiny in-code fallback only if a scene is unreachable.

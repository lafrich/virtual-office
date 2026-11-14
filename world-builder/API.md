# Mainkan / Semesta life hooks (preview)

Preview branch `preview/mainkan-hooks-p1` only. Nothing here is live. Going live needs Ichsan's own OK.

Canonical namespace: `window.SemestaLifePlay`. The same read hooks are also aliased on `window.SemestaPlay` so Layar's feature detection (`questMarkers`, `enterables`, `worldToScreen`, `playerPosition`, `spawnAt`, `nearbyActions`, `clock`, plus `dayReport`, `level`, `skills`, `reputation`, `housingProgress`, `quests`, `jobs`, `enterInterior`, `furnitureSpots`, `messages`, `sites`) swaps off its fallback automatically. `nearbyActions` / `runAction` stay on `SemestaLifePlay`, which is what `mainkan/njh98.js` already calls.

Events are `window` CustomEvents (detail payload) and, when the world is inside the Mainkan iframe, same-origin `postMessage`s to the parent. Incoming pause/resume are accepted as both parent `postMessage` and iframe CustomEvents.

The auto-save key is unchanged: `semesta-life-play-v1:` + cityId + optional `@` + playerId.

## Functions

### `spawnAt(kind, id?)` → `{ok, kind, id, x, z, teleported?, reason?}`

Move the player to a spawn. `kind` is `'tent'` or `'kost'` (`'hobo'` / `'home'` are accepted aliases). Optional `id` picks a life site or world object. Kost uses the owned room position when present.

```js
SemestaLifePlay.spawnAt('tent');
SemestaLifePlay.spawnAt('kost', 'kost');
```

Emits `mainkan:spawn-done` (also after the existing spawn/respawn path via `onSpawn`).

### `nearbyActions()` → `[{id, label, price, furnitureId?, action, spotLabel, args, hold?}]`

Actions at sites within 2.5 units. The array also has a non-enumerable `.spot` label (Layar reads `list.spot || list[0].spotLabel`). `id` is the action name passed to `runAction(id)`. Job rows set `hold: true` and `args.jobId`.

Furniture gates (data-driven map in `SemestaLifeHooks.FURNITURE_GATES`):

| Action | Needs | How it is found |
|---|---|---|
| Masak (`cook`, `cook_recipe`) | stove / kompor | owned `state.furniture` while at kost, or a nearby world/interior prop |
| Mandi (`home_shower`) | bathroom / kamar_mandi | nearby world or interior prop (`assetId` `shower`, name/id patterns). Not in the Jiwa furniture catalog yet. |
| Tidur (`sleep`) at kost | bed / kasur | owned `bed` at kost, or a nearby bed prop. Sleep at the hobo tent is not gated. |

Public mandi/WC, warung, jobs, and other street actions are unchanged. `runAction` uses the same gate, so the native panel cannot bypass it.

```js
const list = SemestaLifePlay.nearbyActions();
// list.spot === 'Kost / Kamar'
SemestaLifePlay.runAction(list[0].id);
```

Adapter for interiors (main has none yet):

```js
SemestaLifePlay.setInteriorFurnitureAdapter(() =>
  SemestaLifeHooks.furnitureFromInteriorItems(currentInterior.items, {x, z, id: roomId})
);
// or implement bridge.interiorFurniture() (builder already forwards VLNjhMapPreview.interiorFurniture if present)
```

### `pause()` / `resume()` / `isPaused()` → `{ok, paused}` / boolean

`mainkan:pause` and `mainkan:resume` (parent postMessage or CustomEvent) stop the life tick (`SemestaLifePlay.tick` returns immediately) and the visual 24-hour clock (`dayClock.setPaused`).

### `questMarkers()` → `[{npcId, state}]`

`state` is `'available'` or `'ready'`. Sources: world objects with `type === 'quest_npc'` (or `questId` / `npcQuest`) and Jiwa `worldEntities` with `operation === 'npc_quest'`.

### `enterables()` → `[{id, name, x, z}]`

Buildings with `enterable` or an interior (`interior.floors` or `njhInteriorTemplate`), plus play-map kost / warteg buildings matched by name even when the `enterable` flag is missing. `x,z` prefer a door anchor when the bridge provides one.


### `dayReport(day)` → `{day, start, end, income:{label:Rp}, expense:{label:Rp}, status?}`

Built from `transactions[].day` plus a day-end status snapshot (`energy`, `fullness`, `hygiene`, `moral`, `housing` = Kost/Tenda) persisted on `state.dayReports`.

### `level()` → `number`

`1 + floor(experience / 10)` from the real Jiwa save.

### `skills()` → `[{label, level}]`

Levels 1–10 from persisted `state.actionCounts` (kerja, masak, mulung & mancing, sosial).

### `reputation()` → `[{label, value}]`

0–100 from the same counts plus completed quests (Warga kampung, Pedagang, Kang parkir & Pak Ogah).

### `housingProgress()` → `{current:'tenda'|'kost'|'rumah', next, targets:[{label,done,info}]}`

`current` follows `state.housing.room`. Targets use the real room price and owned furniture.

### `quests()` → `[{npcId,id,title,goal,text?,target,progress,reward,state}]`

`state` is `available` | `active` | `ready` | `done`. `acceptQuest(npcId, questId)` and `turnInQuest(npcId, questId)` persist that state; a ready turn-in pays `reward` through `quest_reward` in the economy. `questMarkers()` hides `active`/`done` and shows `available`/`ready`.

### `jobs()` → `[{id,label,wage,per,where?}]`

From Jiwa `config.jobs`, with `per: 'sesi N mnt'` and `where` from the matching life site.

### `enterInterior(id)` → `boolean`

`true` only when a real play interior opened (kost / warteg, including `d:kost`). Not a mock shop window.

### `furnitureSpots()` → `[{id,label,x,y,w,h,owned,buy?,acts:[{act,label}]}]`

8×6 kost grid (or current interior items when inside). Owned flags come from the save.

### `messages()` → `[{from,text,t}]`

Nokia inbox, persisted on `state.messages` (welcome, quest updates, day report, rent).

### `sites()` → `[{id,label,x,z,placeholder:boolean,npc?:boolean}]`

Every life site, including offset placeholders when the main map has no matching object. `npc: true` when a job/buyer/hansip/quest NPC stands there.

### `wall_pee` / `fart` (nearbyActions + runAction)

The generic **Pipis sembarangan** (`pee_outside`) button is gone. Pee is a context action `wall_pee`, offered only when `bladder >= 65` and the player is near a wall or building. If `wallPeeFacingRequired` (default `true`, from foundation / gameplay.json) the player must also face that wall. Stats are the single Jiwa `wall_pee` rule, used everywhere:

| Action | When | Stats |
|---|---|---|
| `wall_pee` | bladder ≥ 65, near (and usually facing) a wall/building | moral −5, bladder −70, hygiene −5, 3 menit |
| `fart` | always, cooldown 1 game minute (≈ 60s game time) | moral −3 if an NPC or other player is within 2 tiles, else 0. A nearby NPC plays a placeholder “jijik” emote (`mainkan:npc-react`). |

Both go through the single Action button / `nearbyActions()` / `runAction`. `pee_outside` is rejected by the economy.

### `njh98:open-map`

Nokia's Peta (or the dock) should dispatch a `njh98:open-map` CustomEvent on the world iframe, or `postMessage({type:'njh98:open-map'})` to it. The world listens and forwards the same message to its parent so the parent can open the same map window as the dock (`NJH98Mock.openMap()`). `SemestaLifePlay.openMap()` does that forward.

Prices live in `jiwa/life-economy.js` settings + `FURNITURE` (warteg Rp12.000, kopi Rp5.000, es teh Rp3.000, jajanan Rp2.500, token Rp20.000, kost Rp700.000, kulkas Rp2.000.000, kasur Rp1.500.000, …). See `docs/LOGIC-STATUS.md`.

### `worldToScreen(x, y, z)` → `{x, y, visible}`

Canvas-pixel projection from the Semesta orthographic camera (origin at the canvas top-left). `visible` is false when the point is off-screen or the camera is missing.

### `playerPosition()` → `{x, y, z}`

Live player world position.

### `clock()` → `{day, minute, weekday, label, phase, paused, speed, elapsedMinutes}`

Unified snapshot. Day, minute, weekday, label, phase and speed come from the visual Semesta 24-hour clock when it is attached; `elapsedMinutes` is the Jiwa life clock. Both share the pause flag. If the visual clock is not attached, day/minute are derived from `elapsedMinutes` starting at 07:00 on day 1.

The two clocks still advance at their existing rates (visual: 1 real second = 1 game minute at 1×; life: `settings.realSecondsPerGameMinute`, default 8). Unifying the rates is out of scope.

### Save slots

Named slots use a **separate** key: `semesta-life-slots-v1:` + cityId + optional `@` + playerId. The automatic life save is not renamed, migrated, or deleted by slot APIs except `loadSlot`, which writes the loaded state into the current session and then `persist()`s the auto-save.

| Function | Returns | Notes |
|---|---|---|
| `hasSave(slot?)` | boolean | No argument: auto-save exists, or any named slot exists. With a slot id: that named slot exists. |
| `saveMeta(slot?)` | `{slot, savedAt, day, minute, label, weekday, wallet, elapsedMinutes, ...}` or `null` | No argument describes the auto-save (`slot: 'auto'`). |
| `saveSlot(slot)` | `{ok, slot, meta?, reason?}` | Copies the current life state into a named slot (`[a-z0-9_-]{1,40}`). |
| `loadSlot(slot)` | `{ok, slot, meta?, reason?}` | Replaces the current life state and persists the auto-save. |
| `listSlots()` | `[{slot, savedAt, day, ...}]` | Named slots only. |
| `resetSave(slot?)` | `{ok, ...}` | No argument: existing RESET of the current life (re-applies a test start profile when the player id is listed). With a slot id: deletes that named slot only. `SemestaLifePlay.reset()` is unchanged. |

```js
SemestaLifePlay.saveSlot('slot1');
SemestaLifePlay.loadSlot('slot1');
SemestaLifePlay.listSlots();
SemestaLifePlay.resetSave('slot1'); // delete slot
SemestaLifePlay.resetSave();        // reset current life
```

## Events

### `mainkan:spawn-done`

Fired after `spawnAt` and after the built-in spawn/respawn decision.

```js
// CustomEvent.detail / postMessage data
{type:'mainkan:spawn-done', ok:true, kind:'tent'|'kost', id, x, z}
```

Layar already listens for the parent-window message: `{type:'mainkan:spawn-done', kind:'tent'|'kost'}`.

### `mainkan:pause` / `mainkan:resume`

Incoming only (Mainkan already posts these). There is now a listener in `world-builder/builder.js` and a CustomEvent listener on the iframe `window`. Payload is just `{type}`.

### `mainkan:day-end`

Fired when the visual clock's `day` increments (midnight rollover).

```js
{type:'mainkan:day-end', day:2, previousDay:1}
```

Wallet transactions now include `day` (visual day when `runAction` / `advance_time` pass `args.day`; otherwise `floor(elapsedMinutes / 1440) + 1`). The log is still the last 40 wallet deltas. Existing saves without `day` are filled in by `stateFrom`.

## Files

- `world-builder/semesta-life-hooks.js` — hook factory and furniture map
- `world-builder/semesta-life-play.js` — public API, tick pause, action/furniture gates
- `world-builder/builder.js` — pause messages, camera projection, day-end, `SemestaPlay` aliases
- `jiwa/life-economy.js` — `transactions[].day`
- `tests/semesta-life-hooks.test.cjs`
- `docs/LOGIC-STATUS.md` — real vs stub vs placeholder-position for every hook, site, and NPC
- `world-builder/MERGE-PLAN.md` — how `preview/njh-map-draft1` interiors would join main

## 4P kost, lobby, and access (preview)

`SemestaLifePlay.housing()` → `{ownerId, roomId, kind, lobbyTemplate, lobbyDoorId, homeSpawn}`.

`relationship(id?)` → `[{with, type}]` (pacaran for `t_ichsan`/`t_noor`).

`roomAccess(roomId)` → `{canEnter, role: 'owner'|'partner'|'guest'|'none', allowedActs, reason, kind}`. Locked reason: `'Terkunci'`. Partner denied on owner-only furniture: `'Punya pacar'`.

`saveMeta()` includes `{hasCharacter, needsCharacter, ownerId, spawn:{site,roomId}}`. 4P starts go through the character creator first, then `spawnAt('kost', roomId)` into their room. Guests: creator, then hobo start.

`openInteriorById('njh-kos-noor')` opens the shared lobby. Lobby/room doors are used via the single Action button (`enter_room` / `exit_interior`). Interior action ids `open`, `cook`, `wash`, `bathe`, `use_toilet` and tags `open_fridge`/`store_fridge`/`take_fridge`, `open_storage`/`store_home`/`take_home`, `cook_recipe` map onto the existing economy actions.

Interaction scenes: `runAction('scene:<sceneId>')` with planned ids `njh_int_wc`, `njh_int_bed`, `njh_int_tree`, `njh_int_room`, `njh_int_npc_f`, `njh_int_npc_m`. Playing pauses control, plays both actor tracks, resumes, and emits `mainkan:scene-start` / `mainkan:scene-end`. Placeholder Beraksi files are local only (`/workspace/beraksi-int-slots/`).

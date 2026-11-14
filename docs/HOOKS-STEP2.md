# NJH Step 2 — hooks, events, return shapes (PREVIEW)

Branch `preview/njh-step2` (lafrich/virtual-office). Preview only: not on main, not live.
Going live needs Ichsan's own words. Owner: Baymax. UI: Layar (build mocks to THESE shapes).

All hooks live on `window.SemestaLifePlay` and are forwarded on `window.SemestaPlay`
(same names). They are synchronous, never throw, and always return an object with
`ok:boolean` and, when `ok:false`, a human Indonesian `reason` (show it as-is).
Prices are integers in Rupiah; format with `toLocaleString('id-ID')`.
Prices and the item / recipe / fish catalog live in Jiwa config:
`jiwa/njh-cooking-catalog.js` (data from Gerak's manifest) merged into
`JiwaLifeEconomy.defaults().cooking`; token price stays `settings.tokenPrice`/`tokenUnits`.

## Common item row

```
ItemRow = {
  uid: 'life:telur:12',        // instance id; pass this to moveItem/cook/eatItem
  itemId: 'telur',             // catalog id (= itemMeta.species)
  label: 'Telur',
  category: 'protein',         // schema category (fish, dish, staple, ...)
  icon: 'icons/items/telur.png' | null,   // relative to the supermarket icon base
  quality: null | 'biasa' | 'bagus' | 'sempurna',   // dishes only
  storeIn: ['bag','fridge'],
  minutesLeft: 4210 | null,    // null = never spoils
  spoiled: false,
  inFridge: false,
  edible: true,                // eatItem allowed (raw fish = false)
  sellPrice: 0 | null
}
```

Every instance takes one slot (no stacking, same as the existing bag rule).

## 1. Inventory and containers

`inventory(container='bag')`
- `container`: `'bag' | 'fridge' | 'storage'` (`storage` = lemari / homeStorage).
- Returns `{ok, container, label, slots, used, free, items:ItemRow[], locked, reason?}`.
- `locked:true` (with `ok:false` and `reason`) when:
  - not the owner of the room you are in (partner → `"Punya pacar"`, others → `"Terkunci"`),
  - no kost (`"Perlu kost dahulu."`), no kulkas bought (`"Belum punya kulkas."`),
  - electricity token is 0 (`"Token listrik habis. Isi token dulu (Rp20.000 / 5 unit)."`) — fridge AND storage.
- `bag` is never locked.

`moveItem(from, to, itemId, qty=1)` — also accepts one object `moveItem({from,to,itemId,qty})`.
- `itemId` may be a `uid` (moves that instance) or a catalog id (moves `qty` instances, freshest-last).
- Allowed pairs: bag↔fridge, bag↔storage (fridge↔storage goes through the bag).
- Rules: same lock rules as `inventory`; target full → `"Tas penuh."` / `"Kulkas penuh."` / `"Penyimpanan kost penuh."`;
  `storeIn` must include the target (`"Barang kering simpan di lemari."` / `"Barang basah simpan di kulkas."`);
  spoiled items can't go into the fridge.
- Returns `{ok, from, to, moved:[uid], reason?, pose:'use_storage'}`.
- Must be near the furniture (AKSI menu) unless `from`/`to` is only `bag`; near-check uses the existing furniture gates.

`eatItem(uid)` → `{ok, itemId, label, quality, effects:{fullness,energy,moral}, pose, reason?}`
- Dishes use the recipe `statEffectsEat` (× quality: biasa 1, bagus 1.2, sempurna 1.5).
- Snack / drink / fruit items with `statEffects` are edible. Raw fish and raw staples → `"Ikan mentah harus dimasak dahulu."` / `"Bahan mentah, masak dulu."`.
- Pose: `eat_snack` (snack/drink/fruit), `eat_sit` when seated, else `eat`.

## 2. Cooking

`recipes()` → `RecipeRow[]`
```
RecipeRow = {
  id:'nasi_goreng', label:'Nasi Goreng' | '???', known:true,
  ingredients:[{id?:'telur', category?:'fish', qty:1, label:'Telur', have:1}], // hidden ([]) when !known
  outputItem:'nasi_goreng', outputLabel:'Nasi Goreng',
  durationMinutes:25, statEffectsEat:{fullness,energy,moral}, minExp:0,
  unlock:{mode:'start'|'experiment'|'tip'|'skill'}, actionAsset:'cook_stir',
  canCook:false, missing:['minyak']   // canCook ignores location; cook() checks it
}
```

`cook(input)`
- `input` = `'nasi_goreng'` | `{recipeId}` | `{ingredients:[uid|itemId,...]}` | `[uid|itemId,...]` (3–5 for experiments, a known recipe may need 1–3).
- Needs: own kost room (owner), a stove near you (kompor in your room or an owned `stove`), token ≥ 1, ingredients in the **bag**, energy ≥ the recipe cost.
- Experiment: an ingredient set that matches a recipe you don't know → cooks it and learns it.
  No match → `{ok:false, failed:true, reason:'Kombinasi bahan belum jadi masakan.'}`, nothing consumed, no time used.
- Raw fish turns into a dish (`ikan_goreng` etc.); fish wildcard `{category:'fish'}`.
- Success returns
```
{ok:true, recipeId:'nasi_goreng',
 result:{uid, itemId:'nasi_goreng', label:'Nasi Goreng', quality:'bagus', statEffectsEat:{...}},
 learnedRecipe: null | {id, label},
 consumed:[uid,...], minutes:25, tokenUsed:1, pose:'cook_stir'}
```
- Event **`mainkan:cook-done`** with the same object (`detail`), also posted to the parent frame.
- Quality: `sempurna` if EXP ≥ minExp+30 and every ingredient has ≥50% freshness left; `bagus` if EXP ≥ minExp+10; else `biasa`.
- Pose: recipe `actionAsset` (`cook` or `cook_stir`, `mix_drink` for drinks).

Legacy kept: `runAction('cook',{itemId})` (fish cooked and eaten at once) and `runAction('cook_recipe',{activityId})`.

## 3. Minimarket

Site id **`minimarket`** in `sites()` (pattern `minimarket|njh.?mart|swalayan|supermarket`), building `njh-minimarket`,
door `njh_door_minimarket`, use tile (-27, 58), interior `njh_minimarket` (Gerak 8x6).

`shopList(siteId='minimarket')`
→ `{ok, siteId, label:'NJH Mart', inside:bool, near:bool, wallet, bagFree,
    items:[{itemId,label,category,price,unit,icon,approximate,storeIn,shelf}], reason?}`
(the list is returned even when not near, with `ok:true` and `near:false`, so the UI can preview; `buy` checks location.)

`buy(itemId, qty=1)` or `buy({cart:[{itemId,qty}]})` (alias `checkoutCart({cart})`)
- Needs: inside the minimarket interior, or within range of the minimarket site / kasir.
- All-or-nothing: `"Uang tidak cukup."` / `"Tas penuh (8 slot)."` / `"Barang tidak dijual di sini."`.
- Returns `{ok, receipt:{lines:[{itemId,label,qty,price,subtotal}], total, walletBefore, walletAfter}, added:[uid], pose:'hand_over', reason?}`.
- Event `mainkan:shop-receipt` (same object).

## 4. Fishing

`fishSpots()` → `[{id, label, x, z, source:'world'|'site'|'temporary'}]` — data-driven:
any world object whose id/name/asset matches `dermaga|mancing|fishing|pier` (e.g. `njh-dermaga-mancing-anchor`,
Ellen's `preview/njh-step2-map` spot) or the `fish` site; when none exist, a temporary spot
`njh-fish-temp` at the `fish` site (or the player) is returned.

`fishStart(spotId?)`
→ `{ok, sessionId, spotId, energyCost:8, phase:'cast', reason?}`.
Needs: near a fishing spot (range 2.5, `spotId` optional = nearest), bag not full, energy ≥ 8.
Pose: `fishing_cast`.

`fishInput(action, value?)` — also `fishInput({sessionId, phase|action, value})`.
- `action`: `'cast' | 'wait' | 'strike' | 'reel' | 'cancel'`, `value` 0..1.
- `cast` (value = power) → `{ok, phase:'wait', pose:'fishing_wait'}` (`fishing_wait_sit` when seated).
- `wait` (call every ~1 s of UI time; value ignored) → `{ok, phase:'wait'|'strike', bite:bool, strikeWindowMs:900}`.
- `strike` (value = timing accuracy, 1 = perfect) → `{ok, phase:'reel', hooked:true, tension:0.5}` or result (got away).
- `reel` (value = player tension 0..1, keep it in the green band `[0.25,0.8]`) → `{ok, phase:'reel', progress:0..1, tension}` until progress ≥ 1 → result.
- `cancel` → result with `gotAway:true, reason:'Batal'`.
- Result object (also the final `fishInput` return): `{ok, done:true, fishId, label, rarity, rarityTier, gotAway, uid, reason?}`.
  Energy (−8) and time (+12 min) are spent once per session, at the result.
- Event **`mainkan:fish-result`** with the result.
- Catch goes into the bag (spoils in 180 min; store it in the fridge or cook it).

Legacy kept: `runAction('fish',{spotId})` instant roll.

## 5. Kost electricity token

`token()` → `{ok, units, drainPerHour, empty, minutesLeft, price:20000, unitsPerPack:5, fridgeCooling:bool, hasRoom}`
- `drainPerHour` = `settings.tokenDrainPerHour` (0.25, kost base load) + `60/tokenDurationMinutes` (1) while the
  kulkas is cooling food (existing rule). Drain runs on game time (`clock`), only for players with a kost.
- `empty:true` when `units===0`.

`topupToken(units=5)` → `{ok, units, added, packs, paid, reason?}`
- Rp20.000 per 5 units (`settings.tokenPrice` / `tokenUnits`); `units` rounds up to whole packs.
- Needs a kost; works anywhere (PLN token via phone/ATM).
- Event `mainkan:token` `{units, empty}` on topup and whenever it hits 0.

When `units===0`: `inventory('fridge'|'storage')` and `moveItem` to/from them return `locked`, `cook` returns
`"Token listrik habis."`, the kulkas stops cooling. Topping up re-enables all of them.

## nearbyActions additions (AKSI menu)

Entries keep the existing shape `{id, action, label, price, spotLabel, args, furnitureId?}` plus `ui`:

| id | ui | when |
|---|---|---|
| `open_fridge` | `inventory` (args.container='fridge') | near kulkas in own kost |
| `open_storage` | `inventory` (args.container='storage') | near lemari in own kost |
| `cook_menu` | `cook` | near kompor in own kost |
| `shop_minimarket` | `shop` (args.siteId='minimarket') | inside NJH Mart / near the site |
| `fish_start` | `fishing` (args.spotId) | near a fishing spot |
| `topup_token` | `token` | in own kost when units ≤ 2 |

`runAction(id,args)` for these returns `{ok:true, ui, ...data}` (e.g. the `shopList` / `inventory` result) and
emits `mainkan:open-ui` `{ui, args}`; it does not change state.

## Animation ids (Bergerak DB)

cook → `cook` / `cook_stir` (drinks `mix_drink`); minimarket pay → `hand_over`; fishing → `fishing_cast`,
`fishing_wait` / `fishing_wait_sit`; storage → `use_storage`; eating → `eat` / `eat_sit` / `eat_snack`.
Missing ids fall back through the existing chain (never blocks).

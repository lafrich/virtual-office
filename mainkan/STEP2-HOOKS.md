# Step 2 hooks — UI mock (Layar) mengikuti kontrak Baymax

Terakhir diperbarui: 2026-11-14 WIB (Asia/Jakarta), oleh Layar.

**Kontrak resmi:** `docs/HOOKS-STEP2.md` di branch `preview/njh-step2` (commit `624fd525`). Mock SIMULASI di `mainkan/njh98-step2.js` memakai **nama, argumen, dan bentuk return itu persis**. Hook asli `window.SemestaLifePlay` / `SemestaPlay` didahulukan; kalau belum ada, mock `njh98:mock:step2@<pemain>` jalan dan tidak mengubah dompet/status/tas asli.

Ringkas yang UI panggil:

| Hook | Bentuk |
|---|---|
| `inventory(container)` | `{ok, container, label, slots, used, free, items:ItemRow[], locked, reason?}` — `bag` / `fridge` / `storage`. ItemRow pakai `uid`, tanpa tumpuk. |
| `moveItem(from,to,itemId,qty)` atau `{from,to,itemId,qty}` | `{ok, from, to, moved:[uid], reason?, pose:'use_storage'}` |
| `eatItem(uid)` | `{ok, itemId, label, quality, effects, pose, reason?}` |
| `recipes()` | `RecipeRow[]` (`known`, `canCook`, `missing[]`, bahan `have`/`qty`; `???` kalau belum dikenal) |
| `cook(input)` | string / `{recipeId}` / `{ingredients}` / array. Sukses + event `mainkan:cook-done`. Token 0 → `"Token listrik habis."` |
| `shopList(siteId='minimarket')` | `{ok, siteId, label, inside, near, wallet, bagFree, items:[...]}` |
| `buy(itemId,qty)` / `buy({cart})` / `checkoutCart({cart})` | `{ok, receipt, added, pose:'hand_over', reason?}` + event `mainkan:shop-receipt` |
| `fishSpots()` / `fishStart(spotId?)` / `fishInput(action,value?)` | juga `{sessionId, phase, value}`. Hasil + event `mainkan:fish-result` |
| `token()` | `{ok, units, drainPerHour, empty, minutesLeft, price:20000, unitsPerPack:5, fridgeCooling, hasRoom}` |
| `topupToken(units=5)` | `{ok, units, added, packs, paid, reason?}` + event `mainkan:token` |

Opsi bar AKSI (kalau belum ada di `nearbyActions()`): `cook_menu`, `open_fridge`, `open_storage`, `shop_minimarket`, `fish_start`, `topup_token` (di kost, token ≤ 2). Token 0: kulkas/lemari/masak disabled, alasan `"Token listrik habis. Isi token dulu (Rp20.000 / 5 unit)."` (inventory) / `"Token listrik habis."` (cook).

Katalog id: kit Gerak (`njh98-step2-catalog.js`). Harga token Rp20.000 / 5 unit. Animasi existing hanya disebut sebagai placeholder (`cook`, `cook_stir`, `eat`, `fishing_cast`, `fishing_wait`, `hand_over`, `pick_up`, `use_storage`).

## Celah

- Saat dokumen ini ditulis, `preview/njh-step2` (`624fd525`) baru berisi kontrak + peta minimarket, **belum** implementasi hook JS. UI diuji di mock. Gabung worktree logic Baymax begitu hook-nya masuk.
- Drain mock menampilkan `drainPerHour` (0.25 + 1 saat kulkas nyala) sesuai kontrak Baymax. Aturan Ichsan (1 unit / hari game + per sesi masak) tercatat; masak mock tetap `tokenUsed:1`.
- Item `token_listrik` tidak ada di katalog Gerak; hanya di UI/minimarket mock.
- `shop()` tetap ada sebagai alias tipis ke `shopList` (bukan bagian kontrak).
- Hak `owner_only` / pasangan: mock belum mengunci (anggap pemilik). Id furnitur Ellen belum dipetakan; UI masih `stove` / `fridge` / `wardrobe`.
- Mini-game mancing UI masih satu bar timing (cast/strike lewat AKSI); hook `wait`/`reel` disediakan.
- `mix_drink` tidak ada di daftar id existing; katalog memetakan ke `cook`.

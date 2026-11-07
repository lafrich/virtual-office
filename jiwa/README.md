# JIWA.EXE — Context-driven Mechanics Studio (Foundation v2)

JIWA is the fourth Membangun program. It reads **saved Semesta City Drafts** from the existing same-origin `VLCityDrafts` API (IndexedDB database `virtual-life-city-drafts`) without rewriting city geometry.

- Open `https://lafrich.github.io/virtual-office/jiwa/` or select JIWA.EXE in Membangun.
- The **GLOBAL FOUNDATION** option works even before saving a Semesta city. Global context defaults are copied into a newly edited city (each city can then have independent overrides). Existing saved city projects are never silently rewritten.
- The **CONTEXT** tab contains survival, economy, progression, housing, morality and social presets with editable **WHEN (event), WHERE (object tag/ID), IF (conditions), THEN (effects)** rules. New custom contexts can also be created. Bind a context to the currently selected Semesta object using **USE SELECTED OBJECT**.
- **TRY THIS CONTEXT** runs isolated, atomic sandbox scenarios; results appear in the existing TEST tab. Scenarios cover zero-wallet/energy, bag full, owner-only Cove access, unverified events and relationship prerequisites.
- Current foundation default balancing in sandbox: bag **8** slots, wage cap **Rp6.000 per game-day**, online course cap **150 XP per game-day**, crossing **−2 energy once per completion ID**, basic job **Rp3.000** and warteg meal **Rp2.500**. All values are stylized balancing proposals and are editable where appropriate, not a claim about real-life prices.
- Social/referral opportunities remain **disabled by default**; the phone/status/bag/Action HUD of Virtual Life is preserved, not redesigned.

- In Semesta, choose **Save City** (unsaved working-copy edits are not automatically included). The **JIWA / MECHANICS** control near Active Asset opens JIWA with that city and selected object.
- Choose a saved city and click a placed object or an interior item. JIWA reads nested `interior.floors[].items[]` as virtual selection entries under a stable composite ID; it does not mutate their physical placement.
- Configure reusable built-in and user-saved templates, a set of action rules, triggers, conditions, animation IDs and effects. Object-specific overrides use the Semesta object ID, not their asset file name.
- `SAVE RULES` persists a separate `jiwa-mechanics-v1` IndexedDB project per city. Data stays local to the current browser/profile/origin, with a localStorage fallback.
- `EXPORT` saves a standalone mechanics JSON; `IMPORT` requires the same city ID and validates supported rule fields.
- **Play Test** locally simulates wallets, needs, inventory, and quest flags with an event log. Effects and animation names in this mode are simulation data only.

**Not yet a production gameplay runtime:** JIWA does not change live Virtual Life accounts, online NPC behaviors, multiplayer inventory/economy, or the encrypted production game. The isometric world view is a schematic generated from the real saved object positions (not a duplicate of Semesta's 3D renderer). The new foundation context editor, including donations, worship, housing rights, moral and referrals, is **editor/sandbox only** until the runtime server consumes validated events. True runtime dispatch, verified rig playback, permission-controlled publishing and server-authoritative multiplayer state are separate integration milestones. Unrecognized gameplay code is never evaluated.

Integration files: `jiwa/index.html`, `jiwa/jiwa.js`, `world-builder/jiwa-link.js`, `membangun/index.html`.
Context files: `jiwa/foundation-engine.js` (pure rule logic), `jiwa/context-editor.js` (Windows XP style editor), `tests/jiwa-foundation-runtime.test.cjs` (state invariants), `jiwa/FUNDAMENTAL_FLOW_V2.md` (design contract). To run local tests: `node --test tests/jiwa-foundation-runtime.test.cjs`.

## Life Economy V1: hobo, kost, fasilitas umum, dan fishing

- **GAME PREVIEW** membaca City Draft Semesta yang dipilih (titik dan terrain kota yang tersimpan). Jika tidak ada aset tertentu, muncul pin **PLACEHOLDER** untuk tenda hobo, kost, WC umum, mandi umum, titik mancing, dan pembeli ikan. Ini hanya *sandbox* 2D isometrik, bukan renderer atau gameplay server Semesta.
- Player tanpa kost otomatis **HOBO** ketika reset test. Respawn memilih satu tenda di tepi wilayah kota secara acak. Jiwa menggunakan objek tenda Semesta yang benar-benar berada dekat perimeter; bila tidak ada, dibuat 4 kandidat tenda virtual di sisi barat/timur/utara/selatan **tanpa menambah objek ke City Draft**. Menekan RESPAWN memilih ulang, bukan mengubah layout kota.
- Kost dibuka dengan **satu kali pembayaran** di sandbox (default Rp30.000; tidak ada sewa periodik). Setelah aktif, homeAccess menjadi true dan respawn diarahkan ke kamar yang terhubung, atau placeholder kost untuk uji. Akses kamar pemain lain tidak otomatis berlaku.
- Fasilitas **WC umum**: bladder -100, kebersihan -5; **mandi umum**: biaya Rp500, kebersihan +35. Perlu mendatangi pin/objek yang sesuai.
- Fasilitas **WC kost**: bladder -100 tanpa penalti; **mandi kost**: kebersihan +70 tanpa biaya per aksi. Hanya tersedia dengan akses kost. **Tidur tenda**: energi +30 / kebersihan -15; **tidur kost**: energi +65 / kebersihan -8. Semua angka merupakan default *tuning* editable di Jiwa.
- **Fishing loot table**: sapu-sapu paling sering (weight 60), disusul lele (20), nila (12), mujair (8). **Bang Siomay/Batagor** menerima semua jenis dengan harga berbeda. **Pasar ikan** menolak sapu-sapu. Bobot, harga, penolakan pembeli, dan durasi busuk dapat diedit per kota dalam GAME PREVIEW.
- Identitas keyakinan dan zodiak bisa disetel di editor; **Friends/social**, **referral**, dan **jalur antagonis fiksi V2** tetap dikunci. Aturan ini tidak mengubah animasi Mahluk Hidup.
- Data project tetap tersimpan lokal per kota via **SAVE RULES**, bukan akun multiplayer / Google Drive. Pengujian: node --test tests/jiwa-life-economy.test.cjs.

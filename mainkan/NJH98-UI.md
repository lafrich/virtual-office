# Namanya Juga Hidup — the Game · Win98 UI (preview)

UI-only pass on the Mainkan shell. Game logic, Worker, map/LFB assets, character art, Emosi untouched.

## Files
- `mainkan/njh98.css` — Win98/Y2K skin, wizard step bar, fullscreen play HUD (loaded after the inline styles).
- `mainkan/njh98.js` — presentation layer: step bar from screen visibility, HUD windows (read-only `SemestaLifePlay.state()` + iframe clock text), Fullscreen API toggle, dock, Status window, placeholders.
- `mainkan/njh98-world.css` — injected by njh98.js into the same-origin `world-builder/?player=1` iframe; only applies under `html.semesta-player-mode.njh98`.
- `mainkan/index.html` — copy/markup (title, Menu Utama, Login back, Hari Pertama, Menu Jeda, HUD markup). All existing ids kept.
- `mainkan/app.js` — copy only (boot text, statusbar labels, "Main Tanpa Akun").

## Flow
Splash → Menu Utama → Login (or Main Tanpa Akun) → Buat Karakter (Paint) → Konfirmasi → Hari Pertama → Main (fullscreen).
Returning players still skip creator after login (existing `routes.returning`).

## Placeholders (disabled, tagged SEGERA / BELUM ADA LOGIC)
Menu Utama: Lanjutkan, Mulai Baru, Pengaturan, Kredit. Menu Jeda: Simpan, Muat, Laporan Hari, Pengaturan.
Status window: Progres tempat tinggal (Rumah Lv.?), Skill & reputasi, Laporan Hari. Hari Pertama: in-world quest.

## Notes
- In play mode the fixed Win98 layout overrides UI Editor positions for money/HP/Bag/Action/Run (`#gameWallet` hidden; wallet is in the profile window). UI Editor still saves; Mainkan ignores those slots while `body.njh-play`.
- `mainkan:pause` / `mainkan:resume` unchanged (still unhandled in Semesta).
- Rollback: revert this commit; no storage/schema migration involved.

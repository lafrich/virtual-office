# Namanya Juga Hidup — the Game · Panduan UI (Win98 / Y2K)

Panduan ini wajib dibaca sebelum mengubah UI `mainkan/`. Isinya aturan yang sudah disepakati dengan Ichsan supaya kesalahan yang sama nggak terulang.
Lapisan UI ini **presentasi saja**: logic game, Worker, data peta/aset LFB, karakter LGR, dan Emosi tidak disentuh.

## 1. Aturan utama

### Nama
- Nama game: **Namanya Juga Hidup — the Game** (judul jendela, intro, taskbar). Publisher: **Lafrich**.
- **Jangan pernah** pakai "Mainkan.exe" di layar pemain. `mainkan/` cuma nama folder/kode.

### Gaya: Win98 / Y2K asli, bukan kartun
| Token | Nilai |
|---|---|
| Face / dialog | `#c0c0c0` |
| Bevel | highlight `#fff`, light `#dfdfdf`, shadow `#808080`, dark `#000` (raised = terang kiri-atas, gelap kanan-bawah; pressed = kebalikannya) |
| Title bar aktif | gradasi `#000080 → #1084d0`, teks putih bold 11px |
| Title bar non-aktif | `#808080 → #b5b5b5` |
| Seleksi | `#000080` teks putih |
| Tooltip / info | `#ffffe1`, border 1px `#000` |
| Desktop | teal `#008080` |
| Font | MS Sans Serif / Tahoma-like 11px (`--w-font`), angka/jam monospace (`--w-mono`), rendering pixel |
| Bentuk | sudut tajam (`border-radius:0`), border 1px, tanpa soft shadow, tanpa blur, ikon pixel 16×16 (SVG rect), tanpa emoji |
| Animasi | `steps()` (patah-patah seperti 98), pendek, hormati `prefers-reduced-motion` |

Satu-satunya pengecualian bentuk bulat: joystick dan tombol AKSI/LARI di HP (konvensi game mobile).

### Satu pintu per fitur
- **Dock kanan bawah adalah satu-satunya tempat** untuk Nokia, Tas, Status, Peta, Menu, Layar. Tombol **Peta** di dock membuka jendela *Peta Kota*. (Catatan untuk Baymax: Nokia masih punya app Peta bawaan → nanti cukup satu; usul: app Nokia memanggil jendela yang sama.)
- Tidak boleh ada tombol kembar (contoh: Nokia di atas *dan* di bawah). Sebelum menambah tombol, cek apakah fitur itu sudah punya pintu.
- Kondisi (Energi, Kebersihan, Buang Air, Kenyang, Moral, EXP) hanya di jendela **Kondisi** kanan atas; uang hanya di jendela profil kiri atas.

### Aksi kontekstual
- **Tidak ada panel "Aksi & Tas" permanen.** Aksi muncul sebagai menu pop-up Win98 kecil hanya saat dekat objek/orang (AKSI / `E`), lalu hilang (Batal / `Esc`).
- Di tempat kerja: tahan AKSI → jendela progres.
- Tas punya jendela sendiri (grid slot) dari dock.

### Bersih dari teks debug
- Teks test/debug (teleport TEST, reset, koordinat, `[PLACEHOLDER]` mentah, editor strip) **tidak boleh terlihat pemain**. Hanya muncul dengan `?dev=1` (menu **Alat Dev**).

### Mode main
- Main = **fullscreen**: dunia memenuhi layar, HUD berupa jendela Win98 kecil di atasnya. Tombol **Layar** memanggil Fullscreen API (iOS: pesan fallback "Tambah ke Layar Utama").

### HP
- **Landscape** (acuan 844×390), susunan HUD sama dengan desktop, diperkecil.
- Portrait saat main → jendela **"Putar HP ke landscape"**; `screen.orientation.lock('landscape')` dicoba setelah fullscreen, gagal dengan tenang.
- Gerak: **joystick bulat** semi-transparan kiri bawah (muncul di titik jempol), menyetir input WASD yang sudah ada. D-pad lama tetap di DOM tapi disembunyikan.
- AKSI & LARI bulat kompak di kanan bawah.
- Target sentuh **≥ 40px**. HUD bawaan **tidak boleh menutupi > 25% layar**. Saat Nokia/popup terbuka, HUD minggir.

### Urutan masuk
1. **Intro**: kartu Lafrich (~1.5 dtk) → judul + bar loading (preload aset asli) → "Tekan tombol apa saja / ketuk" → Menu Utama. Ketuk/tombol mempercepat; pemain lama (`njh98:intro-seen`) lebih cepat.
2. Menu Utama → Login / Main Tanpa Akun → Buat Karakter → Konfirmasi → **Cara Main** → Main.
3. **Cara Main**: 3 langkah Win98 (Kontrol, Fitur, Tujuan pertama), ada **Lewati**. Hanya sekali (`njh98:tutorial-done`); bisa dibuka lagi dari **Menu Jeda → Lihat Tutorial**.

### Spawn
- Pemain baru (hobo) **keluar dari tenda**. Pemilik kost **bangun di kost**.
- Sekarang: overlay "keluar tenda" **PLACEHOLDER** sampai animasi Gerak siap. Kalau `VLSpawnHobo` Semesta sedang memutar animasi aslinya, flap placeholder tidak menutupinya.
- Posisi spawn ditentukan logic (Baymax: `spawnAt` + event `mainkan:spawn-done`); UI hanya membaca.

### Penanda dunia
- NPC dengan quest: **`!`** kuning pixel di atas kepala (bob pelan); **`?`** = quest siap diserahkan.
- Bangunan yang bisa dimasuki: **kilau pixel kecil** di pintu + tooltip Win98 saat dekat: `Warteg Bu Sari · Masuk [E]` (HP: `[AKSI]`). Tooltip ini menggantikan hint AKSI biasa (bukan dobel).
- Data yang belum ada ditandai **CONTOH**. Hook yang dibutuhkan dari Baymax: `SemestaPlay.questMarkers() → [{npcId,state}]`, `SemestaPlay.enterables() → [{id,name,x,z}]`, `SemestaPlay.worldToScreen(x,y,z)` (atau `playerPosition()`). UI otomatis memakai hook kalau ada.

### Fitur tanpa logic → lapisan SIMULASI
- Fitur yang direncanakan **bisa diklik** dan berfungsi sebagai placeholder, dengan tag teal **SIMULASI** (dulu: tombol disabled SEGERA). Semuanya di `njh98-mock.js`, terpisah dari `njh98.js`.
- Aturan: **hook asli dulu** (`window.SemestaLifePlay`, alias `window.SemestaPlay`), kalau tidak ada baru mock. Lihat bagian *Lapisan simulasi* di bawah.

### Kontrak DOM & hook (handoff Baymax)
Ikuti handoff Baymax: `/workspace/mainkan-ui-handoff/MAINKAN-UI-HANDOFF.md` (box bersama; API hook: `world-builder/API.md` di branch `preview/mainkan-hooks-p1`). Ringkasnya — **jangan diganti nama/dihapus**:
- Layar: `splashScreen`, `welcomeScreen`, `loginScreen`, `characterScreen`, `confirmScreen`, `loadingScreen`, `tutorialScreen`, `gameScreen`, `pauseScreen`, `messageScreen`.
- Kontrol: `skipSplash`, `welcomeContinue`, `welcomeGuest`, `guestButton`, `email`, `password`, `authSubmit`, `authMessage`, `ccCreate`, `confirmGo`, `tutorialDone`, `tutorialSkip`, `gamePhone`, `gameBag`, `gameAction`, `gameRun`, `pauseButton`, `resumeGame`, `pauseExit`, `semestaFrame`, `worldLoading`, `walkPad`.
- postMessage: `mainkan:profile-request`, `mainkan:player-profile`, `mainkan:pause`, `mainkan:resume`. Storage key game tidak diubah; key UI baru hanya `njh98:*`.
- Aksi gameplay hanya lewat hook yang ada: tombol panel life asli, `SemestaLifePlay.runAction` (`eat_item`, `discard_item`), input WASD sintetis.

### Konten
- Harga **Rupiah realistis Indonesia** (`Rp 6.000`, format `id-ID`), teks bahasa Indonesia santai.

### Rilis
- **Preview dulu** di branch, dengan screenshot **desktop (1366×768) + HP landscape (844×390) + 1 portrait** pakai login test asli (ID test dari Baymax; password tidak pernah dicetak/di-log).
- **Live hanya dengan persetujuan Ichsan sendiri.** Merge **fast-forward only**, **bump versi service worker** (cache), dan tulis **catatan rollback** (commit yang di-revert; tidak ada migrasi storage).

## 2. Checklist Do / Jangan

| Do ✔ | Jangan ✘ |
|---|---|
| "Namanya Juga Hidup — the Game" | "Mainkan.exe" di layar pemain |
| Bevel 98, title bar navy, sudut tajam, ikon pixel | Rounded, soft shadow, gradasi glossy, emoji, gaya kartun |
| Satu pintu per fitur (dock) | Tombol/menu kembar (Nokia dua kali, Peta di luar Nokia) |
| Menu aksi pop-up saat dekat objek | Panel "Aksi & Tas" permanen |
| Debug hanya `?dev=1` | Teks TEST/teleport/koordinat di layar pemain |
| Fullscreen play, HUD jendela kecil | Dunia dibingkai jendela editor |
| HP landscape + prompt putar + joystick bulat | D-pad kotak besar, layout portrait yang menutupi layar |
| Target ≥ 40px, HUD ≤ 25% layar | HUD menutupi dunia |
| Intro → Menu Utama; tutorial sekali, bisa dilewati | Tutorial muncul tiap login |
| Tag SIMULASI / CONTOH / PLACEHOLDER kalau datanya mock | Mock tanpa tag, seolah data asli |
| Uang asli hanya lewat `runAction` (harga game) | Mock mengubah dompet/status asli |
| Pakai id/hook handoff + feature detection | Ganti id, storage key, atau logic game |
| Preview + screenshot, live atas izin Ichsan, ff-only + bump SW + rollback | Push langsung ke live / force push |

## 3. Lapisan simulasi (`njh98-mock.js`)

**Aturan**
1. `hook(nama)` = `SemestaLifePlay[nama]` atau `SemestaPlay[nama]`. Ada → dipakai, tag SIMULASI hilang. Tidak ada → mock + tag **SIMULASI**.
2. Nama & bentuk data mock **sama persis** dengan API Baymax (`world-builder/API.md`), jadi mock cuma menambal yang belum ada.
3. Penyimpanan mock hanya di `localStorage` `njh98:mock:*` (per pemain: `njh98:mock:<nama>@<playerId>`), setelan di `njh98:settings`. Key game tidak disentuh, kecuali *Muat* mock (menulis key life `semesta-life-play-v1:…` lalu reload dunia — sama seperti `loadSlot` asli).
4. Dompet asli berubah **hanya** lewat `SemestaLifePlay.runAction(aksi,args)` dengan harga game. Belanja/hadiah simulasi pakai **dompet simulasi** (`njh98:mock:wallet`, awal Rp 50.000).
5. Furnitur dalam ruangan: aksi muncul hanya saat dekat furnitur yang cocok; aksi asli lewat `runAction`, dan `setInteriorFurnitureAdapter(fn)` dipasang selama di dalam Kost.exe (dilepas saat keluar).
6. `NJH98Mock.mockFired()` = daftar mock yang pernah jalan di sesi ini (untuk cek hook mana yang belum ada).

**Fitur**: Menu Utama (Lanjutkan, Mulai Baru + konfirmasi, Pengaturan: suara/bahasa/ukuran UI, Kredit) · Menu Jeda (Simpan/Muat 3 slot, Laporan Hari, Pengaturan, Lihat Tutorial) · Laporan akhir hari (dari `mainkan:day-end`, kalau tidak ada: perubahan hari yang terlihat) · Status (Kondisi, Skill, Reputasi, progres Tenda → Kost Lv3 → Rumah Lv8) · Nokia + (Pesan, Lowongan, Tips) · Peta Kota · Dialog quest (terima, progres, serahkan) · Interior placeholder `<Toko>.exe` + `Kost.exe`.

**Hook → mock** (yang dipakai kalau hook tidak ada)

| Hook (SemestaLifePlay / SemestaPlay) | Bentuk | Status di Baymax `preview/mainkan-hooks-p1` |
|---|---|---|
| `clock()` | `{day, minute, weekday, label, phase, paused, speed, elapsedMinutes}` | ada |
| event `mainkan:day-end` | `{day, previousDay}` | ada |
| `hasSave(slot?)` / `saveMeta(slot?)` | boolean / `{slot, savedAt, day, minute, label, weekday, wallet, elapsedMinutes}` | ada |
| `saveSlot(slot)` / `loadSlot(slot)` | `{ok, slot, meta?, reason?}`, slot `slot1..slot3` | ada |
| `listSlots()` | `[{slot, savedAt, day, …}]` | ada |
| `nearbyActions()` | `[{id, label, price, furnitureId?, action, spotLabel, args, hold?}]` | ada |
| `setInteriorFurnitureAdapter(fn)` | `fn() → [{id, kind, furnitureId, label, x, z, roomId, source:'interior'}]` | ada |
| `dayReport(day)` | `{day, start, end, income:{label:Rp}, expense:{label:Rp}, status?:{energy, fullness, hygiene, moral, housing}}` | **belum** (sementara dari `transactions[].day`) |
| `level()` | `number` | **belum** (mock: 1 + EXP/10) |
| `skills()` / `reputation()` | `[{label, level}]` (1–10) / `[{label, value}]` (0–100) | **belum** |
| `housingProgress()` | `{current:'tenda'\|'kost'\|'rumah', next, targets:[{label, done, info}]}` | **belum** |
| `quests()` / `acceptQuest(npcId, questId)` / `turnInQuest(npcId, questId)` | `[{npcId, id, title, goal, text?, target, progress, reward, state:'available'\|'active'\|'ready'\|'done'}]` / `{ok}` | **belum** (`questMarkers()` ada) |
| `jobs()` | `[{id, label, wage, per, where?}]` | **belum** (mock: `JiwaLifeEconomy.JOBS` + 3 lowongan contoh) |
| `enterInterior(id)` | `true` kalau interior asli dibuka | **belum** (mock: jendela `<Toko>.exe`) |
| `furnitureSpots()` | `[{id, label, x, y, w, h, owned, buy?, acts:[{act, label}]}]` (grid kamar 8×6) | **belum** (mock: tata letak contoh 8×6) |
| inbox Nokia | `[{from, text, t}]` | **belum** |

## 4. Kesalahan yang pernah terjadi (sudah diperbaiki)
- **Tombol Nokia dobel**: ada di bar atas dan di dock bawah → sekarang hanya di dock.
- **Panel "Aksi & Tas"** permanen di kiri dengan tab Aksi/Tas → dihapus; jadi menu kontekstual + jendela Tas sendiri.
- **D-pad portrait menutupi layar** di HP → diganti layout landscape + joystick bulat + prompt putar HP.
- **Judul "Mainkan.exe"** → diganti "Namanya Juga Hidup — the Game".
- **Tombol SEGERA mati** bikin fitur terasa rusak → jadi placeholder SIMULASI yang bisa diklik.
- **Pintu kost tidak terdeteksi** karena site kost di kota ini masih placeholder → pintu kost tetap ditampilkan (CONTOH) supaya Kost.exe bisa dimasuki.

## 5. File
- `njh98.css` — skin Win98, step bar, HUD play, intro, joystick, penanda dunia.
- `njh98.js` — lapisan presentasi (intro, Cara Main, dock, jendela, menu kontekstual, progres, Tas, joystick, spawn placeholder, penanda dunia).
- `njh98-world.css` — di-inject ke iframe `world-builder/?player=1` (hanya di bawah `html.semesta-player-mode.njh98`).
- `njh98-mock.js` — lapisan SIMULASI (hook asli dulu, mock `njh98:mock:*`).
- `index.html` — markup/copy; semua id lama tetap ada.

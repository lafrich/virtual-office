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
- **Dock kanan bawah adalah satu-satunya tempat** untuk Nokia, Tas, Status, Menu, Layar. **Peta ada di dalam Nokia** (bukan tombol kedua).
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

### Fitur tanpa logic
- Tombol tetap tampil tapi **disabled** dengan tag **SEGERA** (fitur direncanakan) atau **BELUM ADA LOGIC**. Contoh: Lanjutkan, Mulai Baru, Simpan/Muat, Laporan Hari, Pengaturan, Kredit, Rumah Lv.?.
- Setiap hook baru dipakai lewat *feature detection*: pakai kalau ada, kalau tidak ada tampilkan fallback/SEGERA.

### Kontrak DOM & hook (handoff Baymax)
Ikuti handoff Baymax di thread koordinasi Mainkan ↔ Baymax (Virtual Office). Ringkasnya — **jangan diganti nama/dihapus**:
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
| Tag SEGERA / BELUM ADA LOGIC / CONTOH | Tombol palsu yang seolah berfungsi |
| Pakai id/hook handoff + feature detection | Ganti id, storage key, atau logic game |
| Preview + screenshot, live atas izin Ichsan, ff-only + bump SW + rollback | Push langsung ke live / force push |

## 3. Kesalahan yang pernah terjadi (sudah diperbaiki)
- **Tombol Nokia dobel**: ada di bar atas dan di dock bawah → sekarang hanya di dock.
- **Panel "Aksi & Tas"** permanen di kiri dengan tab Aksi/Tas → dihapus; jadi menu kontekstual + jendela Tas sendiri.
- **D-pad portrait menutupi layar** di HP → diganti layout landscape + joystick bulat + prompt putar HP.
- **Judul "Mainkan.exe"** → diganti "Namanya Juga Hidup — the Game".

## 4. File
- `njh98.css` — skin Win98, step bar, HUD play, intro, joystick, penanda dunia.
- `njh98.js` — lapisan presentasi (intro, Cara Main, dock, jendela, menu kontekstual, progres, Tas, joystick, spawn placeholder, penanda dunia).
- `njh98-world.css` — di-inject ke iframe `world-builder/?player=1` (hanya di bawah `html.semesta-player-mode.njh98`).
- `index.html` — markup/copy; semua id lama tetap ada.

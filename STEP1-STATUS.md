# Step 1 status (untuk Layar)

Ditulis 14 Nov 2026, Asia/Jakarta. Diperbarui untuk follow-up **1a**.

## SHA

- Follow-up **1a** tip `integ/step1` (akan di-fast-forward ke `origin/main` bersama commit dokumen ini): lihat tip cabang setelah commit. Merge 1a: `9c1b2d919b804cb520bf377d5e1707fef212e2e6`. Layar: `51cd10f5276f1e96a5cccbda901b5fac533f63b4` (`?v=njh98-8`, sw v26).
- Step 1 live sebelumnya: `3500bda27d0c2c24c9460a04ce5d92f2bf744eba`.
- `origin/main` sebelum Step 1: `53cfe59be06b567a6ad2f51c84ea0e68eb5120b8`.
- Rollback: `ROLLBACK.md`. Revert terbaru dulu (`9c1b2d91` Layar `51cd10f` 1a, lalu `31e74f50` Layar `27a820b`, lalu `212c84a6` `a953045`, perbaikan builder, lalu merge Ellen dan ours) dengan `-m 1` pada merge. Jangan force-push.
- Fast-forward only; no force.

## UI Layar yang masuk Step 1 + 1a

- Follow-up 1a: `51cd10f5276f1e96a5cccbda901b5fac533f63b4` (`?v=njh98-8`, sw v26; merge `9c1b2d91`). Bar Aksi geser ke atas dari tombol AKSI (kolom vertikal, rata kanan); tidak menutupi LARI/dock/joystick; layar pendek memakai cap+scroll atau 2 kolom.
- HUD Step 1: `27a820b2a8792c4bc2de945856d71dd410708925` (`?v=njh98-7`, sw v25; merge `31e74f50`).
- Parent: `a953045acbedf1096cf8765758df53b22979d0be` (`?v=njh98-6`, sw v24) di atas `6ffffc8e` (sw v23).
- `shared/genesis-player.js` yang kotor di tree Layar **tidak** ikut, baik di Step 1 maupun 1a.

Perilaku UI: taskbar 28px, bar ikon Aksi yang geser ke atas, tab Kondisi, AKSI/LARI ikon transparan. Alat Dev hanya dengan `?dev=1`; tab Login tunggal disembunyikan (id tetap); baris tombol OK menempel di ponsel; Pipis di Tembok bisa dipilih. Saat interior 3D Kost/Warteg aktif, jendela placeholder Kost.exe / Warteg.exe tidak terbuka — itu disengaja.

## Yang nyata vs stub

Nyata:

- Kursi dipasangkan ke meja + seni Ibu Warteg.
- Kost Cove resmi Ellen `8e099eb` (lobby dulu, akses pacar, peta `?njhMap=1`).
- Seed 4P + profil start (Ichsan/Noor ke kamar kost sendiri, tamu hobo).
- Penguatan pencocokan site.
- UI Win98 sampai `51cd10f` (1a, `?v=njh98-8`, sw v26).
- Perbaikan skala Bangku Taman Ellen `5c6de78` plus `world.json` tanpa override 2.19×2.251. Facade Cove `4c3dc4d` / `00d0f7a` **tidak** masuk (Step 2).

Stub / follow-up:

- Enam JSON Beraksi hanya di `/workspace/beraksi-int-slots/` (bukan di repo). Play memakai fallback `scene:njh_int_*`.
- Catalog `file:null` untuk beberapa furnitur kamar.
- Masak / minimarket / fishing / token listrik kost = Step 2.
- Outfit LGR v4 masih ditunda.
- Cuplikan visual `wall_pee` (hadap tembok) dan re-audit overflow ponsel Guest1 setelah load = follow-up, bukan blocker 1a.

## Tes (sebelum push 1a)

- Suite unit integ (tanpa e2e/browser): **514 tes, 505 lulus, 9 gagal** — hanya 9 kegagalan lama yang sudah diizinkan (nama tes sama dengan run Step 1).
- Password: `office_pass` 0/0. Pola 4 angka sandi tes muncul mentah 5 kali sebagai kebetulan (bukan kredensial tersimpan; termasuk `seed:` di tes penggantian pohon). Hits rahasia nyata: 0.
- Cek HUD lokal (desktop 1280×720 + ponsel 390×844, login tes Ichsan): bar Aksi terbuka, geser ke atas dari AKSI, tidak menutupi AKSI/LARI/dock (joystick tidak tampil di viewport ini). Aset `?v=njh98-8`. Cuplikan: `local-1a-desktop-bar.png`, `local-1a-phone-bar.png`. Di desktop, jendela Cara Main masih sempat terbuka di tengah, tetapi tidak menimpa bar atau tombol. Pesan konsol 'Failed to load resource 404' (seni pintu lobi dan rambut mid_curtain) sudah ada sebelumnya, bukan regresi 1a; tidak ada `pageerror` JS. Hitung ketat `console.error` (termasuk 404 jaringan) memang non-zero di server lokal.

## Cuplikan

- Lokal 1a: `/workspace/integ-step1-shots/local-1a-desktop-bar.png`, `local-1a-phone-bar.png`
- Live Pages 1a: `/workspace/integ-step1-shots/live-1a-*.png` (diisi setelah verifikasi)
- Step 1 sebelumnya: `/workspace/integ-step1-shots/live-desktop-play.png`, `live-phone-play.png`

## Checkpoint

Salinan lengkap (live, nyata vs stub, rencana Step 2, dan daftar JANGAN DIOBRAK-ABRIK) ada di `CHECKPOINT-STEP1.md` dan `docs/CHECKPOINT-STEP1.md`.

## Worker

Tidak ada deploy Worker ke produksi. Login tes sudah hidup di Worker yang ada.

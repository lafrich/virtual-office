# Step 1 status (untuk Layar)

Ditulis 14 Nov 2026, Asia/Jakarta.

## SHA

- Pushed tip `integ/step1` → `origin/main`: the commit on `origin/main` after the 14 Nov 2026 (Asia/Jakarta) Step 1 fast-forward (this file rides in that tip). Previous live sha: `53cfe59be06b567a6ad2f51c84ea0e68eb5120b8`.
- `origin/main` sebelumnya (sebelum Step 1): `53cfe59be06b567a6ad2f51c84ea0e68eb5120b8`
- Rollback: `ROLLBACK.md`. Revert terbaru dulu (`31e74f50` Layar `27a820b`, lalu `212c84a6` `a953045`, perbaikan builder, lalu merge Ellen dan ours) dengan `-m 1` pada merge. Jangan force-push.
- Fast-forward only; no force.

## UI Layar yang masuk Step 1

- Final Step 1 HUD: `27a820b2a8792c4bc2de945856d71dd410708925` (`?v=njh98-7`, sw v25; merge `31e74f50`).
- Parent: `a953045acbedf1096cf8765758df53b22979d0be` (`?v=njh98-6`, sw v24) di atas `6ffffc8e` (sw v23).
- `shared/genesis-player.js` yang kotor di tree Layar **tidak** ikut.
- Saat push, `layar/win98-ui` masih di `27a820b` — belum ada commit lebih baru. Kalau datang belakangan, itu follow-up **1a**.

Perilaku UI: taskbar 28px, bar ikon Aksi, tab Kondisi, AKSI/LARI ikon transparan. Alat Dev hanya dengan `?dev=1`; tab Login tunggal disembunyikan (id tetap); baris tombol OK menempel di ponsel; Pipis di Tembok bisa dipilih. Saat interior 3D Kost/Warteg aktif, jendela placeholder Kost.exe / Warteg.exe tidak terbuka — itu disengaja.

## Yang nyata vs stub

Nyata:

- Kursi dipasangkan ke meja + seni Ibu Warteg.
- Kost Cove resmi Ellen `8e099eb` (lobby dulu, akses pacar, peta `?njhMap=1`).
- Seed 4P + profil start (Ichsan/Noor ke kamar kost sendiri, tamu hobo).
- Penguatan pencocokan site.
- UI Win98 sampai `27a820b`.
- Perbaikan skala Bangku Taman Ellen `5c6de78` plus `world.json` tanpa override 2.19×2.251. Facade Cove `4c3dc4d` **tidak** masuk (Step 2).

Stub / follow-up:

- Enam JSON Beraksi hanya di `/workspace/beraksi-int-slots/` (bukan di repo). Play memakai fallback `scene:njh_int_*`.
- Catalog `file:null` untuk beberapa furnitur kamar.
- Masak / minimarket / fishing = Step 2.
- Outfit LGR v4 masih ditunda.
- HUD/taskbar Layar setelah `27a820b`, kalau ada, = follow-up 1a.
- Cuplikan visual `wall_pee` (hadap tembok) dan re-audit overflow ponsel Guest1 setelah load = follow-up, bukan blocker push.

## Tes (sebelum push)

- Suite unit integ (tanpa e2e/browser): **514 tes, 505 lulus, 9 gagal** — hanya 9 kegagalan lama yang sudah diizinkan.
- Password: `office_pass` 0/0. Pola 4 angka sandi tes muncul mentah 5 kali sebagai kebetulan (bukan kredensial tersimpan). Hits rahasia nyata: 0.
- Smoke 4 ID (worker lokal, bukan akun office): login + creator + spawn kost/hobo, aturan pacar (Noor: kasur/WC ya, kulkas/lemari "Punya pacar"; tamu "Terkunci"), warteg Rp12.000, kentut, stub adegan, duduk bangku, HUD baru (tab Kondisi, bar Aksi, ikon AKSI/LARI) terlihat di desktop. `wall_pee` terpasang tapi hadap otomatis belum tertangkap. Overflow 0 di beberapa jalan desktop; re-audit ponsel Guest1 menyusul.

## Cuplikan lokal

- Bangku: `/workspace/integ-step1-shots/bangku-taman-sit.png`
- Ichsan kota + kamar: `desktop-t_ichsan-spawn.png`, `desktop-t_ichsan-kost.png`
- HUD baru: `/workspace/integ-step1-shots/hud-desktop-t_*.png` (dan phone jika ada)
- Live Pages: `/workspace/integ-step1-shots/live-*.png` (diisi setelah verifikasi)

## Worker

Tidak ada deploy Worker ke produksi. Login tes sudah hidup di Worker yang ada.

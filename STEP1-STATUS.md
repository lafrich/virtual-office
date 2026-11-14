# Step 1 status (untuk Layar)

Ditulis 14 Nov 2026, Asia/Jakarta. **Belum di-push ke `origin/main`.**

## SHA

- Tip lokal `integ/step1`: lihat `git rev-parse HEAD` di `/workspace/integ-step1` (docs ini ikut di-commit di atasnya).
- `origin/main` sebelumnya (live sekarang): `53cfe59be06b567a6ad2f51c84ea0e68eb5120b8`
- Rollback: `ROLLBACK.md` di repo yang sama. Revert terbaru dulu, lalu merge dengan `-m 1`.
- Fast-forward ke `origin/main` masih aman selama origin belum bergerak.

## UI Layar yang masuk Step 1

- Final Step 1: `a953045acbedf1096cf8765758df53b22979d0be` (`?v=njh98-6`, sw v24).
- Parent: `6ffffc8e99a50839a53b9e770319056e4c3c3c65` (`?v=njh98-5`, sw v23).
- `shared/genesis-player.js` yang kotor di tree Layar **tidak** ikut.
- Saat dicek sebelum keputusan push, `layar/win98-ui` masih di `a953045` — belum ada commit HUD/taskbar baru. Kalau datang belakangan, itu follow-up 1a.

Perilaku UI yang sudah masuk: Alat Dev hanya dengan `?dev=1`; tab Login tunggal disembunyikan (id tetap ada); baris tombol OK jendela menempel di ponsel; Pipis di Tembok bisa dipilih. Saat interior 3D Kost/Warteg aktif, jendela placeholder Kost.exe / Warteg.exe tidak terbuka — itu disengaja.

## Yang nyata vs stub

Nyata di tip ini:

- Kursi dipasangkan ke meja + seni Ibu Warteg.
- Kost Cove resmi Ellen `8e099eb` (lobby dulu, `doors[]` / akses pacar, peta `?njhMap=1`).
- Seed 4P + profil start (Ichsan/Noor ke kamar kost sendiri, tamu hobo).
- Penguatan pencocokan site.
- UI Win98 Layar di atas.
- Perbaikan skala Bangku Taman Ellen `5c6de78` (katalog 1.591×1.888, collision, blocking, sit) plus `world.json` tanpa override 2.19×2.251. Facade Cove `4c3dc4d` **tidak** masuk (itu Step 2).

Masih stub / follow-up:

- Enam JSON Beraksi hanya di `/workspace/beraksi-int-slots/` (tidak di repo, tidak ditulis ke Drive). Play memakai fallback in-code `scene:njh_int_*`.
- Catalog `file:null` untuk bathtub / sekat / fan / shoe_rack / registration_desk / water_tub.
- Masak / minimarket / fishing = Step 2.
- Outfit LGR v4 masih ditunda.
- Perbaikan HUD/taskbar Layar setelah `a953045`, kalau ada, = follow-up 1a.

## Tes

- Suite unit integ (tanpa e2e/browser): **514 tes, 505 lulus, 9 gagal** — hanya 9 kegagalan lama yang sudah diizinkan. Tes regresi bangku lulus.
- Password: tidak ada nilai rahasia `office_pass` (0/0). Pola 4 angka sandi tes muncul mentah 5 kali sebagai kebetulan (seed, versi build, placeholder OAuth, warna hex, pengali hash), bukan kredensial tersimpan.
- Smoke 4 ID (login tes lewat worker lokal, bukan akun office): Ichsan/Noor/Guest1/Guest2 lolos login + creator + spawn (kost `njh_kos_ichsan` / `njh_kos_noor`, tamu hobo). Aturan pacar: Noor di kamar Ichsan boleh kasur/WC, kulkas/lemari "Punya pacar"; tamu "Terkunci". Warteg makan **-Rp12.000** (Ibu Warteg `npc_ibu_warteg` ada di peta). Kentut dan stub adegan (`scene:njh_int_wc`, sumber fallback) oke. Duduk di bangku (`rest` / Duduk sebentar) oke.
- `wall_pee` terpasang (dekat + hadap tembok, kandung kemih ≥ 65) tetapi otomatisasi teleport belum memenuhi syarat hadap, jadi belum tertangkap di cuplikan.
- Overflow audit: 0 di desktop ke-4 ID dan ponsel Ichsan; 3 flag di ponsel Guest1 (diambil terlalu awal, kemungkinan overlay muat — detail tidak tersimpan).
- 404 konsol di dev: PNG kendaraan/pengendara yang belum ada di `origin/main` pipeline `site/`. Genesis/Emosi mencapai 2/2 jika pipeline disajikan.

## Cuplikan

- Bangku: `/workspace/integ-step1-shots/bangku-taman-sit.png`
- 4 ID desktop/ponsel: `/workspace/integ-step1-shots/desktop-t_*` dan `phone-t_*`
- Ichsan siap di kota + kamar kost: `desktop-t_ichsan-spawn.png`, `desktop-t_ichsan-kost.png`

## Worker

Tidak ada deploy Worker ke produksi. Login tes sudah ada di live Worker; smoke lokal memakai salinan wrangler di `/tmp/step1-worker` (bukan `srv/.dev.vars`, bukan akun office). Live Pages belum diverifikasi karena tip ini belum di-push.

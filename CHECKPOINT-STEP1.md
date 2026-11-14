# CHECKPOINT STEP 1 (14 Nov 2026, Asia/Jakarta)

Checkpoint resmi setelah Step 1 dan follow-up **1a** hidup. Teks baru saja; jangan menimpa bagian bot lain. Live hanya dengan kata Ichsan sendiri. Preview dulu.

## A. Yang live

- **Step 1** di `origin/main`: `3500bda27d0c2c24c9460a04ce5d92f2bf744eba` (Pages [Mainkan](https://lafrich.github.io/virtual-office/mainkan/)). Isi: merge Kost Cove lobby, peta NJH Ellen `8e099eb`, UI Win98 Layar sampai HUD `27a820b` (`?v=njh98-7`, sw v25), kursi menghadap meja, seni Ibu Warteg, seed 4P, perbaikan Bangku Taman.
- **Follow-up 1a**: merge `9c1b2d919b804cb520bf377d5e1707fef212e2e6` dari Layar `51cd10f5276f1e96a5cccbda901b5fac533f63b4` (`?v=njh98-8`, sw v26). Bar Aksi geser ke atas dari tombol AKSI (kolom vertikal, rata kanan) dan tidak menutupi LARI / dock / joystick; layar pendek memakai cap+scroll atau 2 kolom. File `shared/genesis-player.js` yang kotor di tree Layar **tidak** ikut. Tip cabang `integ/step1` yang membawa file ini adalah sha yang di-fast-forward ke `origin/main` (lihat `git log -1` setelah push).
- **Sha sebelumnya** (sebelum Step 1): `53cfe59be06b567a6ad2f51c84ea0e68eb5120b8`. Sha sebelumnya sebelum 1a: `3500bda27d0c2c24c9460a04ce5d92f2bf744eba`.
- **Rollback:** `ROLLBACK.md`. Fast-forward only, jangan force-push. Revert terbaru dulu, merge memakai `-m 1`:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git revert --no-edit -m 1 9c1b2d91   # Layar 51cd10f (?v=njh98-8, sw v26) follow-up 1a
git revert --no-edit -m 1 31e74f50   # Layar 27a820b (?v=njh98-7, sw v25)
git revert --no-edit -m 1 212c84a6   # Layar a953045 (?v=njh98-6, sw v24)
git revert --no-edit 2c81b154        # builder.js playerMode / openFor(nearest.o) restore
git revert --no-edit -m 1 9e222a90   # Layar 6ffffc8 (?v=njh98-5, sw v23)
git revert --no-edit -m 1 9dc66aeb   # Ellen map 8e099eb
git revert --no-edit -m 1 85f28c3d   # ours 0dcc793
# lalu bump sw.js jika build rollback harus turun dari v26, dan push --ff-only
```

Tidak ada deploy Worker ke produksi. Login tes sudah hidup di Worker yang ada. Worker, password, auth secret, dan vault tidak diubah.

### Nyata vs stub

**Nyata**

- Kursi dipasangkan ke meja + seni Ibu Warteg.
- Kost Cove resmi Ellen `8e099eb` (lobby dulu, akses pacar, peta `?njhMap=1`).
- Seed 4P + profil start (Ichsan/Noor ke kamar kost sendiri, tamu hobo).
- Penguatan pencocokan site.
- UI Win98 sampai `51cd10f` (1a, `?v=njh98-8`, sw v26).
- Perbaikan skala Bangku Taman Ellen `5c6de78` plus `world.json` tanpa override 2.19×2.251.

**Stub / follow-up (bukan blocker 1a)**

- Enam JSON Beraksi hanya di `/workspace/beraksi-int-slots/` (bukan di repo). Play memakai fallback `scene:njh_int_*`.
- Catalog `file:null` untuk beberapa furnitur kamar.
- Masak / minimarket / fishing / token listrik kost = Step 2.
- Outfit LGR v4 dan Genesis base preview = belum live (preview dulu).
- Facade Cove Ellen `4c3dc4d` / `00d0f7a` **tidak** masuk Step 1 (Step 2).
- Cuplikan visual `wall_pee` (hadap tembok) dan re-audit overflow ponsel Guest1 setelah load.

### Tes sebelum push 1a

- Suite unit integ (tanpa e2e/browser): **514 tes, 505 lulus, 9 gagal** — hanya 9 kegagalan lama yang sudah diizinkan.
- Password: `office_pass` 0/0. Pola 4 angka sandi tes muncul mentah 5 kali sebagai kebetulan (bukan kredensial tersimpan). Hits rahasia nyata: 0.
- Cek HUD lokal desktop + ponsel dan verifikasi live: lihat `STEP1-STATUS.md` dan `/workspace/integ-step1-shots/local-1a-*.png`, `live-1a-*.png`.

### Pelajaran mesin yang wajib diingat (masalah / penyebab / aturan / cek)

- **Pelajaran 9 (MUST) — lantai yang menulis depth memotong prop.** Billboard iso menyertakan berlian tanah di bawah kaki; lantai / dinding jauh / ground dengan `depthWrite: true` mengiris sprite jadi garis diagonal. Aturan: permukaan itu tidak menulis depth ke atas sprite (`VLSemestaInteriorView.DRAW_POLICY`); jejak kaki dipaksa masuk ruangan (`snapFootprint`). Cek: `inspectPropClips` di `tests/semesta-interior-view.test.cjs` atas **semua** interior.
- **Pelajaran 11 — string tes `builder.js` hilang setelah merge auto.** Auto-merge menelan `if(playerMode)return; // Preview` dan `openFor(nearest.o)`. Aturan: jaga string yang diuji; kunci `njhMapPreview` di baris sendiri; jangan melemahkan regex tes. Cek: `tests/mainkan-smoke.test.cjs`, `tests/bangun-ruang-warteg-3d.test.cjs`.
- **Pelajaran 12 — 404 `genesis-source.js` di server vo-only.** Path `/virtual-life-asset-pipeline/genesis-source.js` merujuk repo Pages saudara, bukan bug di pohon vo. Aturan: dev lokal harus menyajikan kedua pohon; jangan "memperbaiki" dengan memindah file. Cek: Mainkan mencapai "2/2 layer sprite siap".
- **Pelajaran 13 — override ukuran bangku di `world.json`.** Instance 2.19×2.251 menimpa katalog 1.591×1.888 dan merusak collision. Aturan: hapus override ukuran kecuali disengaja; `collision: true`, `blocking: yes`. Cek: `tests/njh-map-preview.test.cjs`. Detail: `docs/NJH-ENGINE-LESSONS.md`.

## B. Rencana Step 2

Preview dulu di cabang yang sesuai. **Live hanya dengan kata OK Ichsan sendiri.** Bukan lewat relay agen.

- **Masak:** hook `recipes` / `cook`, inventory / `moveItem`, sesuai skema Layar (`NJH-COOKING-SCHEMA.json` / dokumen masak).
- **Minimarket:** site supermarket dengan shop/buy. Paket 95 item Gerak di `/workspace/supermarket/` (perbaikan rak interior, register 8 prop baru + 3 recolour, cat dinding, pintu `njh_door_minimarket`). Eksterior Ellen `db5b85c` di spot peta (−26.5, 56), 5×4 tile; bangku taman digeser ke (−22.5, 55.9) dan tetap memakai perbaikan ukuran + collision.
- **Mancing:** hook `fishStart` / `fishInput` di site `fish` / dermaga.
- **Token listrik kost:** drain, habis = storage / kulkas / masak mati, topup Rp20.000 / 5 unit.
- **Fasad Cove Ellen:** pakai perbaikan lebih baru `00d0f7a`, **bukan** `4c3dc4d`.
- **Bersih-bersih peta:** backup dulu, lalu daftar setiap peta/dunia yang muncul sebagai playable atau selectable tetapi **bukan** peta NJH Step 1 (termasuk draft lama, peta tes, sisa virtual-office). Kirim daftar ke Ellen untuk OK Ichsan per item. **Jangan hapus sebelum backup dan review Ichsan.**
- **Preview Genesis base (LGR):** rig sendi v4, outfit `tee_v4` + `trousers_v4` (M/F, termasuk strip `_under` dan `_under_own`), fallback sprite pose tubuh bawah. Lengan atas yang berayun ≥60° ke luar digambar di atas torso (sudah di-OK Ichsan, preview only). Kepala dan Emosi tidak boleh berubah. Live perlu OK Ichsan.
- **Follow-up sisa Step 1:** cuplikan visual `wall_pee` (hadap tembok) dan re-audit layout/overflow ponsel Guest1 setelah world selesai load.

### Siapa mengerjakan apa

- **Baymax:** logika dan hook di `preview/njh-step2` (inventory, recipes/cook, shop/buy, fish, token listrik, integrasi site).
- **Layar:** UI di atas mock SIMULASI, harus cocok dengan `docs/HOOKS-STEP2.md` (kontrak hook, bukan implementasi mesin).
- **Gerak:** animasi sudah di DB; batch minimarket / masak / mancing memakai id yang sudah ada, jangan ganti id.
- **Ellen:** penempatan peta, aset, fasad Cove `00d0f7a`, eksterior minimarket `db5b85c`.

## C. JANGAN DIOBRAK-ABRIK (untuk AI lain yang melanjutkan)

Daftar ini wajib dibaca sebelum mengubah kode, merilis, atau "membersihkan" apa pun. Setiap butir punya alasan.

1. **Sistem Emosi dan template dasar LGR (kepala / Emosi tidak disentuh).** Perubahan di sini merusak wajah dan ekspresi semua pemain; rest pose live harus tetap identik di piksel.
2. **LFB dan LGR adalah satu-satunya fondasi.** Jangan menghidupkan jalur seni atau rig lama (V6P di Mainkan sudah pensiun); aset baru harus masuk lewat LFB/LGR.
3. **Jiwa adalah pusat konfigurasi (harga hidup di situ).** Harga, cap gaji, dan modul gameplay bukan angka hard-code di UI; ubah di Jiwa supaya satu sumber kebenaran.
4. **Sistem auth/login, secret Worker, dan `players_4p.txt`.** Jangan pernah mencetak atau menulis password, `TOKEN_KEY`, atau hash ke chat, catatan, atau file rilis. Kredensial tes hanya di `/home/box/.config/vo/players_4p.txt` (chmod 600). Jangan buat akun produksi di tes.
5. **ID tes Ichsan / Noor / Guest1 / Guest2 dan seed-nya.** Profil start dan uang/kost sudah disetel; jangan menimpa seed atau memakai ID lain sebagai tes resmi 4P.
6. **Aturan deploy: fast-forward only, no force-push, `ROLLBACK.md`, preview dulu, live hanya dengan kata Ichsan sendiri.** Relay agen bukan izin. Fetch origin dulu; kalau bukan FF, berhenti dan laporkan.
7. **Warteg Kharisma adalah standar interior wajib.** Tata letak, meja, dan kursi baru harus mengikuti standar ini, bukan merombak Kharisma supaya cocok dengan draft lain.
8. **Penjaga no-clip `inspectPropClips` (pelajaran 9) dan cek kursi menghadap meja (`inspectChairTables`).** Tes ini merata ke semua interior; jangan dilemahkan atau di-skip supaya preview "lulus".
9. **Model pintu / lobby / akses Kost Cove dan skema `doors[]`.** Lobby dulu, lalu kamar; akses pacar vs `owner_only` sudah disepakati. Jangan buka kamar langsung dari fasad atau mengganti skema pintu.
10. **DB animasi Beraksi / Bergerak: DB yang menang, id stabil.** Jangan ganti id gerakan yang sudah di-hook; revisi menimpa entri yang sama, bukan membuat id baru.
11. **Id scene interaksi (`scene:njh_int_*` dan kawanannya).** Hook dan fallback sudah memakai id ini; mengganti id memutus AKSI dan stub Beraksi.
12. **Master Drive Ichsan: jangan diubah; buat file baru saja.** Progress dan recap boleh ditambahi di bagian Baymax, bukan menimpa bagian bot lain atau dokumen master.
13. **Edit lokal `shared/genesis-player.js` di tree Layar jangan di-commit.** File itu kotor di worktree Layar dan sengaja dikecualikan dari merge Step 1 dan 1a.
14. **Virtual Office lama sudah pensiun: jangan dihidupkan lagi.** Rute office sudah dihapus; Worker live hanya health + login tes; jangan mengembalikan office.html atau secret office.
15. **9 tes unit yang sudah diketahui gagal: jangan "diperbaiki" dengan menghapus atau melemahkan tes.** Kegagalan itu lama dan diizinkan; tes baru atau regresi di luar ke-9 itu adalah blocker.

## D. Referensi

- Status singkat: `STEP1-STATUS.md`
- Rollback: `ROLLBACK.md`
- Pelajaran mesin: `docs/NJH-ENGINE-LESSONS.md`
- Cuplikan: `/workspace/integ-step1-shots/`

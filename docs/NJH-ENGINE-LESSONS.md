# NJH — pelajaran mesin

Catatan singkat biar kesalahan mekanik yang sudah ketemu tidak diulang. Entri yang belum hidup ditandai **preview, belum di-approve**.

## 1. Kendaraan miring / tiba-tiba tilt — preview, belum di-approve

- **Masalah:** TransJakarta dan kendaraan lain kadang miring, apalagi di tepi layar.
- **Penyebab:** bidang sprite memakai `lookAt` ke posisi kamera per objek. Kamera Semesta ortografis iso, sinarnya sejajar; yaw yang beda di setiap objek memutar bus panjang.
- **Aturan:** kunci bidang tegak, yaw bersama π/4. Yang diganti hanya view `se` / `sw` / `ne` / `nw`. Jangan rotasi bebas, jangan `lookAt` per objek.
- **Cek:** `tests/semesta-vehicle-collider.test.cjs` (iso plane lock); preview 4 arah tidak boleh miring.

## 2. Collider tidak pas dengan roda — preview, belum di-approve

- **Masalah:** bus ngerem untuk benda yang secara visual belum tersentuh; kotak collider bergeser seperti bayangan di depan roda.
- **Penyebab:** collision pakai grid editor 2×1, atau kotak sumbu-dunia (X/Z), padahal roda duduk di garis kontak iso (proyeksi bidang yaw π/4). Offset bidang di sumbu X dunia juga menggeser badan.
- **Aturan:** collider dan depth box dari jejak roda (alpha bbox / garis kontak roda), bukan canvas atau grid editor. Jejak tanah adalah OBB di bawah garis roda, porosnya sumbu iso, bukan kotak axis-aligned. Offset bidang mengikuti poros itu (`planeWorldOffset`), bukan `position.x` dunia. Jangan ukur lebar jejak dari pita horizontal pendek di piksel paling bawah: seni iso 3/4 menaruh roda jauh beberapa puluh piksel lebih tinggi, jadi pita 22% hanya menutupi gandar dekat. Pakai lebar body opak penuh. Pusat OBB di belakang bidang (kedalaman ke dalam layar) supaya tepi depan tepat di garis roda; kalau dipusatkan di bidang, setengah kotak menonjol di depan roda.
- **Cek:** `footprintMatchesContact` di `tests/semesta-vehicle-collider.test.cjs` (semua 12 kendaraan × 4 view, toleransi 4px); `transjakarta-4dir.png` — strip kuning harus tepat di bawah roda.

## 3. Rumput / ground cover melayang — preview, belum di-approve

- **Masalah:** rumput dan penutup tanah terlihat mengambang di atas plane.
- **Penyebab:** pivot dari tengah canvas atau apron furniture; pohon saja yang di-ground otomatis. Jarak 0.055 tile kelihatan jelas pada tuft pendek.
- **Aturan:** pivot ground cover = piksel opak paling bawah (abaikan bayangan alpha 56/90). Clearance 0.006. Jangan pakai `furnitureApronLift` untuk `rumput_kota_*` / `semak_kota_*`.
- **Cek:** `tests/semesta-vegetation-ground.test.cjs` (setiap aset ground menyentuh tanah setelah dijatuhkan).
- **Catatan seni:** `rumput_kota_rumpun` hanya batang tipis; pangkalnya bayangan, bukan piksel opak. Setelah di-ground, tuft tetap terlihat seperti batang longgar tanpa bonggol — itu art, bukan pivot yang masih di tengah canvas.

## 4. Sendi LGR bolong / nempel / kaki semrawut — preview, belum di-approve

- **Masalah:** bolong di pangkal paha, bagian badan terlihat nempel, pose duduk jelek.
- **Penyebab:** isian sendi ~4px menutup celah sempit (ketiak, siku, sela kaki-lengan) jadi satu gumpalan. Seni paha mulai 5–8px di bawah pivot, jadi saat diputar muncul lubang di pinggul. Kaki lurus yang diputar jauh (duduk, jongkok) jadi bergerigi.
- **Aturan:** jangan pakai isian sendi lebar (4px). Pivot pinggul harus pas di awal seni paha. Untuk pose besar, gambar kaki per pose per 4 arah, jangan mengandalkan rotasi sprite lurus. Detail: `/workspace/lgr-joint-audit/AUDIT.md`.
- **Cek:** audit sebelum-sesudah di folder itu; pose berdiri tidak boleh geser kepala/Emosi.

## 5. Rotasi Bangun Ruang dan sajadah mushola

- **Masalah:** sajadah dikira menghadap pintu, lalu diputar 180° dan malah salah arah.
- **Penyebab:** 0/90/180/270 = `sw` / `se` / `ne` / `nw`. Lengkung sajadah Ellen di rot 0 sudah menghadap dinding belakang (kiblat).
- **Aturan:** jangan memutar sajadah mushola 180° “supaya ke kiblat” tanpa cek arah seni. Rotasi furnitur mengikuti pemetaan 0/90/180/270 = sw/se/ne/nw.
- **Cek:** bandingkan seni rot 0 dengan dinding belakang, bukan dengan pintu.

## 6. Yaw iso bersama untuk semua billboard sprite — preview, belum di-approve

- **Masalah:** prop dan grass di tepi peta bisa ikut “miring” seperti kendaraan.
- **Penyebab:** loop billboard di `builder.js` juga memakai `lookAt` per objek, padahal `pipelineGround.faceCamera` sudah memakai yaw π/4 yang tetap.
- **Aturan:** semua bidang iso tegak memakai yaw bersama π/4, sama seperti kendaraan.
- **Cek:** `tests/semesta-vehicle-collider.test.cjs` memastikan `builder.js` tidak lagi `atan2(camera.position.x-root.position`.

## 7. Jejak kendaraan harus mengikuti diagonal iso, bukan palang mendatar — preview, belum di-approve

- **Masalah:** kotak collider terlihat palang mendatar di roda dekat, sementara badan bus di layar berjalan miring mengikuti sumbu iso. Keempat view terlihat sama, padahal dua arah jalan di satu diagonal dan dua di diagonal lawan.
- **Penyebab:** OBB memakai yaw π/4 milik bidang billboard (garis dasar sprite, mendatar di layar). Arah jalan kendaraan adalah world ±X atau ±Z, yang di kamera iso 2:1 justru tampak sebagai diagonal.
- **Aturan:** bidang sprite tetap tegak, yaw π/4, hanya view yang diganti. Jejak tanah terpisah: poros panjang mengikuti arah jalan (se/nw = world X, sw/ne = world Z). Jajar genjang iso duduk di bawah seluruh bodi, dari roda belakang ke roda depan. Jangan palang horizontal di garis billboard.
- **Cek:** `footprintMatchesContact` membandingkan poros panjang jejak yang diproyeksikan dengan garis kedua kontak roda di seni 2:1, toleransi ~5°. `transjakarta-4dir.png` — jajar genjang kuning harus mengikuti diagonal bus di setiap view, tidak identik di keempat arah.

## 8. Furniture interior kepotong di tepi layar — preview, belum di-approve

- **Masalah:** kasur, lemari, dan furnitur di dinding belakang sering terpotong garis lurus di bagian atas. Shower, kloset, dan wastafel di dinding kanan hilang. Ini sering muncul di Mainkan, pratinjau interior, dan Bangun Ruang/Semesta.
- **Penyebab:** (1) Kamera masuk ruangan memakai `focusCameraAt(pintu, 8)` — nilai minimum `viewSize`. Di kanvas desktop (~1280×760, `halfH=4`) puncak kasur (camY ≈ 5.11) dan lemari (≈ 4.66) keluar dari frustum atas. Bukan `clippingPlanes`, bukan near-plane 0.1, dan bukan bidang sprite yang lebih kecil dari PNG. (2) Follow kamera tiap frame mengembalikan fokus ke pemain dan membatalkan framing ruangan. (3) Dinding sisi dekat (dinding kanan, max-X) ikut digambar; kamera iso +X+Z melihat ke −X/−Z jadi dinding itu di depan shower/kloset/wastafel dan menutupinya. (4) `.active-asset-bar` tidak disembunyikan di mode pemain, merampas ~41px di atas kanvas (bukan penyebab potongan 3D, tapi mengecilkan viewport).
- **Aturan:** kamera default interior membingkai seluruh bbox ruangan + puncak prop tertinggi, dengan pad, lalu digeser agar muat di area kanvas yang tidak tertutup HUD (`VLSemestaInteriorView.fitInteriorCamera` + `playInset`). Kunci kamera (`cameraLocked`) selama di dalam ruangan agar follow tidak merusak framing. Gambar hanya dua dinding jauh (cutaway iso); jangan dinding sisi kamera. Tinggi dinding = 128px seni (`WALL_HEIGHT` ≈ 3.266). Billboard interior memakai yaw bersama π/4. Sembunyikan `.active-asset-bar` di `semesta-player.css`. Peringatan `console.warn` jika ada prop yang masih terpotong.
- **Cek:** `tests/semesta-interior-view.test.cjs` — `viewSize` 8 di pintu harus terdeteksi memotong kasur/lemari; fitter tidak boleh memotong prop di setiap scene katalog; `farWalls` meniadakan dinding kanan untuk kamera +X+Z; ukuran bidang ≥ ukuran seni. Cuplikan kost/warteg desktop+ponsel dan crop sebelum/sesudah di `/workspace/main-interiors-shots/`.

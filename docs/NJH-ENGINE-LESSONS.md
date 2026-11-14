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

## 9. MUST: prop sprite tidak boleh terpotong — preview, belum di-approve

- **Masalah:** Setelah kamera sudah membingkai seluruh ruangan, furnitur di dinding kanan (kompor, kulkas, shower, kloset jongkok, wastafel) masih terpotong garis diagonal. Di warteg, kulkas dan kompor di dinding kanan kena potongan yang sama. Bagian bawah benda terlihat seperti segitiga.
- **Penyebab:** bidang billboard iso tegak, yaw π/4. Seni PNG menyertakan “berlian” lantai di bawah titik pijakan (pivot biasanya di 60–80% tinggi seni, kadang di tengah). Dasar bidang itu masuk ke bawah lantai 3D (`y ≈ 0.045`, `depthWrite: true`). Irisan mendatar dunia × kamera iso 2:1 tampak sebagai garis diagonal di layar. Tanah tak terbatas (`baseGround` di `y ≈ 0.002`, juga `depthWrite`) memakan dasar sprite yang keluar dari lantai ruangan, jadi seni tidak menjulur ke rumput. Dinding jauh yang menulis depth bisa mengiris billboard yang menembus dinding belakang. Ini bukan `clippingPlanes` dan bukan frustum kamera (pelajaran 8).
- **Aturan (MUST):** tidak boleh ada prop yang terpotong oleh dinding, lantai, mask, atau tepi kamera — merata di semua interior play dan templat Bangun Ruang. Lantai, dinding jauh, dan ground tidak boleh `depthWrite` ke atas sprite (`VLSemestaInteriorView.DRAW_POLICY`). Jejak kaki prop dipaksa muat di dalam batas ruangan (`snapFootprint`). Kamera tetap membingkai seluruh bbox + puncak prop (pelajaran 8). Jangan mengangkat seluruh bidang sampai kaki mengambang; dasar iso harus tetap terlihat.
- **Cek:** `tests/semesta-interior-view.test.cjs` — kebijakan lama (`floor.depthWrite: true`) harus terdeteksi memotong kloset/shower/kompor kost; kebijakan resmi tidak boleh memotong prop di SETIAP scene interior di repo (play interiors + templat Bangun Ruang / Indonesia pack / Kharisma). Tes ini jalan di suite biasa; preview yang masih memotong prop harus gagal. `inspectPropClips` membandingkan sampel bidang sprite dengan occluder yang menulis depth dan frustum. Cuplikan crop 2× dinding kanan: `/workspace/main-interiors-shots/kost-right-wall-before-after.png`.

## 10. MUST: kursi selalu dipasangkan ke meja — preview, belum di-approve

- **Masalah:** Di warteg, kursi menghadap pintu, bukan meja, dan satu kursi yatim berdiri di lorong (sekitar tengah ruangan). Di kost, kursi makan mengambang satu petak dari meja, dengan celah kosong di antaranya.
- **Penyebab:** rotasi kursi memakai arah default `sw` (rot 0), yang menghadap ke pintu/kamera (r membesar). Penempatan tidak dicek terhadap jejak meja/etalase. Kursi yatim (`Bangku Samping` di kolom 7) tidak punya meja tetangga. Di kost, kursi di `(0,3)` dan `dining_table` 2×1 di `(2,3)` menyisakan petak `(1,3)` kosong.
- **Aturan (MUST):** setiap kursi (`chair`) harus menempel (sisi 4-arah, bukan diagonal) pada petak meja/etalase/kasir/meja kerja (`table`, `dining_table`, `counter`, `food_vitrine`, `cashier`, `desk`, `study_desk`, `workbench`, `registration_desk`, `checkout`, `laundry_counter`). Rotasi kursi menghadap permukaan itu (`DIR=['sw','se','ne','nw']` = rot 0/90/180/270; vektor hadap `sw(-c,+r)`, `se(+c,+r)`, `ne(+c,-r)`, `nw(-c,-r)`). Tidak boleh ada kursi yatim. Jalur dari pintu (petak entrance dan satu petak ke dalam, plus jalan ke meja) tidak boleh terhalang kursi. Meja dan etalase Kharisma tidak dipindah — hanya kursi yang digeser/diputar. Berlaku merata di semua interior play dan templat Bangun Ruang / Indonesia pack.
- **Cek:** `inspectChairTables` + tes di `tests/semesta-interior-view.test.cjs` jalan di SETIAP scene interior di repo (play interiors + templat Bangun Ruang / Indonesia pack / Kharisma). Gagal jika ada kursi yatim, hadap salah, atau jalur pintu terhalang. Tata letak lama warteg (empat kursi rot 0, satu yatim di `(7,4)`) harus terdeteksi rusak. Cuplikan sebelum/sesudah warteg: `/workspace/main-interiors-shots/warteg-chairs-before-after.png`.

## 11. String tes `builder.js` hilang setelah merge auto

- **Masalah:** Setelah merge peta Ellen ke `integ/step1`, dua tes unit baru gagal: `mainkan-smoke` mencari `if(playerMode)return; // Preview`, dan `bangun-ruang-warteg-3d` mencari `interiorPreview.openFor(nearest.o)`.
- **Penyebab:** Auto-merge menggabungkan penjaga simpan jadi `if(playerMode||njhMapPreview)return` dan mengganti `openFor(nearest.o)` menjadi `openFor(openObj)` (objek pintu peta Ellen). Perilaku benar, tetapi string yang diuji tes hilang.
- **Aturan:** Jaga string yang diuji tetap utuh. Kunci `njhMapPreview` ditaruh di baris sendiri. Panggil `openFor(nearest.o)` jika pintu tidak membungkus bangunan, selain itu `openFor(openObj)`. Jangan "memperbaiki" tes dengan melemahkan regex.
- **Cek:** `tests/mainkan-smoke.test.cjs`, `tests/bangun-ruang-warteg-3d.test.cjs`. Suite integ hanya boleh gagal di 9 tes lama yang sudah diizinkan.

## 12. `genesis-source.js` 404 di server vo-only

- **Masalah:** Mainkan meminta `/virtual-life-asset-pipeline/genesis-source.js` (juga `emosi-source.js` dan jembatan Semesta). Server statis yang hanya merilis pohon `virtual-office` mengembalikan 404, pratinjau karakter dan peta tidak lengkap.
- **Penyebab:** Path itu merujuk repo Pages saudara, bukan `shared/genesis-source.js` di dalam vo. File yang sama ada di `virtual-life-asset-pipeline/site/`.
- **Aturan:** Untuk smoke/dev lokal, sajikan root yang punya kedua pohon (`/virtual-office/...` dan `/virtual-life-asset-pipeline/...` → `site/`). Jangan menganggap 404 genesis di server vo-only sebagai bug di file vo. Live Pages sudah memisahkan kedua repo.
- **Cek:** buka `/virtual-life-asset-pipeline/genesis-source.js` di layout dev; Mainkan harus mencapai "2/2 layer sprite siap".

## 13. Ukuran instance bangku menimpa katalog

- **Masalah:** Bangku Taman (`pipeline:bangku_taman`, mis. `njh-atm-16`) terlihat kebesaran dan memotong lingkungan. Di `world.json`, instance masih 2.19×2.251.
- **Penyebab:** `width`/`height` per instance menimpa ukuran katalog. `blocking: auto` atau `collision: false` di instance juga menimpa katalog.
- **Aturan:** Ukuran resmi katalog = 1.591×1.888 wu (PX/PY native), `collision: true`, `blocking: yes`, interaksi `sit`. Hapus override ukuran instance kecuali ukurannya memang disengaja. Berlaku di city JSON peta NJH dan `world.json`.
- **Cek:** `tests/njh-map-preview.test.cjs` ("bangku taman scale and collision match the LFB guide"). Cuplikan: `/workspace/integ-step1-shots/bangku-taman-sit.png`.

## 14. MUST: peta NJH harus menjadi default Mainkan dan Semesta

- **Masalah:** Setelah Step 1 live, peta resmi NJH (`city-njh-semesta-draft1-with-pending`, Kampung Kali Kebon Sirih) hanya terbuka dengan `?njhMap=1`. Tautan landing `./mainkan/` dan Semesta tanpa flag masih memuat leftover Kebon Sirih / Reference City dari `world.json`, plus draft browser atau kota Drive "Jakarta City".
- **Penyebab:** `mainkan/app.js` `startWorld()` hanya meneruskan `njhMap=1` jika URL luar sudah memilikinya. `builder.js` memuat `world.json`, lalu `VLReferenceCity` dan `VLKebonSirihStyle.upgrade`, lalu localStorage, kecuali flag itu aktif.
- **Aturan:** Satu-satunya peta yang boleh dimainkan atau dipilih adalah peta NJH resmi. Mainkan selalu memasang `njhMap=1`. Semesta memuat `VLNjhMapPreview.loadCity()` secara default. Jangan fallback ke `world.json`, Reference City, Jakarta City, atau City Sample. Draft / Cloud Projects / Jiwa `?city=` / browser kota Bangun Ruang menolak dokumen non-NJH. `?njhMap=0` hanya untuk tes.
- **Cek:** buka `/mainkan/` tanpa flag (desktop dan ponsel) — spawn di peta NJH (kost Ichsan untuk akun tes). Buka `/world-builder/` tanpa flag — editor Semesta menampilkan Kampung Kali Kebon Sirih. Tombol Jakarta / Reference / City Sample tidak ada. Suite unit: hanya 9 kegagalan lama yang diizinkan.

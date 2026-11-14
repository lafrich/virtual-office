# CHECKPOINT STEP 2 (14 Nov 2026) — Baymax

Blok ini milik Baymax. Jangan menimpa blok Layar, Ellen, atau Gerak. Ditulis 14 Nov 2026 13:40 WIB (Asia/Jakarta), setelah Step 2 live.

Yang live
- Step 2: d9abd6f035963001aa1416007296ba8bfdd49ea9 di origin/main, fast-forward only (tanpa force-push). sw v28, ?v=njh-step2-2. Pages: https://lafrich.github.io/virtual-office/mainkan/
- Sha sebelumnya: ceb87da8886897d6fc6413cb2e15d985ebef5c90 (peta NJH-only, sw v27, ?v=njh-only-map-1), dan sebelum itu 28dcca42b6739fd36c12b78e6dd2aa566e1e0adf (checkpoint Step 1 / 1a).
- Isi: logic + hook 0a850e2c; titik mancing Ellen 1a20b3c1 / f36e173c (merge 075a3e30); eksterior minimarket Ellen db5b85c6 + fasad Cove 00d0f7a; merge origin/main ceb87da8; UI Step 2 Layar 1ff0fa3f (shared/genesis-player.js tidak ikut).
- Peta NJH-only tetap live. Ichsan sudah konfirmasi: "Oke biarin NJH-only map tetap live" (lewat Ellen). Backup map yang dibersihkan ada di folder Drive https://drive.google.com/drive/folders/1UwOF6OzTj6y6fc1ldv9Xmg9pfBIMuiS5

Rollback (ROLLBACK.md di repo)
- main di-fast-forward dan merge dipertahankan. Untuk rollback tanpa force-push, kembalikan tree sebelumnya dalam satu commit baru:
- git fetch origin; git checkout main; git pull --ff-only origin main
- git checkout ceb87da8886897d6fc6413cb2e15d985ebef5c90 -- .
- git commit -m "rollback: step 2 (restore ceb87da8 tree)"
- Naikkan sw.js ke v29 supaya ponsel melepas v28, lalu push --ff-only.
- Tidak ada migrasi storage. Field save baru hanya tambahan; save lama tetap terbuka. Worker, sandi, dan secret tidak berubah.

Nyata vs stub
Nyata: wadah Tas/Kulkas/Lemari (inventory, moveItem, eatItem; kulkas/lemari owner_only, pacar/orang lain dapat tombol AKSI nonaktif plus alasannya); masak (recipes, cook, 38 resep dari manifest Gerak, resep dikenal + eksperimen, butuh kompor di kost sendiri + token); NJH Mart (interior Gerak, shopList/buy/checkoutCart, 54 barang + token_listrik, harga di jiwa/njh-cooking-catalog.js); mancing (fishSpots/fishStart/fishInput, dua titik, jarak 2.5, fish legacy tetap jalan); token listrik kost (token/topupToken, Rp20.000 / 5 unit, drain 1 unit per 240 menit game + kulkas, token 0 mematikan kulkas/lemari/masak); UI Layar memakai hook asli, tanpa label SIMULASI saat hook ada.
Stub / placeholder: animasi Step 2 (cook, cook_stir, hand_over, fishing_cast, fishing_wait(_sit), use_storage, eat*) sudah tersambung ke id yang ada tapi masih placeholder; minimarket belum punya paint hook; 8 tipe + 3 recolor minimarket belum ada di registry Bangun Ruang.

Tes: 527 tes, 518 lulus, 9 gagal (hanya kegagalan lama). Smoke 4 ID dengan hook asli (Worker lokal sementara, bukan akun produksi): desktop Ichsan/Noor/Guest1/Guest2 dan ponsel Ichsan/Guest1 lulus beli/masak/mancing/token (tamu ditolak masak dan isi token: "Perlu kost dahulu."). Tidak ada SIMULASI yang tampil. Cek live desktop + ponsel: 13 hook ada, 0 error halaman.

Pelajaran mesin (masalah / penyebab / aturan / cek)
- Pelajaran 15 — hitungan objek peta di tes berubah. Step 2 menambah NJH Mart dan Tempat Mancing Kali Selatan, jadi tes main gagal (152 objek, bukan 150; 9 kunci katalog, bukan 7). Aturan: saat menambah objek/aset ke peta NJH, perbarui hitungan di kedua tes dalam commit yang sama, beri komentar objek barunya. Cek: node --test tests/*.test.cjs hanya 9 gagal lama.
- Pelajaran 16 — login tes lokal. app.js hanya menerima apiBase https:// atau http://localhost:port (bukan 127.0.0.1), dan Worker hanya mengizinkan origin lafrich.github.io. Aturan: untuk smoke lokal, ganti config.js lewat route Playwright ke http://localhost:<port> dan jalankan salinan Worker di /tmp dengan ORIGIN lokal serta hash sandi acak baru; jangan sentuh Worker produksi atau .dev.vars bersama; sandi tidak pernah dicetak. Cek: /tmp/step2-smoke.mjs lolos login 4 ID.
- Pelajaran 17 — UI SIMULASI harus diam saat hook asli ada. Aturan: NJH98Step2.live() (ada SemestaLifePlay.token + inventory) mematikan semua label SIMULASI/PLACEHOLDER dan tombol AKSI tiruan; id Step 2 dari nearbyActions() asli membuka jendela Layar yang memanggil hook asli. Cek: smoke simVisible kosong, simInShop false di desktop dan ponsel.

Follow-up terbuka
- Ukuran prop preview memakai size/50, bukan size*PX/PY: dermaga ~22% kurang panjang; Cove 6.76×7.04, seharusnya 7.469×8.982 (juga lapak silver, tiang ogah, kotak amal, penanda doa). Belum diubah karena tidak low-risk.
- Animasi Step 2 masih placeholder.
- Paint hook minimarket + registry Bangun Ruang (8 tipe + 3 recolor).
- Toast bangun tidur Step 1 masih menampilkan tag "PLACEHOLDER ANIMASI".
- Aksi lama cook / store_fridge dkk. masih muncul di samping aksi baru (menolak dengan pesan token saat token 0).
- Tas start pemain tes sudah 7/8 terisi, jadi beli 2 barang langsung "Tas penuh".
- Visual wall_pee.
- Re-audit layout ponsel Guest1.
- Preview Genesis base LGR (v4 joint rig, tee_v4 + trousers_v4) masih antre.

JANGAN DIOBRAK-ABRIK (tambahan Step 2; daftar Step 1 tetap berlaku)
16. Nama hook dan event Step 2 di docs/HOOKS-STEP2.md (inventory, moveItem, eatItem, recipes, cook, shopList, buy, checkoutCart, fishSpots, fishStart, fishInput, token, topupToken; mainkan:cook-done, mainkan:shop-receipt, mainkan:fish-result, mainkan:token) — UI Layar bergantung pada nama dan bentuk return ini.
17. Enam id aksi: cook_menu, open_fridge, open_storage, shop_minimarket, fish_start, topup_token — mengganti id memutus bar AKSI dan jendela Layar.
18. Gating token: token 0 mematikan kulkas, lemari, dan masak; isi ulang Rp20.000 / 5 unit (harga di Jiwa). Jangan dilewati dari UI.
19. njh-city-guard.js dan default NJH-only — jangan kembalikan world.json, Reference City, Jakarta City, atau City Sample sebagai peta default/terpilih.
20. Id titik mancing fishSpots: njh-dermaga-mancing-anchor dan njh-fishing-spot-kali-selatan — mengganti id memutus fishStart dan metadata peta Ellen.

Salinan di repo: CHECKPOINT-STEP2.md dan docs/CHECKPOINT-STEP2.md.

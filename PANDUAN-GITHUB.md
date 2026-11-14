# Memasang Absensi DPS di GitHub Pages (versi lokal)

Versi ini **tanpa server**. Semua data tersimpan di browser perangkat yang memakainya. Tidak ada sinkronisasi ke perangkat lain.

## Isi folder
`index.html` (aplikasi), `manifest.json` dan `icon.svg` (supaya bisa dipasang di layar utama HP), `.nojekyll` (file kosong, biarkan ada).

## Langkah membuat link

1. Buka **github.com**, daftar akun gratis lalu login.
2. Klik **+** (kanan atas) → **New repository**. Nama: `absensi-dps`. Pilih **Public**. Klik **Create repository**.
3. Di halaman repository, klik **uploading an existing file** (atau **Add file → Upload files**).
4. Seret **semua 4 file** dari folder ini (termasuk `.nojekyll`) lalu klik **Commit changes**.
   - Kalau `.nojekyll` tidak terlihat di komputer, aktifkan "tampilkan file tersembunyi", atau lewati saja; aplikasi tetap berjalan.
5. Buka **Settings → Pages**. Pada *Build and deployment*, pilih **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, lalu **Save**.
6. Tunggu 1-2 menit, muat ulang halaman Pages. Link Anda muncul:

   **https://NAMA-GITHUB-ANDA.github.io/absensi-dps/**

Tampilan menu GitHub kadang berubah; kalau namanya sedikit berbeda, cari menu yang sama artinya.

## Memperbarui aplikasi
Unggah ulang file yang berubah (Add file → Upload files, nama sama akan menimpa) lalu Commit. Link tidak berubah. Data di perangkat tidak hilang karena tersimpan di browser, bukan di GitHub.

## Memasang di layar utama HP
- **Android (Chrome):** menu ⋮ → *Tambahkan ke layar utama*.
- **iPhone (Safari):** tombol Bagikan → *Tambah ke Layar Utama*.

## Cara memakai
- **Pengurus:** tab 👔 Pengurus, isi nama dan password. Centang *Tetap masuk di perangkat ini* bila tidak mau mengetik password setiap kali.
- **Jamaah Baru:** tab 🆕 Jamaah Baru menambah nama ke data **di perangkat yang sedang dipakai** saja.
- Data hanya ada di perangkat tempat pengurus menginput. Pakailah **satu perangkat utama** untuk pencatatan.

## Penting: menjaga data

Karena data hanya ada di browser:
- **Hapus data situs/riwayat browser, atau ganti HP = data hilang.**
- Di iPhone, situs yang dibuka lewat Safari biasa dapat dibersihkan otomatis bila lama tidak dibuka. **Pasang di layar utama** agar lebih aman.
- Rutin tekan **💾 Backup Data** (misalnya setelah tiap pertemuan) dan simpan file `.json` ke Google Drive atau WhatsApp sendiri.
- Untuk memindahkan data ke HP lain atau memulihkan: buka aplikasi di perangkat tujuan, login, tekan **♻️ Pulihkan Backup**, pilih file backup.

## Catatan privasi dan keamanan

- Repository **Public** berarti kode di dalamnya bisa dilihat siapa saja, termasuk **daftar 130 nama jamaah** yang tertanam di `index.html`. Bagikan link hanya ke orang yang perlu. Jika daftar nama tidak boleh terlihat publik, beri tahu saya: nama bisa dikeluarkan dari kode dan dimasukkan lewat impor file.
- Password pengurus hanya melindungi data **di perangkat itu sendiri**. Karena tidak ada server, password tidak bisa menjadi pengaman sungguhan. Jangan menyimpan data yang sangat sensitif.
- Nomor WhatsApp yang diisi tidak dikirim ke mana pun; hanya tersimpan di browser perangkat.

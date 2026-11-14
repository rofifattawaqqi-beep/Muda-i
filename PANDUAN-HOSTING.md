# Panduan Memasang Absensi DPS di Hosting

Isi paket: `index.html` (tampilan), `server.js` (server + penyimpanan data), `package.json`, `.gitignore`.

## Pilih jenis hosting dulu

Aplikasi ini **butuh hosting yang bisa menjalankan Node.js**, karena data absen disimpan di server supaya semua HP melihat data yang sama.

| Jenis hosting | Cocok? |
|---|---|
| Hosting statis saja (GitHub Pages, Netlify Drop, Vercel statis) | **Tidak cocok.** Aplikasi tetap terbuka, tetapi data hanya tersimpan di tiap HP dan tidak dibagi. |
| Node.js: Render, Railway, Fly.io, VPS, cPanel "Setup Node.js App" | **Cocok.** |

**Hal terpenting: penyimpanan permanen.** Data ada di file `data.json`. Banyak layanan gratis menghapus file itu setiap server restart atau pasang ulang. Pilih salah satu:
1. Layanan yang menyediakan **disk/volume permanen** (biasanya berbayar, cek harga terbaru), atau
2. VPS / cPanel (file tidak hilang), atau
3. Layanan gratis tanpa disk, tetapi Anda **rutin menekan tombol "💾 Backup Data"** di dashboard pengurus.

---

## Opsi A - Render (paling mudah)

1. Buat repository di GitHub, unggah semua file dari paket ini (jangan unggah `data.json`).
2. Di render.com: **New > Web Service**, pilih repository tadi.
3. Isi: Runtime **Node**, Build Command `npm install`, Start Command `npm start`.
4. Untuk data permanen: pada pengaturan service tambahkan **Disk** (Mount Path `/var/data`), lalu tambah Environment Variable `DATA_DIR` = `/var/data`. (Disk memerlukan paket berbayar.)
5. Setelah selesai, Render memberi alamat `https://nama-anda.onrender.com`. Buka di HP mana saja.

Catatan paket gratis: server "tidur" kalau lama tidak dipakai, pembukaan pertama bisa lambat sekitar setengah menit.

## Opsi B - Railway

1. Unggah ke GitHub, lalu di railway.app pilih **New Project > Deploy from GitHub repo**.
2. Tambahkan **Volume**, mount di `/data`.
3. Tambah variable `DATA_DIR` = `/data`.
4. Buka **Settings > Networking > Generate Domain** untuk mendapat alamat web.

## Opsi C - VPS sendiri (Ubuntu)

```bash
# pasang Node.js 18+ lalu salin folder ini ke server, mis. /opt/absensi
cd /opt/absensi
npm install -g pm2
pm2 start server.js --name absensi
pm2 save && pm2 startup
```
Pasang HTTPS dengan Nginx + Certbot, arahkan domain Anda ke `http://localhost:3000`. File `data.json` otomatis dibuat di folder yang sama.

## Opsi D - cPanel (Setup Node.js App)

Unggah semua file ke folder aplikasi, pilih Node 18+, Application startup file: `server.js`, lalu **Run NPM Install** dan **Restart**.

---

## Variabel pengaturan (Environment Variables)

| Nama | Fungsi |
|---|---|
| `DATA_DIR` | Folder penyimpanan `data.json` (arahkan ke disk permanen). |
| `ADMIN_PASSWORD` | (Opsional) Ganti password pengurus. Kalau kosong, memakai password yang sekarang. |
| `PORT` | Diisi otomatis oleh hosting, tidak perlu diubah. |

## Backup dan pemulihan

- **Backup:** login sebagai pengurus, tekan **💾 Backup Data**. File `.json` terunduh.
- **Pulihkan:** letakkan isi backup sebagai `data.json` di folder `DATA_DIR`, lalu restart server. (Backup tidak berisi kunci rahasia; server membuatnya sendiri.)

## Cara kerja

Ada dua pilihan di halaman depan:
- **👔 Pengurus** - masuk dengan nama dan password. Mengelola pertemuan, mengisi absensi, melihat rekap, menambah jamaah, backup.
- **🆕 Jamaah Baru** - pendaftaran **tanpa password**. Jamaah mengisi nama (wali dan WhatsApp opsional), lalu namanya langsung masuk ke Data Jamaah dan muncul di perangkat pengurus dengan tanda 🆕. Jamaah baru tidak bisa melihat data apa pun.

Semua pengurus yang membuka alamat web yang sama **memakai data yang sama**. Perubahan dari satu HP atau laptop (buka/tutup pertemuan, absensi, jamaah baru) muncul otomatis di perangkat lain dalam sekitar 4 detik. Indikator **🟢 Tersinkron** di bagian atas menunjukkan status koneksi. Kalau tertulis **🔴 Terputus**, aplikasi mencoba lagi sendiri.

Kalau dua pengurus mengubah orang yang sama pada saat bersamaan, perubahan terakhir yang berlaku.

Jangan membuka `index.html` langsung dari file (klik dua kali). Dalam mode itu data hanya tersimpan di perangkat tersebut dan tidak tersinkron; aplikasi menampilkan peringatan kuning.

## Keamanan

- Password pengurus **diperiksa di server**. Seluruh data (daftar jamaah, nomor WhatsApp, absensi) hanya bisa dibaca dan diubah setelah login. Tanpa login, server menolak semua permintaan data. Percobaan password dibatasi 6 kali per menit.
- **Pendaftaran Jamaah Baru dibatasi** agar tidak disalahgunakan: maksimal 5 pendaftaran per perangkat setiap 10 menit, nama yang sudah ada ditolak, dan panjang isian dibatasi. Bila ada nama yang tidak sesuai, pengurus tetap bisa mengurusnya lewat Data Jamaah.
- Perangkat pengurus tetap masuk setelah ditutup. Tekan **Keluar** bila memakai perangkat bersama.
- Pakai alamat **https** (hosting di atas sudah menyediakannya) agar password tidak terkirim terbuka.
- Jangan unggah `data.json` ke GitHub publik karena berisi nama dan nomor WhatsApp jamaah. File `.gitignore` sudah mencegahnya.

## Setelah online

- **Android:** Chrome > menu ⋮ > *Tambahkan ke layar utama*.
- **iPhone:** buka di Safari > tombol Bagikan > *Tambah ke Layar Utama*.
- Bagikan alamat web ke jamaah (misalnya lewat grup WhatsApp).

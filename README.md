# LAP-KASIR-AUTO ⚡

Aplikasi otomasi penarikan dan penamaan laporan kasir otomatis menggunakan **Puppeteer** dan **Node.js Express** dengan antarmuka web modern minimalis berbasis PHP dan Tailwind CSS.

## Fitur Utama
- **Auto Double-Login IAS**: Otomatisasi login pemancing `rst` lalu dilanjutkan dengan akun pengguna asli.
- **Auto Download & Penamaan 11 Laporan**: Mengunduh dan menamai 10 laporan PDF dan 1 laporan Excel Cashback Supplier secara otomatis sesuai format tanggal `DDMMYY`.
- **Hybrid Content Detection**: Mengunduh PDF asli langsung dari stream server tanpa merusak file, serta merender halaman cetak HTML ke format A4 PDF.
- **Port 6767 Service**: Berjalan cepat sebagai background service dengan live status reporting.
- **Apple Minimalist UI**: Tampilan bersih, elegan, dan dilengkapi kutipan motivasi harian.

## Cara Menjalankan
1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Nyalakan bot service:
   - Klik 2x file `start_bot.bat` ATAU jalankan perintah:
     ```bash
     npm start
     ```
3. Buka browser:
   ```
   http://localhost/lap-kasir/index.php
   ```
4. Pilih koneksi, masukkan kredensial, pilih tanggal laporan, dan klik **Download Semua Laporan**.

# 📊 BOT LAPORAN KASIR OTOMATIS (IAS)

Sistem otomasi penarikan dan rekap 11 laporan kasir harian IAS (10 PDF + 1 Excel) menggunakan Puppeteer & Express dengan antarmuka web Apple-style yang minimalis dan elegan.

---

## 🚀 Cara Menjalankan Bot di PC Host

1. Pastikan **XAMPP (Apache)** sudah aktif di PC Host.
2. Klik ganda file **`start_bot.bat`** (atau jalankan `npm start` di CMD).
3. Bot akan standby di background / taskbar.

---

## 🌐 Cara Akses Web

### 1. Dari PC Host (Komputer yang menjalankan bot):
Buka browser:
> `http://localhost:8080/lap-kasir/index.php`

### 2. Dari PC Lain di Jaringan LAN:
Buka browser dari PC mana saja yang terhubung ke jaringan:
> `http://172.26.22.6:8080/lap-kasir/index.php`

*(Ganti `172.26.22.6` dengan IP PC Host jika IP berubah).*

---

## ⚡ Fitur Utama
- **Otomatisasi Penuh**: Login ganda (reset sandi `rst` pemancing + login akun asli), pemilihan koneksi (`SIMULASI` / `PRODUCTION`), dan penarikan 11 laporan kasir harian.
- **Dukungan Multi-PC (LAN)**: PC lain dapat memicu penarikan laporan tanpa perlu instalasi Node.js atau Puppeteer.
- **Universal API Bridge (`api.php`)**: Komunikasi antara browser client dan bot dijembatani via port Apache (8080), sehingga bebas kendala Firewall Windows dan CORS.
- **Download Sekali Klik**: Fitur paket ZIP untuk langsung mengunduh seluruh 11 laporan ke komputer client.
- **Desain Apple Minimalist**: Bersih, responsif, tanpa elemen berlebihan, dilengkapi kutipan motivasi harian.

---

## 📁 Daftar Laporan yang Diunduh
1. `LAP 310 DDMMYY.pdf`
2. `SALDOKLIK DDMMYY.pdf`
3. `VIRTUAL ACCOUNT DDMMYY.pdf`
4. `ISAKU DDMMYY.pdf`
5. `CB-NK DDMMYY.pdf`
6. `VOUCHER DDMMYY.pdf`
7. `LAP PENJUALAN DDMMYY.pdf`
8. `KREDIT DDMMYY.pdf`
9. `LAP CB PER ITEM DDMMYY.pdf`
10. `REKAP STRUK PER KASIR DDMMYY.pdf`
11. `LAP CB PER SUPLIER DDMMYY.xlsx`

---
*Dibuat & Dikelola oleh Dimas EDP SPI 2T*

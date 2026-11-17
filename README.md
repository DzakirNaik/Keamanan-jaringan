# CyberShield — Firewall & Network Threat Prevention

Aplikasi web UTS Keamanan Jaringan: dashboard simulasi firewall — aturan
firewall, daftar IP yang diblokir, log keamanan, dan statistik ancaman.
Dibuat oleh **Muhammad Irfan Dzakir** (NIM 242502040003), Kelas 3TI01.

Stack: PHP 8 + MySQL + HTML/CSS/JS. Tidak ada proses build.

## Buka langsung di browser (tanpa install apa pun)

Kalau GitHub Pages diaktifkan untuk repo ini (Settings → Pages → Branch
`main`), dashboard bisa dibuka langsung lewat link — tanpa install Docker
atau XAMPP:

**https://dzakirnaik.github.io/Keamanan-jaringan/**

Mode ini berjalan dengan data contoh bawaan (mode demo): semua menu
berfungsi, tapi perubahan tidak tersimpan — begitu halaman di-refresh,
data kembali ke contoh awal. Untuk menyimpan data, jalankan lewat Docker
atau XAMPP di bawah.

## Cara 1 — Docker (paling gampang, buat laptop/PC lain)

Syarat: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
sudah terpasang.

```bash
git clone https://github.com/DzakirNaik/Keamanan-jaringan.git
cd Keamanan-jaringan
docker compose up
```

Lalu buka **http://localhost:8080** di browser. Database beserta data
awalnya dibuat otomatis saat pertama kali jalan.

Berhenti: tekan `Ctrl+C`, lalu `docker compose down`.
Mulai dari nol (hapus semua data): `docker compose down -v`.

## Cara 2 — XAMPP (Windows)

1. Start **Apache** dan **MySQL** di XAMPP Control Panel.
2. Buka http://localhost/phpmyadmin → tab **Import** → pilih
   `cybershield.sql` → **Go**.
3. Salin folder ini ke `C:\xampp\htdocs\cybershield\`
4. Buka http://localhost/cybershield/

Kalau MySQL memakai password, ubah di `config.php` (atau lewat
environment variable `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`).

## Struktur file

| File | Isi |
| --- | --- |
| `index.html` | Halaman dashboard |
| `css/style.css` | Tampilan dashboard |
| `js/app.js` | Logika frontend (ambil/simpan data lewat API) |
| `api.php` | API `?action=load` (GET) dan `?action=save` (POST JSON) |
| `config.php` | Koneksi database (PDO MySQL) |
| `cybershield.sql` | Skema database + data awal |
| `Dockerfile`, `docker-compose.yml` | Menjalankan aplikasi + MySQL via Docker |

## Catatan

- Video demo (`Desktop 2026.mp4`) dan laporan (`Laporan_CyberShield.pdf`)
  tidak ada di repo ini — keduanya tetap tersimpan di Google Drive.

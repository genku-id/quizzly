# 🚀 Quizzly! — Kloning Game Kuis Interaktif Kahoot Real-Time

Platform kuis interaktif *real-time* berbasis web bergaya Kahoot, dirancang agar Anda bisa membuat kuis (*Quiz Creator*) dan bermain bersama teman-teman melalui browser HP tanpa perlu instalasi aplikasi tambahan.

---

## ✨ Fitur Utama

1. **Quiz Creator (`/create`):**
   - Buat judul, deskripsi, dan pertanyaan kuis tanpa batas.
   - 2 hingga 4 pilihan ganda warna geometris (Segitiga Merah, Wajik Biru, Lingkaran Kuning, Kotak Hijau).
   - Pengaturan batas waktu (10, 15, 20, 30, 60 detik).
   - Simpan langsung ke server tanpa setup database berat (file JSON/SQLite otomatis).

2. **Host Game Screen (`/host`):**
   - Generate kode PIN 4-digit unik & QR Code untuk scan cepat dari kamera HP.
   - Musik tema lobby asli Kahoot (`lobby.mp3`), musik ketegangan hitung mundur (`answer_30sec.mp3`), chime jawaban benar (`correct.mp3`), dan fanfare kemenangan (`podium.mp3`).
   - Kontrol suara (Mute/Unmute) & Layar Penuh (*Fullscreen*).
   - Live daftar peserta & tombol *kick* nama yang tidak pantas.
   - Grafik batang statistik distribusi pilihan jawaban peserta.
   - Papan Peringkat Top 10 dengan perhitungan skor berbasis kecepatan ($500 - 1000$ poin) & *Streak Api* 🔥.
   - Podium Juara 1, 2, 3 dengan efek konfeti pesta perayaan.

3. **Player Mobile Controller (`/` atau `/play`):**
   - Layar input PIN & Nickname.
   - Controller 4 tombol warna raksasa responsif (*gamepad-like*).
   - Efek getar (*haptic feedback*) dan penguncian tombol instan saat menjawab.
   - Layar feedback warna penuh (Hijau Benar / Merah Salah) + Poin + Ranking pribadi.

---

## 💻 Cara Menjalankan di Komputer Lokal

Buka terminal di folder `c:\Documents\Quizz`:

```bash
# 1. Jalankan server (backend + web app)
npm start
```

Buka di browser:
- **Host / Laptop:** `http://localhost:3001` (pilih tab **Host Layar** atau **Buat Kuis**).
- **Player (HP di jaringan WiFi yang sama):** Buka browser HP dan ketik `http://<IP-Laptop-Anda>:3001` (misal: `http://192.168.1.15:3001`).

---

## 🌐 Panduan Deployment Gratis ke Render.com (Dengan Custom Domain)

1. **Upload ke GitHub:**
   - Inisialisasi Git:
     ```bash
     git init
     git add .
     git commit -m "Initial commit Quizzly"
     ```
   - Buat repository baru di GitHub dan lakukan `git push`.

2. **Deploy di [Render.com](https://render.com) (100% Gratis):**
   - Buat akun di Render.com.
   - Klik **New +** $\rightarrow$ **Web Service**.
   - Pilih repository GitHub Quizzly Anda.
   - Konfigurasi:
     - **Runtime:** `Node`
     - **Build Command:** `npm run install:all && npm run build`
     - **Start Command:** `npm start`
     - **Instance Type:** `Free`
   - Klik **Create Web Service**. Aplikasi Anda akan aktif di URL `https://quizzly-xxxx.onrender.com`.

3. **Hubungkan Custom Domain Anda:**
   - Di dashboard Render, buka menu **Settings** $\rightarrow$ **Custom Domains**.
   - Tambahkan domain Anda (misal `quizzly.com` atau subdomain `kuis.domainanda.com`).
   - Masukkan CNAME yang diberikan Render ke pengaturan DNS domain Anda (di Cloudflare, Niagahoster, Domainesia, dll).
   - Sertifikat SSL (HTTPS) akan otomatis aktif dan teman-teman Anda bisa langsung bermain dari browser HP masing-masing!

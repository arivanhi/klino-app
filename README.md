# KLiNO App (Klinik Literasi & Numerasi)

KLiNO App adalah platform manajemen data sekolah, guru, siswa, dan mentor (Literasi & Numerasi). Aplikasi ini dibangun dengan stack modern menggunakan Next.js, Prisma, MySQL, dan di-deploy dengan Docker.

## Persyaratan Sistem
Pastikan server atau mesin lokal Anda telah menginstal:
- **Docker** dan **Docker Compose**
- **Git** (Opsional, untuk pull pembaruan)

---

## Panduan Instalasi (Baru)

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan KLiNO App untuk pertama kalinya di server:

1. **Clone Repositori (Jika menggunakan Git)**
   ```bash
   git clone <url-repo-anda> klino-app
   cd klino-app
   ```

2. **Konfigurasi Environment**
   Semua kredensial (seperti kredensial database dan rahasia JWT) telah diamankan di dalam file `.env`. Pastikan file `.env` sudah ada di direktori utama `klino-app`. Anda bisa menyalinnya dari contoh jika ada, atau buat file baru `.env` 

3. **Jalankan Aplikasi dengan Docker**
   Jalankan perintah berikut untuk mem-build dan menjalankan semua container di latar belakang:
   ```bash
   docker compose up -d --build
   ```

4. **Akses Aplikasi**
   Setelah proses selesai, aplikasi bisa diakses melalui:
   - **Aplikasi Web**: [http://localhost:4011](http://localhost:4011)
   - **phpMyAdmin**: [http://localhost:4013](http://localhost:4013) (Hanya untuk akses database darurat)

   **Akun Default Administrator:**
   - **Username**: `adminKlino`
   - **Password**: `klino123`

---

## Panduan Perbaikan / Pembaruan (Server Berjalan)

Jika KLiNO App sudah terpasang di server dan Anda baru saja menerima pembaruan kode, ikuti langkah berikut untuk menerapkan pembaruan tanpa menghilangkan data:

1. **Masuk ke Direktori Aplikasi**
   ```bash
   cd /path/to/klino-app
   ```

2. **Tarik Pembaruan (Jika menggunakan Git)**
   ```bash
   git pull origin main
   ```

3. **Rebuild Container**
   Jalankan perintah berikut. Docker secara otomatis akan mem-build ulang container Next.js yang berubah, namun **tidak akan menghapus data di database** karena tersimpan di dalam *Docker Volume*.
   ```bash
   docker compose up -d --build
   ```

4. **Menangani Perubahan Skema Database (Penting!)**
   Jika pada pembaruan ini terdapat perubahan pada struktur database (seperti penambahan tabel baru, misalnya tabel `Mentor`), Anda **wajib** melakukan sinkronisasi database:
   
   Masuk ke dalam terminal container Next.js:
   ```bash
   docker exec -it klino_web sh
   ```
   Lalu jalankan push schema prisma:
   ```bash
   npx prisma db push
   ```
   Ketik `exit` untuk keluar dari container.

5. **Melihat Log (Opsional)**
   Jika terjadi kendala (seperti Error 500) setelah pembaruan, Anda bisa melihat log aplikasi:
   ```bash
   docker compose logs -f web
   ```

---

## Changelog

### [v1.1.0] - Pembaruan Modul Data Master
**Ditambahkan:**
- **Sistem Mentor:** Penambahan entitas `Mentor` yang terpisah dari struktur Akun (User). Mentor sekarang memiliki atribut Tipe (Literasi/Numerasi) dan terhubung langsung ke sekolah.
- **Import Massal Cerdas:** Import massal Guru dan Siswa via file Excel kini menggunakan kolom `Nama Sekolah` sebagai rujukan (bukan ID), sehingga sistem akan otomatis mencocokkan nama sekolah dengan data di database.
- **Reset Password Guru:** Fitur satu kali klik (ikon Kunci) di tab Data Guru untuk langsung mereset password ke `klino123`.
- **Manajemen User Otomatis:** Menambahkan guru (baik secara manual maupun import Excel) kini akan secara otomatis membuatkan akun `User` dengan akses login.
- **Modal Konfirmasi Hapus:** Transisi dari *browser confirm pop-up* ke UI Modal internal yang konsisten di semua tabel (Sekolah, Guru, Siswa, Mentor).

**Diperbaiki:**
- Memperbaiki error `Unknown field mentor` dengan memperbarui logika pemanggilan pada `SekolahTab` dari hubungan 1-ke-1 menjadi 1-ke-Banyak (Array).
- Memperbaiki kegagalan pada fitur edit manual untuk Data Siswa & Data Guru.
- Menambahkan integrasi checkbox `Jadikan Semester Aktif` di form Edit Data Semester.

### [v1.0.0] - Inisialisasi Proyek
- Pembuatan fondasi awal menggunakan Next.js + Prisma ORM.
- Containerisasi database MySQL dan phpMyAdmin menggunakan Docker Compose.
- Autentikasi berbasis JWT dengan menggunakan `bcryptjs` dan NextAuth.
- Dashboard Admin standar dan manajemen data sekolah (CRUD).

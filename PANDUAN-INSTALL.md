# Panduan Install KosKu — untuk Pemula

Panduan ini ditulis dengan asumsi Anda **belum pernah** menjalankan aplikasi
Next.js sama sekali. Ikuti dari atas ke bawah, jangan dilompati.

Perkiraan waktu: **15–25 menit**.

---

## Isi panduan

1. [Yang perlu disiapkan](#1-yang-perlu-disiapkan)
2. [Install Node.js](#2-install-nodejs)
3. [Siapkan database PostgreSQL](#3-siapkan-database-postgresql)
4. [Buka folder project di terminal](#4-buka-folder-project-di-terminal)
5. [Install dependensi](#5-install-dependensi)
6. [Isi file .env](#6-isi-file-env)
7. [Buat tabel di database](#7-buat-tabel-di-database)
8. [Isi data contoh](#8-isi-data-contoh)
9. [Jalankan aplikasi](#9-jalankan-aplikasi)
10. [Coba semua fiturnya](#10-coba-semua-fiturnya)
11. [Kalau ada error](#11-kalau-ada-error)

---

## 1. Yang perlu disiapkan

| Kebutuhan | Keterangan |
| --- | --- |
| Komputer | Windows 10/11, macOS, atau Linux |
| Internet | Untuk mengunduh dependensi |
| Node.js 20+ | Langkah 2 |
| PostgreSQL | Langkah 3 — bisa install di komputer **atau** pakai layanan gratis |
| Editor teks | Visual Studio Code (disarankan, gratis) |

Istilah yang akan sering muncul:

- **Terminal** — aplikasi tempat mengetik perintah. Di Windows namanya
  *PowerShell* atau *Command Prompt*, di macOS namanya *Terminal*.
- **npm** — alat untuk mengunduh dan menjalankan perintah project Node.js.
  Sudah ikut terinstall bersama Node.js.

---

## 2. Install Node.js

1. Buka <https://nodejs.org>
2. Unduh versi **LTS** (angkanya harus 20 atau lebih besar).
3. Jalankan installer-nya, klik **Next** sampai selesai. Biarkan semua pilihan
   apa adanya.
4. **Tutup semua terminal yang sedang terbuka**, lalu buka terminal baru.
5. Pastikan berhasil dengan mengetik:

   ```bash
   node -v
   npm -v
   ```

   Hasilnya kira-kira seperti ini:

   ```
   v20.18.0
   10.8.2
   ```

   Kalau muncul tulisan seperti `'node' is not recognized`, berarti Node.js
   belum terpasang dengan benar — ulangi langkah 1–4.

---

## 3. Siapkan database PostgreSQL

Pilih **salah satu**. Kalau ragu, pilih **Cara A** karena paling cepat, gratis,
dan langsung siap dipakai untuk deploy nanti.

### Cara A — Database online gratis (Neon) ⭐ disarankan

1. Buka <https://neon.tech> lalu klik **Sign up** (bisa masuk pakai akun GitHub
   atau Google).
2. Setelah masuk, klik **Create project**.
   - **Project name**: `kosku`
   - **Postgres version**: biarkan apa adanya
   - **Region**: pilih yang paling dekat, misalnya *Singapore*
3. Klik **Create**.
4. Neon menampilkan kotak **Connection string**. Klik tombol salin (ikon
   dokumen). Isinya kira-kira seperti ini:

   ```
   postgresql://kosku_owner:AbCdEf123456@ep-cool-forest-123456-pooler.ap-southeast-1.aws.neon.tech/kosku?sslmode=require
   ```

5. **Simpan teks itu** di Notepad sebentar — nanti dipakai di langkah 6.

> Kalau kotaknya tidak terlihat, buka menu **Dashboard → Connect** di project Anda.

### Cara B — PostgreSQL di komputer sendiri

**Windows**

1. Unduh installer di <https://www.postgresql.org/download/windows/>
2. Jalankan installer. Saat diminta membuat **password untuk user `postgres`**,
   isi dengan sesuatu yang Anda ingat, contoh `postgres123`, lalu catat.
3. Biarkan port di angka `5432`.
4. Setelah selesai, buka aplikasi **pgAdmin** (ikut terpasang), klik kanan
   **Databases → Create → Database**, beri nama `kosku`, lalu **Save**.

**macOS**

```bash
brew install postgresql@16
brew services start postgresql@16
createdb kosku
```

**Linux (Ubuntu/Debian)**

```bash
sudo apt update && sudo apt install postgresql
sudo -u postgres createdb kosku
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres123';"
```

Connection string-nya nanti berbentuk:

```
postgresql://postgres:postgres123@localhost:5432/kosku?schema=public
```

Ganti `postgres123` dengan password yang Anda buat tadi.

---

## 4. Buka folder project di terminal

1. Ekstrak berkas `kosku.zip`. Akan muncul folder bernama `kosku`.
2. Letakkan di tempat yang mudah dicari, misalnya `D:\projek\kosku` atau
   `~/Documents/kosku`.
3. Buka folder itu di terminal:

   **Cara paling mudah (Visual Studio Code):**
   buka VS Code → menu **File → Open Folder** → pilih folder `kosku` →
   lalu menu **Terminal → New Terminal**.

   **Cara manual:**

   ```bash
   cd D:\projek\kosku          # Windows
   cd ~/Documents/kosku        # macOS / Linux
   ```

4. Pastikan sudah di folder yang benar:

   ```bash
   ls        # macOS / Linux
   dir       # Windows
   ```

   Harus terlihat nama-nama seperti `app`, `components`, `prisma`, dan
   `package.json`.

---

## 5. Install dependensi

Di terminal yang sudah berada di folder `kosku`, jalankan:

```bash
npm install
```

Proses ini mengunduh semua pustaka yang dibutuhkan. **Butuh 1–3 menit** dan
memakai sekitar 500 MB. Tunggu sampai muncul kembali baris perintah kosong.

Tulisan berwarna kuning bertuliskan `warn` tidak masalah — yang perlu
diperhatikan hanya tulisan `error`.

---

## 6. Isi file .env

File `.env` berisi rahasia aplikasi: alamat database dan kunci pengaman.

1. Salin contohnya:

   ```bash
   cp .env.example .env      # macOS / Linux
   copy .env.example .env    # Windows
   ```

2. Buka file `.env` yang baru terbentuk dengan VS Code atau Notepad.

3. Isi tiga baris ini:

   ```env
   DATABASE_URL="tempel-connection-string-dari-langkah-3-di-sini"
   SESSION_SECRET="tulis-huruf-acak-panjang-minimal-32-karakter"
   CRON_SECRET="tulis-huruf-acak-lain-yang-berbeda"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   Contoh setelah diisi:

   ```env
   DATABASE_URL="postgresql://kosku_owner:AbCdEf123456@ep-cool-forest-123456-pooler.ap-southeast-1.aws.neon.tech/kosku?sslmode=require"
   SESSION_SECRET="k8Jq2Lm5Pz7Xw1Nv4Rt6Yb9Hc3Ge0Df8As"
   CRON_SECRET="rahasia-cron-kosku-2026-abcxyz"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

   **Cara cepat membuat teks acak:**

   ```bash
   openssl rand -base64 32       # macOS / Linux / Git Bash
   ```

   Di Windows PowerShell:

   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
   ```

   Tidak punya keduanya? Ketik saja huruf dan angka asal sepanjang 40 karakter.

4. **Simpan** file `.env` (Ctrl+S / Cmd+S).

> ⚠️ Jangan pernah membagikan isi file `.env` ke siapa pun dan jangan
> mengunggahnya ke GitHub. File ini sudah otomatis diabaikan oleh Git.

---

## 7. Buat tabel di database

```bash
npm run db:push
```

Perintah ini membaca `prisma/schema.prisma` dan membuat seluruh tabel di
database Anda. Kalau berhasil, muncul tulisan:

```
🚀  Your database is now in sync with your Prisma schema.
```

---

## 8. Isi data contoh

```bash
npm run db:seed
```

Perintah ini mengisi 20 kamar, akun admin, 12 penghuni beserta tagihan dan
pembayaran 12 bulan ke belakang, pengumuman, komplain, dan pengeluaran.

Kalau berhasil, muncul:

```
✅ Seed selesai.
   Kamar      : 20
   Pengguna   : 13
   Tagihan    : 77
   Pembayaran : 71

   Akun demo
   Admin    → username: admin  password: admin123
   Penghuni → username: budi   password: budi123
```

> Perintah ini **menghapus data lama** lebih dulu. Jangan dijalankan lagi kalau
> sudah ada data asli di dalamnya.

---

## 9. Jalankan aplikasi

```bash
npm run dev
```

Tunggu sampai muncul:

```
▲ Next.js 14.2.33
- Local:   http://localhost:3000
✓ Ready in 2.1s
```

Buka browser ke **<http://localhost:3000/kosku>**.

Untuk menghentikan aplikasi, tekan **Ctrl + C** di terminal.

---

## 10. Coba semua fiturnya

Ikuti urutan ini untuk memastikan semuanya berjalan:

### a. Sebagai calon penghuni

1. Di halaman depan, klik **Lihat kamar tersedia**
2. Coba filter tipe kamar dan rentang harga
3. Pilih satu kamar berstatus **Tersedia** → klik **Booking Sekarang**
4. Pilih tanggal masuk dan durasi **3 bulan**, perhatikan rincian biaya berubah
5. Klik **Lanjut daftar akun**, isi formulir pendaftaran
6. Anda akan diarahkan ke halaman QRIS demo — perhatikan banner **MODE DEMO**
   dan hitung mundurnya
7. Klik **Simulasikan Pembayaran Berhasil**
8. Anda langsung masuk ke dashboard penghuni dengan kamar sudah aktif

### b. Sebagai penghuni

1. Keluar, lalu masuk lagi dengan `budi` / `budi123`
2. Buka **Tagihan** — ada 1 lunas, 1 telat, 1 belum bayar
3. Klik tagihan yang belum lunas → coba **unduh invoice PDF**
4. Coba bayar lewat QRIS demo, atau pindah ke tab **Transfer bank** dan unggah
   gambar apa pun sebagai bukti
5. Buka **Komplain → Komplain baru**, kirim satu laporan
6. Buka **Dokumen** → unduh kontrak sewa PDF

### c. Sebagai pemilik kos

1. Keluar, masuk dengan `admin` / `admin123`
2. Lihat grafik pemasukan 12 bulan di dashboard
3. Buka **Tagihan** → klik **Generate Tagihan Bulan Ini**
4. Kalau tadi Anda mengunggah bukti transfer, buka tagihan itu lalu
   **Setujui pembayaran**
5. Buka **Komplain**, balas laporan penghuni dan ubah statusnya
6. Buka **Kamar**, coba **Kunci kamar** lalu buka kuncinya lagi
7. Buka **Laporan keuangan** → klik **Export CSV**
8. Buka **Pengaturan**, ganti nama kos, simpan, lalu lihat halaman depan

Kalau semua langkah di atas berhasil, aplikasi Anda sudah berjalan sempurna.
Lanjutkan ke **[PANDUAN-DEPLOY-VERCEL.md](PANDUAN-DEPLOY-VERCEL.md)** untuk
menaikkannya ke internet.

---

## 11. Kalau ada error

### `'npm' is not recognized` / `command not found: npm`

Node.js belum terpasang atau terminal belum di-restart. Ulangi langkah 2, lalu
tutup dan buka lagi terminalnya.

### `Can't reach database server at localhost:5432`

PostgreSQL belum berjalan. 
- Windows: buka **Services** → cari `postgresql` → klik **Start**
- macOS: `brew services start postgresql@16`
- Linux: `sudo systemctl start postgresql`

Atau pindah saja memakai Neon (Cara A di langkah 3).

### `Authentication failed against database server`

Password di dalam `DATABASE_URL` salah. Periksa lagi isi file `.env`.
Kalau password Anda mengandung karakter spesial seperti `@`, `#`, atau `:`,
ganti dulu passwordnya dengan yang hanya berisi huruf dan angka.

### `database "kosku" does not exist`

Databasenya belum dibuat. Kembali ke langkah 3 dan buat database bernama `kosku`.

### `SESSION_SECRET belum diatur atau terlalu pendek`

Isi `SESSION_SECRET` di file `.env` minimal 16 karakter (disarankan 32+),
lalu jalankan ulang `npm run dev`.

### `Error: P1001` atau koneksi timeout ke Neon

Pastikan connection string diakhiri `?sslmode=require` dan internet Anda aktif.

### Port 3000 sudah dipakai

```bash
npm run dev -- -p 3001
```

lalu buka <http://localhost:3001/kosku>.

### Halaman kosong / tampilan berantakan

Hentikan aplikasi (Ctrl + C), hapus folder `.next`, lalu jalankan lagi:

```bash
rm -rf .next && npm run dev      # macOS / Linux
rmdir /s /q .next && npm run dev # Windows
```

### Ingin mengulang dari data bersih

```bash
npm run db:push
npm run db:seed
```

### Ingin melihat isi database langsung

```bash
npm run db:studio
```

Lalu buka <http://localhost:5555>.

# Panduan Deploy KosKu ke Vercel — untuk Pemula

Panduan ini membawa aplikasi KosKu dari komputer Anda ke internet, sehingga bisa
dibuka siapa saja lewat alamat seperti `https://kosku-anda.vercel.app`.

**Semuanya gratis** — Vercel punya paket Hobby gratis, dan Neon menyediakan
database PostgreSQL gratis.

Perkiraan waktu: **20–30 menit**.

---

## Isi panduan

1. [Gambaran besar](#1-gambaran-besar)
2. [Siapkan akun yang dibutuhkan](#2-siapkan-akun-yang-dibutuhkan)
3. [Buat database produksi di Neon](#3-buat-database-produksi-di-neon)
4. [Unggah kode ke GitHub](#4-unggah-kode-ke-github)
5. [Hubungkan ke Vercel](#5-hubungkan-ke-vercel)
6. [Isi environment variables](#6-isi-environment-variables)
7. [Deploy pertama](#7-deploy-pertama)
8. [Buat tabel di database produksi](#8-buat-tabel-di-database-produksi)
9. [Isi data awal](#9-isi-data-awal)
10. [Perbaiki NEXT_PUBLIC_APP_URL](#10-perbaiki-next_public_app_url)
11. [Pastikan cron berjalan](#11-pastikan-cron-berjalan)
12. [Amankan aplikasi](#12-amankan-aplikasi)
13. [Pasang domain sendiri (opsional)](#13-pasang-domain-sendiri-opsional)
14. [Cara memperbarui aplikasi nanti](#14-cara-memperbarui-aplikasi-nanti)
15. [Kalau deploy gagal](#15-kalau-deploy-gagal)
16. [Ringkasan perintah](#16-ringkasan-perintah)

---

## 1. Gambaran besar

Aplikasi akan berjalan di dua tempat:

```
┌─────────────────┐        ┌──────────────────┐
│     VERCEL      │  ───▶  │       NEON       │
│  (kode & web)   │        │   (database)     │
└─────────────────┘        └──────────────────┘
        ▲
        │ otomatis setiap kali kode berubah
┌─────────────────┐
│     GITHUB      │
│  (simpanan kode)│
└─────────────────┘
```

Urutan kerjanya: kode masuk ke **GitHub** → **Vercel** membaca GitHub dan
menjalankan aplikasi → aplikasi menyimpan data ke **Neon**.

---

## 2. Siapkan akun yang dibutuhkan

Daftar tiga akun ini dulu (semuanya gratis, bisa pakai akun Google):

| Layanan | Alamat | Kegunaan |
| --- | --- | --- |
| GitHub | <https://github.com/signup> | Menyimpan kode |
| Vercel | <https://vercel.com/signup> | Menjalankan aplikasi |
| Neon | <https://neon.tech> | Database PostgreSQL |

**Tips:** saat mendaftar Vercel, pilih **Continue with GitHub** supaya keduanya
langsung terhubung.

Pastikan juga **Git** sudah terpasang di komputer:

```bash
git --version
```

Kalau belum, unduh di <https://git-scm.com/downloads> lalu install (klik Next
sampai selesai).

---

## 3. Buat database produksi di Neon

1. Masuk ke <https://console.neon.tech>
2. Klik **Create project**
   - **Name**: `kosku-produksi`
   - **Region**: `Asia Pacific (Singapore)` — paling dekat dari Indonesia
3. Klik **Create**
4. Setelah jadi, Neon menampilkan kotak **Connection string**.
   Salin dan simpan di Notepad. Bentuknya:

   ```
   postgresql://kosku_owner:npg_AbC123@ep-cool-forest-a1b2c3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   Perhatikan ada kata **`-pooler`** di dalamnya. Ini yang akan dipakai aplikasi.

5. Sekarang buat **versi tanpa pooler** untuk membuat tabel nanti: salin lagi
   teks yang sama, lalu **hapus kata `-pooler`**:

   ```
   postgresql://kosku_owner:npg_AbC123@ep-cool-forest-a1b2c3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

   Simpan keduanya. Sebut saja:
   - **URL A (pooler)** → dipakai Vercel
   - **URL B (tanpa pooler)** → dipakai sekali saja untuk membuat tabel

> **Kenapa dua?** Versi pooler membagi koneksi ke banyak pengunjung sekaligus —
> cocok untuk aplikasi. Versi tanpa pooler dibutuhkan saat membuat struktur
> tabel. Kalau Neon Anda tidak menampilkan opsi ini, pakai satu URL yang sama
> untuk keduanya; biasanya tetap berhasil.

---

## 4. Unggah kode ke GitHub

### 4a. Siapkan repository

1. Buka <https://github.com/new>
2. Isi:
   - **Repository name**: `kosku`
   - Pilih **Private** (supaya kode tidak bisa dilihat orang lain)
   - **Jangan centang** "Add a README file"
3. Klik **Create repository**
4. GitHub menampilkan alamat repository. Salin yang berbentuk:
   `https://github.com/namaanda/kosku.git`

### 4b. Kirim kode dari komputer

Buka terminal di folder `kosku`, lalu jalankan satu per satu:

```bash
git init
git add .
git commit -m "KosKu versi pertama"
git branch -M main
git remote add origin https://github.com/namaanda/kosku.git
git push -u origin main
```

Ganti `namaanda` dengan username GitHub Anda.

**Kalau diminta login:** GitHub tidak lagi menerima password biasa. Buat token:

1. Buka <https://github.com/settings/tokens/new>
2. **Note**: `kosku`, **Expiration**: 90 days
3. Centang **repo**
4. Klik **Generate token**, salin tokennya
5. Tempel token itu saat terminal meminta *Password*

**Pastikan `.env` tidak ikut terkirim.** Jalankan:

```bash
git status --short
```

Kalau ada baris yang menyebut `.env`, hentikan dan periksa file `.gitignore`.
Seharusnya `.env` sudah ada di daftar abaikan.

---

## 5. Hubungkan ke Vercel

1. Buka <https://vercel.com/new>
2. Di daftar **Import Git Repository**, cari `kosku` lalu klik **Import**
   - Belum muncul? Klik **Adjust GitHub App Permissions** lalu beri akses ke
     repository `kosku`
3. Di halaman konfigurasi, biarkan semuanya apa adanya:
   - **Framework Preset**: `Next.js` (terdeteksi otomatis)
   - **Root Directory**: `./`
   - **Build Command**, **Output Directory**, **Install Command**: biarkan default

4. **Jangan klik Deploy dulu.** Lanjut ke langkah 6.

---

## 6. Isi environment variables

Masih di halaman yang sama, buka bagian **Environment Variables** lalu tambahkan
empat baris berikut satu per satu (ketik **Key**, tempel **Value**, klik **Add**):

| Key | Value |
| --- | --- |
| `DATABASE_URL` | **URL A (pooler)** dari langkah 3 |
| `SESSION_SECRET` | Teks acak minimal 32 karakter |
| `CRON_SECRET` | Teks acak lain yang berbeda |
| `NEXT_PUBLIC_APP_URL` | `https://kosku.vercel.app` (nanti diperbaiki di langkah 10) |

**Cara membuat teks acak:**

```bash
openssl rand -base64 32
```

Di Windows PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

> ⚠️ Gunakan `SESSION_SECRET` yang **berbeda** dari yang ada di komputer Anda.
> Kalau kunci ini bocor, orang lain bisa membuat session palsu.

---

## 7. Deploy pertama

Klik tombol **Deploy** dan tunggu 2–4 menit.

Vercel akan menjalankan `npm install`, lalu `prisma generate`, lalu `next build`.
Kalau berhasil, muncul layar ucapan selamat beserta pratinjau situs.

**Situsnya masih error kalau dibuka sekarang** — itu wajar, karena tabel di
database belum dibuat. Lanjut ke langkah 8.

Catat dulu alamat situs Anda. Ada di halaman project Vercel, bagian **Domains**,
bentuknya seperti `kosku-abc123.vercel.app`.

---

## 8. Buat tabel di database produksi

Langkah ini dijalankan **dari komputer Anda**, sekali saja.

1. Di folder `kosku`, buat file baru bernama **`.env.production.local`**
   (di samping file `.env` yang sudah ada).

2. Isi dengan **URL B (tanpa pooler)**:

   ```env
   DATABASE_URL="postgresql://kosku_owner:npg_AbC123@ep-cool-forest-a1b2c3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```

3. Jalankan:

   **macOS / Linux:**

   ```bash
   DATABASE_URL="$(grep DATABASE_URL .env.production.local | cut -d '"' -f2)" npx prisma db push
   ```

   **Windows PowerShell:**

   ```powershell
   $env:DATABASE_URL = "tempel-URL-B-di-sini"
   npx prisma db push
   ```

   Cara paling sederhana kalau bingung dengan perintah di atas: **sementara**
   ganti isi `DATABASE_URL` di file `.env` biasa dengan URL B, jalankan
   `npm run db:push`, lalu kembalikan lagi ke URL database lokal Anda.

4. Berhasil kalau muncul:

   ```
   🚀  Your database is now in sync with your Prisma schema.
   ```

---

## 9. Isi data awal

Ada dua pilihan.

### Pilihan 1 — Mulai dengan data contoh (disarankan untuk mencoba)

Dengan `DATABASE_URL` yang masih mengarah ke database produksi:

```bash
npm run db:seed
```

Ini mengisi 20 kamar contoh, akun `admin` / `admin123`, dan data demo lainnya.
Bagus untuk memastikan semuanya berjalan, tapi **wajib dibersihkan** sebelum
dipakai sungguhan.

### Pilihan 2 — Mulai dari kosong, hanya buat akun admin

Buat file sementara bernama `buat-admin.ts` di folder `prisma`:

```ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: await bcrypt.hash('GANTI-PASSWORD-INI', 10),
      role: 'ADMIN',
      fullName: 'Nama Pemilik Kos',
      phone: '08123456789',
    },
  });
  console.log('Akun admin dibuat.');
}

main().finally(() => prisma.$disconnect());
```

Jalankan dengan:

```bash
npx tsx prisma/buat-admin.ts
```

Setelah itu hapus file `buat-admin.ts`, lalu masuk sebagai admin dan tambahkan
kamar satu per satu lewat menu **Kamar → Tambah kamar**, serta isi identitas kos
di menu **Pengaturan**.

**Jangan lupa hapus juga file `.env.production.local`** setelah selesai.

---

## 10. Perbaiki NEXT_PUBLIC_APP_URL

1. Buka project Anda di <https://vercel.com/dashboard>
2. Masuk ke **Settings → Environment Variables**
3. Cari `NEXT_PUBLIC_APP_URL`, klik titik tiga → **Edit**
4. Ganti isinya dengan alamat situs Anda yang sebenarnya, misalnya:

   ```
   https://kosku-abc123.vercel.app
   ```

   (tanpa garis miring di akhir)
5. **Save**
6. Buka tab **Deployments**, klik titik tiga pada deploy paling atas →
   **Redeploy** → **Redeploy**

Tunggu selesai, lalu buka `https://alamat-anda.vercel.app/kosku`.
**Aplikasi Anda sudah online.** 🎉

Coba masuk dengan akun admin dan pastikan dashboard terbuka.

---

## 11. Pastikan cron berjalan

Berkas `vercel.json` di project ini sudah mengatur dua tugas terjadwal:

| Jadwal (UTC) | Waktu WIB | Tugas |
| --- | --- | --- |
| `0 17 * * *` | 00.00 setiap hari | Membatalkan booking yang masa hold-nya habis |
| `5 17 1 * *` | 00.05 setiap tanggal 1 | Menerbitkan tagihan bulan baru + menandai yang telat |

Cara memastikannya:

1. Buka project di Vercel → tab **Cron Jobs**
2. Kedua tugas di atas harus terlihat di daftar
3. Klik **Run** pada salah satunya untuk mencobanya sekarang

Vercel otomatis menyertakan header `Authorization: Bearer <CRON_SECRET>` selama
variabel `CRON_SECRET` sudah diisi — jadi tidak ada yang perlu diatur lagi.

> **Catatan paket gratis:** Vercel Hobby membatasi cron maksimal sekali sehari.
> Itu sudah cukup, karena booking kedaluwarsa juga otomatis dibereskan setiap
> kali ada orang membuka halaman daftar kamar. Tagihan bulanan pun bisa
> diterbitkan kapan saja lewat tombol **Generate Tagihan Bulan Ini** di dashboard
> admin.

---

## 12. Amankan aplikasi

Sebelum dipakai penghuni sungguhan, lakukan ini:

1. **Ganti password admin**
   Masuk sebagai admin → menu **Pengaturan** → kartu **Ganti password** di
   sebelah kanan. Isi password lama `admin123` dan password baru yang kuat.
   Semua perangkat lain otomatis diminta masuk ulang.

2. **Hapus data demo** kalau tadi memakai `npm run db:seed`:
   jalankan sekali lagi `npm run db:seed` dengan `prisma/seed.ts` yang sudah
   Anda sesuaikan, atau kosongkan tabel lewat Neon SQL Editor.

3. **Isi data kos yang sebenarnya** di menu **Pengaturan**: nama kos, alamat,
   nomor WhatsApp, rekening bank, nominal deposit, denda, dan aturan kos.

4. **Beri tahu penghuni bahwa pembayaran masih mode demo**, atau ganti dulu ke
   payment gateway asli — caranya ada di bagian *Mengganti ke payment gateway
   asli* pada [README.md](README.md).

5. **Simpan cadangan database.** Di Neon, fitur *Point-in-time restore* aktif
   otomatis pada paket gratis untuk beberapa hari ke belakang.

---

## 13. Pasang domain sendiri (opsional)

Kalau Anda punya domain seperti `kosmelati.com`:

1. Vercel → project → **Settings → Domains**
2. Ketik domain Anda → **Add**
3. Vercel menampilkan data DNS yang harus dipasang. Biasanya:

   | Type | Name | Value |
   | --- | --- | --- |
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

4. Buka panel penyedia domain Anda (Niagahoster, Rumahweb, Cloudflare, dan
   sejenisnya), masuk ke pengaturan **DNS**, lalu tambahkan data di atas.
5. Tunggu 5 menit sampai beberapa jam. Vercel memasang sertifikat HTTPS otomatis.
6. Setelah aktif, perbarui `NEXT_PUBLIC_APP_URL` menjadi `https://kosmelati.com`
   lalu **Redeploy**.

---

## 14. Cara memperbarui aplikasi nanti

Setiap kali Anda mengubah kode di komputer:

```bash
git add .
git commit -m "menjelaskan apa yang diubah"
git push
```

Vercel otomatis mendeteksi perubahan dan melakukan deploy ulang dalam 2–3 menit.
Tidak perlu membuka dashboard sama sekali.

**Kalau Anda mengubah `prisma/schema.prisma`**, jalankan juga sekali:

```bash
npx prisma db push     # dengan DATABASE_URL mengarah ke database produksi
```

---

## 15. Kalau deploy gagal

Buka Vercel → tab **Deployments** → klik deploy yang gagal → baca **Build Logs**.
Cari baris berwarna merah paling atas.

### `Environment variable not found: DATABASE_URL`

Variabel belum ditambahkan atau salah ketik. Periksa **Settings → Environment
Variables**, pastikan namanya persis `DATABASE_URL` (huruf besar semua), lalu
**Redeploy**.

### `Can't reach database server`

Isi `DATABASE_URL` salah, atau connection string tidak diakhiri `?sslmode=require`.
Salin ulang dari dashboard Neon.

### Situs terbuka tapi muncul `Application error: a server-side exception`

Hampir selalu karena tabel belum dibuat. Ulangi [langkah 8](#8-buat-tabel-di-database-produksi).

Untuk melihat pesan aslinya: Vercel → project → tab **Logs** → pilih
**Runtime Logs**.

### `SESSION_SECRET belum diatur atau terlalu pendek`

Isi `SESSION_SECRET` minimal 16 karakter (disarankan 32+), lalu **Redeploy**.

### Gambar yang diunggah tidak muncul

Ini sudah ditangani otomatis: di Vercel berkas disimpan ke database dan
disajikan lewat `/api/files/[id]`. Kalau tetap tidak muncul, tambahkan
environment variable `FILE_STORAGE` dengan nilai `database`, lalu **Redeploy**.

### Build berhasil tapi halaman lambat saat pertama dibuka

Wajar pada paket gratis — server "tidur" kalau lama tidak diakses. Kunjungan
berikutnya akan jauh lebih cepat.

### `Too many connections` di database

Pastikan `DATABASE_URL` di Vercel memakai **URL A (yang ada `-pooler`)**,
bukan URL B.

### Ingin membatalkan deploy terakhir

Vercel → **Deployments** → pilih deploy lama yang tadinya berhasil →
titik tiga → **Promote to Production**.

---

## 16. Ringkasan perintah

```bash
# ---- Di komputer, sekali saja ----
git init
git add .
git commit -m "KosKu versi pertama"
git branch -M main
git remote add origin https://github.com/namaanda/kosku.git
git push -u origin main

# ---- Membuat tabel di database produksi ----
# (dengan DATABASE_URL mengarah ke URL B / tanpa pooler)
npx prisma db push

# ---- Mengisi data contoh (opsional) ----
npm run db:seed

# ---- Setiap kali ada perubahan kode ----
git add .
git commit -m "pesan perubahan"
git push
```

Checklist variabel di Vercel:

- [ ] `DATABASE_URL` — URL pooler dari Neon
- [ ] `SESSION_SECRET` — acak, 32+ karakter
- [ ] `CRON_SECRET` — acak, berbeda dari di atas
- [ ] `NEXT_PUBLIC_APP_URL` — alamat situs, tanpa garis miring di akhir

Selamat, aplikasi KosKu Anda sudah online. 🏠

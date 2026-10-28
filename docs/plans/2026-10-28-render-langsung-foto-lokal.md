# Plan: Halaman dirender langsung lagi, foto sampul disimpan di proyek

**Tanggal:** 2026-10-28
**Status:** ✅ Selesai

## Tujuan

Menghilangkan "loading sepersekian detik" yang dilihat user saat membuka halaman. Analisis di build production menemukan dua penyebab.

### 1. Kerangka dari perubahan sebelumnya (`34baa83`, plan `2026-10-28-navigasi-instan.md`)

- Sejak isi halaman artikel, topic, dan penulis dipindah ke dalam `<Suspense>`, HTML hasil build berupa **kerangka**. Isi lengkapnya ada di `<div hidden>`.
- React 19.2 baru menukarnya setelah foto sampul `priority` selesai dimuat, sehingga judul artikel tampil di ~585 ms. Di beranda, yang tanpa Suspense, judul tampil di ~120 ms.
- Tanpa JavaScript, ketiga halaman hanya menampilkan kerangka.
- Plan sebelumnya keliru menyebut kunjungan langsung tetap mendapat halaman lengkap.

### 2. Foto Picsum lambat

- Setiap foto butuh pengalihan (302) ke `fastly.picsum.photos` lalu unduhan, sekitar 0,7–0,9 detik.
- Picsum juga penyebab E2E kadang gagal (timeout `networkidle`).

**Keputusan user:** halaman dirender langsung lagi, dan foto disimpan di proyek.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | Halaman publik kembali dirender langsung, ditambah `instant = false` dengan komentar | Claude | `app/(public)/articles/[slug]/page.tsx`, `app/(public)/categories/[slug]/page.tsx`, `app/(public)/authors/[id]/page.tsx` | ✅ |
| 3 | Hapus kerangka | Claude | `components/ui/skeleton.tsx` (hapus), `app/styleguide/page.tsx`, `docs/design.md` | ✅ |
| 4 | Skrip foto: unduh ke `public/covers/<artikel>-<foto>.webp`, tulis jalur lokal ke `covers.json`, lalu jalankan | Claude | `scripts/fetch-picsum-covers.mjs`, `lib/mock/covers.json`, `public/covers/*` (baru) | ✅ |
| 5 | Sampul lokal lewat optimiser `next/image`; hapus kode Picsum | Claude | `components/article/article-cover.tsx`, `components/article/picsum-image.tsx` (hapus), `lib/images.ts` | ✅ |
| 6 | Sesuaikan unit test | Claude | `__tests__/motion-images.test.tsx`, `__tests__/article.test.tsx`, `__tests__/search.test.tsx` | ✅ |
| 7 | Dokumentasi | Claude | `docs/design.md`, `CLAUDE.md`, `docs/plans/2026-10-28-navigasi-instan.md` | ✅ |
| 8 | Verifikasi dan `code-reviewer` sekali | Claude | – | ✅ |
| 9 | Commit + push setelah konfirmasi | Claude | – | ✅ `613a882` |

## Yang dikerjakan

- **Halaman:**
  - Artikel, topic, dan penulis kembali sama persis dengan versi sebelum `34baa83`, ditambah `export const instant = false` beserta alasannya.
  - Kerangka beserta contohnya di styleguide dan design.md dihapus.
  - Rencana sebelumnya diberi catatan pembatalan.
- **Foto:**
  - 18 foto Picsum disimpan sebagai `public/covers/<artikel>-<foto>.webp`: 1600×1200 WebP, 33–232 KB per foto, 2,04 MB total. Id foto ada di nama file, jadi pilihan foto baru berarti URL baru.
  - `covers.json` hanya berubah di kolom `url`; kreditnya tetap.
  - `CoverImage` mengirim file lokal ke optimiser bawaan `next/image`. Kode Picsum (`PicsumImage`, `picsumLoader`, `isPicsum`) dihapus.
  - Jalur Unsplash API tidak diubah, karena foto Unsplash wajib di-hotlink.
- **Perubahan dari plan, hasil review:**
  - **Test:** sekarang menerima foto lokal maupun foto Unsplash, supaya `npm run covers -- --force` tidak membuat test gagal.
  - **Skrip foto:** mengunduh semua foto dulu, baru mengganti folder dan `covers.json`. Jadi kalau unduhan gagal di tengah jalan, foto lama tidak rusak.
  - **`next.config.ts`:**
    - `images.localPatterns` hanya untuk `/covers/**` tanpa query string; jalur lain ditolak dengan 400. Folder unggahan perlu ditambahkan di Fase 4.
    - `minimumCacheTTL` 31 hari, supaya hemat kuota optimiser di Vercel.
  - **`CLAUDE.md`:** ditambah catatan untuk Fase 2. `instant = false` juga mematikan pemeriksaan halaman statis, jadi output build harus dicek tetap ○.

## Verifikasi

| Cek | Hasil |
|-----|-------|
| tsc, lint, unit | ✅ 93 unit lulus. Lint dijalankan tanpa `.claude/` (lihat tindak lanjut) |
| Build | ✅ Halaman yang dikenal tetap statis (○) |
| Waktu tampil di production, artikel | ✅ Judul **585 → 142 ms**; foto sekitar 214 ms (sebelumnya 0,6–0,9 detik) |
| Waktu tampil di production, foto diperlambat 1,5 detik | ✅ Judul tetap tampil di 82 ms, tidak menunggu foto |
| Tanpa JavaScript | ✅ Artikel, topic, penulis, dan beranda tampil lengkap; tidak ada lagi isi yang tersembunyi |
| Optimiser | ✅ `/covers/…` disajikan sebagai WebP (17 KB untuk lebar 640 px) dengan cache 31 hari. Jalur lain dan query string ditolak (400) |
| Dev overlay | ✅ 0 issue di kelima rute dinamis |
| E2E | ✅ 484/484 sebelum dan sesudah perbaikan review, keduanya tanpa kegagalan acak (270 dilewati sesuai ukuran layar) |
| `code-reviewer` | Boleh di-commit setelah 1 temuan Sedang (test hanya menerima foto lokal) diperbaiki. Temuan Rendah 2–6 juga diperbaiki; no. 7 (lint dan worktree) jadi tindak lanjut |

## Tindak lanjut

- **Port E2E:** `playwright.config.ts` mengunci port 3200, yang juga dipakai proyek WNDR. E2E di sini dijalankan di port 3210 lewat config sementara.
- **Lint:** `npm run lint` gagal karena worktree lama `.claude/worktrees/next-16-4-3`. Hapus worktree itu, atau tambahkan `.claude/**` ke ignore ESLint.
- **Fase 2:** setelah query database masuk, pastikan ketiga halaman publik tetap ○ (static) di output build.
- **Fase 4:** tambahkan folder unggahan sampul ke `images.localPatterns`.

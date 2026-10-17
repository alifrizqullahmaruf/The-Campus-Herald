# Plan: Pasang logo ikon Side Notes

**Tanggal:** 2026-10-16
**Status:** ✅ Selesai

## Tujuan

Mengganti monogram "SN" dengan logo ikon buatan user: halaman dengan tiga garis teks, sticky note kuning miring dengan coretan pink, garis hitam tebal, dan bayangan keras (Konsep A, "catatan di pinggir halaman").

## Keputusan

| Topik | Keputusan |
|-------|-----------|
| Cara pemasangan | Gambar ulang sebagai SVG vektor (tajam di semua ukuran, latar transparan, beberapa KB, warna sesuai token) |
| File asli | Dipindah ke `docs/brand/side-notes-logo-source.jpg` (ikut di-commit, tidak bisa diakses dari website) |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Pilih cara pemasangan dan lokasi file asli | User | – | ✅ |
| 2 | Gambar ulang logo sebagai SVG, dicocokkan berdampingan dengan gambar asli | Claude | `lib/brand-mark.ts`, `components/layout/logo-mark.tsx` | ✅ |
| 3 | Favicon versi sederhana (garis lebih tebal, detail dikurangi), dicek di 16, 32, dan 64 px | Claude | `app/icon.svg` | ✅ |
| 4 | Pasang di header (juga login dan 404 lewat komponen `Logo`) dan sidebar dashboard | Claude | `components/layout/logo.tsx`, `components/dashboard/sidebar.tsx` | ✅ |
| 5 | Gambar Open Graph 1200×630: ikon + nama + byline + tagline | Claude | `app/opengraph-image.tsx` | ✅ |
| 6 | Pindahkan JPG asli dari `public/` | Claude | `docs/brand/side-notes-logo-source.jpg` | ✅ |
| 7 | design.md bagian 0 (logo, favicon, link preview), `lib/site.ts` (monogram dihapus), test | Claude | `docs/design.md`, `lib/site.ts`, `__tests__/layout.test.tsx` | ✅ |
| 8 | Verifikasi | Claude | – | ✅ |
| 9 | Review tampilan logo | User | – | ✅ |
| 10 | Commit + push | Claude | – | ✅ |

## Tambahan di luar plan

- **`metadataBase` di `app/layout.tsx`:** tanpa ini, link `og:image` mengarah ke `localhost`. Sekarang memakai `NEXT_PUBLIC_SITE_URL` kalau diisi (domain sendiri), lalu `VERCEL_PROJECT_PRODUCTION_URL` (otomatis di Vercel), dan `localhost:3000` saat pengembangan.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 77 lulus (baru: ikon logo berupa SVG dekoratif tanpa huruf) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ `/icon.svg` dan `/opengraph-image` statis |
| `npm run test:e2e` | ✅ 64 lulus |
| Tampilan | ✅ Header 1280px dan 375px, sidebar dashboard, gambar OG (200, 54 KB) |

## Masalah yang ditemukan dan diperbaiki

| Masalah | Perbaikan |
|---------|-----------|
| Build gagal di `/opengraph-image`: `ImageResponse` mewajibkan `display: flex` untuk div dengan lebih dari satu anak (`by ` + nama) | Teks digabung menjadi satu string |
| `Buffer` tidak tersedia di browser, sedangkan sidebar adalah client component | `lib/brand-mark.ts` hanya berisi string SVG. Konversi base64 dilakukan di file OG yang berjalan di server |

## Tindak lanjut

- **Teks di gambar OG masih tipis**, karena memakai font bawaan generator yang hanya punya ketebalan normal. Agar memakai Archivo yang tebal seperti di website, file `Archivo-Black.ttf` (lisensi OFL, dari Google Fonts) perlu diunduh ke repo. Perlu persetujuan user untuk mengunduh.
- **Isi `NEXT_PUBLIC_SITE_URL`** di Vercel kalau nanti memakai domain sendiri.

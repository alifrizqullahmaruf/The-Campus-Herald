# Plan: Hapus template Next.js dan buat halaman awal The Campus Herald

**Tanggal:** 2026-10-14
**Status:** ✅ Selesai (2026-10-15)

## Tujuan

Menghapus semua sisa template `create-next-app` (logo Next.js/Vercel, tautan ke Vercel, teks "To get started…") dan menggantinya dengan halaman awal The Campus Herald berlatar putih.

## Keputusan

| Topik | Keputusan | Alasan |
|-------|-----------|--------|
| Isi halaman | Header + judul sederhana: "The Campus Herald" dan satu kalimat deskripsi | Kerangka beranda menunggu riset UI/UX (tahap 07) |
| Dark mode | Dihapus, latar selalu putih | Sementara, sampai riset UI/UX selesai |
| Sisa template lain | Metadata `layout.tsx` diganti, ikon di `public/` dihapus | Bersih dari sisa `create-next-app` |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi isi halaman dan keputusan | User | – | ✅ |
| 2 | Ganti isi halaman: judul + deskripsi, tanpa `next/image` dan tautan template | Claude | `app/page.tsx` | ✅ |
| 3 | Latar putih: hapus `bg-zinc-50` / `dark:*` dan blok dark mode CSS | Claude | `app/page.tsx`, `app/globals.css` | ✅ |
| 4 | Metadata: title "The Campus Herald", deskripsi bahasa Indonesia | Claude | `app/layout.tsx` | ✅ |
| 5 | Hapus 5 ikon template | Claude | `public/*.svg` | ✅ |
| 6 | Test memeriksa judul "The Campus Herald" | Claude | `__tests__/page.test.tsx` | ✅ |
| 7 | Verifikasi | Claude | – | ✅ |
| 8 | Perbarui dan rapikan plan | Claude | file ini | ✅ |

## File yang berubah

- `app/page.tsx`: ditulis ulang
- `app/globals.css`: blok `@media (prefers-color-scheme: dark)` dihapus
- `app/layout.tsx`: `metadata.title` dan `metadata.description`
- `__tests__/page.test.tsx`: memeriksa heading "The Campus Herald"
- `public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`: dihapus (folder `public/` kini kosong)

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 1/1 test lulus |
| `npm run lint` | ✅ Tanpa error |
| `npm run build` | ✅ Berhasil, `/` dirender statis |
| Halaman di dev server (`localhost:3001`) | ✅ Status 200, title dan judul benar, tidak ada sisa logo/tautan template |

Catatan: cek visual lewat Chrome tidak bisa dilakukan karena ekstensi tidak merespons, jadi halaman dicek lewat HTML hasil render.

## Tindak lanjut

- Riset UI/UX (tahap 07), lalu tentukan warna, tipografi, dan apakah dark mode kembali.
- `body` di `globals.css` masih memakai `font-family: Arial` bawaan template, yang menimpa font Geist dari `layout.tsx`. Diputuskan bersama riset UI.

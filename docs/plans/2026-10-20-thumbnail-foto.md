# Plan: Foto di thumbnail kecil (Most read dan palet pencarian)

**Tanggal:** 2026-10-20
**Status:** ✅ Selesai

## Masalah

Foto sampul Picsum (commit `6547a4e`) hanya dipasang di `ArticleCover` (kartu dan halaman artikel). Thumbnail kecil masih memanggil pola grafis `CoverArt` langsung, sehingga daftar **Most read** dan hasil palet **⌘K** tampil tanpa foto.

## Hasil

| Bagian | Yang dibuat |
|--------|-------------|
| Komponen bersama | `CoverImage` di `components/article/article-cover.tsx`: memilih loader Picsum / Unsplash / biasa, atau `CoverArt` tanpa foto. Tanpa bingkai dan kredit. `ArticleCover` memakainya juga, jadi aturan memilih sumber ada di satu tempat |
| Most read | `ArticleRow` memakai `CoverImage` (48 px) |
| Palet ⌘K | `SearchResult` dan `/api/search` mendapat `coverImage`; palet memakai `CoverImage` (40 px). Palet tetap dimuat lazy, jadi bundle awal tidak bertambah |
| Kredit | Tidak tampil di thumbnail (tidak muat); tetap ada di kartu dan halaman artikel. Untuk Picsum tidak wajib |
| Halaman About | Tetap pola grafis (ilustrasi umum, keputusan user) |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi plan | User | – | ✅ |
| 2 | `CoverImage` + `ArticleCover` memakainya | Claude | `components/article/article-cover.tsx` | ✅ |
| 3 | Most read memakai foto | Claude | `components/article/article-row.tsx` | ✅ |
| 4 | Palet memakai foto | Claude | `lib/search.ts`, `app/api/search/route.ts`, `components/search/command-palette.tsx` | ✅ |
| 5 | Test | Claude | `__tests__/article.test.tsx`, `__tests__/search.test.tsx`, `e2e/motion.spec.ts` | ✅ |
| 6 | Verifikasi + `code-reviewer` | Claude | – | ✅ |
| 7 | Commit + push | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 92 lulus (baru: thumbnail Most read dengan foto dan tanpa foto; hasil API punya `coverImage`) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 74 lulus + test baru "Most read thumbnails show the cover photos" (5 foto benar-benar termuat) |
| Tampilan | ✅ Most read di beranda dan palet ⌘K menampilkan foto |
| `code-reviewer` | Tidak ada temuan Kritis/Tinggi/Sedang. Komentar usang di `ArticleRow` dirapikan |

## Tindak lanjut

- **Fase 2/4:** foto dari host selain Picsum/Unsplash akan gagal (`next/image` tanpa `remotePatterns`), dan sekarang juga di palet. Saat author bisa mengunggah sampul, batasi sumber foto saat validasi, atau beri fallback ke `CoverArt` di `CoverImage`.
- Kalau beralih ke Unsplash API, cek ulang pedoman atribusi untuk thumbnail tanpa kredit.

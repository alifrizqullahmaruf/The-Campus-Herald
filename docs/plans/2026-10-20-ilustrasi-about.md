# Plan: Ilustrasi khusus di halaman About

**Tanggal:** 2026-10-20
**Status:** ✅ Selesai dan di-commit (push menyusul atas permintaan user)

## Masalah

Bagian "Why we built it" di `/about` masih memakai pola grafis umum (`CoverArt`, segitiga dan bulatan), sehingga terlihat seperti placeholder. User memilih **ilustrasi khusus (SVG)**, bukan foto.

## Hasil

| Bagian | Yang dibuat |
|--------|-------------|
| Cerita gambar | "Group chats bury the news": HP dengan pesan di layarnya, ditimbun **tumpukan gelembung chat** warna lima topic; **sticky note kuning** dengan coretan pink (motif logo Side Notes) menyembul keluar dari tumpukan |
| Gaya | Garis tinta tebal, sudut membulat, latar titik-titik, semua warna lewat token CSS (`--color-cat-*`, `--color-ink`, `--color-paper`, `--color-surface`, `--color-accent`). Tanpa teks |
| Bingkai | Tetap kartu miring yang lama |
| Aksesibilitas | Dekoratif (`aria-hidden`); makna ada di judul dan paragraf |
| Gerak | Statis |
| Komponen | `components/about/buried-notes-art.tsx` (baru, SVG inline, server component), dipakai di `app/(public)/about/page.tsx` |

### Perubahan selama pengerjaan

- Tanda "terangkat" di atas sticky note dihapus, karena bertabrakan dengan speaker HP dan terlihat seperti antena.
- Gelembung di layar HP digeser supaya tidak tertutup sticky note.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi plan | User | – | ✅ |
| 2 | Gambar ilustrasi SVG | Claude | `components/about/buried-notes-art.tsx` (baru) | ✅ |
| 3 | Pasang di halaman About | Claude | `app/(public)/about/page.tsx` | ✅ |
| 4 | Cek tampilan desktop + HP, revisi; user menilai hasilnya | Claude, User | – | ✅ (Claude), menunggu penilaian user |
| 5 | Unit test | Claude | `__tests__/motion-images.test.tsx` | ✅ |
| 6 | Verifikasi + `code-reviewer` | Claude | – | ✅ |
| 7 | Commit (push menyusul) | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 93 lulus (baru: ilustrasi dekoratif, tanpa teks dan tanpa gambar luar) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 75 lulus, 2× berturut-turut. Satu kegagalan sebelumnya di test `/authors` (tidak terkait) terjadi saat suite berjalan bersamaan dengan dev server; test itu lulus 3/3 saat dijalankan sendiri |
| Tampilan | ✅ Desktop 1280 px dan HP 375 px |
| `code-reviewer` | Tidak ada temuan Kritis/Tinggi/Sedang. Dua temuan Rendah diperbaiki: rect yang tidak berpengaruh di gelembung dihapus, dan plan ini diperbarui |
| Review akhir sebelum commit | Garis "teks" di gelembung pendek satu baris bisa terbalik (panjang negatif); diperbaiki. Test, lint, tsc, build ulang ✅ |

## Tindak lanjut

- **Test E2E `flows.spec.ts` kadang gagal tepat setelah build** (server baru menyala, dev server lain berjalan bersamaan): dua kali muncul, lalu 54/54 lulus saat diulang. Perlu diselidiki, misalnya pemanasan server sebelum test atau batas tunggu `expect` yang lebih longgar. Cocok jadi tugas pertama subagent QA.

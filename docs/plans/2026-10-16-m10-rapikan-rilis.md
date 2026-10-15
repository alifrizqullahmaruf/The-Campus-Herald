# Plan M10: Rapikan dan rilis pratinjau

**Tanggal:** 2026-10-16
**Status:** ✅ Selesai (kecuali deploy, menunggu user)
**Bagian dari:** [roadmap](2026-10-15-roadmap.md), Fase 1

## Tujuan

Menutup Fase 1:
- halaman 404 dan error
- test E2E di browser sungguhan
- audit aksesibilitas dan performa
- dokumentasi diperbarui (CLAUDE.md, spesifikasi tahap 07 dan 09, design.md)
- siap di-deploy ke Vercel

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Halaman 404 bergaya dan halaman error (dengan tombol coba lagi) | Claude | `app/not-found.tsx`, `app/(public)/error.tsx`, `app/dashboard/error.tsx` | ✅ |
| 2 | Playwright + axe sebagai dev dependency. Memakai Microsoft Edge yang sudah terpasang (`channel: "msedge"`), jadi tidak mengunduh browser. Vitest dibatasi ke `__tests__/` | Claude | `package.json`, `playwright.config.ts`, `vitest.config.mts` | ✅ |
| 3 | Test E2E: semua halaman terbuka tanpa error konsol, audit axe (WCAG 2.1 AA) di halaman utama, palet ⌘K (buka, ketik, ↵), menu HP, filter pencarian, alur review (Approve), editor (validasi), 404 | Claude | `e2e/*.spec.ts` | ✅ |
| 4 | Lighthouse (mobile) untuk beranda dan halaman artikel, dengan target NFR halaman di bawah 3 detik | Claude | – | ✅ |
| 5 | Perbaiki temuan audit | Claude | sesuai temuan | ✅ |
| 6 | CLAUDE.md: ganti "masih scaffold" dengan gambaran arsitektur sekarang (route groups, lapisan data mock, komponen) dan perintah E2E | Claude | `CLAUDE.md` | ✅ |
| 7 | Spesifikasi: isi tahap 07 (link design.md + keputusan desain) dan link repo di tahap 09; perbarui pertanyaan terbuka design.md | Claude | `docs/the-campus-herald.md`, `docs/design.md` | ✅ |
| 8 | Deploy ke Vercel: buat akun / login, impor repo GitHub, deploy | User | – | Menunggu user |
| 9 | Perbarui roadmap, verifikasi, commit + push | Claude | `docs/plans/2026-10-15-roadmap.md` | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 73 test unit lulus |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 64 lulus. **Desktop (45):** 17 halaman masing-masing punya satu h1, tanpa error konsol, tanpa pelanggaran axe WCAG 2.1 AA; 404 bergaya; draft/pending tidak publik; 9 alur (Ctrl+K → ↵, Esc mengembalikan fokus, form cari header tanpa palet, filter desk + URL, kartu author, Approve dua langkah, editor kosong ditolak, editor menerima heading, login). **HP 375px (19):** 17 halaman tanpa scroll horizontal, menu HP, tab bar dashboard |
| Lighthouse mobile (slow 4G simulasi) | Beranda: performance 94, accessibility 100, best practices 100, SEO 100, LCP 3,1 s. Artikel: 95/100/100/100, LCP 2,8 s. Pencarian: 95/100/100/100, LCP 2,9 s |

## Temuan audit dan perbaikannya

| Temuan | Perbaikan |
|--------|-----------|
| Kontras: angka dekoratif (`text-ink/20`, 1,5:1) di Most read, antrean review, langkah About | Diganti `text-ink/50` (3,4–3,5:1, cukup untuk teks besar) |
| Kontras: tombol filter tidak aktif memakai `opacity-80` di atas warna kategori | Opacity dihapus. Keadaan aktif tetap ditandai garis putus-putus dan bayangan |
| Error konsol: `/favicon.ico` 404 di semua halaman | Ditambah `app/icon.svg` (monogram "CH") |
| Konfigurasi: test HP ikut jalan di proyek desktop | `testIgnore` untuk `mobile.spec.ts` di proyek desktop |
| LCP beranda | `Geist Mono` tidak di-preload lagi. LCP tetap 3,1 s karena elemen terbesar adalah judul hero yang menunggu Archivo (90 KB). Lihat Tindak lanjut |
| Konvensi Next 16.4 | `error.tsx` memakai `retry()` sesuai dokumentasi (bukan `reset()`) |

## File yang berubah

| File | Perubahan |
|------|-----------|
| `app/not-found.tsx`, `app/(public)/error.tsx`, `app/dashboard/error.tsx`, `components/ui/error-panel.tsx`, `app/icon.svg` | Baru |
| `playwright.config.ts`, `e2e/*` | Baru. `vitest.config.mts` dibatasi ke `__tests__/` |
| `package.json` | Tambah `@playwright/test`, `@axe-core/playwright`, dan skrip `test:e2e` |
| `.gitignore` | Tambah folder hasil Playwright |
| `CLAUDE.md` | Bagian Architecture baru, perintah E2E, catatan kontras |
| `docs/the-campus-herald.md` | Tahap 07 terisi, link repo di tahap 09 |
| `docs/design.md` | Pertanyaan terbuka diperbarui, bagian 10 berisi catatan implementasi |
| `docs/plans/2026-10-15-roadmap.md` | Hasil Fase 1 |

## Tindak lanjut

- **User: deploy ke Vercel (P5).**
  1. Login ke vercel.com dengan GitHub.
  2. Pilih "Add New → Project" dan impor repo `The-Campus-Herald`.
  3. Klik Deploy. Pengaturan bawaan Next.js sudah cukup.
  4. Kirim link demo-nya, nanti saya isi di tahap 09 spesifikasi.
- **Keputusan LCP beranda (3,1 s, target < 3 s):** subset Archivo atau `display: "optional"`. Rinciannya ada di design.md bagian 9.
- **Fase 2 (database):** brainstorming dulu.

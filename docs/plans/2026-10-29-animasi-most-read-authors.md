# Plan: Animasi masuk untuk Most read dan kartu Authors

**Tanggal:** 2026-10-29 (selesai 2026-10-31)
**Status:** ✅ Selesai, terverifikasi, di-commit dan di-push

## Tujuan

"This week · Most read." dan kartu di halaman Authors belum punya animasi masuk. Alasannya ada di `docs/plans/2026-10-28-animasi-halaman.md`: Authors dianggap sudah punya kartu berbalik, dan Most read tidak termasuk daftar waktu itu.

Animasi masuk ditambahkan dengan gaya yang sama seperti yang sudah ada (`docs/design.md` 2.5): cepat, ease-out, sedikit miring, CSS saja. Tanpa JavaScript dan dengan gerak dikurangi, keduanya langsung di posisi akhir.

**Keputusan user:**

- Most read memakai "baris naik bergantian" (`rise-row`).
- Teaser "Meet the authors." di About ikut memakai tumpukan → grid.

## Hasil

| Bagian | Animasi | Kapan |
|--------|---------|-------|
| Most read (beranda, `/categories`, topic di bawah `lg`) | Setiap baris naik 24 px dan lurus dari kemiringan seeded (≤ 3°, `riseStyle`). Tanpa `opacity` | Mengikuti scroll (`rise-row`, `view()`, `entry 0% cover 25%`). Baris masuk layar satu per satu, jadi naiknya bergantian |
| Most read di sidebar topic, dari `lg` | Sama | Sekali saat dimuat: 450 ms, jeda 70 ms (`data-rise="load-lg"`, prop `riseOnLoad`). Sidebar `sticky` di dekat atas halaman, jadi versi scroll-linked tidak akan terlihat |
| Kartu Authors | Tumpukan → grid (`pile-card`, `pileStyle(i, 4)`) | Semua kartu sekali saat dimuat (`data-pile="load"`), seperti tile Categories |
| "Meet the authors." di About | Tumpukan → grid | Mengikuti scroll |

Kartu yang berbalik saat hover tetap jalan. Tumpukan bergerak di `<li>`, sedangkan efek berbalik ada di elemen dalam kartu.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan dan pilihan desain | User | – | ✅ |
| 2 | `rise-row` (scroll-linked + `data-rise="load-lg"`) dan `riseStyle(i)` | Claude | `app/globals.css`, `lib/motion.ts` | ✅ |
| 3 | Most read memakai `rise-row`; prop `riseOnLoad` untuk sidebar topic | Claude | `components/article/most-read.tsx`, `app/(public)/categories/[slug]/page.tsx` | ✅ |
| 4 | Kartu Authors: `pile-card` + `pileStyle(i, 4)`, semua tersusun saat dimuat | Claude | `app/(public)/authors/page.tsx` | ✅ |
| 5 | Teaser "Meet the authors." di About: `pile-card`, mengikuti scroll | Claude | `app/(public)/about/page.tsx` | ✅ |
| 6 | Test unit dan E2E | Claude | `__tests__/motion-images.test.tsx`, `e2e/motion.spec.ts` | ✅ |
| 7 | Dokumentasi | Claude | `docs/design.md` (tabel 2.5), `CLAUDE.md` (Motion) | ✅ |
| 8 | Verifikasi, `code-reviewer` sekali, perbaikan temuan review | Claude | `app/globals.css`, `docs/design.md`, `e2e/motion.spec.ts` | ✅ |
| 9 | Commit + push (dikonfirmasi user) | User / Claude | – | ✅ |

## Perubahan dari plan

- **Semua kartu Authors tersusun saat dimuat, bukan hanya baris pertama.** Di 1280×800, kartu ke-5 (baris kedua) yang menunggu scroll terlihat miring, tertarik ke atas, dan menutupi baris pertama. Ini masalah yang sama dengan tile Categories dulu, yang diputuskan dengan "tersusun saat dimuat".
- **Dari review (`code-reviewer`: tidak ada temuan Kritis/Tinggi/Sedang; 4 temuan Rendah, semuanya ditangani):**
  - Jeda `data-pile="load"` dibatasi 8 langkah (`min(var(--pile-i), 7)`). Kalau penulis bertambah di Fase 2, semua kartu tetap tersusun dalam sekitar 1 detik.
  - Komentar CSS dan `design.md` untuk sidebar topic dibuat akurat: di layar setinggi laptop, hanya baris atas yang terlihat saat dimuat.
  - Test E2E "baris menunggu sebelum di-scroll" memakai `expect.poll`, karena view timeline bisa butuh satu frame setelah load.
  - Plan ini diperbarui.
- **Lingkungan test:** pada 2026-10-31, Edge 156 yang terpasang mulai crash setiap kali membuka halaman (`browser.newPage: Target crashed`). Satu run E2E sebelumnya hari itu masih lolos dengan Edge yang sama. Masalahnya ada di Edge, bukan di kode:
  - Chromium bawaan Playwright (156.0.8078.4, sudah ada di cache) berjalan normal.
  - Verifikasi akhir memakai salinan config proyek di scratchpad dengan Chromium itu (proyek, ukuran layar, dan port sama).
  - `playwright.config.ts` tidak diubah.

## File yang berubah

- `lib/motion.ts`: `riseStyle(i)`.
- `app/globals.css`:
  - `row-rise` / `rise-row`.
  - `.rise-row[data-rise="load-lg"]`.
  - Batas jeda `pile-card` saat dimuat.
- `components/article/most-read.tsx`: `rise-row` per baris, prop `riseOnLoad`.
- `app/(public)/categories/[slug]/page.tsx`: `<MostRead compact riseOnLoad />`.
- `app/(public)/authors/page.tsx`: `pile-card` + `data-pile="load"`.
- `app/(public)/about/page.tsx`: teaser `pile-card`.
- `__tests__/motion-images.test.tsx`: `riseStyle`.
- `e2e/motion.spec.ts`:
  - Most read naik saat di-scroll.
  - Sidebar topic dan kartu Authors beranimasi saat dimuat, lalu diam di posisi akhir.
  - Dengan gerak dikurangi, tidak ada yang bergerak.
- `docs/design.md`, `CLAUDE.md`.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 99/99 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ tanpa peringatan |
| E2E (`npm run test:e2e`, Edge), sebelum perbaikan review | ✅ 494 lolos, 0 gagal (491 + 3 test baru) |
| E2E sesudah perbaikan review | ✅ 494 lolos, 0 gagal (Chromium bawaan; Edge crash, lihat di atas) |
| Pengukuran nilai animasi | ✅ Most read naik bergantian mengikuti scroll di 375 dan 1280 px; sidebar topic di 1280 px selesai < 800 ms; kartu Authors diam < 1,6 s di 375, 768, 1280, 1440 px, tanpa overflow; teaser About tersusun saat di-scroll |
| Sweep (`/`, `/about`, `/categories`, topic, `/authors`; 375 dan 1280 px; gerak normal dan dikurangi) | ✅ CLS 0, tanpa overflow, animasi macet, atau console error |
| `code-reviewer` | 0 Kritis/Tinggi/Sedang; 4 Rendah, semuanya ditangani |

## Tindak lanjut

- **Edge 156 crash di Playwright.** Keputusan user: biarkan dulu. Coba lagi setelah Edge restart atau update. Kalau masih crash, pertimbangkan menaikkan `@playwright/test` atau memakai Chromium bawaan di `playwright.config.ts`.

# Plan: Navigasi instan (peringatan "URL data outside of Suspense")

**Tanggal:** 2026-10-28
**Status:** ✅ Selesai (menunggu konfirmasi commit)

## Tujuan

Peringatan dev Next.js 16 *"Next.js encountered URL data outside of Suspense"* (`app/(public)/articles/[slug]/page.tsx:31`) dihilangkan, dan klik ke halaman artikel, topic, atau penulis langsung menampilkan sesuatu tanpa menunggu server.

**Penyebab:**
- Halaman membaca `params` (slug dari URL) di paling atas, di luar `<Suspense>`.
- Dokumentasi Next.js (`instant-navigation.md`, `optimizing-prefetching.md`) menyebut `params` tetap perlu `<Suspense>`, walaupun nilainya sudah disiapkan oleh `generateStaticParams`.
- Ada 5 halaman dengan pola ini.

**Keputusan user (campuran):**

| Halaman | Perbaikan |
|---------|-----------|
| `/articles/[slug]`, `/categories/[slug]`, `/authors/[id]` | Isi dipindah ke komponen anak di dalam `<Suspense>`, dengan kerangka (skeleton) sebagai fallback |
| `/dashboard/articles/[id]`, `/dashboard/review/[id]` | `export const instant = false`. Ditinjau lagi saat dashboard dibangun ulang dengan login (Fase 3) |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | Komponen `Skeleton` dan tiga fallback halaman | Claude | `components/ui/skeleton.tsx` (baru) | ✅ |
| 3 | Halaman artikel: isi di dalam `<Suspense>` | Claude | `app/(public)/articles/[slug]/page.tsx` | ✅ |
| 4 | Halaman topic: isi di dalam `<Suspense>` | Claude | `app/(public)/categories/[slug]/page.tsx` | ✅ |
| 5 | Halaman penulis: isi di dalam `<Suspense>` | Claude | `app/(public)/authors/[id]/page.tsx` | ✅ |
| 6 | Dashboard: `instant = false` dengan komentar | Claude | `app/dashboard/articles/[id]/page.tsx`, `app/dashboard/review/[id]/page.tsx` | ✅ |
| 7 | Dokumentasi: aturan kerangka di desain, contoh di styleguide, catatan arsitektur | Claude | `docs/design.md`, `app/styleguide/page.tsx`, `CLAUDE.md` | ✅ |
| 8 | Verifikasi dan `code-reviewer` sekali | Claude | – | ✅ |
| 9 | Commit + push setelah konfirmasi | Claude | – | Menunggu konfirmasi |

## Yang dikerjakan

- **Kerangka (`components/ui/skeleton.tsx`):**
  - Balok pudar `bg-ink/10`, berdenyut hanya kalau gerak diizinkan (`motion-safe:animate-pulse`).
  - Tersembunyi dari pembaca layar. Setiap fallback berada dalam `role="status"` dengan label "Loading …" yang tidak terlihat.
  - Tiap halaman punya fallback yang meniru tata letaknya. Kartu meniru `ArticleCard`. Kerangka topic memakai kotak yang sama dengan h1-nya (ikon di atas nama di HP, di samping nama mulai `sm`).
- **Kunjungan langsung:** halaman yang dikenal tetap dibuat statis penuh saat build. Kerangka hanya muncul saat klik antarhalaman dan untuk slug yang tidak dikenal.
- **Perubahan dari plan:** setelah review, kerangka disesuaikan dengan ukuran halaman asli. Hasil pengukuran di 375 dan 1280 px:

  | Halaman | Selisih dengan halaman asli |
  |---------|------------------------------|
  | Header topic dan penulis | ≤ 6 px |
  | Kartu | 3 px |
  | Judul artikel berpanjang tengah | 1–2 px |
  | Judul artikel terpanjang (60 karakter) | Satu baris |

## Verifikasi

| Cek | Hasil |
|-----|-------|
| tsc, lint, unit | ✅ 94 unit lulus. Lint dijalankan tanpa `.claude/` (lihat tindak lanjut) |
| Build | ✅ Halaman yang dikenal tetap statis (○); ketiga rute publik mendapat fallback shell berisi kerangka |
| Dev overlay | ✅ 0 issue di kelima rute |
| Tampilan kerangka | ✅ Dicek lewat screenshot di 375 dan 1280 px, tanpa overflow |
| E2E | ✅ 484/484 pada kode final, run penuh tanpa kegagalan (270 dilewati sesuai ukuran layar). Lihat catatan di bawah untuk run sebelumnya |
| `code-reviewer` | Boleh di-commit; hanya temuan Rendah. Temuan 1–4 (tata letak kerangka) diperbaiki. Temuan 5 (slug tak dikenal tanpa JS tetap menampilkan kerangka) dicatat di `CLAUDE.md` |

**Catatan E2E:**
- E2E dijalankan di port 3210 lewat config sementara, karena port 3200 dipakai proyek WNDR (`next start -p 3200`). Config proyek mengunci port 3200 dengan `reuseExistingServer: true`, sehingga `npm run test:e2e` akan menguji aplikasi WNDR.
- Kegagalan yang muncul semuanya acak dan lulus saat diulang:
  - `SyntaxError` di dalam skrip axe (`/dashboard/authors`, `/dashboard/review/21`).
  - Timeout `networkidle` karena foto Picsum (`/authors/5`, `/authors/6` di 320 px).

## Tindak lanjut

- **Port E2E:** buat port test bisa diatur (misalnya `E2E_PORT`), atau pindahkan ke port yang tidak dipakai proyek lain. Ini mungkin juga penyebab "server test mati di tengah run" sebelumnya.
- **`SyntaxError` axe yang acak:** perlu diselidiki, karena muncul di halaman yang berbeda-beda.
- **Worktree lama `.claude/worktrees/next-16-4-3`:** membuat `npm run lint` gagal (7.625 masalah dari folder `.next` di dalamnya). Bisa dihapus, atau `.claude/**` ditambahkan ke ignore ESLint.
- **Opsional:**
  - Prefetch per link (`<Link prefetch>`), supaya isi artikel sudah ada sebelum diklik.
  - Test `instant()` dari `@next/playwright`.

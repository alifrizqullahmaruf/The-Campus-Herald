# Plan: Persiapan sebelum Fase 2

**Tanggal:** 2026-11-02
**Status:** ✅ Selesai, terverifikasi, di-commit dan di-push

## Tujuan

Dua pekerjaan kecil dari roadmap ("Tahap dekat", tugas 2 dan 3), yang user pilih untuk dikerjakan sebelum Fase 2 (`2026-11-02-fase-2-database.md`):

1. **Semua halaman membaca data lewat `lib/data`.** Dashboard masih mengimpor `lib/mock` langsung. Setelah dirapikan, Fase 2 cukup mengganti isi `lib/data/*`, dan Fase 3 cukup mengganti "user pratinjau" dengan user yang login.
2. **Test E2E `flows.spec.ts` yang kadang gagal tepat setelah build** diselidiki, supaya hasil verifikasi Fase 2–5 bisa dipercaya.

## Hasil

### 1. Dashboard lewat `lib/data` (`clean-code`, tanpa perubahan perilaku)

- **`getPreviewUser(role)`** baru di `lib/data/session.ts`.
  - Dipakai layout dan halaman dashboard, menggantikan `PREVIEW_*_ID` + `getAllUsers().find(...)!`.
  - Props `Sidebar`/`DashboardTopBar` sama persis. Fase 3 mengganti fungsi ini dengan session sungguhan.
- **`isAdminPath`** dipindah tanpa perubahan ke `lib/dashboard-paths.ts`.
  - File ini murni, tanpa impor, sehingga aman untuk sidebar yang merupakan komponen client.
  - `lib/mock/session.ts` tinggal dua konstanta.
- **Tidak ada lagi impor `lib/mock`** di luar `lib/data`, `__tests__/`, dan `scripts/`. `lib/data` siap dijadikan server-only di Fase 2.
- **Butir 3** usulan (menyatukan daftar path admin) ditunda ke Fase 3, sesuai keputusan user.

### 2. `flows.spec.ts` yang kadang gagal (`qa-tester`)

- **Penyebab: di test, bukan bug aplikasi.**
  - Tiga test palet ⌘K menekan Ctrl+K setelah `networkidle`.
  - Listener shortcut baru dipasang di `useEffect` setelah hydrate, dan `networkidle` tidak menunggunya.
  - Saat mesin sibuk (suite penuh, server baru menyala), tekanannya hilang dan palet tidak terbuka.
- **Bukti:**
  - Tanpa beban, semua lolos (12/12; 120/120 dengan `--repeat-each 10 --workers 16`).
  - Dengan CPU diperlambat 4× lewat CDP, gagal 9 dari 48, semuanya di test palet.
  - Klik dan isian sebelum hydrate tidak bermasalah, karena React 19 meng-hydrate saat diklik.
- **Perbaikan:**
  - Helper `openQuickSearch` menekan Ctrl+K hanya selama palet belum tampil, dicoba ulang sampai 15 s.
  - Dari review: test pertama sekarang juga memastikan bahwa setelah hydrate **satu** tekanan sudah membuka palet (Escape lalu Ctrl+K sekali, tanpa retry), supaya bug "baru terbuka pada tekanan kedua" tetap ketahuan.
  - Setelah perbaikan: 36/36 di CPU 4× dan 6×; 120/120 dengan `--repeat-each 10 --workers 16`.
- **Unit test baru** untuk `getPreviewUser` dan `isAdminPath` (`__tests__/dashboard-session.test.ts`).

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan (butir 1–2; butir 3 ditunda ke Fase 3) | User | – | ✅ |
| 2 | `clean-code` apply butir 1 dan 2 | Claude (`clean-code`) | `lib/data/session.ts` (baru), `lib/dashboard-paths.ts` (baru), `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/dashboard/sidebar.tsx`, `lib/mock/session.ts` | ✅ |
| 3 | `qa-tester` menyelidiki `flows.spec.ts`; perbaikan test; unit test baru | Claude (`qa-tester`) | `e2e/flows.spec.ts`, `__tests__/dashboard-session.test.ts` (baru) | ✅ |
| 4 | Perbarui `CLAUDE.md` dan roadmap lokal | Claude | `CLAUDE.md`, `docs/plans/2026-10-15-roadmap.md` (lokal) | ✅ |
| 5 | Verifikasi, `code-reviewer` sekali, perbaikan temuan | Claude | `e2e/flows.spec.ts`, `docs/plans/2026-11-02-fase-2-database.md` | ✅ |
| 6 | Commit + push (dikonfirmasi user) | User / Claude | – | ✅ |

## File yang berubah

- `lib/data/session.ts`, `lib/dashboard-paths.ts` (baru)
- `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`, `components/dashboard/sidebar.tsx`, `lib/mock/session.ts`
- `e2e/flows.spec.ts`, `__tests__/dashboard-session.test.ts` (baru)
- `CLAUDE.md` (preview user lewat `lib/data/session.ts`, `isAdminPath` di `lib/dashboard-paths.ts`)
- `docs/plans/2026-11-02-fase-2-database.md`: draft Fase 2 dari brainstorm. Ikut di-commit sebagai draft; fakta `cover_alt` dan cara menjalankan seed sudah dikoreksi dari review.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 115/115 (13 file, +9 test baru) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅. Halaman dashboard tetap ○ static |
| `npm run test:e2e` (oleh `qa-tester`, pada kode final sebelum cek ketat ditambahkan) | ✅ 499 lolos, 0 gagal |
| `flows.spec.ts` dengan cek ketat dari review, `--repeat-each 3` | ✅ 36/36 |
| `grep` impor `lib/mock` di luar `lib/data` | ✅ tidak ada |
| `code-reviewer` | Tidak ada Kritis/Tinggi/Sedang; 6 Rendah: 3 diperbaiki (cek ketat Ctrl+K, dua fakta di draft Fase 2), 1 masuk plan ini (penyebab QA), 2 jadi tindak lanjut |

## Tindak lanjut

- **Race serupa di dua test lain** (belum pernah gagal): test Esc di `e2e/flows.spec.ts` (klik chip sebelum hydrate) dan test ikon search di HP di `e2e/responsive.spec.ts` (klik sebelum hydrate bisa membuka `/search`, bukan palet). Bisa memakai helper tunggu-hydrate bersama.
- **Bug kecil yang sudah ada:** di `components/search/command-palette-trigger.tsx`, menekan Ctrl+K lagi saat palet sudah terbuka menimpa `returnFocus`, sehingga fokus jatuh ke `body` saat palet ditutup. Perbaikannya: simpan `returnFocus` hanya kalau palet belum terbuka. Perlu plan tersendiri.
- **Butir 3 `clean-code`** (satu daftar path admin) di Fase 3.

# Plan: Transisi yang sama di semua perpindahan halaman

**Tanggal:** 2026-10-28
**Status:** ✅ Selesai

## Tujuan

User melihat crossfade antarhalaman tidak konsisten. Hasil pengukuran di build production, dengan menghitung `document.startViewTransition` di setiap klik:

| Perpindahan | Sebelum |
|-------------|---------|
| Antarhalaman publik (10 jalur) | Crossfade, tapi isi **250 ms** (default browser, bukan 200 ms) dan kotak isi bergerak dari posisi lama |
| Publik → Login, antarhalaman dashboard, Dashboard → publik | **Tidak ada** |

**Penyebab:** `<ViewTransition>` hanya ada di dalam `<main>` layout publik, sehingga login, dashboard, dan perpindahan antar-area tidak ikut.

**Keputusan user:**
- Semua perpindahan mendapat transisi yang sama.
- Setelah review menemukan masalah posisi scroll, user memilih **"halaman baru memudar masuk"**, bukan crossfade penuh dengan koreksi scroll.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | `<ViewTransition>` di layout paling atas; layout publik dibungkus satu `div` | Claude | `app/layout.tsx`, `app/(public)/layout.tsx` | ✅ |
| 3 | Nama tetap untuk header publik, sidebar, dan tab bar dashboard (kelas `chrome`) | Claude | `components/layout/site-header.tsx`, `components/dashboard/sidebar.tsx` | ✅ |
| 4 | CSS "Page changes" | Claude | `app/globals.css` | ✅ |
| 5 | Dokumentasi | Claude | `docs/design.md`, `CLAUDE.md` | ✅ |
| 6 | Verifikasi dan `code-reviewer` (dua kali, karena perbaikan review cukup besar) | Claude | – | ✅ |
| 7 | Commit + push setelah konfirmasi | Claude | – | ✅ Commit (push ditunda atas permintaan user) |

## Hasil

| Bagian | Cara kerja |
|--------|------------|
| **Setiap navigasi** (link atau `router.push`) | Halaman baru memudar masuk dalam 200 ms, dan halaman lama langsung hilang. Kotak isi tidak bergerak atau berubah ukuran |
| **Header publik, sidebar dan tab bar dashboard** | Diam di dalam areanya. Saat pindah area (publik ↔ login/dashboard), ikut memudar masuk atau keluar |
| **Yang tidak beranimasi** | Kemunculan isi setelah halaman tampil (hasil Search, editor Tiptap, palet ⌘K) dan tombol back/forward browser |
| **Gerak dikurangi** | Halaman langsung berganti |

**Perubahan dari plan:**

1. **Nama otomatis React menimpa nama header.** React memberi nama transisi pada elemen anak langsung dari boundary, dan nama itu menimpa `site-header` (terukur), sehingga header ikut memudar. Solusinya, layout publik dibungkus satu `div`.
2. **Halaman yang sudah di-scroll** (temuan review, Sedang). Next.js menggulung halaman baru ke atas tepat saat transisi dimulai, sehingga snapshot halaman lama tergambar di posisi yang salah (kosong atau terpotong). Keputusan user: halaman lama langsung hilang, dan halaman baru memudar masuk.
3. **Kemunculan isi ikut memicu transisi** (temuan review). Hasil Search dan editor membuat seluruh halaman memudar untuk kedua kalinya, dan palet ⌘K tertunda sekitar 200 ms.
   - Membungkusnya dengan `<ViewTransition default="none">` **tidak berhasil** (terukur), kemungkinan karena tinggi halaman ikut berubah.
   - Solusinya **tipe transisi `page`**: komponen baru `components/ui/link.tsx` menandai setiap navigasi; ke-22 file yang memakai `next/link` diganti; `router.push` di palet dan form login ikut ditandai. Boundary di layout paling atas hanya bereaksi pada tipe ini.
   - Aturan ESLint melarang `next/link` langsung, supaya link baru tidak lupa tipenya.
   - Efek sampingnya, tombol back/forward browser tidak beranimasi.
4. **Bar atas dashboard di HP** bukan lagi bagian yang diam, karena posisinya tidak menempel di layar (sekarang ikut memudar bersama halaman).
5. **Satu kata diganti:** di design.md, "Page crossfade" menjadi "Page fade".

## Verifikasi

| Cek | Hasil |
|-----|-------|
| tsc, lint, unit | ✅ 96 unit lulus. Test `router.push` sekarang juga memastikan tipe `page`. Lint dijalankan tanpa `.claude/` (worktree lama). Aturan ESLint baru dicoba dan menolak `next/link` |
| Build | ✅ |
| 17 jalur di 1280 px, jalur dashboard dan antar-area di 375 px | ✅ Semuanya satu fade 200 ms, tanpa kotak yang bergerak; header, sidebar, dan tab bar berperilaku seperti di atas |
| Klik kartu setelah scroll ke y=2515 | ✅ Halaman baru memudar masuk di bawah header (frame dicek); tidak kosong dan tidak terpotong |
| Palet ⌘K, editor, Search | ✅ Palet tidak memicu transisi, dan input fokus ~330 ms termasuk mengunduh kodenya (sebelumnya ~850 ms). Editor dan Search hanya satu transisi per navigasi |
| Gerak dikurangi | ✅ Tidak ada animasi transisi |
| E2E | ✅ 484/484, run penuh tanpa kegagalan (270 dilewati sesuai ukuran layar) |
| `code-reviewer` | **Review 1:** 1 Sedang dan 3 Rendah, semuanya ditangani (no. 4 tentang lint worktree jadi tindak lanjut). **Review 2:** boleh di-commit, hanya 3 Rendah: istilah "crossfade" yang tersisa di komentar sudah diganti; dua lainnya dicatat di bawah |

## Keterbatasan yang diketahui

- **Navigasi yang menunggu server.** React memberikan tipe `page` ke commit transisi berikutnya. Kalau ada Suspense di halaman saat ini yang muncul selagi navigasi lambat (halaman `instant = false`) masih menunggu server, kemunculan itu yang ikut memudar, dan halaman tujuan muncul tanpa fade. Kasus ini jarang, dan saat ini hanya /search yang punya Suspense.

## Tindak lanjut

- **Fase 3/4:** server action dan `router.refresh()` sengaja tidak beranimasi (tanpa tipe). Kalau login, simpan, atau review nanti diganti ke server action dengan `redirect()`, fade akan hilang tanpa peringatan. Solusinya: panggil `addTransitionType("page")` di awal action di sisi client, atau tetap pakai `router.push(…, { transitionTypes: PAGE_TRANSITION })` setelah action berhasil.
- **Lint dan port E2E:** `npm run lint` gagal karena worktree lama, dan port E2E bentrok dengan proyek WNDR (3200).

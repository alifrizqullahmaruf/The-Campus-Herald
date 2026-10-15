# Plan M9: Dashboard admin (editor)

**Tanggal:** 2026-10-15
**Status:** ✅ Selesai
**Bagian dari:** [roadmap](2026-10-15-roadmap.md), Fase 1

## Tujuan

Halaman admin sesuai design.md bagian 4 (Dashboard): antrean review, halaman review, semua artikel, dan kelola author. Kebutuhan dari spesifikasi:
- setiap artikel wajib disetujui editor sebelum tayang
- penolakan disertai catatan
- admin menambah dan menonaktifkan author (tanpa hapus)
- reset password dilakukan oleh admin

Masih **pratinjau tanpa backend**.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | `/dashboard/review`: antrean `pending`, yang terlama di atas (judul, author, kategori, waktu submit), empty state | Claude | `app/dashboard/review/page.tsx` | ✅ |
| 2 | `/dashboard/review/[id]`: artikel dirender persis seperti di halaman publik + panel keputusan menempel di bawah: Approve (konfirmasi dua langkah, tanpa dialog browser) dan Reject (catatan wajib). Artikel yang tidak `pending` hanya ditampilkan statusnya | Claude | `app/dashboard/review/[id]/page.tsx`, `components/dashboard/review-panel.tsx` | ✅ |
| 3 | `/dashboard/articles`: semua artikel dengan filter status dan author, tautan ke halaman review | Claude | `app/dashboard/articles/page.tsx`, `components/dashboard/all-articles.tsx` | ✅ |
| 4 | `/dashboard/authors`: daftar author (nama, email, aktif/nonaktif, jumlah artikel), Tambah author (nama, email, password sementara, dengan validasi termasuk email unik dan password minimal 8 karakter), Nonaktifkan/Aktifkan kembali, Reset password. Tidak ada hapus | Claude | `app/dashboard/authors/page.tsx`, `components/dashboard/author-manager.tsx` | ✅ |
| 5 | Test | Claude | `__tests__/dashboard-admin.test.tsx` | ✅ |
| 6 | Verifikasi + commit + push | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 73 test lulus (8 baru: Approve dua langkah, Send back wajib catatan, artikel non-pending tidak bisa diputuskan ulang, aturan catatan, filter status + author, aturan author baru termasuk email unik, nonaktif/aktif tanpa tombol hapus, tambah author lewat dialog) |
| lint, tsc, build | ✅ `/dashboard/review`, `/dashboard/articles`, `/dashboard/authors` statis, halaman review di-prerender |
| Tampilan 1280px | ✅ Halaman review menampilkan artikel seperti di situs publik + panel keputusan; kelola author dengan kartu nonaktif bergaris putus-putus |
| Tampilan 375px | ✅ Tabel semua artikel bisa digulir ke samping di dalam kotaknya, tab bar bawah tetap terlihat |

## Masalah yang ditemukan dan diperbaiki

| Masalah | Perbaikan |
|---------|-----------|
| Nama aksesibel tombol menjadi "DeactivateRafi Pratama": spasi di awal teks `sr-only` hilang saat nama dihitung, sehingga pembaca layar mengucapkannya menyatu | Tombol per baris memakai `aria-label` eksplisit ("Deactivate Rafi Pratama", "Reset password for Rafi Pratama"). Pola yang sama di tombol Esc palet diganti `aria-label="Close search"` |
| Saran IDE: `backdrop:[background-size:24px_24px]` | Diganti `backdrop:bg-size-[24px_24px]` |

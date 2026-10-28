# Plan: Animasi untuk About dan halaman publik lainnya

**Tanggal:** 2026-10-28
**Status:** ✅ Selesai

## Tujuan

User bertanya kenapa halaman About tidak punya animasi. Hasil pengecekan di browser:

- Tidak ada animasi yang rusak.
- Pill footer, logo bergoyang, dan crossfade jalan di kedelapan halaman publik.
- Semua animasi khusus halaman hanya ada di beranda.
- About, Categories, topic, artikel, dan profil penulis belum pernah diberi animasi khusus. Halaman Authors (kartu berbalik saat hover) dan Search (filter pop) sudah punya efek kecil.
- Satu error 500 sesaat di `/about` (mode dev) tidak bisa diulang. Kemungkinan terjadi saat server dev meng-compile halaman.

**Keputusan user:**
- About mendapat keempat animasi: ilustrasi hidup, judul naik, langkah alur kerja dari tumpukan, dan angka menghitung.
- Topic, profil penulis, artikel, dan Categories mendapat judul naik.
- Grid di halaman-halaman itu tersusun dari tumpukan.
- Artikel mendapat garis progres membaca.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | `RiseText`, dipasang di `SectionHeader` (h1) dan di h1 topic, profil penulis, artikel | Claude | `components/ui/rise-text.tsx` (baru), `components/layout/section-header.tsx`, halaman topic, penulis, artikel | ✅ |
| 3 | Helper `pileStyle`; beranda memakainya; tumpukan di langkah About, kartu topic, profil penulis, tile Categories | Claude | `lib/motion.ts`, `app/(public)/page.tsx`, `about`, `categories`, `categories/[slug]`, `authors/[id]` | ✅ |
| 4 | Ilustrasi About hidup | Claude | `components/about/buried-notes-art.tsx`, `app/globals.css`, `app/(public)/about/page.tsx` | ✅ |
| 5 | `CountUp` di angka About | Claude | `components/about/count-up.tsx` (baru), `app/(public)/about/page.tsx` | ✅ |
| 6 | Garis progres membaca | Claude | `app/(public)/articles/[slug]/page.tsx`, `app/globals.css` | ✅ |
| 7 | Unit test | Claude | `__tests__/motion-images.test.tsx` | ✅ |
| 8 | Dokumentasi | Claude | `docs/design.md`, `CLAUDE.md` | ✅ |
| 9 | Verifikasi dan `code-reviewer` sekali | Claude | – | ✅ |
| 10 | Commit + push setelah konfirmasi | Claude | – | ✅ |

## Yang dikerjakan

| Animasi | Di mana | Cara kerja |
|---------|---------|------------|
| Judul naik per kata | h1 About, Categories, Authors, Search, topic, profil penulis, artikel | `RiseText`: setiap kata naik dari masker, jeda 30 ms (maksimal 360 ms). Masker hanya memotong atas-bawah. CSS saja |
| Sticky note naik | Ilustrasi About | Mengikuti scroll: catatan naik dari belakang gelembung chat, gelembung depan bergeser memberi jalan. Saat hover, catatan bergoyang |
| Dari tumpukan ke grid | Langkah About (scroll); topic dan penulis: baris pertama saat dimuat, sisanya mengikuti scroll; tile Categories saat dimuat | `pile-card` dengan helper `pileStyle(i, kolom)`. `data-pile="load"` menjalankan tumpukan yang sama sekali saja saat halaman dimuat (600 ms, jeda 80 ms) |
| Angka menghitung | "Small blog, loud numbers." | `CountUp`: 0 → nilai dalam 0,9 detik saat terlihat. HTML server berisi nilai akhir, dan pembaca layar selalu mendapat nilai akhir |
| Progres membaca | Artikel | Garis 6 px di tepi atas layar, berwarna topic, mengikuti posisi baca isi artikel |

Semuanya berhenti kalau pengguna meminta gerak dikurangi. Tanpa JavaScript, semua halaman tetap lengkap.

**Perubahan dari plan:**

- **Pembungkus ilustrasi About:** `overflow-hidden` diganti `overflow-clip`. Kotak `overflow: hidden` menjadi *scroll container*, sehingga animasi mengikuti kotak yang tidak pernah di-scroll. Hasil pengukuran: nilainya tetap 12,5% di semua posisi, dan setelah perbaikan mengikuti scroll.
- **Perbaikan dari review:**
  - Masker kata memakai `overflow-y-clip`, karena tracking huruf display yang rapat membuat sisi huruf terpotong.
  - Posisi awal kata dibuat lebih rendah supaya aksen huruf kapital tidak mengintip.
  - `reveal-line` hanya beranimasi kalau gerak diizinkan. Sebelumnya, dengan gerak dikurangi, jedanya membuat kata tersembunyi sesaat.
  - `overflow-wrap: anywhere` di h1 artikel untuk kata yang sangat panjang.
  - Komentar dan dokumentasi diperbaiki.
- **Kartu yang terlihat saat halaman dibuka:** dengan animasi scroll, kartu-kartu ini tertahan setengah menumpuk sampai pengguna scroll, dan di Categories menutupi teks baris pertama. Keputusan user: kartu itu tersusun sekali saat dimuat.

## Verifikasi

| Cek | Hasil |
|-----|-------|
| tsc, lint, unit | ✅ 96 unit lulus. Lint dijalankan tanpa `.claude/` (worktree lama) |
| Build | ✅ |
| Frame di 375 dan 1280 px (build production) | ✅ Semua animasi tampil, termasuk tile yang tersusun saat dimuat dan selesai dalam 1,65 detik |
| Nilai animasi di beberapa posisi scroll | ✅ Sticky note 57 → 0 px; progres 0 → 0,5 → 1 |
| Gerak dikurangi | ✅ Judul, tile, langkah, dan catatan langsung di posisi akhir; angka langsung nilai akhir; garis progres tidak tampil |
| LCP | ✅ 148–188 ms di semua halaman yang diubah (lokal). Judul yang naik tidak menjadi elemen LCP |
| E2E | ✅ 484/484 pada kode final, run penuh tanpa kegagalan (270 dilewati sesuai ukuran layar). Run sebelum perbaikan review juga 484/484, setelah 2 test diulang (error acak axe dan worker Playwright yang crash) |
| `code-reviewer` | 2 temuan Sedang (sisi huruf terpotong; kartu baris pertama tertahan setengah menumpuk) dan 3 Rendah, semuanya diperbaiki |

## Tindak lanjut

- Port E2E bentrok dengan proyek WNDR (3200). Sementara ini E2E dijalankan di port 3210 lewat config sementara.
- `npm run lint` gagal karena worktree lama `.claude/worktrees/next-16-4-3`.
- Error acak `SyntaxError` di skrip axe (E2E) masih muncul sesekali.

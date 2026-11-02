# Plan: Isi berita contoh lebih panjang

**Tanggal:** 2026-11-01
**Status:** ✅ Selesai, terverifikasi, di-commit dan di-push (`ec85d10`)

## Tujuan

Isi setiap artikel contoh hanya 66–106 kata, jadi semuanya "1 min read". `body()` di `lib/mock/articles.ts` menyusun setiap isi dari 1 paragraf khusus + 1 kutipan + bagian umum "What happens next" (54 kata) yang **sama persis di 23 artikel**. Akibatnya halaman artikel terasa kosong, dan garis progres baca hampir tidak berguna. Artikel contoh ini juga kemungkinan menjadi seed database di Fase 2.

**Keputusan user:**

| Hal | Keputusan |
|-----|-----------|
| Panjang | Bervariasi per jenis: Events & Achievements ±300 kata (berita), Academics & Organisations ±500 (feature), Opinion ±650 (esai) |
| Tambahan isi | Lebih banyak kutipan narasumber; daftar fakta / poin penting |
| Cakupan | Semua 23 artikel |
| "What happens next" | Dihapus; tiap artikel punya paragraf penutup sendiri |
| Draft, pending, rejected | Realistis per status |
| Daftar fakta | Di setiap artikel, sesuai isinya, dengan label tebal pendek |

Tetap: berita kampus fiktif berbahasa Inggris, nada pers mahasiswa yang ringan, sesuai fotonya. Judul, ringkasan (lead di atas isi), foto, penulis, tanggal, topic, dan jumlah pembaca tidak berubah.

## Hasil

| Jenis | Artikel | Kata | Baca |
|-------|---------|------|------|
| Events | 7, 8, 9, 11 | 304–310 | 2 min |
| Achievements | 15, 16, 17, 18 | 300–305 | 2 min |
| Academics | 1, 2, 3, 4 | 473–516 | 2–3 min |
| Organisations | 5, 6, 10 | 469–488 | 2 min |
| Opinion | 12, 13, 14 | 579–648 | 3 min |
| Belum terbit | 19 (draft, ±200, setengah jadi dengan catatan `[Still to write…]`), 20 (pending, 304), 21 (pending, 609), 22 (rejected, 422, **tanpa jumlah suara dan sumber** sesuai catatan editor), 23 (draft, ±140) | | |

Total ±9.400 kata (sebelumnya ±2.000). Setiap isi berisi:

- 2–4 narasumber fiktif dengan nama dan perannya;
- satu pull quote (`<blockquote>`, berwarna topic);
- daftar fakta berlabel tebal ("At a glance", "How to register…", "What I'm proposing", dan sejenisnya);
- paragraf penutup sendiri.

Hanya memakai HTML yang bisa dibuka editor Tiptap: `p`, `strong`, `em`, `ul`/`ol`/`li`, `blockquote`, tanpa link.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | Tulis isi 18 artikel terbit | Claude | `lib/mock/bodies.ts` (baru) | ✅ |
| 3 | Tulis isi 5 artikel draft/pending/rejected | Claude | `lib/mock/bodies.ts` | ✅ |
| 4 | `articles.ts` memakai `BODIES` (`bodyOf`); `body()`, `detail`, `quote` dihapus | Claude | `lib/mock/articles.ts` | ✅ |
| 5 | Test: cek label daftar (ganti "What happens next"); blok test baru "sample article bodies" | Claude | `__tests__/article-page.test.tsx`, `__tests__/data-articles.test.ts` | ✅ |
| 6 | Dokumentasi; catatan seed Fase 2 di roadmap lokal | Claude | `CLAUDE.md`, `docs/plans/2026-10-15-roadmap.md` (lokal) | ✅ |
| 7 | Verifikasi, `code-reviewer` sekali, perbaikan temuan | Claude | `lib/mock/bodies.ts`, test, `CLAUDE.md` | ✅ |
| 8 | Commit setelah konfirmasi, push saat user meminta | User / Claude | – | ✅ |

## Perubahan dari plan

- **Panjang tulisan pertama di bawah target** (sekitar 15–30%), jadi setiap artikel ditambah 1–2 paragraf (kutipan dan detail baru). Kalimat penutup ditambahkan supaya setiap berita ≥300 kata, sehingga terbaca "2 min" (`round(kata/200)`).
- **Opini ±600 kata**, bukan ±650. **Feature umumnya 2 menit**, bukan 3, karena ±480 kata dibulatkan ke 2. `CLAUDE.md` dan komentar di `bodies.ts` memakai angka yang sebenarnya.
- **Dari review (`code-reviewer`):**
  - **2 temuan Sedang, diperbaiki:**
    - 12 isi membuka dengan kalimat yang mengulang lead (dua di antaranya kata per kata). Paragraf pembukanya ditulis ulang supaya melanjutkan lead.
    - #17 menulis "beat twelve groups" tapi "eleventh of twelve". Sekarang 13 band di final.
  - **Temuan Rendah, semuanya diperbaiki:**
    - **Urutan waktu:** #17 (September) kini menyebut music night "next month", sesuai #8 (Oktober).
    - **Istilah musim:** "autumn/spring" diganti istilah semester.
    - **Kontradiksi kecil:**
      - #1: label daftar dan meja Yosua; "coloured pens" dari lead kini muncul di daftar.
      - #12: hitungan waktu antre.
      - #4: "writing seminar" bukan kelas lab.
    - **Nama narasumber:** yang mirip nama penulis (Putri, Ayu, Bimo, Rafael) atau tokoh nyata (Hadi Purnomo, Hendra Gunawan) diganti.
    - **Test:** regex "no paragraph is shared" tidak lagi melewati `</p>`.
    - **Komentar `bodies.ts`:** "HTML the editor can open" (Tiptap menyimpan item daftar sebagai `<li><p>`, tampilannya sama).

## File yang berubah

- `lib/mock/bodies.ts` (baru): isi 23 artikel, dengan helper `p`, `pull`, `list`, `todo`.
- `lib/mock/articles.ts`: `bodyOf(id)` dari `BODIES`; `body()`, `detail`, `quote` dihapus.
- `__tests__/data-articles.test.ts`: blok "sample article bodies", dengan cek:
  - panjang per jenis dan minimal 2 menit;
  - kutipan, pull quote, dan daftar;
  - tidak ada paragraf yang sama;
  - hanya tag yang didukung editor;
  - draft punya catatan; #22 tanpa angka.
- `__tests__/article-page.test.tsx`: cek label daftar, bukan "What happens next".
- `CLAUDE.md`: lokasi isi contoh untuk seed Fase 2.
- `docs/plans/2026-10-15-roadmap.md` (lokal, tidak di-commit): catatan seed Fase 2.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 106/106 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ |
| `npm run test:e2e` (sebelum perbaikan review) | ✅ 499 lolos, 0 gagal |
| `npm run test:e2e` (sesudah perbaikan review) | ✅ 499 lolos, 0 gagal (build ulang) |
| Halaman artikel (#8 Events, #12 Opinion) di 375 dan 1280 px | ✅ "2 min read" / "3 min read", kutipan, pull quote, dan daftar rapi; isi lebih tinggi dari layar (garis progres kini berguna); tanpa overflow atau console error |
| Dashboard: editor #19 (draft), #21 (pending); review #22 | ✅ isi terbuka di Tiptap dan pratinjau, catatan draft tampil, tanpa error |
| `code-reviewer` | 2 Sedang dan 7 Rendah, semuanya diperbaiki |

## Tindak lanjut

- **Fase 2:** seed database bisa langsung memakai 23 artikel ini. Kolom `excerpt`, `created_at`, dan kredit foto perlu ditambahkan ke skema (lihat catatan roadmap).

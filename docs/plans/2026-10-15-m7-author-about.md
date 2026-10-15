# Plan M7: Halaman author dan About

**Tanggal:** 2026-10-15
**Status:** ✅ Selesai
**Bagian dari:** [roadmap](2026-10-15-roadmap.md), Fase 1

## Tujuan

`/authors`, `/authors/[id]`, dan `/about` sesuai design.md bagian 3 (Author card) dan 4 (Authors, About).

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Data: `getAuthorProfiles()` (author aktif + kategori yang paling sering ditulis + jumlah artikel) dan `getAuthorProfile(id)` (termasuk status aktif, untuk label "Former member") | Claude | `lib/data/users.ts` | ✅ |
| 2 | `AuthorCard`: kotak warna kategori utama, peran (mono), inisial besar, nama di pill; dibalik saat hover/fokus untuk menampilkan bio (tanpa animasi balik saat reduced motion); seluruh kartu satu tautan | Claude | `components/author/author-card.tsx` | ✅ |
| 3 | `/authors`: judul + band ink berisi grid kartu author | Claude | `app/(public)/authors/page.tsx` | ✅ |
| 4 | `/authors/[id]`: header inisial berwarna, nama, peran, bio, label "Former member" untuk akun nonaktif, grid artikel published. `generateStaticParams` untuk semua author | Claude | `app/(public)/authors/[id]/page.tsx` | ✅ |
| 5 | `/about`: cerita (masalah WhatsApp/Instagram dari spesifikasi), "How an article goes live" (tulis → review editor → terbit), band angka (artikel, author, desk, 0 artikel tanpa review), teaser author + "Meet everyone →" | Claude | `app/(public)/about/page.tsx` | ✅ |
| 6 | Test data dan kartu | Claude | `__tests__/authors.test.tsx` | ✅ |
| 7 | Verifikasi + commit + push | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 55 test lulus (5 baru: kategori utama + jumlah artikel, mantan anggota tetap punya halaman, admin tanpa halaman author, hanya artikel published, kartu = satu tautan dengan sisi belakang `aria-hidden`) |
| lint, tsc, build | ✅ `/authors`, `/about` statis, 6 halaman author di-prerender |
| Tampilan 1280px | ✅ Grid kartu inisial di band ink; About: cerita, alur kerja 3 langkah, band angka, teaser author |
| Tampilan 375px | ✅ `/authors/7`: label "Former member", artikel lama tetap tampil |

## Catatan

- **Perbaikan dari review visual:** kartu author di band hitam sempat kehilangan garis dan bayangan. Sekarang ada varian `onDark` dengan garis dan bayangan berwarna paper.
- **Data baru:** `getAuthorProfiles`, `getAuthorProfile`, `getAllAuthorIds`, `getPublishedArticlesByAuthor`.
- **Teks About** diturunkan dari spesifikasi (masalah WhatsApp/Instagram dan alur review). Bagian di luar scope seperti timeline issue dan newsletter tidak dipakai.

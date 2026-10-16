| ✅ || ✅ || ✅ || ✅ || ✅ || ✅ || ✅ || ✅ || ✅ |# Plan: Rebrand menjadi "Side Notes", blog komunitas The Campus Herald

**Tanggal:** 2026-10-16
**Status:** ✅ Selesai dan di-push. Menunggu user mengganti nama repo (tugas 11–12)

## Latar belakang

Gaya visual dari template (warna-warni, kartu tempel, stiker, judul lantang) terasa seperti blog atau majalah komunitas, bukan koran kampus resmi. Nama "The Campus Herald" jadi kurang cocok.

## Keputusan (hasil brainstorming)

| Topik | Keputusan |
|-------|-----------|
| Konsep | **The Campus Herald** tetap menjadi organisasi induk (pers mahasiswa). Website ini adalah **blog komunitasnya** dengan merek sendiri |
| Nama | **Side Notes**, dengan keterangan "by The Campus Herald" |
| Bahasa nama | Inggris, karena seluruh konten berbahasa Inggris |
| Fungsi | Tidak berubah: 5 kategori, review editor, role author/admin, Most read. Brief tugas tetap terpenuhi |
| Yang ikut diubah | Logo + favicon, gaya bahasa teks, dokumen, nama repo GitHub |

## Draf identitas

| Elemen | Sebelum | Sesudah (draf) |
|--------|---------|----------------|
| Nama di header | THE CAMPUS / HERALD | **SIDE NOTES**, dengan teks kecil "by The Campus Herald" |
| Monogram / favicon | CH | **SN** (kuning di atas ink) |
| Judul tab | "… · The Campus Herald" | "… · Side Notes" |
| Tagline | "Campus news from the student press, organised in one place." | "The campus, in the margins. A community blog by The Campus Herald." |
| Hero beranda | "Campus news, **loud** and clear." | "The campus, written in the **margins**." |
| Intro hero | "Written by the student press, checked by an editor…" | "Stories, opinions and small wins from students, written by The Campus Herald community and read by an editor before they go up." |
| Stiker hero | "EDITOR CHECKED" | tetap |
| Footer | CAMPUS / HERALD | **SIDE / NOTES** + "© 2026 Side Notes · a community blog by The Campus Herald" |
| "newsroom" | "Fresh from the newsroom.", "The newsroom" | "Fresh off the notebook.", "The writers" |
| About | "A newsroom with sharp corners." | "Notes from the side of campus." + bagian baru: hubungan Side Notes dengan The Campus Herald |
| Dashboard | "Herald Dashboard" | "Side Notes Dashboard" |
| Halaman login | "For society members who write for the Herald." | "For Campus Herald members who write for Side Notes." |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi plan dan istilah kategori | User | – | ✅ ("topic") |
| 2 | Satu sumber identitas: nama, induk, tagline, deskripsi | Claude | `lib/site.ts` (baru) | ✅ |
| 3 | Logo dan favicon "SN" + wordmark "Side Notes / by The Campus Herald" | Claude | `components/layout/logo.tsx`, `app/icon.svg`, `components/dashboard/sidebar.tsx` | ✅ |
| 4 | Metadata (judul, template, deskripsi, Open Graph) | Claude | `app/layout.tsx`, `app/dashboard/layout.tsx` | ✅ |
| 5 | Gaya bahasa: teks beranda, kategori, author, About, footer, login, 404, error, pencarian disesuaikan dengan tabel di atas | Claude | `app/**/page.tsx`, `components/**` (±20 file) | ✅ |
| 6 | Data contoh: bio dan teks artikel yang menyebut "The Herald" disesuaikan | Claude | `lib/mock/*` | ✅ |
| 7 | Nama paket `herald_campus` → `side-notes` | Claude | `package.json`, `package-lock.json` | ✅ |
| 8 | Dokumen: bagian identitas merek di design.md, nama di CLAUDE.md, catatan keputusan di spesifikasi tahap 07, roadmap | Claude | `docs/design.md`, `CLAUDE.md`, `docs/the-campus-herald.md`, roadmap | ✅ |
| 9 | Test: perbarui teks yang diuji, tambah test identitas (nama, tagline, "by The Campus Herald" di header/footer) | Claude | `__tests__/*`, `e2e/*` | ✅ |
| 10 | Verifikasi: test unit, lint, build, E2E, cek tampilan | Claude | – | ✅ |
| 11 | Ganti nama repo di GitHub (Settings → Repository name, mis. `side-notes`) | User | – | Belum |
| 12 | Setelah repo diganti: perbarui `git remote` dan link di dokumen, commit + push | Claude | `.git/config`, `docs/*` | Belum |

## Keputusan tambahan

- **Istilah kategori di UI: "topic"** ("Pick a topic.", "Open the topic ↗"). "desk" dan "newsroom" tidak dipakai lagi.

## Catatan

- Nama file spesifikasi `docs/the-campus-herald.md` dan nama folder lokal `herald_campus` tidak diubah, karena Herald tetap organisasinya.
- Setelah repo diganti nama, GitHub otomatis mengalihkan URL lama, jadi link lama tetap jalan.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 76 test lulus (3 baru: logo "Side Notes / by The Campus Herald", footer, satu sumber identitas) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 64 lulus, stabil 3× berturut-turut setelah perbaikan test (lihat bawah) |
| Judul tab beranda | ✅ "Side Notes · The campus, in the margins." |
| Tampilan 1280px dan 375px | ✅ Logo SN + byline, hero baru, footer "SIDE / NOTES" |

## Perbedaan dari plan dan perbaikan

| Hal | Detail |
|-----|--------|
| Ukuran judul hero | Judul baru lebih panjang, jadi di desktop sempat pecah jadi 5 baris. `display-xl` diubah dari `clamp(48px, 9vw, 112px)` ke `clamp(44px, 6.5vw, 84px)` (juga di design.md) |
| Titik di akhir judul | Sempat jatuh sendiri ke baris baru. "margins." dibungkus `whitespace-nowrap` |
| Test E2E palet ⌘K kadang gagal | Saat semua test jalan paralel, Ctrl+K kadang ditekan sebelum halaman selesai hydrate. Test sekarang menunggu `networkidle` dulu. Ini masalah waktu di test, bukan bug aplikasi |
| Event internal | `herald:open-search` → `sidenotes:open-search` |
| Tidak diubah (disengaja) | Utilitas `prose-herald`, email contoh `@herald.test` (penulis memang anggota Herald), nama file `docs/the-campus-herald.md`, nama folder lokal |

## File yang berubah

| File | Perubahan |
|------|-----------|
| `lib/site.ts` | Baru |
| `components/layout/logo.tsx`, `app/icon.svg`, `components/dashboard/sidebar.tsx`, `components/layout/site-footer.tsx` | Logo dan favicon |
| `app/layout.tsx`, `app/dashboard/layout.tsx` | Metadata |
| ±15 halaman dan komponen | Teks UI |
| `lib/mock/articles.ts` | Data contoh |
| `package.json`, `package-lock.json` | Nama paket `side-notes` |
| `__tests__/*`, `e2e/*` | Test |
| `docs/design.md`, `CLAUDE.md`, `docs/the-campus-herald.md`, roadmap | Dokumen |

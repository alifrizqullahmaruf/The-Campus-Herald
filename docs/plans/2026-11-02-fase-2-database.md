# Plan: Fase 2 — database PostgreSQL

**Tanggal:** 2026-11-02 (brainstorm), dikerjakan 3–9 Nov 2026
**Status:** ✅ Selesai 2026-11-09. Semua halaman membaca PostgreSQL; tampilannya sama persis dengan versi data contoh.

## Tujuan

Data situs pindah dari `lib/mock/*` ke PostgreSQL. Isi `lib/data/*` diganti query sungguhan dengan signature tetap, jadi halaman dan komponen tidak berubah.

## Keputusan

| Hal | Keputusan |
|-----|-----------|
| Database | Server PostgreSQL 18 **khusus proyek** di `localhost:5433` (`npm run db:setup`/`db:start`/`db:stop`), datanya di `%LOCALAPPDATA%\side-notes`, di luar OneDrive. **Diubah 2026-11-04:** rencana awalnya service `postgresql-x64-18` di port 5432, tapi password superuser-nya tidak tersedia. Pindah server cukup dengan mengganti `DATABASE_URL`. Neon baru saat deploy (Fase 5) |
| Akses | SQL langsung dengan `postgres.js` 3.4.9 (bukan 4.0.0, yang dirilis 5 hari sebelumnya), tanpa ORM |
| Skema | Tahap 06 ditambah kolom yang dipakai situs (`bio`, `beat`, `excerpt`, `created_at`, `cover_alt`, 4 kolom kredit foto). Semua kolom waktu `TIMESTAMPTZ`, karena `TIMESTAMP` dibaca sebagai waktu lokal komputer. SQL di `docs/the-campus-herald.md` disalin dari migrasi |
| Tabel fitur lanjutan | `comments`, `tags`, `article_tags` dibuat, kosong |
| 5 topic | Migrasi `002`, bukan seed, supaya ada di semua database (2026-11-05) |
| Unit test | Tetap memakai data contoh: `__tests__/setup.ts` mengganti `lib/data/*` dengan versi `lib/mock/*-data.ts`. SQL teruji lewat E2E dan pembandingan halaman |
| Cache | Setiap fungsi data memakai `"use cache"`, `cacheLife("max")`, dan tag `articles`/`users`. Halaman tetap ○ static |
| Password | Tidak pernah lewat chat; `db:setup` membuatnya acak dan tidak mencetaknya |

## Tugas

| # | Hari | Tugas | Siapa | Commit | Status |
|---|------|-------|-------|--------|--------|
| 1 | Sel 3 Nov | `postgres`, `server-only`, `lib/db.ts`, `npm run db:check`, `.env.example` | Claude | `e17d819` | ✅ |
| 2 | Rab 4 Nov | Server khusus proyek dan `.env.local` (awalnya tugas user, lalu user meminta Claude mengerjakannya) | Claude | `6c083ae` | ✅ |
| 3 | Rab 4 Nov | Skema `001_schema.sql`, `npm run db:migrate`, `scripts/db-client.mjs`, spesifikasi | Claude | `6c083ae` | ✅ |
| 4 | Kam 5 Nov | Migrasi 5 topic, `npm run db:seed` (`tsx`) | Claude | `ae26c53` | ✅ |
| 5 | Jum 6 Nov | `lib/data/users.ts` dari database; data palsu untuk unit test | Claude | `5638ed8` | ✅ |
| 6 | Sen 9 Nov | `lib/data/articles.ts` (11 fungsi) dan `lib/data/session.ts` dari database. Langkah Sabtu dan Senin digabung, karena keduanya di file yang sama | Claude | commit hari ini | ✅ |

## File

- **Database:** `db/migrations/001_schema.sql`, `db/migrations/002_categories.sql`
- **Skrip:** `scripts/db-client.mjs`, `scripts/db-check.mjs`, `scripts/db-migrate.mjs`, `scripts/db-local.mjs`, `scripts/db-seed.ts`
- **Aplikasi:** `lib/db.ts`, `lib/data/articles.ts`, `lib/data/users.ts`, `lib/data/session.ts`, `lib/data/ids.ts`, `lib/reading-time.ts`, `app/avatars/[id]/route.ts` (`cacheLife`)
- **Test:** `__tests__/setup.ts`, `lib/mock/articles-data.ts`, `lib/mock/users-data.ts`, `lib/mock/session-data.ts`, `vitest.config.mts`, `e2e/flows.spec.ts`
- **Dokumen:** `docs/the-campus-herald.md` (diagram, SQL, keputusan desain), `CLAUDE.md`, `.env.example`, `.gitignore`, `package.json`

## Verifikasi

| Cek | Hasil |
|-----|-------|
| **Tampilan sama** | HTML 97 halaman (beranda, 5 topic, 18 artikel, pencarian, penulis, About, styleguide, semua halaman dashboard termasuk editor dan review id 1–23 dan id di luar rentang), 5 respons `/api/search`, dan 7 avatar: 0 perbedaan sebelum dan sesudah |
| **Data benar-benar dari database** | Penanda yang ditulis langsung di database muncul setelah build: `bio` (hari 4), dan judul artikel di beranda, halaman artikel, topic, dashboard, dan pencarian (hari 6). Setelah seed ulang, semua 97 halaman kembali sama persis |
| **Isi database** | Dibandingkan dengan `lib/mock` per kolom: 0 perbedaan (5 topic, 7 user, 23 artikel) |
| **Static** | Semua halaman `[slug]`/`[id]` dan dashboard tetap ○ |
| **Keamanan** | Password tidak tercetak di semua jalur gagal yang diuji (URL rusak, `@`/`/`/`#`/`%` tanpa encode, server mati, setup gagal di tengah). Tidak ada di `.next`. `password_hash` tidak pernah dipilih dan tidak ada di `.next/static` |
| **Migrasi dan seed** | Bisa diulang. Kegagalan di tengah tidak meninggalkan sisa. Seed menolak host lain dan database yang belum dimigrasi |
| **Test** | Unit 115/115, lint, tsc, build; E2E penuh 505 lolos, 0 gagal (hari 4 dan hari 6) |
| **`code-reviewer`** | 7 kali review selama fase ini. Temuan Tinggi: 1, password bisa bocor (hari 1). Temuan Sedang: 9, termasuk id di luar rentang yang menampilkan halaman error. Semua diperbaiki |

**Hari 6 (Sen 9 Nov):**

- **Urutan:** daftar memakai pemutus id saat nilainya kembar (artikel 1/21 dan 8/19 sama tanggal dibuatnya), sesuai urutan data contoh.
- **Pencarian dan prev/next:** tetap dihitung di JavaScript di atas daftar yang sudah di-cache, supaya aturan cocok di `lib/search.ts` sama dengan di browser.
- **`code-reviewer`:** tidak ada Kritis, Tinggi, atau Sedang. Tiga temuan Rendah diperbaiki:
  - artikel tanpa tanggal kini diurutkan seperti data contoh (`nulls last`/`nulls first`);
  - `limit`/`offset` negatif dibatasi ke 0, karena PostgreSQL menolaknya;
  - komentar silang untuk id preview user, yang tertulis di dua tempat.
- **Setelah perbaikan:** 97 halaman tetap sama persis, test alur dan halaman lolos 18/18.

## Tindak lanjut

**Fase 3 (login):**

- **Pemeriksa password:** `!no-login` di seed hanya aman kalau pemeriksa password menolak format hash yang tidak dikenal. Pemeriksa scrypt yang mengambil panjang kunci dari nilai tersimpan bisa meloloskan password apa pun. Tambahkan unit test untuk nilai ini.
- **Dashboard statis:** `/dashboard/authors` statis dan memuat email semua akun. Setelah ada login, halaman dashboard tidak boleh tetap statis (`authentication-with-cache-components.md`). Jangan deploy dengan data asli sebelum ini beres.
- **Pengganti preview user:** `getPreviewUser` diganti user yang login; butir 3 `clean-code` (satu daftar path admin).

**Fase 4:**

- **Ukuran cache:** daftar artikel mengambil `body` hanya untuk menghitung `readingMinutes`, jadi entri cache membesar seiring jumlah artikel. Pertimbangkan menghitung waktu baca di SQL.
- **Kredit foto:** `source` di-hardcode "Unsplash" sesuai tipe, padahal foto lokal berasal dari Picsum.

- **Invalidasi cache:** `updateTag("articles")` atau `updateTag("users")` setelah menyimpan. `updateTag` hanya bisa di Server Action.
- **`view_count`:** kenaikannya jangan memicu tag `articles`, karena setiap kunjungan akan membuang seluruh cache.
- **Skema dan alur:**
  - label "Updated" di dashboard menampilkan `createdAt`, karena belum ada `updated_at`;
  - pertimbangkan constraint alur (`published` wajib punya `published_at`, `rejected` wajib punya `review_note`).

**Fase 5:**

- **URL Neon** hanya disimpan di Vercel, karena `.env.local` ikut tersinkron ke OneDrive.
- **Build pertama** gagal kalau belum ada author (`generateStaticParams` kosong).
- **Cache bawaan** ada di memori tiap instance, jadi perlu dicek di Vercel.
- **Seed ke Neon** butuh `-- --remote`.

**Belum diuji:** `create role` yang gagal saat `db:setup`, dan Ctrl+C saat `initdb` berjalan; keduanya hanya dianalisis dari kode.

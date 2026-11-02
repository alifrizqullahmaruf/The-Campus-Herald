# Plan: Fase 2 — database PostgreSQL

**Tanggal:** 2026-11-02
**Status:** Draft. Keputusan brainstorm sudah lengkap; dikerjakan setelah persiapan (`2026-11-02-persiapan-fase-2.md`) selesai dan plan ini disetujui.

## Tujuan

Data situs pindah dari `lib/mock/*` ke PostgreSQL. Isi `lib/data/*` diganti query sungguhan dengan signature tetap, jadi halaman dan komponen tidak berubah. Tampilan situs harus sama persis; bedanya hanya sumber datanya.

## Keputusan user (brainstorm 2026-11-02)

| Hal | Keputusan |
|-----|-----------|
| Database | PostgreSQL 18 yang **sudah terpasang** di komputer user (service `postgresql-x64-18`, port 5432). Cloud (Neon) baru saat deploy |
| Akses | **SQL langsung dengan `postgres.js`**, tanpa ORM |
| Deploy nanti | **Vercel** (Fase 5; koneksi lewat `DATABASE_URL`, jadi tinggal ganti URL) |
| Skema | Skema tahap 06 **ditambah kolom yang dipakai situs**, dan SQL di `docs/the-campus-herald.md` **ikut diperbarui** |
| Tabel fitur lanjutan | `comments`, `tags`, `article_tags` **dibuat** sesuai spesifikasi (kosong, belum dipakai) |
| Unit test | **Tetap memakai data contoh**: lapisan database dipalsukan, query SQL teruji lewat E2E |
| Urutan | Persiapan dulu: dashboard lewat `lib/data`, dan selidiki `flows.spec.ts` yang kadang gagal |
| Gambar sampul | Diputuskan di Fase 4 (unggah sampul). Di Fase 2 sampul tetap berupa path/URL seperti sekarang |

## Rancangan (garis besar, dirinci saat plan ini dikerjakan)

**Kolom tambahan** (dari riset; skema asli di `docs/the-campus-herald.md:558-626`):

| Tabel | Kolom |
|-------|-------|
| `users` | `bio TEXT`, `beat VARCHAR(100)` |
| `articles` | `excerpt TEXT`, `cover_credit_name`, `cover_credit_profile_url`, `cover_credit_photo_url`, `cover_credit_source`, `created_at TIMESTAMP NOT NULL DEFAULT NOW()`; dan `cover_alt VARCHAR(255)` sebagai kolom **baru** untuk unggah sampul di Fase 4 (editor sudah menanyakan teks alt, tapi `Article` belum punya field-nya dan sampul kini dirender dengan `alt=""`) |

**Migrasi dan seed:**

- Migrasi: file `.sql` berurutan di `db/migrations/`, dijalankan oleh skrip kecil (`npm run db:migrate`).
- Seed (`npm run db:seed`): dari data contoh yang sudah ada, yaitu 5 topic, 7 user, dan 23 artikel dengan isi lengkap (`lib/mock/bodies.ts`). Id dipertahankan, lalu sequence di-reset.
- Skrip seed ditulis dalam TypeScript dan dijalankan dengan `tsx` (dev dependency). Node 24 tidak bisa langsung mengimpor `lib/mock/*.ts`, karena impor tanpa ekstensi (`./bodies`) dan JSON tanpa `with { type: "json" }`.
- `password_hash` diisi nilai yang tidak bisa dipakai untuk login. Hash sungguhan dibuat di Fase 3.

**Akses database:**

- `lib/db.ts` (server-only) membuat client `postgres` dari `DATABASE_URL`.
- Fungsi di `lib/data/*` menjalankan SQL dan memetakan baris `snake_case` ke tipe `camelCase` di `lib/types.ts`.

**Cache (Cache Components):**

- Setiap fungsi data memakai `"use cache"` + `cacheLife` + `cacheTag`. Tanpa itu build gagal, dan halaman `[slug]`/`[id]` harus tetap ○ static (`CLAUDE.md`).
- Tag per jenis data (artikel, user) supaya Fase 4 bisa memanggil `updateTag` setelah menyimpan.
- Aturannya dicek di `node_modules/next/dist/docs/` saat implementasi.

**Lingkungan:**

- Build dan E2E butuh database yang berjalan dan sudah di-seed, karena prerender membaca database.
- `.env.local` berisi `DATABASE_URL`, ditulis oleh user (tidak lewat chat).

## Tugas (sementara)

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Buat database `side_notes` + user-nya, tulis `DATABASE_URL` di `.env.local` (Claude memberi perintahnya) | User | `.env.local` | Belum |
| 2 | Pasang `postgres`; `lib/db.ts` | Claude | `package.json`, `lib/db.ts` | Belum |
| 3 | Migrasi skema (tahap 06 + kolom tambahan + tabel fitur lanjutan), skrip migrate | Claude | `db/migrations/*.sql`, `scripts/db-migrate.mjs` | Belum |
| 4 | Seed dari data contoh (TypeScript, dijalankan dengan `tsx`) | Claude | `scripts/db-seed.ts` | Belum |
| 5 | Ganti isi 18 fungsi `lib/data/*` dengan SQL + cache | Claude | `lib/data/*.ts` | Belum |
| 6 | Unit test: lapisan database dipalsukan dengan data contoh | Claude | `__tests__/` | Belum |
| 7 | Perbarui SQL tahap 06 di spesifikasi | Claude | `docs/the-campus-herald.md` | Belum |
| 8 | Dokumentasi (perintah db, syarat build/E2E) | Claude | `CLAUDE.md` | Belum |
| 9 | Verifikasi: unit, lint, build (halaman tetap ○), E2E, tampilan sama; `code-reviewer` | Claude | – | Belum |
| 10 | Commit + push setelah konfirmasi | User / Claude | – | Belum |

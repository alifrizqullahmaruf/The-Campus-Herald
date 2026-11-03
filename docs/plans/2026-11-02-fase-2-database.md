# Plan: Fase 2 — database PostgreSQL

**Tanggal:** 2026-11-02
**Status:** Disetujui 2026-11-03. Dikerjakan satu langkah per hari, 3–9 Nov (lihat "Tugas per hari").

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

- Migrasi: file `.sql` berurutan di `db/migrations/`, dijalankan oleh skrip kecil (`npm run db:migrate`). Skrip mencatat file yang sudah dijalankan di tabel `schema_migrations`, dan setiap file dijalankan dalam satu transaksi.
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

## Tugas per hari

Satu langkah = satu commit per hari, mengikuti jadwal harian (roadmap lokal, disetujui 2026-11-03). Setiap hari: verifikasi (test, lint, build; E2E kalau halaman berubah), `code-reviewer` sekali, lalu commit dan push setelah user mengonfirmasi.

| # | Hari | Tugas | Siapa | File | Status |
|---|------|-------|-------|------|--------|
| 1 | Sel 3 Nov | Tinjau plan ini; buat database `side_notes` dan user-nya, lalu tulis `DATABASE_URL` di `.env.local` | User | `.env.local` | Belum |
| 2 | Sel 3 Nov | Pasang `postgres` (3.4.9) dan `server-only`; buat `lib/db.ts`, `npm run db:check`, `.env.example` | Claude | `package.json`, `lib/db.ts`, `scripts/db-check.mjs`, `.env.example`, `.gitignore`, `CLAUDE.md` | ✅ kode; menunggu `db:check` user |
| 3 | Rab 4 Nov | Migrasi skema (tahap 06 + kolom tambahan + tabel fitur lanjutan) dan skrip migrate; SQL tahap 06 di spesifikasi ikut diperbarui | Claude | `db/migrations/001_schema.sql`, `scripts/db-migrate.mjs`, `docs/the-campus-herald.md` | Belum |
| 4 | Kam 5 Nov | Seed dari data contoh (TypeScript, dijalankan dengan `tsx`) | Claude | `scripts/db-seed.ts` | Belum |
| 5 | Jum 6 Nov | 6 fungsi `lib/data/users.ts` → SQL + cache; unit test memakai data contoh (implementasi mock dipindah ke `lib/mock/`, dipasang lewat `vi.mock`) | Claude | `lib/data/users.ts`, `lib/mock/`, `__tests__/` | Belum |
| 6 | Sab 7 Nov | 6 fungsi artikel publik → SQL + cache; halaman `[slug]`/`[id]` tetap ○ | Claude | `lib/data/articles.ts` | Belum |
| 7 | Sen 9 Nov | `searchArticles`, 4 fungsi dashboard, dan `getPreviewUser` → SQL; dokumentasi (perintah db, syarat build/E2E); E2E penuh; tampilan sama | Claude | `lib/data/*.ts`, `CLAUDE.md` | Belum |

Hari cadangan: Min 8 Nov.

## Hari 1 (Sel 3 Nov): koneksi database

- **`postgres` 3.4.9, bukan 4.0.0:** versi 4.0.0 adalah versi mayor baru yang dirilis 29 Okt 2026 (5 hari sebelumnya), sehingga dipilih 3.4.9 yang stabil sejak April. `^3.4.9` tidak naik ke 4.
- **`server-only`:** menurut docs Next sifatnya opsional (Next menanganinya sendiri). Tetap dipasang supaya modul juga bisa di-resolve di luar Next (Vitest, `tsx`); di sana impornya langsung gagal, sehingga test dan skrip tidak bisa diam-diam memakai database.
- **`lib/db.ts`:**
  - satu client `sql` dari `DATABASE_URL`, dengan pesan error yang jelas kalau variabelnya kosong;
  - di dev, client disimpan di `globalThis` supaya hot reload tidak membuka pool baru;
  - belum diimpor halaman mana pun.
- **`npm run db:check`** (`scripts/db-check.mjs`, `node --env-file-if-exists=.env.local`):
  - mencetak versi PostgreSQL, database, dan user;
  - tidak pernah mencetak `DATABASE_URL`;
  - kalau gagal, memberi petunjuk sesuai kode error: service mati (`ECONNREFUSED`, dengan pesan cadangan karena AggregateError tidak punya pesan), user atau password salah (`28P01`; PostgreSQL juga memakai kode ini untuk user yang tidak ada), database belum ada (`3D000`).
- **`.env.example`** ikut di-commit (`!.env.example` di `.gitignore`), sedangkan `.env.local` tetap diabaikan.
- **Tambahan di luar plan:** baris `npm run db:check` di bagian Commands `CLAUDE.md`, supaya dokumentasi sesuai dengan commit hari ini.

| Cek | Hasil |
|-----|-------|
| `db:check` tanpa `.env.local` / port salah / user salah | ✅ pesan dan petunjuk yang benar, exit 1 |
| `npm test -- --run` | ✅ 115/115 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ (halaman belum membaca database; `[slug]`/`[id]` tetap ○) |
| `npm run db:check` dengan database user | Menunggu user |
| `code-reviewer` | 1 Tinggi dan 1 Sedang, diperbaiki; 3 Rendah: 1 diperbaiki, 2 jadi catatan untuk hari 3 dan 5 (di bawah) |

**Perbaikan dari review:**

- **Tinggi, `db-check.mjs`: password bisa bocor.**
  - **Penyebab:** password dengan `/` atau `#` yang tidak di-encode membuat `new URL` di postgres.js melempar TypeError. Error itu tidak tertangkap, sehingga Node mencetak properti `input`-nya, yaitu seluruh URL beserta password.
  - **Perbaikan:**
    - client kini dibuat di dalam `try`, dan yang dicetak hanya `error.message`;
    - petunjuk baru untuk URL tidak valid, untuk `%` yang tidak di-encode (URIError), dan untuk `CONNECT_TIMEOUT`.
- **Sedang, `lib/db.ts`: risiko yang sama saat modul dimuat** (terminal dev, atau log build Vercel nanti).
  - **Perbaikan:** `postgres(url)` dibungkus `connect()`, yang melempar `Error` baru tanpa URL dan tanpa `cause`.
- **Dicek ulang dengan password palsu** (`/`, `#`, `%zz`, port salah): tidak ada yang bocor, dan setiap kasus mendapat petunjuk yang tepat. `lib/db.ts` diimpor dengan `node --conditions=react-server`: URL rusak menghasilkan pesan aman tanpa `input` dan tanpa `cause`, sedangkan URL valid menghasilkan client.

**Catatan untuk hari berikutnya (temuan Rendah):**

- **Hari 5 (Jum 6 Nov):** 13 file test mengimpor `lib/data/*`. Begitu `lib/data` mengimpor `lib/db`, impor itu gagal di Vitest dengan pesan `server-only` yang menyesatkan. Pasang mock `@/lib/db` sekali secara global (`setupFiles` di `vitest.config.ts`), bukan satu per test.
- **Hari 3–6:** tetapkan `max` dan `idle_timeout` pool secara eksplisit. Saat build, prerender berjalan di beberapa worker, masing-masing dengan pool sendiri (default 10); ini juga perlu untuk Neon nanti. Mengubah `DATABASE_URL` saat `next dev` berjalan baru berlaku setelah server di-restart.

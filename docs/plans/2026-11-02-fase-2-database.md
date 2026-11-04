# Plan: Fase 2 — database PostgreSQL

**Tanggal:** 2026-11-02
**Status:** Disetujui 2026-11-03. Dikerjakan satu langkah per hari, 3–9 Nov (lihat "Tugas per hari").

## Tujuan

Data situs pindah dari `lib/mock/*` ke PostgreSQL. Isi `lib/data/*` diganti query sungguhan dengan signature tetap, jadi halaman dan komponen tidak berubah. Tampilan situs harus sama persis; bedanya hanya sumber datanya.

## Keputusan user (brainstorm 2026-11-02)

| Hal | Keputusan |
|-----|-----------|
| Database | **Diubah 2026-11-04:** server PostgreSQL 18 **khusus proyek** (`localhost:5433`, data di `%LOCALAPPDATA%side-notes`), memakai program yang sudah terpasang. Keputusan awal adalah service `postgresql-x64-18` di port 5432, tapi saat diminta menyiapkan database sendiri, Claude tidak punya password superuser-nya. Pindah kembali cukup dengan mengganti `DATABASE_URL`. Cloud (Neon) baru saat deploy |
| Akses | **SQL langsung dengan `postgres.js`**, tanpa ORM |
| Deploy nanti | **Vercel** (Fase 5; koneksi lewat `DATABASE_URL`, jadi tinggal ganti URL) |
| Skema | Skema tahap 06 **ditambah kolom yang dipakai situs**, dan SQL di `docs/the-campus-herald.md` **ikut diperbarui** |
| Tabel fitur lanjutan | `comments`, `tags`, `article_tags` **dibuat** sesuai spesifikasi (kosong, belum dipakai) |
| Unit test | **Tetap memakai data contoh**: lapisan database dipalsukan, query SQL teruji lewat E2E |
| Urutan | Persiapan dulu: dashboard lewat `lib/data`, dan selidiki `flows.spec.ts` yang kadang gagal |
| Gambar sampul | Diputuskan di Fase 4 (unggah sampul). Di Fase 2 sampul tetap berupa path/URL seperti sekarang |

## Rancangan (garis besar, dirinci saat plan ini dikerjakan)

**Kolom tambahan** (dari riset; hasil akhirnya di `db/migrations/001_schema.sql`):

| Tabel | Kolom |
|-------|-------|
| `users` | `bio TEXT NOT NULL DEFAULT ''`, `beat VARCHAR(100) NOT NULL DEFAULT ''` |
| `articles` | `excerpt TEXT NOT NULL DEFAULT ''`, `cover_credit_name`, `cover_credit_profile_url`, `cover_credit_photo_url`, `cover_credit_source`, `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`; dan `cover_alt VARCHAR(255)` sebagai kolom **baru** untuk unggah sampul di Fase 4 (editor sudah menanyakan teks alt, tapi `Article` belum punya field-nya dan sampul kini dirender dengan `alt=""`) |

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
- `.env.local` berisi `DATABASE_URL`, ditulis oleh `npm run db:setup` dengan password acak yang tidak pernah dicetak.
- Server khusus proyek tidak menyala sendiri: setelah komputer restart, jalankan `npm run db:start`.

## Tugas per hari

Satu langkah = satu commit per hari, mengikuti jadwal harian (roadmap lokal, disetujui 2026-11-03). Setiap hari: verifikasi (test, lint, build; E2E kalau halaman berubah), `code-reviewer` sekali, lalu commit dan push setelah user mengonfirmasi.

| # | Hari | Tugas | Siapa | File | Status |
|---|------|-------|-------|------|--------|
| 1 | Rab 4 Nov | Buat server, database `side_notes`, user-nya, dan `.env.local` (awalnya tugas user; user meminta Claude mengerjakannya) | Claude | `scripts/db-local.mjs`, `package.json`, `.env.example`, `.env.local` (tidak di-commit) | ✅ |
| 2 | Sel 3 Nov | Pasang `postgres` (3.4.9) dan `server-only`; buat `lib/db.ts`, `npm run db:check`, `.env.example` | Claude | `package.json`, `lib/db.ts`, `scripts/db-check.mjs`, `.env.example`, `.gitignore`, `CLAUDE.md` | ✅ |
| 3 | Rab 4 Nov | Migrasi skema (tahap 06 + kolom tambahan + tabel fitur lanjutan) dan skrip migrate; SQL tahap 06 di spesifikasi ikut diperbarui | Claude | `db/migrations/001_schema.sql`, `scripts/db-migrate.mjs`, `scripts/db-client.mjs`, `scripts/db-check.mjs`, `lib/db.ts`, `lib/types.ts`, `docs/the-campus-herald.md`, `CLAUDE.md` | ✅ |
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
| `npm run db:check` dengan database sungguhan | ✅ dijalankan 4 Nov: PostgreSQL 18.6, `side_notes` / `side_notes` |
| `code-reviewer` (hari 1) | 1 Tinggi dan 1 Sedang, diperbaiki; 3 Rendah: 1 diperbaiki, 2 jadi catatan untuk hari 3 dan 5 (di bawah) |

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

## Hari 2 (Rab 4 Nov): skema dan migrasi

- **`db/migrations/001_schema.sql`:** 6 tabel dan 2 indeks dari tahap 06, ditambah kolom yang disepakati. Blok SQL di spesifikasi disalin dari file ini (sudah dibandingkan dengan `diff`: sama persis).
- **`npm run db:migrate`** (`scripts/db-migrate.mjs`): menjalankan file yang belum tercatat di `schema_migrations`, berurutan menurut nama. Setiap file berjalan dalam satu transaksi bersama pencatatannya.
- **`scripts/db-client.mjs`:** `withDatabase(run)` menyatukan koneksi, pesan error, dan perlindungan password dari `db-check.mjs`. Dipakai juga oleh seed besok.
- **Spesifikasi:** class diagram (termasuk class `CoverCredit`), dua ER diagram, blok SQL, dan dua poin baru di "Keputusan desain".
- **`scripts/db-local.mjs`** (`npm run db:setup`, `db:start`, `db:stop`): server PostgreSQL 18 khusus proyek. Ditambahkan karena user meminta Claude menyiapkan database sendiri, dan server terpasang menolak tanpa password superuser. Claude tidak mencari password itu dan tidak mengubah `pg_hba.conf`.
  - Data ada di `%LOCALAPPDATA%`, karena proyek ini di OneDrive dan sinkronisasi bisa merusak file database yang sedang dipakai.
  - User `side_notes` bukan superuser, sama seperti di Neon nanti.
  - `db:stop` tidak ada di plan hari ini; ditambahkan karena dibutuhkan untuk mematikan atau menghapus server.

**Berbeda dari rancangan awal (disetujui user dalam plan hari ini):**

- **`TIMESTAMPTZ`, bukan `TIMESTAMP`, untuk semua kolom waktu.** postgres.js membaca `TIMESTAMP` sebagai waktu lokal komputer, sedangkan `lib/format.ts` menampilkan tanggal dalam UTC. Waktunya akan bergeser 7 jam di laptop (WIB) tapi tidak di Vercel (UTC).
- **`bio`, `beat`, dan `excerpt` memakai `NOT NULL DEFAULT ''`,** sesuai `lib/types.ts`.
- **Constraint `articles_cover_credit_complete`:** kredit foto harus lengkap atau kosong sama sekali.

**Perbaikan dari review (`code-reviewer`):**

| Tingkat | Temuan | Perbaikan |
|---------|--------|-----------|
| Sedang | Password berisi `@` tanpa encode, diikuti `/`, `?`, atau `#`: potongan password dibaca sebagai host dan tercetak di pesan `ENOTFOUND` | `@` kedua ditolak lebih dulu, di `db-client.mjs` dan `lib/db.ts`. Skrip hanya mencetak pesan dari server PostgreSQL; error lain hanya kodenya |
| Sedang | `db:migrate` gagal tanpa petunjuk kalau user bukan pemilik database (`42501`, sejak PostgreSQL 15) | Petunjuk untuk `42501`. Perintah di plan sudah memakai `OWNER` |
| Rendah | Skrip menggantung kalau ada koma setelah `@` pertama di password | Tertutup oleh penolakan `@` kedua |
| Rendah | `VARCHAR(255)` berisiko untuk URL Unsplash panjang yang ditulis `npm run covers` | `cover_image` dan dua kolom URL kredit memakai `TEXT` (berubah dari plan; murah selama migrasi belum pernah berjalan) |
| Rendah | Spesifikasi: `COMMENT.body` tertulis `string`; `CoverCredit` tidak punya class | Diperbaiki |

**Perbaikan dari review kedua (hanya `db-local.mjs`, karena skrip ini menangani password):**

| Tingkat | Temuan | Perbaikan |
|---------|--------|-----------|
| Sedang | Kalau `initdb` gagal, `process.exit` melewati `finally`, sehingga file password superuser tertinggal | Cek status dipindah ke setelah file dihapus; file sisa dari run yang terhenti dihapus di awal `setup` |
| Sedang | Langkah pemulihan hanya muncul di satu jalur gagal, padahal setelah `initdb` password superuser sudah tidak ada | Semua langkah setelah `initdb` dibungkus satu `try/catch` dengan langkah pemulihan yang sama |
| Rendah | `create role` yang gagal bisa tertulis di log beserta password | `set log_min_error_statement = panic` di sesi itu |
| Rendah | `export DATABASE_URL=` dan `.env.local` UTF-16 lolos dari penolakan | Regex diperluas; file berisi NUL ditolak |
| Rendah | `isRunning` menganggap semua status selain 0 sebagai mati | Hanya exit 3 yang berarti mati; status lain gagal dengan pesan jelas |
| Rendah | Pesan penolakan tidak memberi langkah berikutnya; tiga petunjuk belum cocok dengan alur baru | Pesan dan petunjuk diperbarui, termasuk di `lib/db.ts` |

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 115/115 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman tetap ○ static |
| 9 URL palsu ke `db-migrate.mjs`, 3 ke `lib/db.ts` (termasuk bukti reviewer) | ✅ tidak ada password yang tercetak, tidak ada yang menggantung |
| `npm run db:setup` pertama, lalu kedua | ✅ selesai tanpa mencetak password, tidak ada file password tertinggal; yang kedua berhenti tanpa mengubah apa pun |
| `.env.local` | ✅ diabaikan git |
| Port | ✅ 5433 hanya di `127.0.0.1` dan `::1`; service 5432 tetap berjalan |
| `npm run db:migrate` pertama, lalu kedua | ✅ `Applying 001_schema.sql`, lalu `No new migrations.` |
| Isi database | ✅ 6 tabel + `schema_migrations`, 2 indeks, semua kolom waktu `timestamptz`, 0 baris; `side_notes` bukan superuser dan memiliki database |
| Aturan tabel (dalam transaksi yang dibatalkan) | ✅ menolak `role` dan `status` yang tidak dikenal, kredit foto setengah terisi, author yang tidak ada, dan email kembar; baris yang sah diterima |
| Tanggal | ✅ `2026-10-12T08:00:00.000Z` kembali utuh setelah disimpan |
| File migrasi rusak (sementara, sudah dihapus) | ✅ gagal dengan pesan jelas, tidak ada tabel sisa, tidak tercatat |
| Jalur gagal `db:setup` (salinan terpisah, sudah dihapus): `initdb` gagal, port terpakai, `.env.local` tidak bisa ditulis, `export DATABASE_URL`, UTF-16 | ✅ pesan dan langkah pemulihan benar, tidak ada file password tertinggal, tidak ada password di keluaran maupun log |
| `db:setup` sukses dengan `.env.local` yang sudah berisi baris lain tanpa newline di akhir | ✅ baris baru terpisah dengan benar, `db:check` berhasil |
| Server dimatikan, lalu `npm run db:start` | ✅ saat mati muncul petunjuk `db:start`; setelah dinyalakan `db:check` berhasil; `db:start` kedua hanya memberi tahu |

**Belum diuji:** `create role` yang gagal (tidak bisa dipicu di server baru) dan Ctrl+C saat `initdb` berjalan; keduanya hanya dianalisis dari kode.

**Catatan untuk hari berikutnya (temuan Rendah):**

- **Fase 5:** `.env.local` tidak masuk git, tapi ikut tersinkron ke OneDrive bersama folder proyek. Risikonya kecil selama server hanya di `localhost`, jadi simpan URL Neon hanya di pengaturan Vercel, bukan di file ini.
- **Hari 3 (seed), perlu keputusan user:** 5 topic hanya ada di `db:seed`, jadi database produksi tanpa data contoh tidak punya topic. Alternatifnya, migrasi `002` dengan id tetap dan seed memakai `ON CONFLICT`.
- **Hari 5–7 (`lib/data/*`):**
  - `TIMESTAMPTZ` kembali sebagai `Date`, sedangkan `lib/types.ts` memakai string. Pakai `.toISOString()` di pemetaan; `sql<Article[]>` tidak menangkap ini.
  - `count(*)` dan `sum()` kembali sebagai string. Pakai `::int`.
  - Jangan `select *` pada `users`, supaya `password_hash` tidak masuk ke hasil `"use cache"`.
- **Fase 4:**
  - Label "Updated" di `components/dashboard/my-articles.tsx:69` menampilkan `createdAt`; skema belum punya `updated_at`.
  - Pertimbangkan constraint alur artikel: `published` wajib punya `published_at`, `rejected` wajib punya `review_note`.

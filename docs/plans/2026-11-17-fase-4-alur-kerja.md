# Plan: Fase 4 — alur kerja

**Tanggal:** 2026-11-17
**Status:** Disetujui 2026-11-17. Dikerjakan satu langkah per hari, 17–26 Nov.

## Context

Fase 3 (login) selesai. Fase 4 membuat tombol dashboard benar-benar menyimpan. Mulai besok, isi artikel ditulis author di editor, sedangkan `ArticleBody` merendernya dengan `dangerouslySetInnerHTML`. Karena itu, HTML harus dibersihkan di server sebelum fitur simpan ada. Langkah hari ini (Sel 17 Nov, roadmap): modul sanitasi beserta test XSS, dipasang lebih dulu sebelum ada Server Action yang menyimpan.

## Keputusan user (brainstorm 2026-11-17)

| Hal | Keputusan |
|-----|-----------|
| Sanitasi | **`sanitize-html`**: jalan di server, tag yang boleh sama dengan yang dibuat editor |
| Author mengubah artikel terbit | **Artikel kembali ke `pending`** dan hilang dari situs sampai disetujui lagi |
| Sampul | **Disimpan di folder lokal dulu**, lewat satu modul penyimpanan, supaya Fase 5 bisa menggantinya ke Blob/S3 |
| `view_count` | **Naik sekali per browser per hari** (cookie per artikel); halaman artikel tetap static |
| Pencarian full-text | Dilewati; Rabu 25 Nov menjadi cadangan (default, tidak dibantah) |
| Hapus | Author boleh menghapus draft dan artikel ditolak miliknya sendiri (default, tidak dibantah) |

## Tugas Fase 4

| # | Hari | Tugas | Siapa | File (perkiraan) | Status |
|---|------|-------|-------|------------------|--------|
| 1 | Sel 17 Nov | Sanitasi HTML + test XSS | Claude | `lib/sanitize-html.ts` (baru), `components/article/article-body.tsx`, `__tests__/sanitize-html.test.ts` (baru), `package.json`, `package-lock.json`, `CLAUDE.md`, plan ini | ✅ |
| 2 | Rab 18 Nov | Simpan draft (Server Action, `requireUser`, sanitasi, `updateTag`); kolom Summary; editor hanya-baca untuk selain penulis; logout memuat ulang halaman | Claude | `lib/articles/draft-rules.ts`, `lib/articles/actions.ts`, `lib/data/article-writes.ts` (baru), `components/editor/article-editor.tsx`, `components/dashboard/my-articles.tsx`, `components/dashboard/all-articles.tsx`, `components/dashboard/login-form.tsx`, `lib/auth/actions.ts`, `app/dashboard/articles/new/page.tsx`, `app/dashboard/articles/[id]/page.tsx`, `__tests__/`, `e2e/drafts.spec.ts`, `e2e/db.ts` (baru), `e2e/access.spec.ts`, `e2e/flows.spec.ts`, `e2e/responsive.spec.ts`, `CLAUDE.md` | ✅ |
| 3 | Kam 19 Nov | Kirim ke editor (`draft`/`rejected` → `pending`; artikel terbit yang diubah → `pending`) | Claude | `lib/articles/actions.ts`, `lib/articles/draft-rules.ts`, `lib/data/article-writes.ts`, `components/editor/article-editor.tsx`, `app/dashboard/articles/[id]/page.tsx`, `__tests__/`, `e2e/submit.spec.ts` (baru), `e2e/db.ts`, `e2e/flows.spec.ts`, `CLAUDE.md` | ✅ |
| 4 | Jum 20 Nov | Review admin: approve / reject + catatan | Claude | `lib/articles/review-actions.ts`, `lib/articles/review-rules.ts` (baru), `lib/data/article-writes.ts`, `components/dashboard/review-panel.tsx`, `components/editor/article-editor.tsx`, `app/dashboard/review/[id]/page.tsx`, `__tests__/`, `e2e/review.spec.ts` (baru), `e2e/db.ts`, `e2e/submit.spec.ts`, `e2e/flows.spec.ts`, `CLAUDE.md` | ✅ |
| 5 | Sab 21 Nov | Kelola penulis: buat, nonaktifkan, reset password; migration unique index `lower(email)` | Claude | `db/migrations/003_users_email_lower.sql`, `docs/the-campus-herald.md`, `lib/auth/author-rules.ts`, `lib/auth/temporary-password.ts`, `lib/auth/author-actions.ts`, `lib/data/user-writes.ts` (baru), `lib/data/auth.ts`, `components/dashboard/author-manager.tsx`, `components/dashboard/review-panel.tsx`, `app/dashboard/authors/page.tsx`, `app/dashboard/review/[id]/page.tsx`, `__tests__/`, `e2e/authors.spec.ts` (baru), `e2e/db.ts`, `CLAUDE.md` | ✅ |
| – | Min 22 Nov | Cadangan (dipakai untuk hari 7) | – | – | – |
| 6 | Sen 23 Nov (dikerjakan 21–22 Nov) | Unggah sampul ke folder lokal + teks alt (`cover_alt`) | Claude | `lib/uploads/paths.ts`, `lib/uploads/storage.ts`, `app/uploads/[file]/route.ts`, `lib/articles/cover-actions.ts`, `lib/data/upload-writes.ts`, `lib/images-client.ts` (baru), `db/migrations/004_uploads.sql` (baru), `lib/articles/actions.ts`, `lib/articles/draft-rules.ts`, `lib/data/article-writes.ts`, `lib/data/articles.ts`, `lib/types.ts`, `lib/mock/articles.ts`, `components/editor/article-editor.tsx`, `components/article/article-cover.tsx`, halaman artikel dan review, `next.config.ts`, `.gitignore`, `.env.example`, `docs/the-campus-herald.md`, `__tests__/`, `e2e/covers.spec.ts` (baru), `e2e/db.ts`, `CLAUDE.md` | ✅ |
| 7 | Sel 24 Nov (dikerjakan Min 22 Nov) | `view_count` sekali per browser per hari | Claude | `lib/data/view-writes.ts`, `app/api/views/[id]/route.ts`, `components/article/view-counter.tsx` (baru), `app/(public)/articles/[slug]/page.tsx`, `lib/data/articles.ts`, `__tests__/views.test.ts`, `__tests__/view-counter.test.tsx`, `e2e/views.spec.ts` (baru), `e2e/db.ts`, `CLAUDE.md` | ✅ |
| – | Sel 24 Nov | Cadangan (dipakai untuk upgrade Next 16.4.6, `docs/plans/2026-11-24-upgrade-next.md`, dan perbaikan Ctrl+K setelah Esc, `docs/plans/2026-11-24-ctrl-k-setelah-esc.md`) | Claude | `package.json`, `package-lock.json`, `components/search/command-palette.tsx`, `components/search/command-palette-trigger.tsx`, `__tests__/search.test.tsx` | ✅ |
| – | Rab 25 Nov | Cadangan (full-text dilewati; dipakai untuk artikel unggulan ikut Most read, `docs/plans/2026-11-25-artikel-unggulan-ikut-most-read.md`) | Claude | `lib/feature.ts` (baru), `lib/data/articles.ts`, `lib/mock/articles-data.ts`, `app/(public)/page.tsx`, `__tests__/feature.test.ts` (baru), `CLAUDE.md` | ✅ |
| 8 | Kam 26 Nov | Fase 4 selesai (`qa-tester`) + brainstorm Fase 5 | User / Claude | – | Belum |

Setiap hari: verifikasi, `code-reviewer` sekali, update plan, lalu commit dan push.

## Hari 1 (Sel 17 Nov): sanitasi HTML — rencana

**1. Paket:** `npm install sanitize-html@2.18.1 --save-exact` dan `@types/sanitize-html` (dev). Versi 2.18.1 (14 Okt) dipilih karena 2.18.2 baru dirilis 6 hari lalu.

**2. `lib/sanitize-html.ts`**: fungsi murni `sanitizeArticleHtml(html: string): string`. Tidak memakai `server-only`, karena unit test dan Server Action besok sama-sama memakainya, dan file ini tidak diimpor oleh komponen client.

- **Tag yang boleh**, sama dengan editor `components/editor/rich-text-editor.tsx` (StarterKit tanpa code, codeBlock, strike, underline, horizontalRule, link; ditambah Image): `p`, `h2`, `h3`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `br`, `img`.
- **Atribut yang boleh:**
  - `img`: `src`, `alt`, `title`;
  - `ol`: `start`, hanya angka bulat positif (lewat `exclusiveFilter`/`transformTags`).
  - Tidak ada `style`, `class`, `on*`, `srcset`, atau `id`.
- **`img src`:** hanya `https:` dan path relatif yang diawali `/`, tetapi bukan `//` (`allowedSchemesByTag`, `allowProtocolRelative: false`). Nilai `data:`, `blob:`, `javascript:` dan `http:` dibuang; `img` tanpa `src` yang sah dihapus.
- **`transformTags`:** `b` → `strong`, `i` → `em`, `h1` → `h2`, `h4`–`h6` → `h3`. Ini untuk HTML yang dikirim langsung ke Server Action, tanpa lewat editor.
- **Tag lain** (`script`, `style`, `iframe`, `svg`, `math`, `a`, `form`, dan seterusnya) dibuang. Isi teksnya tetap ada, kecuali isi `script`/`style`/`textarea`/`noscript` (perilaku bawaan `nonTextTags`).
- Komentar HTML dibuang.

**3. Pengaman tambahan di `components/article/article-body.tsx`:** render `sanitizeArticleHtml(article.body)`, bukan `article.body` mentah.

- Ini Server Component yang dipakai halaman artikel publik dan halaman review admin. Biayanya hanya saat render atau prerender di server, dan halaman artikel tetap ○.
- Dengan ini, baris yang ditulis di luar app (seed, SQL langsung) juga ikut dibersihkan.
- Komentar di file itu diperbarui.

**4. `__tests__/sanitize-html.test.ts`:**

- **Vektor XSS:**
  - `<script>`;
  - `<img src=x onerror=…>`;
  - `<img src="javascript:…">`, termasuk yang disamarkan dengan entity atau spasi;
  - `src` `data:` dan `blob:`;
  - `<svg onload>`, `<math>`, `<iframe>`, `<a href="javascript:">`;
  - atribut `style`;
  - tag bersarang `<scr<script>ipt>`;
  - komentar dan `<!-- -->` yang memecah tag;
  - `<noscript><p title="</noscript><img onerror>">` (mXSS);
  - `ol start="1 onclick=…"`.
- **Bentuk keluaran:** tidak ada `<script`, atribut `on`, `javascript:`, `style=`, atau `srcset` yang tersisa.
- **Isi yang sah tetap utuh:** hasil Tiptap yang khas (heading, list berisi `<p>`, blockquote, `img` https dan `/uploads/…`) tidak berubah. Semua sampel di `lib/mock/bodies.ts` tidak berubah, atau hanya berubah bentuk serialisasinya tapi teksnya sama; mana yang berlaku, dicek saat mengerjakan.
- **Idempoten:** `sanitize(sanitize(x)) === sanitize(x)`.

**5. Dokumentasi:**

- `CLAUDE.md`:
  - aturan domain "sanitised on the server" diganti menjadi "lewat `sanitizeArticleHtml`, saat simpan dan saat render";
  - baris Phase 4 di status.
- Roadmap lokal: baris hari ini ditandai ✅.

**Catatan untuk besok:**

- Gambar yang disisipkan di editor saat ini memakai URL `blob:` lokal, yang akan dibuang saat simpan. Ini wajar sampai unggah sampul/gambar ada (hari 6).
- Batas panjang isi dan cek "isi kosong" masuk ke Server Action simpan.

## Hari 1 (Sel 17 Nov): hasil

**Yang dibuat:**

- **`sanitize-html@2.18.1`** dipasang (versi pasti) dan `@types/sanitize-html@2.16.2` (dev).
- **`lib/sanitize-html.ts`** (`server-only`): `sanitizeArticleHtml(html)`, sesuai rencana di atas, ditambah dari review:
  - `import "server-only"`, supaya pustaka ini tidak pernah masuk bundle browser; `__tests__/setup.ts` me-mock-nya untuk unit test.
  - `ol type` boleh, hanya `1`, `a`, `A`, `i`, `I` (daftar huruf/romawi yang ditempel dari Word tetap utuh).
  - `iframe`, `xmp`, `noembed`, `noframes`, `plaintext` dibuang beserta isinya, supaya tidak muncul sebagai markup ter-escape di artikel.
- **`ArticleBody`** merender `sanitizeArticleHtml(article.body)`. Halaman artikel tetap ○.
- **`__tests__/sanitize-html.test.ts`**: 39 test, termasuk 33 vektor serangan, isi editor yang tetap utuh, aturan gambar, idempoten, dan ke-23 sampel artikel yang tidak berubah sama sekali.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 185/185 (39 baru) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman publik dan artikel tetap ○, dashboard ƒ. Run pertama berhenti dengan peringatan keamanan Next (lihat tindak lanjut); diulang sesuai pesannya, lolos |
| `npm run test:e2e` penuh | ✅ 532 lolos, 0 gagal (sebelum dan sesudah perbaikan review) |

**`code-reviewer`:** tidak ada Kritis, Tinggi, atau Sedang. Lima Rendah:

- **Diperbaiki:** `server-only`, `ol type`, tag tambahan di `nonTextTags`, dan test untuk entitas tab/newline di path, huruf besar, `src` ganda, breakout `textarea`/`iframe`, img tanpa `src`.
- **Tindak lanjut:** gambar dari host https mana pun diizinkan, jadi penulis bisa memasang gambar pelacak pihak ketiga. Bisa dibatasi ke host tertentu saat unggah gambar ada (hari 6).

**Tindak lanjut:**

- **Next.js 16.4.3** terkena advisory GHSA-mfr8-8qww-v76h (moderate: kebocoran data antar root params lewat `unstable_cache()`). App ini tidak memakai `unstable_cache`, tapi `next build` kini menampilkan peringatan dan berhenti sekali. Perbaikannya `next@16.4.6`; perlu keputusan user (sekarang, atau di Fase 5 bersama `npm audit fix`).
- Gambar yang disisipkan di editor saat ini memakai URL `blob:` lokal, yang akan dibuang saat simpan. Ini wajar sampai unggah gambar ada (hari 6).
- Batas panjang isi dan cek "isi kosong" masuk ke Server Action simpan (hari 2).

## Hari 2 (Rab 18 Nov): simpan draft

**Keputusan user:**

- Topic wajib dipilih untuk menyimpan draft (tanpa migration); judul, summary dan isi boleh kosong.
- Excerpt diisi dari kolom **Summary** baru di editor (maks. 300 karakter), wajib saat submit.
- Hanya penulisnya yang bisa menyimpan; admin melihat artikel orang lain hanya-baca.

**Yang dibuat:**

- **`lib/articles/draft-rules.ts`** (dipakai browser dan server):
  - batas panjang: judul 200, summary 300, isi 100.000 karakter;
  - `validateDraft`, `validateForSubmit` (dipindah dari editor, kini juga mewajibkan summary);
  - `slugify` (diakritik dibuang, kosong → `untitled`);
  - `displayTitle` ("Untitled draft" untuk judul kosong di daftar dan judul halaman).
- **`lib/data/article-writes.ts`** (server-only, tanpa cache):
  - `createDraft` dan `updateDraft` dalam transaksi;
  - `updateDraft` mengecek pemilik dan status (`draft`/`rejected`) dengan `select … for update`; selain itu → `null`;
  - status tidak berubah;
  - slug mengikuti judul sampai artikel pernah terbit, dibuat unik dengan `-2`, `-3`…, dan dicoba ulang saat terjadi `23505`.
- **`saveDraft`** (`lib/articles/actions.ts`):
  - `requireUser`, cek tipe setiap field, id lewat `isValidId`;
  - `validateDraft`, `sanitizeArticleHtml`, tulis, lalu `updateTag("articles")`;
  - kesalahan database hanya dicatat di server; browser mendapat "Could not save. Try again.";
  - artikel orang lain, pending, terbit, atau yang tidak ada mendapat satu jawaban yang sama.
- **Editor:**
  - kolom Summary;
  - isi editor disimpan di ref;
  - "Saving…" selama menyimpan;
  - error per field dari browser maupun server;
  - prop `canEdit`, dan catatan "Only the author can change this article.";
  - di daftar dashboard, "Updated" diganti "Started", karena tanggal yang ditampilkan adalah `created_at`.
- **Artikel baru** pindah ke halamannya sendiri setelah simpan pertama: `router.replace("/dashboard/articles/<id>?saved=1")`, lalu halaman itu menampilkan "Draft saved." satu kali dan membuang `?saved=1` dari alamat. Selama simpan pertama, field dikunci.

**Perubahan dari rencana:**

- **Bukan `history.replaceState`** (temuan Sedang dari review):
  - Setelah alamat diganti, simpan berikutnya merender halaman `[id]` di tempat halaman `new`, sehingga editor di-mount ulang.
  - Akibatnya pesan hilang, dan teks yang diketik selama menyimpan juga hilang.
  - Sekarang pindahnya disengaja, sekali, tepat setelah simpan pertama.
- **Halaman yang disimpan Next** (ditemukan saat E2E, `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`): dengan Cache Components, halaman yang ditinggalkan disembunyikan, bukan dibuang, lengkap dengan state dan DOM-nya. Dua akibatnya diperbaiki:
  - **"New article" masih berisi artikel yang baru disimpan,** dan simpan berikutnya akan membuat salinan. `NewArticleEditor` kini membuat editor baru saat halaman itu disembunyikan.
  - **Setelah logout, halaman dashboard tetap ada tersembunyi di dokumen,** termasuk email penulis dari `/dashboard/authors` dan draft yang belum disimpan. Ini sudah terjadi sejak Fase 3. `logout` kini mengarah ke `/login?out=1`, lalu halaman login memuat ulang dirinya sepenuhnya. Test baru di `e2e/access.spec.ts` memastikan tidak ada `@herald.test` di halaman setelah logout.
- **Test tata letak editor** (`e2e/responsive.spec.ts`) memakai `/dashboard/articles/new`, bukan artikel 22 milik orang lain yang kini hanya-baca bagi admin. Test urutan field sekarang juga mencakup Summary.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` (3×) | ✅ 203/203 (17 test baru: aturan, action, editor) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman publik, artikel dan `/login` tetap ○. Peringatan keamanan Next masih menghentikan run pertama; run ulang lolos |
| `e2e/drafts.spec.ts` + `e2e/access.spec.ts`, `--repeat-each 3` | ✅ 65/65 |
| `npm run test:e2e` penuh | ✅ 536 lolos, 0 gagal |
| Database setelah E2E | ✅ 23 artikel, tidak ada baris `E2E draft` yang tersisa |

**`code-reviewer`:** tidak ada temuan Kritis atau Tinggi.

- **Sedang (diperbaiki):** `replaceState` membuat editor di-mount ulang pada simpan kedua (lihat di atas).
- **Rendah, diperbaiki:**
  - judul kosong membuat link tanpa nama dan judul halaman "Edit: " → `displayTitle`;
  - label "Updated" memakai `created_at` → "Started";
  - URL `jsdom` tidak dikembalikan antar-test.
- **Rendah, untuk ditindaklanjuti:**
  - `updateTag("articles")` di setiap simpan draft juga mengosongkan cache halaman publik, padahal draft tidak tampil di sana. Bisa dipersempit nanti dengan tag terpisah.
  - Baris E2E dihapus langsung di database, sedangkan cache `next start` masih memuatnya sampai simpan berikutnya. Tidak ada test yang bergantung pada itu.
- **Satu test unit** yang tampak flaky ternyata membandingkan isi yang sudah diubah Tiptap (`<li><p>`) setelah editornya selesai dimuat. Test-nya sekarang tidak membandingkan isi.

**Tindak lanjut:**

- Kolom `updated_at` (migration) supaya daftar bisa menampilkan kapan terakhir diubah.
- Halaman edit yang disimpan Next tetap memakai state lama kalau datanya berubah di server, misalnya admin menolak artikel saat author sedang di halaman lain. Ini perlu dicek bersama alur submit dan review (hari 3–4).
- Sesi yang kedaluwarsa tanpa logout (lewat proxy) tidak memuat ulang halaman, jadi halaman yang disembunyikan tetap ada sampai tab ditutup.
- Upgrade Next ke 16.4.6 (advisory GHSA-mfr8-8qww-v76h), dari hari 1: masih menunggu keputusan user.

## Hari 3 (Kam 19 Nov): kirim ke editor

**Keputusan (sesuai brainstorm, tanpa pertanyaan baru):**

- Submit juga menyimpan semua field.
- Artikel terbit bisa diubah, tapi hanya lewat "Submit changes": tidak ada "Save draft", dan ada catatan bahwa artikel akan turun dari situs sampai disetujui lagi. Slug dan `published_at` tidak berubah.
- `review_note` lama tetap tersimpan sampai review berikutnya.

**Yang dibuat:**

- **Aturan** (`lib/articles/draft-rules.ts`):
  - `isBlankHtml`: cek isi kosong di server, tanpa teks dan tanpa gambar;
  - `isEditable` (kini juga `published`) dan `canSaveDraft`.
- **`submitArticle`** (`lib/data/article-writes.ts`):
  - artikel baru → langsung `pending`; artikel lama → hanya `draft`, `rejected` atau `published` milik penulis ini (`for update`);
  - `status = 'pending'` dan `submitted_at = now()`;
  - kode bersama dengan `updateDraft` (`insertArticle`, `changeArticle`).
- **`submitForReview`** (`lib/articles/actions.ts`):
  - cek tipe lewat `readArticleInput`, helper yang dipakai bersama `saveDraft`;
  - `validateForSubmit` dijalankan pada isi yang sudah dibersihkan, jadi isi yang hanya berisi `<script>` dianggap kosong;
  - setelahnya `updateTag("articles")`.
- **Editor:**
  - Submit menyimpan; berhasil → status `pending`, editor terkunci, pesan "Sent to the editor for review.";
  - artikel baru → `?notice=submitted` (dan `?saved=1` menjadi `?notice=saved`);
  - artikel terbit → "Submit changes" beserta catatannya;
  - selama mengirim, tombol menjadi "Saving…" atau "Sending…".

**Perubahan dari rencana:**

- **`prefetch={false}` pada "View live"** (`app/dashboard/articles/[id]/page.tsx`):
  - E2E menemukan bahwa artikel terbit yang disubmit ulang masih tampil di situs pada 4 dari 8 run, bahkan setelah 15 detik.
  - Penyebabnya prefetch halaman publik dari tombol "View live" yang masih dirender saat author menekan submit. Hasil render lama itu tersimpan setelah `updateTag` dan dianggap baru.
  - Dengan menunggu `networkidle` sebelum submit: 8/8 lolos. Dengan prefetch dimatikan, tanpa menunggu: 10/10 lolos.
- **`flows.spec.ts`** "the editor accepts formatted text" tidak lagi submit, karena submit kini menyimpan ke database. Alur submit ada di `e2e/submit.spec.ts`, yang membersihkan barisnya sendiri.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 216/216 (13 test baru: aturan, action submit, editor) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman publik dan `/login` tetap ○. Peringatan keamanan Next masih menghentikan run pertama; run ulang lolos |
| Test artikel terbit, `--repeat-each 10` (tanpa prefetch) | ✅ 10/10 |
| `e2e/submit.spec.ts` + `e2e/drafts.spec.ts`, `--repeat-each 3` | ✅ 23/23 |
| `npm run test:e2e` penuh (sebelum dan sesudah perbaikan review) | ✅ 540 lolos, 0 gagal |
| Database setelah E2E | ✅ 23 artikel, tidak ada sisa `E2E draft`, 2 pending (seperti data sampel) |

**`code-reviewer`:** tidak ada temuan Kritis atau Tinggi. Otorisasi dinilai aman: artikel pending tidak bisa disubmit ulang, artikel orang lain ditolak (termasuk oleh admin), dan tidak ada jalur untuk langsung publish.

- **Sedang, diperbaiki:**
  - teks yang diketik selama submit hilang tanpa terlihat, karena form dikunci begitu jawaban datang. Kini field terkunci selama submit.
- **Sedang, dicatat sebagai risiko:**
  - Render `/articles/[slug]` oleh **pembaca** yang sedang berjalan tepat saat `updateTag` dipanggil bisa menyimpan versi lama, dan versi itu bertahan sampai penyimpanan berikutnya. Menurut reviewer, entri `"use cache"` memakai waktu mulai render, tapi entri halaman/shell tampaknya tidak. Docs bawaan tidak membahas hal ini.
  - `prefetch={false}` hanya menutup kasus yang dipicu author sendiri; peluangnya sempit (hitungan milidetik).
  - Pilihan perbaikan untuk nanti: halaman artikel membaca status di luar shell statis, atau melaporkannya ke Next.js. Mengirim feedback ke Next menunggu keputusan user, sama seperti blok `AGENTS.md`.
- **Rendah, diperbaiki:**
  - field artikel baru sempat bisa diketik antara jawaban server dan pindah halaman. `router.replace` kini berjalan dalam transition yang sama;
  - tombol sesaat kembali bertuliskan "Submit" sebelum transition selesai;
  - pesan gagal jaringan kini "Could not submit" untuk submit.
- **Rendah, dicatat di komentar `e2e/submit.spec.ts`:** baris terbit buatan test bisa sempat masuk ke cache daftar publik kalau test lain menyimpan bersamaan. Kalau test gagal sebelum submit, salinan itu bertahan sampai penyimpanan berikutnya.

**Tindak lanjut:**

- Race render pembaca dan `updateTag` (lihat di atas).
- Halaman yang disimpan Next (Activity) masih memegang status lama setelah admin memutuskan; cek saat review dibuat besok.
- Belum ada cara bagi author untuk menarik kembali artikel yang sedang pending (di luar spesifikasi).

## Hari 4 (Jum 20 Nov): review admin

**Yang dibuat:**

- **`lib/articles/review-rules.ts`:** catatan untuk author 10–2000 karakter. Aturan ini dipakai bersama oleh panel review dan server.
- **`reviewArticle`** (`lib/data/article-writes.ts`):
  - hanya untuk artikel `pending` (dicek dengan `for update`, jadi dua admin tidak bisa memutuskan artikel yang sama);
  - **approve:** status `published`, `review_note` dikosongkan, `reviewer_id` diisi, dan `published_at = coalesce(published_at, now())`. Artikel terbit yang diubah tetap memakai tanggal terbit pertamanya, artikel baru mendapat tanggal hari ini;
  - **send back:** status `rejected`, catatan disimpan, `reviewer_id` diisi.
- **`approveArticle` / `rejectArticle`** (`lib/articles/review-actions.ts`):
  - `requireAdmin()` dijalankan lebih dulu, baru id (`isValidId`) dan catatan yang di-trim;
  - lalu `updateTag("articles")`, sehingga artikel yang disetujui langsung tampil di situs;
  - artikel yang sudah tidak pending mendapat satu jawaban yang sama;
  - kesalahan database tetap di server.
- **Panel review:**
  - approve tetap dua langkah, sekarang menyimpan;
  - selama menyimpan, tombol menjadi "Publishing…" atau "Sending…";
  - error catatan dan jawaban server ditampilkan.
- **Halaman review** menampilkan "Your earlier note" pada artikel yang disubmit ulang.

**Perubahan dari rencana:**

- **`e2e/flows.spec.ts`:** test approve versi preview dihapus, karena kini benar-benar akan menerbitkan artikel sampel. Alurnya ada di `e2e/review.spec.ts` dan memakai baris buatan test sendiri.
- **Baris E2E dimasukkan langsung ke database,** lewat `e2e/db.ts` `insertArticle` dengan tanggal pertengahan 2000 (UTC), supaya tidak bergeser oleh zona waktu. Baris itu tidak masuk antrean yang di-cache sampai app menyimpan sesuatu, jadi halaman review dibuka lewat id.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 224/224 (8 test baru untuk action review, panel diperbarui) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman publik dan `/login` tetap ○. Peringatan keamanan Next masih menghentikan run pertama; run ulang lolos |
| `e2e/review.spec.ts` + `submit` + `drafts`, `--repeat-each 3` | ✅ 35/35 |
| `npm run test:e2e` penuh (sebelum dan sesudah perbaikan review) | ✅ 543 lolos, 0 gagal |
| Database setelah E2E | ✅ 23 artikel, tidak ada sisa `E2E draft`, 2 pending, 18 published (sama dengan data sampel) |

**`code-reviewer`:** tidak ada temuan Kritis atau Tinggi. Otorisasi dan race antar-admin dinilai aman, dan admin yang memutuskan artikelnya sendiri sesuai spesifikasi.

- **Sedang, diperbaiki:**
  - Panel review menyimpan status lama di halaman yang disimpan Next (Activity). Artikel yang disubmit ulang lalu dibuka lagi bisa tampil "Published" tanpa tombol.
  - Sekarang panel di-`key` dengan id, status dan `submitted_at`.
- **Rendah, diperbaiki:**
  - Saat sesi habis, action melakukan redirect dan tidak mengembalikan hasil. Panel dan editor sekilas menampilkan "Could not save…"; sekarang hasil kosong itu diabaikan.
  - Komentar isolasi cache di `e2e/review.spec.ts`.
- **Rendah, tindak lanjut:**
  - Kebalikan race kemarin: render `/articles/[slug]` yang sudah menyimpan "tidak ditemukan" tepat saat approve. Artikel tetap tersembunyi sampai penyimpanan berikutnya. Arahnya aman (tidak ada yang bocor), dan peluangnya kecil.

**Tindak lanjut:**

- Race render dan `updateTag`, ke dua arah (hari 3 dan 4).
- Halaman edit author yang disimpan Next masih memegang status lama setelah admin memutuskan, sampai halaman dimuat ulang. Status dan catatannya baru muncul setelah reload atau navigasi baru. Bisa diperbaiki dengan pola `key` yang sama di editor.

## Hari 5 (Sab 21 Nov): kelola penulis

**Keputusan user:**

- Password sementara dibuat server dan ditampilkan sekali kepada admin, yang lalu memberikannya langsung ke penulis. Form "Add author" tidak lagi punya kolom password.
- Author belum bisa mengganti password sendiri; ini dicatat untuk Fase 5.

**Yang dibuat:**

- **Migration `003_users_email_lower.sql`:** unique index `lower(email)`, beserta SQL-nya di `docs/the-campus-herald.md`. `db:migrate` sudah dijalankan dua kali; run kedua: "No new migrations".
- **`lib/auth/author-rules.ts`:** nama ≤ 100 karakter, email valid dan ≤ 150 karakter, `normalizeEmail` (huruf kecil).
- **`lib/auth/temporary-password.ts`:** 16 karakter acak (`randomInt`) dari 31 huruf dan angka yang tidak mirip satu sama lain, dalam empat kelompok (sekitar 79 bit). Yang disimpan hanya hash scrypt-nya.
- **`lib/data/user-writes.ts`:** `insertAuthor` (`23505` → "taken"), `setActive`, `setPasswordHash`. Semua hanya berlaku untuk `role = 'author'`, jadi akun admin tidak bisa dinonaktifkan atau direset lewat sini.
- **`lib/auth/author-actions.ts`:** `requireAdmin()` lebih dulu, lalu cek tipe dan id. `updateTag("users")` dipanggil saat membuat dan saat mengaktifkan/menonaktifkan akun, tapi tidak saat reset, karena tidak ada data cache yang berubah. Kesalahan database tetap di server.
- **Halaman Authors:**
  - dialog hanya berisi nama dan email;
  - panel "Temporary password" langsung mendapat fokus, dan disebut juga di pesan status;
  - panel dikosongkan saat Next menyembunyikan halaman;
  - reset dua langkah;
  - status "busy" dicatat per akun;
  - tombol tetap 44 px.

**Perubahan dari rencana:**

- **Tanpa `key` yang ikut berubah dengan data.**
  - Rencananya daftar penulis diberi `key` yang berubah mengikuti data. Ternyata `key` itu membuat komponen di-mount ulang setelah action-nya sendiri, karena `updateTag` merender ulang halaman. Panel password pun hilang sebelum sempat dibaca.
  - Masalah yang sama terjadi pada `key` panel review kemarin: pesan "Sent back…" hilang. Test review gagal setelah pemuatan ulang terjadi lebih cepat.
  - Keduanya kini membandingkan props yang terakhir dilihat ("derive state from props"), tanpa remount. `AuthorManager` mengambil daftar dari server. `ReviewPanel` mengambil status dari server hanya kalau statusnya berbeda dari keputusannya sendiri.
- **Bug tata letak yang ditemukan E2E:** email panjang tanpa spasi (akun test) melebarkan kolom kartu penulis sampai 453 px di layar 320 px. Perbaikannya `grid-cols-1` (`minmax(0, 1fr)`) dan `overflow-wrap:anywhere` pada nama dan panel password.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm run db:migrate` (2×) | ✅ 003 dijalankan sekali; `users_email_lower_key` ada di `pg_indexes` |
| `npm test -- --run` | ✅ 234/234 (aturan, password sementara, 7 test action, komponen) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman publik dan `/login` tetap ○. Peringatan keamanan Next masih menghentikan run pertama; run ulang lolos |
| `e2e/authors.spec.ts` + `review.spec.ts`, `--repeat-each 3` | ✅ 29/29 |
| `npm run test:e2e` penuh (sebelum dan sesudah perbaikan review) | ✅ 548 lolos, 0 gagal |
| Database setelah E2E | ✅ 7 user (1 nonaktif, seperti sampel), tidak ada sisa `e2e-…`; 23 artikel, 2 pending |

**`code-reviewer`:** tidak ada temuan Kritis atau Tinggi. Otorisasi, penanganan password (tidak masuk cache, log, atau payload RSC) dan email ganda dinilai aman.

- **Sedang, diperbaiki:**
  - kartu penulis baru bisa muncul dua kali, kalau daftar dari server datang sebelum `onAdded`;
  - akun E2E tampil di daftar penulis publik selama run dan tertinggal di cache setelah dihapus. Sekarang akun dinonaktifkan lewat app dulu, lalu dihapus;
  - tombol baru setinggi 36 px; sekarang 44 px.
- **Rendah, diperbaiki:**
  - status "busy" kini per akun;
  - panel password diumumkan dan mendapat fokus;
  - test "password hilang" memakai `toHaveCount(0)`;
  - komentar `getAccountByEmail` yang usang;
  - `updateTag` yang tidak perlu saat reset.
- **Rendah, tindak lanjut:**
  - Artikel `pending` milik penulis yang dinonaktifkan tetap ada di antrean review. Admin masih bisa menyetujuinya, atau mengembalikannya ke orang yang tidak bisa login lagi. Perlu diputuskan, misalnya dengan tanda "akun nonaktif" di antrean.
  - `ReviewPanel` tidak me-reset catatan yang sedang diketik, kalau artikel ditarik lalu dikirim ulang dengan status yang sama (`pending` → `pending`).
  - Migration 003 akan gagal di database yang sudah berisi email yang hanya beda huruf besar/kecil. Data seed aman; database lain perlu dicek dulu.

**Tindak lanjut (Fase 5):** author bisa mengganti password sendiri, termasuk setelah menerima password sementara.

## Hari 6 (dimajukan, Sab 21 – Min 22 Nov): unggah sampul dan teks alt

Langkah hari 5 sudah selesai pada hari yang sama, jadi user memilih memajukan langkah Senin.

**Yang dibuat:**

- **Foto diperkecil di browser** (`lib/images-client.ts`): paling besar 1600×1200, WebP (atau JPEG), di bawah 950 KB.
  - Hasilnya muat dalam batas 1 MB Server Action, jadi `bodySizeLimit` tidak dinaikkan untuk action lain, termasuk login.
  - Data EXIF, termasuk lokasi GPS, ikut hilang.
- **`uploadCover`** (`lib/articles/cover-actions.ts`):
  - `requireUser()`;
  - file 1 byte–950 KB, jenisnya dicek dari byte (WebP, JPEG atau PNG), dan SVG ditolak;
  - maksimal 30 unggahan per jam per akun;
  - unggahan yang ditinggalkan lebih dari sehari dibersihkan;
  - kalau pencatatan ke database gagal, file yang sudah tersimpan dihapus lagi.
- **Penyimpanan** (`lib/uploads/storage.ts`, satu-satunya modul yang menyentuh file; diganti ke Blob/S3 di Fase 5):
  - `UPLOADS_DIR`, bawaannya `.data/uploads` (git-ignored, di luar `public/`);
  - nama file `/<uuid>.<ext>` dibuat server;
  - panggilan file memakai `turbopackIgnore`, supaya build tidak men-trace seluruh proyek.
- **`GET /uploads/[file]`:** hanya nama UUID yang dilayani, dengan `nosniff` dan cache immutable 1 tahun. Path lain → 404. Rute ini ƒ.
- **Tabel `uploads`** (migration `004`): path, pemilik, dan waktu unggah.
  - Artikel hanya boleh memakai unggahan penulisnya sendiri yang masih tercatat; baris itu dikunci dengan `for update`.
  - Sampul lain yang dikirim (alamat luar, file milik orang lain, atau file yang sudah dihapus dari tab lain) tidak mengubah sampul yang tersimpan.
  - Unggahan yang diganti dan tidak dipakai artikel lain dihapus dari tabel di dalam transaksi, lalu filenya dihapus setelah commit.
  - Kredit Unsplash dikosongkan kalau sampul berubah.
- **Teks alt:**
  - wajib diisi saat submit kalau ada sampul ("Describe the cover image."), maksimal 255 karakter;
  - dibacakan di halaman artikel dan review (`ArticleCover describe`), tapi tidak di kartu.
- **Editor:**
  - pratinjau sampul yang tersimpan;
  - status "Uploading…";
  - error di kolom sampul;
  - tombol "Remove cover";
  - Save, Submit dan Remove dinonaktifkan selama unggahan berjalan.

**Perubahan dari rencana (dari review):**

- **Tabel `uploads` dan migration `004`** tidak ada di rencana. Ditambahkan karena reviewer menemukan dua masalah:
  - path `/uploads/<uuid>` apa pun diterima, termasuk milik orang lain atau yang sudah dihapus. Dengan dua tab, artikel bisa kehilangan sampulnya;
  - tidak ada batas jumlah unggahan dan pembersihan file.
- **Sampul tak dikenal tidak lagi menjadi `null`;** sampul yang tersimpan dipertahankan.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm run db:migrate` | ✅ 004 dijalankan; tabel `uploads` ada |
| `npm test -- --run` | ✅ 249/249 (tipe file, path, penyimpanan di folder sementara, `uploadCover` termasuk batas per jam dan rollback, field sampul di save/submit, editor) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ tanpa warning; halaman publik dan `/login` tetap ○, `/uploads/[file]` ƒ. Peringatan keamanan Next masih menghentikan run pertama; run ulang lolos |
| `e2e/covers.spec.ts`, `--repeat-each 3` | ✅ 14/14 |
| `npm run test:e2e` penuh, sebelum perbaikan review | ✅ 551 lolos, 0 gagal |
| `npm run test:e2e` penuh, sesudah perbaikan review | 551 lolos, 1 gagal. Yang gagal "Ctrl+K opens quick search", dan gagal juga di commit terakhir (`f34fe0d`): 5 dari 8 run (lihat tindak lanjut) |
| Database dan folder setelah E2E | ✅ 23 artikel, tidak ada sisa `E2E draft`, tabel `uploads` kosong, tidak ada file baru. Ada 5 file sisa run sebelum perbaikan di `.data/uploads`; menghapusnya diblokir pemeriksaan keamanan, jadi harus dihapus user |

**`code-reviewer`:** tidak ada temuan Kritis atau Tinggi. Path traversal, polyglot, SSRF lewat optimiser, dan batas body dinilai aman.

- **Sedang, diperbaiki:**
  - kepemilikan dan keberadaan unggahan (tabel `uploads`);
  - Save dan Submit masih bisa ditekan saat unggahan berjalan;
  - unggahan tanpa batas jumlah dan tanpa pembersihan.
- **Rendah, diperbaiki:**
  - file test yang tidak disimpan kini ikut dihapus (`deleteTestUploads`, dari respons POST);
  - "Remove cover" dinonaktifkan selama unggahan.
- **Rendah, tindak lanjut:**
  - Server menyimpan byte apa adanya. Kalau action dipanggil langsung tanpa lewat editor, EXIF tetap ada, dan ukuran piksel tidak dibatasi (risiko decompression bomb di optimiser). Encode ulang dengan `sharp` di Fase 5.
  - Salinan di cache optimiser (31 hari) dan cache browser tetap ada setelah file dihapus.
  - Sampul draft bisa dibuka siapa pun yang tahu UUID-nya. UUID tidak bisa ditebak, jadi ini diterima.

**Tindak lanjut:**

- Test E2E "Ctrl+K opens quick search" kini sering gagal, juga di `f34fe0d`. Ctrl+K kedua setelah Esc di beranda tidak membuka palet. Sebelumnya selalu lolos, jadi perlu diselidiki tersendiri (mungkin perubahan perilaku Edge atau hydrate beranda).
- Gambar di dalam isi artikel (tombol "Insert image") belum memakai unggahan ini.
- Pindah penyimpanan ke Blob/S3 dan encode ulang di server (Fase 5).

## Hari 7 (dimajukan, Min 22 Nov): `view_count` sekali per browser per hari

Hari ini hari cadangan; user memilih memajukan langkah Selasa. Sel 24 Nov kini menjadi cadangan.

**Yang dibuat:**

- **Hitungan dikirim dari browser** (`components/article/view-counter.tsx`): satu `POST /api/views/<id>` setelah artikel tampil. Halaman artikel tetap ○, dan prefetch serta pengunjung tanpa JavaScript tidak terhitung.
- **`POST /api/views/[id]`** (`app/api/views/[id]/route.ts`, ƒ):
  - id hanya angka 1–2147483647, selain itu 404 tanpa query;
  - `Sec-Fetch-Site` selain `same-origin` → 403;
  - sudah ada cookie `viewed` → 204 tanpa tulis;
  - kalau belum: `countView` (`lib/data/view-writes.ts`, hanya artikel `published`), lalu cookie `viewed` dengan `Path=/api/views/<id>`, 24 jam, httpOnly, `SameSite=Strict`, `secure` di production. Artikel yang tidak terbit → 404 tanpa cookie;
  - error database → 500 tanpa detail.
- **Cache:** tidak ada `updateTag`. `getMostRead` memakai `cacheLife("hours")`, jadi beranda, `/categories` dan halaman topik di-revalidate per jam (tetap ○).

**Perubahan dari rencana:** tidak ada.

**Hasil verifikasi:**

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 256/256 (route: cookie dan atributnya, lintas situs, id tidak valid, artikel tidak terbit, error database; komponen mengirim satu POST) |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ halaman artikel tetap ○; beranda, `/categories` dan topik ○ dengan revalidate 1 jam; `/api/views/[id]` ƒ. Peringatan keamanan Next masih menghentikan run pertama; run ulang lolos |
| `e2e/views.spec.ts`, `--repeat-each 3` | ✅ 14/14 |
| `npm run test:e2e` penuh | 555 lolos, 1 gagal: "Ctrl+K opens quick search", yang sudah diketahui gagal sejak `f34fe0d` (lihat hari 6) |

**`code-reviewer`:** tidak ada temuan Kritis, Tinggi atau Sedang. Rendah, jadi tindak lanjut:

- Di `next dev` (StrictMode), dua POST bisa berangkat sebelum cookie pertama tiba, jadi satu kunjungan terhitung dua kali; hal yang sama terjadi kalau dua tab dibuka bersamaan.
- Artikel unggulan beranda memilih dari `viewCount` di daftar `cacheLife("max")`, jadi bisa tidak sejalan dengan Most read yang diperbarui per jam.
- E2E yang membuka artikel menaikkan angka seed; `npm run db:seed` mengembalikannya (dicatat di `CLAUDE.md`).
- Cookie `secure` lewat http di `APIRequestContext`: sudah dicek lolos.

**Tindak lanjut:**

- Rate limit untuk panggilan tanpa cookie (curl) di Fase 5.

## Sel 24 Nov (cadangan): upgrade Next 16.4.6

User memilih memakai hari cadangan untuk upgrade keamanan `next` dan `eslint-config-next` 16.4.3 → 16.4.6. Rincian dan hasil verifikasi ada di `docs/plans/2026-11-24-upgrade-next.md`; build kini lolos pada run pertama tanpa peringatan keamanan.

Sisa hari itu dipakai untuk test E2E "Ctrl+K opens quick search" yang sering gagal sejak `f34fe0d` (tindak lanjut hari 6). Ternyata bug kecil di app: event `close` dialog tiba 100–250 ms setelah Esc, dan Ctrl+K di sela itu diabaikan. Palet kini memberi tahu trigger saat itu juga; E2E penuh 556 lolos, 0 gagal. Rincian di `docs/plans/2026-11-24-ctrl-k-setelah-esc.md`.

## Rab 25 Nov (cadangan): artikel unggulan ikut Most read

Tindak lanjut Rendah hari 7: artikel unggulan beranda kini diurutkan dengan `getViewCounts()` (per jam, seperti Most read), bukan `viewCount` dari daftar `cacheLife("max")`. E2E penuh 556 lolos, 0 gagal. Rincian di `docs/plans/2026-11-25-artikel-unggulan-ikut-most-read.md`.

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
| 4 | Jum 20 Nov | Review admin: approve / reject + catatan | Claude | `app/dashboard/review/**` | Belum |
| 5 | Sab 21 Nov | Kelola penulis: buat, nonaktifkan, reset password; migration unique index `lower(email)` | Claude | `app/dashboard/authors`, `db/migrations/003_*.sql` | Belum |
| – | Min 22 Nov | Cadangan | – | – | – |
| 6 | Sen 23 Nov | Unggah sampul ke folder lokal + teks alt (`cover_alt`) | Claude | modul penyimpanan, editor | Belum |
| 7 | Sel 24 Nov | `view_count` sekali per browser per hari | Claude | route handler, halaman artikel | Belum |
| – | Rab 25 Nov | Cadangan (full-text dilewati) | – | – | – |
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

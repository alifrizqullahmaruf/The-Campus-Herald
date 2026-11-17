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
| 2 | Rab 18 Nov | Simpan draft (Server Action, `requireUser`, sanitasi, `updateTag`) | Claude | `lib/articles/actions.ts`, editor, `e2e/` | Belum |
| 3 | Kam 19 Nov | Kirim ke editor (`draft`/`rejected` → `pending`; artikel terbit yang diubah → `pending`) | Claude | sama | Belum |
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

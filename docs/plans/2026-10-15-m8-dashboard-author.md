# Plan M8: Login dan dashboard author

**Tanggal:** 2026-10-15
**Status:** ✅ Selesai
**Bagian dari:** [roadmap](2026-10-15-roadmap.md), Fase 1

## Tujuan

Tampilan login dan dashboard author sesuai design.md bagian 4 (Dashboard): halaman login, kerangka dashboard, "My articles", dan editor. Ini masih **pratinjau tanpa backend**: tombol hanya mengubah tampilan, tidak menyimpan apa pun. Login dan penyimpanan sungguhan dikerjakan di Fase 3–4.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Pasang Tiptap 3.32 (`@tiptap/react`, `starter-kit`, `extension-image`, `pm`, `core`; mendukung React 19) | Claude | `package.json` | ✅ |
| 2 | User pratinjau: author = Rafi (id 2), admin = Dewi (id 1) | Claude | `lib/mock/session.ts` | ✅ |
| 3 | `/login`: kartu tengah, email + password dengan validasi, catatan "Forgot your password? Ask the administrator.", lalu masuk ke dashboard (pratinjau) | Claude | `app/login/page.tsx`, `components/dashboard/login-form.tsx` | ✅ |
| 4 | Kerangka dashboard: sidebar (≥ lg) atau tab bar bawah (HP), logo, menu Writing (My articles, New article) dan Editor (Review queue + jumlah, All articles, Authors), chip user + role, Log out, banner "Preview", `noindex` | Claude | `app/dashboard/layout.tsx`, `components/dashboard/sidebar.tsx`, `preview-banner.tsx` | ✅ |
| 5 | "My articles": tab status dengan jumlah, daftar artikel (judul, badge kategori, badge status, tanggal), cuplikan catatan penolakan, tombol "New article", empty state | Claude | `app/dashboard/page.tsx`, `components/dashboard/my-articles.tsx` | ✅ |
| 6 | Editor: judul, pilihan 5 kategori, sampul (pratinjau lokal) + alt text, Tiptap (H2, H3, bold, italic, bullet, numbered, quote, gambar; tidak lebih), bar aksi sticky (Save draft / Submit for review), validasi saat submit, hanya-baca saat `pending`/`published`, callout catatan saat `rejected` | Claude | `components/editor/*`, `app/dashboard/articles/new/page.tsx`, `app/dashboard/articles/[id]/page.tsx` | ✅ |
| 7 | Test | Claude | `__tests__/dashboard-author.test.tsx` | ✅ |
| 8 | Verifikasi + commit + push | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 65 test lulus (10 baru: aturan submit, status yang bisa diedit, validasi login, form login, sidebar (halaman aktif + user pratinjau berganti di halaman editor), filter My articles, catatan penolakan, editor kosong tidak bisa submit, `pending` hanya-baca, `rejected` bisa diedit) |
| lint, tsc, build | ✅ `/dashboard`, `/login` statis, 23 halaman editor di-prerender |
| `npm audit --omit=dev` | ✅ 0 kerentanan di dependency produksi |
| Tampilan 1280px | ✅ Sidebar, banner pratinjau, tab status + jumlah, editor Tiptap dengan toolbar, callout catatan, bar aksi menempel di bawah |
| Tampilan 375px | ✅ Tab bar bawah, daftar artikel bertumpuk, login di tengah |

## Masalah yang ditemukan dan diperbaiki

| Masalah | Penyebab | Perbaikan |
|---------|----------|-----------|
| Build gagal di `/dashboard/articles/[id]` | Tiptap memanggil `Math.random()` saat inisialisasi, dan itu dilarang saat prerender dengan Cache Components | Editor dimuat lewat `next/dynamic` dengan `ssr: false` (panduan lazy-loading Next.js), dengan placeholder saat memuat |
| Lint `react-hooks/refs` | Ref dibaca dari closure yang disimpan di array saat render | Tombol "Insert image" diberi handler sendiri lewat komponen `ToolButton` |
| Saran IDE | Penulisan kelas `aspect-[4/3]` | Diganti `aspect-4/3` di seluruh kode |

## Catatan

- **`npm audit` (dev saja):** 5 temuan "high" pada `braces` lewat `eslint-config-next` → `fast-glob`. `npm audit fix --force` akan menurunkan `eslint-config-next` ke versi 14, jadi tidak dijalankan. Tidak ada yang ikut ke produksi. Tunggu pembaruan dari Next.js.
- **Pratinjau:** sidebar selalu menampilkan Rafi untuk halaman author, termasuk saat membuka artikel milik author lain. Pengecekan kepemilikan dikerjakan di Fase 3.
- **Gambar:** sampul dan gambar di editor hanya pratinjau lokal (object URL). Upload sungguhan dikerjakan di Fase 4.

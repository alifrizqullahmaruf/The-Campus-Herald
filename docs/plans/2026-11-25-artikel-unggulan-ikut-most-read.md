# Artikel unggulan beranda memakai angka bacaan yang sama dengan Most read

**Status:** Selesai 2026-11-25 (hari cadangan Fase 4, Rab 25 Nov; tindak lanjut Rendah hari 7).

## Masalah

Beranda memilih artikel unggulan sebagai yang paling banyak dibaca di antara 5 artikel terbaru. Angkanya diambil dari `getPublishedArticles`, yang di-cache `cacheLife("max")` dan hanya diperbarui saat ada artikel disimpan. Most read (`getMostRead`) diperbarui per jam. Akibatnya urutan bacaan di beranda bisa saling bertentangan.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | `getViewCounts()`: angka bacaan artikel terbit per id, `"use cache"`, `cacheLife("hours")`, tag `articles`, hanya kolom `id` dan `view_count` | Claude | `lib/data/articles.ts`, `lib/mock/articles-data.ts` | ✅ |
| 2 | Aturan pilih unggulan sebagai fungsi murni `pickFeature(latest, views)`: yang terbanyak dibaca di antara 5 terbaru, seri → yang lebih baru (sama seperti sort lama) | Claude | `lib/feature.ts` (baru) | ✅ |
| 3 | Beranda memakai keduanya; bagian Cover story tidak tampil kalau belum ada artikel terbit (kode lama akan crash) | Claude | `app/(public)/page.tsx` | ✅ |
| 4 | Unit test `pickFeature` dan `getViewCounts` (mock) | Claude | `__tests__/feature.test.ts` (baru) | ✅ |
| 5 | Verifikasi, `code-reviewer`, `CLAUDE.md` (bagian Reads), plan fase 4, roadmap, commit dan push | Claude | `CLAUDE.md`, plan ini, plan fase 4, roadmap lokal | ✅ |

**Perubahan dari rencana:** test `getViewCounts` ditaruh di `__tests__/feature.test.ts`, bukan `data-articles.test.ts`.

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 263/263 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ `/` tetap ○ dengan revalidate 1 jam |
| `npx playwright test` penuh | ✅ 556 lolos, 0 gagal |
| `code-reviewer` | Tidak ada Kritis, Tinggi atau Sedang |

## Tindak lanjut (Rendah)

- `getViewCounts` dan `getMostRead` punya entri cache 1 jam masing-masing, jadi urutannya bisa berbeda paling lama sekitar 1 jam (dulu bisa tanpa batas). Dicatat di `CLAUDE.md`.
- `getViewCounts` memuat angka semua artikel terbit, padahal beranda hanya butuh 5. Untuk ukuran situs ini tidak masalah; bisa dibatasi kalau artikel sudah ribuan.

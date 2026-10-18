# Plan: Foto sampul sementara dari Picsum

**Tanggal:** 2026-10-18
**Status:** ✅ Selesai dan di-commit (push menyusul atas permintaan user)

## Tujuan

Ke-18 artikel contoh langsung punya foto sampul tanpa Unsplash Access Key, sebagai percobaan. Jalur Unsplash API (`npm run covers`) tetap ada untuk nanti.

## Hasil

| Bagian | Yang dibuat |
|--------|-------------|
| Sumber | [picsum.photos](https://picsum.photos): ±1000 foto Unsplash, tanpa daftar dan tanpa key |
| Pilihan foto | **Dipilih manual** dari lembar kontak 914 foto landscape Picsum, satu per artikel sesuai isinya (mis. jam weker untuk ujian Sabtu pagi, konser untuk music night, sungai untuk riset sungai, piano untuk paduan suara). Daftar id ada di `scripts/fetch-picsum-covers.mjs`; skrip (`npm run covers:picsum`) mengambil nama fotografer + link foto dari `/id/<id>/info` dan menulis `lib/mock/covers.json` |
| Tampil | `PicsumImage` dengan loader khusus: `/id/<id>/<lebar>/<tinggi>.webp`, rasio 4:3, maksimal 1600 px. `isPicsum()` di `lib/images.ts`; `ArticleCover` memilih loader Unsplash / Picsum / biasa |
| Kredit | "Photo: Nama on Unsplash": nama menaut ke halaman foto di Unsplash, "Unsplash" ke `unsplash.com`. Link divalidasi (`unsplash.com`, `https`) di skrip dan di komponen |
| Ganti ke Unsplash API | `npm run covers -- --force` setelah key ada, dan semua 18 entri tertimpa |

### Perbedaan dari rancangan awal

| Rancangan | Yang dikerjakan | Alasan |
|-----------|-----------------|--------|
| Skrip memilih 18 foto otomatis dari `/v2/list`, lalu dikurasi | Foto dipilih manual dari lembar kontak; skrip memakai daftar id tetap | Pilihan otomatis hampir semuanya pemandangan; pilihan manual jauh lebih cocok dengan isi artikel |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi plan | User | – | ✅ |
| 2 | Skrip Picsum + `npm run covers:picsum` | Claude | `scripts/fetch-picsum-covers.mjs` (baru), `package.json` | ✅ |
| 3 | Jalankan skrip, isi `covers.json` | Claude | `lib/mock/covers.json` | ✅ |
| 4 | Loader Picsum + deteksi + pemilihan loader | Claude | `lib/images.ts`, `components/article/picsum-image.tsx` (baru), `components/article/article-cover.tsx` | ✅ |
| 5 | Kurasi foto per artikel | Claude | `scripts/fetch-picsum-covers.mjs` | ✅ |
| 6 | Unit test | Claude | `__tests__/motion-images.test.tsx`, `__tests__/article.test.tsx` | ✅ |
| 7 | Dokumen | Claude | `docs/design.md`, `CLAUDE.md` | ✅ |
| 8 | Verifikasi + `code-reviewer` | Claude | – | ✅ |
| 9 | Commit (push menyusul) | Claude | – | ✅ |

## Review `code-reviewer`

Tidak ada temuan Kritis/Tinggi. Semua temuan diperbaiki:

| Tingkat | Temuan | Perbaikan |
|---------|--------|-----------|
| Sedang | Test mewajibkan data Picsum, sehingga akan gagal begitu `npm run covers -- --force` dipakai | Test render memakai artikel tiruan; data hanya dicek punya kredit ke `unsplash.com` |
| Sedang | Link nama dan "Unsplash" menuju halaman yang sama (dua tab stop tambahan per kartu), berbeda dari plan | "Unsplash" sekarang menaut ke `unsplash.com` |
| Rendah | Test kartu yang dilonggarkan bisa meloloskan link lain | Link selain link artikel harus link kredit ke `unsplash.com` (maksimal 2) |
| Rendah | Plan belum diperbarui | File ini |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 91 lulus (baru: deteksi Picsum + URL loader 4:3 / batas 1600 px, sampul Picsum dan kreditnya, semua foto contoh berkredit; test kartu disesuaikan karena kartu kini punya foto) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 74 lulus, termasuk axe WCAG 2.1 AA (kontras label kredit di atas foto) |
| Tampilan | ✅ Beranda, pencarian (18 kartu), halaman artikel di HP: foto tampil, kredit terbaca |
| Lighthouse mobile beranda | Performance 91–94, a11y 100, LCP 3,1–3,4 s (sama seperti sebelumnya; elemen LCP tetap paragraf intro, bukan foto), TBT 70 ms |

## Tindak lanjut

- Picsum adalah layanan pihak ketiga (redirect ke `fastly.picsum.photos`). Untuk rilis, foto diunggah author (Fase 4) atau diganti foto Unsplash API.
- Fase 2: kolom kredit foto (setara `cover_credit`) perlu masuk skema.

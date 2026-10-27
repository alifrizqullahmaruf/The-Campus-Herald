# Plan: Avatar penulis sesuai nama (perempuan / laki-laki)

**Tanggal:** 2026-10-28
**Status:** ✅ Selesai (menunggu konfirmasi commit)

## Tujuan

Avatar DiceBear Notionists dipilih acak dari nama, tanpa membedakan perempuan dan laki-laki. Akibatnya 4 dari 7 penulis tidak sesuai: Dewi, Nadia, Sekar (perempuan) tampil berambut laki-laki, dan Yoga (laki-laki) berambut sebahu dengan pita.

Keputusan user: avatar **dipilih per orang** (bukan acak per kelompok), dan **sebagian** penulis perempuan boleh berhijab.

## Hasil per penulis

| Penulis | Rambut | Catatan |
|---------|--------|---------|
| Dewi Lestari (Editor) | `variant63` (hijab) | – |
| Nadia Putri | `variant23` (bob sebahu) | – |
| Sekar Ayu | `variant28` (panjang bergelombang) | – |
| Laras Wibowo | Tetap (berkuncir) | – |
| Yoga Firmansyah | `variant34` (pendek) | – |
| Rafi Pratama, Bima Santoso | Tetap | Tidak berubah sama sekali |

- Hanya rambut yang dikunci; wajah, pakaian, dan warna latar tetap dari nama. Ini sudah dicek oleh reviewer: komponen lain tidak berubah.
- Penulis perempuan juga dikunci tanpa janggut (`beardProbability: 0`). Untuk nama-nama sekarang ini belum mengubah apa pun, jadi fungsinya hanya pengaman.
- Tampilan per penulis disimpan di satu daftar kecil `LOOKS` di `lib/avatar.ts`, berdasarkan id penulis. Penulis baru tetap mendapat avatar acak sampai bisa mengunggah foto (Fase 4).

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui pilihan avatar | User | – | ✅ |
| 2 | Tampilan per penulis + dipakai route avatar | Claude | `lib/avatar.ts`, `app/avatars/[id]/route.ts` | ✅ |
| 3 | Unit test: penulis yang dikunci memakai rambutnya, penulis lain tetap konsisten | Claude | `__tests__/motion-images.test.tsx` | ✅ |
| 4 | Verifikasi: unit, lint, build, E2E, cek tampilan halaman Authors; `code-reviewer` sekali | Claude | – | ✅ |
| 5 | Commit + push setelah konfirmasi | Claude | – | Menunggu konfirmasi |

## File yang berubah

- `lib/avatar.ts`: daftar `LOOKS` per id, dan parameter `userId` baru di `avatarSvg`.
- `app/avatars/[id]/route.ts`: meneruskan `user.id` ke `avatarSvg`.
- `__tests__/motion-images.test.tsx`: test baru. Penulis yang dikunci mendapat tampilannya, penulis lain tidak berubah, dan route menyajikan versi yang dikunci.

## Verifikasi

| Cek | Hasil |
|-----|-------|
| Unit, lint, tsc, build | ✅ 94 unit lulus |
| Tampilan halaman Authors | ✅ Nadia bob, Sekar rambut panjang, Yoga rambut pendek, Dewi berhijab; Rafi dan Bima tetap |
| E2E | ✅ 484 lulus, 270 dilewati sesuai ukuran layar. Run pertama terputus di tengah jalan saat sesi berganti, lalu diulang penuh |
| `code-reviewer` | Boleh di-commit, hanya temuan Rendah. Komentar soal `beardProbability` diperjelas sebagai pengaman |

## Tindak lanjut

- **Fase 2 (database):** `LOOKS` dikunci berdasarkan id. Kalau id di database tidak mengikuti urutan data contoh, orang lain bisa mendapat tampilan yang dikunci. Solusinya: cocokkan id dan nama sekaligus, atau pindahkan tampilan ke data seed.
- Opsional: bentuk mulut Nadia diganti menjadi senyum.

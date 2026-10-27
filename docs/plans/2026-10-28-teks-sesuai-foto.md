# Plan: Teks berita disesuaikan dengan fotonya

**Tanggal:** 2026-10-28
**Status:** ✅ Selesai

## Masalah

User merasa foto sampul dan isi berita tidak sesuai. Keputusan user:
- **Fotonya tetap**, teksnya yang disesuaikan.
- **Semua 18** artikel terbit.
- Diubah: **judul, ringkasan, isi, dan kutipan** (pull quote).
- Topic **boleh pindah** kalau foto lebih cocok di topic lain.
- Gaya tetap: berita kampus fiktif berbahasa Inggris, nada pers mahasiswa yang ringan. Penulis dan tanggal tetap, kecuali penulis ikut topic yang berpindah.

Artikel draft, pending, dan rejected (#19–23) tidak punya foto dan tidak diubah.

## Cerita baru per foto

Jumlah per topic tetap seimbang: Academics 4, Organisations 3, Events 4, Opinion 3, Achievements 4.

| # | Isi foto | Judul baru (usulan) | Topic | Penulis |
|---|----------|---------------------|-------|---------|
| 1 | Meja berisi buku catatan, kertas, alat tulis, HP | What's on the desk of the students who top their year | Academics | Rafi |
| 2 | Gedung tinggi, ratusan jendela menyala malam hari | The science building that never turns its lights off | Academics | Rafi |
| 3 | Buku terbuka di atas meja | The library's reading room stays open until midnight | Academics | Rafi |
| 4 | Laptop, buku catatan, pena, kacamata | A first-year guide to registering for courses online | Academics | Rafi |
| 5 | Ruang rapat kosong, meja panjang, kursi putih | The student council finally gets a room of its own | Organisations | Nadia |
| 6 | Mesin tik antik, kertas, buku catatan | The writing club that still drafts on typewriters | Organisations | Nadia |
| 7 | Aula ramai dengan eskalator dan ratusan orang | Open day brings 3,000 visitors through the main hall | **Events** (dari Organisations) | **Bima** |
| 8 | Penonton konser mengangkat tangan di bawah lampu panggung | Campus music night returns to the main field | Events | Bima |
| 9 | Aula besar berjendela tinggi, penuh orang | The career fair filled the great hall. Here's how it went | Events | Bima |
| 10 | Deretan kamera film antik | The photography club puts its vintage cameras on show | **Organisations** (dari Events) | **Nadia** |
| 11 | Kembang api di langit malam | Cultural week ends with fireworks over the lake | Events | Bima |
| 12 | Bar kopi dengan alat seduh manual | The coffee queue is a design problem, not a patience problem | Opinion | Sekar |
| 13 | Dua orang berdiskusi di meja dengan kopi, HP, tablet | Group projects should come with a contract | Opinion | Sekar |
| 14 | Jam weker hitam-putih | Stop scheduling exams on Saturday mornings | Opinion | Sekar |
| 15 | Meja gelap: keyboard, monitor, tablet, gawai | The student who built the campus app from a dorm desk | Achievements | Yoga |
| 16 | Sungai di tengah hutan | Three students win research grants for a river clean-up study | Achievements | Yoga |
| 17 | Penyanyi dan gitaris di panggung dengan sorot lampu | Campus band wins the regional battle of the bands | Achievements | Yoga |
| 18 | Tangan bermain piano (hitam-putih) | Music student's piano recital earns a national scholarship | Achievements | Laras |

Yang tetap: `id`, jumlah pembaca (`viewCount`), tanggal, dan foto (kunci `id` di `covers.json`). Judul baru mengubah slug (URL) artikel.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui daftar cerita (boleh ubah judul atau ide mana pun) | User | – | ✅ |
| 2 | Tulis ulang judul, ringkasan, isi, kutipan; pindahkan #7 dan #10 | Claude | `lib/mock/articles.ts` | ✅ |
| 3 | Samakan keterangan per artikel di skrip foto: komentar Picsum dan kata kunci pencarian Unsplash | Claude | `scripts/fetch-picsum-covers.mjs`, `scripts/fetch-covers.mjs` | ✅ |
| 4 | Sesuaikan test yang memakai judul, slug, atau kata tertentu (antrean kantin → kopi, kebijakan nilai, "robot", judul paduan suara) | Claude | `__tests__/*`, `e2e/*` | ✅ |
| 5 | Cek tampilan: lembar kontak foto + judul baru, beranda, halaman topic | Claude | – | ✅ |
| 6 | Verifikasi: unit, lint, build, E2E, `code-reviewer` sekali | Claude | – | ✅ |
| 7 | Commit + push setelah konfirmasi | Claude | – | ✅ |

## Hasil

- 18 artikel ditulis ulang sesuai fotonya (judul, ringkasan, isi, kutipan); #7 pindah ke Events (Bima), #10 ke Organisations (Nadia). Jumlah per topic dan per penulis tetap konsisten dengan beat-nya.
- Test disesuaikan dengan slug, judul, dan kata cari baru (24 rujukan); setiap kata cari tetap cocok dengan tepat satu artikel. Keterangan per artikel di skrip Picsum dan kata kunci Unsplash diperbarui.
- Lembar kontak judul + foto dicek: semua cocok.

## Verifikasi

| Cek | Hasil |
|-----|-------|
| Unit, lint, tsc, build | ✅ 93 unit lulus |
| E2E | ✅ 484/484 (21 test gagal di run pertama karena server test mati di tengah jalan, `ERR_CONNECTION_REFUSED`; diulang `--last-failed`: 21/21 lulus) |
| `code-reviewer` | OK untuk commit, hanya Rendah. Diperbaiki: bio Sekar ("coffee queues"), kata "coffee" dihapus dari isi #13 (supaya pencarian isi nanti tetap 1 hasil), kalimat #1, #3, #7 diselaraskan |

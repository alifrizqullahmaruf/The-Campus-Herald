# Plan: Gambar placeholder realistis dan animasi sesuai video

**Tanggal dibuat:** 2026-10-16
**Dikerjakan:** 2026-10-17
**Status:** Draft. Belum dikerjakan; riset dan brainstorming dulu besok (A: gambar, B: animasi)

## Latar belakang (permintaan user)

Gambar placeholder sekarang hanya pola bentuk (`components/article/cover-art.tsx`: lingkaran, garis, segitiga) dan kotak inisial. Hasilnya kurang realistis dan tidak berhubungan dengan isi. User ingin:

1. **Gambar untuk artikel (berita):** sesuai teks dan konteks artikel (judul, ringkasan, kategori). Misalnya artikel tentang antrean kantin menampilkan foto kantin.
2. **Gambar profil penulis:** lebih realistis daripada kotak inisial.

Tujuannya: cari library atau layanan yang bisa menyesuaikan gambar dengan teks dan konteks, bukan sekadar bentuk.

3. **Animasi:** animasi sekarang belum cocok dengan gaya di video template "Crumpet Riot" (`resource_private/record.m4.mp4`). Lihat bagian **B. Animasi** di bawah.

---

# A. Gambar placeholder

## Kandidat yang akan diriset besok

Semua kandidat di bawah **belum diverifikasi**. Syarat, harga, dan lisensinya dicek ulang besok.

### Gambar artikel

| Kandidat | Cara kerja | Plus | Minus / yang perlu dicek |
|----------|-----------|------|--------------------------|
| Unsplash API | Cari foto dengan kata kunci dari judul/kategori | Foto berkualitas tinggi, gratis | Butuh API key, wajib atribusi fotografer, aturan hotlink, batas request |
| Pexels API | Sama, kata kunci → foto | Gratis, lisensi longgar | API key, batas request, hasil kata kunci bisa meleset |
| Pixabay API | Sama | Gratis | API key, kualitas bervariasi |
| Gambar AI per artikel | Prompt dibuat dari judul + ringkasan | Paling sesuai isi, bisa dibuat seragam dengan gaya desain | Berbayar, perlu dibuat sekali lalu disimpan (bukan setiap kunjungan), harus diberi label gambar AI |
| Foto lokal yang dikurasi | Pilih 15–20 foto bebas lisensi secara manual, simpan di repo | Paling cepat, tanpa API, tanpa risiko | Tidak otomatis, perlu dipilih manual |

### Gambar profil penulis

| Kandidat | Cara kerja | Plus | Minus / yang perlu dicek |
|----------|-----------|------|--------------------------|
| DiceBear | Avatar ilustrasi dari nama (gaya "notionists", "lorelei", "personas", dll.) | Konsisten, gratis, bisa dibuat di server tanpa API eksternal | Ilustrasi, bukan foto |
| Foto stok wajah (Unsplash/Pexels) | Foto orang sungguhan | Realistis | Etika: wajah orang sungguhan dipasang di profil fiktif |
| Wajah buatan AI | Wajah yang tidak ada di dunia nyata | Realistis, tanpa wajah orang sungguhan | Sumber dan lisensi perlu dicek, perlu diberi label |
| Unggah foto oleh author | Fitur Fase 4 (upload) | Foto asli penulis | Belum ada sampai ada database dan penyimpanan |

## Hal yang harus dijaga

- **NFR performa:** halaman di bawah 3 detik di HP. LCP beranda sudah 3,1 s, jadi foto besar bisa memperburuknya. Wajib `next/image`, ukuran responsif, dan lazy load.
- **Lisensi dan atribusi:** sumber dan fotografer ditampilkan kalau diwajibkan.
- **Data contoh vs data asli:** di Fase 1 gambar hanya untuk data contoh. Di Fase 4, author mengunggah sampul sendiri lewat editor (`coverImage`). Pilihan sekarang jangan sampai menyulitkan Fase 4.
- **Konfigurasi:** domain gambar eksternal perlu `images.remotePatterns` di `next.config.ts`.
- **Desain:** foto tetap dibingkai (border ink, radius) sesuai design.md. Gaya warna kategori tetap terlihat.
- **API key:** disimpan di `.env.local` (sudah di-ignore git) dan di Environment Variables Vercel. Jangan di kode.

## Tugas A (draf, dikonfirmasi besok)

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Riset kandidat: syarat, harga, lisensi, batas request, contoh hasil untuk 3 judul artikel contoh | Claude | – | Belum |
| 2 | Brainstorming dan pilih pendekatan (artikel + profil) | User + Claude | – | Belum |
| 3 | Kalau perlu API: buat akun dan API key | User | `.env.local` | Belum |
| 4 | Implementasi: isi `coverImage` data contoh dan foto profil, `remotePatterns`, atribusi | Claude | `lib/mock/*`, `next.config.ts`, komponen kartu / author | Belum |
| 5 | Ganti kotak inisial dengan gambar profil (inisial tetap jadi cadangan) | Claude | `components/author/*`, `components/article/author-box.tsx` | Belum |
| 6 | Verifikasi: test, lint, build, E2E, Lighthouse (LCP), cek tampilan | Claude | – | Belum |
| 7 | Commit + push setelah konfirmasi | Claude | – | Belum |

## Pertanyaan A

1. Lebih suka gambar yang **otomatis** (API, berdasarkan judul) atau **dikurasi manual** (lebih terkontrol)?
2. Untuk profil: ilustrasi (DiceBear), foto, atau wajah AI?
3. Boleh pakai layanan berbayar (gambar AI) atau harus gratis?

---

# B. Animasi sesuai video template

## Masalah

Animasi sekarang hanya CSS sederhana:
- kartu terangkat dan miring −1° saat hover
- tombol tertekan saat diklik
- kartu author dibalik saat hover
- teks berjalan (marquee)
- modal pencarian muncul memudar

Di video, gerakannya jauh lebih hidup dan "fisik". Selain itu, design.md 2.5 sengaja melarang drag dan efek fisika di v1 demi performa. Keputusan itu perlu ditinjau ulang bersama user.

## Yang terlihat di video (sementara, dari frame tiap 6 detik)

| Bagian | Gerakan di video | Kondisi sekarang |
|--------|------------------|------------------|
| Hero | Kartu artikel dan stiker berserakan miring, bisa di-drag dan dilempar (efek fisika) | Satu kartu miring statis + satu stiker |
| Pill kategori | Baris pill bisa di-drag ("Grab a row and drag it") | Statis |
| Kartu artikel | Saat hover kartu "terangkat": miring lebih besar, bayangan membesar, terasa seperti pegas | Terangkat 2px, miring −1°, linear 150ms |
| Pencarian | Kartu menumpuk seperti "pile"; saat difilter, kartu yang cocok terangkat dan menonjol | Kartu yang tidak cocok memudar (tanpa gerakan posisi) |
| Kartu penulis | Dibalik | Sudah ada (dibalik) |
| Footer | Pill tautan bisa di-drag ("Drag the links, they're real") | Statis |
| Pindah halaman | Ada frame yang tampak memudar dan bertumpuk, kemungkinan transisi antar halaman | Tidak ada transisi |

Tabel ini masih kasar. Detailnya (durasi, easing, pegas) diukur besok dari video dengan frame yang lebih rapat.

## Kandidat yang akan diriset besok

Semua kandidat di bawah **belum diverifikasi**. Ukuran bundle dan lisensinya dicek ulang besok.

| Kandidat | Cocok untuk | Yang perlu dicek |
|----------|-------------|------------------|
| Motion (dulu Framer Motion) | Pegas, drag, animasi layout (kartu menyusun ulang saat filter), animasi masuk/keluar | Ukuran bundle, dukungan React 19 |
| GSAP + Draggable / Inertia | Drag dan lempar, timeline yang presisi | Lisensi terbaru, ukuran bundle |
| Matter.js (atau mesin fisika lain) | Tumpukan kartu dengan fisika sungguhan di hero / pencarian | Berat di HP, aksesibilitas |
| View Transitions (React + Next.js 16) | Transisi antar halaman, kartu "terbang" ke halaman artikel | Panduan bawaan: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`; dukungan browser |
| CSS saja (`@starting-style`, animasi scroll-driven, `linear()` untuk efek pegas) | Hover yang lebih hidup tanpa library | Dukungan browser, tidak bisa drag |

## Hal yang harus dijaga

- **Performa:** NFR di bawah 3 detik. LCP beranda sudah 3,1 s, jadi library animasi jangan memperberat muatan awal. Muat hanya di komponen yang memakainya (client island, dynamic import). Pantau TBT di Lighthouse.
- **Aksesibilitas:** semua gerakan mati saat `prefers-reduced-motion`. Drag harus opsional: semua tautan tetap bisa diklik dan dipakai dengan keyboard. Tidak ada yang bergerak terus-menerus tanpa bisa dihentikan (marquee sudah berhenti saat hover).
- **Sentuhan di HP:** drag jangan mengganggu scroll halaman.
- **Cache Components:** komponen animasi adalah client component. Server component dan prerender tetap seperti sekarang.
- **design.md:** bagian 2.5 (Motion) dan 5 (Not taken from the template) diperbarui sesuai keputusan.

## Tugas B (draf, dikonfirmasi besok)

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Analisis video lebih rapat (frame tiap 0,2–0,5 detik di bagian yang ada interaksi): catat pemicu, durasi, easing, dan rasa pegas tiap animasi | Claude | – (scratchpad) | Belum |
| 2 | Bandingkan dengan animasi sekarang, buat daftar prioritas | Claude | file ini | Belum |
| 3 | Brainstorming: animasi mana yang wajib, apakah drag/fisika boleh, library apa | User + Claude | – | Belum |
| 4 | Riset library (ukuran bundle, dukungan React 19 / Next 16, lisensi), uji coba kecil | Claude | – | Belum |
| 5 | Perbarui design.md 2.5 dan 5 | Claude | `docs/design.md` | Belum |
| 6 | Implementasi per komponen (hero, kartu, pill, pencarian, footer, transisi halaman) | Claude | `components/**`, `app/(public)/**` | Belum |
| 7 | Verifikasi: test, lint, build, E2E, reduced motion, Lighthouse (LCP + TBT), cek di HP | Claude | – | Belum |
| 8 | Commit + push setelah konfirmasi | Claude | – | Belum |

## Pertanyaan B

1. Animasi mana yang paling penting buatmu: hero yang bisa di-drag, kartu yang "terangkat" lebih hidup, pencarian berbentuk tumpukan, footer yang bisa di-drag, atau transisi antar halaman?
2. Boleh menambah library animasi (menambah ukuran halaman), atau sebisa mungkin CSS saja?
3. Di HP: animasinya sama dengan desktop, atau dibuat lebih ringan?

# Plan: Gambar placeholder realistis dan animasi sesuai video

**Tanggal dibuat:** 2026-10-16
**Dikerjakan:** 2026-10-17
**Status:** ✅ Dikerjakan, diverifikasi, dan di-push (2026-10-17). Menunggu: Unsplash Access Key (foto artikel)

## Latar belakang (permintaan user)

Gambar placeholder sekarang hanya pola bentuk (`components/article/cover-art.tsx`: lingkaran, garis, segitiga) dan kotak inisial. Hasilnya kurang realistis dan tidak berhubungan dengan isi. User ingin:

1. **Gambar untuk artikel (berita):** sesuai teks dan konteks artikel (judul, ringkasan, kategori). Misalnya artikel tentang antrean kantin menampilkan foto kantin.
2. **Gambar profil penulis:** lebih realistis daripada kotak inisial.

Tujuannya: cari library atau layanan yang bisa menyesuaikan gambar dengan teks dan konteks, bukan sekadar bentuk.

3. **Animasi:** animasi sekarang belum cocok dengan gaya di video template "Crumpet Riot" (`resource_private/record.m4.mp4`). Lihat bagian **B. Animasi** di bawah.

---

## Keputusan (2026-10-17)

| Topik | Keputusan | Dasar riset |
|-------|-----------|-------------|
| Foto artikel | **Unsplash API**, lewat script sekali jalan: cari foto per artikel dari kata kunci, simpan URL + nama fotografer di data contoh. Kredit fotografer + Unsplash ditampilkan | Unsplash mewajibkan atribusi dan memakai URL foto langsung (hotlink); request ke images.unsplash.com tidak dihitung rate limit |
| Foto profil | **DiceBear Notionists**: ilustrasi wajah garis tangan, dibuat di server dari nama penulis | Lisensi CC0 (tanpa kredit); kode DiceBear MIT |
| Logo GIF | **Dibuat ulang dengan CSS** di logo SVG: sticky note bergoyang dan sudutnya terangkat. GIF (2,2 MB) dipindah ke `docs/brand/` | GIF terlalu berat dan buram di ukuran kecil |
| Transisi halaman | Kandidat utama: `<ViewTransition>` bawaan React 19.3 (panduan Next.js `view-transitions.md`), tanpa library | Didukung App Router tanpa konfigurasi |
| Library animasi | Motion: `motion` 43 KB; `LazyMotion` + `m` ±5 KB; `domAnimation` +24 KB; `domMax` +38 KB (wajib untuk drag/layout). Diputuskan setelah analisis video | Dokumentasi motion.dev |

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

## Tugas A

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Riset kandidat | Claude | – | ✅ |
| 2 | Pilih pendekatan | User | – | ✅ Unsplash + DiceBear Notionists |
| 3 | Buat akun Unsplash Developer, aplikasi baru, salin **Access Key** ke `.env.local` sebagai `UNSPLASH_ACCESS_KEY=...` | User | `.env.local` | Menunggu user |
| 4 | Pasang `@dicebear/core@^9.4` + `@dicebear/notionists@^9.4` (versi 9 berpasangan; `core` 10 belum didukung koleksi gaya) | Claude | `package.json` | ✅ |
| 5 | Avatar Notionists dari nama penulis (dibuat di server, latar warna topic utama), dipakai di kartu penulis, halaman penulis, kotak author artikel, sidebar dashboard, kelola author. Inisial tetap jadi cadangan | Claude | `lib/avatar.ts`, `components/author/*`, `components/article/author-box.tsx`, `components/dashboard/*` | ✅ |
| 6 | Script `npm run covers`: untuk tiap artikel contoh, cari foto Unsplash dari kata kunci (ditulis per artikel, mis. "university canteen queue"), panggil `download_location` sesuai panduan Unsplash, simpan URL + fotografer + link profil ke `lib/mock/covers.json`. Dijalankan sekali, bukan setiap kunjungan | Claude | `scripts/fetch-covers.mjs`, `lib/mock/covers.json`, `lib/mock/articles.ts` | ✅ siap (belum dijalankan: menunggu key) |
| 7 | Tampilkan foto lewat `next/image` (`images.remotePatterns` untuk `images.unsplash.com`), dengan kredit "Photo: Nama / Unsplash" (tautan dengan parameter UTM) di sampul artikel dan kartu. Pola SVG tetap jadi cadangan bila foto tidak ada | Claude | `next.config.ts`, `components/article/article-cover.tsx`, `lib/types.ts` | ✅ |
| 8 | Test dan verifikasi (termasuk Lighthouse: foto tidak boleh memperlambat LCP) | Claude | `__tests__/*`, `e2e/*` | ✅ |

## Pertanyaan A

Semua sudah dijawab (lihat Keputusan).

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

## Hasil analisis video (2026-10-17)

Frame dianalisis rapat (5–10 fps di bagian bergerak). 16 animasi ditemukan. Yang paling menentukan karakter template:

| # | Animasi | Pemicu | Gerakan | Durasi / easing |
|---|---------|--------|---------|-----------------|
| 1 | Kartu hero jatuh dan menumpuk | Halaman dibuka | Kartu jatuh dari atas, berputar ±15–25°, bertabrakan, menumpuk di atas judul; stiker menyusul | ±2–2,5 s, gravitasi + pantulan kecil, jeda antar kartu ±100–150 ms |
| 2 | Kartu hero dilempar | Drag | Diangkat dan dilempar, tetap meluncur dan berputar setelah dilepas | Fisika / inersia |
| 3 | Tumpukan jadi grid | Scroll (mengikuti posisi scroll) | ±18 kartu miring terbang ke grid, rotasi ±10–20° → 0, bisa dibalik saat scroll ke atas | ±1–1,5 tinggi layar |
| 4 | Pill footer jatuh ke wordmark | Masuk layar, lalu drag | Pill navigasi jatuh ke atas huruf raksasa, sebagian menggelinding ke bawah | ±1,5–2 s, gravitasi + pantulan |
| 5 | Hover lift | Hover | Naik dan geser kiri 4–6 px, bayangan membesar, miring 1–3° | ≤150–200 ms, ease-out |
| 6 | Hero miring saat di-scroll | Scroll | Blok judul + ticker berputar 6–10° dan naik | Mengikuti scroll |
| 7 | Baris pill topic | Diam + drag | Baris bergeser pelan berlawanan arah (±30–50 px/s), bisa di-drag dengan momentum | Linear, loop |
| 8 | Judul hero | Halaman dibuka | Tiap baris naik dari balik masker | 200–300 ms, ease-out, jeda ±80–100 ms |
| 9 | Pindah halaman | Navigasi | Crossfade biasa | 150–250 ms |
| 10 | Most read | Hover | Baris terangkat, nomor besar muncul miring | ±150 ms |

Karakter gerak: cepat dan tegas (150–200 ms). Benda diam dalam keadaan sedikit miring. Pantulan hanya ada di fisika.

## Keputusan B

| Topik | Keputusan |
|-------|-----------|
| Level | **Level 3 (fisika)**, termasuk Level 1 dan 2 sebagai dasarnya (lihat Pertanyaan B1) |
| HP | **Sama dengan desktop**: fisika dan drag juga jalan di HP |
| Engine fisika | **Matter.js 0.20** (MIT, ±81 KB minified / ±25 KB gzip, tanpa dependency) |
| Library animasi lain | **Tidak perlu Motion**. Tumpukan → grid dan hero miring dibuat dengan CSS scroll-driven animation; drag pill dengan pointer events; crossfade halaman dengan `<ViewTransition>` React 19.3 |

## Rancangan teknis

- **Kartu tetap HTML asli** (tautan yang bisa diklik dan di-tab), bukan canvas. Matter.js hanya menghitung posisi; tiap frame posisinya ditulis ke `transform` elemen. Tidak ada React re-render per frame.
- **Tidak menunda halaman:** saat pertama tampil, kartu sudah berada dalam tumpukan miring statis (dari server, tanpa layout shift). Matter.js baru dimuat (`import()` dinamis) setelah halaman siap dan bagiannya terlihat. Lalu kartu diangkat ke atas dan dijatuhkan.
- **Drag sendiri, bukan MouseConstraint bawaan Matter.js** (yang memblokir scroll di HP): `pointerdown` di kartu membuat constraint ke pointer. `touch-action: none` hanya di kartu, jadi scroll di luar kartu tetap normal. Gerakan < 5 px dihitung sebagai klik (tautan terbuka); lebih dari itu dihitung drag (klik dibatalkan).
- **Rintangan:** baris judul hero dan huruf wordmark footer jadi badan statis, sehingga kartu dan pill bisa "menumpuk di atas" teks.
- **Hemat:** simulasi berhenti saat bagian tidak terlihat (IntersectionObserver) atau tab disembunyikan. Dibangun ulang saat lebar layar berubah.
- **Reduced motion / tanpa JS:** tetap tumpukan statis; tidak ada animasi.
- **Logo:** sticky note bergoyang dan sudutnya terangkat (dari GIF), dengan CSS: sekali saat halaman dibuka dan saat hover.

## Tugas B

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Analisis video rapat | Claude | – | ✅ |
| 2 | Brainstorming dan keputusan | User + Claude | – | ✅ (B1 dikonfirmasi) |
| 3 | Pasang `matter-js` + `@types/matter-js` | Claude | `package.json` | ✅ |
| 4 | Mesin tumpukan fisika: `PhysicsPile` (client) + helper murni (tata letak awal, ambang klik/drag) | Claude | `components/physics/*`, `lib/physics/*` | ✅ |
| 5 | Hero baru: judul per baris (masker), 6 kartu artikel terbaru + stiker jatuh dan menumpuk di atas judul, bisa dilempar; hero miring saat di-scroll | Claude | `app/(public)/page.tsx`, `components/home/*` | ✅ |
| 6 | Footer: pill navigasi jatuh ke wordmark "SIDE NOTES" saat terlihat, bisa di-drag; catatan "Drag the links, they're real." | Claude | `components/layout/site-footer.tsx` | ✅ |
| 7 | Baris pill topic bergeser pelan berlawanan arah + drag dengan momentum, berhenti saat hover/fokus | Claude | `components/home/topic-rows.tsx` | ✅ |
| 8 | "Fresh off the notebook": tumpukan miring → grid mengikuti scroll (CSS scroll-driven; browser lama langsung grid) | Claude | `app/(public)/page.tsx`, `app/globals.css` | ✅ |
| 9 | Hover lift lebih kuat (4–6 px, miring 1–3°, bayangan membesar), nomor Most read "pop", filter pencarian: yang cocok terangkat | Claude | `components/ui/card.tsx`, `components/article/*`, `components/search/*` | ✅ |
| 10 | Crossfade antar halaman dengan `<ViewTransition>` | Claude | `app/(public)/layout.tsx`, `app/globals.css` | ✅ |
| 11 | Logo bergoyang (CSS); pindahkan GIF ke `docs/brand/` | Claude | `components/layout/logo-mark.tsx`, `app/globals.css` | ✅ |
| 12 | Perbarui design.md 2.5 dan 5 (drag/fisika sekarang dipakai) | Claude | `docs/design.md` | ✅ |
| 13 | Test: helper fisika (unit), E2E (kartu hero tetap bisa diklik, drag tidak membuka tautan, reduced motion statis, tanpa error konsol, tanpa scroll horizontal di HP), Lighthouse (LCP + TBT) | Claude | `__tests__/*`, `e2e/*` | ✅ |
| 14 | Commit + push | Claude | – | ✅ |

## Pertanyaan B

1. ~~Level 3 dipilih sendirian~~ Dijawab: **ya, semua level** (1 + 2 + 3).

---

# Hasil

## Perbedaan dari plan

| Hal | Detail |
|-----|--------|
| DiceBear | `@dicebear/core` dipasang di versi **9.4** karena koleksi gaya 9.x belum mendukung core 10. Hanya gaya `notionists` yang dipasang, bukan seluruh koleksi |
| Avatar | Disajikan sebagai file SVG statis (`/avatars/[id]`, prerender) dan bukan data URI: satu avatar ±13–18 KB, kalau di-inline akan memperberat HTML |
| Foto Unsplash | Kode, skrip, dan kredit fotografer sudah siap dan dites. Foto belum diambil karena Access Key belum ada; sampai itu, sampul memakai pola grafis |
| Next image | Foto Unsplash memakai **loader khusus** (parameter ukuran milik Unsplash), bukan optimiser Next, sesuai aturan hotlink Unsplash. `remotePatterns` jadi tidak perlu |
| Hero | 6 kartu + 2 stiker di desktop; **4 kartu + 2 stiker di HP** supaya tumpukan muat di atas judul |
| Motion (library) | Tidak dipakai. Selain Matter.js, semua gerakan memakai CSS / pointer events / `<ViewTransition>` |

## File yang berubah

| Bagian | File |
|--------|------|
| Fisika | `components/physics/physics-pile.tsx` (baru), `lib/motion.ts` (baru), aturan `[data-physics]` di `app/globals.css` |
| Beranda | `app/(public)/page.tsx` (hero fisika, baris topic, grid bertumpuk), `components/home/hero-note-card.tsx`, `components/home/topic-rows.tsx` (baru) |
| Footer | `components/layout/site-footer.tsx` (pill jatuh ke wordmark) |
| CSS gerak | `app/globals.css`: logo bergoyang, judul per baris, hero miring saat scroll, tumpukan → grid, crossfade halaman |
| Hover | `components/ui/card.tsx`, `components/article/article-row.tsx`, `components/search/search-explorer.tsx` |
| Transisi halaman | `app/(public)/layout.tsx` (`<ViewTransition>`), `components/layout/site-header.tsx` (header tidak ikut bergerak) |
| Logo | `lib/brand-mark.ts` (kelas `mark-note` / `mark-fold`), `components/layout/logo.tsx`, `components/dashboard/sidebar.tsx`; GIF dipindah ke `docs/brand/side-notes-logo-animated.gif` |
| Avatar | `lib/avatar.ts`, `lib/avatar-src.ts`, `app/avatars/[id]/route.ts`, `components/author/avatar.tsx` (baru); dipakai di kartu penulis, halaman penulis, kotak author, sidebar, kelola author |
| Foto | `scripts/fetch-covers.mjs`, `lib/mock/covers.json`, `lib/images.ts`, `components/article/unsplash-image.tsx` (baru), `components/article/article-cover.tsx`, `lib/types.ts` (`coverCredit`), `lib/categories.ts` (`hex`) |
| Paket | `matter-js`, `@types/matter-js`, `@dicebear/core`, `@dicebear/notionists`; skrip `npm run covers` |
| Test | `__tests__/motion-images.test.tsx`, `e2e/motion.spec.ts` (baru), test lain disesuaikan |
| Dokumen | `docs/design.md` (2.5 Motion, Images, bagian 5), `CLAUDE.md` |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 86 lulus (9 baru: ambang drag, offset loop, acak tetap, tumpukan statis + daftar bernama, avatar konsisten + route SVG/404, deteksi Unsplash, kredit fotografer + hotlink, cadangan tanpa foto) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 70 lulus, stabil 2× (6 baru: kartu hero bisa diklik, drag tidak membuka tautan dan memindahkan kartu, baris topic bisa di-drag tanpa membuka tautan, pill footer jatuh lalu tetap bisa diklik, avatar SVG 200, reduced motion statis) + semua halaman lolos axe WCAG 2.1 AA |
| `npm audit --omit=dev` | ✅ 0 kerentanan |
| Tampilan (Playwright + Edge) | ✅ Hero: kartu jatuh, berputar, menumpuk di judul; HP: 4 kartu muat; footer: pill di atas "SIDE NOTES"; baris topic bergeser; grid "Fresh" bertumpuk lalu tersusun; reduced motion: tumpukan statis; avatar di kartu dan halaman penulis |
| Lighthouse mobile | Beranda: performance 91, a11y/BP/SEO 100, LCP 3,4 s, TBT 90 ms. Artikel: 93, LCP 2,9 s. Authors: 92, LCP 3,3 s. TBT tetap rendah (Matter.js tidak memblokir). LCP ditentukan *render delay* (86%) menunggu font Archivo + CSS, bukan oleh animasi; elemen LCP beranda adalah paragraf intro yang tidak dianimasikan |

## Masalah yang ditemukan dan diperbaiki

| Masalah | Perbaikan |
|---------|-----------|
| Tumpukan hero di HP terlalu tinggi, kartu teratas tertutup header | 2 kartu disembunyikan di HP (`max-sm:hidden`); item tersembunyi tidak ikut simulasi |
| Baris pill terpotong di tepi kontainer | Baris dibuat selebar layar |
| Loop baris pill meleset (dua salinan beda lebar) | Tiap salinan diakhiri jarak yang sama (`pr-4`) |
| HTML tidak valid (`ul` berisi judul) | Kontainer tumpukan selalu `div`; item dibungkus `ul` dengan `display: contents` |
| jsdom tanpa `matchMedia` / `IntersectionObserver` | Penjaga `canAnimate()`: tanpa API itu, tumpukan tetap statis |
| axe: kontras nama penulis di kartu hero (`opacity-80`) | Opacity dihapus; pola sama di palet pencarian ikut diperbaiki |
| `@dicebear/notionists` tidak punya ekspor bernama `notionists` | `import * as notionists` |

## Tindak lanjut

- **User: Unsplash Access Key** di `.env.local` (`UNSPLASH_ACCESS_KEY=...`), lalu `npm run covers` (saya jalankan, cek hasil, test ulang, commit).
- **Keputusan font (LCP 3,3–3,4 s, target < 3 s):** subset Archivo atau `display: "optional"` (design.md bagian 9).
- **Fase 2:** kolom `cover_credit` (atau setara) perlu masuk skema untuk foto stok.

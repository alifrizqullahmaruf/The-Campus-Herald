# Plan: Animasi masuk untuk komponen About dan bagian Most read

**Tanggal:** 2026-11-01
**Status:** ✅ Selesai, terverifikasi, di-commit (push ditunda atas permintaan user)

## Tujuan

"This week · Most read." dan sebagian besar komponen `/about` belum beranimasi:

- Judul bagian (h2), tag kuning (eyebrow), paragraf, bingkai ilustrasi, dan kartu angka diam. Ini sesuai desain awal: `SectionHeader` sengaja membuat judul bagian diam.
- Baris Most read sudah naik saat di-scroll, tapi terlalu halus (24 px, 0–2°).

**Keputusan user:**

- Yang diberi animasi: judul bagian, eyebrow, paragraf dan bingkai ilustrasi, kartu angka.
- Cakupan: About dan Most read saja.
- Baris Most read dibuat lebih terasa.

**Aturan:**

- CSS saja, tanpa `opacity`.
- Mati saat gerak dikurangi. Tanpa scroll-driven animation atau tanpa JS, semuanya di posisi akhir.
- **Setiap elemen sudah diam begitu terlihat utuh:** rentang `entry 0% → entry 100%` milik elemen itu sendiri, jadi judul tidak pernah terpotong setengah saat terlihat penuh.
- Kepala About (terlihat sejak awal) beranimasi saat dimuat.

## Hasil

| Bagian | Gerak | Kapan |
|--------|-------|-------|
| Eyebrow (`reveal-pop`) | Dari `scale .6, rotate 8deg` ke kemiringan diamnya (-3°) | Saat terlihat; kepala About saat dimuat (setelah judul); sidebar topic dari `lg` saat dimuat |
| Judul h2 (`RiseText on="scroll"`, `reveal-mask` + `reveal-word`) | Kata naik dari masker, bergantian per baris; tiap masker punya view timeline sendiri (`--word`) | Saat baris kata terlihat utuh; sidebar topic dari `lg` saat dimuat |
| Paragraf (`reveal-rise`) | Naik 32 px | Saat terlihat; teks samping kepala About saat dimuat |
| Bingkai ilustrasi (`reveal-tilt`) | Dari -8°, 40 px lebih rendah ke -2° | Saat terlihat |
| Kartu angka | Tumpukan → grid (`pile-card`), berakhir miring ±1° (`pile-to-grid` tanpa `to`) | Mengikuti scroll (rentang `pile-card` yang sudah ada) |
| Baris Most read | Naik 48 px (dulu 24 px), miring ±5° (dulu ±3°) | Seperti sebelumnya |

Halaman lain tidak berubah. `SectionHeader` dan `Eyebrow` hanya beranimasi dengan prop `reveal`.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | CSS: `reveal-pop`, kata judul scroll, `reveal-rise`, `reveal-tilt`, varian load/load-lg, `pile-to-grid` tanpa `to`, `row-rise` 48 px | Claude | `app/globals.css` | ✅ |
| 3 | `RiseText on`, `Eyebrow reveal`, `SectionHeader reveal`, `riseStyle` ±5° | Claude | `components/ui/rise-text.tsx`, `components/ui/eyebrow.tsx`, `components/layout/section-header.tsx`, `lib/motion.ts` | ✅ |
| 4 | Terapkan di About dan Most read | Claude | `app/(public)/about/page.tsx`, `components/article/most-read.tsx` | ✅ |
| 5 | Test unit dan E2E | Claude | `__tests__/motion-images.test.tsx`, `e2e/motion.spec.ts` | ✅ |
| 6 | Dokumentasi | Claude | `docs/design.md`, `CLAUDE.md` | ✅ |
| 7 | Verifikasi, `code-reviewer` sekali, perbaikan temuan | Claude | `app/(public)/about/page.tsx`, `e2e/motion.spec.ts` | ✅ |
| 8 | Commit setelah konfirmasi (push ditunda atas permintaan user) | User / Claude | – | ✅ Commit; push menunggu |

## Perubahan dari plan

- **Dari review (`code-reviewer`: 1 Sedang, 2 Rendah; tidak ada Kritis/Tinggi):**
  - **Sedang, diperbaiki:**
    - **Masalah:** bingkai ilustrasi yang masih menunggu miring -8° di bawah layar membuat halaman About melebar 1–7 px di 500–767 px. Ini terukur pada layar setinggi 560 px; pada layar 850 px bingkai sudah sebagian terlihat saat dimuat, jadi tidak muncul.
    - **Perbaikan:** `overflow-x-clip` pada pembungkus bagian itu. Ini bukan scroll container, jadi animasi tetap mengikuti scroll halaman.
    - **Hasil:** sesudahnya 0 px di semua lebar. Test regresi baru di 639×560.
  - **Rendah, diterima:** kartu angka memakai rentang `pile-card` biasa (`entry 10% cover 40%`), jadi bisa masih menumpuk saat sudah terlihat. Ini sama dengan kartu langkah dan grid lain, dan sesuai pilihan "tersusun dari tumpukan".
  - **Rendah, diperbaiki:** test E2E angka sekarang memastikan ada 4 kata judul, supaya tidak lolos tanpa memeriksa apa pun.
- **Lingkungan test:** Edge yang crash sejak 2026-10-31 sudah pulih setelah ter-update ke 156.0.4314.58. E2E akhir memakai `npm run test:e2e` biasa.

## File yang berubah

- `app/globals.css`:
  - `eyebrow-pop`, `text-rise`, `frame-tilt`.
  - Utility `reveal-pop`, `reveal-rise`, `reveal-tilt`, `reveal-mask`, `reveal-word`.
  - Varian `data-reveal="load"` / `"load-lg"`.
  - `pile-to-grid` tanpa `to`; `row-rise` 48 px.
- `components/ui/rise-text.tsx` (`on`), `components/ui/eyebrow.tsx` (`reveal`), `components/layout/section-header.tsx` (`reveal`), `lib/motion.ts` (`riseStyle` ±5°).
- `app/(public)/about/page.tsx`: kepala, "Why we built it" (eyebrow, judul, paragraf, bingkai + `overflow-x-clip`), workflow, angka (eyebrow, judul, kartu `pile-card`), "Meet the authors.".
- `components/article/most-read.tsx`: eyebrow dan judul beranimasi (`load-lg` di sidebar topic).
- `__tests__/motion-images.test.tsx`: `RiseText on="scroll"`, `Eyebrow reveal`, `riseStyle` ±5°.
- `e2e/motion.spec.ts`:
  - Aturan "diam saat terlihat utuh" sepanjang scroll di 375 dan 1280 px (About dan beranda).
  - Kepala About saat dimuat, kartu angka miring ±1°.
  - Bingkai tidak melebarkan halaman.
  - Gerak dikurangi tanpa animasi.
- `docs/design.md` (baris "Section entrance", Row rise, Count up), `CLAUDE.md` (Motion).

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 101/101 |
| `npm run lint`, `npx tsc --noEmit` | ✅ |
| `npm run build` | ✅ tanpa peringatan |
| `npm run test:e2e` (Edge), sebelum perbaikan review | ✅ 498 lolos, 0 gagal (494 + 4 test baru) |
| `npm run test:e2e` sesudah perbaikan review | ✅ 498 lolos; 1 gagal di test regresi baru karena asumsi test-nya (di 639×560 bingkai sudah sebagian terlihat, jadi tidak di pose -8°). Test diganti ke 639×400; `motion.spec.ts` lalu 54/54 (2× berulang) |
| Aturan "terlihat utuh ⇒ diam" (skrip ukur, saat dimuat dan sepanjang scroll) | ✅ About di 375×812, 412×700, 639×560, 768×1024, 1280×800, 1440×900; beranda dan topic di 375/1280: tidak ada potongan yang terlihat utuh tapi belum diam |
| Overflow horizontal About (375–767 px, layar 560 dan 850 px) | ✅ 0 px sesudah perbaikan (sebelumnya sampai 7 px di layar pendek) |
| Sweep About dan beranda (375, 1280 px) | ✅ CLS 0, tanpa overflow, animasi macet, atau console error |
| Gerak dikurangi | ✅ tanpa animasi |
| `code-reviewer` | 1 Sedang diperbaiki, 2 Rendah ditangani |

## Tindak lanjut

- Halaman lain (beranda, topic, Categories, dan lain-lain) tetap tanpa animasi judul bagian, sesuai keputusan cakupan. Kalau nanti ingin konsisten, cukup pasang `SectionHeader reveal` / `Eyebrow reveal`.

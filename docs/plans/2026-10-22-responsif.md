# Plan: Tampilan responsif (publik + dashboard)

**Tanggal:** 2026-10-22
**Status:** Tahap 1 selesai (`a2ac2f0`). Tahap 2 selesai dan di-commit atas permintaan user sebelum review `code-reviewer` selesai; temuan review ditindaklanjuti di commit berikutnya. Berikutnya: upgrade Next.js 16.4.0 → 16.4.2 (keamanan, plan terpisah), lalu Tahap 3

## Context

User meminta **cek menyeluruh** tampilan responsif sebelum deploy dan demo. Belum ada masalah khusus yang dilaporkan. Ukuran yang wajib rapi: **HP kecil 320–375 px, tablet 768–1024 px, layar lebar 1440 px+**. Lingkup: semua halaman publik, dashboard author/admin, dan login. HP mendatar (landscape) tidak diminta, jadi hanya dicek sekilas.

Dua audit kode (read-only) menemukan banyak masalah. Tapi angka lebarnya **perkiraan** dari kelas Tailwind dan ukuran font, belum dilihat di browser. Selain itu ada temuan penting:

- **Test E2E "tidak ada scroll horizontal di 375 px" kemungkinan tidak bisa mendeteksi overflow.** `e2e/mobile.spec.ts:9` membandingkan `scrollWidth` dengan `window.innerWidth`. Dengan `isMobile: true`, Chromium memperkecil (zoom out) halaman yang terlalu lebar, sehingga `innerWidth` ikut membesar. Akibatnya test tetap lulus walaupun halaman sebenarnya meluber. Test ini juga hanya mengecek di posisi paling atas halaman, sebelum di-scroll.
- Test HP hanya berjalan di 375 px. Lebar 320, 768, 1024, dan 1440 belum pernah dites, begitu juga cek aksesibilitas (axe) di HP.

Karena itu, langkah pertama adalah **memperbaiki alat ukurnya**, lalu memastikan setiap temuan benar-benar terjadi di browser. Baru setelah itu memperbaiki. Untuk ini dipakai subagent `qa-tester`.

## Pendekatan

Dikerjakan dalam **3 tahap, masing-masing satu commit**, supaya mudah direview dan di-rollback.

### Tahap 1: Alat ukur dan bukti (subagent `qa-tester`)

| # | Tugas | File |
|---|-------|------|
| 1.1 | Perbaiki cek overflow. Bandingkan dengan `document.documentElement.clientWidth` dan cek `getBoundingClientRect().right` setiap elemen. Cek dilakukan di atas halaman dan setelah scroll sampai bawah | `e2e/layout.ts` (helper), dipakai `e2e/responsive.spec.ts`; cek lama di `e2e/mobile.spec.ts` dihapus |
| 1.2 | Tambah project Playwright per ukuran: `phone-320` (320×640), `phone` (375×812, yang sudah ada), `tablet` (768×1024), `laptop` (1024×768), `wide` (1440×900). Test responsif dijalankan di semua project itu | `playwright.config.ts` (satu-satunya perubahan konfigurasi; dikerjakan Claude, bukan `qa-tester`) |
| 1.3 | Test baru di setiap ukuran untuk semua rute di `e2e/pages.ts`: tidak ada overflow; tidak ada teks judul yang terpotong atau keluar dari kontainernya; axe WCAG 2.1 AA juga dijalankan di 320 px. Tambah rute yang rawan: `/categories/organisations`, `/categories/achievements`, `/authors/6` | `e2e/responsive.spec.ts` (baru), `e2e/pages.ts` |
| 1.4 | Test interaksi di HP: menu dibuka lalu layar diperlebar melewati `md` (halaman harus tetap bisa di-scroll); bar aksi editor dan review tidak tertutup tab bar; dialog tambah author muat di 320 px | `e2e/responsive.spec.ts` |
| 1.5 | Screenshot semua halaman di 5 ukuran sebagai bukti visual sebelum perbaikan. Disimpan di scratchpad, tidak di-commit | – |

Bug yang masih terbuka dicatat di **`e2e/known-bugs.ts`** (id `R-…`, gejala, project, rute, selector). Test mewajibkan gejala bug itu masih ada dan semua masalah lain nol; saat bug diperbaiki, test gagal dengan pesan "delete the entry", jadi entrinya dihapus satu per satu di Tahap 2–3.

### Tahap 2: Halaman publik

Hanya temuan yang **terbukti** di Tahap 1 yang dikerjakan. Daftar ini adalah dugaan dari audit:

| Masalah (dugaan audit) | Ukuran | Perbaikan | File |
|---|---|---|---|
| Judul topic meluber: "Achievements" butuh ±491 px, padahal tersedia 288 px | 320–640 | Ukuran judul diperkecil di HP (`clamp` dengan batas bawah lebih kecil) dan ikon dipindah ke atas teks di bawah `sm` | `app/(public)/categories/[slug]/page.tsx` |
| Kartu "Fresh" yang miring meluber ke samping | < 1024 | Kemiringan dikurangi atau dimatikan di bawah `lg`, ditambah `overflow-x-clip` di section | `app/globals.css` (`pile-card`), `app/(public)/page.tsx` |
| ~~Header di 768–830 px berdesakan~~ (tidak terbukti, dibatalkan) | – | – | – |
| Menu HP terbuka lalu layar diperlebar: halaman terkunci tanpa tombol tutup | rotasi | Menu ditutup otomatis (scroll dibuka lagi) saat layar melewati breakpoint | `components/layout/mobile-menu.tsx` |
| "Categories" di menu HP (±333 px) meluber | 320 | Ukuran teks menu diperkecil di 320 | `mobile-menu.tsx` |
| Nama penulis di pill kartu meluber ("Firmansyah") | 320–375 | Nama boleh terputus/menyusut; teks dua baris diizinkan | `components/author/author-card.tsx` |
| h1 halaman penulis meluber ±6 px | 320 | Batas bawah `clamp` diperkecil | `app/(public)/authors/[id]/page.tsx` |
| Tumpukan kartu hero di 320 saling tumpuk dan terpotong; ruang `pt-72` tidak cukup | 320–375, tablet | Posisi diam (rest pose) dibedakan per ukuran, ruang atas disesuaikan, ukuran kartu tablet `md:w-48` | `app/(public)/page.tsx`, `hero-note-card.tsx` |
| Pill footer di 320 terpotong dan saling tumpuk; catatan "Drag the links" tertimpa | 320 | Posisi diam disesuaikan; catatan dijadikan obstacle dan disembunyikan saat statis | `components/layout/site-footer.tsx` |
| Kartu error tanpa margin samping, bayangan meluber | < 520 | Bungkus dengan `Container` | `components/ui/error-panel.tsx` |
| Layar lebar: header dan footer selebar 1280, konten 1120; kartu hero menyebar keluar kolom; hero miring menimpa section berikut | ≥ 1184 / 1440 | Header dan footer memakai `Container` (1120). Tumpukan hero dibatasi lebar maksimum. Kemiringan hero dibatasi atau diberi jarak | `site-header.tsx`, `site-footer.tsx`, `app/(public)/page.tsx`, `globals.css` |
| Ikon cari di HP membuka `/search`, padahal desain: membuka palet | HP | Ikon membuka palet ⌘K; tautan ke `/search` tetap ada di dalam palet | `site-header.tsx`, `components/search/*` |
| Target sentuh < 44 px (pill kecil, filter pencarian, filter palet, link "Filed under", byline, "Author log in") | HP/tablet | Area sentuh diperbesar tanpa mengubah tampilan (padding atau pseudo-element `before:` tak terlihat) | `category-pill.tsx`, `search-explorer.tsx`, `command-palette.tsx`, `filed-under.tsx`, `site-footer.tsx`, `not-found.tsx` |
| Teks 10 px (di bawah minimum desain 11 px) | semua | Naik ke 11 px | `logo.tsx`, `hero-note-card.tsx`, `article-row.tsx`, `article-cover.tsx`, `site-header.tsx` |
| URL panjang di isi artikel bisa meluber | semua | `overflow-wrap: anywhere` di `prose-herald` dan judul | `app/globals.css` |
| Tablet: FeatureCard dua kolom menyisakan ruang kosong; teaser penulis di About tetap 2 kolom | 768–1023 | FeatureCard dua kolom mulai `lg`; teaser About 3 kolom di `md` | `components/article/feature-card.tsx`, `app/(public)/about/page.tsx` |

### Tahap 3: Dashboard dan login

| Masalah (dugaan audit) | Ukuran | Perbaikan | File |
|---|---|---|---|
| Bar aksi editor/review (`bottom-16`) tertutup tab bar (68–83 px) | < 1024 | Tinggi tab bar dibuat tetap. Bar aksi diletakkan tepat di atasnya memakai variabel CSS yang sama, ditambah `env(safe-area-inset-bottom)` | `components/dashboard/sidebar.tsx`, `components/editor/article-editor.tsx`, `components/dashboard/review-panel.tsx`, `app/dashboard/layout.tsx` |
| Label tab bar meluber di 320 | 320 | Label satu kata yang lebih pendek di HP ("Mine", "New", "Review", "All", "Authors"), `aria-label` tetap lengkap | `sidebar.tsx` |
| Di HP tidak ada Log out, info user/role, atau jumlah pending | < 1024 | Bar atas kecil di HP: logo, chip user/role, Log out; badge pending di tab Review | `sidebar.tsx`, `app/dashboard/layout.tsx` |
| Sidebar desktop tidak sticky | ≥ 1024 | `sticky top-0 h-dvh` | `sidebar.tsx` |
| Tabel "All articles" scroll ke samping di bawah 1280 | < 1280 | Di bawah `lg`: daftar kartu. Mulai `lg`: tabel dengan kolom yang muat (`min-w` dilepas) | `components/dashboard/all-articles.tsx` |
| Baris antrean review: judul hanya ±90 px di 320 | 320–375 | Nomor dan "Review →" pindah ke baris sendiri di HP | `app/dashboard/review/page.tsx` |
| Footer dialog tambah author meluber di 320 | 320 | Tombol boleh turun baris; `max-h` dan scroll di dalam dialog | `components/dashboard/author-manager.tsx` |
| Toolbar editor tidak sticky, tombol 36 px | semua / HP | Toolbar sticky di atas area tulis; tombol 44 px di HP | `components/editor/rich-text-editor.tsx` |
| Urutan editor di < 1280: kategori dan sampul ada di bawah isi artikel (desain: judul → kategori → sampul → isi) | < 1280 | Urutan disamakan dengan desain di bawah `xl` | `article-editor.tsx` |
| Target sentuh kecil: filter "My articles", tombol pilih file, input alt, link kembali; tombol kartu author tertimpa `min-h-11` | HP | Diperbesar ke 44 px; ukuran tombol kartu author dibereskan | `my-articles.tsx`, `article-editor.tsx`, `review/[id]/page.tsx`, `login/page.tsx`, `author-manager.tsx` |
| Teks bisa terpotong saat keyboard terbuka | HP | `scroll-padding-bottom` setinggi bar | `app/globals.css` |
| Sampul di halaman review buram di ≥ 1024 (`sizes` terlalu kecil) | ≥ 1024 | `sizes` disesuaikan | `app/dashboard/review/[id]/page.tsx` |

## Keputusan saya (bisa diubah user)

- ~~Hamburger dipakai sampai 1024 px~~ **Dibatalkan (user, 2026-10-22):** header terbukti tidak meluber di 768–1024; test penjaga tetap ada.
- Log out di HP lewat **bar atas kecil**, bukan tab keenam.
- "All articles" di HP dan tablet berupa **kartu**, bukan tabel yang di-scroll.
- Target sentuh diperbesar **tanpa mengubah tampilan** (area sentuh tak terlihat), kecuali di tempat yang memang terlalu kecil secara visual.
- Desain (`docs/design.md`) diperbarui untuk setiap perubahan aturan: breakpoint header, kartu tablet, teks minimum 11 px, dashboard HP.

## Yang dipakai ulang

- `Container` (`components/layout/container.tsx`): lebar 1120 px dan gutter sesuai desain, dipakai untuk header, footer, dan panel error.
- `Button` (`components/ui/button.tsx`): sudah `min-h-11`.
- `PhysicsPile` (`components/physics/physics-pile.tsx`): `rest` per item dan `className` per ukuran (`max-sm:hidden`) sudah didukung, jadi rest pose per ukuran cukup lewat data.
- `seeded`, `canAnimate` (`lib/motion.ts`); daftar rute `e2e/pages.ts`; helper axe `e2e/axe.ts` (dipakai `smoke.spec.ts` dan `responsive.spec.ts`).

## Verifikasi

1. `npm test -- --run`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
2. `npm run test:e2e` di semua project ukuran (320, 375, 768, 1024, 1440, ditambah desktop 1280). Semua test lulus dan `e2e/known-bugs.ts` kosong, kecuali entri yang sengaja ditunda dan dicatat.
3. Screenshot sebelum/sesudah per halaman di 5 ukuran, dibandingkan oleh Claude, lalu dirangkum untuk user (gambar dipilih yang paling berubah).
4. Lighthouse mobile beranda, artikel, dan authors tidak memburuk dibanding hasil 2026-10-21 (font). Pengukuran memakai mode headless yang tidak memunculkan jendela; kalau perlu jendela, user diberi tahu dulu.
5. `qa-tester` dijalankan ulang di akhir (alur HP dan tablet), lalu `code-reviewer` paling akhir.
6. Plan diperbarui dan dirapikan. Commit dan push per tahap, setelah user mengonfirmasi.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan dan keputusan di atas | User | – | ✅ |
| 2 | Tahap 1: alat ukur, test, dan screenshot bukti | Claude + `qa-tester` | `playwright.config.ts`, `e2e/layout.ts`, `e2e/known-bugs.ts`, `e2e/axe.ts`, `e2e/responsive.spec.ts` (baru), `e2e/mobile.spec.ts`, `e2e/pages.ts`, `e2e/smoke.spec.ts` | ✅ |
| 3 | Laporan bukti: daftar masalah yang benar terjadi, dengan gambar | Claude → User | – | ✅ 2026-10-22 |
| 4 | Tahap 2: perbaikan halaman publik + design.md | Claude | lihat bagian "Hasil Tahap 2" | ✅ |
| 5 | Tahap 3: perbaikan dashboard dan login + design.md | Claude | lihat tabel Tahap 3 | Belum |
| 6 | Verifikasi lengkap, `qa-tester`, `code-reviewer` | Claude | – | Belum |
| 7 | Commit + push per tahap setelah konfirmasi | Claude | – | Belum |

Perkiraan: Tahap 1 setengah hari, Tahap 2 satu hari, Tahap 3 satu hari. Jadwal Kamis–Jumat (QA test tidak stabil, clean-code dashboard, deploy) bergeser; deploy tetap bisa Jumat setelah Tahap 2.

## Hasil Tahap 1 (2026-10-22)

Diukur di browser (Edge) pada 320, 375, 768, 1024, 1280 dan 1440 px, 22 rute (termasuk dua 404). **23 dari 25 dugaan terbukti** (sebagian hanya sebagian), **2 tidak terbukti**, 1 belum bisa dites di browser (kartu error), **1 temuan baru yang penting** (`R-AUTHOR-BIO`) plus 2 catatan kecil (halaman HP ikut diperkecil akibat overflow; kartu hero sedikit di bawah header sticky). Bug terbuka tercatat di `e2e/known-bugs.ts`; suite: **481 lulus, 270 dilewati (test khusus ukuran), 0 gagal tak terduga, 0 flaky**, 2× berturut-turut, test sensitif waktu diulang 5×. axe WCAG 2.1 AA di 320: 0 pelanggaran.

| Kelompok | Terbukti (angka utama) |
|----------|------------------------|
| **Paling parah** | Judul topic meluber: lebar 411–507 px di layar 320 (tersedia 288). Akibatnya **seluruh halaman diperkecil (zoom out)** oleh browser HP; ini juga sebab test lama selalu lulus. Juga keluar kolom 34–68 px di 1280/1440 (`R-CAT-H1`) |
| Beranda | Kartu "Fresh" membuat halaman lebih lebar 25–34 px di < 1024 (`R-HOME-FRESH`); hero miring menimpa section berikut 8–84 px di ≥ 768 (`R-HERO-TILT`); kartu hero diam terpotong di tepi dan menyebar keluar kolom di 1440 (`R-HERO-REST`) |
| Navigasi | Menu HP: halaman terkunci setelah layar diperlebar (`R-MENU-RESIZE`), "Categories" meluber di 320 (`R-MENU-320`); ikon cari ke `/search`, bukan palet (`R-SEARCH-ICON`); header/footer tidak sejajar kolom konten di ≥ 1280 (`R-WIDE-ALIGN`); pill footer bertumpuk dan menimpa catatan "Drag the links" (`R-FOOTER-PILLS`) |
| Penulis | Nama di pill (`R-AUTHOR-PILL`, hanya 320), h1 `/authors/6` (`R-AUTHOR-H1`), **baru:** bio sisi belakang kartu keluar kartu sampai 165 px (`R-AUTHOR-BIO`) |
| Isi dan teks | URL panjang di artikel meluber (`R-PROSE-URL`); teks 10 px (`R-TEXT-10PX`); teaser About 2 kolom di tablet (`R-ABOUT-TEASER`) |
| Dashboard | Bar aksi tertutup tab bar 19 px (`R-DASH-BAR`); label tab dua baris (`R-TAB-LABELS`); tidak ada Log out di HP/tablet (`R-DASH-LOGOUT`); sidebar tidak sticky (`R-SIDEBAR-STICKY`); tabel scroll ke samping sampai ±1060 px (`R-TABLE`); judul antrean 81 px di 320 (`R-QUEUE-TITLE`); dialog Add author meluber di 320 (`R-DIALOG-320`); toolbar tidak sticky (`R-EDITOR-TOOLBAR`) dan tombolnya 36 px di HP (`R-EDITOR-TOOLBAR-44`); urutan editor (`R-EDITOR-ORDER`); sampul review buram (`R-REVIEW-COVER`) |
| Target sentuh < 44 px | Pill kecil 32 px, filter, link marquee 24 px, byline, "Author log in" 17 px, link kembali 15 px, tombol toolbar 36 px (daftar lengkap per halaman di laporan QA) |

| Tidak terbukti | Akibat untuk plan |
|----------------|-------------------|
| Header berdesakan/overflow di 768–830 | Dicek bertahap dari 768 sampai 1016 px: tidak overflow. **Usul: perubahan "hamburger sampai 1024" dibatalkan**; test penjaga tetap ada |
| Tombol kartu author tertimpa `min-h-11` | Tingginya justru 44 px (benar). Tidak diubah |
| Kartu error tanpa margin (**belum bisa dites**, bukan "tidak terbukti") | Hanya bisa disimulasikan (error tidak bisa dipicu di build produksi); tetap diperbaiki karena murah |

Belum bisa dites: Safari/Firefox, perangkat asli, keyboard virtual, landscape.

Catatan alat ukur: laporan target sentuh hanya berupa anotasi (tidak pernah membuat test gagal). Review `code-reviewer` menemukan bahwa penanda `test.fail()` per halaman menyembunyikan regresi baru di halaman yang sama;. Diganti dengan daftar `KNOWN_BUGS` per gejala (lihat bagian berikut).

## Review Tahap 1

| Putaran | Hasil | Tindakan |
|---------|-------|----------|
| 1 | Tidak ada Kritis/Tinggi. Sedang: `test.fail()` per halaman menyembunyikan regresi baru; test bug lulus pada error apa pun; scan overflow berhenti setelah 40 langkah. Rendah: logika ancestor pemotong, `facingAway`, race resize menu, rect judul ikut stiker, keterbacaan | `qa-tester` memperbaiki semuanya: registry `KNOWN_BUGS` per gejala (tanpa `test.fail`), gejala spesifik wajib terbukti, scan sampai bawah (`reachedBottom`), helper axe bersama. Eksperimen: elemen 500 px yang disisipkan membuat test beranda **gagal**; bug yang "diperbaiki" membuat test gagal dengan "delete the entry"; kontrol lulus |
| 2 | Perbaikan terverifikasi, tidak ada jalur lulus palsu yang berdampak. Sedang: plan tidak sesuai kode. Rendah: kelonggaran 3 px `docOverflow`, judul yang diputar bisa terlewat, `known` teks kecil hanya dari rute terakhir | Plan diperbarui (file ini). Judul yang diputar tetap dicek; `known` digabung dari ketiga rute; batasan kelonggaran dicatat sebagai komentar. Test yang terkena lulus di 6 ukuran |

## Hasil Tahap 2 (2026-10-23)

15 bug halaman publik diperbaiki dan dihapus dari `e2e/known-bugs.ts`; test-nya kini menuntut perilaku yang benar di 6 ukuran.

| Bug | Perbaikan | File |
|-----|-----------|------|
| R-CAT-H1 | Judul topic `clamp(28px, 8.4vw, 104px)`, ikon di atas nama di bawah `sm`. Halaman HP tidak lagi diperkecil (screenshot 320: 507 px → 320 px) | `app/(public)/categories/[slug]/page.tsx` |
| R-HOME-FRESH | Di bawah `lg` kemiringan kartu "Fresh" hanya seperlima (≤ 3°) | `app/globals.css`, `app/(public)/page.tsx` |
| R-HERO-REST | Tumpukan hero dibatasi kolom 1120 px; posisi diam di-clamp dengan `--rest-pad` per item | `app/(public)/page.tsx`, `app/globals.css` |
| R-HERO-TILT | Poros kemiringan di pojok kanan bawah, hero tidak turun menimpa section berikut | `app/globals.css` |
| R-FOOTER-PILLS | Pill diam dalam dua baris berselang, di-clamp per lebar pill; catatan "Drag the links" dipindah ke bawah wordmark dan jadi obstacle | `components/layout/site-footer.tsx` |
| R-WIDE-ALIGN | Header dan footer memakai kolom 1120 px | `site-header.tsx`, `site-footer.tsx` |
| R-SEARCH-ICON | Ikon cari di HP membuka palet (tetap link `/search` tanpa JS); palet punya link "All results →"; petunjuk keyboard disembunyikan di layar sentuh | `command-palette-trigger.tsx`, `command-palette.tsx`, `site-header.tsx` |
| R-MENU-320, R-MENU-RESIZE | Teks menu `clamp(2.25rem, 12vw, 3rem)`; menu menutup sendiri saat layar melewati `md` | `components/layout/mobile-menu.tsx` |
| R-AUTHOR-PILL, R-AUTHOR-BIO | Kartu penulis 1 kolom di bawah 360 px; bio di sisi belakang mulai `sm` | `author-card.tsx`, `authors/page.tsx`, `about/page.tsx` |
| R-AUTHOR-H1 | `clamp(36px, 7vw, 80px)` | `app/(public)/authors/[id]/page.tsx` |
| R-TEXT-10PX | Semua `text-[10px]` → `text-[11px]` | logo, hero card, kredit foto, Most read, header, tab dashboard |
| R-PROSE-URL | `overflow-wrap: anywhere` di `prose-herald` | `app/globals.css` |
| R-ABOUT-TEASER | Teaser 3 kolom di tablet, kartu ke-4 mulai `lg` | `app/(public)/about/page.tsx` |
| Kartu error | Margin samping di HP | `components/ui/error-panel.tsx` |
| Target sentuh | Utility `tap-target` (area sentuh 44×44 tak terlihat) di pill kecil, filter cari dan palet, "Filed under", byline, "Author log in" | `app/globals.css` + komponen terkait |

Temuan saat mengecek screenshot (tidak tertangkap test) dan perbaikannya:
- Logo di 320 px turun dua baris dan teks kecilnya terpotong (efek 10 → 11 px): logo `whitespace-nowrap`, mark 36 px di bawah 360 px.
- Perbaikan logo itu membuat header **meluber 39 px di 768 px** (tertangkap test overflow tablet): jarak nav dan kolom cari dirapatkan di `md`–`lg`.
- Pill footer statis di 320 saling tumpuk sampai tak terbaca: dua baris berselang.

Verifikasi: unit 93 ✅; lint, tsc, build ✅; E2E penuh **481 lulus, 0 gagal** (6 ukuran). Catatan: satu run sempat memakai build lama karena build gagal saat server lama memegang `.next`; diulang setelah port dikosongkan. Screenshot sesudah: `scratchpad/responsive-after/`. design.md diperbarui (layout 2.4, motion, header, kartu penulis, palet, footer, aksesibilitas).

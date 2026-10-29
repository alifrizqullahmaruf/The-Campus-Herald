# Plan: Jalankan di lokal dan cek semua animasi

**Tanggal:** 2026-10-29
**Status:** ✅ Selesai, terverifikasi, di-commit dan di-push

## Tujuan

User minta app dijalankan di lokal dan dicek apakah ada animasi yang perlu diperbaiki. App dijalankan sebagai build production di http://localhost:3210 (port 3000 dipakai WNDR). Semua animasi dicek di 320–1920 px dan dengan gerak dikurangi; lima temuan (A–E) dilaporkan, dan user memilih semuanya diperbaiki (B dengan mengurangi item).

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Setujui plan | User | – | ✅ |
| 2 | Build + `next start -p 3210`, baseline `e2e/motion.spec.ts` | Claude | – | ✅ |
| 3 | Cek setiap animasi di 320–1920 px dan dengan gerak dikurangi | Claude | – | ✅ |
| 4 | Laporan temuan, user memilih yang diperbaiki | Claude / User | file ini | ✅ Semua (A–E); B dengan mengurangi item |
| 5 | A: obstacle diukur setelah animasi masuknya selesai | Claude | `lib/motion.ts`, `components/physics/physics-pile.tsx` | ✅ |
| 6 | B: item hero dikurangi di layar kecil | Claude | `app/(public)/page.tsx` | ✅ |
| 7 | C: rentang garis progres untuk artikel pendek dan panjang | Claude | `app/globals.css` | ✅ |
| 8 | D: fallback `/search` memesan tinggi hasil | Claude | `app/(public)/search/page.tsx` | ✅ |
| 9 | E: pile berhenti (Matter.js sleeping) | Claude | `components/physics/physics-pile.tsx` | ✅ |
| 10 | Test dan dokumentasi | Claude | `__tests__/motion-images.test.tsx`, `e2e/motion.spec.ts`, `docs/design.md`, `CLAUDE.md` | ✅ |
| 11 | Verifikasi, `code-reviewer` sekali, perbaikan temuan review | Claude | `components/physics/physics-pile.tsx`, `e2e/motion.spec.ts` | ✅ |
| 12 | Hapus worktree lama `.claude/worktrees/next-16-4-3` dan branch-nya (disetujui user) | Claude | – | ✅ |
| 13 | Commit + push (dikonfirmasi user) | User / Claude | – | ✅ |

## Temuan dan perbaikan

| # | Tingkat | Temuan (sebelum) | Penyebab | Perbaikan | Sesudah |
|---|---------|------------------|----------|-----------|---------|
| A | Sedang | Kartu hero mendarat menimpa judul di semua ukuran: di 1280 px setengah atas "The campus," tertutup, stiker "5 TOPICS" menutupi judul 32–51%. | Obstacle diukur (t≈220 ms) saat `line-rise` masih berjalan: 22–106 px lebih rendah dari teks. | `entranceDone()` (`lib/motion.ts`): pile menunggu animasi obstacle selesai (maks. 1 s) sebelum membangun dunia. | 0% tumpang tindih di 21 lebar (320–1920 px). |
| B | Sedang | Item menumpuk di belakang header: 375 px "5 TOPICS" tersembunyi; 320 px 5 dari 6 item di atas hero, 1 kartu tidak bisa di-tap; 768 px 2 item sebagian tersembunyi. | Di bawah `lg` judul selebar layar; ruang di atasnya (±375×288 px di HP) tidak cukup. | Kartu hero: 6 dari `lg`, 4 di tablet (`max-lg:hidden`), 2 di HP (`max-sm:hidden`); kedua stiker tetap. | Tidak ada item tersembunyi atau tidak bisa di-tap di 21 lebar; paling jauh satu sudut kartu 6–10 px menyentuh garis header di 375–393 px. |
| C | Sedang | Garis progres kosong selama membaca di tablet/desktop, lalu penuh dalam 1–265 px di akhir. | `contain` terbalik untuk isi artikel yang lebih pendek dari layar (6/6 artikel di 768 dan 1440 px). | `animation-range: entry-crossing 0% entry-crossing 100%`: bagian isi yang sudah masuk layar. | Benar di 375, 1280, 1440 px (E2E). Di HP garis sudah sedikit terisi saat isi artikel terlihat di layar pertama. |
| D | Sedang | `/search` desktop: footer melompat, CLS 0,24–0,33 (hard load, cache hangat, ±50% run); pill footer bisa menggantung di atas hasil. | Fallback Suspense `h-40` jauh lebih pendek dari hasil. | Fallback `min-h-svh` (hasil selalu mendaftar semua artikel). | CLS 0 di 36 run (1280, 1440, 375; cache dingin dan hangat). |
| E | Rendah | Pile masih merayap 10–20 s setelah load (mis. 45 px di 1440 px). | Item terjepit seperti baji didorong pelan oleh solver. | Matter.js sleeping; semua benda dibangunkan saat drag (setiap gerak pointer dan saat dilepas) dan saat resize. | Tidak ada gerakan setelah 8 s di 320, 375, 768, 1024, 1280, 1440 px. |

**Tidak bermasalah:** logo wobble; page fade (tepat satu fade 200 ms per navigasi, publik/login/dashboard dan antar-area); topic rows (36 px/s, tanpa tersendat); `hero-tilt`; grid dari tumpukan; ilustrasi About; angka About (berhenti tepat di nilai akhir); judul naik (tanpa huruf terpotong); kartu penulis berbalik; filter Search; pill footer; tanpa overflow horizontal atau console error; gerak dikurangi langsung di posisi akhir.

## Perubahan dari plan

- **B: 2 kartu di HP, bukan 3.** Physics-nya kaotis: 3 kartu selalu butuh lapis kedua (±272 px dari ruang 288 px), dan di beberapa lebar (360, 375, 500 px) item kembali ke belakang header. Hanya 2 kartu + 2 stiker yang bersih di 11 lebar HP.
- **E butuh dua percobaan yang dibatalkan sebelum sleeping:**
  - Friksi benda statik 0.5 tidak berpengaruh, karena Matter.js `Body.setStatic` selalu menyetel friksi statik ke 1.
  - `positionIterations`/`velocityIterations` lebih tinggi dan `frictionStatic: 1` hanya memindahkan rayapan ke ukuran lain.
- **`code-reviewer`:** 1 Sedang dan 2 Rendah, semuanya diperbaiki:
  - **Sedang:** item yang muncul atau hilang saat melewati breakpoint tidak disinkronkan ke simulasi. Contoh: jendela 960 → 1280 px, atau HP diputar. Dua kartu tertahan di pojok tanpa physics, dan body kartu yang disembunyikan tertinggal di simulasi. Masalah ini sudah ada di 640 px, tapi B menambah breakpoint di 1024 px. Perbaikannya `syncItems()`: item yang tetap mempertahankan posisi, item baru jatuh dari atas, dan body item yang disembunyikan dihapus. Ada test E2E baru.
  - **Rendah:** `wakeAll()` juga dipanggil saat kartu dilepas.
  - **Rendah:** test hero dilewati, bukan gagal, kalau Matter.js mulai setelah fallback `static` di mesin yang sibuk.
- **Test E2E resize** sempat gagal karena test-nya sendiri: `getByRole` tidak menghitung stiker `aria-hidden`. Sudah diganti ke selektor CSS.

## File yang berubah

- `components/physics/physics-pile.tsx`: menunggu `entranceDone`, sleeping + `wakeAll`, `createItem`/`dropStart` (urutan pembuatan body awal tidak berubah), `syncItems` saat resize.
- `lib/motion.ts`: `entranceDone()`.
- `app/(public)/page.tsx`: jumlah kartu hero per ukuran.
- `app/globals.css`: rentang `read-progress`.
- `app/(public)/search/page.tsx`: fallback `min-h-svh`.
- `__tests__/motion-images.test.tsx`: 2 test `entranceDone`.
- `e2e/motion.spec.ts`:
  - Hero bebas judul dan header di 375, 768, 1280 px.
  - Kartu ikut pile saat resize.
  - Garis progres di 375, 1280, 1440 px.
- `docs/design.md`, `CLAUDE.md`: perilaku baru (jumlah kartu, sleeping, obstacle, garis progres).

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 98/98 (12 file) |
| `npx tsc --noEmit` | ✅ |
| `npm run lint` | ✅ bersih setelah worktree lama dihapus (sebelumnya 412 error, semuanya dari `.claude/worktrees/next-16-4-3`) |
| `npm run build` | ✅ tanpa peringatan |
| `npm run test:e2e` (config proyek, port 3200) | ✅ 491 lolos, 0 gagal, 270 dilewati sesuai ukuran layar (sebelumnya 484 + 7 test baru) |
| Sweep animasi (11 halaman, 375/1280 px, gerak normal dan dikurangi) | ✅ CLS 0, tanpa overflow, animasi macet, atau console error |
| Hero di 21 lebar (320–1920 px) | ✅ tidak menimpa judul; tidak ada item tersembunyi; semua bisa di-tap |
| Resize 960↔1280, 375↔812 px | ✅ semua item yang terlihat digerakkan physics; body item tersembunyi dihapus |
| `code-reviewer` | 1 Sedang, 2 Rendah, semuanya diperbaiki (lihat di atas) |

## Tindak lanjut

- Pose diam hero di HP (gerak dikurangi/tanpa JS): kedua kartu sangat tumpang tindih. Sama seperti sebelumnya, tapi bisa diberi pose khusus HP (`--rest-left-sm`) seperti pill footer.
- Physics hero kaotis: setiap perubahan item hero atau setelan Matter.js harus diukur ulang di 320–1023 px (tercatat di `CLAUDE.md`).

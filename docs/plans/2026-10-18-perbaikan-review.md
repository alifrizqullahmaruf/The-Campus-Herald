# Plan: Perbaikan temuan code-reviewer dan catatan keamanan

**Tanggal:** 2026-10-18
**Status:** ✅ Selesai (commit `7932033`)

## Tujuan

Memperbaiki 5 temuan `code-reviewer` pada commit `2b3bdb6` (lihat [plan subagent](2026-10-18-subagent-code-reviewer.md)) dan 2 catatan keamanan, sebelum masuk Fase 2.

## Hasil per temuan

| # | Masalah | Terbukti di kode lama? | Perbaikan |
|---|---------|------------------------|-----------|
| 1 | **Tinggi:** baris pill topic tidak bisa di-drag dengan mouse (drag link bawaan browser) | **Tidak** di Edge: test baru (baris bergeser ±150 px) sudah lulus di kode lama | Tetap dipasang sebagai pengaman untuk browser lain: `dragstart` dibatalkan di baris topic dan di tumpukan fisika |
| 2 | **Sedang:** `touch-none` dan `cursor: grab` aktif juga di mode statis | Ya (`touch-action: none` di reduced motion) | `touch-action: none` + `cursor: grab` hanya untuk `[data-physics="running"]` di CSS; kelas `touch-none` dihapus |
| 3 | **Sedang:** kartu hero tersembunyi terlalu lama di HP lambat | – (analisis) | `requestIdleCallback` diberi `timeout: 800`; fallback statis 2,5 s (untuk `start="view"` baru dihitung saat terlihat). Kalau Matter.js datang setelah fallback, fisika tetap jalan **mulai dari posisi diam** (kartu tidak menghilang lalu jatuh lagi) |
| 4 | **Rendah:** setelah lemparan sentuh, Enter berikutnya tertelan | Ya, di kartu hero dan baris topic | `suppressClick` direset dengan `setTimeout(0)` setelah `pointerup` |
| 5 | **Rendah:** drag meleset saat hero miring | Ya (meleset 21 px) | **Opsi B (pilihan user):** hero tetap miring. Tiga probe tak terlihat di (0,0), (100,0), (0,100) menunjukkan transform kontainer di layar; `toLocal()` di `lib/motion.ts` menghitung balik posisi pointer. Ukuran pakai `offsetWidth/Height`, bukan bounding box. Dipakai juga untuk posisi awal body dan obstacle |
| 6 | **Keamanan:** sanitasi HTML artikel baru tercatat di Fase 5 | – | Roadmap Fase 4: sanitasi HTML di server sebelum disimpan jadi **wajib** (+ test XSS); dicatat juga di CLAUDE.md dan komentar `article-body.tsx` |
| 7 | **Keamanan:** URL kredit Unsplash dipakai tanpa dicek | – | `isHttpsUrl()` di `lib/images.ts`: `ArticleCover` hanya menautkan link `https:` (selain itu tampil sebagai teks). `fetch-covers` hanya memilih foto yang semua link-nya di host Unsplash yang benar (mencegah Access Key terkirim ke host lain lewat `download_location`) |

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Konfirmasi plan + pilih opsi temuan 5 | User | – | ✅ (opsi B) |
| 2 | Perbaikan 1–5 | Claude | `components/physics/physics-pile.tsx`, `components/home/topic-rows.tsx`, `app/globals.css`, `lib/motion.ts` | ✅ |
| 3 | Perbaikan 6–7 | Claude | `docs/plans/2026-10-15-roadmap.md`, `CLAUDE.md`, `components/article/article-body.tsx`, `lib/images.ts`, `components/article/article-cover.tsx`, `scripts/fetch-covers.mjs` | ✅ |
| 4 | Test unit + E2E baru (ditulis dulu, dijalankan di kode lama) | Claude | `__tests__/motion-images.test.tsx`, `e2e/motion.spec.ts` | ✅ |
| 5 | Verifikasi | Claude | – | ✅ |
| 6 | `code-reviewer` pada perubahan ini + perbaiki temuannya | Claude | – | ✅ |
| 7 | Commit + push | Claude | – | ✅ |

## Review `code-reviewer`

Tidak ada temuan Kritis/Tinggi. Tiga temuan, semua diperbaiki:

| Tingkat | Temuan | Perbaikan |
|---------|--------|-----------|
| Sedang | Fallback 2,5 s dihitung sejak mount, sedangkan `load` menunggu foto sampul; di koneksi lambat fisika hero tidak pernah jalan, dan E2E bergantung pada jaringan | Boot yang terlambat tetap menjalankan fisika dari posisi diam (opsi a reviewer). Opsi b (tidak menunggu `load`) ditolak karena akan menyaingi LCP. E2E baru menahan chunk matter-js 3,5 s: statis dulu, lalu `running` |
| Rendah | Test hero miring bisa lulus palsu karena kemiringannya kecil (±1,4°) | Scroll 400 px dan assert kemiringan > 2° |
| Rendah | `fetch-covers` melewati artikel kalau hasil pertama gagal cek host | Cek host dipindah ke dalam pencarian kandidat |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| Baseline (test baru di kode lama) | 4 gagal sesuai dugaan: touch-action statis, Enter setelah drag sentuh (hero + baris), drag miring meleset 21 px. Test drag baris lulus (temuan 1 tidak terbukti) |
| `npm test -- --run` | ✅ 88 lulus (baru: `toLocal` lurus dan miring 6°, probe, `isHttpsUrl` + kredit `javascript:` jadi teks) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | ✅ |
| `npm run test:e2e` | ✅ 74 lulus, stabil 3× berturut-turut (baru: baris bergeser saat di-drag, drag mengikuti pointer saat hero miring, Enter setelah drag sentuh di hero dan baris, reduced motion bisa di-scroll, Matter.js terlambat) |

Catatan: test hero miring sempat gagal sesekali saat suite berjalan paralel karena kartu diambil sebelum benar-benar diam. Sekarang test menunggu kartu diam dulu.

## Tindak lanjut

- Perilaku di Safari/Firefox (urutan `click` vs `setTimeout(0)`, drag link) belum dites; Playwright di proyek ini hanya memakai Edge.
- Opsional: allowlist perintah read-only untuk `code-reviewer` di `.claude/settings.json`.
- Masih menunggu user: Unsplash Access Key, keputusan font/LCP, deploy Vercel.

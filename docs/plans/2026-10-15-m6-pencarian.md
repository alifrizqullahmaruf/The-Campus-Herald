# Plan M6: Pencarian

**Tanggal:** 2026-10-15
**Status:** ✅ Selesai
**Bagian dari:** [roadmap](2026-10-15-roadmap.md), Fase 1

## Tujuan

Halaman `/search` dan palet ⌘K / Ctrl+K sesuai design.md bagian 3 (Search) dan 4 (Search). Kebutuhan fungsional: pembaca bisa mencari artikel.

## Tugas

| # | Tugas | Siapa | File | Status |
|---|-------|-------|------|--------|
| 1 | Satu aturan pencocokan untuk server dan browser (`matchesQuery`: judul + ringkasan, tidak peka huruf besar); `searchArticles` memakainya | Claude | `lib/search.ts`, `lib/data/articles.ts` | ✅ |
| 2 | API `GET /api/search?q=&category=` (JSON ringkas, tanpa body) untuk palet. Di Fase 2 isinya menjadi query database | Claude | `app/api/search/route.ts` | ✅ |
| 3 | `/search`: judul, kotak cari besar + filter kategori, grid kartu (yang tidak cocok memudar 30% dan disembunyikan dari pembaca layar), jumlah hasil `aria-live`, URL ikut diperbarui (`?q=&category=`) agar bisa dibagikan. `searchParams` dibaca di dalam `<Suspense>` (Cache Components) | Claude | `app/(public)/search/page.tsx`, `components/search/search-explorer.tsx` | ✅ |
| 4 | Palet ⌘K: listener kecil di layout, UI dimuat saat pertama dibuka (`React.lazy`). `<dialog>` modal (fokus terkunci, Esc menutup, fokus kembali), header kuning + chip Esc, filter pill, jumlah, hasil ringkas, ↑↓ untuk pindah, ↵ untuk membuka, baris terpilih berwarna kategori, pola combobox ARIA | Claude | `components/search/command-palette*.tsx`, `app/(public)/layout.tsx` | ✅ |
| 5 | Chip ⌘K di header menjadi tombol pembuka palet | Claude | `components/layout/site-header.tsx` | ✅ |
| 6 | Test: pencocokan, API, explorer, palet | Claude | `__tests__/search.test.tsx` | ✅ |
| 7 | Verifikasi + commit + push | Claude | – | ✅ |

## Hasil verifikasi

| Cek | Hasil |
|-----|-------|
| `npm test -- --run` | ✅ 50 test lulus (8 baru: aturan cocok, API (tanpa body, kosong = 6 terbaru, filter kategori), explorer (pudar + tersembunyi dari pembaca layar, URL ikut berubah, filter toggle), palet (fokus awal, ↑↓, ↵ membuka, query + kategori ke API)) |
| lint, tsc, build | ✅ `/search` Partial Prerender (judul statis, hasil di-stream), `/api/search` dinamis |
| API di server produksi | ✅ `GET /api/search?q=music` → 1 hasil JSON ringkas |
| Tampilan 1280px | ✅ `/search?q=the&category=events`: 3 dari 18 cocok, sisanya pudar abu-abu |

## Catatan

- **Palet ⌘K belum dicek lewat screenshot**, karena perlu tombol keyboard yang tidak bisa dikirim ke screenshot headless. Perilakunya diuji lewat test komponen. Pengecekan di browser dilakukan di M10 (Playwright).
- **Header:** chip "⌘K" di kotak cari sekarang berupa tombol pembuka palet.
